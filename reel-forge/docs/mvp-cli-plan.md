# ReelForge MVP — CLI-First Local Rendering

> **Goal**: Get the first 10 high-quality expert-audio reels rendered locally via CLI.
> Validate that Remotion can produce professional, upload-ready reels before building any infrastructure.

> **Non-goals for this phase**: No web UI, no server, no auth, no queue, no S3, no Docker.
> Pure Remotion + local files + CLI scripts.

---

## What We're Building

A standalone Remotion project with:
- **2 polished templates** that accept expert audio + metadata as props
- A **CLI script** that runs STT → LLM → render in one shot
- **10 sample renders** to prove quality and validate the pipeline

```
Audio file (local)
    ↓
CLI script (Python + Node)
    ↓  Step 1: Transcribe via faster-whisper (local, no API key)
    ↓  Step 2: Generate metadata via Ollama gemma4:e4b (local LLM)
    ↓  Step 3: Write props JSON
    ↓
npx remotion render --props=props.json
    ↓
out/video-001.mp4  ← upload-ready reel
```

> **Everything runs locally** — no cloud API keys needed for STT or LLM.
> Same stack as [hindi_translate.py](file:///Users/ankur/dev/docx/ppt/browser-use-demo/hindi_translate.py).

---

## Project Structure

```
reel-forge/
├── docs/
│   ├── hld.md                    # Full HLD (saved)
│   └── mvp-cli-plan.md           # This file
│
├── src/
│   ├── Root.tsx                  # Remotion root — registers all compositions
│   ├── global-schema.ts          # Shared Zod schema (global props)
│   │
│   ├── templates/
│   │   ├── hook-quote/
│   │   │   ├── index.tsx         # Template 1: Hook → Audio → Quote → CTA
│   │   │   ├── schema.ts         # Template-specific Zod schema
│   │   │   ├── HookScene.tsx     # Scene: bold hook text intro (3s)
│   │   │   ├── AudioScene.tsx    # Scene: waveform + expert name while audio plays
│   │   │   ├── QuoteScene.tsx    # Scene: key quote highlight
│   │   │   ├── CtaScene.tsx      # Scene: call-to-action outro
│   │   │   └── styles.ts        # CSS-in-JS / style constants
│   │   │
│   │   ├── minimal-podcast/
│   │   │   ├── index.tsx         # Template 2: Dark, waveform-centric, quote rotation
│   │   │   ├── schema.ts
│   │   │   ├── WaveformScene.tsx
│   │   │   ├── QuoteOverlay.tsx
│   │   │   └── styles.ts
│   │   │
│   │   └── _shared/
│   │       ├── SafeZone.tsx      # 900×1400 safe area guide (dev overlay)
│   │       ├── AudioWaveform.tsx  # Animated waveform visualizer
│   │       ├── ProgressBar.tsx   # Bottom progress indicator
│   │       ├── ExpertBadge.tsx   # Name + specialty chip
│   │       └── fonts.ts         # Google Fonts loading (Inter, Playfair)
│   │
│   └── lib/
│       ├── audio-utils.ts       # Get duration, probe format
│       └── color-utils.ts       # Palette generation helpers
│
├── cli/
│   ├── transcribe.py            # faster-whisper STT — audio → transcript + word timestamps
│   ├── generate-meta.py         # Ollama gemma4:e4b — transcript → hook, scenes, CTA
│   ├── render.ts                # Main CLI entry: orchestrate STT → LLM → render
│   ├── pipeline.py              # Python orchestrator: transcribe + generate-meta + write props.json
│   └── sample-inputs/           # 10 sample audio files for testing
│       ├── input-001.json       # { audioFile, expertName, domain, ... }
│       ├── input-002.json
│       └── ...
│
├── public/                      # Remotion static assets
│   ├── fonts/
│   └── backgrounds/             # Gradient PNGs, subtle patterns
│
├── out/                         # Rendered MP4s (gitignored)
│
├── remotion.config.ts
├── package.json
├── tsconfig.json
└── .env                         # OLLAMA_BASE_URL (default: http://localhost:11434)
```

---

## Template 1: `hook-quote`

**Vibe**: Bold, energetic, high-contrast. Designed for health/wellness/advice experts.

### Scene Breakdown (for a 60s audio → 60s video)

| Scene | Frames | Duration | Visual |
|---|---|---|---|
| **Hook** | 0–90 | 3s | Full-screen gradient bg. Large serif text fades in with spring animation. No audio yet. |
| **Expert Intro** | 90–150 | 2s | Expert name + specialty badge slides up. Audio begins playing. |
| **Main Audio** | 150–1650 | 50s | Animated waveform visualizer centered. Subtle floating particles bg. Expert badge in bottom-left safe zone. Progress bar at bottom. Key quotes fade in/out at scene boundaries (from LLM). |
| **CTA** | 1650–1800 | 5s | Audio fades. CTA text animates in ("Follow for more {domain} tips!"). Gradient shifts. |

### Visual Design Spec

```
┌─────────────── 1080px ───────────────┐
│                                       │
│   ┌─── Safe Zone (900×1400) ───┐     │
│   │                             │     │
│   │     "Did you know your      │     │  ← Hook text
│   │      skin regenerates       │     │    Playfair Display, 72px
│   │      every 28 days?"        │     │    White on dark gradient
│   │                             │     │
│   │                             │     │
│   │    ~~~~~~~~~~~~████~~~~~    │     │  ← Waveform visualizer
│   │    ~~~~~████████~~~~████    │     │    Accent color bars
│   │                             │     │
│   │                             │     │
│   │  ┌──────────────────┐      │     │
│   │  │ Dr. Priya Sharma  │      │     │  ← Expert badge
│   │  │ Dermatologist     │      │     │    Frosted glass card
│   │  └──────────────────┘      │     │
│   │                             │     │
│   └─────────────────────────────┘     │
│   ━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━     │  ← Progress bar
│                                1920px │
└───────────────────────────────────────┘
```

### Color Palette (default, overridable)

| Role | Value | Usage |
|---|---|---|
| `bgGradientStart` | `#0F0F23` | Dark navy |
| `bgGradientEnd` | `#1A1A3E` | Deep indigo |
| `accentColor` | `#FF6B35` | Waveform bars, progress, highlights |
| `textPrimary` | `#FFFFFF` | Hook text, expert name |
| `textSecondary` | `#B8B8D4` | Specialty, CTA |
| `glassBg` | `rgba(255,255,255,0.08)` | Expert badge backdrop |

---

## Template 2: `minimal-podcast`

**Vibe**: Clean, dark, audiophile aesthetic. Neon accent. For any expert domain.

### Scene Breakdown

| Scene | Frames | Duration | Visual |
|---|---|---|---|
| **Intro** | 0–60 | 2s | Expert name + domain text types in (typewriter effect). Neon underline. |
| **Main Audio** | 60–1680 | 54s | Centred circular waveform (radial bars). Expert name bottom. Rotating key quotes appear/disappear every ~12s with fade transitions. |
| **Outro** | 1680–1800 | 4s | Waveform contracts. CTA text. "🎧 Full episode in bio". |

### Visual Design Spec

```
┌─────────────── 1080px ───────────────┐
│                                       │
│            ┌─────────┐               │
│          ╱             ╲              │
│        ╱   ◉ circular    ╲            │  ← Radial waveform
│       │    waveform viz    │           │    Bars radiate from center
│        ╲                 ╱            │    Cyan/teal neon glow
│          ╲             ╱              │
│            └─────────┘               │
│                                       │
│     "The key to great results        │  ← Rotating quote
│      is consistency over time"       │    Inter, 36px, fade in/out
│                                       │
│                                       │
│         DR. PRIYA SHARMA             │  ← Expert name
│          Dermatologist               │    All-caps, letter-spaced
│                                       │
│   ━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━   │  ← Thin progress line
│                                1920px │
└───────────────────────────────────────┘
```

### Color Palette

| Role | Value |
|---|---|
| `bgSolid` | `#0A0A0A` |
| `accentColor` | `#00F5D4` (neon teal) |
| `textPrimary` | `#FFFFFF` |
| `textSecondary` | `#666666` |
| `glowColor` | `rgba(0, 245, 212, 0.3)` |

---

## CLI Pipeline

### `cli/render.ts` — Main Entry Point

```
Usage:
  npx tsx cli/render.ts \
    --audio ./samples/doctor-skincare.mp3 \
    --expert "Dr. Priya Sharma" \
    --specialty "Dermatologist" \
    --domain "Skincare" \
    --template hook-quote \
    --out ./out/video-001.mp4

Optional flags:
  --accent-color "#FF6B35"
  --skip-ai                  # Use manual props instead of STT+LLM
  --props ./custom-props.json  # Override all props from JSON file
  --preview                  # Open Remotion Studio instead of rendering
```

### Pipeline Steps (inside render.ts)

The TypeScript CLI calls the Python pipeline (which handles STT + LLM), reads the
resulting props JSON, and then invokes Remotion render.

```typescript
// 1. Validate inputs
const args = parseArgs(process.argv);
validateAudioFile(args.audio); // check exists, 30-120s, supported format

// 2. Run Python AI pipeline (faster-whisper → Ollama → props.json)
execSync(`python3 cli/pipeline.py \
  --audio ${args.audio} \
  --expert "${args.expert}" \
  --specialty "${args.specialty}" \
  --domain "${args.domain}" \
  --output tmp/props.json`);

// 3. Read generated props
const props = JSON.parse(fs.readFileSync('tmp/props.json', 'utf-8'));

// 4. Copy audio to public/ for Remotion (staticFile requires it)
fs.copyFileSync(args.audio, `public/audio/${path.basename(args.audio)}`);
props.audioUrl = staticFile(`audio/${path.basename(args.audio)}`);

// 5. Render via Remotion CLI
execSync(`npx remotion render src/Root.tsx ${args.template} ${args.out} --props=tmp/props.json --codec=h264`);

console.log(`✅ Rendered: ${args.out}`);
```

### `cli/transcribe.py` — faster-whisper (Local STT)

Same pattern as [hindi_translate.py](file:///Users/ankur/dev/docx/ppt/browser-use-demo/hindi_translate.py).

```python
from faster_whisper import WhisperModel
import subprocess, tempfile, os, json

# Whisper model — "small" balances speed vs accuracy.
# Options: tiny | base | small | medium | large-v2 | large-v3
WHISPER_MODEL_SIZE = "small"

def transcribe_audio(audio_path: str, model_size: str = WHISPER_MODEL_SIZE) -> dict:
    """
    Transcribe audio using faster-whisper (runs locally, no API key).
    Returns: { text, words[], duration }
    """
    # Step 1: Resample to 16kHz mono WAV via ffmpeg (optimal for Whisper)
    temp_wav = tempfile.NamedTemporaryFile(suffix="_resampled.wav", delete=False)
    temp_wav.close()
    subprocess.run(
        ["ffmpeg", "-y", "-i", audio_path, "-ar", "16000", "-ac", "1", temp_wav.name],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    # Step 2: Transcribe
    model = WhisperModel(model_size, device="auto", compute_type="auto")
    segments, info = model.transcribe(
        temp_wav.name,
        language="en",             # English for MVP (change for multi-lang)
        beam_size=5,
        word_timestamps=True,      # We need word-level timing for scene alignment
        condition_on_previous_text=False,  # Prevent hallucination loops
    )

    # Step 3: Collect results
    words = []
    full_text_parts = []
    for segment in segments:
        full_text_parts.append(segment.text.strip())
        for word in segment.words:
            words.append({
                "word": word.word.strip(),
                "start": round(word.start, 2),
                "end": round(word.end, 2),
            })

    os.unlink(temp_wav.name)  # Clean up temp file

    return {
        "text": " ".join(full_text_parts),
        "words": words,
        "duration": info.duration,
        "language": info.language,
    }
```

### `cli/generate-meta.py` — Ollama gemma4:e4b (Local LLM)

Same Ollama HTTP API pattern as [hindi_translate.py](file:///Users/ankur/dev/docx/ppt/browser-use-demo/hindi_translate.py).

```python
import requests, json, time

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma4:e4b"  # or "gemma3:12b" as fallback

def generate_video_meta(
    transcript: str,
    expert_name: str,
    specialty: str,
    domain: str,
    duration_sec: float,
    model: str = DEFAULT_MODEL,
) -> dict:
    """
    Call local Ollama to generate video metadata from transcript.
    Returns: { hookText, scenes[], ctaText, hashtags[], title }
    """
    prompt = f"""You are a viral social media content strategist.

Given an expert's audio transcript, generate metadata for a 9:16 vertical reel.

RULES:
- hookText: Must be 5-10 words. Pattern: question, surprising stat, or bold claim.
  The hook should NOT be a summary — it should make someone STOP scrolling.
- scenes: Divide the audio into 3-5 logical segments. Each scene gets a label
  and optionally a keyQuote (exact words from the transcript, max 15 words).
- ctaText: Short, domain-relevant call-to-action.
- The first scene should start at 0s. Scenes must be contiguous (no gaps).
  The last scene must end at {duration_sec}s.

INPUT:
- Transcript: {transcript}
- Expert: {expert_name} ({specialty})
- Domain: {domain}
- Audio duration: {duration_sec}s

Return ONLY valid JSON — no markdown, no explanation:
{{
  "hookText": "5-10 word attention-grabbing hook",
  "scenes": [
    {{ "startSec": 0, "endSec": number, "label": "string", "keyQuote": "string or null" }}
  ],
  "ctaText": "short call-to-action",
  "hashtags": ["#tag1", "#tag2"],
  "title": "SEO-optimized title"
}}"""

    print(f"[ollama] Generating video metadata via '{model}'…")
    t0 = time.time()

    resp = requests.post(
        f"{OLLAMA_BASE_URL}/api/chat",
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json",     # Constrain output to JSON
            "options": {
                "temperature": 0.3,   # Low temp for structured output
                "num_predict": 1024,
            },
        },
        timeout=120,
    )

    elapsed = time.time() - t0
    print(f"[ollama] Response in {elapsed:.1f}s")

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama error {resp.status_code}: {resp.text}")

    raw = resp.json()["message"]["content"].strip()

    # Robust JSON extraction (handle markdown fences if model wraps them)
    import re
    clean = raw
    if "```" in raw:
        fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if fence:
            clean = fence.group(1)
    start = clean.find("{")
    end = clean.rfind("}") + 1
    return json.loads(clean[start:end])
```

### `cli/pipeline.py` — Full Python Orchestrator

Single-command pipeline: audio → transcript → metadata → props.json

```python
#!/usr/bin/env python3
"""ReelForge AI Pipeline: audio → transcript → video metadata → props.json"""

import argparse, json, math
from pathlib import Path
from transcribe import transcribe_audio
from generate_meta import generate_video_meta

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--expert", required=True)
    parser.add_argument("--specialty", required=True)
    parser.add_argument("--domain", required=True)
    parser.add_argument("--template", default="hook-quote")
    parser.add_argument("--model", default="gemma4:e4b")
    parser.add_argument("--whisper-model", default="small")
    parser.add_argument("--output", default="tmp/props.json")
    args = parser.parse_args()

    # Step 1: Transcribe
    print("\n═══ Step 1/2 — Transcription (faster-whisper) ═══")
    transcript = transcribe_audio(args.audio, model_size=args.whisper_model)
    print(f"[done] {len(transcript['words'])} words, {transcript['duration']:.1f}s")

    # Step 2: Generate metadata
    print("\n═══ Step 2/2 — Metadata Generation (Ollama) ═══")
    meta = generate_video_meta(
        transcript=transcript["text"],
        expert_name=args.expert,
        specialty=args.specialty,
        domain=args.domain,
        duration_sec=transcript["duration"],
        model=args.model,
    )

    # Step 3: Build final props for Remotion
    props = {
        "audioUrl": str(Path(args.audio).resolve()),
        "transcript": transcript["text"],
        "expertName": args.expert,
        "expertSpecialty": args.specialty,
        "domain": args.domain,
        "hookText": meta["hookText"],
        "scenes": meta["scenes"],
        "ctaText": meta.get("ctaText", f"Follow for more {args.domain} tips!"),
        "hashtags": meta.get("hashtags", []),
        "title": meta.get("title", ""),
        "durationInFrames": math.ceil(transcript["duration"] * 30),
        "fps": 30,
    }

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(props, indent=2, ensure_ascii=False))
    print(f"\n✅ Props written to {args.output}")

if __name__ == "__main__":
    main()
```

### Prerequisites

Before running the CLI, ensure these are available locally:

```bash
# 1. Ollama must be running with gemma4:e4b pulled
ollama serve                    # Start Ollama (if not already running)
ollama pull gemma4:e4b          # Pull the model (~8GB download)
# Alternative: ollama pull gemma3:12b

# 2. faster-whisper (Python)
pip install faster-whisper       # or: uv pip install faster-whisper

# 3. ffmpeg must be installed (for audio resampling)
brew install ffmpeg              # macOS
```

#### LLM Prompt (refined for CLI MVP)

The prompt is embedded in `generate-meta.py` above. Key design choices:

```
RULES:
- hookText: Must be 5-10 words. Pattern: question, surprising stat, or bold claim.
  The hook should NOT be a summary — it should make someone STOP scrolling.
- scenes: Divide the audio into 3-5 logical segments. Each scene gets a label
  and optionally a keyQuote (exact words from the transcript, max 15 words).
- ctaText: Short, domain-relevant call-to-action.
- The first scene should start at 0s. Scenes must be contiguous (no gaps).
```

> **Why gemma4:e4b?** It's the same model proven in our hindi_translate.py pipeline.
> Runs locally, no API costs, fast enough for structured JSON generation (~5-15s per call).
> The `format: "json"` flag in Ollama constrains output to valid JSON.
> 
> **Fallback**: `gemma3:12b` if gemma4:e4b is too slow on your machine.

---

## Shared Components (`_shared/`)

### `AudioWaveform.tsx`
- Uses `useAudioData()` + `visualizeAudio()` from `@remotion/media-utils`
- Renders animated bars synced to actual audio amplitude
- Configurable: bar count, color, style (linear bars vs radial)

### `SafeZone.tsx`
- Dev-only overlay showing the 900×1400 safe zone
- Toggled via a `showSafeZone` prop (default: false, enable during design)

### `ProgressBar.tsx`
- Thin bar at the very bottom, fills left→right based on `frame / durationInFrames`
- Color = `accentColor`

### `ExpertBadge.tsx`
- Frosted glass card with name + specialty
- Positioned in bottom-left safe zone
- Uses `backdrop-filter: blur()` for glass effect

### `fonts.ts`
- Loads Google Fonts via `@remotion/google-fonts`
- Pre-loads: Inter (sans), Playfair Display (serif)

---

## 10 Test Videos Plan

We'll source/create 10 sample audio clips across different domains to stress-test templates:

| # | Domain | Expert | Audio (s) | Template | Purpose |
|---|---|---|---|---|---|
| 1 | Skincare | Dr. Priya Sharma | ~45s | hook-quote | Baseline test |
| 2 | Skincare | Dr. Priya Sharma | ~45s | minimal-podcast | Same audio, different template |
| 3 | Astrology | Pandit Raj Kumar | ~60s | hook-quote | Hindi-accented English |
| 4 | Fitness | Coach Mike | ~30s | hook-quote | Short-form edge case |
| 5 | Fitness | Coach Mike | ~30s | minimal-podcast | Short-form, dark theme |
| 6 | Nutrition | Dr. Anita Desai | ~90s | hook-quote | Longer content |
| 7 | Nutrition | Dr. Anita Desai | ~90s | minimal-podcast | Longer + more quotes |
| 8 | Legal | Adv. Sanjay Gupta | ~50s | hook-quote | Formal/serious tone |
| 9 | Tech | Ravi Engineer | ~40s | minimal-podcast | Casual/tech domain |
| 10 | Mental Health | Dr. Meera Patel | ~55s | hook-quote | Sensitive topic |

> **For audio sources**: Use TTS (e.g., ElevenLabs free tier or Google TTS) to generate
> realistic expert audio clips from scripts we write. This gives us controlled, repeatable
> test data without needing real expert recordings upfront.

---

## Implementation Steps

### Step 1: Project Setup (~30 min)

```bash
cd reel-forge
npm init -y
npx create-video@latest   # Remotion project init (or manual setup)

# Node deps (Remotion + rendering)
npm i zod @remotion/media-utils @remotion/google-fonts
npm i -D tsx typescript @types/react

# Python deps (AI pipeline)
pip install faster-whisper requests   # or: uv pip install faster-whisper requests

# System deps
brew install ffmpeg                    # Required by faster-whisper

# Ollama setup
ollama serve                           # Start Ollama daemon
ollama pull gemma4:e4b                 # Pull LLM model (~8GB)
```

- Configure `remotion.config.ts` for 1080×1920, 30fps
- Set up `.env` with `OLLAMA_BASE_URL=http://localhost:11434`
- Create folder structure

### Step 2: Shared Components (~2-3 hours)

Build in isolation, test with `npx remotion preview`:
1. `fonts.ts` — load Inter + Playfair Display
2. `ProgressBar.tsx` — simple, test with a 30s composition
3. `ExpertBadge.tsx` — frosted glass card
4. `AudioWaveform.tsx` — test with a sample audio file
5. `SafeZone.tsx` — dev overlay

### Step 3: Template 1 — `hook-quote` (~3-4 hours)

1. Build each scene component individually
2. Wire scenes into main `index.tsx` using `<Sequence>` components
3. Define Zod schema + defaults
4. Test with hardcoded props in Remotion Studio (`npx remotion preview`)
5. Iterate on animations, timing, typography until it looks professional

### Step 4: Template 2 — `minimal-podcast` (~2-3 hours)

1. Radial waveform variant of AudioWaveform
2. Typewriter text effect for intro
3. Quote rotation system (cycle through scenes' keyQuotes)
4. Wire into composition, test

### Step 5: CLI Pipeline (~2-3 hours)

1. `transcribe.py` — faster-whisper integration, test with 1 audio file
2. `generate-meta.py` — Ollama gemma4:e4b prompt, test JSON output quality
3. `pipeline.py` — Wire transcribe + generate-meta, output props.json
4. `render.ts` — Read props.json, invoke Remotion render
5. Test full pipeline: `python3 cli/pipeline.py --audio X && npx tsx cli/render.ts --template hook-quote`

### Step 6: Generate 10 Test Videos (~2 hours)

1. Create 10 sample audio files (TTS or real recordings)
2. Create `input-*.json` configs for each
3. Batch render all 10: `for f in cli/sample-inputs/*.json; do npx tsx cli/render.ts --config $f; done`
4. Review quality, iterate on templates

### Step 7: Quality Review & Polish (~2-3 hours)

1. Upload 2-3 best renders to Instagram/YouTube (test account)
2. Check: video quality, safe zone compliance, audio sync, visual appeal
3. Fix any issues found
4. Document findings

---

## Dependencies (minimal)

### Node (package.json) — Remotion rendering only

```json
{
  "dependencies": {
    "remotion": "^4.x",
    "@remotion/cli": "^4.x",
    "@remotion/media-utils": "^4.x",
    "@remotion/google-fonts": "^4.x",
    "zod": "^3.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "tsx": "^4.x",
    "typescript": "^5.x",
    "@types/react": "^19.x"
  }
}
```

### Python (AI pipeline)

```
faster-whisper       # Local Whisper inference (CTranslate2 backend)
requests             # HTTP calls to Ollama API
```

### System

```
ffmpeg               # Audio resampling (required by faster-whisper)
ollama               # Local LLM runtime (gemma4:e4b or gemma3:12b)
```

> **Note**: The AI pipeline (Python) and the rendering engine (Node/Remotion) are
> cleanly separated. Python generates `props.json`, Remotion consumes it.
> No cloud API keys needed — everything runs on your local machine.

---

## Key Design Decisions for MVP

| Decision | Choice | Rationale |
|---|---|---|
| **STT engine** | **faster-whisper** (local) | No API key, proven in our hindi_translate.py, word-level timestamps, runs on CPU/GPU. |
| **LLM engine** | **Ollama gemma4:e4b** (local) | No API key, proven in our hindi_translate.py, JSON mode, ~5-15s per generation. |
| Audio loading | `staticFile()` + copy to `public/` | Simplest for local rendering. Remotion needs audio in public/ or as URL. |
| Waveform | `@remotion/media-utils` `visualizeAudio()` | Built-in, no custom FFT needed. |
| Animations | `spring()` + `interpolate()` | Remotion native, no extra deps. |
| Fonts | `@remotion/google-fonts` | Auto-handles font loading for renders. |
| Scene timing | Based on LLM scene boundaries | No word-level sync needed (per philosophy). |
| Props override | `--props` flag with full JSON | Allows manual tweaking without re-running AI. |
| Background | CSS gradients + subtle patterns | No stock media API for MVP — just visually rich CSS. |
| Python ↔ Node | Props JSON file handoff | Clean separation: Python does AI, Node does rendering. No IPC complexity. |

---

## What "Done" Looks Like

- [ ] `npx remotion preview` opens Studio with both templates, playable with sample data
- [ ] `npx tsx cli/render.ts --audio X --template hook-quote` produces a polished MP4
- [ ] 10 videos rendered, reviewed, 3+ uploaded to Instagram test account
- [ ] Each video looks like it was made by a professional social media agency
- [ ] Render time < 3 min per video on a MacBook Pro
- [ ] Both templates handle 30s, 60s, and 90s audio gracefully
- [ ] Props can be tweaked (colors, text) without re-running AI pipeline

---

## Estimated Total Time

| Step | Hours |
|---|---|
| Project setup | 0.5 |
| Shared components | 2-3 |
| Template 1 (hook-quote) | 3-4 |
| Template 2 (minimal-podcast) | 2-3 |
| CLI pipeline | 2-3 |
| 10 test renders | 2 |
| Quality review + polish | 2-3 |
| **Total** | **~14-19 hours** |

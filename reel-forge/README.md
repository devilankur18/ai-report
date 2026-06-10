# ReelForge — Automated Video Factory

ReelForge is an automated video production factory that takes raw expert audio (30–120s) and dynamically outputs fully rendered, platform-optimized vertical videos (Instagram Reels, YouTube Shorts, TikToks).

The core philosophy is **operational simplicity** and **predictable rendering patterns**. Social media platforms natively apply captions upon upload; therefore, ReelForge focuses on rendering high-impact typographic hooks, key quotes at scene boundaries, and reactive audio waveforms rather than heavy frame-by-frame word subtitles.

---

## Documentation Index

For detailed guides and reference specifications, see:
*   [Developer & Architecture Guide](file:///Users/ankur/dev/docx/ppt/reel-forge/DEVELOPER_GUIDE.md) — Single-file master reference for architecture, client profiles, personalization engine, templates, and CLI parameters.
*   [Architectural Specification](file:///Users/ankur/dev/docx/ppt/reel-forge/docs/arch.md) — Detailed code structure, decoupled config resolver, and video render pipeline.
*   [Template Design Guidelines](file:///Users/ankur/dev/docx/ppt/reel-forge/docs/template-guidelines.md) — Grid/safe zones, typography scale, motion design, and audio visualizer rules.
*   [High-Level Design (HLD)](file:///Users/ankur/dev/docx/ppt/reel-forge/docs/hld.md) — Original system requirement analysis and architecture decisions.

---

## 1. System Architecture

ReelForge divides work between a **local Python AI pipeline** (for transcription and structural metadata generation) and a **React-based Remotion rendering engine** (for video encoding).

```
┌─────────────────────────────────────────────────────────┐
│                    ReelForge Pipeline                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Raw Expert Audio (.mp3 / .wav)                         │
│         │                                               │
│         ▼                                               │
│  [ Whisper ASR ]  ──(Local Transcription)               │
│         │                                               │
│         ├─► Word Timestamps                             │
│         └─► Full Transcript Text                        │
│                 │                                       │
│                 ▼                                       │
│  [ Ollama LLM ]  ──(Local Gemma4 Metadata Gen)          │
│         │                                               │
│         ├─► Scrolling Hook Text                         │
│         ├─► Macro Scene Breaks & Segment Durations      │
│         ├─► Scene Key-Quotes                            │
│         └─► CTA / Domain Info                           │
│                 │                                       │
│                 ▼                                       │
│  Package dynamic parameters to props.json               │
│                 │                                       │
│                 ▼                                       │
│  [ Remotion Engine ]  ──(React + Headless Chrome)       │
│         │                                               │
│         ▼                                               │
│  Render final H.264 MP4 Reel                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Client Profile & Design Configurations

ReelForge decouples **Doctor Identity (Information)** from **Video Designs (Themes & Variations)** to ensure the system scales efficiently. Client assets are self-contained and dynamically synchronized during rendering.

### Directory Structure
```
reel-forge/
├── clients/
│   └── <client-id>/                 # e.g., dr-priya-sharma/
│       ├── profile.json             # Core identity info (name, avatar/logo filenames)
│       ├── assets/                  # Raw visual assets
│       │   ├── avatar.png
│       │   └── logo.png
│       └── designs/                 # Client design variants over time
│           ├── classic-reels.json   # Ties template (hook-quote) + warm theme settings
│           ├── cyber-podcast.json   # Ties template (minimal-podcast) + neon theme settings
│           └── hindi-wellness.json  # Theme settings with 'hi' language defaults
└── out/
    └── <client-id>/                 # Client-specific output folder
        └── <timestamp>-<template>-<design-id>-<slug>.mp4
```

### Identity Specification (`profile.json`)
Stores the client credentials and assets:
```json
{
  "name": "Dr. Priya Sharma",
  "specialty": "Dermatologist",
  "domain": "Skincare",
  "avatar": "avatar.png",
  "logo": "logo.png"
}
```

### Design Configuration (`designs/<design-id>.json`)
Ties layout templates to custom theme parameters localized for this specific client:
```json
{
  "template": "hook-quote",
  "defaultLanguage": "en",
  "ctaText": "Follow for more skincare tips!",
  "bgVideoUrl": "",
  "theme": {
    "accentColor": "#C86E4B",
    "textColor": "#2D221C",
    "textSecondaryColor": "#6B5A53",
    "bgType": "gradient",
    "bgGradientStart": "#FAF6F0",
    "bgGradientEnd": "#EFE7DC"
  }
}
```

### Asset Synchronization
When a config render is triggered, the `config-resolver.ts` engine copies client assets from `clients/<client-id>/assets/` into `public/clients/<client-id>/` appending unique timestamps to bypass browser cache, which are then referenced by relative paths in the Remotion engine.

---

## 3. Visual Guidelines & Core Components

- **Safe Zones (900x1400)**: Defined in [template-guidelines.md](docs/template-guidelines.md). All interactive elements sit within the center margins to avoid platform interface overlaps.
- **Dynamic Fonts Loader (`src/templates/_shared/fonts.ts`)**: Automatically registers appropriate typefaces based on target language:
  * `en`: Loads `Inter` (sans) and `Playfair Display` (serif).
  * `hi`: Loads `Mukta` (Devanagari sans) and `Rozha One` (Devanagari serif).
- **Animated Backgrounds (`src/templates/_shared/AnimatedBackground.tsx`)**: Renders slowly shifting gradients, CSS bubble particles, solid fills, or looping ambient video backdrops.
- **Radial/Linear Visualizers (`src/templates/_shared/AudioWaveform.tsx`)**: Employs a moving-average filter across 3 frames to smooth waveform jitter, and projects dynamic outer glows synced to sound amplitude.
- **Centered Avatar Podcasts**: The `minimal-podcast` template overlays the expert headshot image directly inside the center visualizer ring.

---

## 4. CLI Option Parameters

ReelForge is orchestrated via the `cli/render.ts` TypeScript entry point.

```bash
npx tsx cli/render.ts [options]
```

### Options List

| Flag | Parameter | Description |
|---|---|---|
| `--client` | `id` | Name of client folder under `clients/` (e.g. `dr-priya-sharma`). |
| `--design` | `id` | Name of client design JSON under `designs/` (e.g. `classic-reels`). |
| `--audio` | `path` | Path to the local raw expert audio file (`.mp3` / `.wav`). |
| `--out` | `path` | Override output path for the rendered MP4 video. |
| `--lang` | `string` | Override presentation language (e.g. `en`, `hi`, `hinglish`) (default: `en`). |
| `--asr-lang` | `string` | Force Whisper transcription language (default: auto-detect). |
| `--bg-video` | `path/url` | Inject custom loop video relative to `public/` (e.g. `backgrounds/abstract.mp4`). |
| `--accent-color`| `hex` | Manual accent color override (e.g., `#FF5733`). |
| `--hook-style`  | `string` | Manual hook style override (e.g., `glitch-cycle`, `3d-stack`, `redacted`). |
| `--model` | `string` | Local Ollama LLM model tag to pull metadata (default: `gemma4:e4b`). |
| `--whisper-model`| `string`| Local Whisper model size (default: `small`). |
| `--skip-ai` | *None* | Skips ASR/LLM pipeline, reusing the last generated `tmp/props.json`. |
| `--props` | `path` | Path to a pre-defined properties JSON file (skips AI pipeline entirely). |
| `--preview` | *None* | Launches local Remotion Studio preview server in the browser instead of rendering. |

*Note: If `--client` is omitted, you must pass manual overrides (`--expert`, `--specialty`, `--domain`).*

---

## 5. Prerequisites & Getting Started

### 1. System Requirements
- **FFmpeg**: Required for audio resampling.
  ```bash
  brew install ffmpeg
  ```
- **Ollama**: Local LLM execution runner. Download from [ollama.ai](https://ollama.ai) and pull the model:
  ```bash
  ollama pull gemma4:e4b
  ```

### 2. Dependencies
Initialize dependencies in the `reel-forge` root directory:
```bash
cd reel-forge
npm install
```

---

## 6. Execution Examples

### Example A: Scalable Render Using Client Profiles
Loads Dr. Priya's profile, maps the `classic-reels` layout (gradient background with badge avatar and watermark), transcribes raw audio, and renders into `out/dr-priya-sharma/`.
```bash
npx tsx cli/render.ts \
  --audio cli/sample-inputs/question-1.mp3 \
  --client dr-priya-sharma \
  --design classic-reels
```

### Example B: Cyber Podcast Design Render
Loads Dr. Priya's profile, maps the `cyber-podcast` layout (neon radial waveform visualizer centering her avatar headshot over particles), and renders.
```bash
npx tsx cli/render.ts \
  --audio cli/sample-inputs/question-1.mp3 \
  --client dr-priya-sharma \
  --design cyber-podcast
```

### Example C: Multi-language Hindi Render
Runs the ASR in Hindi, generates Devanagari subtitles/hooks via Ollama, and renders classic blue/gold design.
```bash
npx tsx cli/render.ts \
  --audio cli/sample-inputs/hindi-gums.mp3 \
  --client dr-priya-sharma \
  --design classic-reels \
  --lang hi \
  --asr-lang hi
```

### Example D: Live Preview Developer Player
Launches Remotion Studio web server so you can preview changes, test designs frame-by-frame, and inspect properties without encoding:
```bash
npx tsx cli/render.ts \
  --audio cli/sample-inputs/question-1.mp3 \
  --client dr-priya-sharma \
  --design classic-reels \
  --preview
```
*(Open `http://localhost:3000` in your web browser)*

---

## 7. How-To Guides

### How to Add a New Doctor
To onboard a new doctor/client to ReelForge:

1. **Create Client Folder**: Create a new folder under `clients/` named using a kebab-case identifier (e.g., `dr-jane-doe`).
2. **Add Profile (`profile.json`)**: Create `profile.json` in the doctor's folder:
   ```json
   {
     "name": "Dr. Jane Doe",
     "specialty": "Pediatrician",
     "domain": "Child Health",
     "avatar": "avatar.png",
     "logo": "logo.png"
   }
   ```
3. **Add Assets**: Create an `assets/` subfolder and place the doctor's visual files there (e.g. `avatar.png` and `logo.png`).
4. **Create Design Configs**: Create a `designs/` subfolder and add at least one design JSON configuration (e.g., `classic-reels.json`):
   ```json
   {
     "template": "hook-quote",
     "defaultLanguage": "en",
     "ctaText": "Follow for pediatrician-approved health tips!",
     "theme": {
       "accentColor": "#3A86C8",
       "textColor": "#1A2530",
       "textSecondaryColor": "#5C6A79",
       "bgType": "gradient",
       "bgGradientStart": "#F4F7FA",
       "bgGradientEnd": "#E1EAF2"
     }
   }
   ```

### How to Generate a New Reel for a New Question
To generate a video for a new raw audio clip:

1. **Prepare Audio**: Place the raw expert audio file (e.g. `.mp3` or `.wav`) in a local directory, such as `cli/sample-inputs/new-question.mp3`.
2. **Run Pipeline Command**: Execute the renderer pointing to the new audio, targeting the specific doctor and design configuration:
   ```bash
   npx tsx cli/render.ts \
     --audio cli/sample-inputs/new-question.mp3 \
     --client dr-priya-sharma \
     --design classic-reels
   ```
   *The system will automatically trigger Whisper for ASR transcription, Ollama to generate metadata (hook, quotes, durations) for the new audio, and Remotion to output the finished `.mp4` video in `out/<client-id>/`.*

---

## 8. High-Engagement Hook Gallery & Efficient Usage

ReelForge features a catalog of **22 premium kinetic hook animations** designed to capture viewer attention in the crucial first 3 to 5 seconds of a reel.

### Catalog of Hooks & Psychological Profiles

| Hook Style | Visual Style | Psychological Match / Best Use Case |
|---|---|---|
| `zoom-face` | Glassmorphic Q&A sticker in center that zooms down to top-left corner. | **Conversational Q&A**: Perfect for friendly, direct, authoritative answers. |
| `stat-counter` | Massive number counting up rapidly with a subtitle tagline. | **Data-driven hooks**: Use when the hook text contains a percentage/statistic (e.g. "90%"). |
| `text-slam` | Words slam onto the screen sequentially with high speed. | **Myth-busting / Urgency**: Best for alarmist warnings or sudden contradictions. |
| `typewriter-bold` | Bold serif text typed line-by-line with a blinking cursor. | **Storytelling / Educational**: Standard professional introduction. |
| `split-reveal` | Horizontal split screen revealing desaturated doctor underneath. | **Anticipation**: Creating high contrast before revealing an answer. |
| `ehr-file` | Clinical telemetry brief, Patient ID scrambler, flashing alert. | **Diagnostic / Urgent warning**: High stakes medical alerts. |
| `parallax-data` | Slow zoom on desaturated photo with active clinical line wave vector. | **Documentary feel**: Premium medical research or guidelines context. |
| `redacted` | Cream document over desaturated photo with black block overlays that shake and unmask. | **Secrets / Controversies**: Best for corporate/insurance secrets or debunking myths. |
| `typewriter-terminal`| Green monospace characters typing with a blinking block cursor. | **Retro-technical / Logs**: Technical diagnostic briefings. |
| `typewriter-pop` | Words spring-scale up one-by-one and glow in accent color. | **Rhythmic typography**: Good general high-energy typography choice. |
| `typewriter-slide` | Words slide up from a clipped mask with an accent glow. | **Concepts / Clean modern intro**: Sleek Apple-style concept introduction. |
| `3d-stack` | Card stack fracturing along 3D axes to reveal photo. | **Industry contradictions**: "They told you X, but it is a lie" style hooks. |
| `blur-in` | Highly blurred text resolving line-by-line while photo unblurs. | **Anticipation**: Restricts visual detail initialy to draw focus to the words. |
| `parallax-waveform`| SVG audio waveform moving in real time at the footer. | **Voice track proof**: Highlights the existence of spoken audio immediately. |
| `glitch-cycle` | Metric text strobes and glitches rapidly between medical terms. | **Systemic errors / Panic**: Great for alarming health alerts or panic triggers. |
| `mosaic-reframe` | Doctor photo converges from 6 sliding grid pieces. | **Aggregating clues**: Connecting multiple research points to a single conclusion. |
| `variable-typewriter`| Monospace text typing at variable human-like speed inside terminal card. | **Clinical logs / Case studies**: Feels like a live clinical diary entry. |
| `3d-carousel` | 3 cards rotating in vertical 3D space, locking on target card. | **Decision-making**: Comparing option A, B, and a secret option C. |
| `matrix-flyby` | Acronyms fly past the camera in 3D, resolving on doctor portrait. | **Complex data**: Simulates cutting through medical jargon to get the answer. |
| `list-countdown` | Neon numbered boxes flash to progressively unmask points. | **Listicles**: Perfect for structured warnings (e.g. "3 main errors"). |
| `3d-showcase` | 3D document flips 180 degrees on Y-axis to reveal details. | **Flipping perspective**: Turning a regulatory/administrative issue into a solution. |

---

### Best Practices for Efficient Iteration & Selection

#### 1. Automatic Dynamic Selection (LLM Choice)
Ollama (`generate_meta.py`) dynamically evaluates the transcript and matches it to a hook style based on the psychological profiles defined in `src/templates/_shared/hooks-metadata.json`. To let the LLM choose, leave the `"hookStyle"` field blank or omit it from the design JSON config.

#### 2. Manual Lock in Design Configuration
If a client has a set brand pattern (e.g., they always want a desaturated documentary feel), lock the style by defining `"hookStyle": "parallax-data"` inside the design config (e.g., `clients/dr-snigdha-sinha/designs/talking-head-qna.json`).

#### 3. CLI Override for Fast A/B Testing
When generating reels, do not modify config files to try different styles. Instead, use the `--hook-style` override combined with `--quick` to reuse cached transcriptions:
```bash
# Test Glitch Cycle Hook (renders in ~45s reusing transcript)
npx tsx cli/render.ts --client dr-snigdha-sinha --design talking-head-qna --audio public/audio/audio-snig.m4a --hook-style glitch-cycle --quick

# Test paralax-waveform  (renders in ~45s reusing transcript)
npx tsx cli/render.ts --client dr-snigdha-sinha --design talking-head-qna --audio public/audio/audio-snig.m4a --hook-style paralax-waveform --quick
```

#### 4. Preview Server Visual Checking
To visual-check all hooks frame-by-frame instantly without waiting for MP4 rendering, launch the Remotion Studio preview server:
```bash
npx tsx cli/render.ts --client dr-snigdha-sinha --design talking-head-qna --audio public/audio/audio-snig.m4a --preview
```
*Tip: Register a draft props configuration in `tmp/props-resolved.json` and adjust the hookStyle in the Remotion sidebar controls to instantly see visual updates.*

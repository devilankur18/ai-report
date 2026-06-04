# ReelForge — Automated Video Factory

ReelForge is an automated video production factory that takes raw expert audio (30–120s) and dynamically outputs fully rendered, platform-optimized vertical videos (Instagram Reels, YouTube Shorts, TikToks).

The core philosophy is **operational simplicity** and **predictable rendering patterns**. Social media platforms natively apply captions upon upload; therefore, ReelForge focuses on rendering high-impact typographic hooks, key quotes at scene boundaries, and reactive audio waveforms rather than heavy frame-by-frame word subtitles.

---

## Documentation Index

For detailed guides and reference specifications, see:
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

# ReelForge — Architectural Specification

ReelForge is a professional-grade automated video factory that transforms raw expert audio (30s – 120s) into polished, localized, and design-personalized vertical videos (9:16) for social media (Instagram Reels, YouTube Shorts, TikTok).

This document details the system design, the decoupled client configuration model, the asset pipeline, and the specifications of the rendering templates.

---

## 1. Dual-Layer Pipeline

ReelForge is designed with a split architecture: a **Python AI pipeline** responsible for transcription and logical structuring, and a **TypeScript/React Remotion engine** responsible for visual composition and video encoding.

```
                  ┌──────────────────────────────┐
                  │ Raw Expert Audio (MP3/WAV)   │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                    [ Step 1: Transcription ]
                    - Python subprocess calls FFmpeg to resample to 16kHz
                    - faster-whisper extracts transcript + word timestamps
                                 │
                                 ▼
                    [ Step 2: Metadata Gen ]
                    - Local Ollama pulls/runs Gemma 4 model (gemma4:e4b)
                    - Generates structured JSON (Hook, Scenes, Key Quotes, CTA)
                                 │
                                 ▼
                    [ Step 3: Config Resolver ]
                    - Reads clients/<id>/profile.json & designs/<id>.json
                    - Copies client images/logos to public/ with cache-busting
                    - Generates consolidated tmp/props-resolved.json
                                 │
                                 ▼
                    [ Step 4: Remotion Engine ]
                    - Reads props-resolved.json
                    - Dynamically loads fonts based on language (en/hi)
                    - Renders video compositions (hook-quote/minimal-podcast)
                                 │
                                 ▼
                    [ Step 5: Encoding Output ]
                    - Remotion CLI renders H.264 MP4 to out/<client-id>/
```

### Phase 1: Python AI Pipeline
*   **Audio Resampling**: Before transcription, audio files are resampled to 16kHz mono WAV using FFmpeg for optimal Whisper speech-to-text accuracy.
*   **Speech-to-Text (ASR)**: Uses `faster-whisper` (falling back to `openai-whisper` if unavailable) to retrieve word-level timestamps and the full transcript text.
*   **Local LLM Metadata Parser**: A structured JSON query is sent to local Ollama (defaulting to the `gemma4:e4b` model). The LLM divides the transcript into 3–5 logical scenes, generates an attention-grabbing hook text, extracts verbatim key quotes for each scene, and outputs a call-to-action (CTA).

### Phase 2: React Remotion Render Engine
*   **Composition Rendering**: Compiles the React components inside a headless Chromium instance, capturing frames and stitching them with the audio file.
*   **Output Encoding**: Remotion CLI invokes FFmpeg to encode the final H.264 video with AAC audio at 30 FPS.

---

## 2. Decoupled Identity vs. Design Configurations

To support hundreds of templates and design variants without duplicating expert information, ReelForge separates **Doctor Identity (Information)** from **Visual Branding (Design Configurations)**.

### Directory Structure
```
reel-forge/
├── clients/
│   └── <client-id>/                     # Unique ID (e.g., dr-vishal-maurya)
│       ├── profile.json                 # Doctor's personal details & identity assets
│       ├── assets/                      # Raw image and logo assets
│       │   ├── avatar.png               # Square/circle headshot
│       │   ├── logo.png                 # Clinic logo watermark
│       │   ├── clinic-outside.png       # Clinic facade background
│       │   └── clinic-inside.png        # Clinic reception background
│       └── designs/                     # Custom design templates for this doctor
│           ├── classic-reels.json       # Clean serif design with background images
│           └── cyber-podcast.json       # Neon design with audio visualizers
└── out/
    └── <client-id>/                     # Output location organized by client
```

### Identity Specification (`profile.json`)
Declares the expert's metadata and lists the asset files available in the client's `assets/` subdirectory:
```json
{
  "name": "Dr. Vishal Maurya",
  "specialty": "Cardiologist",
  "domain": "Heart Health",
  "avatar": "avatar.png",
  "logo": "logo.png",
  "images": [
    "avatar.png",
    "clinic-outside.png",
    "clinic-inside.png",
    "doctor-patient.png"
  ]
}
```

### Design Configuration (`designs/<design-id>.json`)
Declares which template to use, default language settings, and customized visual elements (colors, gradients, backgrounds):
```json
{
  "template": "hook-quote",
  "defaultLanguage": "en",
  "ctaText": "Protect your heart today!",
  "bgVideoUrl": "",
  "theme": {
    "accentColor": "#E2B13C",
    "textColor": "#FFFFFF",
    "textSecondaryColor": "#B0BAC5",
    "bgType": "image"
  }
}
```

---

## 3. Client Asset & Synchronization Pipeline

Because Remotion caches static resources aggressively during rendering, a specialized cache-busting pipeline is implemented inside `src/lib/config-resolver.ts`:

1.  **Read and Match**: The resolver receives the `--client` and `--design` arguments. It matches files in `clients/<client-id>/assets/` against the `profile.json` parameters.
2.  **Unique Copying**: It copies the referenced files (avatar, logo, images list) into `public/clients/<client-id>/` but prepends a runtime-specific timestamp and index (e.g., `171754600-0-clinic-outside.png`).
3.  **Resolve Relative Paths**: The system formats and returns public-relative paths (`clients/<client-id>/171754600-0-clinic-outside.png`) to Remotion, forcing a cache refresh for the local assets.
4.  **Save Properties**: Consolidates the outputs into `tmp/props-resolved.json` which is passed directly to the Remotion CLI.

---

## 4. Visual Engine & Template Specifications

All templates are designed for 9:16 vertical viewports (1080 × 1920) at 30 FPS.

### Design Grid & Safe Zones
To prevent platform user interfaces (Instagram hearts, comments, TikTok profiles, YouTube Shorts headers) from overlapping the visual content:
*   **Active Canvas Zone**: Centered `900px × 1400px` boundary.
*   **Vertical Margins**: Top and bottom bounds keep a minimum `260px` buffer clear of critical elements.
*   **Right Side Buffer**: A `120px` right-hand margin prevents interactive platform buttons from blocking captions.

### Multi-Language Typeface Loader (`src/templates/_shared/fonts.ts`)
The framework includes support for multiple target languages. Font family loader registers appropriate Unicode typefaces depending on the designated render language:
*   **English (`en`)**: Imports Google Fonts `Inter` (crisp sans-serif for subtitles) and `Playfair Display` (serif for headlines).
*   **Hindi (`hi`)**: Imports `Mukta` (clean Devanagari sans-serif) and `Rozha One` (stylized Devanagari serif).

### Contrast Safety Layer
To ensure readable overlays on complex backgrounds:
*   **Background Vignettes**: Full-screen images use a dark frosted blur backing sheet (`background: rgba(0,0,0,0.45)`, `backdrop-filter: blur(8px)`).
*   **Drop Shadows**: Heavy text-shadow overlays are applied to visual text captions (`text-shadow: 0 4px 16px rgba(0, 0, 0, 0.35)`).

### Spring Animations & Motion Physics
Standard linear transitions are avoided. UI element animations use physics-based spring movements:
*   **Spring Configuration**: `stiffness: 100`, `damping: 15`. This creates a punchy, professional look without visual jitter.
*   **Ken Burns Zoom**: Static background images are given depth by applying a slow interpolating scale (e.g., from `1.0` to `1.15` over a 300-frame loop cycle).

---

## 5. Templates Specifications

### Template A: `hook-quote`
A text-focused template that alternates high-impact headlines and scene-level key quotes.
*   **Hook Intro (0s – 3s)**: Renders a typewriter-animated scrolling hook title. Background displays the first client asset (e.g., `clinic-outside.png`).
*   **Main Speech**: Displays the expert branding badge (avatar, name, and specialty) at the bottom. As the audio transitions between scenes, the key quote overlays update, and the background slideshow cycles through the client images (e.g., consult photos).
*   **Outro CTA (Final 4s)**: Animates a call-to-action screen with clinic details, logo, and a volume fade-out.

### Template B: `minimal-podcast`
An audio-visualizer-centric template.
*   **Layout**: Displays the doctor's avatar inside a rotating, audio-reactive wave visualizer ring at the center of the viewport.
*   **Audio Waveforms**: Employs a moving-average filter across 3 frames to smooth visual visualizer jitter. Outer glows scale in brightness based on voice amplitude.
*   **Background cycling**: The background image shifts between different clinic environments to keep the visual design dynamic.

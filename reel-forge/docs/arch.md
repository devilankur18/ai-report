# ReelForge — Architectural Specification

ReelForge is a professional-grade automated video factory that transforms raw expert audio (30s – 120s) or text questions into polished, localized, and design-personalized vertical videos (9:16) for social media (Instagram Reels, YouTube Shorts, TikTok).

This document details the system design, the decoupled configuration model, the asset pipeline, and the specifications of the rendering templates.

---

## 1. Dual-Layer Pipeline

ReelForge is designed with a split architecture: a **Python AI pipeline** responsible for transcription, answer generation, voice synthesis, and logical structuring, and a **TypeScript/React Remotion engine** responsible for visual composition and video encoding.

### High-Level Workflow Flowchart
```
                ┌───────────────────────────────────┐
                │ Optional: Text Question (--question)│
                └─────────────────┬─────────────────┘
                                  │ (ollama: gemma4:e4b)
                                  ▼
                     [ Answer Generation ]
                     - generate_answer.py writes answer text
                                  │
                                  ▼
                     [ Cloned/Preset Voice Synthesis ]
                     - synthesize_voice.py resolves voice profile
                     - Calls local Voicebox (Tauri sidecar) or MLX TTS
                     - Saves generated audio to tmp/synthesized_voice.mp3
                                  │
                                  ▼
 ┌────────────────────────────────┴──────────────────┐
 │ Raw Expert Audio (MP3/WAV) or Synthesized Audio    │
 └────────────────────────┬──────────────────────────┘
                          │
                          ▼
             [ Step 1: Transcription (Whisper) ]
             - Python subprocess calls FFmpeg to resample to 16kHz WAV
             - faster-whisper extracts transcript + word timestamps
                          │
                          ▼
             [ Step 2: Metadata Gen (Ollama) ]
             - Local Ollama pulls/runs Gemma 4 model (gemma4:e4b)
             - Generates structured JSON (Hook, Scenes, Key Takeaways, CTA)
                          │
                          ▼
             [ Step 3: Config Resolver ]
             - Reads clients/<id>/profile.json, designs/<id>.json & voices/
             - Copies client images/logos/audio to public/ with cache-busting
             - Generates consolidated tmp/props-resolved.json
                          │
                          ▼
             [ Step 4: Remotion Engine ]
             - Reads props-resolved.json
             - Dynamically loads fonts based on language (en/hi)
             - Renders video compositions (hook-quote/talking-head-qna)
                          │
                          ▼
             [ Step 5: Encoding Output ]
             - Remotion CLI renders H.264 MP4 to out/<client-id>/
```

### Phase 1: Python AI Pipeline
*   **Answer Generation**: When a text question is supplied via `--question`, `cli/generate_answer.py` queries local Ollama (`gemma4:e4b`) with a personalized prompt (including expert name, specialty, and domain) to generate a conversational, patient-friendly response of 45-60 words.
*   **Voice Synthesis**: `cli/synthesize_voice.py` processes the generated response text using the resolved client voice configuration. It supports:
    *   **Local Voicebox API**: Queries a local Tauri-based Voicebox app (`http://127.0.0.1:17493`) using `/profiles` to match the engine and resolves the desired model size (e.g. `0.6B` or `1.7B`).
    *   **MLX Qwen3-TTS**: Runs local python-based generation using Apple Silicon MLX framework for preset and cloned voices (using custom reference audio clips).
*   **Audio Resampling**: Before transcription, audio files are resampled to 16kHz mono WAV using FFmpeg for optimal Whisper speech-to-text accuracy.
*   **Speech-to-Text (ASR)**: Uses `faster-whisper` (falling back to standard `openai-whisper` if unavailable) to retrieve word-level timestamps and the full transcript text.
*   **Local LLM Metadata Parser**: A structured JSON query is sent to local Ollama. The LLM divides the transcript into 3–5 logical scenes, generates an attention-grabbing hook text, selects a matching hook style and tone tag, and generates a list of 3-5 key takeaways with exact timestamps (`timeSec`).

### Phase 2: React Remotion Render Engine
*   **Composition Rendering**: Compiles the React components inside a headless Chromium instance, capturing frames and stitching them with the audio file.
*   **Output Encoding**: Remotion CLI invokes FFmpeg to encode the final H.264 video with AAC audio at 30 FPS.

---

## 2. Decoupled Identity, Design, and Voice Configurations

To support hundreds of templates and design variants without duplicating expert information, ReelForge separates **Doctor Identity (Information)**, **Visual Branding (Design Configurations)**, and **Audio Branding (Voice Profiles)**.

### Directory Structure
```
reel-forge/
├── clients/
│   └── <client-id>/                     # Unique ID (e.g., dr-snigdha-sinha)
│       ├── profile.json                 # Doctor's personal details & identity assets
│       ├── assets/                      # Raw image, reference audio, and logo assets
│       │   ├── avatar.jpeg              # Headshot
│       │   ├── logo.png                 # Clinic logo watermark
│       │   ├── snig_ref.wav             # 9.4s clear voice sample for cloning
│       │   └── clinic-outside.png       # Background image
│       ├── designs/                     # Custom design templates for this doctor
│       │   ├── classic-reels.json       # Clean serif design with background images
│       │   └── talking-head-qna.json    # Interactive Q&A styling override
│       └── voices/                      # Voice configurations for this doctor
│           ├── standard-aiden.json      # Preset male voice
│           ├── standard-vivian.json     # Preset female voice
│           └── cloned-snig.json         # Cloned female voice of the doctor
└── out/
    └── <client-id>/                     # Output location organized by client
```

### Identity Specification (`profile.json`)
Declares the expert's metadata and lists the asset files available in the client's `assets/` subdirectory:
```json
{
  "name": "Dr. Snigdha Sinha",
  "specialty": "Pathologist & Dentist Representative",
  "domain": "Dental Health & Hygiene",
  "avatar": "avatar.jpeg",
  "logo": "logo.png",
  "imageSet": [
    { "file": "avatar.jpeg", "role": "portrait", "alt": "Doctor portrait" },
    { "file": "clinic-outside.png", "role": "scene", "alt": "Clinic lobby" }
  ]
}
```

### Design Configuration (`designs/<design-id>.json`)
Declares which template to use, default language settings, and customized visual elements (colors, gradients, backgrounds):
```json
{
  "template": "talking-head-qna",
  "defaultLanguage": "en",
  "ctaText": "Protect your teeth. Book an appointment today.",
  "theme": {
    "accentColor": "#00F5D4",
    "textColor": "#FFFFFF",
    "bgType": "hero-portrait",
    "bgSolid": "#0D0D0D"
  }
}
```

### Voice Profiles (`voices/<voice-id>.json`)
Specifies the engine, type, and options used to synthesize natural speech.
#### Preset Voice Example:
```json
{
  "engine": "voicebox",
  "profile_name": "Ai-voice-en",
  "default_engine": "qwen_custom_voice",
  "model_size": "0.6B",
  "language": "en"
}
```
#### Cloned Voice Example:
```json
{
  "engine": "mlx-qwen3-tts",
  "model": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16",
  "type": "cloned",
  "refAudio": "snig_ref.wav",
  "refText": "When you go to the doctor, explain your symptoms, carry any additional reports or investigations.",
  "speed": 1.0,
  "pitch": 1.0
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

### Template C: `talking-head-qna` (Premium Viral Q&A Master)
Designed to maximize initial retention and visual engagement.
*   **Smart Q&A Sync**:
    *   *Mode A (Spoken Question)*: If a question mark is detected in the first 15 words of the transcription, the audio begins immediately at frame 0, highlighting spoken question words in real time.
    *   *Mode B (Typewriter Hook)*: If no spoken question is found, the audio is delayed to frame 90 (3s). The first 90 frames display a typewriter animation of the hook text, accompanied by mechanical keyboard typing SFX.
*   **PIP Corner Transition**: The glassmorphic Q&A sticker scales down ($1.0 \to 0.55$) and slides to the top-left corner using a spring transition at frame 70-90 as the answer phase begins.
*   **Auto-Zoom Cuts**: Every 75 frames (2.5s), the background image scale changes abruptly using spring cut cuts ($1.05 \to 1.14 \to 1.0 \to 1.10$) alongside a 5-frame white flash transition and a whoosh SFX.
*   **Karaoke Subtitles**: Subtitle words pop up and transition from gray to the accent color (or a highlight color like yellow for emphasis words) based on Whisper timestamps.
*   **Floating Staggered Takeaways**: 3-5 bulleted takeaways are introduced one-by-one, synchronized with the exact timestamp (`timeSec`) generated by Ollama. Each bullet slides up with a spring effect.
*   **Integrated Sound Effects**:
    *   `boom.wav` (intro drops)
    *   `whoosh.wav` (cuts and transitions)
    *   `ding.wav` (takeaway bullet entries and CTA outro)
    *   `pop.wav` (caption line switches)
    *   `click.wav` (mechanical typing sound)

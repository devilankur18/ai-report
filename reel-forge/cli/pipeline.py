#!/usr/bin/env python3
"""
pipeline.py
-----------
Orchestrates the entire AI pipeline:
1. Audio file transcription (ASR) via Whisper
2. Video metadata generation (LLM) via local Ollama
3. Combines both into a dynamic props.json file for Remotion
"""

import argparse
import json
import math
import sys
from pathlib import Path

# Add the script's directory to the python path to ensure local imports succeed
sys.path.append(str(Path(__file__).parent.resolve()))

try:
    from transcribe import transcribe_audio
    from generate_meta import generate_video_meta
except ImportError as e:
    print(f"[pipeline] Import error: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="ReelForge AI Pipeline: audio -> transcript -> metadata -> props.json")
    parser.add_argument("--audio", required=True, help="Path to input audio file")
    parser.add_argument("--expert", required=True, help="Expert name")
    parser.add_argument("--specialty", required=True, help="Expert specialty")
    parser.add_argument("--domain", required=True, help="Domain/topic area")
    parser.add_argument("--template", default="hook-quote", help="Target Remotion template")
    parser.add_argument("--model", default="gemma4:e4b", help="Ollama LLM model to use")
    parser.add_argument("--whisper-model", default="small", help="Whisper model size")
    parser.add_argument("--language", default="en", help="Target video presentation language (e.g. en, hi, hinglish)")
    parser.add_argument("--asr-language", default=None, help="Force ASR transcription language (e.g. en, hi). Default: auto-detect")
    parser.add_argument("--output", default="tmp/props.json", help="Path to write Remotion props JSON")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"[pipeline] Error: audio file not found: {args.audio}")
        sys.exit(1)

    print(f"\n[pipeline] Starting ReelForge AI pipeline for audio: {audio_path.name}")
    
    # ── Step 1: Transcription ───────────────────────────────────────────
    print("\n═══ Step 1/2 — Transcription (Whisper ASR) ═══")
    transcript = transcribe_audio(str(audio_path), model_size=args.whisper_model, language=args.asr_language)
    print(f"[pipeline] Transcription complete. Duration: {transcript['duration']:.2f}s, Detected Language: {transcript.get('language', 'unknown')}")

    # ── Step 2: Metadata Generation ──────────────────────────────────────
    print("\n═══ Step 2/2 — Metadata Generation (Ollama LLM) ═══")
    meta = generate_video_meta(
        transcript=transcript["text"],
        expert_name=args.expert,
        specialty=args.specialty,
        domain=args.domain,
        duration_sec=transcript["duration"],
        model=args.model,
        language=args.language,
    )
    print("[pipeline] Metadata generation complete.")

    # ── Step 3: Package final props for Remotion ─────────────────────────
    # Duration in frames = duration of audio * 30fps
    # Add intro offset depending on the template
    intro_frames = 90 if args.template == "hook-quote" else 60
    audio_frames = math.ceil(transcript["duration"] * 30)
    total_duration_frames = intro_frames + audio_frames

    # Construct props JSON
    props = {
      "audioUrl": str(audio_path.resolve()),
      "transcript": transcript["text"],
      "expertName": args.expert,
      "expertSpecialty": args.specialty,
      "domain": args.domain,
      "hookText": meta.get("hookText", f"Important information on {args.domain}"),
      "scenes": meta.get("scenes", []),
      "ctaText": meta.get("ctaText", f"Follow for more {args.domain} tips!"),
      "hashtags": meta.get("hashtags", []),
      "title": meta.get("title", ""),
      "durationInFrames": total_duration_frames,
      "fps": 30,
      "language": args.language,
    }

    # Verify scene bounds and adjust if necessary
    for scene in props["scenes"]:
        # Safety offset
        if scene["startSec"] < 0:
            scene["startSec"] = 0.0
        if scene["endSec"] > transcript["duration"]:
            scene["endSec"] = round(transcript["duration"], 2)

    # Output to destination
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(props, indent=2, ensure_ascii=False))
    
    print(f"\n[pipeline] Success! Generated Remotion props written to: {out_path.resolve()}")

if __name__ == "__main__":
    main()

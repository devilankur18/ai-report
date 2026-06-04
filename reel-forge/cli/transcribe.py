#!/usr/bin/env python3
"""
transcribe.py
-------------
Transcribes an audio file using faster-whisper (local, runs on CPU/GPU)
and returns transcript text, word-level timestamps, and total duration.
"""

import sys
import os
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

# Whisper model size — "small" balances speed vs English accuracy well.
WHISPER_MODEL_SIZE = "small"

def transcribe_audio(audio_path: str, model_size: str = WHISPER_MODEL_SIZE, language: str = None) -> dict:
    """
    Transcribe audio using faster-whisper.
    Falls back to openai-whisper if faster-whisper is not installed.
    Automatically resamples the audio to 16kHz mono WAV using ffmpeg first.
    """
    resampled_path = audio_path
    is_temp = False

    # Automatically resample input audio to 16kHz mono WAV for optimal ASR quality
    temp_wav = tempfile.NamedTemporaryFile(suffix="_resampled.wav", delete=False)
    temp_wav.close()

    cmd = [
        "ffmpeg", "-y",
        "-i", audio_path,
        "-ar", "16000",
        "-ac", "1",
        temp_wav.name
    ]
    try:
        print(f"[audio] Resampling {Path(audio_path).name} to 16kHz mono WAV using ffmpeg…")
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        resampled_path = temp_wav.name
        is_temp = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[audio] Warning: ffmpeg resampling failed. Falling back to original audio file.")
        try:
            os.unlink(temp_wav.name)
        except Exception:
            pass

    try:
        try:
            from faster_whisper import WhisperModel  # type: ignore

            print(f"[whisper] Loading faster-whisper '{model_size}' model…")
            wmodel = WhisperModel(model_size, device="auto", compute_type="auto")
            
            transcribe_kwargs = {
                "beam_size": 5,
                "word_timestamps": True,
                "condition_on_previous_text": False,
            }
            if language:
                transcribe_kwargs["language"] = language

            segments, info = wmodel.transcribe(resampled_path, **transcribe_kwargs)
            detected_lang = info.language
            duration = info.duration

            words = []
            full_text_parts = []
            for segment in segments:
                full_text_parts.append(segment.text.strip())
                if segment.words:
                    for word in segment.words:
                        words.append({
                            "word": word.word.strip(),
                            "start": round(word.start, 2),
                            "end": round(word.end, 2),
                        })
            
            text = " ".join(full_text_parts)

        except ImportError:
            # Fallback to openai-whisper
            try:
                import whisper  # type: ignore
            except ImportError:
                print(
                    "\n[ERROR] Neither 'faster-whisper' nor 'openai-whisper' is installed.\n"
                    "Install one of them:\n"
                    "  pip install faster-whisper          # recommended\n"
                    "  pip install openai-whisper librosa  # alternative\n"
                )
                sys.exit(1)

            print(f"[whisper] Loading openai-whisper '{model_size}' model…")
            wmodel = whisper.load_model(model_size)
            
            transcribe_kwargs = {
                "fp16": False,
                "condition_on_previous_text": False,
            }
            if language:
                transcribe_kwargs["language"] = language

            result = wmodel.transcribe(resampled_path, **transcribe_kwargs)
            detected_lang = result.get("language", "en")
            text = result["text"].strip()
            duration = result.get("duration", 0.0)
            
            # Reconstruct word list from segments if word timestamps aren't available
            words = []
            for segment in result.get("segments", []):
                seg_text = segment.get("text", "").strip()
                seg_start = segment.get("start", 0.0)
                seg_end = segment.get("end", 0.0)
                # Split segment text into rough word-level bounds
                seg_words = seg_text.split()
                if seg_words:
                    word_dur = (seg_end - seg_start) / len(seg_words)
                    for idx, w in enumerate(seg_words):
                        words.append({
                            "word": w.strip(".,?!:;\"()"),
                            "start": round(seg_start + idx * word_dur, 2),
                            "end": round(seg_start + (idx + 1) * word_dur, 2)
                        })

        print(f"[whisper] Detected language: {detected_lang}, Duration: {duration:.1f}s")
        return {
            "text": text,
            "words": words,
            "duration": duration,
            "language": detected_lang
        }

    finally:
        # Clean up resampled temp file
        if is_temp and os.path.exists(resampled_path):
            try:
                os.unlink(resampled_path)
                print("[audio] Cleaned up temporary resampled WAV file.")
            except Exception:
                pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe audio file via Whisper.")
    parser.add_argument("audio", help="Path to audio file")
    parser.add_argument("--model", default=WHISPER_MODEL_SIZE, help="Whisper model size")
    parser.add_argument("--language", default=None, help="Force language (e.g., en, hi)")
    parser.add_argument("--output", default=None, help="Save JSON output to path")
    args = parser.parse_args()

    if not Path(args.audio).exists():
        print(f"Error: audio file not found: {args.audio}")
        sys.exit(1)

    result = transcribe_audio(args.audio, model_size=args.model, language=args.language)
    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
        print(f"ASR result saved to {args.output}")
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))

#!/usr/bin/env python3
"""
generate_test_audio.py
----------------------
Generates a synthetic Hindi test WAV file using the system's TTS (macOS `say`)
or gTTS (Google Text-to-Speech) so you can test hindi_translate.py without
a real recording.

Usage:
    uv run python generate_test_audio.py
    uv run python generate_test_audio.py --text "आपका स्वागत है" --out my_test.wav
"""
import argparse
import subprocess
import sys
import os
from pathlib import Path

DEFAULT_TEXT = (
    "नमस्ते, मेरा नाम अंकुर है। "
    "आज का मौसम बहुत अच्छा है। "
    "भारत एक विविधताओं से भरा देश है जहाँ अनेक भाषाएँ बोली जाती हैं।"
)
DEFAULT_OUT = "sample_hindi.wav"


def generate_with_gtts(text: str, out: str) -> None:
    """Use gTTS (Google TTS) to generate a Hindi WAV file."""
    try:
        from gtts import gTTS  # type: ignore
        import pydub           # type: ignore  (for mp3→wav)
        from pydub import AudioSegment
    except ImportError:
        print("[ERROR] gTTS or pydub not installed. Run:\n  pip install gtts pydub")
        sys.exit(1)

    tmp_mp3 = Path(out).with_suffix(".mp3")
    tts = gTTS(text=text, lang="hi", slow=False)
    tts.save(str(tmp_mp3))

    audio = AudioSegment.from_mp3(str(tmp_mp3)).set_frame_rate(16000).set_channels(1)
    audio.export(out, format="wav")
    tmp_mp3.unlink(missing_ok=True)
    print(f"[gTTS] Saved: {out}")


def generate_with_say(text: str, out: str) -> None:
    """Use macOS `say` command to generate AIFF then convert with ffmpeg."""
    tmp_aiff = Path(out).with_suffix(".aiff")
    subprocess.run(
        ["say", "-v", "Lekha", "-o", str(tmp_aiff), text],
        check=True,
    )
    # Convert to 16 kHz mono WAV with ffmpeg
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(tmp_aiff), "-ar", "16000", "-ac", "1", out],
        check=True,
        capture_output=True,
    )
    tmp_aiff.unlink(missing_ok=True)
    print(f"[say+ffmpeg] Saved: {out}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a Hindi test WAV file.")
    parser.add_argument("--text", default=DEFAULT_TEXT, help="Hindi text to synthesise")
    parser.add_argument("--out", default=DEFAULT_OUT, help="Output WAV file path")
    args = parser.parse_args()

    out = args.out
    if not out.endswith(".wav"):
        out += ".wav"

    print(f"Generating Hindi audio: {out}")
    print(f"Text: {args.text[:80]}…\n")

    # Try macOS say first (no internet needed)
    if sys.platform == "darwin":
        try:
            generate_with_say(args.text, out)
            return
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("[warn] macOS 'say' failed, trying gTTS…")

    # Fallback: gTTS (needs internet)
    generate_with_gtts(args.text, out)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
hindi_translate.py
------------------
Transcribes a Hindi audio file and translates the content into 5 Indian
languages using a two-stage pipeline:

  Stage 1 – ASR  : faster-whisper (local, runs on CPU/GPU)
  Stage 2 – NMT  : Ollama gemma4:e4b (local LLM, text-to-text)

Usage:
    uv run python hindi_translate.py <audio_file> [--model gemma4:e4b]
    uv run python hindi_translate.py <audio_file> --output results.json

Supported output languages:
    Tamil · Telugu · Kannada · Malayalam · Bengali
    (plus the original Hindi transcription)
"""

import argparse
import json
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_LLM_MODEL = "gemma4:e4b"

# Whisper model size — "small" balances speed vs Hindi accuracy well.
# Options: tiny | base | small | medium | large-v2 | large-v3
WHISPER_MODEL_SIZE = "small"

TARGET_LANGUAGES = {
    "English":   "English",
    "Hinglish":  "Hinglish (Hindi in Roman script)",
    "Tamil":     "Tamil (தமிழ்)",
    "Telugu":    "Telugu (తెలుగు)",
    "Kannada":   "Kannada (ಕನ್ನಡ)",
    "Malayalam": "Malayalam (മലയാളം)",
    "Bengali":   "Bengali (বাংলা)",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_ollama(model: str) -> bool:
    """Return True if Ollama is running and the model is available."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code != 200:
            return False
        models = [m["name"] for m in resp.json().get("models", [])]
        return any(m.startswith(model.split(":")[0]) for m in models)
    except Exception:
        return False


def _pull_model_if_needed(model: str) -> None:
    """Pull the model from Ollama registry if not already present."""
    print(f"[ollama] Pulling model '{model}' (this may take a while)…")
    resp = requests.post(
        f"{OLLAMA_BASE_URL}/api/pull",
        json={"name": model, "stream": False},
        timeout=600,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to pull model '{model}': {resp.text}")
    print(f"[ollama] Model '{model}' ready.")


# Prompt used only to seed Whisper's context — NOT included in the output.
# It forces Devanagari script output and educates Whisper to expect Hinglish / English loanwords
# (like doctor, gas, liver, washroom, etc.) instead of hallucinating other foreign languages.
_DEVANAGARI_SEED = "नमस्ते, यह एक हिंदी भाषण है। इसमें बातचीत के दौरान सामान्य इंग्लिश शब्द भी हो सकते हैं जैसे की 'doctor', 'school', 'gas', 'liver', 'washroom', 'pain'।"


def _clean_transcript(text: str) -> str:
    """
    Post-process Whisper output:
    1. Strip the seeding prompt if it leaked into the first segment.
    2. Detect and remove repetitive hallucination patterns (e.g. "1-1-1-1-1").
    """
    import re

    # Strip seed prompt prefix (sometimes Whisper echoes it verbatim)
    cleaned = text
    if cleaned.startswith(_DEVANAGARI_SEED):
        cleaned = cleaned[len(_DEVANAGARI_SEED):].lstrip(" ,।.")

    # Detect repetitive character sequences — a hallmark of Whisper hallucination.
    # Pattern: same short token repeated 4+ times (e.g. "1-1-1-1" or "हाँ हाँ हाँ हाँ")
    hallucination_pattern = re.compile(
        r"(?:^|[\s\-\,])(\S{1,6})(?:[\s\-\,]+\1){3,}",
        re.UNICODE,
    )
    if hallucination_pattern.search(cleaned):
        # Keep only the portion before the hallucination starts
        match = hallucination_pattern.search(cleaned)
        if match and match.start() > 20:   # at least some real content
            cleaned = cleaned[:match.start()].rstrip(" ,-।.")
            print("[whisper] ⚠ Repetition hallucination detected and trimmed.")
        else:
            # Hallucination right at start — return as-is and warn
            print("[whisper] ⚠ Possible hallucination in transcript — consider using --whisper-model small or medium.")

    return cleaned.strip()


def transcribe_audio(audio_path: str, model_size: str = WHISPER_MODEL_SIZE) -> str:
    """
    Transcribe Hindi audio using faster-whisper.
    Falls back to openai-whisper if faster-whisper is not installed.
    Automatically resamples the audio to 16kHz mono WAV using ffmpeg first.
    """
    import subprocess
    import tempfile
    import os

    resampled_path = audio_path
    is_temp = False

    # Automatically resample any input audio to 16kHz mono WAV for optimal ASR quality
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
            segments, info = wmodel.transcribe(
                resampled_path,
                language="hi",
                beam_size=5,
                initial_prompt=_DEVANAGARI_SEED,
                # Don't let initial_prompt propagate across segments (prevents hallucination loops)
                condition_on_previous_text=False,
            )
            detected_lang = info.language
            text = " ".join(seg.text.strip() for seg in segments)

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
            result = wmodel.transcribe(
                resampled_path,
                language="hi",
                fp16=False,
                initial_prompt=_DEVANAGARI_SEED,
                condition_on_previous_text=False,
            )
            detected_lang = result.get("language", "hi")
            text = result["text"].strip()

        print(f"[whisper] Detected language: {detected_lang}")
        return _clean_transcript(text)

    finally:
        # Transparent clean up of resampled temp file
        if is_temp and os.path.exists(resampled_path):
            try:
                os.unlink(resampled_path)
                print("[audio] Cleaned up temporary resampled WAV file.")
            except Exception:
                pass


def translate_with_ollama(
    hindi_text: str,
    model: str = DEFAULT_LLM_MODEL,
) -> dict[str, str]:
    """
    Call Ollama's /api/chat to translate Hindi text into 5 Indian languages.
    Returns a dict: { language_name -> translated_text }.
    """
    lang_list = "\n".join(
        f"* {name}: [{name} translation]" for name in TARGET_LANGUAGES
    )

    prompt = (
        "You are an expert multilingual translator specialising in Indian languages and English.\n"
        "Below is a Hindi text (transcribed from speech). Your task:\n"
        "1. Provide a clean Hindi transcription in Devanagari script (correct any minor ASR errors).\n"
        "2. Translate the text into English, Hinglish (Hindi written in Roman script), Tamil, Telugu, Kannada, Malayalam, and Bengali.\n\n"
        "Return ONLY valid JSON — no markdown, no explanation, just the JSON object:\n\n"
        "{\n"
        '  "Hindi": "<corrected Hindi in Devanagari>",\n'
        '  "English": "<English translation>",\n'
        '  "Hinglish": "<Hinglish translation - e.g. \"namaste, mera naam ankur hai\">",\n'
        '  "Tamil": "<Tamil translation>",\n'
        '  "Telugu": "<Telugu translation>",\n'
        '  "Kannada": "<Kannada translation>",\n'
        '  "Malayalam": "<Malayalam translation>",\n'
        '  "Bengali": "<Bengali translation>"\n'
        "}\n\n"
        f"Hindi text to translate:\n{hindi_text}"
    )

    print(f"[ollama] Sending translation request to '{model}'…")
    t0 = time.time()

    resp = requests.post(
        f"{OLLAMA_BASE_URL}/api/chat",
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json",   # ask Ollama to constrain output to JSON
            "options": {
                "temperature": 0.1,   # very low temp → faithful, structured output
                "num_predict": 2048,  # enough tokens for all languages
            },
        },
        timeout=300,
    )
    elapsed = time.time() - t0

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama API error {resp.status_code}: {resp.text}")

    raw = resp.json()["message"]["content"].strip()
    print(f"[ollama] Response received in {elapsed:.1f}s")

    if not raw:
        print("[warn] Model returned empty response. Check if the model is loaded correctly.")
        return {"raw_response": ""}

    # Robustly extract JSON — strip markdown fences then find outermost { … }
    clean = raw
    if "```" in raw:
        # Strip ```json ... ``` fences
        import re
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if fence_match:
            clean = fence_match.group(1)

    start = clean.find("{")
    end   = clean.rfind("}") + 1
    json_str = clean[start:end] if start != -1 else clean

    try:
        translations = json.loads(json_str)
    except json.JSONDecodeError as exc:
        print(f"[warn] Could not parse JSON ({exc}). Raw output:\n{raw[:500]}")
        translations = {"raw_response": raw}

    return translations


def format_output(translations: dict[str, str], audio_path: str) -> str:
    """Pretty-print the translation results to the terminal."""
    lines = [
        "",
        "━" * 60,
        f"  Audio file  : {audio_path}",
        "━" * 60,
    ]
    for lang, text in translations.items():
        lang_label = TARGET_LANGUAGES.get(lang, lang)
        lines.append(f"\n  {lang_label if lang != 'Hindi' else 'Hindi (हिन्दी) — source'}:")
        lines.append(f"  {text}")
    lines.append("\n" + "━" * 60)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Transcribe Hindi audio → translate to 5 Indian languages via Ollama Gemma 4.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "audio",
        help="Path to the Hindi audio file (WAV, MP3, FLAC, OGG, M4A, …)",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_LLM_MODEL,
        help=f"Ollama model to use for translation (default: {DEFAULT_LLM_MODEL})",
    )
    parser.add_argument(
        "--whisper-model",
        default=WHISPER_MODEL_SIZE,
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help=f"Whisper model size for ASR (default: {WHISPER_MODEL_SIZE})",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional path to save results as JSON (e.g. results.json)",
    )
    parser.add_argument(
        "--transcription-only",
        action="store_true",
        help="Only run ASR transcription — skip translation step.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # ── Validate audio file ──────────────────────────────────────────────
    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"[ERROR] Audio file not found: {audio_path}")
        sys.exit(1)

    # ── Stage 1: Transcription ───────────────────────────────────────────
    print(f"\n{'='*60}")
    print("  Stage 1 / 2 — Hindi ASR (Whisper)")
    print(f"{'='*60}")
    hindi_text = transcribe_audio(str(audio_path), model_size=args.whisper_model)

    print(f"\n[result] Hindi transcription:\n  {hindi_text}\n")

    if args.transcription_only:
        if args.output:
            result = {"audio": str(audio_path), "Hindi": hindi_text}
            Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2))
            print(f"[saved] Transcription saved to {args.output}")
        return

    # ── Stage 2: Translation via Ollama ──────────────────────────────────
    print(f"{'='*60}")
    print(f"  Stage 2 / 2 — Translation (Ollama / {args.model})")
    print(f"{'='*60}")

    # Make sure Ollama is reachable
    if not _check_ollama(args.model):
        print(
            f"[warn] Model '{args.model}' not found in Ollama. Attempting to pull…"
        )
        try:
            _pull_model_if_needed(args.model)
        except Exception as e:
            print(f"[ERROR] {e}")
            print(
                "Make sure Ollama is running:\n"
                "  ollama serve\n"
                "Then pull the model:\n"
                f"  ollama pull {args.model}"
            )
            sys.exit(1)

    translations = translate_with_ollama(hindi_text, model=args.model)

    # ── Print results ────────────────────────────────────────────────────
    print(format_output(translations, str(audio_path)))

    # ── Optionally save JSON ─────────────────────────────────────────────
    if args.output:
        result = {
            "audio": str(audio_path),
            "model": args.model,
            "whisper_model": args.whisper_model,
            "translations": translations,
        }
        output_path = Path(args.output)
        output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"\n[saved] Results saved to {output_path}")


if __name__ == "__main__":
    main()

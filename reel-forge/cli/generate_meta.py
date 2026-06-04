#!/usr/bin/env python3
"""
generate_meta.py
----------------
Calls local Ollama to parse an audio transcript and generate structural metadata
for the video, including hook text, scene segments, key quotes, and call-to-action.
"""

import sys
import argparse
import json
import time
import requests

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma4:e4b"

def get_available_models() -> list:
    """Query local Ollama to fetch all pulled models."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            return [m["name"] for m in resp.json().get("models", [])]
    except Exception:
        pass
    return []

def select_best_model(requested_model: str) -> str:
    """Select the best available model, falling back to any available model if needed."""
    models = get_available_models()
    if not models:
        print("[ollama] Warning: Could not reach Ollama or no models are installed locally.")
        return requested_model

    # Direct match check
    if requested_model in models:
        return requested_model

    # Prefix match check (e.g. gemma4:e4b matching gemma4:e4b-latest)
    req_base = requested_model.split(":")[0]
    for m in models:
        if m.startswith(req_base):
            print(f"[ollama] Requested '{requested_model}' not found, matching to '{m}'")
            return m

    # Fallback to any model containing gemma or llama, otherwise first model
    for m in models:
        if "gemma" in m.lower() or "llama" in m.lower():
            print(f"[ollama] Fallback: using model '{m}'")
            return m

    print(f"[ollama] Fallback: using first available model '{models[0]}'")
    return models[0]

def generate_video_meta(
    transcript: str,
    expert_name: str,
    specialty: str,
    domain: str,
    duration_sec: float,
    model: str = DEFAULT_MODEL,
) -> dict:
    """
    Call local Ollama to generate video metadata from the transcript.
    Returns: { hookText, scenes[], ctaText, hashtags[], title }
    """
    selected_model = select_best_model(model)
    
    prompt = f"""You are a viral social media content strategist.

Given an expert's audio transcript, generate metadata for a 9:16 vertical reel.

RULES:
- hookText: Must be 5-10 words. Pattern: question, surprising stat, or bold claim.
  The hook should NOT be a summary — it should make someone STOP scrolling.
- scenes: Divide the audio into 3-5 logical segments. Each scene gets a label
  and a keyQuote. The keyQuote MUST be a direct, verbatim quote of exact words from the transcript, max 15 words, that is high-impact.
- ctaText: Short, domain-relevant call-to-action.
- The first scene must start at 0s. Scenes must be contiguous (no gaps, the next startSec must equal the previous endSec).
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
    {{ "startSec": 0, "endSec": number, "label": "string", "keyQuote": "string" }}
  ],
  "ctaText": "short call-to-action",
  "hashtags": ["#tag1", "#tag2"],
  "title": "SEO-optimized title"
}}"""

    print(f"[ollama] Generating video metadata via model '{selected_model}'…")
    t0 = time.time()

    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": selected_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json",     # JSON mode constraint
                "options": {
                    "temperature": 0.3,
                    "num_predict": 2048,
                },
            },
            timeout=180,
        )
    except Exception as e:
        raise RuntimeError(f"Failed to connect to Ollama: {e}. Is Ollama running?")

    elapsed = time.time() - t0
    print(f"[ollama] Response received in {elapsed:.1f}s")

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama error {resp.status_code}: {resp.text}")

    raw = resp.json()["message"]["content"].strip()
    
    # Robust JSON extraction
    clean = raw
    if "```" in raw:
        import re
        fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if fence:
            clean = fence.group(1)
    
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"Could not locate JSON object in LLM response: {raw}")
        
    return json.loads(clean[start:end])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate video metadata using Ollama.")
    parser.add_argument("--transcript", required=True, help="Audio transcript text")
    parser.add_argument("--expert", required=True, help="Expert name")
    parser.add_argument("--specialty", required=True, help="Expert specialty")
    parser.add_argument("--domain", required=True, help="Video domain/topic")
    parser.add_argument("--duration", required=True, type=float, help="Audio duration in seconds")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model name")
    args = parser.parse_args()

    try:
        result = generate_video_meta(
            transcript=args.transcript,
            expert_name=args.expert,
            specialty=args.specialty,
            domain=args.domain,
            duration_sec=args.duration,
            model=args.model
        )
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

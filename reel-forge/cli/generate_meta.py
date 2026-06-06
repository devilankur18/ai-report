#!/usr/bin/env python3
"""
generate_meta.py
----------------
Calls local Ollama to parse an audio transcript and generate structural metadata
for the video, including hook text, scene segments, key quotes, and call-to-action.

Phase 6 upgrades:
- Stronger hook patterns using proven viral formulas
- hookStyle recommendation based on transcript tone
- hookEmoji + toneTag output for template personalization
- Better key quote selection criteria (emotionally charged, surprising, actionable)
- Personalized CTA referencing doctor's specialty and content
"""

import sys
import os
import argparse
import json
import time
import requests

OLLAMA_BASE_URL = "http://localhost:11434"
# DEFAULT_MODEL = "gemma4:e4b"
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

    print(requested_model, models)

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

def load_hooks_metadata() -> dict:
    """Load the hook styles catalog from src/templates/_shared/hooks-metadata.json."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    paths = [
        os.path.join(script_dir, "..", "src", "templates", "_shared", "hooks-metadata.json"),
        os.path.join(script_dir, "src", "templates", "_shared", "hooks-metadata.json"),
        "src/templates/_shared/hooks-metadata.json"
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[meta] Error reading hook metadata: {e}")
    
    # Minimal fallback catalog if file not found
    return {
        "zoom-face": {
            "name": "Classic Q&A PIP Card",
            "psychology": "Direct, conversational Q&A. Doctor fills screen.",
            "visual": "Glassmorphic question card in center that zooms to corner."
        }
    }

def generate_video_meta(
    transcript: str,
    expert_name: str,
    specialty: str,
    domain: str,
    duration_sec: float,
    model: str = DEFAULT_MODEL,
    language: str = "en",
    cta_handle: str = "",
    cta_link: str = "",
) -> dict:
    """
    Call local Ollama to generate video metadata from the transcript.
    Returns: { hookText, hookStyle, hookStat, hookEmoji, toneTag, scenes[], ctaText, hashtags[], title }
    """
    selected_model = select_best_model(model)
    hooks_catalog = load_hooks_metadata()

    # Build prompt instructions dynamically
    hook_styles_instructions = ""
    for style_id, info in hooks_catalog.items():
        hook_styles_instructions += f"- \"{style_id}\" ({info['name']}):\n"
        hook_styles_instructions += f"  Psychology: {info['psychology']}\n"
        hook_styles_instructions += f"  Visual Style: {info['visual']}\n\n"

    valid_hook_styles_str = "|".join(hooks_catalog.keys())

    lang_instruction = ""
    clean_lang = language.lower().strip()
    if clean_lang in ["hi", "hindi"]:
        lang_instruction = "IMPORTANT: Generate all visual texts (hookText, ctaText, and keyQuotes) in Hindi using Devanagari script. Translate from the transcript if it is in English/another language."
    elif clean_lang == "hinglish":
        lang_instruction = "IMPORTANT: Generate all visual texts (hookText, ctaText, and keyQuotes) in Hinglish (Hindi written using the Roman/Latin alphabet). Translate from the transcript if it is in English/another language."
    elif clean_lang in ["en", "english"]:
        lang_instruction = "IMPORTANT: Generate all visual texts (hookText, ctaText, and keyQuotes) in English. Translate from the transcript if it is in Hindi/another language."
    else:
        lang_instruction = f"IMPORTANT: Generate all visual texts (hookText, ctaText, and keyQuotes) in {language}. Translate from the transcript if it is in another language."

    cta_context = ""
    if cta_handle:
        cta_context += f"\n- Doctor's social handle: {cta_handle}"
    if cta_link:
        cta_context += f"\n- Booking/website link: {cta_link}"

    prompt = f"""You are a viral social media content strategist who creates Instagram Reels for doctors and medical professionals.

Given a doctor's audio transcript, generate metadata for a high-impact 9:16 vertical reel that stops scrolling.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOOK TEXT RULES (hookText field):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Must be 5-10 words maximum. Short and punchy.
- Must NOT be a summary of the content.
- MUST use ONE of these proven viral patterns:
  * MYTH BUST: "Stop believing this [specialty] myth"
  * SHOCKING STAT: "[Number]% of people get this wrong"
  * FEAR/URGENCY: "You're probably making this mistake right now"
  * QUESTION: "What if your doctor never told you this?"
  * BOLD CLAIM: "This one [domain] habit changed everything"
  * REVELATION: "The truth about [domain] doctors won't tell you"
- The hook should make someone STOP scrolling immediately.
- Do NOT start with "Did you know" — it is overused.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOOK STYLE (hookStyle field):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Choose the best animation style for this content:
{hook_styles_instructions}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE TAG (toneTag field):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classify the overall content tone:
- "educational": Teaching, explaining concepts
- "motivational": Encouraging action or lifestyle change
- "warning": Danger, risk, something to avoid
- "myth-bust": Correcting common misconceptions
- "storytelling": Narrative, case study, personal experience

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENES RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Divide audio into 3-5 logical segments.
- keyQuote MUST be a bulleted list of 2-3 short, actionable, and surprising key takeaways (each 3-6 words, separated by newlines and starting with a bullet '• ') rather than one long sentence.
  * Example format:
    "• Point 1\n• Point 2\n• Point 3"
  * Prefer points that reveal something unexpected, practical, or urgent.
  * Do NOT use trailing commas at the end of the bullet points.
- If target language matches transcript: translate/use terms from the transcript.
- If target language differs: translate the key points.
- First scene starts at 0s, last scene ends at {duration_sec}s. No gaps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAKEAWAYS RULES (takeaways array):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Provide a list of 3-5 key takeaway points distributed across the full video length.
- For each point:
  * "timeSec": The exact time in seconds when this specific point is introduced/discussed in the transcript.
  * "text": A highly patient-relevant, actionable, and non-generic tip/step (3-6 words). Do NOT write filler/junk.
  * Do NOT use trailing commas at the end of the text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CTA TEXT RULES (ctaText field):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Reference this specific content topic, not a generic "follow for tips".
- If handle/link provided, incorporate naturally.
- Short: 8-15 words.{cta_context}

{lang_instruction}

INPUT:
- Transcript: {transcript}
- Expert: {expert_name} ({specialty})
- Domain: {domain}
- Audio duration: {duration_sec}s

Return ONLY valid JSON — no markdown, no explanation:
{{
  "hookText": "5-10 word pattern-interrupt hook",
  "hookStyle": "One of: {valid_hook_styles_str}",
  "hookStat": "e.g. 90% (only if hookStyle is stat-counter, else null)",
  "hookEmoji": "single relevant emoji like 🔥 ⚠️ 💡 🤔 ❤️ 🧪",
  "toneTag": "educational|motivational|warning|myth-bust|storytelling",
  "scenes": [
    {{ "startSec": 0, "endSec": number, "label": "string", "keyQuote": "most impactful direct quote" }}
  ],
  "takeaways": [
    {{ "timeSec": number, "text": "actionable takeaways (3-6 words)" }}
  ],
  "ctaText": "short personalized call-to-action",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "title": "SEO-optimized reel title"
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
                "format": "json",
                "options": {
                    "temperature": 0.4,
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

    result = json.loads(clean[start:end])

    # Normalize hookStat null strings
    if result.get("hookStat") in ["null", "", "none", "None", None]:
        result["hookStat"] = None

    # Ensure hookStyle is a valid value
    valid_hook_styles = set(hooks_catalog.keys())
    if result.get("hookStyle") not in valid_hook_styles:
        result["hookStyle"] = "zoom-face"

    # Ensure toneTag is valid
    valid_tones = {"educational", "motivational", "warning", "myth-bust", "storytelling"}
    if result.get("toneTag") not in valid_tones:
        result["toneTag"] = "educational"

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate video metadata using Ollama.")
    parser.add_argument("--transcript", required=True, help="Audio transcript text")
    parser.add_argument("--expert", required=True, help="Expert name")
    parser.add_argument("--specialty", required=True, help="Expert specialty")
    parser.add_argument("--domain", required=True, help="Video domain/topic")
    parser.add_argument("--duration", required=True, type=float, help="Audio duration in seconds")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model name")
    parser.add_argument("--language", default="en", help="Target output language (e.g. en, hi, hinglish)")
    parser.add_argument("--cta-handle", default="", help="Doctor's social media handle")
    parser.add_argument("--cta-link", default="", help="Doctor's booking/website link")
    args = parser.parse_args()

    try:
        result = generate_video_meta(
            transcript=args.transcript,
            expert_name=args.expert,
            specialty=args.specialty,
            domain=args.domain,
            duration_sec=args.duration,
            model=args.model,
            language=args.language,
            cta_handle=args.cta_handle,
            cta_link=args.cta_link,
        )
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

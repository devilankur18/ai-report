#!/usr/bin/env python3
import sys
import argparse
import requests
import json

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma4:e4b"

def get_available_models() -> list:
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            return [m["name"] for m in resp.json().get("models", [])]
    except Exception:
        pass
    return []

def select_best_model(requested_model: str) -> str:
    models = get_available_models()
    if not models:
        return requested_model

    if requested_model in models:
        return requested_model

    req_base = requested_model.split(":")[0]
    for m in models:
        if m.startswith(req_base):
            return m

    for m in models:
        if "gemma" in m.lower() or "llama" in m.lower():
            return m

    return models[0]

def generate_expert_answer(
    question: str,
    expert_name: str,
    specialty: str,
    domain: str,
    model: str = DEFAULT_MODEL,
    duration: int = 30,
    language: str = "en",
    provider: str = "voicebox"
) -> str:
    selected_model = select_best_model(model)
    
    # Calculate word range based on duration (assuming ~2.1-2.5 words per second)
    min_words = max(15, int(duration * 2.1))
    max_words = int(duration * 2.5)
    
    if language.lower() == "hi":
        if provider.lower() == "lmnt":
            prompt = f"""You are {expert_name}, a {specialty} specializing in {domain}.
Write a natural, friendly, spoken-style answer in Hindi (using Devanagari script) to the following patient question.
This script will be spoken by LMNT (a text-to-speech engine).

GUIDELINES:
1. Write a direct, clear response of {min_words}-{max_words} words in Hindi (targeting a {duration} second spoken duration).
2. Avoid formal/bookish Hindi (like "अतः", "निष्कर्षतः", "समीचीन"). Instead, use conversational Hindi that a doctor would use with a patient (e.g. use "आप", "सकता है", "ध्यान रखें").
3. IMPORTANT: To sound natural on LMNT, insert ellipses (...) at points where a speaker would naturally take a breath or pause for emphasis. E.g. "देखिए... दांतों की सफाई... बहुत जरूरी है।"
4. Use casual, natural conversational fillers where appropriate (e.g. "देखिए...", "तो...", "हम्म...").
5. Do NOT include any intro like "नमस्ते..." or "डॉक्टर के रूप में...". Start directly with the explanation.

QUESTION: {question}

Return ONLY the Hindi spoken response itself — no English translation, no explanations, no prefix, no trailing conversational remarks:"""
        else:
            prompt = f"""You are {expert_name}, a {specialty} specializing in {domain}.
Write a natural, friendly, spoken-style answer in Hindi (using Devanagari script) to the following patient question.

GUIDELINES:
1. Write a direct, clear response of {min_words}-{max_words} words in Hindi (targeting a {duration} second spoken duration).
2. Use conversational Hindi, avoiding heavy/complex medical jargon.
3. Do NOT include any intro. Start directly with the explanation.

QUESTION: {question}

Return ONLY the Hindi spoken response itself:"""
    else:
        if provider.lower() == "voicebox":
            prompt = f"""You are {expert_name}, a {specialty} specializing in {domain}.
Write a natural, friendly, spoken-style answer in English to the following patient question.
The response will be spoken aloud by a Voicebox TTS system.

GUIDELINES:
1. Write a direct, clear response of {min_words}-{max_words} words (targeting a {duration} second spoken duration).
2. Think friendly explanation rather than formal presentation.
3. Use contractions and casual language ("I'll", "don't", "you're").
4. Keep sentences short and clear. Avoid formal transitions like "furthermore" or "in conclusion".
5. Do NOT include any intro. Start directly with the explanation.

QUESTION: {question}

Return ONLY the spoken response itself — no explanations, no prefix, no trailing conversational remarks:"""
        else:
            prompt = f"""You are {expert_name}, a {specialty} specializing in {domain}.
Write a natural, friendly, spoken-style answer to the following patient question.

GUIDELINES:
1. Write a direct, clear response of {min_words}-{max_words} words (targeting a {duration} second spoken duration).
2. Use simple words and short sentences. Avoid dense medical jargon.
3. Do NOT include any intro. Start directly with the explanation.

QUESTION: {question}

Return ONLY the spoken response itself:"""

    print(f"[ollama] Generating answer via model '{selected_model}'… \n {prompt}")
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": selected_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {
                    "temperature": 0.5,
                    "num_predict": 2048,
                },
            },
            timeout=600,
        )
    except Exception as e:
        raise RuntimeError(f"Failed to connect to Ollama: {e}. Is Ollama running?")

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama error {resp.status_code}: {resp.text}")

    answer = resp.json()["message"]["content"].strip()
    # Strip wrapping quotes if any
    if answer.startswith('"') and answer.endswith('"'):
        answer = answer[1:-1].strip()
    elif answer.startswith("'") and answer.endswith("'"):
        answer = answer[1:-1].strip()

    return answer

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate spoken expert answer to a question using Ollama.")
    parser.add_argument("--question", required=True, help="Patient question text")
    parser.add_argument("--expert", required=True, help="Expert name")
    parser.add_argument("--specialty", required=True, help="Expert specialty")
    parser.add_argument("--domain", required=True, help="Domain area")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model name")
    parser.add_argument("--duration", type=int, default=30, help="Target answer duration in seconds")
    parser.add_argument("--language", default="en", help="Language code (e.g. en, hi)")
    parser.add_argument("--provider", default="voicebox", help="Voice synthesis provider (e.g. voicebox, lmnt)")
    parser.add_argument("--output", help="Optional path to write answer text to")
    args = parser.parse_args()

    try:
        answer = generate_expert_answer(
            question=args.question,
            expert_name=args.expert,
            specialty=args.specialty,
            domain=args.domain,
            model=args.model,
            duration=args.duration,
            language=args.language,
            provider=args.provider
        )
        print(f"\n--- Generated Answer ({len(answer.split())} words) ---\n{answer}\n")
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(answer)
            print(f"Answer written to {args.output}")
            
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

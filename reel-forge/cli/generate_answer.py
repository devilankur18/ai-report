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
    model: str = DEFAULT_MODEL
) -> str:
    selected_model = select_best_model(model)
    
    prompt = f"""You are {expert_name}, a {specialty} specializing in {domain}.
Write a natural, friendly, spoken-style answer to the following patient question.

GUIDELINES:
1. Write a direct, clear response of 45-60 words.
2. Use simple words and short sentences. Avoid dense medical jargon; explain things simply so patients feel comforted and informed.
3. Make it sound like a real person talking during a conversation (e.g. "I recommend...", "You should...", "It's best to...").
4. Do NOT include any intro like "As a pathologist..." or "Here is the answer". Start directly with the explanation.

QUESTION: {question}

Return ONLY the spoken response itself — no explanations, no prefix, no trailing conversational remarks:"""

    print(f"[ollama] Generating answer via model '{selected_model}'…")
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
            timeout=90,
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
    parser.add_argument("--output", help="Optional path to write answer text to")
    args = parser.parse_args()

    try:
        answer = generate_expert_answer(
            question=args.question,
            expert_name=args.expert,
            specialty=args.specialty,
            domain=args.domain,
            model=args.model
        )
        print(f"\n--- Generated Answer ({len(answer.split())} words) ---\n{answer}\n")
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(answer)
            print(f"Answer written to {args.output}")
            
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

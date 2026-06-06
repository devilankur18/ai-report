#!/usr/bin/env python3
import sys
import json
import argparse
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent.resolve()))

try:
    from generate_answer import generate_expert_answer
    from synthesize_voice import synthesize_voice
except ImportError as e:
    print(f"[ERROR] Failed to import helper scripts: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Generate dentist answers and preset/cloned female voiceovers for 10 questions.")
    parser.add_argument("--client", default="dr-snigdha-sinha", help="Client ID for voice configuration")
    parser.add_argument("--model", default="gemma4:e4b", help="Ollama model name")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent.resolve()
    
    questions_file = project_root / "cli" / "sample-inputs" / "dental-questions.json"
    if not questions_file.exists():
        print(f"[ERROR] Dental questions file not found at: {questions_file}")
        sys.exit(1)
        
    with open(questions_file, "r", encoding="utf-8") as f:
        all_questions = json.load(f)
        
    # Pick the first 10 questions
    questions_to_generate = all_questions[:10]
    print(f"[dental-samples] Selected {len(questions_to_generate)} questions to process.")
    
    output_dir = project_root / "cli" / "sample-inputs" / "dental"
    preset_dir = output_dir / "preset"
    cloned_dir = output_dir / "cloned"
    
    preset_dir.mkdir(parents=True, exist_ok=True)
    cloned_dir.mkdir(parents=True, exist_ok=True)
    
    qna_list = []
    
    for idx, item in enumerate(questions_to_generate):
        q_num = idx + 1
        question = item["question"]
        print(f"\n==========================================")
        print(f"Processing Question {q_num}/10: {question}")
        print(f"==========================================")
        
        # 1. Generate Dentist Answer via Ollama
        try:
            answer = generate_expert_answer(
                question=question,
                expert_name="Dr. Snigdha Sinha",
                specialty="Pathologist & Dentist Representative",
                domain="Dental Health & Hygiene",
                model=args.model
            )
            print(f"[dental-samples] Generated Answer: {answer}")
        except Exception as e:
            print(f"[ERROR] Failed to generate answer for Q{q_num}: {e}")
            continue
            
        # 2. Synthesize using Preset Voice (Aiden)
        preset_mp3 = preset_dir / f"dental-q{q_num}-preset.mp3"
        try:
            synthesize_voice(
                project_root=project_root,
                client_id=args.client,
                voice_id="standard-aiden",
                text=answer,
                out_mp3=preset_mp3
            )
        except Exception as e:
            print(f"[ERROR] Failed to synthesize preset voice for Q{q_num}: {e}")
            
        # 3. Synthesize using Cloned Voice (Dr. Snigdha Sinha)
        cloned_mp3 = cloned_dir / f"dental-q{q_num}-cloned.mp3"
        try:
            synthesize_voice(
                project_root=project_root,
                client_id=args.client,
                voice_id="cloned-snig",
                text=answer,
                out_mp3=cloned_mp3
            )
        except Exception as e:
            print(f"[ERROR] Failed to synthesize cloned voice for Q{q_num}: {e}")
            
        qna_list.append({
            "question_index": q_num,
            "question": question,
            "answer": answer,
            "preset_audio": f"cli/sample-inputs/dental/preset/dental-q{q_num}-preset.mp3",
            "cloned_audio": f"cli/sample-inputs/dental/cloned/dental-q{q_num}-cloned.mp3"
        })
        
    # Save the Q&As list
    qna_file = output_dir / "dental-qna-results.json"
    with open(qna_file, "w", encoding="utf-8") as f:
        json.dump(qna_list, f, indent=2, ensure_ascii=False)
        
    print(f"\n[dental-samples] ✅ All done! Q&As saved to: {qna_file}")
    print(f"[dental-samples] Preset voices in: {preset_dir}")
    print(f"[dental-samples] Cloned voices in: {cloned_dir}")

if __name__ == "__main__":
    main()

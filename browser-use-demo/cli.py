import asyncio
import sys
import argparse
import logging
import os
from langchain_core.globals import set_debug
from config import get_ollama_models, get_best_default, DEFAULT_MODEL
from browser_agent import BrowserAgentRunner
from dentist_workflow import run_dentist_workflow
from hindi_translate import transcribe_audio, translate_with_ollama, format_output, WHISPER_MODEL_SIZE


# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
# Force browser-use logger to show detailed debug info
logging.getLogger("browser_use").setLevel(logging.DEBUG)

def print_header():
    print("""
==================================================
        🌐 BROWSER-USE + OLLAMA DEMO CLI 🌐
==================================================
    """)

async def run_interactive():
    print_header()
    
    # 1. Detect and choose model
    print("[*] Checking local Ollama API tags for running models...")
    models = get_ollama_models()
    
    selected_model = DEFAULT_MODEL
    if models:
        print("\nAvailable Ollama Models:")
        for idx, m in enumerate(models, start=1):
            print(f"  [{idx}] {m}")
        
        default_model = get_best_default(models)
        print(f"\nRecommended / Default model: {default_model}")
        choice = input(f"Choose a model number [1-{len(models)}] (Press Enter to keep default): ").strip()
        
        if choice.isdigit() and 1 <= int(choice) <= len(models):
            selected_model = models[int(choice) - 1]
        else:
            selected_model = default_model
    else:
        print(f"\n[⚠️] Warning: Could not connect to local Ollama API or no models found.")
        print(f"    Please ensure Ollama is running and has models loaded.")
        print(f"    Proceeding with default configuration model name: '{DEFAULT_MODEL}'")
        selected_model = DEFAULT_MODEL
        
    print(f"\nSelected Model: \033[92m{selected_model}\033[0m")
    
    # 2. Select operation mode
    print("\nWhat would you like to do?")
    print("  [1] Run Google Dentist extraction workflow ('best dentist in naini prayagraj')")
    print("  [2] Run a custom browser automation task")
    print("  [3] Transcribe & Translate Hindi Audio to Multilingual (5 Indian + English/Hinglish)")
    print("  [4] Exit")
    
    op = input("\nEnter choice [1-4] (Default: 1): ").strip()
    if op == "2":
        task = input("\nEnter your custom task description:\n> ").strip()
        if not task:
            print("Task cannot be empty. Exiting.")
            return
        
        runner = BrowserAgentRunner(model_name=selected_model)
        await runner.run_task(task=task, headless=False)
    elif op == "3":
        audio_path = input("\nEnter path to Hindi audio file (e.g., sample_hindi.wav):\n> ").strip()
        if not audio_path:
            print("Audio path cannot be empty.")
            return
        if not os.path.exists(audio_path):
            print(f"Error: File not found at '{audio_path}'")
            return
            
        print("\nChoose Whisper model size:")
        print("  [1] small  (recommended balance of speed & accuracy)")
        print("  [2] base   (fast but lower accuracy)")
        print("  [3] medium (higher accuracy, requires more VRAM/CPU)")
        print("  [4] large-v3 (highest accuracy, slow)")
        
        w_choice = input("Enter choice [1-4] (Default: 1): ").strip()
        w_model = "small"
        if w_choice == "2":
            w_model = "base"
        elif w_choice == "3":
            w_model = "medium"
        elif w_choice == "4":
            w_model = "large-v3"
            
        print("\n" + "="*60)
        print(f"  Stage 1/2 — Hindi ASR (Whisper: {w_model})")
        print("="*60)
        try:
            hindi_text = transcribe_audio(audio_path, model_size=w_model)
            print(f"\n[Result] Hindi transcription:\n  {hindi_text}\n")
            
            print("="*60)
            print(f"  Stage 2/2 — Translation (Ollama: {selected_model})")
            print("="*60)
            translations = translate_with_ollama(hindi_text, model=selected_model)
            print(format_output(translations, audio_path))
        except Exception as e:
            print(f"\n[ERROR] Audio pipeline failed: {e}")
            
    elif op == "4":
        print("Goodbye!")
        sys.exit(0)
    else:
        # Default option 1
        await run_dentist_workflow(model_name=selected_model, headless=False)

def main():
    parser = argparse.ArgumentParser(description="Browser-Use Demo with Ollama")
    parser.add_argument("--model", type=str, help="Ollama model name to use")
    parser.add_argument("--task", type=str, help="Custom task to run directly (skips interactive CLI)")
    parser.add_argument("--workflow", action="store_true", help="Run the dentist workflow directly")
    parser.add_argument("--translate-audio", type=str, help="Path to Hindi audio file to transcribe and translate")
    parser.add_argument("--whisper-model", type=str, default=WHISPER_MODEL_SIZE, choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"], help="Whisper model size to use for transcription")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--debug", action="store_true", help="Enable verbose langchain and agent debugging")
    
    args = parser.parse_args()
    
    if args.debug:
        set_debug(True)
        logging.getLogger("browser_use").setLevel(logging.DEBUG)
    
    if args.task or args.workflow or args.translate_audio:
        # Direct CLI execution
        model = args.model if args.model else DEFAULT_MODEL
        if args.workflow:
            asyncio.run(run_dentist_workflow(model_name=model, headless=args.headless))
        elif args.task:
            runner = BrowserAgentRunner(model_name=model)
            asyncio.run(runner.run_task(task=args.task, headless=args.headless))
        elif args.translate_audio:
            audio_path = args.translate_audio
            if not os.path.exists(audio_path):
                print(f"[ERROR] Audio file not found at '{audio_path}'")
                sys.exit(1)
            print("\n" + "="*60)
            print(f"  Stage 1/2 — Hindi ASR (Whisper: {args.whisper_model})")
            print("="*60)
            hindi_text = transcribe_audio(audio_path, model_size=args.whisper_model)
            print(f"\n[Result] Hindi transcription:\n  {hindi_text}\n")
            
            print("="*60)
            print(f"  Stage 2/2 — Translation (Ollama: {model})")
            print("="*60)
            translations = translate_with_ollama(hindi_text, model=model)
            print(format_output(translations, audio_path))
    else:
        # Interactive mode
        try:
            asyncio.run(run_interactive())
        except KeyboardInterrupt:
            print("\nExiting gracefully. Goodbye!")

if __name__ == "__main__":
    main()

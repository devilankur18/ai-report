import argparse
import subprocess
import os
import sys
import re
from datetime import datetime
import geo_config

def run_single_engine(engine, city, specialty, prompt_override=None):
    # Formulate prompt if not overridden
    if prompt_override:
        prompt = prompt_override
    else:
        prompt = (
            f"My 55-year-old mother is diabetic and experiencing mild chest pain after walking. "
            f"Who are the most reliable {specialty} in {city} with good reviews, and what should I ask them?"
        )

    print("\n" + "="*60)
    print(f" 🧠  GEO PIPELINE - RUNNING ENGINE: {engine.upper()}")
    print("="*60)
    print(f"Target City:      {city}")
    print(f"Target Specialty: {specialty}")
    print(f"Generated Prompt: \"{prompt}\"\n")

    # Locate child scripts relative to this file's directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    engine_dir = os.path.join(base_dir, "geo_engine")
    
    # Specific engine directory structure
    capture_script = os.path.join(engine_dir, engine, "capture.js")
    parser_script = os.path.join(engine_dir, engine, "parser.py")

    def slugify(text):
        text = text.lower()
        text = re.sub(r'[^a-z0-9]+', '_', text)
        text = text.strip('_')
        words = text.split('_')
        if len(words) > 6:
            words = words[:6]
        return '_'.join(words)

    # Generate unique run ID and directory inside geo_engine/outputs
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if prompt_override:
        prompt_slug = slugify(prompt_override)
        dir_name = f"run_{timestamp}_{engine}_{prompt_slug}"
    else:
        city_slug = city.lower().replace(" ", "_") if city else "custom"
        spec_slug = specialty.lower().replace(" ", "_") if specialty else "custom"
        dir_name = f"run_{timestamp}_{engine}_{city_slug}_{spec_slug}"
    
    run_dir = os.path.join(geo_config.OUTPUTS_DIR, dir_name)
    os.makedirs(run_dir, exist_ok=True)
    
    print(f"[✓] Created dynamic outputs directory: outputs/{dir_name}/")

    paths = geo_config.get_run_paths(run_dir)
    raw_stream_file = paths["raw_stream"]
    screenshot_file = paths["screenshot"]
    geo_data_json = paths["geo_data"]
    analysis_report_md = paths["report"]

    # 1. Trigger the stream capture using capture.js inside the engine folder
    print(f"\n--- STEP 1: Launching Network Stream Capture [{engine}] ---")
    capture_cmd = [
        "node",
        capture_script,
        "--prompt", prompt,
        "--city", city,
        "--specialty", specialty,
        "--output", raw_stream_file,
        "--screenshot", screenshot_file
    ]
    
    try:
        # Run node capture script inside the engine directory scope
        result = subprocess.run(capture_cmd, cwd=os.path.dirname(capture_script), check=True)
        if result.returncode != 0:
            print(f"[!] Capture script failed for {engine}.")
            return None
    except subprocess.CalledProcessError as e:
        print(f"[!] Error executing capture.js for {engine}: {e}")
        return None
    except FileNotFoundError:
        print("[!] Error: 'node' command not found. Please ensure Node.js is installed.")
        return None

    # 2. Trigger the stream log parser inside the engine folder
    print(f"\n--- STEP 2: Running Structured Information Extraction [{engine}] ---")
    
    # Use python interpreter from venv if active
    python_bin = sys.executable if sys.executable else "python3"
    parser_cmd = [
        python_bin,
        parser_script,
        run_dir
    ]
    
    try:
        result = subprocess.run(parser_cmd, cwd=os.path.dirname(parser_script), check=True)
        if result.returncode != 0:
            print(f"[!] Parser script failed for {engine}.")
            return None
    except subprocess.CalledProcessError as e:
        print(f"[!] Error executing parser.py for {engine}: {e}")
        return None

    print(f"\n[✓] ENGINE {engine.upper()} RUN SUCCESSFUL!")
    return {
        "engine": engine,
        "run_dir": run_dir,
        "raw_stream": raw_stream_file,
        "screenshot": screenshot_file,
        "geo_data": geo_data_json,
        "report": analysis_report_md
    }

def run_geo_run(engines_list, city, specialty, prompt_override=None):
    results = []
    
    print("\n" + "="*60)
    print(" 🧠  GEO (GENERATIVE ENGINE OPTIMIZATION) MULTI-ENGINE PIPELINE")
    print("="*60)
    print(f"Target Engines:   {', '.join(engines_list)}")
    print(f"Target City:      {city}")
    print(f"Target Specialty: {specialty}")
    print(f"Prompt Override:  {prompt_override if prompt_override else 'None'}")
    print("="*60 + "\n")

    for eng in engines_list:
        res = run_single_engine(eng, city, specialty, prompt_override)
        if res:
            results.append(res)
            
    if not results:
        print("\n[!] All target engine runs failed.")
        return []

    # Print beautiful consolidated summary report
    print("\n" + "="*60)
    print(" 🎉  ALL GEO PIPELINE RUNS COMPLETED SUCCESSFUL!")
    print("="*60)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for r in results:
        print(f"\n 🤖  ENGINE: {r['engine'].upper()}")
        print(f"     📂  Run Directory:    {os.path.relpath(r['run_dir'], base_dir)}")
        print(f"     🗃️  Raw Event Log:    {os.path.relpath(r['raw_stream'], base_dir)}")
        print(f"     📸  Full Screenshot:  {os.path.relpath(r['screenshot'], base_dir)}")
        print(f"     📊  Structured JSON:  {os.path.relpath(r['geo_data'], base_dir)}")
        print(f"     📝  Analysis Report:  {os.path.relpath(r['report'], base_dir)}")
    print("="*60 + "\n")
    return results

def main():
    parser = argparse.ArgumentParser(description="Interactive GEO Search Demand Pipeline CLI")
    parser.add_argument("--city", default="Hardoi", help="Target city (default: Hardoi)")
    parser.add_argument("--specialty", default="heart doctors", help="Medical specialty/practitioner (default: heart doctors)")
    parser.add_argument("--prompt", help="Direct prompt override (ignores city/specialty parameters)")
    parser.add_argument("--engine", default="chatgpt,gemini,google,bing,perplexity,google_maps,bing_maps,practo,justdial,seranking", 
                        help="Target generative search engine(s) as comma-separated list (choices: chatgpt, gemini, google, bing, perplexity, google_maps, bing_maps, practo, justdial, seranking; default: all engines)")

    
    args = parser.parse_args()
    
    # Determine engines to run
    valid_engines = ["chatgpt", "gemini", "google", "bing", "perplexity", "google_maps", "bing_maps", "practo", "justdial", "seranking"]
    requested_engines = [e.strip().lower() for e in args.engine.split(",") if e.strip()]
    
    invalid_engines = [e for e in requested_engines if e not in valid_engines]
    if invalid_engines:
        print(f"[!] Error: Invalid engine(s) specified: {', '.join(invalid_engines)}")
        print(f"    Available valid options: {', '.join(valid_engines)}")
        sys.exit(1)
        
    if not requested_engines:
        print("[!] Error: No search engines specified to run.")
        sys.exit(1)
        
    # Run the dynamic pipeline
    active_results = run_geo_run(requested_engines, args.city, args.specialty, args.prompt)
    
    # Automatically consolidate ONLY the active session runs by default
    if active_results:
        try:
            from geo_engine.consolidator import run_consolidation_for_active_session
            run_consolidation_for_active_session(active_results)
        except Exception as e:
            print(f"[!] Warning: Session run consolidation failed: {e}")

if __name__ == "__main__":
    main()

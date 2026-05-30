import argparse
import subprocess
import os
import sys
from datetime import datetime

def run_geo_run(city, specialty, prompt_override=None):
    # Formulate prompt if not overridden
    if prompt_override:
        prompt = prompt_override
    else:
        prompt = (
            f"My 55-year-old mother is diabetic and experiencing mild chest pain after walking. "
            f"Who are the most reliable {specialty} in {city} with good reviews, and what should I ask them?"
        )

    print("\n" + "="*60)
    print(" 🧠  GEO (GENERATIVE ENGINE OPTIMIZATION) SEARCH DEMAND PIPELINE")
    print("="*60)
    print(f"Target City:      {city}")
    print(f"Target Specialty: {specialty}")
    print(f"Generated Prompt: \"{prompt}\"\n")

    # Locate child scripts relative to this file's directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    engine_dir = os.path.join(base_dir, "geo_engine")
    capture_script = os.path.join(engine_dir, "capture.js")
    parser_script = os.path.join(engine_dir, "parser.py")

    # Generate unique run ID and directory inside geo_engine/outputs
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if prompt_override:
        city_slug = "custom"
        spec_slug = "prompt"
    else:
        city_slug = city.lower().replace(" ", "_") if city else "custom"
        spec_slug = specialty.lower().replace(" ", "_") if specialty else "custom"
    
    run_dir = os.path.join(engine_dir, "outputs", f"run_{timestamp}_{city_slug}_{spec_slug}")
    os.makedirs(run_dir, exist_ok=True)
    
    print(f"[✓] Created dynamic outputs directory: geo_engine/outputs/run_{timestamp}_{city_slug}_{spec_slug}/")

    raw_stream_file = os.path.join(run_dir, "raw_stream.txt")
    geo_data_json = os.path.join(run_dir, "geo_data.json")
    analysis_report_md = os.path.join(run_dir, "geo_analysis_report.md")

    # 1. Trigger the stream capture using capture.js
    print("\n--- STEP 1: Launching Network Stream Capture ---")
    capture_cmd = [
        "node",
        capture_script,
        "--prompt", prompt,
        "--output", raw_stream_file
    ]
    
    try:
        # Run node capture script inside the geo_engine directory scope
        result = subprocess.run(capture_cmd, cwd=engine_dir, check=True)
        if result.returncode != 0:
            print("[!] Capture script failed.")
            return False
    except subprocess.CalledProcessError as e:
        print(f"[!] Error executing capture.js: {e}")
        return False
    except FileNotFoundError:
        print("[!] Error: 'node' command not found. Please ensure Node.js is installed.")
        return False

    # 2. Trigger the stream log parser
    print("\n--- STEP 2: Running Structured Information Extraction ---")
    
    # Use python interpreter from venv if active
    python_bin = sys.executable if sys.executable else "python3"
    parser_cmd = [
        python_bin,
        parser_script,
        run_dir
    ]
    
    try:
        result = subprocess.run(parser_cmd, cwd=engine_dir, check=True)
        if result.returncode != 0:
            print("[!] Parser script failed.")
            return False
    except subprocess.CalledProcessError as e:
        print(f"[!] Error executing parser.py: {e}")
        return False

    print("\n" + "="*60)
    print(" 🎉  GEO PIPELINE RUN SUCCESSFUL!")
    print("="*60)
    print("All extraction artifacts have been compiled:")
    print(f" 📂  Run Directory:    {os.path.relpath(run_dir, base_dir)}")
    print(f" 🗃️  Raw Event Log:    {os.path.relpath(raw_stream_file, base_dir)}")
    print(f" 📊  Structured JSON:  {os.path.relpath(geo_data_json, base_dir)}")
    print(f" 📝  Analysis Report:  {os.path.relpath(analysis_report_md, base_dir)}")
    print("="*60 + "\n")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Interactive GEO Search Demand Pipeline CLI")
    parser.add_argument("--city", default="Hardoi", help="Target city (default: Hardoi)")
    parser.add_argument("--specialty", default="heart doctors", help="Medical specialty/practitioner (default: heart doctors)")
    parser.add_argument("--prompt", help="Direct prompt override (ignores city/specialty parameters)")
    
    args = parser.parse_args()
    
    # Run the dynamic pipeline
    run_geo_run(args.city, args.specialty, args.prompt)

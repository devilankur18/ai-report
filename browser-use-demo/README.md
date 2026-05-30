# 🌐 Browser-Use Demos & GEO Search Demand Engine

A premium, modular toolkit inside `/Users/ankur/dev/docx/ppt/browser-use-demo/` designed for advanced AI web automation, local audio-to-multilingual translation, and Generative Engine Optimization (GEO) reverse-engineering.

---

## 📂 Project Structure

```text
browser-use-demo/
├── cli.py               # 1. Main browser-use Ollama & Audio translation CLI
├── geo_cli.py           # 2. Sequential GEO Search Demand Engine CLI
├── browser_agent.py     # langchain-ollama & browser-use initialization
├── dentist_workflow.py  # Google Search dentist entity extraction
├── hindi_translate.py   # whisper + gemma multi-lingual speech pipeline
├── geo_engine/          # GEO extraction sub-engine
│   ├── capture.js       # Node.js CDP stream aggregator
│   ├── parser.py        # Python stream data analyzer
│   ├── .gitignore       # Excludes outputs/ and Chrome profile caches
│   └── outputs/         # Dynamic, gitignored run directories
└── requirements.txt     # Python environment requirements
```

---

## ⚡ Setup & Prerequisites

### 1. Python Virtual Environment Setup
Ensure your local `.venv` is active and requirements are fully installed:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install
```

### 2. Node.js Setup (For GEO CDP Capture)
Ensure `puppeteer-core` is installed in your workspace directory:
```bash
npm install puppeteer-core
```

---

## 🚀 1. The Interactive browser-use CLI (`cli.py`)

This CLI manages local browser-use agent tasks, automated Google search scrapers, and multi-lingual voice transcription.

### Running in Interactive Mode
Simply run without arguments. The CLI will automatically query your local **Ollama API**, discover running model weights, present a beautiful selection list, and ask which task you'd like to trigger:
```bash
.venv/bin/python cli.py
```

### Direct CLI Usages & Flags

* **Execute Local Dentist Search Scraper**:
  ```bash
  .venv/bin/python cli.py --workflow --model gemma4:e4b
  ```
  *(Automates searching and extracting top-rated dentists in Prayagraj into a clean report)*

* **Run a Custom Browser Task**:
  ```bash
  .venv/bin/python cli.py --task "Go to wikipedia.org, search for 'DeepMind', and print the first heading" --model qwen3:4b
  ```

* **Transcribe and Translate Hindi Audio (Speech-to-Text & Polyglot translation)**:
  ```bash
  .venv/bin/python cli.py --translate-audio "sample_hindi.wav"
  ```
  *(Uses local Whisper to transcribe Hindi audio, then Gemma 4 to translate the transcript into 6 regional Indian languages: Hindi, Bengali, Marathi, Tamil, Telugu, and Kannada)*

* **Select a Specific Whisper Model Size**:
  ```bash
  .venv/bin/python cli.py --translate-audio "sample_hindi.wav" --whisper-model "small"
  ```
  *(Available model weights: `tiny`, `base`, `small`, `medium`, `large-v3`)*

* **Advanced Scraper Flags**:
  - `--headless` : Run browser in background (default is visible/headed).
  - `--debug`    : Enable verbose Playwright action logging.

---

## 🧠 2. GEO (Generative Engine Optimization) CLI (`geo_cli.py`)

This engine connects to your active, logged-in Google Chrome browser, submits a highly conversational patient inquiry to ChatGPT, captures the background network stream event-by-event, and reverse-engineers the search citation, tracking parameters, and ranking algorithm.

### CDP Chrome Setup (Crucial macOS Launch)
Because Chrome blocks remote debugging on default profiles, fully quit Chrome (`Cmd + Q`) and run:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/ankur/dev/docx/ppt/browser-use-demo/chrome_profile"
```

### Direct CLI Usages & Flags

* **Run with Defaults (Hardoi City, Heart Doctors)**:
  ```bash
  .venv/bin/python geo_cli.py
  ```
  *Generates Prompt: "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. Who are the most reliable heart doctors in UP/Hardoi with good reviews, and what should I ask them?"*

* **Run for Custom City & Specialty**:
  ```bash
  .venv/bin/python geo_cli.py --city "Lucknow" --specialty "orthopedicians"
  ```
  *Auto-generates a corresponding conversational medical prompt targeted to Kanpur*

* **Run with Custom Prompt Override**:
  ```bash
  .venv/bin/python geo_cli.py --prompt "Who is the most reliable dentist in Sandila with top ratings?"
  ```

### 🔄 Re-running the Parser on Existing Raw Streams
If you already have a captured `raw_stream.txt` and want to re-run the state-machine parser to update/re-generate the dynamic GEO insights (`geo_data.json` and `geo_analysis_report.md`):

```bash
.venv/bin/python geo_engine/parser.py \
  --input geo_engine/outputs/run_<timestamp>_custom_prompt/raw_stream.txt \
  --json geo_engine/outputs/run_<timestamp>_custom_prompt/geo_data.json \
  --md geo_engine/outputs/run_<timestamp>_custom_prompt/geo_analysis_report.md
```

This runs the precise JSON-Patch log state-machine to compile:
* **Routed Model**: The exact AI version that served the prompt (e.g. `gpt-5-3-mini` or `gpt-5-5`).
* **Rich GMB Performance Metrics**: Dynamically parsed review counts, rating scales, sub-category tags, coordinates, phone numbers, and interactive links.

### Dynamically Generated GEO Artifacts
All run outcomes are compiled under a timestamped directory inside `geo_engine/outputs/` (e.g. `geo_engine/outputs/run_20260531_021329_hardoi_heart_doctors/`):
* 🗃️ **`raw_stream.txt`**: The complete raw Event Stream (SSE data chunks) captured sequentially.
* 📊 **`geo_data.json`**: The structured extraction containing queries translated by the LLM, local entity lists, ratings, coordinates, and citations.
* 📝 **`geo_analysis_report.md`**: A premium report analyzing Prompt-to-Query mapping, outbound attribution tracking (`utm_source=chatgpt.com`), and recommendation logic.

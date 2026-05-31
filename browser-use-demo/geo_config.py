import os

# Root of browser-use-demo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Central outputs directory in browser-use-demo/outputs
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

# File name definitions
RAW_STREAM_FILENAME = "raw_stream.txt"
SCREENSHOT_FILENAME = "screenshot.png"
GEO_DATA_FILENAME = "geo_data.json"
ANALYSIS_REPORT_FILENAME = "geo_analysis_report.md"
SUGGESTIONS_FILENAME = "autocomplete_suggestions.json"

def get_run_paths(run_dir):
    """Returns absolute paths for all output files in a given run directory."""
    return {
        "raw_stream": os.path.join(run_dir, RAW_STREAM_FILENAME),
        "screenshot": os.path.join(run_dir, SCREENSHOT_FILENAME),
        "geo_data": os.path.join(run_dir, GEO_DATA_FILENAME),
        "report": os.path.join(run_dir, ANALYSIS_REPORT_FILENAME),
        "suggestions": os.path.join(run_dir, SUGGESTIONS_FILENAME)
    }

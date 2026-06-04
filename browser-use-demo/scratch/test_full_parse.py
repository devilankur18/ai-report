import sys
import os

# Include paths to import parser
sys.path.append("/Users/ankur/dev/docx/ppt/browser-use-demo")
from geo_engine.meta_ai.parser import parse_meta_ai_logs

run_dir = "/Users/ankur/dev/docx/ppt/browser-use-demo/outputs/run_20260604_030253_meta_ai_naini_prayagraj_dentist"
input_file = os.path.join(run_dir, "raw_stream.txt")
output_json = "/Users/ankur/dev/docx/ppt/browser-use-demo/scratch/test_geo_data.json"
output_md = "/Users/ankur/dev/docx/ppt/browser-use-demo/scratch/test_report.md"

parse_meta_ai_logs(input_file, output_json, output_md)

import json
with open(output_json, "r") as f:
    data = json.load(f)

print("Number of local entities extracted:", len(data["local_entities"]))
print("Entities and their order:")
for i, ent in enumerate(data["local_entities"], 1):
    print(f"{i}. {ent['name']} (Rating: {ent.get('rating')}, Mentioned index: {ent.get('experience')})")

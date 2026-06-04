import json
import re
import os

def test_parse(input_file):
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all decoded payloads
    blocks = re.findall(r'--- Decoded Payload Start ---\r?\n(.*?)\r?\n--- Decoded Payload End ---', content, re.DOTALL)
    print(f"Found {len(blocks)} decoded payload blocks.")
    
    # We want to find objects that look like Meta AI WebSocket response frames.
    # Specifically, they have "response_id", "sections", "seq", etc.
    meta_responses = []
    for block in blocks:
        # Extract JSONs
        decoder = json.JSONDecoder()
        pos = 0
        while True:
            pos = block.find('{', pos)
            if pos == -1:
                break
            try:
                obj, end_idx = decoder.raw_decode(block[pos:])
                if isinstance(obj, dict) and 'response' in obj and 'type' in obj:
                    meta_responses.append(obj)
                pos += end_idx
            except Exception:
                pos += 1
                
    print(f"Found {len(meta_responses)} meta response objects.")
    
    # Sort by seq
    meta_responses.sort(key=lambda x: x.get("seq", 0))
    
    # Find the one with highest seq that has sections
    highest_seq_obj = None
    for obj in reversed(meta_responses):
        resp = obj.get("response", {})
        if "sections" in resp:
            highest_seq_obj = obj
            break
            
    if highest_seq_obj:
        print(f"Highest seq object: {highest_seq_obj.get('seq')}, type: {highest_seq_obj.get('type')}")
        resp = highest_seq_obj.get("response", {})
        sections = resp.get("sections", [])
        print(f"Number of sections: {len(sections)}")
        
        texts = []
        for i, sec in enumerate(sections):
            vm = sec.get("view_model", {})
            primitive = vm.get("primitive", {})
            typename = primitive.get("__typename")
            print(f"Section {i}: {typename}")
            if typename == "GenAIMarkdownTextUXPrimitive":
                t = primitive.get("text", "")
                texts.append(t)
            elif typename == "GenATableUXPrimitive":
                # Convert table to markdown
                rows_md = []
                for row in primitive.get("rows", []):
                    cells = [cell.get("text", "") for cell in row.get("markdown_cells", [])]
                    if not cells:
                        cells = row.get("cells", [])
                    if row.get("is_header"):
                        rows_md.append("| " + " | ".join(cells) + " |")
                        rows_md.append("| " + " | ".join([":---"] * len(cells)) + " |")
                    else:
                        rows_md.append("| " + " | ".join(cells) + " |")
                texts.append("\n".join(rows_md))
        
        full_text = "\n\n".join(texts)
        # Clean inline entity markers like {{IE_0}}...{{/IE_0}}
        full_text_clean = re.sub(r'\{\{IE_\d+\}\}[0-9a-zA-Z_-]*\{\{/IE_\d+\}\}', '', full_text)
        print("--- RECONSTRUCTED TEXT START ---")
        print(full_text_clean[:1000])
        print("...")
        print(full_text_clean[-1000:])
        print("--- RECONSTRUCTED TEXT END ---")
    else:
        print("No meta response object with sections found.")

input_file = "/Users/ankur/dev/docx/ppt/browser-use-demo/outputs/run_20260604_030253_meta_ai_naini_prayagraj_dentist/raw_stream.txt"
test_parse(input_file)

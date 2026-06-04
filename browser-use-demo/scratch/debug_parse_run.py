import sys
import os
import re
import json

sys.path.append("/Users/ankur/dev/docx/ppt/browser-use-demo")
from geo_engine.meta_ai.parser import clean_name, name_key, is_valid_entity, looks_like_provider, clean_url, deduce_category, parse_ws_entities

input_file = "outputs/run_20260604_022705_meta_ai_hardoi_heart_doctors/raw_stream.txt"

with open(input_file, "r", encoding="utf-8") as f:
    content = f.read()

dom_data = {}
dom_marker = "[META AI DOM EXTRACTION RESULTS]"
if dom_marker in content:
    try:
        parts = content.split(dom_marker)[1].strip()
        start_idx = parts.find('{')
        end_idx = parts.rfind('}')
        if start_idx != -1 and end_idx != -1:
            json_part = parts[start_idx:end_idx+1]
            dom_data = json.loads(json_part)
    except Exception:
        pass

from geo_engine.meta_ai.parser import extract_ai_answer_from_ws
ai_answer_text = extract_ai_answer_from_ws(content)
if not ai_answer_text:
    ai_answer_text = dom_data.get("ai_answer", "")

citations = dom_data.get("citations", [])

lines = [l.strip() for l in ai_answer_text.split('\n') if l.strip()]

candidate_blocks = []
i = 0
while i < len(lines):
    line = lines[i]
    is_name_line = False
    provider_name = ""
    details = ""
    for sep in ["—", "–", " - ", ":", ","]:
        if sep in line:
            parts = line.split(sep, 1)
            left = parts[0].strip()
            if looks_like_provider(left):
                is_name_line = True
                provider_name = left
                details = parts[1].strip()
                break
    if is_name_line:
        block_lines = [provider_name + " — " + details]
        i += 1
        while i < len(lines):
            next_line = lines[i]
            next_is_name = False
            for sep in ["—", "–", " - ", ":", ","]:
                if sep in next_line:
                    next_parts = next_line.split(sep, 1)
                    next_left = next_parts[0].strip()
                    if looks_like_provider(next_left):
                        next_is_name = True
                        break
            if next_is_name:
                break
            else:
                block_lines.append(next_line)
                i += 1
        candidate_blocks.append("\n".join(block_lines))
    else:
        i += 1

extracted_entities = []
for item in candidate_blocks:
    first_line = item.split('\n')[0].strip()
    name = first_line
    details = ""
    if "—" in first_line:
        parts = first_line.split("—", 1)
        name = parts[0].strip()
        details = parts[1].strip()
        
    name_clean = clean_name(name)
    details_clean = clean_name(details) if details else ""
    if details_clean:
        details_lower = details_clean.lower()
        if any(w in details_lower for w in ["why it fits", "location", "rating", "review", "experience", "fees", "consultation"]):
            details_clean = ""
        elif len(details_clean) < 3:
            details_clean = ""
            
    # Category deduction
    category = "Healthcare Specialist"
    location = "Hardoi, India"
    rating = "N/A"
    review_count = "N/A"
    phone = "N/A"
    website_url = "N/A"
    for word in ["cardiologist", "cardiology", "dentist", "dental", "orthopedic", "orthopedician", "physician", "doctor", "clinic", "hospital"]:
        if word in item.lower() or word in name.lower() or word in location.lower():
            category = word.capitalize()
            break
            
    # Ignore if name is too short or too long or not related
    print(f"\nChecking candidates for block name: {repr(name)}")
    if len(name) < 3 or len(name) > 100:
        print("  Rejected: len(name) invalid")
        continue
    if any(w in name.lower() for w in ["what locals", "usually do", "how to choose", "next steps", "kanpur", "lucknow"]):
        print("  Rejected: name has location filter words like kanpur/lucknow/next steps")
        continue
        
    candidates = [name_clean]
    if details_clean and is_valid_entity(details_clean):
        # Only add details if it looks like a provider/person name and not a long description sentence
        if looks_like_provider(details_clean) or any(w in details_clean.lower() for w in ["dr.", "dr ", "doctor"]):
            candidates.append(details_clean)
        else:
            print(f"  details_clean '{details_clean}' rejected because it doesn't look like a provider/person")
        
    for cand in candidates:
        if not cand or not is_valid_entity(cand):
            print(f"  cand '{cand}' invalid entity")
            continue
            
        exists = False
        for e in extracted_entities:
            if name_key(e["name"]) == name_key(cand):
                exists = True
                break
        if exists:
            continue
            
        is_clinic = any(w in cand.lower() for w in ["clinic", "hospital", "center", "centre", "care", "lab", "studio", "art", "dental group"])
        is_doc = any(w in category.lower() for w in ["cardiologist", "dentist", "orthopedician", "physician", "doctor"]) and not is_clinic
        has_dr_prefix = "dr." in cand.lower()
        formatted_name = f"Dr. {cand}" if (is_doc and not has_dr_prefix) else cand
        
        entity_dict = {
            "name": formatted_name,
            "category": category,
            "address": location,
            "rating": rating,
            "review_count": review_count,
            "phone": phone,
            "website_url": website_url,
            "consultation_fee": "N/A",
            "experience": "N/A"
        }
        print(f"  Adding to extracted_entities: {formatted_name}")
        extracted_entities.append(entity_dict)

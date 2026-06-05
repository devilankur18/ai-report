import json
import re
import os
import sys

sys.path.append("/Users/ankur/dev/docx/ppt/browser-use-demo")
from geo_engine.meta_ai.parser import clean_name, name_key, is_valid_entity, clean_url, deduce_category, parse_ws_entities

SENTENCE_INDICATORS = [
    "if", "are", "you", "they", "our", "their", "should", "would", "will", "these", 
    "useful", "advises", "always", "after", "before", "when", "why", "who", "where", 
    "how", "what", "more", "has", "have", "had", "was", "were", "been", "is", "a", 
    "an", "the", "check", "ask", "book", "timing", "find", "most", "some", "other", 
    "all", "recommend", "suggest", "best", "good", "reliable", "top", "rated", 
    "option", "options", "first", "second", "third", "fourth", "fifth", "next", 
    "step", "steps", "prioritize", "start", "welcome", "about", "contact", "phone", 
    "address", "rating", "review", "reviews", "stars", "volume", "experience", "fees",
    "during", "visit", "timeline", "healing", "pain", "management", "history", "blood",
    "report", "reports", "consultation", "consultations", "compare", "comparing",
    "treatment", "plan", "plans", "standard", "for", "implants", "referral", "pocket",
    "charting", "written", "separates", "therapy", "placement", "mornings", "usually",
    "less", "rushed", "elderly", "patients", "want", "help", "draft", "questions"
]

def local_looks_like_provider(name):
    name_clean = name.strip()
    words = name_clean.split()
    name_lower = name_clean.lower()
    
    strong_provider_words = ["dr.", "dr", "doctor", "hospital", "clinic", "centre", "center", "dental", "dentist", "specialist"]
    has_strong_word = any(re.search(r'\b' + re.escape(pw) + r'\b', name_lower) or name_lower.startswith("dr") for pw in strong_provider_words)
    
    max_words = 12 if has_strong_word else 5
    if len(words) < 1 or len(words) > max_words:
        return False
        
    for word in SENTENCE_INDICATORS:
        if re.search(r'\b' + re.escape(word) + r'\b', name_lower):
            return False
            
    provider_words = ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "center", "centre", "dental", "dentist", "ortho", "cardio", "specialist", "studio", "medical", "health", "aesthetic", "skin", "lifeplus", "medanta", "regency"]
    if not any(re.search(r'\b' + re.escape(pw) + r'\b', name_lower) or name_lower.startswith("dr") for pw in provider_words):
        return False
        
    return True


def parse_markdown_tables(text):
    tables = []
    lines = text.split('\n')
    current_table = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('|') and stripped.endswith('|'):
            current_table.append(line)
        else:
            if len(current_table) >= 3: # Need at least header, separator, and 1 row
                tables.append(current_table)
            current_table = []
    if len(current_table) >= 3:
        tables.append(current_table)
    return tables

def extract_entities_from_table(table_lines):
    header_line = table_lines[0]
    headers = [c.strip() for c in header_line.split('|')[1:-1]]
    
    name_col_idx = 0
    rating_col_idx = -1
    location_col_idx = -1
    
    for idx, h in enumerate(headers):
        h_lower = h.lower()
        if any(w in h_lower for w in ["clinic", "doctor", "provider", "name", "hospital", "dentist", "specialist"]):
            name_col_idx = idx
        if any(w in h_lower for w in ["rating", "rate", "star", "score"]):
            rating_col_idx = idx
        if any(w in h_lower for w in ["location", "address", "area"]):
            location_col_idx = idx
            
    entities = []
    # Data rows start at index 2 (index 1 is the | --- | --- | divider)
    for line in table_lines[2:]:
        cells = [c.strip() for c in line.split('|')[1:-1]]
        if not cells or len(cells) <= name_col_idx:
            continue
            
        raw_name = cells[name_col_idx]
        if not raw_name:
            continue
            
        candidate_names = []
        for sep in ["—", "–", " - ", "-"]:
            if sep in raw_name:
                parts = raw_name.split(sep)
                for part in parts:
                    part_clean = clean_name(part)
                    if local_looks_like_provider(part_clean):
                        candidate_names.append(part_clean)
                if candidate_names:
                    break
        if not candidate_names:
            c_name = clean_name(raw_name)
            if local_looks_like_provider(c_name):
                candidate_names.append(c_name)
                
        if not candidate_names:
            c_name = clean_name(raw_name)
            if is_valid_entity(c_name):
                candidate_names.append(c_name)
                
        rating = "N/A"
        review_count = "N/A"
        location = "N/A"
        
        if rating_col_idx != -1 and rating_col_idx < len(cells):
            rating_text = cells[rating_col_idx]
        else:
            rating_text = " ".join(cells)
            
        rating_match = re.search(r'\b([1-5]\.\d)\b', rating_text)
        if rating_match:
            rating = rating_match.group(1)
            
        reviews_match = re.search(r'\b(\d+)\s*(?:ratings|reviews|volume)\b', rating_text, re.IGNORECASE)
        if reviews_match:
            review_count = reviews_match.group(1)
            
        if location_col_idx != -1 and location_col_idx < len(cells):
            location = cells[location_col_idx]
            location = re.sub(r'Consultation.*', '', location, flags=re.IGNORECASE).strip()
            location = location.rstrip('.,;:- ')
            if not location:
                location = "N/A"
                
        fee = "N/A"
        fee_match = re.search(r'(?:₹|Rs\.?)\s*(\d+)', " ".join(cells), re.IGNORECASE)
        if fee_match:
            fee = fee_match.group(1)
            
        experience = "N/A"
        exp_match = re.search(r'\b(\d+)\s*(?:years?|yrs?)\b\s*(?:experience|in healthcare)', " ".join(cells), re.IGNORECASE)
        if exp_match:
            experience = exp_match.group(0)
            
        website_url = "N/A"
        row_str = " ".join(cells)
        md_link_match = re.search(r'\[([^\]]+)\]\((https?://[^\)]+)\)', row_str)
        if md_link_match:
            website_url = clean_url(md_link_match.group(2))
        else:
            raw_link_match = re.search(r'https?://[^\s\)]+', row_str)
            if raw_link_match:
                website_url = clean_url(raw_link_match.group(0))
                
        category = "Healthcare Specialist"
        row_lower = row_str.lower()
        for word in ["cardiologist", "cardiology", "dentist", "dental", "orthopedic", "orthopedician", "physician", "doctor", "clinic", "hospital"]:
            if word in row_lower:
                category = word.capitalize()
                if "dentist" in category.lower() or "dental" in category.lower():
                    category = "Dentist"
                break
                
        for name in candidate_names:
            is_clinic = any(w in name.lower() for w in ["clinic", "hospital", "center", "centre", "care", "lab", "studio", "art", "dental group"])
            is_doc = any(w in category.lower() for w in ["cardiologist", "dentist", "orthopedician", "physician", "doctor"]) and not is_clinic
            has_dr_prefix = "dr." in name.lower()
            formatted_name = f"Dr. {name}" if (is_doc and not has_dr_prefix) else name
            
            entities.append({
                "name": formatted_name,
                "category": category,
                "address": location if location != "N/A" else "Hardoi, India",
                "rating": rating,
                "review_count": review_count,
                "phone": "N/A",
                "website_url": website_url,
                "consultation_fee": fee,
                "experience": experience
            })
            
    return entities

def extract_from_blocks(items):
    entities = []
    for item in items:
        if not item.strip():
            continue
        first_line = item.split('\n')[0].strip()
        if first_line.startswith('|'):
            continue
        
        name = first_line
        details = ""
        
        if "—" in first_line:
            parts = first_line.split("—", 1)
            name = parts[0].strip()
            details = parts[1].strip()
        elif "–" in first_line:
            parts = first_line.split("–", 1)
            name = parts[0].strip()
            details = parts[1].strip()
        elif " - " in first_line:
            parts = first_line.split(" - ", 1)
            name = parts[0].strip()
            details = parts[1].strip()
        elif ":" in first_line and not any(w in first_line.lower() for w in ["phone:", "rating:", "address:", "website:"]):
            parts = first_line.split(":", 1)
            name = parts[0].strip()
            details = parts[1].strip()
            
        if len(name) < 3 or len(name) > 100:
            continue
        if any(w in name.lower() for w in ["what locals", "usually do", "how to choose", "next steps", "kanpur", "lucknow"]):
            continue

        name_clean = clean_name(name)
        if name_clean.lower().startswith("dr."):
            name_clean_no_dr = name_clean[3:].strip()
        else:
            name_clean_no_dr = name_clean
            
        name_lower = name_clean.lower().strip()
        garbage_keywords = [
            "location", "reviews", "why it fits", "specialty", "phone", "address", 
            "rating", "experience", "hours", "website", "why it fits for sensitive gums",
            "implant focus", "sensitive gum edge", "area", "rating / reviews",
            "gum health first", "laser assisted surgery", "sedation or shorter appointments",
            "prosthetic options", "practical next step", "carry his medical history", "ask specifically"
        ]
        if name_lower in garbage_keywords or any(name_lower.startswith(gk) for gk in garbage_keywords) or len(name_clean_no_dr) < 3:
            continue

        name_lower_clean = name_clean.lower()
        provider_words = ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "center", "centre", "dental", "dentist", "ortho", "cardio", "specialist", "studio", "medical", "health", "aesthetic", "skin", "lifeplus", "medanta", "regency"]
        if not any(pw in name_lower_clean for pw in provider_words):
            continue

        search_area = "\n".join(item.split('\n')[:3])

        rating = "N/A"
        review_count = "N/A"
        
        rating_match = re.search(r'\b(?:rating|rate|score|⭐|★|stars)\s*([1-5]\.\d)\b', search_area, re.IGNORECASE)
        if not rating_match:
            rating_match = re.search(r'\b([1-5]\.\d)\s*(?:stars|★|⭐|/5|out of 5)\b', search_area, re.IGNORECASE)
            
        if rating_match:
            rating = rating_match.group(1).strip()
            
        for line in search_area.split('\n'):
            line_lower = line.lower()
            if any(w in line_lower[:25] for w in ["rating", "reviews", "ratings", "score", "★", "⭐"]):
                reviews_match = re.search(r'\b(\d+)\s*(?:ratings|reviews)', line, re.IGNORECASE)
                if reviews_match:
                    review_count = reviews_match.group(1).strip()
                    break

        phone = "N/A"
        phone_match = re.search(r'(?:Phone|Contact|Mobile|WhatsApp):\s*([0-9\s-]+)', search_area, re.IGNORECASE)
        if phone_match:
            phone = phone_match.group(1).strip()
        else:
            num_match = re.search(r'\b(?:0\d{10}|\d{10}|\+91\s*\d{10})\b', search_area)
            if num_match:
                phone = num_match.group(0).strip()

        location = "Hardoi, India"
        if details:
            location = details
        else:
            addr_match = re.search(r'(?:Location|Address):\s*([^\n]+)', search_area, re.IGNORECASE)
            if addr_match:
                location = addr_match.group(1).strip()

        category = "Healthcare Specialist"
        for word in ["cardiologist", "cardiology", "dentist", "dental", "orthopedic", "orthopedician", "physician", "doctor", "clinic", "hospital"]:
            if word in item.lower() or word in name.lower() or word in location.lower():
                category = word.capitalize()
                if "dentist" in category.lower() or "dental" in category.lower():
                    category = "Dentist"
                break

        website_url = "N/A"
        md_link_match = re.search(r'\[([^\]]+)\]\((https?://[^\)]+)\)', item)
        if md_link_match:
            website_url = clean_url(md_link_match.group(2))
        else:
            raw_link_match = re.search(r'https?://[^\s\)]+', item)
            if raw_link_match:
                website_url = clean_url(raw_link_match.group(0))

        name_clean = clean_name(name)
        details_clean = clean_name(details) if details else ""
        
        if details_clean:
            details_lower = details_clean.lower()
            if any(w in details_lower for w in ["why it fits", "location", "rating", "review", "experience", "fees", "consultation"]):
                details_clean = ""
            elif len(details_clean) < 3:
                details_clean = ""
                
        candidates = [name_clean]
        if details_clean and is_valid_entity(details_clean):
            if local_looks_like_provider(details_clean) or any(w in details_clean.lower() for w in ["dr.", "dr ", "doctor"]):
                candidates.append(details_clean)
            
        for cand in candidates:
            if not cand or not is_valid_entity(cand) or not local_looks_like_provider(cand):
                continue
                
            is_clinic = any(w in cand.lower() for w in ["clinic", "hospital", "center", "centre", "care", "lab", "studio", "art", "dental group"])
            is_doc = any(w in category.lower() for w in ["cardiologist", "dentist", "orthopedician", "physician", "doctor"]) and not is_clinic
            has_dr_prefix = "dr." in cand.lower()
            formatted_name = f"Dr. {cand}" if (is_doc and not has_dr_prefix) else cand
            
            entities.append({
                "name": formatted_name,
                "category": category,
                "address": location,
                "rating": rating,
                "review_count": review_count,
                "phone": phone,
                "website_url": website_url,
                "consultation_fee": "N/A",
                "experience": "N/A"
            })
            
    return entities

def extract_from_flat_text(ai_answer_text):
    lines = [l.strip() for l in ai_answer_text.split('\n') if l.strip()]
    candidate_blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('|'):
            i += 1
            continue
        is_name_line = False
        provider_name = ""
        details = ""
        for sep in ["—", "–", " - ", ":", ","]:
            if sep in line:
                parts = line.split(sep, 1)
                left = parts[0].strip()
                if local_looks_like_provider(left):
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
                        if local_looks_like_provider(next_left):
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
    return extract_from_blocks(candidate_blocks)

def parse_meta_ai_logs_hybrid(input_file):
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
    if not ai_answer_text:
        ai_answer_text = ""

    
    # 1. Parse tables
    tables = parse_markdown_tables(ai_answer_text)
    table_entities = []
    for table in tables:
        table_entities.extend(extract_entities_from_table(table))
        
    # 2. Parse numbered lists
    num_items = re.split(r'\n\s*(?:#+\s*)?(?:\*\*|)\d+[\.\)]\s*(?:\*\*|)?', '\n' + ai_answer_text)
    num_entities = extract_from_blocks(num_items[1:])
    
    # 3. Parse bulleted lists
    bullet_items = re.split(r'\n\s*[-*•]\s+', '\n' + ai_answer_text)
    bullet_entities = extract_from_blocks(bullet_items[1:])
    
    # 4. Parse flat text
    flat_entities = extract_from_flat_text(ai_answer_text)
    
    # Combine all
    all_extracted = table_entities + num_entities + bullet_entities + flat_entities
    
    # WS Sniffed
    ws_entities = parse_ws_entities(content)
    for ent in ws_entities:
        ent["category"] = deduce_category(ent["name"], ent.get("address", "") + " " + ent.get("experience", ""))
        all_extracted.append(ent)
        
    # Merge using name_key
    merged_entities = {}
    for ent in all_extracted:
        k = name_key(ent["name"])
        if not k:
            continue
        if k not in merged_entities:
            ent["name"] = clean_name(ent["name"])
            merged_entities[k] = ent
        else:
            existing = merged_entities[k]
            # Merge fields
            if (existing.get("address") == "N/A" or len(existing.get("address", "")) < 5) and ent.get("address") != "N/A":
                existing["address"] = ent["address"]
            if existing.get("rating") == "N/A" and ent.get("rating") != "N/A":
                existing["rating"] = ent["rating"]
            if existing.get("review_count") == "N/A" and ent.get("review_count") != "N/A":
                existing["review_count"] = ent["review_count"]
            if existing.get("phone") == "N/A" and ent.get("phone") != "N/A":
                existing["phone"] = ent["phone"]
            if existing.get("website_url") == "N/A" and ent.get("website_url") != "N/A":
                existing["website_url"] = ent["website_url"]
            if existing.get("consultation_fee") == "N/A" and ent.get("consultation_fee") != "N/A":
                existing["consultation_fee"] = ent["consultation_fee"]
            if existing.get("experience") == "N/A" and ent.get("experience") != "N/A":
                existing["experience"] = ent["experience"]
                
    # Keep only valid entities
    final_entities = []
    for ent in merged_entities.values():
        if is_valid_entity(ent["name"]) and local_looks_like_provider(ent["name"]):
            if ent.get("phone") and ent["phone"] != "N/A":
                ent["phone"] = ent["phone"].replace(" ", "").strip()
            final_entities.append(ent)
            
    # Sort strictly by the order of mention in the AI answer text
    def find_mention_index(name, text):
        if not text or not name:
            return -1
        name_lower = name.lower()
        text_lower = text.lower()
        pos = text_lower.find(name_lower)
        if pos != -1:
            return pos
        clean = name_lower.replace("dr. ", "").replace("dr ", "").replace("doctor ", "").strip()
        if len(clean) >= 4:
            pos = text_lower.find(clean)
            if pos != -1:
                return pos
        return -1

    def get_sort_key(ent):
        mention_idx = find_mention_index(ent["name"], ai_answer_text)
        is_mentioned = 0 if mention_idx != -1 else 1
        mention_pos = mention_idx if mention_idx != -1 else 999999
        return (is_mentioned, mention_pos)
        
    final_entities.sort(key=get_sort_key)
    return final_entities

files = [
    "/Users/ankur/dev/docx/ppt/browser-use-demo/outputs/run_20260604_072024_meta_ai_hardoi_dentist/raw_stream.txt",
    "/Users/ankur/dev/docx/ppt/browser-use-demo/outputs/run_20260604_022705_meta_ai_hardoi_heart_doctors/raw_stream.txt",
    "/Users/ankur/dev/docx/ppt/browser-use-demo/outputs/run_20260604_030253_meta_ai_naini_prayagraj_dentist/raw_stream.txt"
]

for input_file in files:
    print(f"\n=====================================")
    print(f"RUNNING ON: {os.path.basename(os.path.dirname(input_file))}")
    print(f"=====================================")
    entities = parse_meta_ai_logs_hybrid(input_file)
    print("EXTRACTED ENTITIES:")
    for idx, ent in enumerate(entities, 1):
        print(f"{idx}. {ent['name']} | Category: {ent.get('category')} | Address: {ent.get('address')} | Rating: {ent.get('rating')} | Reviews: {ent.get('review_count')} | Website: {ent.get('website_url')} | Fee: {ent.get('consultation_fee')} | Exp: {ent.get('experience')}")

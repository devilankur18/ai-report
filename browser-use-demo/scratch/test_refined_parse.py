import json
import re
import os
import sys

BLACKLIST = [
    "review", "rating", "customer", "question", "page", "list of", 
    "best dentist", "highlight", "book appointment", "frequently asked", 
    "select a surgeon", "skip to", "dental treatment", "skin treatment", 
    "specialist", "our happy", "information", "how to choose", 
    "next steps", "usually do", "what locals", "implants", "rct root canal",
    "frequently asked question", "reviews & ratings", "our happy customers",
    "skip to main content", "operatory", "unknown", "unconfirmed",
    "unidentified", "patient", "obserer", "assistant", "get quick",
    "responses", "less than", "minutes", "hours", "24 hours"
]

def clean_url(url):
    if not url or not isinstance(url, str):
        return None
    url = url.replace('\\n', '').replace('\\t', '').replace('\\r', '')
    for artifact in ['\\u200', '\\u201', '\\u202', 'ue200', 'ue201', 'ue202', '\\']:
        url = url.replace(artifact, '')
    url = url.rstrip(')]}*#.,;:!?% \t\n\r')
    return url

def clean_name(name):
    # Remove bracketed stuff
    name = re.sub(r'【.*?】', '', name)
    name = name.replace("**", "").replace("*", "").strip()
    
    # Strip leading "Dr. ", "Dr ", "Doctor "
    has_dr = False
    name_stripped = name
    for prefix in ["Dr. ", "Dr ", "Doctor "]:
        if name_stripped.lower().startswith(prefix.lower()):
            name_stripped = name_stripped[len(prefix):].strip()
            has_dr = True
            break
            
    # Strip numbering prefixes like "1. ", "2. ", "1) ", "1 - ", etc.
    name_stripped = re.sub(r'^(?:\d+[\.\)]\s*|-|\d+\s*-\s*)', '', name_stripped).strip()
    
    # Strip leading "Dr. ", "Dr ", "Doctor " again just in case it was "1. Dr. ..."
    for prefix in ["Dr. ", "Dr ", "Doctor "]:
        if name_stripped.lower().startswith(prefix.lower()):
            name_stripped = name_stripped[len(prefix):].strip()
            has_dr = True
            break

    # Strip trailing location suffixes
    suffixes = [
        r'\s+in\s+Naini.*',
        r'\s+in\s+Allahabad.*',
        r'\s+in\s+Prayagraj.*',
        r'\s+-\s+Justdial.*',
        r'\s+-\s+Practo.*',
        r'\s+near\s+.*',
        r'\s+Allahabad.*',
        r'\s+Prayagraj.*',
        r'\s+Naini.*',
    ]
    for suf in suffixes:
        name_stripped = re.sub(suf, '', name_stripped, flags=re.IGNORECASE)
        
    # Strip trailing address components starting with comma
    name_stripped = re.sub(r',\s*(?:station|road|colony|nagar|mandi|near|park|sweet|triveni|ada|naini|prayagraj|allahabad).*', '', name_stripped, flags=re.IGNORECASE)
        
    name_stripped = re.sub(r'\s+', ' ', name_stripped).strip()
    
    if has_dr:
        name_stripped = "Dr. " + name_stripped
            
    return name_stripped

def name_key(name):
    n = clean_name(name).lower()
    for prefix in ["dr. ", "dr ", "dr.", "doctor "]:
        if n.startswith(prefix):
            n = n[len(prefix):]
            break
    return re.sub(r'[^a-z0-9]', '', n)

def is_valid_entity(name):
    if len(name) < 4:
        return False
    name_lower = name.lower()
    for word in BLACKLIST:
        if word in name_lower:
            return False
    return True

import sys
sys.path.append("/Users/ankur/dev/docx/ppt/browser-use-demo")
from geo_engine.meta_ai.parser import parse_ws_entities, extract_ai_answer_from_ws, deduce_category


def find_mention_index(name, text):
    if not text or not name:
        return -1
    name_lower = name.lower()
    text_lower = text.lower()
    
    # 1. Direct substring match of full name
    pos = text_lower.find(name_lower)
    if pos != -1:
        return pos
        
    # 2. Cleaned name match (without Dr. prefix)
    clean = name_lower.replace("dr. ", "").replace("dr ", "").replace("doctor ", "").strip()
    if len(clean) >= 4:
        pos = text_lower.find(clean)
        if pos != -1:
            return pos
            
    # 3. For name with "&" or "and", check parts
    if " & " in clean or " and " in clean:
        parts = re.split(r'\s+(?:&|and)\s+', clean)
        for part in parts:
            part = part.strip()
            if len(part) >= 4:
                pos = text_lower.find(part)
                if pos != -1:
                    return pos
                    
    # 4. Try matching first two words of the name if name is long
    words = clean.split()
    if len(words) >= 2:
        two_words = " ".join(words[:2])
        if len(two_words) >= 5:
            pos = text_lower.find(two_words)
            if pos != -1:
                return pos
                
    # 5. Check individual distinctive doctor name parts
    if name_lower.startswith("dr.") or name_lower.startswith("dr "):
        doc_name = name_lower.replace("dr.", "").replace("dr", "").strip()
        parts = doc_name.split()
        for p in parts:
            if len(p) >= 4 and p not in ["kumar", "singh", "sharma", "clinic", "hospital", "dental"]:
                for prefix in ["dr. ", "dr "]:
                    pos = text_lower.find(prefix + p)
                    if pos != -1:
                        return pos
                        
    return -1


def parse_with_refinement(input_file):
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt
    original_prompt = "Unknown Prompt"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    search_query = None
    query_match = re.search(r"SEARCH_QUERY:\s*(.+)\n", content)
    if query_match:
        search_query = query_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "Meta AI (Llama 3 / Llama 3.1)",
        "search_queries": [],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Dom extraction fallback data
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

    ai_answer_text = extract_ai_answer_from_ws(content)
    if not ai_answer_text:
        ai_answer_text = dom_data.get("ai_answer", "")
        
    citations = dom_data.get("citations", [])
    search_queries = dom_data.get("search_queries", [])

    if search_queries:
        extracted_data["search_queries"] = search_queries
    if search_query and search_query not in extracted_data["search_queries"]:
        extracted_data["search_queries"].append(search_query)

    all_urls = set()
    url_to_title = {}
    for cit in citations:
        url = clean_url(cit.get("url"))
        title = cit.get("title", "").strip()
        if url:
            all_urls.add(url)
            if title:
                url_to_title[url] = title

    lines = [l.strip() for l in ai_answer_text.split('\n') if l.strip()]
    has_bullets = any(re.match(r'^\s*[-*•]\s+', l) for l in ai_answer_text.split('\n'))
    
    candidate_blocks = []
    if has_bullets:
        items = re.split(r'\n\s*[-*•]\s+', ai_answer_text)
        for item in items[1:]:
            candidate_blocks.append(item)
    else:
        # Flat text format
        i = 0
        while i < len(lines):
            line = lines[i]
            is_name_line = False
            sep = None
            if "—" in line:
                sep = "—"
            elif " - " in line:
                sep = " - "
            if sep:
                parts = line.split(sep, 1)
                left = parts[0].strip().lower()
                if any(w in left for w in ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "lifeplus", "center", "centre", "medanta", "regency"]):
                    is_name_line = True
            if is_name_line:
                block_lines = [line]
                i += 1
                while i < len(lines):
                    next_line = lines[i]
                    next_is_name = False
                    next_sep = None
                    if "—" in next_line:
                        next_sep = "—"
                    elif " - " in next_line:
                        next_sep = " - "
                    if next_sep:
                        next_parts = next_line.split(next_sep, 1)
                        next_left = next_parts[0].strip().lower()
                        if any(w in next_left for w in ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "lifeplus", "center", "centre", "medanta", "regency"]):
                            next_is_name = True
                    if next_is_name:
                        break
                    else:
                        block_lines.append(next_line)
                        i += 1
                candidate_blocks.append("\n".join(block_lines))
            else:
                i += 1

    for item in candidate_blocks:
        first_line = item.split('\n')[0].strip()
        name = first_line
        details = ""
        if "—" in first_line:
            parts = first_line.split("—", 1)
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
            
        # Filter details keys and garbage blocks
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

        rating = "N/A"
        review_count = "N/A"
        search_area = "\n".join(item.split('\n')[:3])
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
                break

        website_url = "N/A"
        for cit in citations:
            url = clean_url(cit.get("url"))
            title = cit.get("title", "")
            if url:
                name_slug = name_clean.lower().replace(" ", "-")
                if name_clean.lower() in title.lower() or name_slug in url.lower():
                    website_url = url
                    break
        
        if website_url == "N/A":
            md_link_match = re.search(r'\[([^\]]+)\]\((https?://[^\)]+)\)', item)
            if md_link_match:
                website_url = clean_url(md_link_match.group(2))

        if name_clean and not any(e["name"] == name_clean or e["name"] == f"Dr. {name_clean}" for e in extracted_data["local_entities"]):
            is_doc = any(w in category.lower() for w in ["cardiologist", "dentist", "orthopedician", "physician", "doctor"])
            has_dr_prefix = "dr." in name.lower()
            formatted_name = f"Dr. {name_clean}" if (is_doc and not has_dr_prefix) else name_clean
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
            extracted_data["local_entities"].append(entity_dict)

    ws_entities = parse_ws_entities(content)
    combined_entities = []
    for ent in extracted_data["local_entities"]:
        combined_entities.append(ent)
    for ent in ws_entities:
        ent["category"] = deduce_category(ent["name"], ent.get("address", "") + " " + ent.get("experience", ""))
        combined_entities.append(ent)
        
    merged_entities = {}
    for ent in combined_entities:
        k = name_key(ent["name"])
        if not k:
            continue
        if k not in merged_entities:
            ent["name"] = clean_name(ent["name"])
            merged_entities[k] = ent
        else:
            existing = merged_entities[k]
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
                
    final_entities = []
    for ent in merged_entities.values():
        if is_valid_entity(ent["name"]):
            if ent.get("phone") and ent["phone"] != "N/A":
                ent["phone"] = ent["phone"].replace(" ", "").strip()
            final_entities.append(ent)
            
    print("\n--- Sort Key Details ---")
    for ent in final_entities:
        mention_idx = find_mention_index(ent["name"], ai_answer_text)
        is_mentioned = 0 if mention_idx != -1 else 1
        mention_pos = mention_idx if mention_idx != -1 else 999999
        r = ent.get("rating", "N/A")
        try:
            rating_val = float(r)
        except ValueError:
            rating_val = 0.0
        print(f"Name: {ent['name']}, is_mentioned: {is_mentioned}, mention_pos: {mention_pos}, rating: {rating_val}")
        
    def get_hybrid_sort_key(ent):
        mention_idx = find_mention_index(ent["name"], ai_answer_text)
        is_mentioned = 0 if mention_idx != -1 else 1
        mention_pos = mention_idx if mention_idx != -1 else 999999
        
        r = ent.get("rating", "N/A")
        try:
            rating_val = float(r)
        except ValueError:
            rating_val = 0.0
            
        return (is_mentioned, mention_pos, -rating_val)
            
    final_entities.sort(key=get_hybrid_sort_key)
    return final_entities

run_dir = "/Users/ankur/dev/docx/ppt/browser-use-demo/outputs/run_20260604_030253_meta_ai_naini_prayagraj_dentist"
input_file = os.path.join(run_dir, "raw_stream.txt")
entities = parse_with_refinement(input_file)

print("Number of local entities extracted:", len(entities))
print("Entities and their order:")
for i, ent in enumerate(entities, 1):
    print(f"{i}. {ent['name']} (Rating: {ent.get('rating')}, Mentioned index: {ent.get('experience')})")

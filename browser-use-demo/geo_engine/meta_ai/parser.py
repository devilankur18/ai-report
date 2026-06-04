import json
import re
import os
import argparse
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import geo_config

def clean_url(url):
    if not url or not isinstance(url, str):
        return None
    url = url.replace('\\n', '').replace('\\t', '').replace('\\r', '')
    for artifact in ['\\u200', '\\u201', '\\u202', 'ue200', 'ue201', 'ue202', '\\']:
        url = url.replace(artifact, '')
    url = url.rstrip(')]}*#.,;:!?% \t\n\r')
    return url

import base64

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


def extract_jsons(text_repr):
    decoder = json.JSONDecoder()
    pos = 0
    extracted = []
    while True:
        pos = text_repr.find('{', pos)
        if pos == -1:
            break
        try:
            obj, end_idx = decoder.raw_decode(text_repr[pos:])
            extracted.append(obj)
            pos += end_idx
        except Exception:
            pos += 1
    return extracted

def deduce_category(name, text_context):
    c = "Healthcare Specialist"
    for word in ["cardiologist", "cardiology", "dentist", "dental", "orthopedic", "orthopedician", "physician", "doctor", "clinic", "hospital"]:
        if word in name.lower() or word in text_context.lower():
            c = word.capitalize()
            if "dentist" in c.lower() or "dental" in c.lower():
                return "Dentist"
            if "cardiolog" in c.lower():
                return "Cardiologist"
            if "orthoped" in c.lower():
                return "Orthopedician"
            return c
    return c

def parse_ws_entities(content):
    all_jsons = []
    
    # 1. Parse block-based decoded payloads
    blocks = re.findall(r'--- Decoded Payload Start ---\r?\n(.*?)\r?\n--- Decoded Payload End ---', content, re.DOTALL)
    for block in blocks:
        all_jsons.extend(extract_jsons(block))
        
    # 2. Parse line-based payloads (for backward compatibility or single-line variants)
    for line in content.split('\n'):
        payload = None
        if 'DecodedPayload:' in line:
            text_repr = line.split('DecodedPayload:', 1)[1].strip()
            all_jsons.extend(extract_jsons(text_repr))
            continue
            
        if 'Base64Payload:' in line:
            payload = line.split('Base64Payload:')[1].strip().split('...')[0].strip()
        elif 'Payload:' in line and 'WS_FRAME' in line:
            payload = line.split('Payload:')[1].strip()
            
        if payload:
            try:
                data = base64.b64decode(payload)
                text_repr = data.decode('utf-8', errors='replace')
                all_jsons.extend(extract_jsons(text_repr))
            except Exception:
                pass
                
    extracted_entities = []
    
    for obj in all_jsons:
        if not isinstance(obj, dict) or 'text' not in obj:
            continue
            
        t = obj['text']
        if not t:
            continue
            
        if '<POST>' in t:
            posts = t.split('<POST>')
            for post in posts[1:]:
                post_content = post.split('</POST>')[0]
                
                url_match = re.search(r'<url>(https?://[^<]+)</url>', post_content)
                url = url_match.group(1).strip() if url_match else "N/A"
                
                people_match = re.search(r'<people>([^<]+)</people>', post_content)
                locations_match = re.search(r'<locations>([^<]+)</locations>', post_content)
                summary_match = re.search(r'<narrative>([^<]+)</narrative>', post_content)
                
                people_text = people_match.group(1).strip() if people_match else ""
                locations_text = locations_match.group(1).strip() if locations_match else ""
                summary_text = summary_match.group(1).strip() if summary_match else ""
                
                people_text_clean = people_text.replace('&amp;', '&')
                names = []
                for p in re.split(r',|;', people_text_clean):
                    p_clean = re.sub(r'\(.*?\)', '', p).strip()
                    if p_clean and any(w in p_clean.lower() for w in ["dr.", "dr ", "doctor"]):
                        if not p_clean.lower().startswith("dr"):
                            p_clean = "Dr. " + p_clean
                        names.append(p_clean)
                
                locations_text_clean = locations_text.replace('&amp;', '&')
                clinic_name = "N/A"
                for loc in re.split(r',|;', locations_text_clean):
                    loc_clean = loc.strip()
                    if loc_clean and any(w in loc_clean.lower() for w in ["clinic", "hospital", "centre", "center", "studio", "care"]):
                        clinic_name = loc_clean
                        break
                
                phone = "N/A"
                phone_match = re.search(r'\b(?:0\d{10}|\d{10}|\+91\s*\d{10})\b', post_content + " " + summary_text)
                if phone_match:
                    phone = phone_match.group(0).strip()
                
                address = "N/A"
                for part in re.split(r',|;', locations_text_clean):
                    part_clean = part.strip()
                    if any(w in part_clean.lower() for w in ["naini", "prayagraj", "allahabad"]):
                        address = locations_text_clean.strip()
                        break
                
                for name in names:
                    if is_valid_entity(name):
                        extracted_entities.append({
                            "name": name,
                            "category": "Dentist",
                            "address": address if address != "N/A" else locations_text.strip(),
                            "rating": "N/A",
                            "review_count": "N/A",
                            "phone": phone,
                            "website_url": url,
                            "consultation_fee": "N/A",
                            "experience": "N/A"
                        })
                
                if clinic_name != "N/A" and not any(name_key(clinic_name) == name_key(name) for name in names):
                    if is_valid_entity(clinic_name):
                        extracted_entities.append({
                            "name": clinic_name,
                            "category": "Dental Clinic",
                            "address": address if address != "N/A" else locations_text.strip(),
                            "rating": "N/A",
                            "review_count": "N/A",
                            "phone": phone,
                            "website_url": url,
                            "consultation_fee": "N/A",
                            "experience": "N/A"
                        })

        lines = []
        for l in t.split('\n'):
            l = l.strip()
            l_clean = re.sub(r'^L\d+:\s*', '', l).strip()
            lines.append(l_clean)

        if 'justdial.com' in t:
            for i, line in enumerate(lines):
                if line.startswith('## '):
                    name = line.replace('## ', '').strip()
                    rating = "N/A"
                    reviews = "N/A"
                    address = "N/A"
                    fee = "N/A"
                    phone = "N/A"
                    experience = "N/A"
                    
                    for j in range(i + 1, min(i + 15, len(lines))):
                        l_next = lines[j]
                        if l_next.startswith('## '):
                            break
                        if l_next.startswith('- '):
                            val = l_next.replace('- ', '').strip()
                            if re.match(r'^[1-5]\.\d$', val):
                                rating = val
                            elif 'Rating' in val or 'Review' in val:
                                reviews = val.split()[0]
                            elif re.match(r'^\d{10}$', val) or re.match(r'^0\d{10}$', val):
                                phone = val
                        elif 'Consultation Fees:' in l_next:
                            fee = l_next.replace('Consultation Fees:', '').replace('₹', '').strip()
                        elif 'Consultation Fee' in l_next:
                            if j + 2 < len(lines) and '₹' in lines[j+2]:
                                fee = lines[j+2].replace('₹', '').strip()
                        elif 'Year of Experience' in l_next or 'Years in Healthcare' in l_next:
                            if 'Years in Healthcare' in l_next:
                                experience = l_next
                            elif j + 2 < len(lines) and 'Years in Healthcare' in lines[j+2]:
                                experience = lines[j+2]
                        elif re.search(r'\b(?:0\d{10}|\d{10}|\+91\s*\d{10})\b', l_next):
                            m = re.search(r'\b(?:0\d{10}|\d{10}|\+91\s*\d{10})\b', l_next)
                            phone = m.group(0)
                        elif 'Plot' in l_next or 'Naini' in l_next or 'Road' in l_next or 'Town' in l_next or 'ADA' in l_next or 'Gali' in l_next:
                            if address == "N/A" or len(l_next) > len(address):
                                address = l_next
                    
                    if name and is_valid_entity(name):
                        extracted_entities.append({
                            "name": name,
                            "category": "Dentist",
                            "address": address,
                            "rating": rating,
                            "review_count": reviews,
                            "phone": phone,
                            "website_url": "N/A",
                            "consultation_fee": fee,
                            "experience": experience
                        })
            
            for i, line in enumerate(lines):
                if '†justdial.com】' in line or '†practo.com】' in line:
                    match = re.search(r'【\d+†([^†]+)', line)
                    if match:
                        full_title = match.group(1)
                        name_parts = re.split(r'\s+in\s+Naini|\s+-\s+|\s+near\s+', full_title, flags=re.IGNORECASE)
                        name = name_parts[0].strip()
                        
                        url = "N/A"
                        url_match = re.search(r'\((https?://[^\)]+)\)', line)
                        if url_match:
                            url = url_match.group(1)
                            
                        rating = "N/A"
                        reviews = "N/A"
                        address = "N/A"
                        phone = "N/A"
                        fee = "N/A"
                        experience = "N/A"
                        
                        for j in range(i + 1, min(i + 15, len(lines))):
                            l_next = lines[j]
                            if '†' in l_next or '【' in l_next or l_next.startswith('* '):
                                break
                            if re.match(r'^[1-5]\.\d$', l_next):
                                rating = l_next
                            elif 'Ratings' in l_next or 'Reviews' in l_next:
                                parts = l_next.split()
                                if parts:
                                    reviews = parts[0]
                            elif 'Plot' in l_next or 'ADA Road' in l_next or 'Triveni Nagar' in l_next or 'Hanuman Nagar' in l_next or 'Tagore Town' in l_next:
                                address = l_next
                            elif 'Years in Healthcare' in l_next:
                                experience = l_next
                            elif 'Consultation Fees:' in l_next:
                                fee = l_next.replace('Consultation Fees:', '').replace('₹', '').strip()
                        
                        if name and is_valid_entity(name):
                            extracted_entities.append({
                                "name": name,
                                "category": "Dentist",
                                "address": address,
                                "rating": rating,
                                "review_count": reviews,
                                "phone": phone,
                                "website_url": url,
                                "consultation_fee": fee,
                                "experience": experience
                            })

        if 'practo.com' in t:
            for i, line in enumerate(lines):
                match_practo = re.search(r'【\d+†(Dr\.[^】]+)】', line)
                if match_practo:
                    name = match_practo.group(1).strip()
                    category = "Dentist"
                    experience = "N/A"
                    fee = "N/A"
                    rating = "N/A"
                    reviews = "N/A"
                    address = "N/A"
                    phone = "N/A"
                    url = "N/A"
                    
                    url_match = re.search(r'\((https?://[^\)]+)\)', line)
                    if url_match:
                        url = url_match.group(1)
                        
                    for j in range(i + 1, min(i + 10, len(lines))):
                        l_next = lines[j]
                        if '†' in l_next or '【' in l_next:
                            break
                        if 'years experience' in l_next:
                            experience = l_next
                        elif 'Consultation fee' in l_next:
                            fee_match = re.search(r'₹?(\d+)', l_next)
                            if fee_match:
                                fee = fee_match.group(1)
                    
                    if name and is_valid_entity(name):
                        extracted_entities.append({
                            "name": name,
                            "category": category,
                            "address": address,
                            "rating": rating,
                            "review_count": reviews,
                            "phone": phone,
                            "website_url": url,
                            "consultation_fee": fee,
                            "experience": experience
                        })
                        
    return extracted_entities

def extract_ai_answer_from_ws(content):
    # Find all decoded payloads
    blocks = re.findall(r'--- Decoded Payload Start ---\r?\n(.*?)\r?\n--- Decoded Payload End ---', content, re.DOTALL)
    
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
        resp = highest_seq_obj.get("response", {})
        sections = resp.get("sections", [])
        
        texts = []
        for sec in sections:
            vm = sec.get("view_model", {})
            primitive = vm.get("primitive", {})
            typename = primitive.get("__typename")
            if typename == "GenAIMarkdownTextUXPrimitive":
                t = primitive.get("text", "")
                if t:
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
                if rows_md:
                    texts.append("\n".join(rows_md))
        
        full_text = "\n\n".join(texts)
        # Clean inline entity markers like {{IE_0}}5758689546352144013{{/IE_0}}
        full_text_clean = re.sub(r'\{\{IE_\d+\}\}.*?\{\{/IE_\d+\}\}', '', full_text)
        return full_text_clean
    return None

SENTENCE_INDICATORS = ["if", "are", "you", "they", "our", "their", "should", "would", "will", "these", "useful", "advises", "always", "after", "before", "when", "why", "who", "where", "how", "what", "more", "has", "have", "had", "was", "were", "been", "is", "a", "an", "the"]

def looks_like_provider(name):
    name_clean = name.strip()
    words = name_clean.split()
    if len(words) < 1 or len(words) > 5:
        return False
        
    name_lower = name_clean.lower()
    for word in SENTENCE_INDICATORS:
        if re.search(r'\b' + re.escape(word) + r'\b', name_lower):
            return False
            
    provider_words = ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "center", "centre", "dental", "dentist", "ortho", "cardio", "specialist", "studio", "medical", "health", "aesthetic", "skin", "lifeplus", "medanta", "regency"]
    if not any(re.search(r'\b' + re.escape(pw) + r'\b', name_lower) or name_lower.startswith("dr") for pw in provider_words):
        return False
        
    return True

def parse_meta_ai_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Meta AI log from {input_file} for GEO insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt from file header
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

    # Look for [META AI DOM EXTRACTION RESULTS] in raw stream log
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
            else:
                print("[!] Could not find JSON braces in Meta AI DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON DOM extraction portion: {e}")

    # Try WebSocket reconstruction first, fall back to DOM
    ai_answer_text = extract_ai_answer_from_ws(content)
    if not ai_answer_text:
        print("[!] WebSocket reconstruction did not yield an answer text. Falling back to DOM extraction.")
        ai_answer_text = dom_data.get("ai_answer", "")
        
    citations = dom_data.get("citations", [])
    search_queries = dom_data.get("search_queries", [])

    # Populate Search Queries
    if search_queries:
        extracted_data["search_queries"] = search_queries
    
    if search_query and search_query not in extracted_data["search_queries"]:
        extracted_data["search_queries"].append(search_query)
        
    if not extracted_data["search_queries"]:
        if original_prompt and original_prompt != "Unknown Prompt":
            extracted_data["search_queries"].append(original_prompt[:80] + "...")

    all_urls = set()
    url_to_title = {}

    def get_fallback_title(url):
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "")
            parts = domain.split(".")
            if len(parts) > 1:
                domain = parts[0]
            return domain.capitalize() + " Article"
        except Exception:
            return "Web Resource"

    # Gather URLs from structured citations list
    for cit in citations:
        url = clean_url(cit.get("url"))
        title = cit.get("title", "").strip()
        if url:
            all_urls.add(url)
            if title:
                url_to_title[url] = title

    # Gather general URLs inside text
    url_pattern = re.compile(r'https?://[^\s"\'\}]+')
    if ai_answer_text:
        overview_urls = url_pattern.findall(ai_answer_text)
        for url in overview_urls:
            # Decode meta link wrapper in text links
            if 'l.meta.ai/?u=' in url:
                try:
                    from urllib.parse import urlparse, parse_qs, unquote
                    parsed = urlparse(url)
                    real_u = parse_qs(parsed.query).get('u')
                    if real_u:
                        url = real_u[0]
                except Exception:
                    pass
            cleaned = clean_url(url)
            if cleaned and "meta.ai" not in cleaned:
                all_urls.add(cleaned)

    # Walk local entities from text content
    # We can handle numbered lists, bullet points, and flat text format
    lines = [l.strip() for l in ai_answer_text.split('\n') if l.strip()]
    has_bullets = any(re.match(r'^\s*[-*•]\s+', l) for l in ai_answer_text.split('\n'))
    has_md_numbers = any(re.match(r'^\s*#+\s*\d+[\.\)]', l) for l in ai_answer_text.split('\n'))
    has_std_numbers = any(re.match(r'^\s*(?:\*\*|)\d+[\.\)]', l) for l in ai_answer_text.split('\n'))
    
    candidate_blocks = []
    if has_md_numbers:
        # Split by markdown header numbered list items (e.g. ## 1., ### 1.)
        items = re.split(r'\n\s*#+\s*\d+[\.\)]\s*(?:\*\*|)?', '\n' + ai_answer_text)
        for item in items[1:]:
            candidate_blocks.append(item)
    elif has_std_numbers:
        # Split by standard numbered list items
        items = re.split(r'\n\s*(?:\*\*|)\d+[\.\)]\s*(?:\*\*|)?', '\n' + ai_answer_text)
        for item in items[1:]:
            candidate_blocks.append(item)
    elif has_bullets:
        items = re.split(r'\n\s*[-*•]\s+', ai_answer_text)
        for item in items[1:]:
            candidate_blocks.append(item)

    else:
        # Flat text format. Let's group name lines with their subsequent descriptive lines!
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Find the best split point for a provider name
            is_name_line = False
            provider_name = ""
            details = ""
            
            # Try different separators
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
                # Group this line and any subsequent lines until the next provider name line
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

    for item in candidate_blocks:
        # Get first line of block as the header containing name and location
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
            
        # Ignore if name is too short or too long or not related
        if len(name) < 3 or len(name) > 100:
            continue
        if any(w in name.lower() for w in ["what locals", "usually do", "how to choose", "next steps"]):
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

        # Check if the name looks like a provider entity
        name_lower_clean = name_clean.lower()
        provider_words = ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "center", "centre", "dental", "dentist", "ortho", "cardio", "specialist", "studio", "medical", "health", "aesthetic", "skin", "lifeplus", "medanta", "regency"]
        if not any(pw in name_lower_clean for pw in provider_words):
            continue


        
        # Extract ratings, reviews, phone, and address from the first 3 lines of the block to prevent matching trailing paragraphs
        search_area = "\n".join(item.split('\n')[:3])

        # Extract ratings and reviews
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

        # Extract phone
        phone = "N/A"
        phone_match = re.search(r'(?:Phone|Contact|Mobile|WhatsApp):\s*([0-9\s-]+)', search_area, re.IGNORECASE)
        if phone_match:
            phone = phone_match.group(1).strip()
        else:
            num_match = re.search(r'\b(?:0\d{10}|\d{10}|\+91\s*\d{10})\b', search_area)
            if num_match:
                phone = num_match.group(0).strip()

        # Extract address / location
        location = "Hardoi, India"
        if details:
            location = details
        else:
            addr_match = re.search(r'(?:Location|Address):\s*([^\n]+)', search_area, re.IGNORECASE)
            if addr_match:
                location = addr_match.group(1).strip()

        # Specialty / Category deduction
        category = "Healthcare Specialist"
        for word in ["cardiologist", "cardiology", "dentist", "dental", "orthopedic", "orthopedician", "physician", "doctor", "clinic", "hospital"]:
            if word in item.lower() or word in name.lower() or word in location.lower():
                category = word.capitalize()
                break

        # Website matching from citations
        website_url = "N/A"
        for cit in citations:
            url = clean_url(cit.get("url"))
            title = cit.get("title", "")
            if url:
                name_slug = name_clean.lower().replace(" ", "-")
                if name_clean.lower() in title.lower() or name_slug in url.lower():
                    website_url = url
                    break
        
        # Inline link fallback
        if website_url == "N/A":
            md_link_match = re.search(r'\[([^\]]+)\]\((https?://[^\)]+)\)', item)
            if md_link_match:
                website_url = clean_url(md_link_match.group(2))
            else:
                raw_link_match = re.search(r'https?://[^\s\)]+', item)
                if raw_link_match:
                    website_url = clean_url(raw_link_match.group(0))

        # Extracted candidates from the block header
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
            if looks_like_provider(details_clean) or any(w in details_clean.lower() for w in ["dr.", "dr ", "doctor"]):
                candidates.append(details_clean)
            
        for cand in candidates:
            if not cand or not is_valid_entity(cand):
                continue
                
            # Check if this candidate or f"Dr. {cand}" is already in local_entities
            exists = False
            for e in extracted_data["local_entities"]:
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
            extracted_data["local_entities"].append(entity_dict)

    # 4. Integrate WebSocket Sniffed Entities
    ws_entities = parse_ws_entities(content)
    combined_entities = []
    
    # Add DOM entities first (which are the text-extracted ones!)
    for ent in extracted_data["local_entities"]:
        combined_entities.append(ent)
        
    # Add WS entities
    for ent in ws_entities:
        ent["category"] = deduce_category(ent["name"], ent.get("address", "") + " " + ent.get("experience", ""))
        combined_entities.append(ent)
        
    # Keep track of keys extracted from the AI answer text to filter and order
    text_name_keys = set()
    ordered_keys = []
    for ent in extracted_data["local_entities"]:
        k = name_key(ent["name"])
        if k and k not in text_name_keys:
            text_name_keys.add(k)
            ordered_keys.append(k)
            
    merged_entities = {}
    for ent in combined_entities:
        k = name_key(ent["name"])
        if not k or k not in text_name_keys:
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
                
    final_entities = []
    for ent in merged_entities.values():
        if is_valid_entity(ent["name"]):
            if ent.get("phone") and ent["phone"] != "N/A":
                ent["phone"] = ent["phone"].replace(" ", "").strip()
            final_entities.append(ent)
            
    # Sort strictly by the order of extraction from the AI answer text
    def get_strict_sort_key(ent):
        k = name_key(ent["name"])
        if k in ordered_keys:
            return ordered_keys.index(k)
        return 999999
        
    final_entities.sort(key=get_strict_sort_key)
    extracted_data["local_entities"] = final_entities

    # Sort and classify outbound URLs
    for url in sorted(all_urls):
        if "meta.ai" in url:
            continue
        
        title = url_to_title.get(url) or get_fallback_title(url)
        cit_obj = {"title": title, "url": url}

        if "utm_" in url:
            if not any(u["url"] == url for u in extracted_data["utm_sources"]):
                extracted_data["utm_sources"].append(cit_obj)
        else:
            if not any(c["url"] == url for c in extracted_data["web_citations"]):
                extracted_data["web_citations"].append(cit_obj)

    # Save structured geo_data.json
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured GEO Data saved to: {output_json}")

    # Generate Markdown report
    entity_rows = []
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent.get("rating", "N/A")
            reviews = ent.get("review_count", "N/A")
            phone = ent.get("phone", "N/A")
            fee = ent.get("consultation_fee", "N/A")
            exp = ent.get("experience", "N/A")
            website_url = ent.get("website_url", "N/A")
            website_md = f"[Link]({website_url})" if website_url != "N/A" else "N/A"
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {fee} | {exp} | {website_md} |")
    else:
        entity_rows.append("| *None* | No local entities extracted | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |")

    citations_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["web_citations"][:15]]) if extracted_data["web_citations"] else "* No web citations found."
    utm_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["utm_sources"]]) if extracted_data["utm_sources"] else "* No UTM-tagged sources found."

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report [Meta AI]
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Routed Model (AI Brain)**: `{extracted_data["routed_model"]}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: Meta AI converts conversational prompts into target search tasks. To compete in Meta AI, optimizing for local content aggregates and social profiles (like Instagram) is key!

---

## 2. Structured Entity Extraction (The Conversational Recommendations)

Meta AI synthesized recommendations based on web resources. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location | Rating | Reviews | Phone | Fee | Exp | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **Meta AI Optimization**: The model cites medical authority pages (e.g. Eka Care, Practo) and local business indexes (Justdial) to construct its doctor directory context.

---

## 3. Web Citations & Outbound Sources (The GA4 Goldmine)

Meta AI cites trustworthy sources directly within the answer text and right sidebar.

### Outbound Citations & Resources:
{citations_list}

### Safe Outbound URLs with Hardcoded UTMs:
{utm_list}

> [!WARNING]
> **Meta Referrals**: Outbound referral traffic is highly direct. Citations drive high click-through rates since users actively verify references. Track conversational conversion metrics!

---

## 4. Algorithmic Recommendation Prediction Model

Based on this extraction trace, Meta AI's recommendation flow behaves as follows:

```mermaid
graph TD
    A[Human Prompt] --> B(Meta AI Query Translation)
    B --> C[Retrieve Local Business Directories & Eka Care Links]
    C --> D[Identify Location Signals & Ratings]
    D --> E[Synthesize Citations into Answer Bullet Points]
    E --> F[Generate Inline Citation References]
    F --> G[Unified Conversational Response Presentation]
    G --> H[Final Answer UI Output]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted GEO Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Meta AI log parser")
    parser.add_argument("dir", nargs="?", help="Path to the run directory containing raw_stream.txt")
    parser.add_argument("--input", help="Path to input raw stream text file")
    parser.add_argument("--json", help="Path to output structured json file")
    parser.add_argument("--md", help="Path to output markdown report")
    args = parser.parse_args()
    
    if args.dir:
        paths = geo_config.get_run_paths(args.dir)
        input_file = paths["raw_stream"]
        output_json = paths["geo_data"]
        output_md = paths["report"]
    else:
        if not args.input or not args.json or not args.md:
            parser.error("Must specify either the run directory as a positional argument, or all three of --input, --json, and --md")
        input_file = args.input
        output_json = args.json
        output_md = args.md
        
    parse_meta_ai_logs(input_file, output_json, output_md)

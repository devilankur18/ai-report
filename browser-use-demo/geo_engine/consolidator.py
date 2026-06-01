import os
import json
import re
import sys
from datetime import datetime

# Setup path so it can import geo_config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import geo_config

STOP_WORDS = {
    'my', '55yearold', 'mother', 'is', 'diabetic', 'and', 'experiencing', 'mild', 'chest', 'pain',
    'after', 'walking', 'who', 'are', 'the', 'most', 'reliable', 'with', 'good', 'reviews', 'what',
    'should', 'i', 'ask', 'them', 'for', 'in', 'of', 'to', 'a', 'an', 'at', 'by', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'so', 'if'
}

CHANNEL_MAP = {
    "chatgpt": "AI Apps",
    "gemini": "AI Apps",
    "perplexity": "AI Apps",
    "google": "Search Apps",
    "bing": "Search Apps",
    "google_maps": "Maps Apps",
    "bing_maps": "Maps Apps",
    "practo": "Directories",
    "justdial": "Directories"
}

CHANNEL_ICONS = {
    "chatgpt": "💬",
    "gemini": "✦",
    "perplexity": "𐄂",
    "google": "🔍",
    "bing": "🔎",
    "google_maps": "📍",
    "bing_maps": "🗺️",
    "practo": "🩺",
    "justdial": "JD"
}

PREFERRED_ENGINE_ORDER = [
    "chatgpt", "gemini", "perplexity",
    "google", "bing",
    "google_maps", "bing_maps",
    "practo", "justdial"
]

def sort_engines(engine_list):
    """Sorts the engines in the preferred order requested by the user."""
    order = {name: i for i, name in enumerate(PREFERRED_ENGINE_ORDER)}
    return sorted(engine_list, key=lambda e: order.get(e, 999))

def get_badge_class(c_type):
    """Returns the CSS badge class for a given channel type."""
    if c_type == "AI Apps":
        return "pill-ai"
    elif c_type == "Search Apps":
        return "pill-search"
    elif c_type == "Maps Apps":
        return "pill-map"
    else:
        return "pill-dir"

def clean_unicode_bold(text):
    """Translates mathematical bold/italic unicode characters (often used by engines) to plain standard ASCII."""
    if not text:
        return ""
    out = []
    for c in text:
        o = ord(c)
        # Mathematical Bold Capital A-Z
        if 0x1D400 <= o <= 0x1D419:
            out.append(chr(o - 0x1D400 + 65))
        # Mathematical Bold Lowercase a-z
        elif 0x1D41A <= o <= 0x1D433:
            out.append(chr(o - 0x1D41A + 97))
        # Mathematical Sans-Serif Bold Capital A-Z
        elif 0x1D5D4 <= o <= 0x1D5ED:
            out.append(chr(o - 0x1D5D4 + 65))
        # Mathematical Sans-Serif Bold Lowercase a-z
        elif 0x1D5EE <= o <= 0x1D607:
            out.append(chr(o - 0x1D5EE + 97))
        # Mathematical Italic Capital A-Z
        elif 0x1D434 <= o <= 0x1D44D:
            out.append(chr(o - 0x1D434 + 65))
        # Mathematical Italic Lowercase a-z
        elif 0x1D44E <= o <= 0x1D467:
            out.append(chr(o - 0x1D44E + 97))
        # Bold Italic Capital A-Z
        elif 0x1D468 <= o <= 0x1D481:
            out.append(chr(o - 0x1D468 + 65))
        # Bold Italic Lowercase a-z
        elif 0x1D482 <= o <= 0x1D49B:
            out.append(chr(o - 0x1D482 + 97))
        else:
            out.append(c)
    return "".join(out)

def slugify(text):
    """Converts a string to a clean alphanumeric snake_case token for consistent HTML IDs."""
    if not text:
        return ""
    text = text.lower()
    text = clean_unicode_bold(text)
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def is_image_url(url):
    """Checks if a given citation URL points to an image file, is a data URI, or is from an image domain."""
    if not url:
        return False
    url_lower = url.lower()
    
    # 1. Check data URIs
    if url_lower.startswith('data:image/'):
        return True
        
    # 2. Check standard image extensions on clean URL
    clean_url = url.split('?')[0].split('#')[0].lower()
    image_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.ico')
    if clean_url.endswith(image_extensions):
        return True
        
    # 3. Check known image host patterns / path substrings (like openai images or search engine image CDN urls)
    if 'images.openai.com' in url_lower:
        return True
    if '/static-rsc-' in url_lower:  # Common image resource prefix
        return True
    if 'googleusercontent.com' in url_lower and '/p/' in url_lower:  # Google local/business photo paths
        return True
    if 'lh3.googleusercontent.com' in url_lower or 'lh5.googleusercontent.com' in url_lower:
        return True
        
    # 4. Fallback check for general image domains / paths
    if 'images.' in url_lower or '/images/' in url_lower:
        # Exclude standard web pages just in case
        if not clean_url.endswith(('.html', '.htm', '.php', '.aspx', '.jsp')):
            return True
            
    return False

def normalize_entity_name(name):
    """Cleans a provider's name by removing unicode stylings, prefixes, punctuation, and suffixes for deduplication."""
    if not name:
        return ""
    # Clean bold unicode script
    name = clean_unicode_bold(name)
    # Remove text in parentheses (like Manipal Dental Clinic)
    name = re.sub(r'\(.*?\)', '', name)
    # Convert to lowercase
    name = name.lower()
    # Strip common titles
    name = re.sub(r'\b(dr\.?|doctor|prof\.?|professor|dentist|orthopedic|surgeon)\b', '', name)
    # Remove punctuation
    name = re.sub(r'[^\w\s]', ' ', name)
    # Strip common commercial suffixes
    name = re.sub(r'\b(clinic|hospital|dental\s+care|ortho\s+clinic|centre|center|care|nursing\s+home)\b', '', name)
    return ' '.join(name.split())

def match_entities(name1, name2):
    """Determines if two entity names refer to the same provider using token-set overlap."""
    clean1 = normalize_entity_name(name1)
    clean2 = normalize_entity_name(name2)
    
    tokens1 = set(clean1.split())
    tokens2 = set(clean2.split())
    
    if not tokens1 or not tokens2:
        return False
        
    intersection = tokens1.intersection(tokens2)
    smaller_len = min(len(tokens1), len(tokens2))
    
    # 75% overlap of tokens or substring inclusion for matching
    if smaller_len == 0:
        return False
    overlap_ratio = len(intersection) / smaller_len
    
    if overlap_ratio >= 0.70:
        return True
        
    # Check if one full name is inside another (e.g. " CP Gupta " and " CP Gupta - Best Ortho ")
    if len(clean1) > 4 and len(clean2) > 4:
        if clean1 in clean2 or clean2 in clean1:
            return True
            
    return False

def get_topic_key(prompt):
    """Extracts a unique, stable, normalized search intent topic key from a prompt string."""
    # Clean string
    text = prompt.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    words = text.split()
    
    # Filter out stop words and numbers (except ages)
    keywords = []
    for w in words:
        # Ignore numbers unless they are adjacent to target terms
        if w.isdigit():
            continue
        if len(w) > 2 and w not in STOP_WORDS:
            keywords.append(w)
            
    # Fallback to general slug if no keywords left
    if not keywords:
        return "general_search"
        
    # Keep up to 5 core keywords sorted alphabetically for matching stability
    keywords = sorted(list(set(keywords)))[:5]
    return "_".join(keywords)

def get_beautiful_topic_title(prompt, key):
    """Generates a premium title from a prompt based on its keywords and city/specialty extraction."""
    # Look for patterns like "... dentist in Patna ..."
    match_city = re.search(r'\b(in|at|near)\s+([a-zA-Z\s]+?)\b(with|and|who|what|$)', prompt, re.IGNORECASE)
    match_specialty = re.search(r'\b(reliable|best|top)\s+([a-zA-Z\s]+?)\s+(in|at|near)\b', prompt, re.IGNORECASE)
    
    city = ""
    specialty = ""
    
    if match_city:
        city = match_city.group(2).strip().title()
    if match_specialty:
        specialty = match_specialty.group(2).strip().title()
        
    # Fallback parsing using keywords
    if not city or not specialty:
        words = [w.title() for w in key.split("_")]
        # Standard format
        if len(words) >= 2:
            return " ".join(words)
        return "Unified GEO Audit Report"
        
    return f"{city} {specialty}"
        
def format_json_to_ui(parsed_json, engine):
    """Generates premium metadata and content HTML components from the geo_data JSON object."""
    if not parsed_json or not isinstance(parsed_json, dict):
        return ("<p class='no-data'>No metadata extracted.</p>", "<p class='no-data'>No structured data extracted.</p>")
        
    meta_html = []
    content_html = []
    
    # 1. Model & Query Metadata
    routed_model = parsed_json.get("routed_model", "Unknown Model")
    search_invoked = parsed_json.get("search_invoked", False)
    queries = parsed_json.get("search_queries", [])
    
    meta_html.append('<div class="ui-section">')
    meta_html.append('  <div class="ui-meta-card">')
    meta_html.append(f'    <div class="ui-meta-row"><strong>🤖 Routed Model:</strong> <span>{routed_model}</span></div>')
    meta_html.append(f'    <div class="ui-meta-row"><strong>🌐 Search Triggered:</strong> <span>{"Yes ✅" if search_invoked else "No ❌"}</span></div>')
    if queries:
        meta_html.append('    <div class="ui-queries-box">')
        meta_html.append(f'      <strong>🔍 Search Queries ({len(queries)}):</strong>')
        meta_html.append('      <ul class="ui-queries-list">')
        for q in queries:
            meta_html.append(f'        <li>"{q}"</li>')
        meta_html.append('      </ul>')
        meta_html.append('    </div>')
    meta_html.append('  </div>')
    meta_html.append('</div>')
    
    # 2. Extracted Entities List
    entities = parsed_json.get("local_entities", [])
    content_html.append('<div class="ui-section">')
    content_html.append(f'  <h4 class="ui-section-title">📇 Extracted Profiles ({len(entities)})</h4>')
    if not entities:
        content_html.append('  <p class="ui-no-profiles">No local business or professional profiles extracted from this stream.</p>')
    else:
        content_html.append('  <div class="ui-entities-list">')
        for ent in entities:
            name = ent.get("name", "Unnamed Provider")
            category = ent.get("category", "Healthcare Specialist")
            address = ent.get("address", "N/A")
            rating = ent.get("rating", "N/A")
            review_count = ent.get("review_count", "N/A")
            phone = ent.get("phone", "N/A")
            web_url = ent.get("website_url", "N/A")
            badge = ent.get("verified_badge", "")
            
            fee = ent.get("consultation_fee", "N/A")
            exp = ent.get("experience", "N/A")
            
            slug_name = slugify(name)
            item_id = f"item-{engine}-{slug_name}"
            content_html.append(f'    <div class="ui-entity-mini-card" id="{item_id}">')
            content_html.append('      <div class="ui-card-top">')
            content_html.append(f'        <h5 class="ui-entity-name">{name}</h5>')
            if rating != "N/A" and rating:
                content_html.append(f'        <span class="ui-rating-tag">⭐ {rating} <span style="opacity: 0.7; font-size: 0.75rem;">({review_count})</span></span>')
            content_html.append('      </div>')
            
            content_html.append('      <div class="ui-card-body">')
            content_html.append(f'        <p><strong>🩺 Specialty:</strong> {category}</p>')
            content_html.append(f'        <p><strong>📍 Address:</strong> {address}</p>')
            if phone != "N/A" and phone:
                content_html.append(f'        <p><strong>📞 Phone:</strong> <code>{phone}</code></p>')
            if web_url != "N/A" and web_url:
                content_html.append(f'        <p><strong>🔗 Website:</strong> <a href="{web_url}" target="_blank">{web_url}</a></p>')
                
            extra_lines = []
            if exp != "N/A" and exp:
                extra_lines.append(f'💼 Experience: {exp}')
            if fee != "N/A" and fee:
                extra_lines.append(f'🪙 Fee: {fee}')
            if badge:
                extra_lines.append(f'✅ Badge: {badge}')
                
            if extra_lines:
                content_html.append(f'        <div class="ui-card-extra">{" | ".join(extra_lines)}</div>')
                
            content_html.append('      </div>')
            content_html.append('    </div>')
        content_html.append('  </div>')
    content_html.append('</div>')
    
    # 3. Outbound Citations list
    citations = parsed_json.get("web_citations", [])
    if citations:
        content_html.append('<div class="ui-section" style="margin-top: 20px;">')
        content_html.append(f'  <h4 class="ui-section-title">📑 Outbound Citations ({len(citations)})</h4>')
        content_html.append('  <div class="ui-citations-list">')
        for cit in citations:
            c_title = cit.get("title", "Resource Page")
            c_url = cit.get("url", "")
            if c_url:
                if is_image_url(c_url):
                    content_html.append('    <div class="ui-citation-item image-citation" style="gap: 8px;">')
                    content_html.append(f'      <div style="border-radius: 8px; overflow: hidden; background: #070b13; border: 1px solid rgba(255,255,255,0.05); height: 120px; display: flex; align-items: center; justify-content: center;">')
                    content_html.append(f'        <a href="{c_url}" target="_blank" style="display: block; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">')
                    content_html.append(f'          <img src="{c_url}" alt="{c_title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">')
                    content_html.append(f'        </a>')
                    content_html.append(f'      </div>')
                    content_html.append(f'      <span style="font-size: 0.8rem; font-weight: 600; color: #ffffff;">🖼️ {c_title}</span>')
                    content_html.append(f'      <span class="ui-citation-url">{c_url}</span>')
                    content_html.append('    </div>')
                else:
                    content_html.append('    <div class="ui-citation-item">')
                    content_html.append(f'      <a href="{c_url}" target="_blank">🔗 {c_title}</a>')
                    content_html.append(f'      <span class="ui-citation-url">{c_url}</span>')
                    content_html.append('    </div>')
        content_html.append('  </div>')
        content_html.append('</div>')
        
    # 4. UTM Tracking list
    utm = parsed_json.get("utm_sources", [])
    if utm:
        meta_html.append('<div class="ui-section" style="margin-top: 20px;">')
        meta_html.append(f'  <h4 class="ui-section-title">🏷️ Tracking Sources (UTMs) ({len(utm)})</h4>')
        meta_html.append('  <div class="ui-utm-list">')
        for item in utm:
            meta_html.append(f'    <div class="ui-utm-item">🎯 <code>{item}</code></div>')
        meta_html.append('  </div>')
        meta_html.append('</div>')
        
    return ("\n".join(meta_html), "\n".join(content_html))

class RunConsolidator:
    def __init__(self):
        self.outputs_dir = geo_config.OUTPUTS_DIR
        self.consolidated_dir = os.path.join(self.outputs_dir, "consolidated_reports")
        os.makedirs(self.consolidated_dir, exist_ok=True)
        
    def scan_all_runs(self):
        """Scans the outputs/ directory and parses all geo_data.json files, grouping them by intent topic."""
        print("[⚡] Scanning all output run directories for consolidation...")
        runs_by_topic = {}
        
        if not os.path.exists(self.outputs_dir):
            print("[!] Outputs directory does not exist yet.")
            return {}
            
        for item in os.listdir(self.outputs_dir):
            run_path = os.path.join(self.outputs_dir, item)
            # Skip consolidate directory itself and non-directories
            if item == "consolidated_reports" or not os.path.isdir(run_path):
                continue
                
            geo_data_file = os.path.join(run_path, geo_config.GEO_DATA_FILENAME)
            if os.path.exists(geo_data_file):
                try:
                    with open(geo_data_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        
                    prompt = data.get("original_prompt", "").strip()
                    if not prompt:
                        continue
                        
                    topic_key = get_topic_key(prompt)
                    engine_name = "unknown"
                    
                    # Deduce engine name from directory name e.g. run_20260601_justdial_patna_dentist
                    for candidate in sorted(CHANNEL_MAP.keys(), key=len, reverse=True):
                        if f"_{candidate}_" in item:
                            engine_name = candidate
                            break
                            
                    # Add path meta to run
                    data["_run_dir"] = run_path
                    data["_engine"] = engine_name
                    data["_timestamp"] = item.split("_")[1] if len(item.split("_")) > 1 else "Unknown"
                    
                    if topic_key not in runs_by_topic:
                        runs_by_topic[topic_key] = {
                            "original_prompt": prompt,
                            "topic_title": get_beautiful_topic_title(prompt, topic_key),
                            "runs": []
                        }
                    runs_by_topic[topic_key]["runs"].append(data)
                except Exception as e:
                    print(f"[!] Error reading {geo_data_file}: {e}")
                    
        return runs_by_topic

    def consolidate_specific_runs(self, results_list):
        """Consolidates ONLY the runs specified in the results_list (current session)."""
        if not results_list:
            print("[!] No active run results to consolidate.")
            return None
            
        print(f"\n[⚡] Consolidating {len(results_list)} active engine runs from this session...")
        runs = []
        
        # Parse geo_data.json from the active runs only
        for r in results_list:
            geo_data_file = r.get("geo_data")
            engine = r.get("engine")
            run_dir = r.get("run_dir")
            
            if geo_data_file and os.path.exists(geo_data_file):
                try:
                    with open(geo_data_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    data["_run_dir"] = run_dir
                    data["_engine"] = engine
                    runs.append(data)
                except Exception as e:
                    print(f"[!] Error reading {geo_data_file}: {e}")
                    
        if not runs:
            print("[!] No structured run data available to consolidate.")
            return None
            
        # Extract prompt and generate titles based on active runs
        first_run = runs[0]
        prompt = first_run.get("original_prompt", "").strip()
        topic_key = get_topic_key(prompt)
        topic_title = get_beautiful_topic_title(prompt, topic_key)
        
        topic_data = {
            "original_prompt": prompt,
            "topic_title": topic_title,
            "runs": runs,
            "results_list": results_list
        }
        
        # Build the scrollable HTML report
        report_file = self.consolidate_topic(topic_key, topic_data)
        return report_file

    def consolidate_topic(self, topic_key, topic_data):
        """Deduplicates, groups, and builds the beautiful scrollable HTML report for a specific topic."""
        runs = topic_data["runs"]
        title = topic_data["topic_title"]
        prompt = topic_data["original_prompt"]
        results_list = topic_data.get("results_list", [])
        if not results_list:
            results_list = []
            for r in runs:
                results_list.append({
                    "engine": r["_engine"],
                    "run_dir": r["_run_dir"],
                    "geo_data": os.path.join(r["_run_dir"], "geo_data.json"),
                    "screenshot": os.path.join(r["_run_dir"], "screenshot.png"),
                    "report": os.path.join(r["_run_dir"], "geo_analysis_report.md")
                })
        
        print(f"[📦] Merging data channels for topic: '{title}' ({topic_key})...")
        
        # 1. Merge entities
        merged_entities = []
        
        # Categorized lists for the scroll sections
        directory_entities = []
        maps_entities = []
        llm_entities = []
        
        web_citations = []
        citations_seen = set()
        
        engines_audited = []
        
        for r in runs:
            engine = r["_engine"]
            engines_audited.append(engine)
            channel_type = CHANNEL_MAP.get(engine, "Other")
            
            # Extract citations
            for cit in r.get("web_citations", []):
                url = cit.get("url", "")
                if url and url not in citations_seen:
                    citations_seen.add(url)
                    web_citations.append({
                        "title": cit.get("title", "Resource Citation"),
                        "url": url,
                        "source": engine
                    })
            
            # Process entities
            for rank_idx, ent in enumerate(r.get("local_entities", []), 1):
                ent_name = ent.get("name", "").strip()
                if not ent_name:
                    continue
                
                # Tag it with the source engine
                ent["_source"] = engine
                ent["_channel_type"] = channel_type
                
                # Append to specific channel-type containers for section renders
                if channel_type == "Directories":
                    directory_entities.append(ent)
                elif channel_type == "Local Maps":
                    maps_entities.append(ent)
                else:
                    llm_entities.append(ent)
                
                # Look for matches in the consolidated unified list
                matched = False
                for merged in merged_entities:
                    if match_entities(merged["name"], ent_name):
                        matched = True
                        if engine not in merged["sources"]:
                            merged["sources"].append(engine)
                        # Keep the most detailed fields
                        if ent.get("address") and (not merged.get("address") or len(ent["address"]) > len(merged["address"])):
                            merged["address"] = ent["address"]
                        if ent.get("phone") and ent["phone"] != "N/A" and merged.get("phone") == "N/A":
                            merged["phone"] = ent["phone"]
                        if ent.get("website_url") and ent["website_url"] != "N/A" and merged.get("website_url") == "N/A":
                            merged["website_url"] = ent["website_url"]
                            
                        # Store detailed review scores from multiple directories
                        merged["detailed_ratings"][engine] = {
                            "rating": ent.get("rating", "N/A"),
                            "review_count": ent.get("review_count", "N/A"),
                            "fee": ent.get("consultation_fee", "N/A"),
                            "experience": ent.get("experience", "N/A"),
                            "recommendation_rate": ent.get("recommendation_rate", "N/A")
                        }
                        
                        # Store rank (keeping the best rank if it's found multiple times)
                        current_rank = merged["ranks"].get(engine)
                        if current_rank is None or rank_idx < current_rank:
                            merged["ranks"][engine] = rank_idx
                        break
                        
                if not matched:
                    # Create new merged record
                    merged_rec = {
                        "name": clean_unicode_bold(ent_name),
                        "category": ent.get("category", "Healthcare Specialist"),
                        "address": ent.get("address", "Local Region"),
                        "phone": ent.get("phone", "N/A"),
                        "website_url": ent.get("website_url", "N/A"),
                        "sources": [engine],
                        "ranks": {engine: rank_idx},
                        "detailed_ratings": {
                            engine: {
                                "rating": ent.get("rating", "N/A"),
                                "review_count": ent.get("review_count", "N/A"),
                                "fee": ent.get("consultation_fee", "N/A"),
                                "experience": ent.get("experience", "N/A"),
                                "recommendation_rate": ent.get("recommendation_rate", "N/A")
                            }
                        }
                    }
                    merged_entities.append(merged_rec)
        
        # Render the HTML template
        engines_audited = sort_engines(list(set(engines_audited)))
        html_content = self.render_premium_scroll_html(
            title=title,
            prompt=prompt,
            engines=engines_audited,
            merged_entities=merged_entities,
            directory_entities=directory_entities,
            maps_entities=maps_entities,
            llm_entities=llm_entities,
            web_citations=web_citations,
            results_list=results_list
        )
        
        report_file = os.path.join(self.consolidated_dir, f"report_{topic_key}.html")
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"[✓] Premium Consolidated Report generated successfully: {report_file}")
        return report_file

    def render_premium_scroll_html(self, title, prompt, engines, merged_entities, directory_entities, maps_entities, llm_entities, web_citations, results_list=None):
        """Renders the HTML string for the premium long scrollable dashboard."""
        
        # Format metrics
        total_unique = len(merged_entities)
        overlapping_count = sum(1 for e in merged_entities if len(e["sources"]) > 1)
        total_citations = len(web_citations)
        
        # Build individual engine tags for header
        engine_pills = ""
        for eng in engines:
            c_type = CHANNEL_MAP.get(eng, "Other")
            pill_class = get_badge_class(c_type)
            engine_pills += f'<span class="badge {pill_class}">{CHANNEL_ICONS.get(eng, "")} {eng.upper()}</span> '

        # Build individual engine deep dive panels with screenshots
        debug_panels_html = ""
        if results_list:
            # Sort results list by preferred order
            sorted_results = sorted(results_list, key=lambda x: PREFERRED_ENGINE_ORDER.index(x["engine"]) if x.get("engine") in PREFERRED_ENGINE_ORDER else 999)
            for r in sorted_results:
                engine = r.get("engine", "unknown")
                run_dir = r.get("run_dir", "")
                screenshot = r.get("screenshot", "")
                geo_data_path = r.get("geo_data", "")
                
                # Load structured JSON extraction content if exists
                json_text = "No individual geo_data.json file found."
                parsed_json = None
                if geo_data_path and os.path.exists(geo_data_path):
                    try:
                        with open(geo_data_path, "r", encoding="utf-8") as f:
                            parsed_json = json.load(f)
                        json_text = json.dumps(parsed_json, indent=4)
                    except Exception as e:
                        json_text = f"Error reading/formatting geo_data.json: {e}"
                
                meta_html, content_html = format_json_to_ui(parsed_json, engine)
                
                # Get relative screenshot path
                screenshot_rel = ""
                if screenshot:
                    screenshot_rel = os.path.relpath(screenshot, self.consolidated_dir)
                
                c_type_detail = CHANNEL_MAP.get(engine, "Other")
                badge_class_detail = get_badge_class(c_type_detail)
                
                screenshot_html_detail = ""
                if screenshot_rel:
                    screenshot_html_detail = f"""
                    <div class="screenshot-container-box" style="position: relative; cursor: zoom-in;" onclick="openScreenshotModal('{screenshot_rel}', '{engine.upper()}')" title="Click to zoom / view details">
                        <img src="{screenshot_rel}" alt="{engine.upper()} Screenshot Capture" class="screenshot-box-img" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 12px; color: #fff; font-size: 0.75rem; display: flex; align-items: center; gap: 6px; pointer-events: none; backdrop-filter: blur(4px);">
                            <span>🔍 Click to Zoom</span>
                        </div>
                    </div>
                    """
                else:
                    screenshot_html_detail = """
                    <div class="screenshot-container-box" style="display: flex; align-items: center; justify-content: center; height: 300px; background: rgba(0, 0, 0, 0.4); color: var(--text-muted); font-style: italic;">
                        📷 No agent screenshot capture available for this engine
                    </div>
                    """

                debug_panels_html += f"""
                <div class="debug-panel">
                    <div class="debug-header">
                        <h3>🤖 Engine: {engine.upper()}</h3>
                        <span class="badge {badge_class_detail}">{c_type_detail}</span>
                    </div>
                    <div class="debug-split">
                        <!-- Left Column: Screenshot and Summary of doctors, citations below it -->
                        <div class="debug-screenshot-col" style="flex: 1.2; display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                            <h5 style="margin-bottom: 4px; font-size: 0.85rem; text-transform: uppercase; color: var(--neon-blue); letter-spacing: 0.5px;">📷 Agent Dynamic Screen Capture:</h5>
                            {screenshot_html_detail}
                            
                            <!-- Extracted Doctors Summary & Citation Previews shown below image -->
                            <div class="debug-extracted-content" style="margin-top: 10px;">
                                {content_html}
                            </div>
                        </div>

                        <!-- Right Column: Tech Meta info and raw JSON data -->
                        <div class="debug-info-col" style="flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                            <div class="debug-meta-box">
                                <p><strong>Routed Source:</strong> {engine.upper()}</p>
                                <p><strong>Run Folder Name:</strong> <code>{os.path.basename(run_dir)}</code></p>
                            </div>
                            
                            {meta_html}
                            
                            <!-- Raw JSON data box -->
                            <div class="debug-tabs" style="margin-top: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 8px;">
                                <span class="debug-tab-btn active" style="cursor: default;">💻 Raw JSON Data</span>
                            </div>
                            <div class="debug-report-box" style="flex: 1; min-height: 250px;">
                                <pre class="debug-report-text">{json_text}</pre>
                            </div>
                        </div>
                    </div>
                </div>
                """
        else:
            debug_panels_html = "<p class='no-data'>No active engine session run metadata passed for debug drill-down.</p>"

        # Build Merged Cards
        merged_cards_html = ""
        # Sort merged entities by prominence (number of sources, then total reviews if available)
        def get_prominence(e):
            score = len(e["sources"]) * 10
            # Try parsing a review count from the details
            for src, det in e["detailed_ratings"].items():
                rev = str(det.get("review_count", "0")).replace(",", "")
                match = re.search(r'(\d+)', rev)
                if match:
                    score += min(int(match.group(1)) * 0.01, 5)
            return score
            
        sorted_merged = sorted(merged_entities, key=get_prominence, reverse=True)
        
        for i, ent in enumerate(sorted_merged, 1):
            source_pills = ""
            # Sort sources by preferred order
            sorted_sources = sort_engines(ent["sources"])
            for s in sorted_sources:
                c_type = CHANNEL_MAP.get(s, "Other")
                badge_c = get_badge_class(c_type)
                slug_name = slugify(ent["name"])
                item_id = f"item-{s}-{slug_name}"
                rank = ent["ranks"].get(s, "N/A")
                rank_suffix = f" (#{rank})" if rank != "N/A" else ""
                source_pills += f'<a href="#{item_id}" class="badge {badge_c}" onclick="highlightDebugItem(\'{s}\', \'{item_id}\')" style="text-decoration: none; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">{CHANNEL_ICONS.get(s, "")} {s}{rank_suffix}</a> '
                
            # Build ratings list
            ratings_details = ""
            # Sort detailed ratings sources by preferred order
            sorted_rating_sources = sort_engines(ent["detailed_ratings"].keys())
            for s in sorted_rating_sources:
                det = ent["detailed_ratings"][s]
                rating_str = f"⭐ {det['rating']}" if det['rating'] != "N/A" else "No rating"
                rev_str = f"({det['review_count']} reviews)" if det['review_count'] != "N/A" else ""
                rank = ent["ranks"].get(s, "N/A")
                rank_str = f' | <span style="color: var(--neon-blue); font-weight: 700;">Rank #{rank}</span>' if rank != "N/A" else ""
                ratings_details += f'<div class="rating-row"><strong>{s.title()}:</strong> {rating_str} {rev_str}{rank_str}</div>'
                
            # Experience or Fee check
            extra_details = ""
            for s, det in ent["detailed_ratings"].items():
                fee = det.get("fee", "N/A")
                exp = det.get("experience", "N/A")
                if fee != "N/A" or exp != "N/A":
                    extra_details += f'<div class="extra-row">'
                    if exp != "N/A":
                        extra_details += f'<span>💼 {exp}</span> '
                    if fee != "N/A":
                        extra_details += f'<span>🪙 Fee: {fee}</span>'
                    extra_details += '</div>'
                    break

            merged_cards_html += f"""
            <div class="entity-card" data-name="{ent['name'].lower()}" data-category="{ent['category'].lower()}">
                <div class="card-header">
                    <span class="rank-badge">#{i}</span>
                    <h3 class="entity-title">{ent['name']}</h3>
                </div>
                <p class="entity-category">🩺 {ent['category']}</p>
                <p class="entity-address">📍 {ent['address']}</p>
                {"<p class='entity-phone'>📞 Phone: " + ent['phone'] + "</p>" if ent['phone'] != "N/A" else ""}
                
                <div class="card-divider"></div>
                
                <div class="rating-section">
                    {ratings_details}
                </div>
                
                {extra_details}
                
                <div class="card-divider"></div>
                <div class="sources-list">
                    <span style="font-size: 0.8rem; opacity: 0.6;">Discovered on:</span>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                        {source_pills}
                    </div>
                </div>
            </div>
            """

        # Build Citations
        citations_html = ""
        if web_citations:
            for cit in web_citations:
                if is_image_url(cit['url']):
                    citations_html += f"""
                    <div class="citation-card image-citation">
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div class="citation-image-wrapper" style="border-radius: 12px; overflow: hidden; background: #070b13; border: 1px solid var(--border-color); height: 160px; display: flex; align-items: center; justify-content: center; position: relative;">
                                <a href="{cit['url']}" target="_blank" style="display: block; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                                    <img src="{cit['url']}" alt="{cit['title']}" style="max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                </a>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span class="citation-title" style="font-size: 0.85rem; font-weight: 600; color: #ffffff;">🖼️ {cit['title']}</span>
                                <span class="badge pill-ai" style="font-size: 0.7rem;">{cit['source'].upper()}</span>
                            </div>
                            <p class="citation-url" style="margin-top: 0; font-size: 0.72rem; word-break: break-all;">{cit['url']}</p>
                        </div>
                    </div>
                    """
                else:
                    citations_html += f"""
                    <div class="citation-card">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <a href="{cit['url']}" target="_blank" class="citation-title">🔗 {cit['title']}</a>
                            <span class="badge pill-ai" style="font-size: 0.7rem;">{cit['source'].upper()}</span>
                        </div>
                        <p class="citation-url">{cit['url']}</p>
                    </div>
                    """
        else:
            citations_html = "<p class='no-data'>No outgoing web citations detected in stream.</p>"

        # Master Template
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GEO Visibility Hub - {title}</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {{
            --bg-color: #0b0f19;
            --panel-bg: rgba(20, 26, 44, 0.6);
            --card-bg: rgba(28, 36, 58, 0.45);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-color: #f3f4f6;
            --text-muted: #9ca3af;
            
            --neon-violet: #8b5cf6;
            --neon-blue: #3b82f6;
            --neon-emerald: #10b981;
            
            --violet-gradient: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
            --glass-filter: blur(20px);
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        html {{
            scroll-behavior: smooth;
        }}
        
        body {{
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            overflow-x: hidden;
            line-height: 1.5;
        }}
        
        /* Dashboard Layout */
        .dashboard-wrapper {{
            display: flex;
            min-height: 100vh;
        }}
        
        /* Sticky Sidebar Navigation */
        aside.sidebar {{
            width: 320px;
            background: rgba(13, 18, 35, 0.85);
            border-right: 1px solid var(--border-color);
            backdrop-filter: var(--glass-filter);
            padding: 40px 24px;
            display: flex;
            flex-direction: column;
            gap: 40px;
            position: sticky;
            top: 0;
            height: 100vh;
            z-index: 100;
        }}
        
        .logo-section h1 {{
            font-size: 1.5rem;
            font-weight: 800;
            background: var(--violet-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .logo-section p {{
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 4px;
        }}
        
        .nav-links {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}
        
        .nav-links a {{
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-muted);
            text-decoration: none;
            padding: 14px 18px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }}
        
        .nav-links a:hover {{
            color: var(--text-color);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.05);
        }}
        
        /* Active links highlighting styled via scroll spying script */
        .nav-links a.active {{
            color: #ffffff;
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
        }}
        
        /* Main Scrollable Area */
        main.main-content {{
            flex: 1;
            padding: 40px 48px;
            max-width: 1400px;
            margin: 0 auto;
            width: calc(100% - 320px);
        }}
        
        /* Header Block */
        .header-block {{
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 32px 40px;
            backdrop-filter: var(--glass-filter);
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            margin-bottom: 32px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }}
        
        .header-title-row {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 20px;
        }}
        
        .header-title-row h2 {{
            font-size: 2.2rem;
            font-weight: 800;
            letter-spacing: -1px;
            color: #ffffff;
        }}
        
        .prompt-box {{
            background: rgba(0, 0, 0, 0.25);
            border-radius: 12px;
            padding: 16px 20px;
            border-left: 4px solid var(--neon-violet);
            font-size: 0.95rem;
            color: #e5e7eb;
            line-height: 1.6;
        }}
        
        /* Badges */
        .badge {{
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }}
        
        .pill-ai {{
            background: rgba(139, 92, 246, 0.15);
            color: #c084fc;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }}
        
        .pill-map {{
            background: rgba(59, 130, 246, 0.15);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }}
        
        .pill-search {{
            background: rgba(244, 63, 94, 0.15);
            color: #fb7185;
            border: 1px solid rgba(244, 63, 94, 0.3);
        }}
        
        .pill-dir {{
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }}
        
        /* Stats Dashboard Row */
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        }}
        
        .stat-card {{
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 24px 28px;
            backdrop-filter: var(--glass-filter);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }}
        
        .stat-card:hover {{
            border-color: rgba(139, 92, 246, 0.3);
            transform: translateY(-2px);
        }}
        
        .stat-card h4 {{
            font-size: 0.85rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }}
        
        .stat-val {{
            font-size: 2.2rem;
            font-weight: 800;
            color: #ffffff;
        }}
        
        .stat-desc {{
            font-size: 0.78rem;
            color: var(--text-muted);
            margin-top: 4px;
        }}
        
        /* Section Containers */
        section.scroll-section {{
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 40px;
            backdrop-filter: var(--glass-filter);
            margin-bottom: 40px;
            scroll-margin-top: 40px; /* Offset for sticky scroll headers */
        }}
        
        .section-header {{
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 18px;
        }}
        
        .section-header h2 {{
            font-size: 1.6rem;
            font-weight: 800;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        /* Search / Filtering Row */
        .filter-row {{
            margin-bottom: 24px;
            display: flex;
            gap: 16px;
            align-items: center;
            max-width: 500px;
        }}
        
        .search-input {{
            flex: 1;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px 20px;
            color: #ffffff;
            font-family: inherit;
            font-size: 0.95rem;
            outline: none;
            transition: all 0.3s ease;
        }}
        
        .search-input:focus {{
            border-color: var(--neon-violet);
            box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
        }}
        
        /* Consolidated Entity Grid */
        .entities-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
        }}
        
        .entity-card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 24px 28px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }}
        
        .entity-card:hover {{
            transform: translateY(-4px);
            border-color: rgba(139, 92, 246, 0.35);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
            background: rgba(28, 36, 58, 0.6);
        }}
        
        .card-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }}
        
        .entity-title {{
            font-size: 1.15rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.3;
        }}
        
        .rank-badge {{
            background: var(--violet-gradient);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 8px;
        }}
        
        .entity-category {{
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 500;
        }}
        
        .entity-address {{
            font-size: 0.82rem;
            color: var(--text-muted);
            line-height: 1.4;
        }}
        
        .entity-phone {{
            font-size: 0.82rem;
            color: var(--text-muted);
        }}
        
        .card-divider {{
            height: 1px;
            background: rgba(255, 255, 255, 0.05);
            margin: 6px 0;
        }}
        
        .rating-section {{
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        
        .rating-row {{
            font-size: 0.82rem;
            color: #d1d5db;
        }}
        
        .extra-row {{
            font-size: 0.8rem;
            color: #10b981;
            font-weight: 600;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }}
        
        /* Stacked lists for specific channels */
        .channels-stack {{
            display: flex;
            flex-direction: column;
            gap: 16px;
        }}
        
        .channel-entity-card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px 24px;
            transition: all 0.3s ease;
        }}
        
        .channel-entity-card:hover {{
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(28, 36, 58, 0.55);
        }}
        
        .channel-entity-card h4 {{
            font-size: 1.1rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 6px;
        }}
        
        .meta-line {{
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 4px;
        }}
        
        /* Citation Grid */
        .citations-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
            gap: 20px;
        }}
        
        .citation-card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px 24px;
            transition: all 0.3s ease;
        }}
        
        .citation-card:hover {{
            border-color: rgba(139, 92, 246, 0.25);
            background: rgba(28, 36, 58, 0.55);
        }}
        
        .citation-title {{
            font-size: 0.95rem;
            font-weight: 700;
            color: #ffffff;
            text-decoration: none;
            transition: color 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 80%;
        }}
        
        .citation-title:hover {{
            color: var(--neon-violet);
        }}
        
        .citation-url {{
            font-size: 0.78rem;
            color: var(--text-muted);
            margin-top: 8px;
            word-break: break-all;
        }}
        
        .no-data {{
            color: var(--text-muted);
            font-size: 0.9rem;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }}
        
        /* Debug Deep Dives Section */
        .deep-dives-stack {{
            display: flex;
            flex-direction: column;
            gap: 32px;
        }}
        
        .debug-panel {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            transition: all 0.3s ease;
        }}
        
        .debug-panel:hover {{
            border-color: rgba(139, 92, 246, 0.25);
            background: rgba(28, 36, 58, 0.55);
        }}
        
        .debug-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 16px;
        }}
        
        .debug-header h3 {{
            font-size: 1.25rem;
            font-weight: 800;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .debug-split {{
            display: flex;
            gap: 32px;
        }}
        
        .debug-info-col {{
            flex: 1.2;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
        }}
        
        .debug-meta-box {{
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 16px 20px;
            border: 1px solid rgba(255, 255, 255, 0.03);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        
        .debug-meta-box p {{
            font-size: 0.82rem;
            color: var(--text-muted);
            word-break: break-all;
        }}
        
        .debug-meta-box strong {{
            color: #ffffff;
        }}
        
        .debug-report-box {{
            flex: 1;
            background: #070b13;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }}
        
        .debug-report-text {{
            font-family: 'Plus Jakarta Sans', monospace;
            font-size: 0.8rem;
            color: #cbd5e1;
            white-space: pre-wrap;
            line-height: 1.6;
        }}
        
        /* Debug Tabs */
        .debug-tabs {{
            display: flex;
            gap: 8px;
            margin-top: 10px;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 8px;
        }}
        
        .debug-tab-btn {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--text-muted);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }}
        
        .debug-tab-btn:hover {{
            color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
        }}
        
        .debug-tab-btn.active {{
            color: #ffffff;
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.4);
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.1);
        }}
        
        /* Human Readable UI elements */
        .ui-section {{
            display: flex;
            flex-direction: column;
            gap: 12px;
        }}
        
        .ui-section-title {{
            font-size: 0.8rem;
            text-transform: uppercase;
            color: var(--neon-violet);
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }}
        
        .ui-meta-card {{
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        
        .ui-meta-row {{
            display: flex;
            justify-content: space-between;
            font-size: 0.82rem;
        }}
        
        .ui-meta-row strong {{
            color: var(--text-muted);
        }}
        
        .ui-meta-row span {{
            color: #ffffff;
            font-weight: 500;
        }}
        
        .ui-queries-box {{
            margin-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 8px;
            font-size: 0.8rem;
        }}
        
        .ui-queries-box strong {{
            color: var(--text-muted);
            display: block;
            margin-bottom: 4px;
        }}
        
        .ui-queries-list {{
            list-style-type: disc;
            padding-left: 18px;
            color: #d1d5db;
        }}
        
        .ui-queries-list li {{
            margin-bottom: 2px;
        }}
        
        .ui-no-profiles {{
            color: var(--text-muted);
            font-size: 0.8rem;
            font-style: italic;
        }}
        
        .ui-entities-list {{
            display: flex;
            flex-direction: column;
            gap: 10px;
        }}
        
        .ui-entity-mini-card {{
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 12px;
            transition: all 0.2s ease;
        }}
        
        .ui-entity-mini-card:hover {{
            border-color: rgba(139, 92, 246, 0.2);
            background: rgba(255, 255, 255, 0.04);
        }}
        
        .ui-card-top {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }}
        
        .ui-entity-name {{
            font-size: 0.88rem;
            font-weight: 700;
            color: #ffffff;
        }}
        
        .ui-rating-tag {{
            background: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.2);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
        }}
        
        .ui-card-body {{
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 0.8rem;
            color: #cbd5e1;
        }}
        
        .ui-card-body a {{
            color: var(--neon-blue);
            text-decoration: none;
        }}
        
        .ui-card-body a:hover {{
            text-decoration: underline;
        }}
        
        .ui-card-extra {{
            margin-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 4px;
            font-size: 0.72rem;
            color: var(--neon-emerald);
            font-weight: 600;
        }}
        
        .ui-citations-list {{
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        
        .ui-citation-item {{
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }}
        
        .ui-citation-item a {{
            font-size: 0.82rem;
            font-weight: 600;
            color: #ffffff;
            text-decoration: none;
        }}
        
        .ui-citation-item a:hover {{
            color: var(--neon-violet);
        }}
        
        .ui-citation-url {{
            font-size: 0.7rem;
            color: var(--text-muted);
            word-break: break-all;
        }}
        
        .ui-utm-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }}
        
        .ui-utm-item {{
            background: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.2);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.72rem;
            font-family: monospace;
        }}
        
        @keyframes highlight-glow {{
            0% {{
                border-color: var(--neon-violet);
                box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);
                transform: scale(1.02);
                background: rgba(139, 92, 246, 0.1);
            }}
            100% {{
                border-color: rgba(255, 255, 255, 0.05);
                box-shadow: none;
                transform: scale(1);
                background: rgba(255, 255, 255, 0.02);
            }}
        }}
        
        .glowing-highlight {{
            animation: highlight-glow 2.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
            z-index: 10;
        }}
        
        .debug-screenshot-col {{
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }}
        
        .screenshot-container-box {{
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            overflow: hidden;
            background: #000000;
            position: relative;
            max-height: 500px;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            transition: border-color 0.3s ease;
        }}
        
        .screenshot-container-box:hover {{
            border-color: rgba(139, 92, 246, 0.4);
        }}
        
        .screenshot-box-img {{
            width: 100%;
            height: auto;
            display: block;
        }}
        
        /* Modal Lightbox styles */
        .modal-overlay {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(3, 7, 18, 0.85);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: none;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }}
        
        .modal-overlay.active {{
            opacity: 1;
        }}
        
        .modal-card {{
            width: 90vw;
            height: 90vh;
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            transform: scale(0.95);
            transition: transform 0.3s ease;
        }}
        
        .modal-overlay.active .modal-card {{
            transform: scale(1);
        }}
        
        .modal-header {{
            padding: 16px 28px;
            background: rgba(15, 23, 42, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
        }}
        
        .modal-header h3 {{
            font-size: 1.1rem;
            font-weight: 800;
            background: linear-gradient(135deg, #f472b6 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 0.5px;
        }}
        
        .modal-controls {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        .modal-btn {{
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #f3f4f6;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }}
        
        .modal-btn:hover {{
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }}
        
        .modal-close-btn {{
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }}
        
        .modal-close-btn:hover {{
            background: rgba(239, 68, 68, 0.25);
            color: #ffffff;
        }}
        
        .modal-body {{
            flex: 1;
            overflow: hidden;
            position: relative;
            background: #020617;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .modal-image-container {{
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }}
        
        .modal-image-container img {{
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            transform-origin: center center;
            transition: transform 0.1s ease-out;
            user-select: none;
            -webkit-user-drag: none;
        }}
        
        @media (max-width: 1200px) {{
            .debug-split {{
                flex-direction: column;
            }}
        }}
        
        /* Footer styling */
        footer {{
            margin-top: 60px;
            border-top: 1px solid var(--border-color);
            padding-top: 24px;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.8rem;
        }}
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {{
            .dashboard-wrapper {{
                flex-direction: column;
            }}
            aside.sidebar {{
                width: 100%;
                height: auto;
                position: relative;
                border-right: none;
                border-bottom: 1px solid var(--border-color);
                padding: 24px;
                gap: 20px;
            }}
            .nav-links {{
                flex-direction: row;
                flex-wrap: wrap;
            }}
            main.main-content {{
                width: 100%;
                padding: 24px;
            }}
        }}
    </style>
</head>
<body>

    <div class="dashboard-wrapper">
    
        <!-- Sticky Navigation Sidebar -->
        <aside class="sidebar">
            <div class="logo-section">
                <h1>🧠 GEO Visibility</h1>
                <p>Generative Engine Audit</p>
            </div>
            
            <nav class="nav-links">
                <a href="#overview" class="active">📊 Unified Overview</a>
                <a href="#citations">📑 Outbound Citations</a>
                <a href="#deep-dives">⚙️ Debug Deep Dives</a>
            </nav>
            
            <div style="margin-top: auto; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
                Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}<br>
                GEO Engine pipeline v1.0
            </div>
        </aside>
        
        <!-- Main Content Area -->
        <main class="main-content">
        
            <!-- Header Block -->
            <div class="header-block">
                <div class="header-title-row">
                    <div>
                        <h2>{title} Search Visibility</h2>
                        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Audited Engines:</span>
                            {engine_pills}
                        </div>
                    </div>
                    <span class="badge pill-ai" style="font-size: 0.8rem; padding: 8px 16px;">Consolidated Run</span>
                </div>
                
                <div class="prompt-box">
                    <strong>Search Prompt / Audit Intent:</strong><br>
                    "{prompt}"
                </div>
            </div>
            
            <!-- Summary Metrics Cards Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Engines Audited</h4>
                    <div class="stat-val" style="color: #c084fc;">{len(engines)}</div>
                    <div class="stat-desc">Unique GEO platforms scanned</div>
                </div>
                
                <div class="stat-card">
                    <h4>Unique Providers</h4>
                    <div class="stat-val" style="color: #60a5fa;">{total_unique}</div>
                    <div class="stat-desc">Deduplicated local business entities</div>
                </div>
                
                <div class="stat-card">
                    <h4>High-Visibility overlapping</h4>
                    <div class="stat-val" style="color: #34d399;">{overlapping_count}</div>
                    <div class="stat-desc">Discovered across multiple channels</div>
                </div>
                
                <div class="stat-card">
                    <h4>Outbound Web Citations</h4>
                    <div class="stat-val" style="color: #fbbf24;">{total_citations}</div>
                    <div class="stat-desc">Grounding resources parsed</div>
                </div>
            </div>
            
            <!-- SECTION 1: Consolidated Overview -->
            <section id="overview" class="scroll-section">
                <div class="section-header">
                    <h2>📊 Consolidated Search Overview</h2>
                    <span class="badge pill-ai">Unified Grid</span>
                </div>
                
                <!-- Client-side Interactive Filter Bar -->
                <div class="filter-row">
                    <input type="text" id="provider-search" class="search-input" placeholder="🔍 Filter providers by name or category...">
                </div>
                
                <div class="entities-grid" id="merged-grid">
                    {merged_cards_html}
                </div>
            </section>

            
            <!-- SECTION 5: Outbound Citations -->
            <section id="citations" class="scroll-section">
                <div class="section-header">
                    <h2>📑 Outbound Web Citations</h2>
                    <span class="badge pill-ai" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);">Grounding Links</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Outbound URLs cited by the search engines for source grounding and patient confirmation checks.
                </p>
                <div class="citations-grid">
                    {citations_html}
                </div>
            </section>
            
            <!-- SECTION 6: Debug Deep Dives & Screenshots -->
            <section id="deep-dives" class="scroll-section">
                <div class="section-header">
                    <h2>⚙️ Channel Deep Dives & Visual Debugging</h2>
                    <span class="badge pill-ai" style="background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3);">Debug Center</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Full individual analysis reports, technical execution stats, and agent dynamic screen captures for detailed audit.
                </p>
                <div class="deep-dives-stack">
                    {debug_panels_html}
                </div>
            </section>
            
            <footer>
                <p>&copy; 2026 GEO Engine Audit Console. All rights reserved. Harmonized local indexing dashboard.</p>
            </footer>
            
        </main>
        
    </div>

    <!-- Screenshot Zoom Lightbox Modal -->
    <div id="screenshot-modal" class="modal-overlay" onclick="closeScreenshotModal(event)">
        <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3 id="modal-title">📷 ENGINE SCREENSHOT</h3>
                <div class="modal-controls">
                    <button class="modal-btn" onclick="zoomModalImg(1.25)">➕ Zoom In</button>
                    <button class="modal-btn" onclick="zoomModalImg(0.8)">➖ Zoom Out</button>
                    <button class="modal-btn" onclick="resetModalImg()">🔄 Reset</button>
                    <a id="modal-download" href="#" download class="modal-btn" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">⬇️ Download</a>
                    <button class="modal-close-btn" onclick="closeScreenshotModal(null)">✕</button>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-image-container" id="modal-img-container">
                    <img id="modal-image" src="" alt="Screenshot" draggable="false">
                </div>
            </div>
        </div>
    </div>

    <!-- Client-side Interactive Scripts -->
    <script>
        // 1. Interactive real-time search filtering
        const searchInput = document.getElementById('provider-search');
        const cards = document.querySelectorAll('.entity-card');
        
        searchInput.addEventListener('input', (e) => {{
            const query = e.target.value.toLowerCase().trim();
            
            cards.forEach(card => {{
                const name = card.getAttribute('data-name');
                const category = card.getAttribute('data-category');
                
                if (name.includes(query) || category.includes(query)) {{
                    card.style.display = 'flex';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }} else {{
                    card.style.display = 'none';
                }}
            }});
        }});
        
        // 2. Scroll Spy for navigation active states
        const sections = document.querySelectorAll('.scroll-section');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        window.addEventListener('scroll', () => {{
            let current = '';
            
            sections.forEach(section => {{
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= (sectionTop - 120)) {{
                    current = section.getAttribute('id');
                }}
            }});
            
            navLinks.forEach(link => {{
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {{
                    link.classList.add('active');
                }}
            }});
        }});
        
        // 3. Tab switching for Debug Center
        function switchDebugTab(btn, targetId) {{
            const panel = btn.closest('.debug-panel');
            const tabs = panel.querySelectorAll('.debug-tab-btn');
            const contents = panel.querySelectorAll('.debug-tab-content');
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => {{
                c.style.display = 'none';
                c.classList.remove('active');
            }});
            
            btn.classList.add('active');
            const target = panel.querySelector('#' + targetId);
            if (target) {{
                target.style.display = 'block';
                target.classList.add('active');
            }}
        }}
        
        // 4. Smooth scroll and glow flash for deep dive linking
        function highlightDebugItem(engine, itemId) {{
            setTimeout(() => {{
                const element = document.getElementById(itemId);
                if (element) {{
                    element.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                    element.classList.remove('glowing-highlight');
                    void element.offsetWidth; // Trigger reflow to restart animation
                    element.classList.add('glowing-highlight');
                }}
            }}, 80);
        }}

        // 5. Interactive Fullscreen Screenshot Zoom & Panning (Lightbox)
        let currentZoom = 1;
        let isDragging = false;
        let startX = 0, startY = 0;
        let translateX = 0, translateY = 0;
        const modalImg = document.getElementById('modal-image');
        const modalContainer = document.getElementById('modal-img-container');

        function openScreenshotModal(imgSrc, engineName) {{
            const modal = document.getElementById('screenshot-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalDownload = document.getElementById('modal-download');
            
            modalImg.src = imgSrc;
            modalTitle.innerText = `📷 ${{engineName}} Agent Dynamic Capture`;
            modalDownload.href = imgSrc;
            modalDownload.download = `screenshot_${{engineName.toLowerCase()}}.png`;
            
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            resetModalImg();
        }}

        function closeScreenshotModal(event) {{
            if (!event || event.target === document.getElementById('screenshot-modal')) {{
                const modal = document.getElementById('screenshot-modal');
                modal.classList.remove('active');
                setTimeout(() => {{
                    modal.style.display = 'none';
                }}, 300);
            }}
        }}

        function zoomModalImg(factor) {{
            currentZoom = Math.min(Math.max(currentZoom * factor, 0.5), 6);
            updateModalImgTransform();
        }}

        function resetModalImg() {{
            currentZoom = 1;
            translateX = 0;
            translateY = 0;
            updateModalImgTransform();
        }}

        function updateModalImgTransform() {{
            modalImg.style.transform = `translate(${{translateX}}px, ${{translateY}}px) scale(${{currentZoom}})`;
            if (currentZoom > 1) {{
                modalImg.style.cursor = 'grab';
            }} else {{
                modalImg.style.cursor = 'default';
            }}
        }}

        // Drag / Pan mouse events
        modalContainer.addEventListener('mousedown', (e) => {{
            if (currentZoom <= 1) return;
            isDragging = true;
            modalImg.style.cursor = 'grabbing';
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        }});

        window.addEventListener('mousemove', (e) => {{
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateModalImgTransform();
        }});

        window.addEventListener('mouseup', () => {{
            if (isDragging) {{
                isDragging = false;
                modalImg.style.cursor = 'grab';
            }}
        }});

        // Mousewheel zoom support
        modalContainer.addEventListener('wheel', (e) => {{
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 0.85;
            zoomModalImg(factor);
        }}, {{ passive: false }});

        // Close on Escape key press
        window.addEventListener('keydown', (e) => {{
            if (e.key === 'Escape') {{
                closeScreenshotModal(null);
            }}
        }});
    </script>
</body>
</html>
"""

def run_consolidation_for_active_session(results_list):
    """Utility called directly in geo_cli.py by default to consolidate ONLY active session runs."""
    consolidator = RunConsolidator()
    report_file = consolidator.consolidate_specific_runs(results_list)
    
    if report_file:
        print("\n" + "="*70)
        print(" 🎉  GEO SESSION RUN CONSOLIDATED REPORT GENERATED SUCCESSFULLY!")
        print("="*70)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        print(f" 📂  Unified HTML Report:  {os.path.relpath(report_file, base_dir)}")
        print("="*70 + "\n")
        
        # Automatically open the report in the default browser on completion
        try:
            import webbrowser
            report_abs_path = os.path.abspath(report_file)
            print(f"[🌐] Opening report in default web browser...")
            webbrowser.open(f"file://{report_abs_path}")
        except Exception as e:
            print(f"[!] Warning: Could not open browser automatically: {e}")


def run_retroactive_consolidation():
    """Finds ONLY the runs from the last/most-recent run session and consolidates them."""
    consolidator = RunConsolidator()
    
    # 1. Walk outputs/ and collect all valid run folders with their mtime and parsed prompt
    run_folders = []
    if not os.path.exists(consolidator.outputs_dir):
        print("[!] Outputs directory does not exist yet.")
        return
        
    for item in os.listdir(consolidator.outputs_dir):
        run_path = os.path.join(consolidator.outputs_dir, item)
        if item == "consolidated_reports" or not os.path.isdir(run_path):
            continue
            
        geo_data_file = os.path.join(run_path, geo_config.GEO_DATA_FILENAME)
        if os.path.exists(geo_data_file):
            try:
                mtime = os.path.getmtime(geo_data_file)
                with open(geo_data_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                prompt = data.get("original_prompt", "").strip()
                if prompt:
                    run_folders.append({
                        "path": run_path,
                        "geo_data": geo_data_file,
                        "mtime": mtime,
                        "prompt": prompt,
                        "data": data
                    })
            except Exception as e:
                pass
                
    if not run_folders:
        print("[!] No runs found under outputs/ directory to consolidate.")
        return
        
    # 2. Sort runs by mtime to find the absolute latest run
    run_folders = sorted(run_folders, key=lambda x: x["mtime"], reverse=True)
    latest_run = run_folders[0]
    latest_mtime = latest_run["mtime"]
    latest_prompt = latest_run["prompt"]
    latest_topic_key = get_topic_key(latest_prompt)
    
    print(f"\n[⚡] Latest run detected: {os.path.basename(latest_run['path'])}")
    print(f"    Target Prompt: \"{latest_prompt[:65]}...\"")
    
    # 3. Collect all runs for the SAME topic that were run in the same session (within 30 minutes of latest run)
    session_runs = []
    results_list = []
    
    for r in run_folders:
        # Check if same topic intent
        if get_topic_key(r["prompt"]) == latest_topic_key:
            # Check if within 30 minutes time window of the latest run mtime
            if abs(r["mtime"] - latest_mtime) <= 1800:
                engine_name = "unknown"
                for candidate in sorted(CHANNEL_MAP.keys(), key=len, reverse=True):
                    if f"_{candidate}_" in os.path.basename(r["path"]):
                        engine_name = candidate
                        break
                
                # Setup meta on the data
                r["data"]["_run_dir"] = r["path"]
                r["data"]["_engine"] = engine_name
                session_runs.append(r["data"])
                
                # Add to results list
                results_list.append({
                    "engine": engine_name,
                    "run_dir": r["path"],
                    "geo_data": r["geo_data"],
                    "screenshot": os.path.join(r["path"], "screenshot.png"),
                    "report": os.path.join(r["path"], "geo_analysis_report.md")
                })
                
    print(f"[🚀] Found {len(session_runs)} active runs in the latest session. Rebuilding consolidated report...")
    
    topic_data = {
        "original_prompt": latest_prompt,
        "topic_title": get_beautiful_topic_title(latest_prompt, latest_topic_key),
        "runs": session_runs,
        "results_list": results_list
    }
    
    report_file = consolidator.consolidate_topic(latest_topic_key, topic_data)
    
    if report_file:
        print("\n" + "="*70)
        print(" 🎉  GEO SESSION RUN CONSOLIDATED REPORT REGENERATED SUCCESSFULLY!")
        print("="*70)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        print(f" 📂  Unified HTML Report:  {os.path.relpath(report_file, base_dir)}")
        print("="*70 + "\n")
        
        # Automatically open the report in the default browser on completion
        try:
            import webbrowser
            report_abs_path = os.path.abspath(report_file)
            print(f"[🌐] Opening report in default web browser...")
            webbrowser.open(f"file://{report_abs_path}")
        except Exception as e:
            print(f"[!] Warning: Could not open browser automatically: {e}")


if __name__ == "__main__":
    run_retroactive_consolidation()


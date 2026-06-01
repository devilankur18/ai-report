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
    "chatgpt": "Generative AI",
    "gemini": "Generative AI",
    "google": "Generative AI",
    "bing": "Generative AI",
    "perplexity": "Generative AI",
    "google_maps": "Local Maps",
    "bing_maps": "Local Maps",
    "practo": "Directories",
    "justdial": "Directories"
}

CHANNEL_ICONS = {
    "chatgpt": "💬",
    "gemini": "✦",
    "google": "G",
    "bing": "B",
    "perplexity": "𐄂",
    "google_maps": "📍",
    "bing_maps": "🗺️",
    "practo": "🩺",
    "justdial": "JD"
}

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
                    for candidate in CHANNEL_MAP.keys():
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

    def consolidate_topic(self, topic_key, topic_data):
        """Deduplicates, groups, and builds the beautiful scrollable HTML report for a specific topic."""
        runs = topic_data["runs"]
        title = topic_data["topic_title"]
        prompt = topic_data["original_prompt"]
        
        print(f"\n[📦] Consolidating {len(runs)} engine runs for topic: '{title}' ({topic_key})...")
        
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
            for ent in r.get("local_entities", []):
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
        engines_audited = sorted(list(set(engines_audited)))
        html_content = self.render_premium_scroll_html(
            title=title,
            prompt=prompt,
            engines=engines_audited,
            merged_entities=merged_entities,
            directory_entities=directory_entities,
            maps_entities=maps_entities,
            llm_entities=llm_entities,
            web_citations=web_citations
        )
        
        report_file = os.path.join(self.consolidated_dir, f"report_{topic_key}.html")
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"[✓] Premium Consolidated Report generated successfully: {report_file}")
        return report_file

    def render_premium_scroll_html(self, title, prompt, engines, merged_entities, directory_entities, maps_entities, llm_entities, web_citations):
        """Renders the HTML string for the premium long scrollable dashboard."""
        
        # Format metrics
        total_unique = len(merged_entities)
        overlapping_count = sum(1 for e in merged_entities if len(e["sources"]) > 1)
        total_citations = len(web_citations)
        
        # Build engine tags for header
        engine_pills = ""
        for eng in engines:
            c_type = CHANNEL_MAP.get(eng, "Other")
            pill_class = "pill-ai" if c_type == "Generative AI" else "pill-map" if c_type == "Local Maps" else "pill-dir"
            engine_pills += f'<span class="badge {pill_class}">{CHANNEL_ICONS.get(eng, "")} {eng.upper()}</span> '

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
            for s in ent["sources"]:
                c_type = CHANNEL_MAP.get(s, "Other")
                badge_c = "pill-ai" if c_type == "Generative AI" else "pill-map" if c_type == "Local Maps" else "pill-dir"
                source_pills += f'<span class="badge {badge_c}">{CHANNEL_ICONS.get(s, "")} {s}</span>'
                
            # Build ratings list
            ratings_details = ""
            for s, det in ent["detailed_ratings"].items():
                rating_str = f"⭐ {det['rating']}" if det['rating'] != "N/A" else "No rating"
                rev_str = f"({det['review_count']} reviews)" if det['review_count'] != "N/A" else ""
                ratings_details += f'<div class="rating-row"><strong>{s.title()}:</strong> {rating_str} {rev_str}</div>'
                
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

        # Build Directory Listings Section Stack
        dir_cards_html = ""
        if directory_entities:
            for ent in directory_entities:
                fee = ent.get("consultation_fee", "N/A")
                exp = ent.get("experience", "N/A")
                rec = ent.get("recommendation_rate", "N/A")
                dir_cards_html += f"""
                <div class="channel-entity-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4>{ent['name']}</h4>
                        <span class="badge pill-dir">{ent['_source'].upper()}</span>
                    </div>
                    <p class="meta-line">📍 {ent['address']}</p>
                    <p class="meta-line">💼 Experience: {exp} | ⭐ Rating: {ent['rating']} ({ent['review_count']} reviews)</p>
                    {f"<p class='meta-line'>🪙 Fee: {fee} | 👍 Recommend: {rec}</p>" if fee != "N/A" or rec != "N/A" else ""}
                </div>
                """
        else:
            dir_cards_html = "<p class='no-data'>No directory entities extracted in this group.</p>"

        # Build Maps Section Stack
        maps_cards_html = ""
        if maps_entities:
            for ent in maps_entities:
                maps_cards_html += f"""
                <div class="channel-entity-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4>{ent['name']}</h4>
                        <span class="badge pill-map">{ent['_source'].upper()}</span>
                    </div>
                    <p class="meta-line">📍 {ent['address']}</p>
                    <p class="meta-line">⭐ Rating: {ent['rating']} ({ent['review_count']} reviews)</p>
                    {f"<p class='meta-line'>📞 Phone: {ent['phone']}</p>" if ent['phone'] != "N/A" else ""}
                </div>
                """
        else:
            maps_cards_html = "<p class='no-data'>No map profiles extracted in this group.</p>"

        # Build LLM Section Stack
        llm_cards_html = ""
        if llm_entities:
            for ent in llm_entities:
                llm_cards_html += f"""
                <div class="channel-entity-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4>{ent['name']}</h4>
                        <span class="badge pill-ai">{ent['_source'].upper()}</span>
                    </div>
                    <p class="meta-line">📍 {ent['address']}</p>
                    <p class="meta-line">💬 Mention Category: {ent['category']}</p>
                </div>
                """
        else:
            llm_cards_html = "<p class='no-data'>No AI-model mentions parsed in this group.</p>"

        # Build Citations
        citations_html = ""
        if web_citations:
            for cit in web_citations:
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
                <a href="#directories">📂 Directory Listings</a>
                <a href="#maps">🗺️ Maps Listings</a>
                <a href="#generative-ai">🤖 Generative Mentions</a>
                <a href="#citations">📑 Outbound Citations</a>
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
            
            <!-- SECTION 2: Directory Listings -->
            <section id="directories" class="scroll-section">
                <div class="section-header">
                    <h2>📂 Local Directory Listings</h2>
                    <span class="badge pill-dir">Directory Grid</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Local medical and business directories (Practo, Justdial) that power search indices and grounding layers.
                </p>
                <div class="channels-stack">
                    {dir_cards_html}
                </div>
            </section>
            
            <!-- SECTION 3: Maps Listings -->
            <section id="maps" class="scroll-section">
                <div class="section-header">
                    <h2>🗺️ Local Map Listings</h2>
                    <span class="badge pill-map">Maps Grid</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Scraped data points from Google Maps and Bing Maps local listing packs, essential for localized voice searches.
                </p>
                <div class="channels-stack">
                    {maps_cards_html}
                </div>
            </section>
            
            <!-- SECTION 4: Generative Mentions -->
            <section id="generative-ai" class="scroll-section">
                <div class="section-header">
                    <h2>🤖 Generative AI Mentions</h2>
                    <span class="badge pill-ai">AI Streams</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Direct recommendations from conversational search streams (ChatGPT, Gemini) showing routed model names.
                </p>
                <div class="channels-stack">
                    {llm_cards_html}
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
            
            <footer>
                <p>&copy; 2026 GEO Engine Audit Console. All rights reserved. Harmonized local indexing dashboard.</p>
            </footer>
            
        </main>
        
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
    </script>
</body>
</html>
"""

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
            "runs": runs
        }
        
        # Build the scrollable HTML report
        report_file = self.consolidate_topic(topic_key, topic_data)
        return report_file

    def consolidate_topic(self, topic_key, topic_data):
        """Deduplicates, groups, and builds the beautiful scrollable HTML report for a specific topic."""
        runs = topic_data["runs"]
        title = topic_data["topic_title"]
        prompt = topic_data["original_prompt"]
        
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
            for ent in r.get("local_entities", []):
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
        engines_audited = sorted(list(set(engines_audited)))
        html_content = self.render_premium_scroll_html(
            title=title,
            prompt=prompt,
            engines=engines_audited,
            merged_entities=merged_entities,
            directory_entities=directory_entities,
            maps_entities=maps_entities,
            llm_entities=llm_entities,
            web_citations=web_citations
        )
        
        report_file = os.path.join(self.consolidated_dir, f"report_{topic_key}.html")
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"[✓] Premium Consolidated Report generated successfully: {report_file}")
        return report_file

    def render_premium_scroll_html(self, title, prompt, engines, merged_entities, directory_entities, maps_entities, llm_entities, web_citations):
        """Renders the HTML string for the premium long scrollable dashboard."""
        
        # Format metrics
        total_unique = len(merged_entities)
        overlapping_count = sum(1 for e in merged_entities if len(e["sources"]) > 1)
        total_citations = len(web_citations)
        
        # Build engine tags for header
        engine_pills = ""
        for eng in engines:
            c_type = CHANNEL_MAP.get(eng, "Other")
            pill_class = "pill-ai" if c_type == "Generative AI" else "pill-map" if c_type == "Local Maps" else "pill-dir"
            engine_pills += f'<span class="badge {pill_class}">{CHANNEL_ICONS.get(eng, "")} {eng.upper()}</span> '

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
            for s in ent["sources"]:
                c_type = CHANNEL_MAP.get(s, "Other")
                badge_c = "pill-ai" if c_type == "Generative AI" else "pill-map" if c_type == "Local Maps" else "pill-dir"
                source_pills += f'<span class="badge {badge_c}">{CHANNEL_ICONS.get(s, "")} {s}</span>'
                
            # Build ratings list
            ratings_details = ""
            for s, det in ent["detailed_ratings"].items():
                rating_str = f"⭐ {det['rating']}" if det['rating'] != "N/A" else "No rating"
                rev_str = f"({det['review_count']} reviews)" if det['review_count'] != "N/A" else ""
                ratings_details += f'<div class="rating-row"><strong>{s.title()}:</strong> {rating_str} {rev_str}</div>'
                
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

        # Build Directory Listings Section Stack
        dir_cards_html = ""
        if directory_entities:
            for ent in directory_entities:
                fee = ent.get("consultation_fee", "N/A")
                exp = ent.get("experience", "N/A")
                rec = ent.get("recommendation_rate", "N/A")
                dir_cards_html += f"""
                <div class="channel-entity-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4>{ent['name']}</h4>
                        <span class="badge pill-dir">{ent['_source'].upper()}</span>
                    </div>
                    <p class="meta-line">📍 {ent['address']}</p>
                    <p class="meta-line">💼 Experience: {exp} | ⭐ Rating: {ent['rating']} ({ent['review_count']} reviews)</p>
                    {f"<p class='meta-line'>🪙 Fee: {fee} | 👍 Recommend: {rec}</p>" if fee != "N/A" or rec != "N/A" else ""}
                </div>
                """
        else:
            dir_cards_html = "<p class='no-data'>No directory entities extracted in this group.</p>"

        # Build Maps Section Stack
        maps_cards_html = ""
        if maps_entities:
            for ent in maps_entities:
                maps_cards_html += f"""
                <div class="channel-entity-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4>{ent['name']}</h4>
                        <span class="badge pill-map">{ent['_source'].upper()}</span>
                    </div>
                    <p class="meta-line">📍 {ent['address']}</p>
                    <p class="meta-line">⭐ Rating: {ent['rating']} ({ent['review_count']} reviews)</p>
                    {f"<p class='meta-line'>📞 Phone: {ent['phone']}</p>" if ent['phone'] != "N/A" else ""}
                </div>
                """
        else:
            maps_cards_html = "<p class='no-data'>No map profiles extracted in this group.</p>"

        # Build LLM Section Stack
        llm_cards_html = ""
        if llm_entities:
            for ent in llm_entities:
                llm_cards_html += f"""
                <div class="channel-entity-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4>{ent['name']}</h4>
                        <span class="badge pill-ai">{ent['_source'].upper()}</span>
                    </div>
                    <p class="meta-line">📍 {ent['address']}</p>
                    <p class="meta-line">💬 Mention Category: {ent['category']}</p>
                </div>
                """
        else:
            llm_cards_html = "<p class='no-data'>No AI-model mentions parsed in this group.</p>"

        # Build Citations
        citations_html = ""
        if web_citations:
            for cit in web_citations:
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
                <a href="#directories">📂 Directory Listings</a>
                <a href="#maps">🗺️ Maps Listings</a>
                <a href="#generative-ai">🤖 Generative Mentions</a>
                <a href="#citations">📑 Outbound Citations</a>
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
            
            <!-- SECTION 2: Directory Listings -->
            <section id="directories" class="scroll-section">
                <div class="section-header">
                    <h2>📂 Local Directory Listings</h2>
                    <span class="badge pill-dir">Directory Grid</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Local medical and business directories (Practo, Justdial) that power search indices and grounding layers.
                </p>
                <div class="channels-stack">
                    {dir_cards_html}
                </div>
            </section>
            
            <!-- SECTION 3: Maps Listings -->
            <section id="maps" class="scroll-section">
                <div class="section-header">
                    <h2>🗺️ Local Map Listings</h2>
                    <span class="badge pill-map">Maps Grid</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Scraped data points from Google Maps and Bing Maps local listing packs, essential for localized voice searches.
                </p>
                <div class="channels-stack">
                    {maps_cards_html}
                </div>
            </section>
            
            <!-- SECTION 4: Generative Mentions -->
            <section id="generative-ai" class="scroll-section">
                <div class="section-header">
                    <h2>🤖 Generative AI Mentions</h2>
                    <span class="badge pill-ai">AI Streams</span>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-muted); font-size: 0.9rem;">
                    Direct recommendations from conversational search streams (ChatGPT, Gemini) showing routed model names.
                </p>
                <div class="channels-stack">
                    {llm_cards_html}
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
            
            <footer>
                <p>&copy; 2026 GEO Engine Audit Console. All rights reserved. Harmonized local indexing dashboard.</p>
            </footer>
            
        </main>
        
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

if __name__ == "__main__":
    # If run standalone, print warning since consolidator now expects active list from geo_cli.py
    print("[!] GEO consolidator expects active run results list. Launching CLI instead...")


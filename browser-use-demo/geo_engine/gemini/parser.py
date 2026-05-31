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
    
    # Remove escaped/unicode artifacts
    for artifact in ['\\u200', '\\u201', '\\u202', 'ue200', 'ue201', 'ue202', '\\']:
        url = url.replace(artifact, '')
        
    # Clean up trailing punctuation, brackets, parentheses or markdown artifacts
    url = url.rstrip(')]}*#.,;:!?% \t\n\r')
    return url

def is_valid_local_entity(name):
    if not name:
        return False
    name_lower = name.lower()
    for ignored in ["display title", "product a", "product b", "entity_name"]:
        if ignored in name_lower:
            return False
    return True

def parse_gemini_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw network stream log from {input_file} for GEO insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Try to extract the original prompt from the file header
    original_prompt = "Unknown Prompt"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": False,
        "routed_model": "Unknown Model",
        "search_queries": [],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Set up lists/sets to gather stream data
    all_urls = set()
    final_text = ""
    model_names = set()
    citations_data = []

    # Regex to find all serialized inner JSON lists starting withwr.fr
    lines = content.splitlines()
    for line in lines:
        if line.strip().startswith('[["wrb.fr"'):
            try:
                outer = json.loads(line.strip())
                for item in outer:
                    if len(item) > 2 and item[0] == "wrb.fr" and item[2]:
                        inner_data = json.loads(item[2])
                        
                        # 1. Check routed model name (usually at index 17 or 42 or we can search)
                        # We can traverse the inner data list looking for model signatures
                        def traverse_model(obj):
                            if isinstance(obj, str):
                                # Precise matching using anchors to avoid matching words like "Profile" or "prompt"
                                if obj in ["3.5 Flash", "1.5 Pro", "1.5 Flash", "1.0 Pro", "2.0 Pro", "2.0 Flash"] or re.match(r'^\d+\.\d+\s+(Flash|Pro)$', obj):
                                    model_names.add(obj)
                            elif isinstance(obj, list):
                                for x in obj: traverse_model(x)
                            elif isinstance(obj, dict):
                                for v in obj.values(): traverse_model(v)
                        traverse_model(inner_data)

                        # 2. Check if search invoked (key "7" has "google")
                        if len(inner_data) > 2 and isinstance(inner_data[2], dict):
                            search_obj = inner_data[2].get("7")
                            if search_obj and isinstance(search_obj, list):
                                for entry in search_obj:
                                    if isinstance(entry, list) and len(entry) > 0:
                                        if entry[0] == "google" or "Google Search" in str(entry):
                                            extracted_data["search_invoked"] = True

                        # 3. Extract final response text from index 4
                        if len(inner_data) > 4 and inner_data[4]:
                            chunks = inner_data[4]
                            for chunk in chunks:
                                if len(chunk) > 1 and chunk[1]:
                                    text_val = chunk[1]
                                    if isinstance(text_val, list) and len(text_val) > 0:
                                        final_text = text_val[0]

                                # 4. Extract citations structured data if present in index 4[0][2]
                                if len(chunk) > 2 and chunk[2]:
                                    block2 = chunk[2]
                                    if isinstance(block2, list):
                                        for cit in block2:
                                            if isinstance(cit, list) and len(cit) > 2 and cit[2]:
                                                for src in cit[2]:
                                                    if isinstance(src, list) and len(src) > 0:
                                                        citations_data.append(src)
            except Exception:
                pass

    # Resolve Routed Model
    if model_names:
        extracted_data["routed_model"] = list(model_names)[-1]

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

    # Process and build citations and outbound URLs
    for src in citations_data:
        if not isinstance(src, list):
            continue
        # source format: [url, title, favicon, snippet, ..., name]
        url = src[0] if (len(src) > 0 and src[0]) else None
        title = src[1] if (len(src) > 1 and src[1]) else ""

        if url:
            cleaned = clean_url(url)
            if cleaned and cleaned.startswith("http"):
                # Avoid raw google domains
                if "google.com" in cleaned or "gstatic.com" in cleaned or "googleapis.com" in cleaned:
                    continue
                all_urls.add(cleaned)
                if title:
                    url_to_title[cleaned] = str(title).strip()

    # Walk general URLs in the stream as fallback
    url_pattern = re.compile(r'https?://[^\s"\'\}]+')
    general_urls = url_pattern.findall(content)
    for url in general_urls:
        cleaned = clean_url(url)
        if cleaned and cleaned.startswith("http"):
            if "google.com" in cleaned or "gstatic.com" in cleaned or "googleapis.com" in cleaned:
                continue
            all_urls.add(cleaned)

    # Classify URLs into Web Citations and UTM Sources
    for url in sorted(all_urls):
        title = url_to_title.get(url) or get_fallback_title(url)
        cit_obj = {"title": title, "url": url}

        if "utm_" in url:
            if not any(u["url"] == url for u in extracted_data["utm_sources"]):
                extracted_data["utm_sources"].append(cit_obj)
        else:
            if not any(c["url"] == url for c in extracted_data["web_citations"]):
                extracted_data["web_citations"].append(cit_obj)

    # 5. Parse Local Entities directly from the generated response markdown
    # Gemini regularly formats recommendations as:
    # ### 1. Dr. Name
    # * **Profile:** ...
    # * **Location:** ...
    entity_blocks = re.split(r'###\s+(\d+)\.\s*', final_text)
    if len(entity_blocks) > 1:
        # The first element is before the first rank
        for i in range(1, len(entity_blocks), 2):
            rank = entity_blocks[i]
            block_content = entity_blocks[i+1] if i+1 < len(entity_blocks) else ""
            
            # Extract name (first line of the content block or rank matched header)
            name_lines = block_content.splitlines()
            name_header = name_lines[0].strip() if name_lines else ""
            name = name_header.replace("**", "").replace("*", "").strip()
            
            # Clean up trailing Markdown headers
            name = re.sub(r'\s*\([^)]+\)', '', name)  # remove parentheses details if clean is needed
            name = name.split("---")[0].strip()
            
            if not is_valid_local_entity(name):
                continue
                
            # Extract Location
            location = "Local Region"
            loc_match = re.search(r'\*\s+\*\*Location:\*\*\s*([^\n]+)', block_content)
            if loc_match:
                location = loc_match.group(1).replace("**", "").strip()
                
            # Extract Specialization / Profile
            profile = "Specialist"
            profile_match = re.search(r'\*\s+\*\*Profile:\*\*\s*([^\n]+)', block_content)
            if profile_match:
                profile = profile_match.group(1).replace("**", "").strip()

            entity_dict = {
                "name": name,
                "category": profile,
                "address": location,
                "rating": "N/A",  # Fallbacks for structure parity
                "review_count": "N/A",
                "phone": "N/A",
                "website_url": "N/A"
            }
            
            # Cross-reference with citations to attach real websites
            for src in citations_data:
                if not isinstance(src, list):
                    continue
                url = src[0] if (len(src) > 0 and src[0]) else None
                title = src[1] if (len(src) > 1 and src[1]) else ""
                brand = src[6] if (len(src) > 6 and src[6]) else ""
                
                if url and (name.lower() in title.lower() or name.lower() in brand.lower() or (brand and brand.lower() in name.lower())):
                    entity_dict["website_url"] = clean_url(url)
                    break
                    
            extracted_data["local_entities"].append(entity_dict)

    # Synthesize search queries based on the prompt if no exact chips were loaded
    if extracted_data["search_invoked"]:
        # Fallback to smart query extraction from prompt keywords
        query = original_prompt.replace("My 55-year-old mother is diabetic and experiencing mild chest pain after walking.", "").strip()
        query = query.replace("Who are the most reliable ", "").replace("Who is the most reliable ", "")
        query = query.replace("with good reviews, and what should I ask them?", "").replace("with top ratings?", "").strip()
        if query and query not in extracted_data["search_queries"]:
            extracted_data["search_queries"].append(query)
        else:
            extracted_data["search_queries"].append(original_prompt[:100] + "...")

    # Save structured data to json
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured GEO Data saved to: {output_json}")

    # Generate Markdown GEO Analysis Report
    entity_rows = []
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent.get("rating") or "N/A"
            reviews = ent.get("review_count") or "N/A"
            phone = ent.get("phone") or "N/A"
            
            website_url = ent.get("website_url")
            website_md = f"[Link]({website_url})" if website_url and website_url != "N/A" else "N/A"
            
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {website_md} |")
    else:
        entity_rows.append("| *None* | No structured entities parsed | N/A | N/A | N/A | N/A | N/A | N/A |")

    citations_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["web_citations"]]) if extracted_data["web_citations"] else "* No web citations found."
    utm_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["utm_sources"]]) if extracted_data["utm_sources"] else "* No UTM-tagged sources found."

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report [Google Gemini]
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Routed Model (AI Brain)**: `{extracted_data["routed_model"]}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: Google Gemini translates conversational queries into search context backed by the Google Search index. To rank on Gemini, you must optimize for highly descriptive long-tail search indices!

---

## 2. Structured Entity Extraction (The Local Pack)

Google Gemini fetched and highlighted key medical providers. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location | Rating | Reviews | Phone | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **Gemini SEO Optimization**: Gemini relies heavily on trusted medical networks, institutional authority (like AIIMS or Practo), and clear geo-location anchors.

---

## 3. Web Citations & Outbound Sources (The GA4 Goldmine)

Gemini integrates direct links to verify providers.

### Outbound Citations & Resources:
{citations_list}

### Safe Outbound URLs with Hardcoded UTMs:
{utm_list}

> [!WARNING]
> **Attribution & Referrals**: Track organic traffic variations from `google.com` inside GA4, as search integrations increase click-through behavior to target properties!

---

## 4. Algorithmic Recommendation Prediction Model

Based on this network trace, Google Gemini's recommendation architecture relies on direct indexing:

```mermaid
graph TD
    A[Human Prompt] --> B(Gemini Intent Processing)
    B --> C{{Google Search Extension Trigger?}}
    C -->|Yes| D[Google Search Engine Query Execution]
    C -->|Yes| E[High-Authority Source Citations]
    D --> F[Ranked Location/Directory Synthesis]
    E --> G[Authority Outbound References]
    F & G --> H[Contextual LLM Triage & Stream Output]
    H --> I[Final Answer UI Output]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted GEO Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Gemini stream log parser")
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
        
    parse_gemini_logs(input_file, output_json, output_md)

import json
import re
import os
import argparse
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import geo_config

def clean_url(url):
    if not url:
        return None
    # Replace backslash-escaped control characters first
    url = url.replace('\\n', '').replace('\\t', '').replace('\\r', '')
    
    # Remove escaped/unicode artifacts
    for artifact in ['\\u200', '\\u201', '\\u202', 'ue200', 'ue201', 'ue202', '\\']:
        url = url.replace(artifact, '')
        
    # Clean up trailing punctuation, brackets, parentheses or markdown artifacts
    url = url.rstrip(')]}*#.,;:!?% \t\n\r')
    return url

def is_valid_local_entity(name, category):
    if name in ["<entity_name>", "Display title", "Product A", "Product B", "Product C", "Product D", "Product E", "Product Title", "Product Name"]:
        return False
    if category in ["turnXproductY", "<entity_category>", "<ref_id>"]:
        return False
    if category.startswith("<") or category.startswith("turnX") or "product" in category.lower():
        return False
    
    valid_categories = ["local_business", "organization", "people", "place", "medical", "business", "health", "hospital", "doctor", "clinic", "cardiologist", "practitioner"]
    if category in valid_categories or "business" in category or "hospital" in category:
        return True
    return False

def parse_geo_logs(input_file, output_json, output_md):
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

    search_query = None
    query_match = re.search(r"SEARCH_QUERY:\s*(.+)\n", content)
    if query_match:
        search_query = query_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": False,
        "routed_model": "Unknown Model",
        "search_queries": [],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # 1. Parse Search Queries
    # Look for search("...") patterns in the raw stream
    query_matches = re.findall(r'search\("([^"]+)"\)', content)
    for q in query_matches:
        q_clean = q.strip()
        if q_clean and q_clean not in extracted_data["search_queries"]:
            extracted_data["search_queries"].append(q_clean)
            extracted_data["search_invoked"] = True

    # Also check for escaped quotes in searches
    query_matches_esc = re.findall(r'search\(\\\"([^"]+)\\\"\)', content)
    for q in query_matches_esc:
        q_clean = q.replace('\\"', '"').strip()
        if q_clean and q_clean not in extracted_data["search_queries"]:
            extracted_data["search_queries"].append(q_clean)
            extracted_data["search_invoked"] = True

    # Check for "queries": [...] inside JSON structures in the log
    queries_json_matches = re.findall(r'"queries":\s*\[([^\]]+)\]', content)
    for q_list in queries_json_matches:
        for q in re.findall(r'"([^"]+)"', q_list):
            q_clean = q.strip()
            if q_clean and q_clean not in extracted_data["search_queries"]:
                extracted_data["search_queries"].append(q_clean)
                extracted_data["search_invoked"] = True

    # If no searches were dynamically triggered, add the target search_query as a fallback reference
    if not extracted_data["search_queries"] and search_query:
        extracted_data["search_queries"].append(search_query)

    # 2. Precise state machine tracking of content references and JSON patches
    content_refs = []
    model_slugs = set()
    resolved_model_slugs = set()
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

    def handle_patch(patch):
        nonlocal content_refs
        p = patch.get("p")
        o = patch.get("o")
        v = patch.get("v")
        
        if not p:
            return
            
        # Append to references array
        if p == "/message/metadata/content_references" and o == "append":
            if isinstance(v, list):
                content_refs.extend(v)
        elif p == "/message/metadata/content_references" and o == "add":
            content_refs.append(v)
        # Patch specific element attributes
        elif p.startswith("/message/metadata/content_references/"):
            parts = p.split('/')
            if len(parts) >= 5:
                try:
                    idx = int(parts[4])
                    while len(content_refs) <= idx:
                        content_refs.append({})
                    
                    if len(parts) == 5:
                        if o == "replace":
                            content_refs[idx] = v
                        elif o == "append" and isinstance(v, dict):
                            if isinstance(content_refs[idx], dict):
                                content_refs[idx].update(v)
                            else:
                                content_refs[idx] = v
                    elif len(parts) == 6:
                        attr = parts[5]
                        if o == "replace":
                            content_refs[idx][attr] = v
                        elif o == "remove":
                            if attr in content_refs[idx]:
                                del content_refs[idx][attr]
                        elif o == "append":
                            if isinstance(content_refs[idx].get(attr), list) and isinstance(v, list):
                                content_refs[idx][attr].extend(v)
                            elif isinstance(content_refs[idx].get(attr), dict) and isinstance(v, dict):
                                content_refs[idx][attr].update(v)
                            else:
                                content_refs[idx][attr] = v
                except ValueError:
                    pass

    def traverse(obj):
        nonlocal all_urls, url_to_title
        if isinstance(obj, dict):
            # Capture model slugs
            if "model_slug" in obj:
                model_slugs.add(obj["model_slug"])
            if "resolved_model_slug" in obj:
                resolved_model_slugs.add(obj["resolved_model_slug"])
                
            # Process direct and nested patches
            if "p" in obj and "o" in obj:
                handle_patch(obj)
            
            v_list = obj.get("v")
            if isinstance(v_list, list) and obj.get("o") == "patch":
                for patch in v_list:
                    handle_patch(patch)

            # Match URL + title if side-by-side
            url = obj.get("url")
            title = obj.get("title") or obj.get("name") or obj.get("alt") or obj.get("display_name")
            if isinstance(url, str) and url.startswith("http") and title and not isinstance(title, (dict, list)):
                url_to_title[url] = str(title).strip()

            # Capture URLs under standard citation keys
            for k, v in obj.items():
                if k in ["url", "safe_urls", "refs", "citations"]:
                    if isinstance(v, str) and v.startswith("http"):
                        all_urls.add(v)
                    elif isinstance(v, list):
                        for item in v:
                            if isinstance(item, str) and item.startswith("http"):
                                all_urls.add(item)
                            elif isinstance(item, dict) and item.get("url"):
                                all_urls.add(item["url"])
                                if item.get("title"):
                                    url_to_title[item["url"]] = str(item["title"]).strip()
                else:
                    traverse(v)
        elif isinstance(obj, list):
            for item in obj:
                traverse(item)

    lines = content.splitlines()
    for line in lines:
        if line.startswith("data: "):
            json_str = line[6:].strip()
            try:
                data = json.loads(json_str)
                traverse(data)
            except Exception:
                pass

    # Resolve Routed Model
    if resolved_model_slugs:
        extracted_data["routed_model"] = list(resolved_model_slugs)[-1]
    elif model_slugs:
        extracted_data["routed_model"] = list(model_slugs)[-1]

    # Process and build local entities list from precise references
    for ref in content_refs:
        # Resolve titles from content references
        url = ref.get("url")
        if url:
            title = ref.get("title") or ref.get("name") or ref.get("alt") or ref.get("display_name")
            if title and not isinstance(title, (dict, list)):
                url_to_title[url] = str(title).strip()

        name = ref.get("name") or ref.get("alt")
        category = ref.get("category")
        if name and category and is_valid_local_entity(name, category):
            location = "Local Region"
            entity_data = ref.get("entity_data")
            if entity_data and isinstance(entity_data, dict):
                location = entity_data.get("address") or entity_data.get("location") or location
            if location == "Local Region":
                if ref.get("extra_params") and isinstance(ref["extra_params"], dict):
                    location = ref["extra_params"].get("location") or ref["extra_params"].get("disambiguation") or location
                elif ref.get("location"):
                    location = ref["location"]

            # Avoid duplicates while retaining index-first mapping
            if not any(e["name"] == name for e in extracted_data["local_entities"]):
                entity_dict = {
                    "name": name,
                    "category": category,
                    "address": location
                }
                
                # Populate rich analytics attributes if present
                if entity_data and isinstance(entity_data, dict):
                    entity_dict.update({
                        "rating": entity_data.get("rating"),
                        "review_count": entity_data.get("review_count"),
                        "latitude": entity_data.get("latitude"),
                        "longitude": entity_data.get("longitude"),
                        "phone": entity_data.get("phone"),
                        "website_url": clean_url(entity_data.get("website_url")),
                        "gmb_categories": entity_data.get("categories")
                    })
                extracted_data["local_entities"].append(entity_dict)

    # Fallback to general URL extraction via regex for links in citations/text
    url_pattern = re.compile(r'https?://[^\s"\'\}]+')
    urls_found = url_pattern.findall(content)
    for url in urls_found:
        url_clean = clean_url(url)
        if url_clean and url_clean.startswith("http"):
            all_urls.add(url_clean)

    # Classify URLs into Web Citations and UTM Sources
    for url in sorted(all_urls):
        # Ignore raw chatgpt.com API endpoints
        if "chatgpt.com/backend" in url or "chatgpt.com/api" in url:
            continue
        
        title = url_to_title.get(url) or get_fallback_title(url)
        cit_obj = {"title": title, "url": url}

        if "utm_source" in url:
            if not any(u["url"] == url for u in extracted_data["utm_sources"]):
                extracted_data["utm_sources"].append(cit_obj)
        else:
            if not any(c["url"] == url for c in extracted_data["web_citations"]):
                extracted_data["web_citations"].append(cit_obj)

    # Save structured data to json
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured GEO Data saved to: {output_json}")

    # Generate Markdown GEO Analysis Report
    entity_rows = []
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent.get("rating") if ent.get("rating") is not None else "N/A"
            reviews = ent.get("review_count") if ent.get("review_count") is not None else "N/A"
            phone = ent.get("phone") if ent.get("phone") is not None else "N/A"
            
            website_url = ent.get("website_url")
            website_md = f"[Link]({website_url})" if website_url else "N/A"
            
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {website_md} |")
    else:
        entity_rows.append("| *None* | No structured entities parsed | N/A | N/A | N/A | N/A | N/A | N/A |")

    citations_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["web_citations"]]) if extracted_data["web_citations"] else "* No web citations found."
    utm_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["utm_sources"]]) if extracted_data["utm_sources"] else "* No UTM-tagged sources found."

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Routed Model (AI Brain)**: `{extracted_data["routed_model"]}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: ChatGPT maps conversational prompts into traditional, intent-dense search queries. To win GEO traffic, you must optimize for these robotic search variations!

---

## 2. Structured Entity Extraction (The Local Pack)

ChatGPT fetched and utilized structured local business data from its search providers. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location | Rating | Reviews | Phone | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **AI Directories & GMB Optimization**: The AI relies heavily on high-accuracy location signals, review sentiment, and structural optimization (GMB profiles and direct citations).

---

## 3. Web Citations & Hardcoded Tracking (The GA4 Goldmine)

ChatGPT cites trusted sources to verify practitioners.

### Outbound Citations & Resources:
{citations_list}

### Safe Outbound URLs with Hardcoded UTMs:
{utm_list}

> [!WARNING]
> **GA4 Attribution**: OpenAI is actively hardcoding `?utm_source=chatgpt.com` onto outbound citation links. Track your direct AI citation conversions inside Google Analytics!

---

## 4. Algorithmic Recommendation Prediction Model

Based on this network trace, ChatGPT's recommendation algorithm uses a three-tier model:

```mermaid
graph TD
    A[Human Prompt] --> B(LLM Intent Translation)
    B --> C{{Trigger Search?}}
    C -->|Yes| D[Labrador Local Entity Search]
    C -->|Yes| E[SERP Web Citation Fetch]
    D --> F[Structured Local Ranking]
    E --> G[Authority Aggregator Citations]
    F & G --> H[LLM Triage & Memory Synthesis]
    H --> I[Final Answer UI Output]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted GEO Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GEO stream log parser")
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
        
    parse_geo_logs(input_file, output_json, output_md)

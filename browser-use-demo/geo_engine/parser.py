import json
import re
import os
import argparse

def clean_url(url):
    # Replace backslash-escaped control characters first
    url = url.replace('\\n', '').replace('\\t', '').replace('\\r', '')
    
    # Remove escaped/unicode artifacts
    for artifact in ['\\u200', '\\u201', '\\u202', 'ue200', 'ue201', 'ue202', '\\']:
        url = url.replace(artifact, '')
        
    # Clean up trailing punctuation, brackets, parentheses or markdown artifacts
    url = url.rstrip(')]}*#.,;:!?% \t\n\r')
    return url

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

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": False,
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

    # 2. Parse SSE data lines to extract local entities and citations
    lines = content.splitlines()
    all_entities = {}
    all_urls = set()

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

    def traverse(obj):
        if isinstance(obj, dict):
            name = obj.get("name") or obj.get("title") or obj.get("alt")
            category = obj.get("category")
            if name and category and is_valid_local_entity(name, category):
                location = "Local Region"
                if obj.get("extra_params") and isinstance(obj["extra_params"], dict):
                    location = obj["extra_params"].get("location") or obj["extra_params"].get("disambiguation") or location
                elif obj.get("location"):
                    location = obj["location"]
                
                if name not in all_entities:
                    all_entities[name] = {
                        "name": name,
                        "category": category,
                        "address": location
                    }

            # Check for URLs
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
                else:
                    traverse(v)
        elif isinstance(obj, list):
            for item in obj:
                traverse(item)

    for line in lines:
        if line.startswith("data: "):
            json_str = line[6:].strip()
            try:
                data = json.loads(json_str)
                traverse(data)
            except Exception:
                pass

    # Fallback to general URL extraction via regex for links in citations/text
    url_pattern = re.compile(r'https?://[^\s"\'\}]+')
    urls_found = url_pattern.findall(content)
    for url in urls_found:
        url_clean = clean_url(url)
        if url_clean.startswith("http"):
            all_urls.add(url_clean)

    # Classify URLs into Web Citations and UTM Sources
    for url in sorted(all_urls):
        # Ignore raw chatgpt.com API endpoints
        if "chatgpt.com/backend" in url or "chatgpt.com/api" in url:
            continue
        if "utm_source" in url:
            if url not in extracted_data["utm_sources"]:
                extracted_data["utm_sources"].append(url)
        else:
            if url not in extracted_data["web_citations"]:
                extracted_data["web_citations"].append(url)

    # Convert extracted entities dict to a list
    extracted_data["local_entities"] = list(all_entities.values())

    # Save structured data to json
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured GEO Data saved to: {output_json}")

    # Generate Markdown GEO Analysis Report
    entity_rows = []
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} |")
    else:
        entity_rows.append("| *None* | No structured entities parsed | N/A | N/A |")

    citations_list = "\n".join([f"* [{url.split('?')[0]}]({url})" for url in extracted_data["web_citations"]]) if extracted_data["web_citations"] else "* No web citations found."
    utm_list = "\n".join([f"* [{url.split('?')[0]}]({url})" for url in extracted_data["utm_sources"]]) if extracted_data["utm_sources"] else "* No UTM-tagged sources found."

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: ChatGPT maps conversational prompts into traditional, intent-dense search queries. To win GEO traffic, you must optimize for these robotic search variations!

---

## 2. Structured Entity Extraction (The Local Pack)

ChatGPT fetched and utilized structured local business data from its search providers. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location |
| :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **AI Directories**: The AI relies heavily on high-authority directories. Flawless directory synchronization is critical.

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
    parser.add_argument("--input", required=True, help="Path to input raw stream text file")
    parser.add_argument("--json", required=True, help="Path to output structured json file")
    parser.add_argument("--md", required=True, help="Path to output markdown report")
    args = parser.parse_args()
    
    parse_geo_logs(args.input, args.json, args.md)

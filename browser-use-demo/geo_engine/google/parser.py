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

def parse_google_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Google search log from {input_file} for GEO insights...")
    
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
        "routed_model": "Google AI Overview / SERP",
        "search_queries": [],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Extract search query keywords as simulated search queries
    if search_query:
        extracted_data["search_queries"].append(search_query)
    elif original_prompt and original_prompt != "Unknown Prompt":
        extracted_data["search_queries"].append(original_prompt[:80] + "...")

    # Look for [GOOGLE DOM EXTRACTION RESULTS] in raw stream log
    dom_data = {}
    dom_marker = "[GOOGLE DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON braces in Google DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON DOM extraction portion: {e}")


    ai_overview_text = dom_data.get("ai_overview", "")
    local_results = dom_data.get("local_results", [])
    organic_results = dom_data.get("organic_results", [])

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

    # Process Local Entities
    for item in local_results:
        name = item.get("name", "").strip()
        if not name:
            continue
        
        rating = item.get("rating", "N/A")
        review_count = item.get("reviewCount", "N/A")
        phone = item.get("phone", "N/A")
        
        website = clean_url(item.get("websiteUrl"))
        if website and website != "N/A":
            all_urls.add(website)
            url_to_title[website] = f"{name} - Website"
        else:
            website = "N/A"

        entity_dict = {
            "name": name,
            "category": item.get("category", "Orthopedic Surgeon"),
            "address": item.get("address", "Lucknow, India"),
            "rating": rating,
            "review_count": review_count,
            "phone": phone,
            "website_url": website
        }
        extracted_data["local_entities"].append(entity_dict)

    # Gather URLs from organic results
    for org in organic_results:
        url = clean_url(org.get("url"))
        title = org.get("title", "").strip()
        if url:
            all_urls.add(url)
            if title:
                url_to_title[url] = title

    # Extract general URLs mentioned in AI overview or text as fallback
    url_pattern = re.compile(r'https?://[^\s"\'\}]+')
    if ai_overview_text:
        overview_urls = url_pattern.findall(ai_overview_text)
        for url in overview_urls:
            cleaned = clean_url(url)
            if cleaned:
                all_urls.add(cleaned)

    # Also check general log content for fallback links
    general_urls = url_pattern.findall(content)
    for url in general_urls:
        cleaned = clean_url(url)
        if cleaned:
            all_urls.add(cleaned)

    # Sort and classify outbound URLs
    for url in sorted(all_urls):
        if "google.com" in url or "gstatic.com" in url or "googleapis.com" in url:
            continue
        
        title = url_to_title.get(url) or get_fallback_title(url)
        cit_obj = {"title": title, "url": url}

        if "utm_" in url:
            if not any(u["url"] == url for u in extracted_data["utm_sources"]):
                extracted_data["utm_sources"].append(cit_obj)
        else:
            if not any(c["url"] == url for c in extracted_data["web_citations"]):
                extracted_data["web_citations"].append(cit_obj)

    # Save to json file
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured GEO Data saved to: {output_json}")

    # Generate Markdown report
    entity_rows = []
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent["rating"]
            reviews = ent["review_count"]
            phone = ent["phone"]
            website_url = ent["website_url"]
            website_md = f"[Link]({website_url})" if website_url != "N/A" else "N/A"
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {website_md} |")
    else:
        entity_rows.append("| *None* | No local entities extracted | N/A | N/A | N/A | N/A | N/A | N/A |")

    citations_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["web_citations"][:15]]) if extracted_data["web_citations"] else "* No web citations found."
    utm_list = "\n".join([f"* [{cit['title']}]({cit['url']})" for cit in extracted_data["utm_sources"]]) if extracted_data["utm_sources"] else "* No UTM-tagged sources found."

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report [Google Search]
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Routed Model (AI Brain)**: `{extracted_data["routed_model"]}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: Google Search intercepts prompts to load matching local directories, maps, and organic sources. In addition, Google's AI Overview summarizes highly authoritative search index pages.

---

## 2. Structured Entity Extraction (The Local Pack / Map Results)

Google Search fetched and highlighted key local providers. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location | Rating | Reviews | Phone | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **Google Maps/GMB Optimization**: Optimizing Google Business Profiles (GBP), increasing highly positive local user reviews, and asserting strong local citations is core to winning Google local placement.

---

## 3. Web Citations & Outbound Sources (The GA4 Goldmine)

Google Search integrates high-authority organic listings and AI Overview links to substantiate claims.

### Outbound Citations & Resources:
{citations_list}

### Safe Outbound URLs with Hardcoded UTMs:
{utm_list}

> [!WARNING]
> **Organic & AI Referrals**: Maintain highly structured schema markers and high Authority Backlinks to be cited in Google's AI Overview or top organic listings.

---

## 4. Algorithmic Recommendation Prediction Model

Based on this extraction trace, Google Search's ranking model acts as follows:

```mermaid
graph TD
    A[Human Prompt] --> B(Google Search Intent Extraction)
    B --> C{{Google Local Map vs AI Overview?}}
    C -->|Local Maps| D[Google Local GBP Pack]
    C -->|Organic/AI| E[High-Authority Search Index Web Fetch]
    D --> F[Structured Maps Listing]
    E --> G[Authority AI Overview/SERP Synthesis]
    F & G --> H[Unified Search Results Presentation]
    H --> I[Final Answer UI Output]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted GEO Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Search DOM log parser")
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
        
    parse_google_logs(input_file, output_json, output_md)

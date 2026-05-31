import json
import re
import os
import argparse

import base64

def unwrap_bing_url(url):
    if not url or not isinstance(url, str):
        return url
    if "bing.com/ck/a?!" in url:
        match = re.search(r'[?&]u=([^&]+)', url)
        if match:
            u_val = match.group(1)
            if u_val.startswith('a1'):
                u_val = u_val[2:]
            missing_padding = len(u_val) % 4
            if missing_padding:
                u_val += '=' * (4 - missing_padding)
            try:
                decoded_bytes = base64.urlsafe_b64decode(u_val)
                return decoded_bytes.decode('utf-8', errors='ignore')
            except Exception:
                pass
    return url

def clean_url(url):
    if not url or not isinstance(url, str):
        return None
    url = unwrap_bing_url(url)
    url = url.replace('\\n', '').replace('\\t', '').replace('\\r', '')
    for artifact in ['\\u200', '\\u201', '\\u202', 'ue200', 'ue201', 'ue202', '\\']:
        url = url.replace(artifact, '')
    url = url.rstrip(')]}*#.,;:!?% \t\n\r')
    return url

def parse_bing_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Bing search log from {input_file} for GEO insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt from file header
    original_prompt = "Unknown Prompt"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "Bing Copilot / SERP",
        "search_queries": [],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Extract search query keywords as simulated search queries
    query = original_prompt.replace("My 55-year-old mother is diabetic and experiencing mild chest pain after walking.", "").strip()
    query = query.replace("Who are the most reliable ", "").replace("Who is the most reliable ", "")
    query = query.replace("with good reviews, and what should I ask them?", "").replace("with top ratings?", "").strip()
    if query:
        extracted_data["search_queries"].append(query)
    else:
        extracted_data["search_queries"].append(original_prompt[:80] + "...")

    # Look for [BING DOM EXTRACTION RESULTS] in raw stream log
    dom_data = {}
    dom_marker = "[BING DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON braces in Bing DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON DOM extraction portion: {e}")


    copilot_text = dom_data.get("copilot_generative", "")
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

    # Extract general URLs mentioned in Copilot text or general logs
    url_pattern = re.compile(r'https?://[^\s"\'\}]+')
    if copilot_text:
        overview_urls = url_pattern.findall(copilot_text)
        for url in overview_urls:
            cleaned = clean_url(url)
            if cleaned:
                all_urls.add(cleaned)

    general_urls = url_pattern.findall(content)
    for url in general_urls:
        cleaned = clean_url(url)
        if cleaned:
            all_urls.add(cleaned)

    # Sort and classify outbound URLs
    for url in sorted(all_urls):
        if "bing.com" in url or "microsoft.com" in url or "msn.com" in url:
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

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report [Bing Search]
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Routed Model (AI Brain)**: `{extracted_data["routed_model"]}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: Bing Search maps human intent to structured queries to load Bing Maps / Local Business data, and invokes Microsoft Copilot to provide AI summaries of organic search index pages.

---

## 2. Structured Entity Extraction (The Local Listings)

Bing Search fetched and highlighted key local providers. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location | Rating | Reviews | Phone | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **Bing Maps & Citations**: Optimizing Bing Places for Business is crucial to win high rankings in Bing Local listings, alongside building trusted directory backlinks.

---

## 3. Web Citations & Outbound Sources (The GA4 Goldmine)

Bing Search features links in Copilot answers and organic search listings to support statements.

### Outbound Citations & Resources:
{citations_list}

### Safe Outbound URLs with Hardcoded UTMs:
{utm_list}

> [!WARNING]
> **Microsoft Referrals**: Outbound clicks from Bing organic/Copilot will show as coming from `bing.com` or `copilot.microsoft.com` inside GA4. Optimize authoritative aggregator pages (Practo, Justdial, LinkedIn) to dominate these SERP citations!

---

## 4. Algorithmic Recommendation Prediction Model

Based on this extraction trace, Bing Search's recommendation model acts as follows:

```mermaid
graph TD
    A[Human Prompt] --> B(Bing Search Intent Processing)
    B --> C{{Bing Maps vs Copilot Answer?}}
    C -->|Bing Places| D[Bing Local Listings Pack]
    C -->|Organic/Copilot| E[High-Authority Microsoft Web Fetch]
    D --> F[Structured Local Ranking]
    E --> G[Copilot Generative Synthesis]
    F & G --> H[Unified Bing Search UI Output]
    H --> I[Final Answer Presentation]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted GEO Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bing Search DOM log parser")
    parser.add_argument("dir", nargs="?", help="Path to the run directory containing raw_stream.txt")
    parser.add_argument("--input", help="Path to input raw stream text file")
    parser.add_argument("--json", help="Path to output structured json file")
    parser.add_argument("--md", help="Path to output markdown report")
    args = parser.parse_args()
    
    if args.dir:
        input_file = os.path.join(args.dir, "raw_stream.txt")
        output_json = os.path.join(args.dir, "geo_data.json")
        output_md = os.path.join(args.dir, "geo_analysis_report.md")
    else:
        if not args.input or not args.json or not args.md:
            parser.error("Must specify either the run directory as a positional argument, or all three of --input, --json, and --md")
        input_file = args.input
        output_json = args.json
        output_md = args.md
        
    parse_bing_logs(input_file, output_json, output_md)

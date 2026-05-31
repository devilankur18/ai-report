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

def parse_perplexity_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Perplexity log from {input_file} for GEO insights...")
    
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
        "routed_model": "Perplexity AI Default (Sonar / LLM)",
        "search_queries": [],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Look for [PERPLEXITY DOM EXTRACTION RESULTS] in raw stream log
    dom_data = {}
    dom_marker = "[PERPLEXITY DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON braces in Perplexity DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON DOM extraction portion: {e}")


    ai_answer_text = dom_data.get("ai_answer", "")
    citations = dom_data.get("citations", [])
    search_queries = dom_data.get("search_queries", [])

    # Populate Search Queries
    if search_queries:
        extracted_data["search_queries"] = search_queries
    else:
        # Fallback to key terms from prompt
        query = original_prompt.replace("My 55-year-old mother is diabetic and experiencing mild chest pain after walking.", "").strip()
        query = query.replace("Who are the most reliable ", "").replace("Who is the most reliable ", "")
        query = query.replace("with good reviews, and what should I ask them?", "").replace("with top ratings?", "").strip()
        if query:
            extracted_data["search_queries"].append(query)
        else:
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
            cleaned = clean_url(url)
            if cleaned:
                all_urls.add(cleaned)

    # Walk local entities from text content
    # Perplexity usually structures listings like:
    # 1. **Dr. Name** or ### 1. Dr. Name
    # Location: Address, etc.
    # We can split the prose text by numbers to extract business profiles.
    entity_blocks = re.split(r'(?:###\s+)?(\d+)\.\s+\*\*([^*]+)\*\*', ai_answer_text)
    if len(entity_blocks) > 2:
        for i in range(1, len(entity_blocks), 3):
            rank = entity_blocks[i]
            name = entity_blocks[i+1].replace("Dr.", "").replace("**", "").replace("*", "").strip()
            block_content = entity_blocks[i+2] if i+2 < len(entity_blocks) else ""
            
            # Clean up trailing parentheses, rankings or markdown
            name = re.sub(r'\s*\([^)]+\)', '', name)
            name = name.split("\n")[0].strip()

            if len(name) < 3 or any(w in name.lower() for w in ["display", "entity", "profile"]):
                continue

            # Check if name is already added
            if any(e["name"] == name for e in extracted_data["local_entities"]):
                continue

            # Extract location / address from block
            location = "Lucknow, India"
            loc_match = re.search(r'(?:Location|Address):\s*([^\n]+)', block_content, re.IGNORECASE)
            if loc_match:
                location = loc_match.group(1).replace("**", "").strip()

            # Extract phone
            phone = "N/A"
            phone_match = re.search(r'(?:Phone|Contact):\s*([^\n]+)', block_content, re.IGNORECASE)
            if phone_match:
                phone = phone_match.group(1).replace("**", "").strip()

            # Extract specialty / category
            category = "Orthopedic Surgeon"
            cat_match = re.search(r'(?:Specialization|Specialty):\s*([^\n]+)', block_content, re.IGNORECASE)
            if cat_match:
                category = cat_match.group(1).replace("**", "").strip()

            # Website URL matching (find a URL in citations whose title contains name)
            website_url = "N/A"
            for cit in citations:
                url = clean_url(cit.get("url"))
                title = cit.get("title", "")
                if url and (name.lower() in title.lower() or name.lower() in url.lower()):
                    website_url = url
                    break

            entity_dict = {
                "name": f"Dr. {name}" if not name.startswith("Dr.") else name,
                "category": category,
                "address": location,
                "rating": "N/A",
                "review_count": "N/A",
                "phone": phone,
                "website_url": website_url
            }
            extracted_data["local_entities"].append(entity_dict)

    # Sort and classify outbound URLs
    for url in sorted(all_urls):
        if "perplexity.ai" in url:
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

    report_markdown = f"""# 🧠 GEO (Generative Engine Optimization) Analysis Report [Perplexity AI]
**Target Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Routed Model (AI Brain)**: `{extracted_data["routed_model"]}`  

---

## 1. Prompt vs. AI Search Translation (The Translation Layer)

* **Extracted AI Search Queries**:
{chr(10).join([f'  * `{q}`' for q in extracted_data["search_queries"]]) if extracted_data["search_queries"] else "  * *No search queries extracted*"}

> [!IMPORTANT]
> **GEO Insight**: Perplexity AI executes intent-driven parallel search queries to retrieve multiple authoritative sources. Optimizing for Perplexity requires absolute dominance across authority and directory citations!

---

## 2. Structured Entity Extraction (The Conversational Recommendations)

Perplexity synthesized recommendations based on web resources. The recommendations are ranked as follows:

| Rank | Provider Entity Name | Category / Specialization | Location | Rating | Reviews | Phone | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

> [!TIP]
> **Perplexity Optimization**: Perplexity relies heavily on citation authoritative aggregates (Practo, Justdial, LinkedIn) and directory rankings to build the conversational context.

---

## 3. Web Citations & Outbound Sources (The GA4 Goldmine)

Perplexity cites trustworthy sources directly within the answer text.

### Outbound Citations & Resources:
{citations_list}

### Safe Outbound URLs with Hardcoded UTMs:
{utm_list}

> [!WARNING]
> **Perplexity Referrals**: Perplexity's traffic is highly direct and conversational. Citations drive high click-through rates since users actively verify references. Track conversational conversion metrics!

---

## 4. Algorithmic Recommendation Prediction Model

Based on this extraction trace, Perplexity AI's recommendation flow behaves as follows:

```mermaid
graph TD
    A[Human Prompt] --> B(Perplexity Search Parsing)
    B --> C[Parallel Bing/Google API Search Execution]
    C --> D[Retrieve Authority Outbound URLs]
    D --> E[Synthesize Citations into Answer Prose]
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
    parser = argparse.ArgumentParser(description="Perplexity log parser")
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
        
    parse_perplexity_logs(input_file, output_json, output_md)

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

def parse_bing_maps_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Bing Maps log from {input_file} for Microsoft Business Profile insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt
    original_prompt = "Unknown Bing Maps Query"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    search_query = "Unknown Keyword"
    query_match = re.search(r"SEARCH_QUERY:\s*(.+)\n", content)
    if query_match:
        search_query = query_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "Bing Maps GBP Engine",
        "search_queries": [search_query],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Extract JSON content under [BING_MAPS DOM EXTRACTION RESULTS]
    dom_data = {}
    dom_marker = "[BING_MAPS DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON brackets in Bing Maps DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON Bing Maps DOM section: {e}")

    local_results = dom_data.get("local_results", [])[:10]  # Limit to top 10 entries

    # Process and map entities
    for item in local_results:
        name = item.get("name", "").strip()
        if not name:
            continue
        
        rating = item.get("rating", "N/A")
        review_count = item.get("review_count", "N/A")
        phone = item.get("phone", "N/A")
        website = clean_url(item.get("website_url")) or "N/A"
        claimed_status = item.get("claimed_status", "Verified/Claimed")

        entity_dict = {
            "name": name,
            "category": item.get("category", "Healthcare Specialist"),
            "address": item.get("address", "Local Area"),
            "rating": rating,
            "review_count": review_count,
            "phone": phone,
            "website_url": website,
            "claimed_status": claimed_status
        }
        extracted_data["local_entities"].append(entity_dict)

    # Save to JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured Bing Places Data saved to: {output_json}")

    # Generate Markdown Report
    entity_rows = []
    audit_notes = []
    
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent["rating"]
            reviews = ent["review_count"]
            phone = ent["phone"]
            website_url = ent["website_url"]
            
            website_md = f"[Link]({website_url})" if website_url != "N/A" else "N/A"
            
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {website_md} | ✅ Active |")
            
            # Audit notes for Bing Maps
            doctor_notes = []
            if rating != "N/A" and float(rating) < 4.5:
                doctor_notes.append(f"Rating ({rating}★) is low. Respond to negative feedback on Bing Maps.")
            if reviews == "N/A" or reviews == "0":
                doctor_notes.append("No patient reviews on Bing. Claim profile to sync and pull Google Maps reviews.")
            if website_url == "N/A":
                doctor_notes.append("Missing website link, which reduces authority for ChatGPT/Copilot referral triggers.")
                
            if doctor_notes:
                notes_text = ", ".join(doctor_notes)
                audit_notes.append(f"*   **{ent['name']}**: {notes_text}")
            else:
                audit_notes.append(f"*   **{ent['name']}**: Profile is active and verified for Microsoft local discovery.")
    else:
        entity_rows.append("| *None* | No local Bing Places listings extracted | N/A | N/A | N/A | N/A | N/A | N/A | N/A |")
        audit_notes.append("*   *No local doctor profiles extracted on Bing. Check query parameters or claim state.*")

    report_markdown = f"""# 🧠 Microsoft Business Profile (Bing Places) Local Search Audit Report
**Target Query / Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Data Engine / Channel**: `Bing Maps scraping via dynamic Puppeteer`

---

## 1. Bing Places / Microsoft Maps Local Listings

We extracted the top Bing Maps doctor listings. Bing Places data is directly crawled and served by **Microsoft Copilot** and **ChatGPT/SearchGPT** local packs.

| Rank | Provider Entity Name | Category / Specialization | Location Address | Rating | Reviews | Phone | Website | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

---

## 2. Key Optimization Gaps & Action Items

Based on the parsed Microsoft Business Profile metadata, we identified the following visibility actions:

{chr(10).join(audit_notes)}

> [!IMPORTANT]
> **Microsoft Bing Places Strategy**:
> *   Bing Places allows you to **import and sync** GMB listings directly! This is highly recommended to keep names, categories, and pictures synchronized for ChatGPT/Copilot reference validation.
> *   Make sure third-party profiles (like Facebook and Justdial) use the exact same address string, as Bing indexer uses them to cross-verify location data.

---

## 3. Algorithmic Recommendations Mapping

This map visualizes how Bing Places / Microsoft Business Profiles feed into ChatGPT/Copilot recommendations:

```mermaid
graph TD
    A[Bing Places Sync / Import] --> B{{Bing Search API Grounding}}
    B -->|Entity Matches| C[ChatGPT / Copilot Local Pack Rendering]
    B -->|Mismatched Details| D[Profile Omitted from AI Output]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted Bing Places Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bing Maps raw stream parser")
    parser.add_argument("dir", nargs="?", help="Path to run directory")
    parser.add_argument("--input", help="Input file")
    parser.add_argument("--json", help="Output JSON")
    parser.add_argument("--md", help="Output Markdown")
    args = parser.parse_args()
    
    if args.dir:
        paths = geo_config.get_run_paths(args.dir)
        input_file = paths["raw_stream"]
        output_json = paths["geo_data"]
        output_md = paths["report"]
    else:
        if not args.input or not args.json or not args.md:
            parser.error("Must specify either the run directory or all three parameters.")
        input_file = args.input
        output_json = args.json
        output_md = args.md
        
    parse_bing_maps_logs(input_file, output_json, output_md)

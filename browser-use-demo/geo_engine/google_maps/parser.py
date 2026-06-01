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

def parse_google_maps_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Google Maps log from {input_file} for GBP/SEO insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt
    original_prompt = "Unknown Google Maps Query"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "Google Maps GBP Engine",
        "search_queries": [original_prompt],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Extract JSON content under [GOOGLE_MAPS DOM EXTRACTION RESULTS]
    dom_data = {}
    dom_marker = "[GOOGLE_MAPS DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON brackets in Google Maps DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON Google Maps DOM section: {e}")

    local_results = dom_data.get("local_results", [])

    # Process and map entities
    for item in local_results:
        name = item.get("name", "").strip()
        if not name:
            continue
        
        rating = item.get("rating", "N/A")
        review_count = item.get("review_count", "N/A")
        phone = item.get("phone", "N/A")
        website = clean_url(item.get("website_url")) or "N/A"
        claimed_status = item.get("claimed_status", "Unknown")
        recent_reviews = item.get("recent_reviews", [])

        entity_dict = {
            "name": name,
            "category": item.get("category", "Medical Specialist"),
            "address": item.get("address", "Local Area"),
            "rating": rating,
            "review_count": review_count,
            "phone": phone,
            "website_url": website,
            "claimed_status": claimed_status,
            "recent_reviews": recent_reviews
        }
        extracted_data["local_entities"].append(entity_dict)

    # Save to JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured GBP Data saved to: {output_json}")

    # Generate Markdown Report
    entity_rows = []
    audit_notes = []
    
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent["rating"]
            reviews = ent["review_count"]
            phone = ent["phone"]
            website_url = ent["website_url"]
            claimed = ent["claimed_status"]
            
            website_md = f"[Link]({website_url})" if website_url != "N/A" else "N/A"
            
            # Badge styles for Claimed Status
            claimed_badge = "✅ Claimed" if claimed == "Claimed/Verified" else "⚠️ Unclaimed"
            
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {website_md} | {claimed_badge} |")
            
            # Audit recommendation notes
            doctor_notes = []
            if claimed == "Unclaimed":
                doctor_notes.append("Profile is UNCLAIMED! Immediate GMB verification is needed to protect the entity from hijacking.")
            if rating != "N/A" and float(rating) < 4.5:
                doctor_notes.append(f"Review score ({rating}) is below standard (4.5★). Optimize review response templates to increase ratings.")
            if reviews != "N/A" and int(reviews.replace(",", "")) < 50:
                doctor_notes.append(f"Low review volume ({reviews}). Launch active post-consultation WhatsApp review campaign.")
            if phone == "N/A" or website_url == "N/A":
                doctor_notes.append("Missing primary contact details (Phone/Website). Profile lacks high-conversion call-to-actions.")
                
            if doctor_notes:
                notes_text = ", ".join(doctor_notes)
                audit_notes.append(f"*   **{ent['name']}**: {notes_text}")
            else:
                audit_notes.append(f"*   **{ent['name']}**: Profile is healthy and highly optimized for maps indexing!")
    else:
        entity_rows.append("| *None* | No local GBP listings extracted | N/A | N/A | N/A | N/A | N/A | N/A | N/A |")
        audit_notes.append("*   *No local doctor profiles extracted. Try checking spelling or widening the search area.*")

    report_markdown = f"""# 🧠 Google Business Profile (GBP) Local Search Audit Report
**Target Query / Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Data Engine / Channel**: `Google Maps scraping via dynamic Puppeteer`

---

## 1. Google Business Profile Listings (Map Pack Audit)

We extracted the top Google Maps recommendations. Optimizing these fields is directly responsible for appearing in **Gemini** and general Google search packs.

| Rank | Provider Entity Name | Category / Specialization | Location Address | Rating | Reviews | Phone | Website | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

---

## 2. Key Optimization Gaps & Action Items

Based on the parsed Google Business Profile metadata, we identified the following optimization tasks:

{chr(10).join(audit_notes)}

> [!TIP]
> **Actionable GEO Strategy**:
> *   Ensure the **Primary Category** is matched exactly to search query terms (e.g. using `Orthopedic surgeon` instead of just `Doctor`).
> *   Keep **Phone Number** and **Website** 100% consistent across Google Maps, Practo, and Justdial to help AI engines consolidate trust authority.

---

## 3. Algorithmic Recommendations Mapping

This map visualizes how Google Business Profiles (GBP) feed into the AI search recommendation model:

```mermaid
graph TD
    A[GMB Optimization Actions] --> B{{GBP Listing Healthy?}}
    B -->|Yes| C[High Domain Authority Citation]
    B -->|No - Unclaimed/Low Reviews| D[Filtered Out of Top Local Pack]
    C --> E[Indexed by Gemini Maps Extension]
    E --> F[AI Recommendation Answer Rendering]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted GBP Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Maps raw stream parser")
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
        
    parse_google_maps_logs(input_file, output_json, output_md)

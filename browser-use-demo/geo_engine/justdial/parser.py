import json
import re
import os
import argparse
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import geo_config

def parse_justdial_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Justdial log from {input_file} for hyper-local SEO insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt
    original_prompt = "Unknown Justdial Query"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "Justdial India Business Directory",
        "search_queries": [original_prompt],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Extract JSON content under [JUSTDIAL DOM EXTRACTION RESULTS]
    dom_data = {}
    dom_marker = "[JUSTDIAL DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON brackets in Justdial DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON Justdial DOM section: {e}")

    local_results = dom_data.get("local_results", [])

    # Process and map entities
    for item in local_results:
        name = item.get("name", "").strip()
        if not name:
            continue
        
        rating = item.get("rating", "N/A")
        review_count = item.get("review_count", "N/A")
        phone = item.get("phone", "N/A")
        address = item.get("address", "Local Area")
        verified_badge = item.get("verified_badge", "Standard Listing")

        entity_dict = {
            "name": name,
            "category": item.get("category", "Medical Clinic"),
            "address": address,
            "rating": rating,
            "review_count": review_count,
            "phone": phone,
            "website_url": "N/A",
            "verified_badge": verified_badge
        }
        extracted_data["local_entities"].append(entity_dict)

    # Save to JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured Justdial Data saved to: {output_json}")

    # Generate Markdown Report
    entity_rows = []
    audit_notes = []
    
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rating = ent["rating"]
            reviews = ent["review_count"]
            phone = ent["phone"]
            verified = ent["verified_badge"]
            
            badge_md = "✅ JD Verified" if verified == "Verified" else "⚠️ Standard"
            
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {ent['address']} | {rating} | {reviews} | {phone} | {badge_md} |")
            
            # Justdial SEO audit recommendation notes
            doctor_notes = []
            if verified == "Standard Listing":
                doctor_notes.append("Profile lacks JD Verified status. Immediate registration is advised to secure verified trust tags.")
            if rating != "N/A" and float(rating) < 4.0:
                doctor_notes.append(f"Rating ({rating}★) is below threshold (4.0). High risk of exclusion from AI recommendation synthesis.")
            if reviews == "N/A" or reviews == "0":
                doctor_notes.append("No local votes. Boost vote count to rank in top search filters.")
            elif int(reviews.replace(",", "")) < 50:
                doctor_notes.append(f"Low vote volume ({reviews}). Aim for 100+ votes to establish competitive local authority.")
            if phone == "N/A":
                doctor_notes.append("No active contact number displayed. AI search engines will not be able to offer a 'click-to-call' action.")

            if doctor_notes:
                notes_text = ", ".join(doctor_notes)
                audit_notes.append(f"*   **{ent['name']}**: {notes_text}")
            else:
                audit_notes.append(f"*   **{ent['name']}**: Profile is active, verified, and highly optimized for hyper-local crawls!")
    else:
        entity_rows.append("| *None* | No Justdial listings extracted | N/A | N/A | N/A | N/A | N/A | N/A |")
        audit_notes.append("*   *No local listings extracted on Justdial. Try checking query spelling or slug paths.*")

    report_markdown = f"""# 🧠 Justdial India - Hyper-Local AI Discovery & Citation Report
**Target Query / Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Data Engine / Channel**: `Justdial India directory parsing via dynamic Puppeteer`

---

## 1. Justdial Hyper-Local Listings Scrape

We parsed the top doctor listings currently returned by Justdial. AI Search models reference these directories to validate contact numbers, clinic names, and review volume.

| Rank | Provider Clinic Name | Category Specialty | Location / Address | Rating | Votes / Reviews | Phone Number | JD Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

---

## 2. Key Optimization Gaps & Action Items

Based on the parsed Justdial directory metadata, we identified the following visibility actions:

{chr(10).join(audit_notes)}

> [!IMPORTANT]
> **Justdial Optimization Action Plan**:
> *   **JD Verified Certification**: AI crawlers place immense weight on verification tags because they guarantee the business is active. Ensure your Justdial profile is verified with active GST/medical license numbers.
> *   **Vote Volume**: Justdial uses a linear rating-to-vote volume ranking multiplier. A 4.9★ rating with 10 votes ranks lower than a 4.6★ rating with 200 votes. Drive SMS/WhatsApp campaigns to boost your JD vote count!

---

## 3. Algorithmic Recommendations Mapping

This map visualizes how Justdial verified listings feed into AI search results:

```mermaid
graph TD
    A[Justdial Profile Setup] --> B{{JD Verified Badge Active?}}
    B -->|Yes| C[High Trust Score Indexed by AI]
    B -->|No| D[Low Trust Listing Fallback]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted Justdial Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Justdial raw stream parser")
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
        
    parse_justdial_logs(input_file, output_json, output_md)

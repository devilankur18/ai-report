import json
import re
import os
import argparse
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import geo_config

def parse_practo_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw Practo log from {input_file} for medical SEO insights...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt
    original_prompt = "Unknown Practo Query"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "Practo India Medical Directory",
        "search_queries": [original_prompt],
        "local_entities": [],
        "web_citations": [],
        "utm_sources": []
    }

    # Extract JSON content under [PRACTO DOM EXTRACTION RESULTS]
    dom_data = {}
    dom_marker = "[PRACTO DOM EXTRACTION RESULTS]"
    if dom_marker in content:
        try:
            parts = content.split(dom_marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                dom_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON brackets in Practo DOM section.")
        except Exception as e:
            print(f"[!] Error parsing JSON Practo DOM section: {e}")

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
        experience = item.get("experience", "N/A")
        fee = item.get("consultation_fee", "N/A")
        rec_rate = item.get("recommendation_rate", "N/A")

        entity_dict = {
            "name": name,
            "category": item.get("specialty", "Medical Specialist"),
            "address": address,
            "rating": rating,
            "review_count": review_count,
            "phone": phone,
            "website_url": "N/A",
            "experience": experience,
            "consultation_fee": fee,
            "recommendation_rate": rec_rate
        }
        extracted_data["local_entities"].append(entity_dict)

    # Save to JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured Practo Data saved to: {output_json}")

    # Generate Markdown Report
    entity_rows = []
    audit_notes = []
    
    if extracted_data["local_entities"]:
        for i, ent in enumerate(extracted_data["local_entities"], 1):
            rec = ent["recommendation_rate"]
            reviews = ent["review_count"]
            exp = ent["experience"]
            fee = ent["consultation_fee"]
            
            entity_rows.append(f"| **{i}** | {ent['name']} | {ent['category']} | {exp} | {rec} | {reviews} | {fee} | {ent['address']} |")
            
            # Healthcare SEO specific notes
            doctor_notes = []
            
            # Parse experience years
            exp_match = re.search(r'(\d+)', exp)
            if exp_match:
                years = int(exp_match.group(1))
                if years < 10:
                    doctor_notes.append(f"Relatively junior status ({years} yrs experience). Needs stronger patient stories volume to compete in AI trust filters.")
            
            # Recommendation percentage
            rec_match = re.search(r'(\d+)%', rec)
            if rec_match:
                pct = int(rec_match.group(1))
                if pct < 90:
                    doctor_notes.append(f"Patient recommendation rate ({pct}%) is below 90% threshold. Focus on resolving patient complaints.")
                    
            # Reviews stories
            if reviews == "N/A" or reviews == "0":
                doctor_notes.append("No patient stories/feedback. Ask satisfied patients to leave detailed stories on Practo (AI engines value long-form reviews!).")
            elif int(reviews.replace(",", "")) < 10:
                doctor_notes.append(f"Low patient stories volume ({reviews}). Aim for 30+ detailed review stories to trigger AI indexing.")

            if doctor_notes:
                notes_text = ", ".join(doctor_notes)
                audit_notes.append(f"*   **{ent['name']}**: {notes_text}")
            else:
                audit_notes.append(f"*   **{ent['name']}**: Profile is extremely strong, with high experience, good recommendation rate, and great citation health!")
    else:
        entity_rows.append("| *None* | No Practo doctor profiles extracted | N/A | N/A | N/A | N/A | N/A | N/A |")
        audit_notes.append("*   *No local doctor profiles extracted. Try checking spelling or mapping terms (e.g. dentist instead of teeth doctor).*")

    report_markdown = f"""# 🧠 Practo India - Healthcare SEO & AI Directory Visibility Report
**Target Query / Prompt**: `{extracted_data["original_prompt"]}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Data Engine / Channel**: `Practo India directory parsing via dynamic Puppeteer`

---

## 1. Practo Doctor Profiles (Directory Grid Scrape)

We parsed the top verified practitioners currently ranked on Practo in the target city. LLMs scrape these parameters to select which doctors to recommend in their natural conversation streams.

| Rank | Practitioner Name | Degree & Specialization | Experience | Patient Rating | Patient Stories | Fee | Clinic & Locality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
{"\n".join(entity_rows)}

---

## 2. Key Optimization Gaps & Action Items

Based on the parsed Practo directory metadata, we identified the following visibility actions:

{chr(10).join(audit_notes)}

> [!TIP]
> **Actionable Medical SEO Insights**:
> *   **Patient Stories Count**: ChatGPT and Gemini do not just read rating scores. They perform semantic analysis on **patient stories** to see *why* patients recommend a doctor. Encourage patients to write detailed descriptions of their recovery, specifying the treatment!
> *   **Experience & Pricing**: Keep consultation fees aligned with your local region's average. Mismatched pricing or lack of online booking capabilities often filters profiles out of "cost-effective" or "easy to book" conversational recommendations.

---

## 3. Algorithmic Recommendations Mapping

This map visualizes how Practo listings power AI trust recommendations for Indian patients:

```mermaid
graph TD
    A[Practo Patient Stories Volume] --> B{{AI Crawler Sentiment Scrape}}
    B -->|High Trust + Positive Sentiment| C[AI Recommendation Engine Target]
    B -->|Low Patient Stories/No feedback| D[Profile Ignored due to low validation]
```
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Formatted Practo Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Practo raw stream parser")
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
        
    parse_practo_logs(input_file, output_json, output_md)

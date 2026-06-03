import json
import re
import os
import argparse
import sys

# Setup paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import geo_config

def parse_seranking_logs(input_file, output_json, output_md):
    if not os.path.exists(input_file):
        print(f"Error: Log file not found at {input_file}")
        return False

    print(f"Parsing raw SE Ranking log from {input_file}...")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract original prompt & query
    original_prompt = "Unknown SE Ranking Query"
    prompt_match = re.search(r"PROMPT:\s*(.+)\n", content)
    if prompt_match:
        original_prompt = prompt_match.group(1).strip()

    search_query = "Unknown Keyword"
    query_match = re.search(r"SEARCH_QUERY:\s*(.+)\n", content)
    if query_match:
        search_query = query_match.group(1).strip()

    # Extract JSON content under [SERANKING API RESULTS]
    api_data = {}
    marker = "[SERANKING API RESULTS]"
    if marker in content:
        try:
            parts = content.split(marker)[1].strip()
            start_idx = parts.find('{')
            end_idx = parts.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_part = parts[start_idx:end_idx+1]
                api_data = json.loads(json_part)
            else:
                print("[!] Could not find JSON brackets in SE Ranking API results.")
        except Exception as e:
            print(f"[!] Error parsing SE Ranking API JSON: {e}")

    # Extract target metrics
    overview = api_data.get("overview", {}).get("data", {})
    history = api_data.get("history", {}).get("data", {}).get("history", {})
    
    similar_raw = api_data.get("similar", {}).get("data", {}).get("items", [])
    related_raw = api_data.get("related", {}).get("data", {}).get("items", [])
    questions_raw = api_data.get("questions", {}).get("data", {}).get("items", [])

    # Standardize suggestions structures
    def map_suggestion(item):
        return {
            "keyword": item.get("keyword", ""),
            "volume": item.get("volume", 0),
            "difficulty": item.get("difficulty", 0),
            "cpc": item.get("cpc", 0.0),
            "competition": item.get("competition", 0.0),
            "intents": item.get("intents", []),
            "volume_history_svg": item.get("volume_history", ""),
            "history_data": item.get("history_data", None)
        }

    similar_mapped = [map_suggestion(i) for i in similar_raw]
    related_mapped = [map_suggestion(i) for i in related_raw]
    questions_mapped = [map_suggestion(i) for i in questions_raw]

    # Construct unified JSON structure
    extracted_data = {
        "original_prompt": original_prompt,
        "search_invoked": True,
        "routed_model": "SE Ranking Keyword Research Engine",
        "search_queries": [search_query],
        "local_entities": [],  # Empty as it's an SEO research engine
        "web_citations": [],
        "utm_sources": [],
        "seo_data": {
            "target_keyword": search_query,
            "search_volume": overview.get("volume", 0),
            "difficulty": overview.get("keyword_difficulty", 0),
            "cpc": overview.get("cpc", 0.0),
            "competition": overview.get("competition", 0.0),
            "intents": overview.get("intents", []),
            "serp_features": overview.get("serp_features", []),
            "volume_history": history,
            "suggestions": {
                "similar": similar_mapped,
                "related": related_mapped,
                "questions": questions_mapped
            }
        }
    }

    # Save structured JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)
    print(f"[✓] Structured SEO Data saved to: {output_json}")

    # Generate Markdown Report
    seo = extracted_data["seo_data"]
    
    # 12 Month history list
    history_md = []
    if seo["volume_history"]:
        for date, val in sorted(seo["volume_history"].items()):
            history_md.append(f"- **{date}**: {val} searches")
    else:
        history_md.append("- *No volume history data available*")

    # Suggestions tables
    def build_sugg_rows(suggestions):
        rows = []
        if suggestions:
            for idx, sugg in enumerate(suggestions, 1):
                intents_str = ", ".join(sugg["intents"]) if sugg["intents"] else "N/A"
                rows.append(f"| {idx} | **{sugg['keyword']}** | {sugg['volume']} | {sugg['difficulty']} | ${sugg['cpc']:.2f} | {intents_str} |")
        else:
            rows.append("| *None* | No suggestions found | N/A | N/A | N/A | N/A |")
        return "\n".join(rows)

    report_markdown = f"""# 📈 SEO & Search Market Demand Analysis Report
**Target Search Query**: `{search_query}`  
**Analyzed Stream File**: `{os.path.basename(input_file)}`  
**Data Engine**: `SE Ranking Keyword Research API`

---

## 1. Primary Keyword Market Profile

| Metric | Value | Interpretation |
| :--- | :--- | :--- |
| **Search Volume** | {seo['search_volume']} | Monthly searches in target country |
| **Keyword Difficulty** | {seo['difficulty']}/100 | Organic ranking barrier |
| **Intents** | {", ".join(seo['intents']) if seo['intents'] else "N/A"} | User search objectives |
| **CPC (Average)** | ${seo['cpc']:.2f} | Google Ads advertiser bid pricing |

---

## 2. 12-Month Historical Search Volume Trend

The volume history shows search density fluctuation over the past year:

{"\n".join(history_md)}

---

## 3. Related Search Intent Ideas

### Similar Keywords
| Rank | Keyword Idea | Avg Volume | Difficulty (KD) | CPC (USD) | Intents |
| :--- | :--- | :--- | :--- | :--- | :--- |
{build_sugg_rows(similar_mapped[:10])}

### Related Keywords
| Rank | Keyword Idea | Avg Volume | Difficulty (KD) | CPC (USD) | Intents |
| :--- | :--- | :--- | :--- | :--- | :--- |
{build_sugg_rows(related_mapped[:10])}

---

> [!TIP]
> **Market Insights**:
> * A Keyword Difficulty above 50 requires high-authority link-building campaigns and robust page-level SEO.
> * Local ('L') and Commercial ('C') search intent tags signal strong intent from patients looking for doctors or specialists. Target these keywords in landing page copy.
"""

    with open(output_md, "w", encoding="utf-8") as f:
        f.write(report_markdown)
    print(f"[✓] Standalone SEO Analysis Report saved to: {output_md}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SE Ranking raw stream parser")
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
        
    parse_seranking_logs(input_file, output_json, output_md)

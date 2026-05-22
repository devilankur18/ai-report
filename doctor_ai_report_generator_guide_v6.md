# DigiClinic AI Rank & SEO Report Generator Guide (Version 6)

This document is the master operational specification (Version 6) for the DigiClinic Digital Presence & AI Rank Analyzer. It establishes a **100% deterministic per-channel scoring engine**, transitions the output to a **highly structured JSON format** to power our interactive Report Viewer React application, implements **Client-Growth progressive scoring interpolation**, and maintains the **Browser MCP** workflows for high-integrity, completely fresh digital presence audits.

---

## 🗂️ SECTION 1: SCHEMATIC SPECIFICATION FOR JSON REPORT

Every generated report must strictly conform to the following JSON schema. The output file must be named `[doctor_slug]_report.json` or `[doctor_slug]_report_[YYYY-MM].json` for monthly tracking, and placed in the `reports/v6/` directory.

### JSON Schema Specification

```json
{
  "report_metadata": {
    "report_name": "AI Health Check Report",
    "version": "6.0",
    "prepared_for": "Dr. [Full Name]",
    "practice_specialty": "[Specialty]",
    "location": {
      "area": "[Area]",
      "city": "[City]"
    },
    "clinic_name": "[Clinic Name]",
    "discovered_clinic_address": "[Full Discovered Street Address]",
    "primary_discovered_phone": "[Contact number formatted as +91 XXXXX XXXXX]",
    "state_council_registration": {
      "council_name": "[State Council Name]",
      "registration_number": "[Reg No]",
      "registration_date": "[YYYY]"
    },
    "audit_date": "[YYYY-MM-DD]",
    "last_verified_activity_date": "[DD MMM YYYY (Audit and live search validation description)]"
  },
  "overall_score": 15, // 0-100 weighted index score calculated from channels
  "discoverability_tier": "WEAK", // EXCELLENT (>=80) / GOOD (60-79) / MODERATE (40-59) / WEAK (<40)
  "diagnostic_summary": "A highly focused, 2-3 sentence paragraph summarizing strengths, core technical gaps, and local competitive standing.",
  "historical_runs": [
    // Historical scores to show monthly progress tracking
    { "date": "2026-03-22", "overall_score": 13 },
    { "date": "2026-04-22", "overall_score": 21 },
    { "date": "[Current Date YYYY-MM-DD]", "overall_score": 15 }
  ],
  "channels": [
    {
      "id": "google_seo",
      "name": "Google Search & Maps",
      "weight": 25,
      "channel_percentage_score": 0.0, // 0-100 calculated score
      "evidence_screenshot": "assets/[doctor_slug]_maps_proof.png",
      "queries": [
        {
          "query": "top [specialty] in [city]",
          "rank": "Unranked", // "1", "3", "25", "Unranked"
          "points": 0, // Points based on rank (see Section 3)
          "top_competitors": [
            { "name": "[Competitor 1]", "rank": 1, "link": "[Maps/Search URL]" },
            { "name": "[Competitor 2]", "rank": 2, "link": "[Maps/Search URL]" },
            { "name": "[Competitor 3]", "rank": 3, "link": "[Maps/Search URL]" }
          ]
        }
        // ... Repeated for all 7 standard queries (see below)
      ]
    },
    {
      "id": "bing_seo",
      "name": "Bing Search & Maps",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_bing_proof.png",
      "queries": [
        // ... Same 7 standard queries with Bing ranks & competitors
      ]
    },
    {
      "id": "aggregators",
      "name": "Medical Aggregators",
      "weight": 15,
      "channel_percentage_score": 50.0,
      "evidence_screenshot": "assets/[doctor_slug]_aggregators_proof.png",
      "metrics": [
        { "label": "Justdial Listing Status", "value": "🟢 claimed / 🔴 unclaimed", "points": 100 },
        { "label": "Practo Profile Status", "value": "🟢 active / 🔴 missing", "points": 0 },
        { "label": "Aggregate reviews volume", "value": "🟢 67 reviews (4.8★)", "points": 100 },
        { "label": "Slot Booking Availability", "value": "🔴 Not integrated", "points": 0 }
      ]
    },
    {
      "id": "conversational_ai",
      "name": "Conversational AI Standing",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_ai_standing_proof.png",
      "platforms": [
        { "name": "ChatGPT", "standing": "Not Recommended", "points": 0, "citation": "..." },
        { "name": "Gemini", "standing": "Not Recommended", "points": 0, "citation": "..." },
        { "name": "Meta AI", "standing": "Not Recommended", "points": 0, "citation": "..." },
        { "name": "Grok AI", "standing": "Not Recommended", "points": 0, "citation": "..." }
      ]
    },
    {
      "id": "eeat_credentials",
      "name": "EEAT & Credentials Audit",
      "weight": 15,
      "channel_percentage_score": 25.0,
      "evidence_screenshot": "assets/[doctor_slug]_eeat_proof.png",
      "checks": [
        { "label": "Verified Years of Experience", "status": "VERIFIED / MISSING", "value": "19 Years", "points": 100 },
        { "label": "CMO/Ayushman Bharat HFR Registration", "status": "MISSING", "value": "...", "points": 0 },
        { "label": "State Council Registry Verification", "status": "VERIFIED", "value": "...", "points": 0 },
        { "label": "Clinical Publications Indexing", "status": "MISSING", "value": "...", "points": 0 }
      ]
    },
    {
      "id": "website_schema",
      "name": "Website & Schema Compliance",
      "weight": 15,
      "channel_percentage_score": 25.0,
      "evidence_screenshot": "assets/[doctor_slug]_bing_proof.png", // Web audit proof image
      "checks": [
        { "label": "Clinic Landing Page URL", "status": "MISSING", "value": "...", "points": 0 },
        { "label": "MedicalBusiness JSON-LD Schema", "status": "MISSING", "value": "...", "points": 0 },
        { "label": "Address Consistency across Maps", "status": "CONFLICTING", "value": "...", "points": 50 },
        { "label": "Phone Consistency across Directories", "status": "CONFLICTING", "value": "...", "points": 50 }
      ]
    }
  ],
  "treatment_plan": [
    { "pillar": "Name/NAP Unification", "description": "..." },
    { "pillar": "Registry Integration", "description": "..." },
    { "pillar": "Dentist JSON-LD Schema", "description": "..." }
    // ... all 6 pillars
  ]
}
```

---

## 🧭 SECTION 2: DETERMINISTIC SCORING ENGINE (V6 GRADING RUBRIC)

To guarantee that generating a report is 100% deterministic and reflects actual progress as doctors climb search ranks, the V6 engine employs a **progressive Client-Growth Scoring Formula** with linear interpolation between designated milestones.

### Redefined Search Query Ranks (0 - 100 Scale)

For any search query in **Google SEO** or **Bing SEO**, points are calculated precisely using the doctor's ranking position according to the progressive milestones:

| Rank Placement (`r`) | Score (`Points`) | Client Narrative / Reporting Angle |
| :--- | :--- | :--- |
| **Rank 1** | **100** | Market Leader: Maximum traffic and dominance. |
| **Rank 3** | **88** | High Traffic: Driving active leads and business. |
| **Rank 10** | **53** | Page 1 Milestone: You are visible, now optimizing CTR. |
| **Rank 15** | **33** | Striking Distance: Major progress, close to Page 1. |
| **Rank 25** | **12** | Gaining Momentum: Google recognizes the channel. |
| **Rank 30** | **3** | Foot in the Door: The absolute baseline of relevance. |
| **Rank 31 to 100** | **1** | Indexed: The site exists in Google's database. |
| **No Rank / > 100** | **0** | Invisible: Brand new baseline. |

#### Linear Interpolation Logic
For any rank position falling strictly between two milestones, perform standard linear interpolation:
$$\text{Points} = S_1 + \frac{(S_2 - S_1)}{(R_2 - R_1)} \times (r - R_1)$$
*Example:* For Rank 5 (`r = 5`):
- It falls between Rank 3 ($R_1 = 3, S_1 = 88$) and Rank 10 ($R_2 = 10, S_2 = 53$).
- $\text{Points} = 88 + \frac{53 - 88}{10 - 3} \times (5 - 3) = 88 + \frac{-35}{7} \times 2 = 88 - 10 = 78$ points.

This allows the doctor to see progress (e.g. moving from rank 50 to rank 25) even if they are not yet in the Top 10!

---

### Channel Weighted Index Model

The overall score is computed from the **6 channel percentage scores** using strict, immutable weights:

| Channel ID | Channel Name | Weight | Scoring Mechanism |
| :--- | :--- | :--- | :--- |
| `google_seo` | Google Search & Maps | **25%** | Average of points across 7 search queries. |
| `bing_seo` | Bing Search & Maps | **15%** | Average of points across 7 search queries. |
| `aggregators` | Medical Aggregators | **15%** | Average of points across 4 aggregator metrics. |
| `conversational_ai` | Conversational AI Standing | **15%** | Average of points across 4 AI engines (Recommended in Top 3: **100 pts**; Mentioned: **50 pts**; Not Recommended: **0 pts**). |
| `eeat_credentials` | EEAT & Credentials Audit | **15%** | Average of points across 4 EEAT checks. |
| `website_schema` | Website & Schema Compliance | **15%** | Average of points across 4 Web & NAP checks. |

**Overall Score Formula:**
$$\text{Overall Score} = \text{round}\left( \sum (\text{Channel Score} \times \text{Channel Weight}) \right)$$

---

## 📋 SECTION 3: THE COMPANION STEP-VERIFICATION CHECKLIST FILE

Every run must generate a companion markdown log: `reports/v6/[doctor_slug]_run_checklist.md`.

```markdown
# DIGICLINIC AUDIT STEP VERIFICATION RUN LOG (VERSION 6)
**Audited Practitioner:** Dr. [Full Name]
**Run Timestamp:** [ISO Timestamp]

- [ ] STEP 1: Google Search & Maps Local SEO Audit -> [Status]
- [ ] STEP 2: Bing Search & Maps visibility Audit -> [Status]
- [ ] STEP 3: Medical Aggregators Visibility Audit -> [Status]
- [ ] STEP 4: State Council E-E-A-T Registration lookup -> [Status]
- [ ] STEP 5: Conversational AI App GEO Auditing -> [Status]
- [ ] STEP 6: Clinic Official Website & Structured Schema Parsing -> [Status]
```

---

## 🚫 SECTION 4: STRICT OPERATIONAL DOs & DONTs MATRIX

*   🛑 **NO INFORMATION LEAKAGE:** Do not read previous month's reports to discover details. Perform fresh live scans.
*   🛑 **Deterministic Run Tracking:** File exports should support tracking over time. File names can have dates (e.g. `dr_vishal_maurya_report_2026-05.json`) to retain records.
*   🛑 **No Relative Path Breakages:** Maintain relative paths for proof screenshots (e.g., `assets/[doctor_slug]_maps_proof.png`) so the React Report Viewer can render them smoothly.
*   ✅ **Verify Scoring Math:** All math must be computed using JS/Python scripts to avoid manual summation mistakes.

---

## 🛠️ SECTION 5: SYSTEM INTEGRATION

*   **Flat Local SEO URLs:** Generated report URLs must strictly follow `/prayagraj/dentist/dr_vishal_maurya` with no provincial slugs.
*   **Modular Web UI:** The React Report Viewer resides in the highly isolated folder `report-viewer` under the nested route `/report`. It consumes the generated V6 JSON format to present interactive circular score charts, rank tables, proof galleries, timelines, and download formats (PDF, Markdown).

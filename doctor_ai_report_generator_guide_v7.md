/goal Generate a json report for a doctor with follwoings details follwong the instructions below. dont read any exisitng files until explicity mentioned in the insturctions. FInd any gaps in pulling data for any channel. Report back it at the end. Dont make any plan or nonsense. Use only mcp tools menitoned below, dont write code. if some instruction is not clear stop there and ask right away, just stick to the workflow word by word and give me step by step update.

Dont fucking do anything on your own. No plans needed, just execute this below 

# DigiClinic AI Rank & SEO Report Generator Guide (Version 7)

This document is the master operational specification (Version 7) for the DigiClinic Digital Presence & AI Rank Analyzer. It is an **incremental upgrade of Version 6** with these key changes:

1.  **Enriched Conversational AI Sub-Category & Multi-App Verification:** Conversational AI (ChatGPT, Gemini, Meta AI, and Grok AI) is enriched to run queries in each engine via browser MCP, capture individual high-fidelity screenshots as proof, and parse structured text to identify rankings, top 3 recommended doctors, and corresponding citation reasons.
2.  **Individual Visual Proofs for AI Platforms:** Instead of a single combined AI screenshot, every AI platform has its own individual visual proof screenshot saved in `reports/v7/assets/`.
3.  **JSON Report Output Version 7:** The primary deliverable is a structured JSON file targeting `reports/v7/` to power the interactive Report Viewer application.

---

## 🗂️ SECTION 1: JSON REPORT SCHEMA SPECIFICATION

Every generated report must strictly conform to the following JSON schema. No fields may be added, rearranged, or removed unless explicitly specified in this guide.

### Output File Convention
*   **File Name:** `[doctor_slug]_report.json` or `[doctor_slug]_report_[YYYY-MM].json` for monthly tracking.
*   **Output Directory:** `reports/v7/`
*   **Screenshot Assets Directory:** `reports/v7/assets/`

### 1.1 Report Metadata

```json
{
  "report_metadata": {
    "report_name": "AI Health Check Report",
    "version": "7.0",
    "prepared_for": "Dr. [Full Name]",
    "practice_specialty": "[Specialty]",
    "location": {
      "area": "[Area]",
      "city": "[City]"
    },
    "clinic_name": "[Clinic Name]",
    "discovered_clinic_address": "[Street Address, Area, City, State, ZIP]",
    "primary_discovered_phone": "[+91 XXXXX XXXXX]",
    "state_council_registration": {
      "council_name": "[State Council Name]",
      "registration_number": "[Reg No]",
      "registration_date": "[DD/MM/YYYY]"
    },
    "audit_date": "[YYYY-MM-DD]",
    "last_verified_activity_date": "[DD MMM YYYY — Description of the last discovered online action]"
  }
}
```

**Required Input Fields (Minimal — provided by the user):**
*   `prepared_for`, `practice_specialty`, `location.area`, `location.city`
*   `clinic_name` (Optional — if missing, agent MUST search maps or directories using doctor name and location to discover it)

**Enriched Fields (Agent Auto-Discovered & Verified via live search):**
*   `discovered_clinic_address`, `primary_discovered_phone`, `state_council_registration`, `last_verified_activity_date`

### 1.2 Overall Score & Diagnostic Summary

```json
{
  "overall_score": 15,
  "discoverability_tier": "WEAK",
  "diagnostic_summary": "A highly focused, 2-3 sentence paragraph summarizing strengths, core technical gaps (e.g., missing schema, unclaimed profiles, wrong GBP primary categories), and local competitive standing.",
  "historical_runs": [
    { "date": "2026-03-22", "overall_score": 13 },
    { "date": "2026-04-22", "overall_score": 21 },
    { "date": "[Current YYYY-MM-DD]", "overall_score": 15 }
  ]
}
```

**Tier Rules (Immutable):**
*   `EXCELLENT`: overall_score >= 80
*   `GOOD`: overall_score 60–79
*   `MODERATE`: overall_score 40–59
*   `WEAK`: overall_score < 40

**Historical Runs:** If previous month reports exist in `reports/v7/` or `reports/v6/`, read their `overall_score` to populate the array. If this is the first run, include only the current entry.

### 1.3 Channels Array

The `channels` array contains **exactly 6 channel objects** in this exact order. Each channel has sub-categories for granular scoring (see Section 2 for scoring rules).

### 1.4 Cross-Channel Standard Queries

The following **7 standard queries** must be executed for Google SEO and Bing SEO channels:

1.  `top [specialty] in [city]`
2.  `top [specialty] in [area]`
3.  `best [specialty] in [city]`
4.  `best [specialty] in [area]`
5.  `best [specialty] for kids in [city]`
6.  `best [specialty] for females in [city]`
7.  `[Clinic Name] [city]` (or `[Doctor Name] [city]` if no clinic name)

### 1.5 AI Conversational Smart Comparative Prompt

The agent must issue this **exact prompt** to ChatGPT, Gemini, Meta AI, and Grok AI (simulating conversational queries):

> *"You are a local health advisor. Recommend the top [specialty] in [area], [city]. Compare their verified credentials (education, council registration, experience), review ratings, and patient sentiment. List them in a ranked table with reasons for their rank. Check if [Clinic Name] or [Doctor Name] is recommended and compare them with the top 3."*

### 1.6 Full JSON Schema (Complete Channel Definitions)

```json
{
  "report_metadata": { "..." : "See Section 1.1" },
  "overall_score": 0,
  "discoverability_tier": "WEAK",
  "diagnostic_summary": "...",
  "historical_runs": [],

  "channels": [
    {
      "id": "google_seo",
      "name": "Google Search & Maps",
      "weight": 25,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_maps_proof.png",
      "sub_categories": {
        "visibility": {
          "label": "Search & Maps Rank Visibility",
          "score": 0.0,
          "max_points": 100,
          "details": "Average of points across 7 standard queries using progressive interpolation."
        },
        "completeness": {
          "label": "GBP Profile Completeness",
          "score": 0.0,
          "max_points": 100,
          "details": "GBP claimed status, photos count, category accuracy, NAP consistency."
        },
        "sentiment": {
          "label": "Google Reviews Sentiment",
          "score": 0.0,
          "max_points": 100,
          "details": "Google review count, avg rating, review velocity, narrative success stories."
        }
      },
      "queries": [
        {
          "query": "top [specialty] in [city]",
          "rank": "Unranked",
          "points": 0,
          "top_competitors": [
            { "name": "[Competitor 1]", "rank": 1, "link": "[Maps/Search URL]" },
            { "name": "[Competitor 2]", "rank": 2, "link": "[Maps/Search URL]" },
            { "name": "[Competitor 3]", "rank": 3, "link": "[Maps/Search URL]" }
          ]
        }
      ],
      "completeness_checks": [
        { "label": "GBP Listing Claimed", "status": "VERIFIED", "value": "Yes", "points": 100 },
        { "label": "GBP Primary Category Correct", "status": "VERIFIED", "value": "Dentist", "points": 100 },
        { "label": "Visual Assets (Photos >= 3)", "status": "MISSING", "value": "1 photo", "points": 0 },
        { "label": "Address matches Bing/Justdial", "status": "CONFLICTING", "value": "Minor mismatch in area name", "points": 50 },
        { "label": "Phone matches Bing/Justdial", "status": "VERIFIED", "value": "+91 XXXXX XXXXX", "points": 100 }
      ],
      "sentiment_data": {
        "total_reviews": 0,
        "average_rating": 0.0,
        "review_velocity_per_month": 0.0,
        "narrative_success_stories": 0,
        "points_breakdown": {
          "review_volume_and_rating": 0,
          "review_velocity": 0,
          "success_stories": 0
        }
      }
    },
    {
      "id": "bing_seo",
      "name": "Bing Search & Maps",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_bing_proof.png",
      "sub_categories": {
        "visibility": {
          "label": "Bing Search & Maps Rank Visibility",
          "score": 0.0,
          "max_points": 100,
          "details": "Average of points across 7 standard queries using progressive interpolation."
        },
        "completeness": {
          "label": "Bing Places Profile Completeness",
          "score": 0.0,
          "max_points": 100,
          "details": "Bing Places listing status, photos, NAP consistency vs Google."
        },
        "sentiment": {
          "label": "Bing Reviews Sentiment",
          "score": 0.0,
          "max_points": 100,
          "details": "Bing review count, avg rating, review velocity."
        }
      },
      "queries": [
        {
          "query": "top [specialty] in [city]",
          "rank": "Unranked",
          "points": 0,
          "top_competitors": [
            { "name": "[Competitor 1]", "rank": 1, "link": "[Bing URL]" },
            { "name": "[Competitor 2]", "rank": 2, "link": "[Bing URL]" },
            { "name": "[Competitor 3]", "rank": 3, "link": "[Bing URL]" }
          ]
        }
      ],
      "completeness_checks": [
        { "label": "Bing Places Listing Active", "status": "VERIFIED", "value": "Yes", "points": 100 },
        { "label": "Visual Assets on Bing", "status": "MISSING", "value": "0 photos", "points": 0 },
        { "label": "Address Consistency with Google", "status": "CONFLICTING", "value": "...", "points": 50 },
        { "label": "Phone Consistency with Google", "status": "VERIFIED", "value": "...", "points": 100 }
      ],
      "sentiment_data": {
        "total_reviews": 0,
        "average_rating": 0.0,
        "review_velocity_per_month": 0.0,
        "narrative_success_stories": 0,
        "points_breakdown": {
          "review_volume_and_rating": 0,
          "review_velocity": 0,
          "success_stories": 0
        }
      }
    },
    {
      "id": "aggregators",
      "name": "Medical Aggregators (Practo & Justdial)",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_aggregators_proof.png",
      "sub_categories": {
        "visibility": {
          "label": "Aggregator Listing & Rank Visibility",
          "score": 0.0,
          "max_points": 100,
          "details": "Practo/Justdial profile existence, claimed status, category ranking."
        },
        "completeness": {
          "label": "Profile Completeness",
          "score": 0.0,
          "max_points": 100,
          "details": "Slot booking integration, profile completeness, specialization tags."
        },
        "sentiment": {
          "label": "Aggregator Reviews Sentiment",
          "score": 0.0,
          "max_points": 100,
          "details": "Practo/Justdial review count, avg rating, review velocity, patient stories."
        }
      },
      "metrics": [
        { "label": "Justdial Listing Status", "status": "VERIFIED", "value": "Claimed", "points": 100 },
        { "label": "Practo Profile Status", "status": "MISSING", "value": "Not Found", "points": 0 },
        { "label": "Justdial Category Rank", "status": "VERIFIED", "value": "#3 in Dentist, Naini", "points": 88 },
        { "label": "Practo Category Rank", "status": "MISSING", "value": "Unranked", "points": 0 },
        { "label": "Slot Booking Availability", "status": "MISSING", "value": "Not integrated on any platform", "points": 0 }
      ],
      "sentiment_data": {
        "total_reviews": 0,
        "average_rating": 0.0,
        "review_velocity_per_month": 0.0,
        "narrative_success_stories": 0,
        "points_breakdown": {
          "review_volume_and_rating": 0,
          "review_velocity": 0,
          "success_stories": 0
        }
      }
    },
    {
      "id": "conversational_ai",
      "name": "Conversational AI Standing",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_chatgpt_proof.png",
      "sub_categories": {
        "visibility": {
          "label": "AI Recommendation Standing",
          "score": 0.0,
          "max_points": 100,
          "details": "Average across 4 AI platforms: Recommended Top 3 = 100, Mentioned = 50, Not Recommended = 0."
        },
        "completeness": {
          "label": "Citation & Context Quality",
          "score": 0.0,
          "max_points": 100,
          "details": "Whether AI platforms cite credentials, clinic name, correct location, and specialization."
        },
        "sentiment": {
          "label": "AI Sentiment & Comparison",
          "score": 0.0,
          "max_points": 100,
          "details": "How favorably the AI compares the doctor vs top 3 competitors in the area."
        }
      },
      "platforms": [
        {
          "name": "ChatGPT",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "Verbatim excerpt from ChatGPT response...",
          "credentials_cited": false,
          "sentiment_positive": false,
          "evidence_screenshot": "assets/[doctor_slug]_chatgpt_proof.png",
          "top_recommendations": [
            { "name": "[Competitor 1]", "rank": 1, "reason_cited": "[Why ChatGPT ranks them]" },
            { "name": "[Competitor 2]", "rank": 2, "reason_cited": "[Why ChatGPT ranks them]" },
            { "name": "[Competitor 3]", "rank": 3, "reason_cited": "[Why ChatGPT ranks them]" }
          ]
        },
        {
          "name": "Gemini",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "...",
          "credentials_cited": false,
          "sentiment_positive": false,
          "evidence_screenshot": "assets/[doctor_slug]_gemini_proof.png",
          "top_recommendations": [
            { "name": "[Competitor 1]", "rank": 1, "reason_cited": "..." },
            { "name": "[Competitor 2]", "rank": 2, "reason_cited": "..." },
            { "name": "[Competitor 3]", "rank": 3, "reason_cited": "..." }
          ]
        },
        {
          "name": "Meta AI",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "...",
          "credentials_cited": false,
          "sentiment_positive": false,
          "evidence_screenshot": "assets/[doctor_slug]_meta_ai_proof.png",
          "top_recommendations": [
            { "name": "[Competitor 1]", "rank": 1, "reason_cited": "..." },
            { "name": "[Competitor 2]", "rank": 2, "reason_cited": "..." },
            { "name": "[Competitor 3]", "rank": 3, "reason_cited": "..." }
          ]
        },
        {
          "name": "Grok AI",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "...",
          "credentials_cited": false,
          "sentiment_positive": false,
          "evidence_screenshot": "assets/[doctor_slug]_grok_proof.png",
          "top_recommendations": [
            { "name": "[Competitor 1]", "rank": 1, "reason_cited": "..." },
            { "name": "[Competitor 2]", "rank": 2, "reason_cited": "..." },
            { "name": "[Competitor 3]", "rank": 3, "reason_cited": "..." }
          ]
        }
      ]
    },
    {
      "id": "eeat_credentials",
      "name": "E-E-A-T & Credentials Audit",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_eeat_proof.png",
      "sub_categories": {
        "visibility": {
          "label": "Registry Discoverability",
          "score": 0.0,
          "max_points": 100,
          "details": "Whether registration is discoverable via NMC/State Council lookup and indexed by search engines."
        },
        "completeness": {
          "label": "Credential Completeness",
          "score": 0.0,
          "max_points": 100,
          "details": "Degrees, council registration, CMO/Ayushman Bharat, publications, professional associations."
        },
        "sentiment": {
          "label": "Professional Reputation Signals",
          "score": 0.0,
          "max_points": 100,
          "details": "Publications indexed, IDA/IMA memberships, CME participation, peer citations."
        }
      },
      "checks": [
        { "label": "Verified Years of Experience", "status": "VERIFIED", "value": "19 Years (calc. from council registration year)", "points": 100 },
        { "label": "Verified Education (BDS/MDS/MBBS)", "status": "VERIFIED", "value": "BDS", "points": 100 },
        { "label": "State Council Registry Verification", "status": "VERIFIED", "value": "UP Dental Council — Reg No XXXXX, Date DD/MM/YYYY", "points": 100 },
        { "label": "NMC National Registry Cross-Check", "status": "MISSING", "value": "Not found in NMC database", "points": 0 },
        { "label": "CMO/Ayushman Bharat HFR Registration", "status": "MISSING", "value": "Not indexed in HFR portal", "points": 0 },
        { "label": "Clinical Publications Indexed", "status": "MISSING", "value": "0 publications found", "points": 0 },
        { "label": "Professional Associations (IDA/IMA)", "status": "MISSING", "value": "No membership found", "points": 0 },
        { "label": "Verified Area of Expertise", "status": "VERIFIED", "value": "Root Canals, Orthodontics, General Dentistry", "points": 100 }
      ]
    },
    {
      "id": "website_schema",
      "name": "Website & Schema Compliance",
      "weight": 15,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "assets/[doctor_slug]_website_proof.png",
      "sub_categories": {
        "visibility": {
          "label": "Website Discoverability",
          "score": 0.0,
          "max_points": 100,
          "details": "Whether an official clinic website exists and is linked from GBP/Bing/directories."
        },
        "completeness": {
          "label": "Schema & NAP Compliance",
          "score": 0.0,
          "max_points": 100,
          "details": "JSON-LD MedicalBusiness schema, NAP consistency, structured data validation."
        },
        "sentiment": {
          "label": "Website Patient Trust Signals",
          "score": 0.0,
          "max_points": 100,
          "details": "Patient testimonials on website, before/after photos, video content."
        }
      },
      "checks": [
        { "label": "Official Clinic Website Exists", "status": "MISSING", "value": "No website found", "points": 0 },
        { "label": "Website Linked from GBP", "status": "MISSING", "value": "N/A", "points": 0 },
        { "label": "MedicalBusiness JSON-LD Schema", "status": "MISSING", "value": "No schema found", "points": 0 },
        { "label": "Dentist/Physician @type Schema", "status": "MISSING", "value": "No schema found", "points": 0 },
        { "label": "NAP Address Consistency (Website vs GBP vs Bing)", "status": "CONFLICTING", "value": "...", "points": 50 },
        { "label": "NAP Phone Consistency (Website vs GBP vs Bing)", "status": "VERIFIED", "value": "...", "points": 100 },
        { "label": "Patient Testimonials on Website", "status": "MISSING", "value": "0 testimonials", "points": 0 },
        { "label": "Video Content on Website/YouTube", "status": "MISSING", "value": "0 videos", "points": 0 }
      ]
    }
  ],

  "competitor_callout": {
    "primary_competitor": "[Name of dominant local competitor]",
    "estimated_market_capture": "[Estimated % of local search traffic they capture]",
    "reason": "[Why they dominate — e.g., 200+ reviews, claimed GBP with photos, active Practo profile]"
  },

  "treatment_plan": [
    { "pillar": "Name/NAP Unification", "description": "Synchronize business name, address, and phone number across GBP, Bing Places, Justdial, Practo, and website to eliminate conflicting citations." },
    { "pillar": "Medical Registration Indexing", "description": "Ensure State Council registration is crawlable and linked from GBP and website JSON-LD." },
    { "pillar": "Schema Landing Page Setup", "description": "Inject JSON-LD MedicalBusiness/Dentist schema including openingHours, geo, and license details." },
    { "pillar": "Slot Booking Integration", "description": "Integrate appointment slot booking scheduler (e.g. Practo Booking or custom Calendly API) linked from GBP and website." },
    { "pillar": "Review Velocity Engine", "description": "Implement a post-visit review collection campaign to get >= 5 new organic reviews monthly to increase rankings." },
    { "pillar": "Video SEO", "description": "Publish 2 short clinic walkthrough or patient education videos to YouTube, linking them back to the clinic website." }
  ],

  "visual_proof_index": [
    { "label": "Google Maps Proof", "path": "assets/[doctor_slug]_maps_proof.png", "description": "Google Maps listing and rank evidence." },
    { "label": "Bing Search & Maps Proof", "path": "assets/[doctor_slug]_bing_proof.png", "description": "Bing Search query and maps ranking." },
    { "label": "Medical Aggregator Proof", "path": "assets/[doctor_slug]_aggregators_proof.png", "description": "Justdial/Practo claimed status and reviews." },
    { "label": "Medical Registry E-E-A-T Proof", "path": "assets/[doctor_slug]_eeat_proof.png", "description": "Official National/State Council registration registry verification." },
    { "label": "ChatGPT Standing Proof", "path": "assets/[doctor_slug]_chatgpt_proof.png", "description": "ChatGPT response showing local recommendations." },
    { "label": "Gemini Standing Proof", "path": "assets/[doctor_slug]_gemini_proof.png", "description": "Gemini response showing local recommendations." },
    { "label": "Meta AI Standing Proof", "path": "assets/[doctor_slug]_meta_ai_proof.png", "description": "Meta AI response showing local recommendations." },
    { "label": "Grok AI Standing Proof", "path": "assets/[doctor_slug]_grok_proof.png", "description": "Grok AI response showing local recommendations." },
    { "label": "Website & Schema Proof", "path": "assets/[doctor_slug]_website_proof.png", "description": "Homepage screenshot or search result showing website is missing." }
  ]
}
```

---

## 🧭 SECTION 2: DETERMINISTIC SCORING ENGINE (V7 GRADING RUBRIC)

To guarantee 100% deterministic scoring that reflects actual progress as doctors climb ranks, the V7 engine uses the standard progressive search rank scoring and per-channel sub-category scoring.

### 2.1 Progressive Search Rank Scoring (0–100 Scale)

For any search query in **Google SEO** or **Bing SEO**, points are calculated using the doctor's ranking position according to these progressive milestones:

| Rank Placement (`r`) | Score (`Points`) | Client Narrative / Reporting Angle |
| :--- | :--- | :--- |
| **Rank 1** | **100** | Market Leader: Maximum traffic and dominance. |
| **Rank 3** | **88** | High Traffic: Driving active leads and business. |
| **Rank 10** | **53** | Page 1 Milestone: You are visible, now optimizing CTR. |
| **Rank 15** | **33** | Striking Distance: Major progress, close to Page 1. |
| **Rank 25** | **12** | Gaining Momentum: Google recognizes the channel. |
| **Rank 30** | **3** | Foot in the Door: The absolute baseline of relevance. |
| **Rank 31 to 100** | **1** | Indexed: The site exists in the database. |
| **No Rank / > 100** | **0** | Invisible: Brand new baseline. |

#### Linear Interpolation Logic

For any rank position falling strictly between two milestones, perform standard linear interpolation:

$$\text{Points} = S_1 + \frac{(S_2 - S_1)}{(R_2 - R_1)} \times (r - R_1)$$

### 2.2 Per-Channel Sub-Category Scoring

Each channel has three sub-categories: **Visibility**, **Completeness**, and **Sentiment**. Each sub-category is scored on a **0–100 scale** (percentage). The channel's overall `channel_percentage_score` is the **weighted average** of its sub-categories:

| Sub-Category | Weight | Description |
| :--- | :--- | :--- |
| **Visibility** | **50%** | How easily the doctor/clinic is found on this channel. |
| **Completeness** | **30%** | How complete and accurate the profile/data is on this channel. |
| **Sentiment** | **20%** | Patient reviews, ratings, and trust signals on this channel. |

**Per-Channel Score Formula:**
$$\text{Channel \%} = (\text{Visibility} \times 0.5) + (\text{Completeness} \times 0.3) + (\text{Sentiment} \times 0.2)$$

### 2.3 Scoring Rules Per Channel

#### Channel: `google_seo` (Weight: 25%)
*   **Visibility (50%):** Average of interpolated points across all 7 standard queries on Google Search & Maps.
*   **Completeness (30%):** Average of `completeness_checks` points.
*   **Sentiment (20%):** Composite of Google Reviews.

#### Channel: `bing_seo` (Weight: 15%)
*   **Visibility (50%):** Average of interpolated points across all 7 standard queries on Bing Search & Maps.
*   **Completeness (30%):** Average of `completeness_checks` points.
*   **Sentiment (20%):** Bing Reviews.

#### Channel: `aggregators` (Weight: 15%)
*   **Visibility (50%):** Average of listing status and category ranking points.
*   **Completeness (30%):** Average of profile completeness checks.
*   **Sentiment (20%):** Aggregator Reviews.

#### Channel: `conversational_ai` (Weight: 15%)
*   **Visibility (50%):** Average across 4 AI platforms:
    *   Recommended in Top 3 = 100, Mentioned but not Top 3 = 50, Not Recommended = 0.
*   **Completeness (30%):** Average of citation quality across 4 platforms:
    *   Credentials cited correctly = 100, Partially cited = 50, Not cited = 0.
*   **Sentiment (20%):** Average of comparison favorability across 4 platforms:
    *   Positive comparison vs competitors = 100, Neutral = 50, Negative or absent = 0.

#### Channel: `eeat_credentials` (Weight: 15%)
*   **Visibility (50%):** Registry discoverability.
*   **Completeness (30%):** Credentials verification.
*   **Sentiment (20%):** Reputation signals.

#### Channel: `website_schema` (Weight: 15%)
*   **Visibility (50%):** Website discoverability.
*   **Completeness (30%):** Schema & NAP compliance.
*   **Sentiment (20%):** Trust signals.

---

## 🛠️ SECTION 3: HYBRID SEARCH & BROWSER MCP TOOLING BLUEPRINT

The auditor uses a **hybrid search system** that divides tasks between **Semantic Search APIs** (`search_web`) and **Human-Emulated Browser Sessions** (`browser-mcp`).

---

## 🧭 SECTION 4: STEP-BY-STEP CHANNEL AUTOMATED WORKFLOWS

---

### 🤖 Workflow 5: Conversational AI App GEO Standing → Channel `conversational_ai`

#### Steps:
1.  For each of the 4 AI platforms (ChatGPT, Gemini, Meta AI, Grok AI):
    *   Open a browser session and navigate (`mcp_browser-mcp_browser_navigate`) to the conversational interface:
        *   ChatGPT: `https://chatgpt.com` or custom AI sandbox.
        *   Gemini: `https://gemini.google.com` or custom AI sandbox.
        *   Meta AI: `https://www.meta.ai` or custom AI sandbox.
        *   Grok AI: `https://x.com/i/grok` or custom AI sandbox.
    *   Issue the **Smart Comparative Prompt** (Section 1.5) with the doctor's actual specialty, area, city, clinic name, and doctor name substituted.
    *   Call `mcp_browser-mcp_browser_wait_for_network` and wait for the model to finish streaming its response completely.
    *   Extract page text using `mcp_browser-mcp_browser_get_page_content` to read the full text answer.
    *   Take an individual platform screenshot using `mcp_browser-mcp_browser_screenshot` and save it directly to `reports/v7/assets/[doctor_slug]_[platform_name]_proof.png` (all lowercase, e.g., `dr_vishal_maurya_chatgpt_proof.png`).
2.  For each platform response, parse the output text and extract:
    *   **Standing:** "Recommended in Top 3" / "Mentioned but not Top 3" / "Not Recommended".
    *   **Recommended rank** (if applicable): 1, 2, 3, or null.
    *   **Verbatim citation:** Verbatim paragraph explaining the AI's view of the doctor/clinic.
    *   **Credentials cited:** true if degrees, state registrations, or years of experience are referenced; false otherwise.
    *   **Sentiment positive:** true if compared favorably vs top 3 competitors; false otherwise.
    *   **Top Recommendations:** Identify the exact names of the top 3 doctors/clinics recommended by this specific platform, their relative rank in the response, and the reason given by the AI.
3.  Populate all fields in the `conversational_ai` platform objects, calculate final visibility/completeness/sentiment sub-category scores, and compute the overall `conversational_ai` channel score.

#### 🚦 Channel DOs & DONTs — Conversational AI:
*   ✅ **DO** execute the prompt on all 4 platform UI dashboards.
*   ✅ **DO** save individual, unique screenshots for EACH of the 4 platforms under `reports/v7/assets/`.
*   ✅ **DO** capture the exact top 3 recommended competitors and reasons given by the AI for each platform.
*   ✅ **DO** use `mcp_browser-mcp_browser_wait_for_network` to ensure the conversational streaming output has completely finished rendering before taking the screenshot.
*   🛑 **DO NOT** use generic placeholder screenshots.
*   🛑 **DO NOT** group AI responses into a single screenshot or citation block. Each platform must be fully separated.

---

## 📋 SECTION 5: PER-CHANNEL STEP-VERIFICATION CHECKLIST

Every report execution must generate a separate step-verification checklist file alongside the JSON report.

*   **File Path:** `reports/v7/[doctor_slug]_run_checklist.md`
*   **Structure:** Standard run checklists for Channels 1 to 6. Include individual check slots for ChatGPT, Gemini, Meta AI, and Grok AI screenshot capturing.

---

## 🚫 SECTION 6: STRICT OPERATIONAL DOs & DONTs MATRIX

### 🔴 GLOBAL OPERATIONAL DONTs
*   🛑 **NO PLACEHOLDERS OR SUBJECTIVITY:** Never use generic images. All visual proof screenshots must be captured live.
*   🛑 **NO ABSOLUTE FILE IMAGE PATHS:** Always use relative paths starting with `assets/` (e.g., `assets/[doctor_slug]_chatgpt_proof.png`) for report viewer compatibility.

### 🟢 GLOBAL OPERATIONAL DOs
*   ✅ **DO CAPTURE ALL 4 AI PROOFS:** Ensure `reports/v7/assets/[doctor_slug]_chatgpt_proof.png`, `_gemini_proof.png`, `_meta_ai_proof.png`, and `_grok_proof.png` are captured and indexed correctly.

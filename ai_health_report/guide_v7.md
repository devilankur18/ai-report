/goal Generate a json report for a doctor with follwoings details follwong the instructions below. dont read any exisitng files until explicity mentioned in the insturctions. FInd any gaps in pulling data for any channel. Report back it at the end. Dont make any plan or nonsense. Use only mcp tools menitoned below, dont write code. if some instruction is not clear stop there and ask right away, just stick to the workflow word by word and give me step by step update.

Dont fucking do anything on your own. No plans needed, just execute this below 

# DigiClinic AI Rank & SEO Report Generator Guide (Version 7)

This document is the master operational specification for the DigiClinic Digital Presence & AI Rank Analyzer (Version 7). Key characteristics of this version include:

1.  **Enriched Conversational AI Sub-Category & Multi-App Verification:** Conversational AI (ChatGPT, Gemini, Meta AI, and Grok AI) runs queries in each engine via browser MCP, captures individual high-fidelity screenshots as proof, and parses structured text to identify rankings, top 3 recommended doctors, and corresponding citation reasons.
2.  **Individual Visual Proofs for AI Platforms:** Every AI platform has its own individual visual proof screenshot saved in `[OUTPUT_DIR]/`.
3.  **JSON Report Output Version 7:** The primary deliverable is a structured JSON file targeting `[OUTPUT_DIR]/` to power the interactive Report Viewer application.

---

## 🗂️ SECTION 1: JSON REPORT SCHEMA SPECIFICATION

Every generated report must strictly conform to the following JSON schema. No fields may be added, rearranged, or removed unless explicitly specified in this guide.

### Output File Convention
*   **Run Output Directory (`[OUTPUT_DIR]`):** `reports/v7/<doctor-name>-<yy-mm-dd-HH-MM>/`
*   **File Name:** `[doctor_slug]_report.json` or `[doctor_slug]_report_[YYYY-MM].json` for monthly tracking inside `[OUTPUT_DIR]`.
*   **Screenshot Assets Directory:** `[OUTPUT_DIR]` (all assets, images, JSON, and checklist go in this single directory).

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
  "diagnostic_summary": "A highly focused, 2-3 sentence paragraph summarizing strengths, core technical gaps (e.g., missing schema, unclaimed profiles, wrong GBP primary categories), and local competitive standing."
}
```

**Tier Rules (Immutable):**
*   `EXCELLENT`: overall_score >= 80
*   `GOOD`: overall_score 60–79
*   `MODERATE`: overall_score 40–59
*   `WEAK`: overall_score < 40

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

  "channels": [
    {
      "id": "google_seo",
      "name": "Google Search & Maps",
      "weight": 25,
      "channel_percentage_score": 0.0,
      "evidence_screenshot": "maps_proof.png",
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
      "evidence_screenshot": "bing_proof.png",
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
      "evidence_screenshot": "aggregators_proof.png",
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
      "evidence_screenshot": "chatgpt_proof.png",
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
          "evidence_screenshot": "chatgpt_proof.png",
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
          "evidence_screenshot": "gemini_proof.png",
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
          "evidence_screenshot": "meta_ai_proof.png",
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
          "evidence_screenshot": "grok_proof.png",
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
      "evidence_screenshot": "eeat_proof.png",
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
      "evidence_screenshot": "website_proof.png",
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
    { "label": "Google Maps Proof", "path": "maps_proof.png", "description": "Google Maps listing and rank evidence." },
    { "label": "Bing Search & Maps Proof", "path": "bing_proof.png", "description": "Bing Search query and maps ranking." },
    { "label": "Medical Aggregator Proof", "path": "aggregators_proof.png", "description": "Justdial/Practo claimed status and reviews." },
    { "label": "Medical Registry E-E-A-T Proof", "path": "eeat_proof.png", "description": "Official National/State Council registration registry verification." },
    { "label": "ChatGPT Standing Proof", "path": "chatgpt_proof.png", "description": "ChatGPT response showing local recommendations." },
    { "label": "Gemini Standing Proof", "path": "gemini_proof.png", "description": "Gemini response showing local recommendations." },
    { "label": "Meta AI Standing Proof", "path": "meta_ai_proof.png", "description": "Meta AI response showing local recommendations." },
    { "label": "Grok AI Standing Proof", "path": "grok_proof.png", "description": "Grok AI response showing local recommendations." },
    { "label": "Website & Schema Proof", "path": "website_proof.png", "description": "Homepage screenshot or search result showing website is missing." }
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

### 2.4 Deterministic Sentiment Scoring Rubric

Sentiment scoring is **fully deterministic**. Use the rubric tables below — no subjective judgment is permitted. Match the **first** row where ALL conditions are true (scan top-to-bottom).

#### 2.4.1 Reviews-Based Sentiment (Google SEO, Bing SEO, Aggregators)

The sentiment score is a weighted composite of three components:

$$\text{Sentiment} = (\text{Volume \& Rating} \times 0.5) + (\text{Velocity} \times 0.3) + (\text{Success Stories} \times 0.2)$$

**Review Volume & Rating Points:**

| Condition | Points |
|:---|:---|
| >= 100 reviews AND >= 4.5 avg rating | 100 |
| >= 50 reviews AND >= 4.5 avg rating | 80 |
| >= 50 reviews AND >= 4.0 avg rating | 60 |
| >= 20 reviews AND >= 4.5 avg rating | 50 |
| >= 20 reviews AND >= 4.0 avg rating | 40 |
| >= 10 reviews AND >= 4.0 avg rating | 20 |
| >= 10 reviews AND < 4.0 avg rating | 10 |
| < 10 reviews | 0 |

**Review Velocity Points (reviews per month):**

| Reviews/Month | Points |
|:---|:---|
| >= 10 | 100 |
| >= 5 | 80 |
| >= 2 | 60 |
| >= 1 | 40 |
| >= 0.5 | 20 |
| < 0.5 | 0 |

**Narrative Success Stories Points** (reviews with detailed patient narratives, >= 3 sentences):

| Count | Points |
|:---|:---|
| >= 10 | 100 |
| >= 5 | 60 |
| >= 2 | 40 |
| >= 1 | 20 |
| 0 | 0 |

#### 2.4.2 E-E-A-T Sentiment (Reputation Signals)

Score = Average points of all 4 checks:

| Check | Found = Points | Not Found = Points |
|:---|:---|:---|
| Clinical Publications Indexed (PubMed/Google Scholar) | 100 | 0 |
| Professional Association Membership (IDA/IMA) | 100 | 0 |
| CME/Conference Participation Indexed | 100 | 0 |
| Peer Citations or Awards | 100 | 0 |

#### 2.4.3 Website Sentiment (Trust Signals)

Score = Average points of all 4 checks:

| Check | Found = Points | Not Found = Points |
|:---|:---|:---|
| Patient Testimonials on Website (>= 3) | 100 | 0 |
| Before/After Photo Gallery | 100 | 0 |
| Video Content (website or YouTube, >= 1) | 100 | 0 |
| Blog/Educational Content (>= 2 posts) | 100 | 0 |

#### 2.4.4 Conversational AI Sentiment

Already defined in Section 2.3: Positive comparison = 100, Neutral = 50, Negative/absent = 0. Average across 4 platforms.

### 2.5 Overall Score Computation

The `overall_score` is the **weighted sum** of all 6 channel percentage scores:

$$\text{overall\_score} = \sum_{i=1}^{6} \left( \text{channel\_percentage\_score}_i \times \frac{\text{weight}_i}{100} \right)$$

**Expanded:**
$$\text{overall\_score} = (\text{google\_seo} \times 0.25) + (\text{bing\_seo} \times 0.15) + (\text{aggregators} \times 0.15) + (\text{conversational\_ai} \times 0.15) + (\text{eeat\_credentials} \times 0.15) + (\text{website\_schema} \times 0.15)$$

Round the final `overall_score` to the nearest integer. Then apply Tier Rules from Section 1.2.

---

## 🛠️ SECTION 3: HYBRID SEARCH & BROWSER MCP TOOLING BLUEPRINT

The auditor uses a **hybrid search system** that divides tasks between **Semantic Search APIs** (`search_web`) and **Human-Emulated Browser Sessions** (`browser-mcp`).

### 3.1 MCP Tool Quick-Reference

These are the **exact** `browser-mcp` tools and their parameter signatures used across all workflows. **Do NOT read tool schema files at runtime** — use these signatures directly.

| Tool Name | Required Params | Optional Params | Purpose |
|:---|:---|:---|:---|
| `browser_navigate` | `url` (string) | `new_tab` (bool, default: false) | Navigate current tab to a URL |
| `browser_fill` | `selector` (string), `value` (string) | — | Fill a form input field (CSS or text selector) |
| `browser_click` | `selector` (string) | — | Click an element (CSS or text selector, e.g. `"button:text(Submit)"`, `"#my-button"`) |
| `browser_press_key` | `key` (string, e.g. `"Enter"`) | `ctrl` (bool), `shift` (bool), `meta` (bool), `alt` (bool) | Press a keyboard key |
| `browser_wait` | `selector` (string) | `timeout` (number, default: 10000) | Wait for an element to appear on the page |
| `browser_wait_for_network` | — | `url_pattern` (string), `timeout` (number, default: 15000) | Wait for network requests to complete |
| `browser_get_page_content` | — | `format` (enum: `"text"` / `"html"`, default: `"text"`) | Extract page content as text or HTML |
| `browser_screenshot` | — | `path` (string, e.g. `/absolute/path/screenshot.png`) | Take screenshot; saves to disk if path provided |
| `browser_scroll` | — | `selector` (string), `x` (number), `y` (number) | Scroll to element or by pixel amount |
| `browser_dismiss_overlays` | — | `scope` (enum: `"non_critical"` / `"aggressive"`, default: `"non_critical"`), `max_passes` (number, default: 3) | Dismiss popups, modals, cookie banners |
| `browser_execute_script` | `code` (string) | — | Execute JS in page context, returns result |
| `search_web` | `query` (string) | `domain` (string) | Semantic web search; returns ranked result summaries with URLs. Use for all search rank queries. |

### 3.2 Global Error Handling Patterns

Before executing any platform workflow, the agent must follow these standard error-recovery patterns. Each step table below references these by code (e.g., `→ ERR-LOGIN`).

| Error Code | Trigger Condition | Recovery Action |
|:---|:---|:---|
| **ERR-LOGIN** | Page redirects to a login/signup screen, or page content contains "Sign in", "Log in", "Create account" as the primary action | **STOP.** Tell the user: *"[Platform] requires authentication. Please log in manually in the browser, then say 'continue'."* Do NOT attempt to fill login credentials. |
| **ERR-CAPTCHA** | Page shows CAPTCHA, Cloudflare challenge, or "Verify you are human" | Call `browser_dismiss_overlays` with `{"scope": "non_critical"}`. If still blocked, **STOP** and ask user to solve it manually. |
| **ERR-SELECTOR** | `browser_fill` or `browser_click` fails with "element not found" | **Selector recovery sequence:** ① Call `browser_get_page_content` with `{"format": "html"}`. ② Search the HTML for `<textarea`, `contenteditable="true"`, or `<input` elements. ③ Use the first matching selector found. ④ If no input element found, call `browser_screenshot` (no path) to visually inspect, then **STOP** and ask user for the correct selector. |
| **ERR-TIMEOUT** | `browser_wait` or `browser_wait_for_network` times out | Retry once with `timeout` doubled (e.g., 30000 → 60000). If still timed out, call `browser_screenshot` (no path) to inspect state, then **STOP** and report the issue. |
| **ERR-NAVIGATE** | `browser_navigate` fails or page returns HTTP error | Retry the same URL once. If still failing, **STOP** and ask user to provide a working URL for this platform. |
| **ERR-EMPTY** | `browser_get_page_content` returns empty or very short text (< 50 chars) after waiting | The response may still be streaming. Call `browser_wait` with `{"selector": "text=.", "timeout": 15000}` then retry `browser_get_page_content`. If still empty, call `browser_screenshot` (no path) and **STOP**. |

---

## 🧭 SECTION 4: STEP-BY-STEP CHANNEL AUTOMATED WORKFLOWS

Execute Workflows 1 through 6 in order. Each workflow maps to one channel in the JSON report.

---

### 🔍 Workflow 1: Google Search & Maps → Channel `google_seo`

#### 1A: Execute 7 Standard Search Queries

**Repeat the following steps for EACH of the 7 standard queries from Section 1.4** (substitute `{SPECIALTY}`, `{AREA}`, `{CITY}`, `{CLINIC_NAME}` with actual values):

| Step | Action | Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Run the search query | `search_web` | `{"query": "<query text>"}` | Retry once. If still fails → rank = `"Unranked"`, points = `0`. |
| 2 | Scan results for doctor/clinic name | *Agent parsing* | Search returned text for `{CLINIC_NAME}`, `{DOCTOR_NAME}`, or known aliases (e.g., "Pravisha Health Care Center" for "Pravisha Healthcare") | If neither found → rank = `"Unranked"`, points = `0`. Skip to step 4. |
| 3 | Determine rank position | *Agent parsing* | Count the 1-indexed position of the first matching result. Apply interpolation from Section 2.1. | Use **exact** position from results. Do NOT estimate or round to milestone numbers. |
| 4 | Extract top 3 competitors | *Agent parsing* | Record the names and **actual URLs** from positions 1, 2, 3 in the search results. | **Never fabricate URLs.** If fewer than 3 results, record as many as available with real links. |

After all 7 queries: `visibility.score = average of all 7 query points`.

#### 1B: GBP Profile Inspection

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Navigate to Google Maps search | `browser_navigate` | `{"url": "https://www.google.com/maps/search/{CLINIC_NAME}+{AREA}+{CITY}"}` | `→ ERR-NAVIGATE` |
| 2 | Dismiss overlays | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore |
| 3 | Wait for Maps results | `browser_wait` | `{"selector": "#searchboxinput", "timeout": 10000}` | `→ ERR-TIMEOUT` |
| 4 | Extract page content | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 5 | Parse completeness checks | *Agent parsing* | From extracted text, check: GBP claimed status, primary category, photo count, address, phone. Cross-reference address and phone against data found later in Workflows 2-3 for NAP consistency. | Record each check: `VERIFIED` = 100, `MISSING` = 0, `CONFLICTING` = 50. |
| 6 | Parse review data | *Agent parsing* | Extract: `total_reviews`, `average_rating`. Calculate `review_velocity_per_month` = total_reviews ÷ months since oldest visible review. Count narrative success stories (reviews >= 3 sentences long). | Apply sentiment rubric from **Section 2.4.1**. |
| 7 | Take evidence screenshot | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/maps_proof.png"}` | Retry once. |

**Scoring:**
- `completeness.score` = average of all `completeness_checks` points.
- `sentiment.score` = apply Section 2.4.1 formula.
- `channel_percentage_score` = apply Section 2.2 weighted formula.

---

### 🔍 Workflow 2: Bing Search & Maps → Channel `bing_seo`

#### 2A: Execute 7 Standard Search Queries on Bing

**Repeat the following steps for EACH of the 7 standard queries from Section 1.4:**

| Step | Action | Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Run query scoped to Bing | `search_web` | `{"query": "<query text>", "domain": "bing.com"}` | Retry once. If still fails → rank = `"Unranked"`, points = `0`. |
| 2 | Scan results for doctor/clinic name | *Agent parsing* | Same as Workflow 1A step 2. | If not found → rank = `"Unranked"`, points = `0`. Skip to step 4. |
| 3 | Determine rank position | *Agent parsing* | Same as Workflow 1A step 3. Apply Section 2.1 interpolation. | Use exact position. Do NOT estimate. |
| 4 | Extract top 3 competitors with actual URLs | *Agent parsing* | Record names and **real URLs** from positions 1, 2, 3. | **Never fabricate URLs.** Use real links from search results. |

After all 7 queries: `visibility.score = average of all 7 query points`.

#### 2B: Bing Places Profile Inspection

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Search Bing for the clinic | `browser_navigate` | `{"url": "https://www.bing.com/search?q={CLINIC_NAME}+{AREA}+{CITY}"}` | `→ ERR-NAVIGATE` |
| 2 | Dismiss overlays / CAPTCHA | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | `→ ERR-CAPTCHA` |
| 3 | Wait for results | `browser_wait` | `{"selector": "#b_results", "timeout": 10000}` | `→ ERR-TIMEOUT` |
| 4 | Extract page content | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 5 | Parse completeness checks | *Agent parsing* | Check for: Bing Places listing active, photos count, address consistency vs Google (from Workflow 1B), phone consistency vs Google. | `VERIFIED` = 100, `MISSING` = 0, `CONFLICTING` = 50. |
| 6 | Parse review data | *Agent parsing* | Extract Bing review count and rating if available. If no Bing reviews exist → all sentiment components = 0. | Apply Section 2.4.1 rubric. |
| 7 | Take evidence screenshot | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/bing_proof.png"}` | Retry once. |

**Scoring:** Same formulas as Workflow 1.

---

### 🔍 Workflow 3: Medical Aggregators → Channel `aggregators`

#### 3A: Justdial Profile Inspection

| Step | Action | Tool / MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Search for doctor on Justdial | `search_web` | `{"query": "{DOCTOR_NAME} {SPECIALTY} {AREA} {CITY} site:justdial.com"}` | Fallback: `{"query": "{CLINIC_NAME} {CITY} site:justdial.com"}`. If still none → Justdial status = `MISSING`. Skip to 3B. |
| 2 | Navigate to Justdial profile URL | `browser_navigate` | `{"url": "<actual URL from search result>"}` | `→ ERR-NAVIGATE` |
| 3 | Dismiss overlays | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore |
| 4 | Wait for profile to load | `browser_wait` | `{"selector": ".store-details, .lng_cont_heading, .resultbox_info", "timeout": 10000}` | `→ ERR-TIMEOUT` |
| 5 | Extract page content | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 6 | Parse metrics | *Agent parsing* | Extract: listing status (claimed/verified/unclaimed), rating, review count, experience years, specialization tags, slot booking availability. | Record each as a `metrics[]` entry with `VERIFIED`/`MISSING` status and points. |
| 7 | Take screenshot | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/aggregators_proof.png"}` | Retry once. |

#### 3B: Practo Profile Inspection

| Step | Action | Tool / MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Search for doctor on Practo | `search_web` | `{"query": "{DOCTOR_NAME} {SPECIALTY} {CITY} site:practo.com"}` | If no results → Practo status = `MISSING`, points = 0. Skip to scoring. |
| 2 | Navigate to Practo profile | `browser_navigate` | `{"url": "<actual URL from search result>"}` | `→ ERR-NAVIGATE` |
| 3 | Dismiss overlays | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore |
| 4 | Extract page content | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 5 | Parse metrics | *Agent parsing* | Extract: profile active status, rating, review count, consultation fee, specializations. | Record as `metrics[]` entries. |

**Scoring:**
- `visibility.score` = average of listing status + category ranking points across both platforms.
- `completeness.score` = average of all profile completeness `metrics[]` points.
- `sentiment.score` = apply Section 2.4.1 rubric to combined Practo + Justdial review data.

---

### 🔍 Workflow 4: E-E-A-T & Credentials Audit → Channel `eeat_credentials`

| Step | Action | Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Search for state council registration | `search_web` | `{"query": "{DOCTOR_NAME} {STATE} dental council registration"}` (use `medical council` for MBBS doctors) | Fallback: `{"query": "{DOCTOR_NAME} doctor registration {STATE}"}`. If none → council status = `MISSING`. |
| 2 | Verify registration details | *Agent parsing* | Extract: council name, registration number, registration date. | If found → status = `VERIFIED`, points = 100. Record in `report_metadata.state_council_registration`. |
| 3 | Cross-check NMC national registry | `search_web` | `{"query": "{DOCTOR_NAME} site:nmc.org.in"}` | If not found → NMC status = `MISSING`. Note: dentists register under DCI, not NMC — expected for dentists. |
| 4 | Search for education credentials | `search_web` | `{"query": "{DOCTOR_NAME} {SPECIALTY} BDS MDS MBBS degree {CITY}"}` | If not found → education status = `MISSING`. |
| 5 | Search CMO/Ayushman Bharat HFR | `search_web` | `{"query": "{CLINIC_NAME} ayushman bharat HFR"}` | If not found → HFR status = `MISSING`. |
| 6 | Search for clinical publications | `search_web` | `{"query": "{DOCTOR_NAME} {SPECIALTY} publication pubmed OR scholar.google.com"}` | If none → publications = `MISSING`. |
| 7 | Search for professional associations | `search_web` | `{"query": "{DOCTOR_NAME} IDA IMA member {STATE}"}` | If none → association = `MISSING`. |
| 8 | Navigate to best registry evidence page | `browser_navigate` | `{"url": "<best registry URL found, or Google search results page>"}` | If no registry URL, use Google search page as evidence. |
| 9 | Take evidence screenshot | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/eeat_proof.png"}` | Retry once. |

**Scoring:**
- `visibility.score` = council found on official registry site = 100, found only on directories = 50, not found = 0.
- `completeness.score` = average of all `checks[]` points (each: `VERIFIED` = 100, `MISSING` = 0).
- `sentiment.score` = apply Section 2.4.2 rubric.

---

### 🤖 Workflow 5: Conversational AI App GEO Standing → Channel `conversational_ai`

This workflow is split into **4 individual sub-workflows** (5A–5D), one per AI platform. Execute them in order. After all 4 complete, run the **Shared Parsing & Scoring** step.

**Prompt Template** (substitute `{SPECIALTY}`, `{AREA}`, `{CITY}`, `{CLINIC_NAME}`, `{DOCTOR_NAME}` with actual values from report input):

> *"You are a local health advisor. Recommend the top {SPECIALTY} in {AREA}, {CITY}. Compare their verified credentials (education, council registration, experience), review ratings, and patient sentiment. List them in a ranked table with reasons for their rank. Check if {CLINIC_NAME} or {DOCTOR_NAME} is recommended and compare them with the top 3."*

---

#### 🤖 Workflow 5A: ChatGPT → `conversational_ai.platforms[0]`

**Platform URL:** `https://chatgpt.com`
**Screenshot file:** `chatgpt_proof.png`

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Navigate to ChatGPT | `browser_navigate` | `{"url": "https://chatgpt.com"}` | `→ ERR-NAVIGATE` |
| 2 | Dismiss any overlays (cookie banners, popups) | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore — continue to step 3 |
| 3 | Wait for the prompt textarea to load | `browser_wait` | `{"selector": "#prompt-textarea", "timeout": 10000}` | Check for login wall `→ ERR-LOGIN`. If no login wall, `→ ERR-SELECTOR` |
| 4 | Fill the Smart Comparative Prompt into the textarea | `browser_fill` | `{"selector": "#prompt-textarea", "value": "<PROMPT_TEXT>"}` | `→ ERR-SELECTOR` — fallback selectors in order: `"textarea"`, `"div[contenteditable='true']"` |
| 5 | Submit the prompt | `browser_press_key` | `{"key": "Enter"}` | If no response appears, try `browser_click` with `{"selector": "button[data-testid='send-button']"}` |
| 6 | Wait for ChatGPT to finish streaming the response | `browser_wait_for_network` | `{"timeout": 30000}` | `→ ERR-TIMEOUT` |
| 7 | Additional wait for rendering to complete | `browser_wait` | `{"selector": "button[data-testid='send-button']:not([disabled])", "timeout": 20000}` | Ignore — proceed to step 8 (response may already be done) |
| 8 | Scroll down to ensure full response is visible | `browser_scroll` | `{"y": 500}` | Ignore |
| 9 | Extract the full page text | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 10 | Take evidence screenshot and save to disk | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/chatgpt_proof.png"}` | Retry once. If still fails, take screenshot without `path` (returns base64) and save manually. |

---

#### 🤖 Workflow 5B: Gemini → `conversational_ai.platforms[1]`

**Platform URL:** `https://gemini.google.com/app`
**Screenshot file:** `gemini_proof.png`

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Navigate to Gemini | `browser_navigate` | `{"url": "https://gemini.google.com/app"}` | `→ ERR-NAVIGATE` |
| 2 | Dismiss any overlays | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore — continue |
| 3 | Check for login redirect | `browser_get_page_content` | `{"format": "text"}` | If content contains "Sign in" or URL changed to `accounts.google.com` → `ERR-LOGIN` |
| 4 | Wait for the input area to load | `browser_wait` | `{"selector": "div.ql-editor[contenteditable='true'], rich-textarea textarea, div[contenteditable='true']", "timeout": 10000}` | `→ ERR-SELECTOR` |
| 5 | Fill the Smart Comparative Prompt | `browser_fill` | `{"selector": "div.ql-editor[contenteditable='true']", "value": "<PROMPT_TEXT>"}` | Fallback selectors in order: `"rich-textarea textarea"`, `"div[contenteditable='true']"`, `"textarea"`. If all fail `→ ERR-SELECTOR` |
| 6 | Submit the prompt | `browser_click` | `{"selector": "button[aria-label='Send message']"}` | Fallback: `browser_press_key` with `{"key": "Enter"}`. If still no submit: try `browser_click` with `{"selector": "button:text(Submit)"}` |
| 7 | Wait for Gemini to finish streaming | `browser_wait_for_network` | `{"timeout": 30000}` | `→ ERR-TIMEOUT` |
| 8 | Additional wait for response rendering | `browser_wait` | `{"selector": "message-content, .model-response-text, .response-container", "timeout": 20000}` | Ignore — proceed |
| 9 | Scroll down to ensure full response visible | `browser_scroll` | `{"y": 500}` | Ignore |
| 10 | Extract the full page text | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 11 | Take evidence screenshot and save to disk | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/gemini_proof.png"}` | Retry once. If still fails, screenshot without path + manual save. |

---

#### 🤖 Workflow 5C: Meta AI → `conversational_ai.platforms[2]`

**Platform URL:** `https://www.meta.ai`
**Screenshot file:** `meta_ai_proof.png`

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Navigate to Meta AI | `browser_navigate` | `{"url": "https://www.meta.ai"}` | `→ ERR-NAVIGATE` |
| 2 | Dismiss any overlays (cookie consent, etc.) | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore — continue |
| 3 | Check for login redirect | `browser_get_page_content` | `{"format": "text"}` | If content contains "Log in with Facebook", "Sign up", or URL redirects to `facebook.com` → `ERR-LOGIN` |
| 4 | Wait for the input area to load | `browser_wait` | `{"selector": "textarea, div[contenteditable='true']", "timeout": 10000}` | `→ ERR-SELECTOR` |
| 5 | Fill the Smart Comparative Prompt | `browser_fill` | `{"selector": "textarea[placeholder]", "value": "<PROMPT_TEXT>"}` | Fallback selectors in order: `"textarea"`, `"div[contenteditable='true']"`. If all fail `→ ERR-SELECTOR` |
| 6 | Submit the prompt | `browser_press_key` | `{"key": "Enter"}` | Fallback: `browser_click` with `{"selector": "button[aria-label='Send']"}`. If still no submit: try `{"selector": "button[type='submit']"}` |
| 7 | Wait for Meta AI to finish streaming | `browser_wait_for_network` | `{"timeout": 30000}` | `→ ERR-TIMEOUT` |
| 8 | Additional wait for response rendering | `browser_wait` | `{"selector": ".response-text, .message-content, div[data-testid]", "timeout": 20000}` | Ignore — proceed |
| 9 | Scroll down to ensure full response visible | `browser_scroll` | `{"y": 500}` | Ignore |
| 10 | Extract the full page text | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 11 | Take evidence screenshot and save to disk | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/meta_ai_proof.png"}` | Retry once. If still fails, screenshot without path + manual save. |

---

#### 🤖 Workflow 5D: Grok AI → `conversational_ai.platforms[3]`

**Platform URL:** `https://x.com/i/grok`
**Screenshot file:** `grok_proof.png`

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Navigate to Grok AI | `browser_navigate` | `{"url": "https://x.com/i/grok"}` | `→ ERR-NAVIGATE` |
| 2 | Dismiss any overlays | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore — continue |
| 3 | Check for login redirect | `browser_get_page_content` | `{"format": "text"}` | If content contains "Sign in", "Log in to X", or URL redirects to `x.com/login` → `ERR-LOGIN` |
| 4 | Wait for the input area to load | `browser_wait` | `{"selector": "textarea, div[contenteditable='true']", "timeout": 10000}` | `→ ERR-SELECTOR` |
| 5 | Fill the Smart Comparative Prompt | `browser_fill` | `{"selector": "textarea", "value": "<PROMPT_TEXT>"}` | Fallback selectors in order: `"div[contenteditable='true']"`, `"input[type='text']"`. If all fail `→ ERR-SELECTOR` |
| 6 | Submit the prompt | `browser_press_key` | `{"key": "Enter"}` | Fallback: `browser_click` with `{"selector": "button[aria-label='Send']"}`. If still no submit: try `{"selector": "button[type='submit']"}` |
| 7 | Wait for Grok AI to finish streaming | `browser_wait_for_network` | `{"timeout": 30000}` | `→ ERR-TIMEOUT` |
| 8 | Additional wait for response rendering | `browser_wait` | `{"selector": ".message, .response, div[data-testid]", "timeout": 20000}` | Ignore — proceed |
| 9 | Scroll down to ensure full response visible | `browser_scroll` | `{"y": 500}` | Ignore |
| 10 | Extract the full page text | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 11 | Take evidence screenshot and save to disk | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/grok_proof.png"}` | Retry once. If still fails, screenshot without path + manual save. |

---

#### 📊 Workflow 5E: Shared Parsing & Scoring (run after all 4 platforms complete)

After completing Workflows 5A–5D, parse each platform's extracted text (from step 9/10 of each workflow) and populate the `conversational_ai` channel data.

**For each platform response, extract these fields:**

| Field | How to Extract | JSON Key |
|:---|:---|:---|
| **Standing** | Search extracted text for doctor/clinic name. If found in the top 3 ranked entries → `"Recommended in Top 3"`. If mentioned anywhere else → `"Mentioned but not Top 3"`. If absent → `"Not Recommended"`. | `platforms[n].standing` |
| **Recommended Rank** | If standing is "Recommended in Top 3", note the position (1, 2, or 3). Otherwise → `null`. | `platforms[n].recommended_rank` |
| **Verbatim Citation** | Copy the exact paragraph or sentence where the AI discusses the target doctor/clinic. If not mentioned, write `"Doctor/clinic not mentioned in response."` | `platforms[n].citation` |
| **Credentials Cited** | Set `true` if the response references degrees (BDS, MDS, MBBS), state council registration, or years of experience for the target doctor. Otherwise `false`. | `platforms[n].credentials_cited` |
| **Sentiment Positive** | Set `true` if the AI compares the target doctor/clinic favorably vs. top 3 competitors (e.g., "highly rated", "recommended"). Set `false` if compared negatively, neutrally, or not compared at all. | `platforms[n].sentiment_positive` |
| **Top 3 Recommendations** | Identify the top 3 doctors/clinics the AI actually recommended. For each, record: `name`, `rank` (1/2/3), `reason_cited` (the AI's stated reason). | `platforms[n].top_recommendations[]` |

**Sub-Category Scoring (per platform, then averaged across 4 platforms):**

| Sub-Category | Per-Platform Score | Averaging |
|:---|:---|:---|
| **Visibility** | Recommended Top 3 = 100, Mentioned = 50, Not Recommended = 0 | Average of 4 platform scores |
| **Completeness** | Credentials cited correctly = 100, Partially cited = 50, Not cited = 0 | Average of 4 platform scores |
| **Sentiment** | Positive comparison = 100, Neutral = 50, Negative/absent = 0 | Average of 4 platform scores |

**Channel Score Formula:**
$$\text{conversational\_ai \%} = (\text{Visibility} \times 0.5) + (\text{Completeness} \times 0.3) + (\text{Sentiment} \times 0.2)$$

---

#### 🚦 Channel DOs & DONTs — Conversational AI:

**DOs:**
*   ✅ **DO** execute Workflows 5A, 5B, 5C, and 5D individually and in order.
*   ✅ **DO** follow each step table row-by-row. Do NOT skip steps or combine them.
*   ✅ **DO** save individual, unique screenshots for EACH platform: `chatgpt_proof.png`, `gemini_proof.png`, `meta_ai_proof.png`, `grok_proof.png`.
*   ✅ **DO** capture the exact top 3 recommended competitors and reasons for each platform separately.
*   ✅ **DO** always call `browser_wait_for_network` (step 6/7) AND `browser_wait` (step 7/8) before taking the screenshot. Both waits are required to ensure streaming is complete.
*   ✅ **DO** always call `browser_scroll` before `browser_screenshot` to capture the full response area.
*   ✅ **DO** follow the `On Error` column exactly — use the Global Error Handling codes from Section 3.2.

**DONTs:**
*   🛑 **DO NOT** use generic placeholder screenshots. Every screenshot must be captured live.
*   🛑 **DO NOT** group AI responses into a single screenshot or citation block. Each platform is fully separated.
*   🛑 **DO NOT** read MCP tool schema files at runtime. All parameter signatures are in Section 3.1.
*   🛑 **DO NOT** guess selectors. Use the exact selectors in the step table, and the fallback chain in the `On Error` column.
*   🛑 **DO NOT** attempt to log into any platform. If login is required, STOP and ask the user (ERR-LOGIN).

---

### 🔍 Workflow 6: Website & Schema Compliance → Channel `website_schema`

#### 6A: Discover Website

| Step | Action | Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 1 | Search for clinic website | `search_web` | `{"query": "{CLINIC_NAME} {CITY} official website"}` | Fallback: `{"query": "{DOCTOR_NAME} {SPECIALTY} {CITY} website"}`. If no website found → `"Official Clinic Website Exists"` = `MISSING`. Skip to step 8. |
| 2 | Check GBP for website link | *From Workflow 1B data* | Review GBP content extracted in Workflow 1B for a website URL. | If GBP has no website → `"Website Linked from GBP"` = `MISSING`. |
| 3 | Determine website type | *Agent parsing* | A custom domain (e.g., `pravishahealthcare.com`) = full `VERIFIED`. A subdomain/landing page (e.g., `getmy.clinic`, `practo.com`) = `VERIFIED` with note about platform type. No website at all = `MISSING`. | Record the exact URL found. |

#### 6B: Inspect Website (only if website exists)

| Step | Action | MCP Tool | Parameters | On Error |
|:---:|:---|:---|:---|:---|
| 4 | Navigate to the website | `browser_navigate` | `{"url": "<discovered website URL>"}` | `→ ERR-NAVIGATE` |
| 5 | Dismiss overlays | `browser_dismiss_overlays` | `{"scope": "non_critical"}` | Ignore |
| 6 | Extract page HTML for schema check | `browser_get_page_content` | `{"format": "html"}` | `→ ERR-EMPTY` |
| 7 | Check for JSON-LD structured data | `browser_execute_script` | `{"code": "document.querySelector('script[type=\\\"application/ld+json\\\"]')?.textContent || 'No JSON-LD found'"}` | If script errors, search HTML from step 6 for `<script type="application/ld+json">` blocks manually. |
| 8 | Extract page text for trust signals | `browser_get_page_content` | `{"format": "text"}` | `→ ERR-EMPTY` |
| 9 | Take evidence screenshot | `browser_screenshot` | `{"path": "[OUTPUT_DIR]/website_proof.png"}` | If no website exists, navigate to Google search showing "no website found" and screenshot that instead. |

**Parsing (from steps 6-8):**

| Check | How to Verify | Points |
|:---|:---|:---|
| Official Clinic Website Exists | URL found in steps 1-3 | `VERIFIED` = 100 / `MISSING` = 0 |
| Website Linked from GBP | GBP data from Workflow 1B | `VERIFIED` = 100 / `MISSING` = 0 |
| MedicalBusiness JSON-LD Schema | Step 7 output contains `"MedicalBusiness"` | `VERIFIED` = 100 / `MISSING` = 0 |
| Dentist/Physician @type Schema | Step 7 output contains `"Dentist"` or `"Physician"` | `VERIFIED` = 100 / `MISSING` = 0 |
| NAP Address Consistency | Compare website address vs GBP (Workflow 1B) vs Bing (Workflow 2B) | `VERIFIED` = 100 / `CONFLICTING` = 50 / `MISSING` = 0 |
| NAP Phone Consistency | Compare website phone vs GBP vs Bing | `VERIFIED` = 100 / `CONFLICTING` = 50 / `MISSING` = 0 |
| Patient Testimonials on Website | Search page text for testimonial/review sections (>= 3 testimonials) | `VERIFIED` = 100 / `MISSING` = 0 |
| Video Content on Website/YouTube | Search HTML for `<video>`, YouTube `<iframe>` embeds, or search YouTube for clinic name | `VERIFIED` = 100 / `MISSING` = 0 |

**Scoring:**
- `visibility.score` = average of (Website Exists + Website Linked from GBP) points.
- `completeness.score` = average of (Schema checks + NAP checks) points.
- `sentiment.score` = apply Section 2.4.3 rubric.

---

## 📋 SECTION 5: PER-CHANNEL STEP-VERIFICATION CHECKLIST

Every report execution must generate a separate step-verification checklist file alongside the JSON report.

*   **File Path:** `[OUTPUT_DIR]/checklist.md`
*   **Structure:** Standard run checklists for Channels 1 to 6. Include individual check slots for ChatGPT, Gemini, Meta AI, and Grok AI screenshot capturing.

---

## 🚫 SECTION 6: STRICT OPERATIONAL DOs & DONTs MATRIX

### 🔴 GLOBAL OPERATIONAL DONTs
*   🛑 **NO PLACEHOLDERS OR SUBJECTIVITY:** Never use generic images. All visual proof screenshots must be captured live.
*   🛑 **NO ABSOLUTE FILE IMAGE PATHS:** Always use relative filename paths (e.g., `chatgpt_proof.png`) for report viewer compatibility.

### 🟢 GLOBAL OPERATIONAL DOs
*   ✅ **DO CAPTURE ALL 4 AI PROOFS:** Ensure `[OUTPUT_DIR]/chatgpt_proof.png`, `gemini_proof.png`, `meta_ai_proof.png`, and `grok_proof.png` are captured and indexed correctly.
*   ✅ **DO USE TEMPORARY DIRECTORY:** Use the temporary directory `reports/tmp` to save any intermediate or temporary files generated during the process.

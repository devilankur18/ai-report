
/goal Generate a json report for a doctor with follwoings details follwong the instructions below. dont read any exisitng files until explicity mentioned in the insturctions. FInd any gaps in pulling data for any channel. Report back it at the end. Dont make any plan or nonsense. Use only mcp tools menitoned below, dont write code. if some instruction is not clear stop there and ask right away, just stick to the workflow word by word and give me step by step update.

Dont fucking do anything on your own. No plans needed, just execute this below 

# DigiClinic AI Rank & SEO Report Generator Guide (Version 6)

This document is the master operational specification (Version 6) for the DigiClinic Digital Presence & AI Rank Analyzer. It is an **incremental upgrade of Version 5** with these key changes:

1.  **JSON Report Output:** The primary deliverable is now a structured JSON file (instead of Markdown) to power the interactive Report Viewer React application.
2.  **Progressive Client-Growth Scoring:** Search rank scoring uses linear interpolation between milestones (instead of simple tier-based 0/5/10 buckets) so doctors see granular progress as they climb ranks.
3.  **Per-Channel Sub-Category Breakdown:** Each channel is scored across sub-categories (Visibility, Completeness, Sentiment) for granular insight.
4.  **Per-Channel Checklists & DOs/DONTs:** Each channel has its own detailed checklist with steps, status, captures, notes, and its own operational rules for easy per-channel refinement.

All V5 workflows, search queries, MCP tool blueprints, and operational processes are **fully preserved and enhanced** in this document.

---

## 🗂️ SECTION 1: JSON REPORT SCHEMA SPECIFICATION

Every generated report must strictly conform to the following JSON schema. No fields may be added, rearranged, or removed unless explicitly specified in this guide.

### Output File Convention
*   **File Name:** `[doctor_slug]_report.json` or `[doctor_slug]_report_[YYYY-MM].json` for monthly tracking.
*   **Output Directory:** `reports/v6/`
*   **Screenshot Assets Directory:** `reports/v6/assets/`

### 1.1 Report Metadata

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

**Historical Runs:** If previous month reports exist in `reports/v6/`, read their `overall_score` to populate the array. If this is the first run, include only the current entry.

### 1.3 Channels Array

The `channels` array contains **exactly 6 channel objects** in this exact order. Each channel has sub-categories for granular scoring (see Section 2 for scoring rules).

### 1.4 Cross-Channel Standard Queries

The following **7 standard queries** must be executed for Google SEO and Bing SEO channels. These are the same queries from V5:

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
      "evidence_screenshot": "assets/[doctor_slug]_ai_standing_proof.png",
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
          "sentiment_positive": false
        },
        {
          "name": "Gemini",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "...",
          "credentials_cited": false,
          "sentiment_positive": false
        },
        {
          "name": "Meta AI",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "...",
          "credentials_cited": false,
          "sentiment_positive": false
        },
        {
          "name": "Grok AI",
          "standing": "Not Recommended",
          "recommended_rank": null,
          "points": 0,
          "citation": "...",
          "credentials_cited": false,
          "sentiment_positive": false
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
    { "pillar": "Medical Registration Indexing", "description": "Register on NMC national portal, ensure State Council registration is crawlable and linked from GBP and website JSON-LD." },
    { "pillar": "Schema Landing Page Setup", "description": "Create a dedicated clinic landing page at /[city]/[specialty]/[doctor_slug] with valid JSON-LD MedicalBusiness/Dentist schema including openingHours, geo, and review aggregates." },
    { "pillar": "Slot Booking Integration", "description": "Integrate online appointment booking via Practo, Justdial, or a custom form linked from GBP 'Book' button and website CTA." },
    { "pillar": "Review Velocity Engine", "description": "Implement a post-visit SMS/WhatsApp review request workflow targeting >= 5 reviews/month across Google and Practo to build social proof momentum." },
    { "pillar": "Video SEO", "description": "Publish 2-3 patient education or clinic tour videos on YouTube with optimized titles ([specialty] in [area], [city]) and embed on website for YouTube channel discoverability." }
  ],

  "visual_proof_index": [
    { "label": "Google Maps Proof", "path": "assets/[doctor_slug]_maps_proof.png", "description": "Google Maps listing and rank evidence." },
    { "label": "Bing Search & Maps Proof", "path": "assets/[doctor_slug]_bing_proof.png", "description": "Bing Search query and maps ranking." },
    { "label": "Medical Aggregator Proof", "path": "assets/[doctor_slug]_aggregators_proof.png", "description": "Justdial/Practo claimed status and reviews." },
    { "label": "Medical Registry E-E-A-T Proof", "path": "assets/[doctor_slug]_eeat_proof.png", "description": "Official National/State Council registration registry verification." },
    { "label": "Conversational AI Standing Proof", "path": "assets/[doctor_slug]_ai_standing_proof.png", "description": "Unified view of ChatGPT/Gemini prompt response showing recommendations." },
    { "label": "Website & Schema Proof", "path": "assets/[doctor_slug]_website_proof.png", "description": "Homepage screenshot or search result showing website is missing." }
  ]
}
```

---

## 🧭 SECTION 2: DETERMINISTIC SCORING ENGINE (V6 GRADING RUBRIC)

To guarantee 100% deterministic scoring that reflects actual progress as doctors climb ranks, the V6 engine uses a **progressive Client-Growth Scoring Formula** with linear interpolation between milestones, combined with **per-channel sub-category breakdown**.

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

*Example:* For Rank 5 (`r = 5`):
- It falls between Rank 3 ($R_1 = 3, S_1 = 88$) and Rank 10 ($R_2 = 10, S_2 = 53$).
- $\text{Points} = 88 + \frac{53 - 88}{10 - 3} \times (5 - 3) = 88 + \frac{-35}{7} \times 2 = 88 - 10 = 78$ points.

This allows the doctor to see measurable progress (e.g., moving from rank 50 to rank 25) even if they are not yet in the Top 10.

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
*   **Completeness (30%):** Average of `completeness_checks` points:
    *   GBP Listing Claimed: Claimed = 100, Unclaimed = 0.
    *   GBP Primary Category Correct: Correct = 100, Wrong = 0.
    *   Visual Assets: >= 3 photos = 100, 1-2 photos = 50, 0 photos = 0.
    *   Address matches other directories (character-by-character): Exact match = 100, Minor mismatch = 50, Major mismatch or missing = 0.
    *   Phone matches other directories: Match = 100, Mismatch = 0.
*   **Sentiment (20%):** Composite of Google Reviews:
    *   Review Volume & Rating: Rating >= 4.5★ AND >= 50 reviews = 100; Rating >= 4.0★ AND 10-49 reviews = 50; Rating < 4.0★ OR < 10 reviews = 0.
    *   Review Velocity: >= 5.0 reviews/month (last 60 days) = 100; 1.0–4.9 = 60; < 1.0 = 0.
    *   Narrative Success Stories: >= 3 detailed stories = 100; 1-2 = 60; 0 = 0.

#### Channel: `bing_seo` (Weight: 15%)
*   **Visibility (50%):** Average of interpolated points across all 7 standard queries on Bing Search & Maps.
*   **Completeness (30%):** Average of `completeness_checks` points:
    *   Bing Places Listing Active: Yes = 100, No = 0.
    *   Visual Assets on Bing: >= 3 = 100, 1-2 = 50, 0 = 0.
    *   Address Consistency with Google: Exact match = 100, Minor mismatch = 50, Missing = 0.
    *   Phone Consistency with Google: Match = 100, Mismatch = 0.
*   **Sentiment (20%):** Bing Reviews (same formula as Google Reviews).

#### Channel: `aggregators` (Weight: 15%)
*   **Visibility (50%):** Average of listing status and category ranking points:
    *   Justdial Listing: Claimed = 100, Unclaimed = 50, Not Found = 0.
    *   Practo Profile: Active = 100, Inactive = 50, Not Found = 0.
    *   Justdial Category Rank: Use progressive interpolation (same as search rank milestones).
    *   Practo Category Rank: Use progressive interpolation.
*   **Completeness (30%):** Average of profile completeness checks:
    *   Slot Booking Integration: Integrated = 100, Not Integrated = 0.
    *   Specialization tags listed: Complete = 100, Partial = 50, Missing = 0.
    *   Profile photo present: Yes = 100, No = 0.
*   **Sentiment (20%):** Aggregator Reviews (combined Practo + Justdial):
    *   Review Volume & Rating: Same formula as Google Reviews.
    *   Review Velocity: Same formula.
    *   Narrative Success Stories on platforms: Same formula.

#### Channel: `conversational_ai` (Weight: 15%)
*   **Visibility (50%):** Average across 4 AI platforms:
    *   Recommended in Top 3 = 100, Mentioned but not Top 3 = 50, Not Recommended = 0.
*   **Completeness (30%):** Average of citation quality across 4 platforms:
    *   Credentials cited correctly = 100, Partially cited = 50, Not cited = 0.
*   **Sentiment (20%):** Average of comparison favorability across 4 platforms:
    *   Positive comparison vs competitors = 100, Neutral = 50, Negative or absent = 0.

#### Channel: `eeat_credentials` (Weight: 15%)
*   **Visibility (50%):** Whether credentials are discoverable:
    *   State Council Registration found in live lookup = 100, Not found = 0.
    *   NMC National Registry found = 100, Not found = 0.
    *   Average of both.
*   **Completeness (30%):** Average of all credential checks:
    *   Years of Experience verified = 100, Not verified = 0.
    *   Education degrees verified = 100, Not verified = 0.
    *   CMO/Ayushman Bharat HFR registered = 100, Not registered = 0.
    *   Publications indexed = 100, None = 0.
    *   Professional associations (IDA/IMA) = 100, None = 0.
    *   Area of Expertise verified = 100, Not verified = 0.
*   **Sentiment (20%):** Professional reputation signals:
    *   Publications in indexed journals = 100, None = 0.
    *   Active IDA/IMA membership with CME credits = 100, None = 0.
    *   Average of both.

#### Channel: `website_schema` (Weight: 15%)
*   **Visibility (50%):** Website discoverability:
    *   Official website exists = 100, Does not exist = 0.
    *   Website linked from GBP = 100, Not linked = 0.
    *   Average of both.
*   **Completeness (30%):** Schema & NAP compliance (average of checks):
    *   Valid JSON-LD `MedicalBusiness` schema = 100, Malformed = 50, Missing = 0.
    *   Dentist/Physician `@type` present = 100, Missing = 0.
    *   NAP Address consistency (Website vs GBP vs Bing): Exact = 100, Minor = 50, Major = 0.
    *   NAP Phone consistency: Match = 100, Mismatch = 0.
*   **Sentiment (20%):** Website trust signals:
    *   Patient testimonials on website: >= 3 = 100, 1-2 = 50, 0 = 0.
    *   Video content (website or YouTube): >= 2 videos = 100, 1 = 50, 0 = 0.

### 2.4 Overall Score Calculation

$$\text{Overall Score} = \text{round}\left( \sum_{i=1}^{6} \frac{\text{Channel}_i\text{ Percentage Score}}{100} \times \text{Channel}_i\text{ Weight} \right)$$

**Channel Weights (must sum to 100):**

| Channel ID | Weight |
| :--- | :--- |
| `google_seo` | 25 |
| `bing_seo` | 15 |
| `aggregators` | 15 |
| `conversational_ai` | 15 |
| `eeat_credentials` | 15 |
| `website_schema` | 15 |

---

## 🛠️ SECTION 3: HYBRID SEARCH & BROWSER MCP TOOLING BLUEPRINT

To guarantee the highest report speed, lowest token overhead, and complete resilience against bot detection, the auditor uses a **hybrid search system** that divides tasks between **Semantic Search APIs** (`search_web`) and **Human-Emulated Browser Sessions** (`browser-mcp`).

### Core Tooling Rules

The agent must execute the following tools strictly under these rules:

1.  **`search_web`**: Use to instantly resolve search queries (Google/Bing site-restricted searches, registry portal URLs, conversational GEO queries) to get text content or target URLs. This is the fastest tool — use it for URL discovery and quick text lookups.
2.  **`mcp_browser-mcp_browser_navigate`**: Use to load targeted URLs directly. Reuses active tabs (`new_tab: false`) to prevent session and information leakage.
3.  **`mcp_browser-mcp_browser_fill`**: Use to input text strings into search inputs, database lookups, or form fields.
4.  **`mcp_browser-mcp_browser_click`**: Use to click buttons, submit forms, or navigate links.
5.  **`mcp_browser-mcp_browser_screenshot`**: Use to capture high-fidelity visual proof. Save directly to the target `reports/v6/assets/` directory.
6.  **`mcp_browser-mcp_browser_get_page_content`**: Use to extract DOM structure or raw text nodes for data parsing.
7.  **`mcp_browser-mcp_browser_wait_for_network`**: Call immediately after clicking submit buttons or search forms to ensure AJAX APIs and SPAs are fully rendered before scraping.
8.  **`mcp_browser-mcp_browser_solve_captcha`**: In the rare event a bot challenge appears on government registries or directory portals, run this tool with `action: "detect"` followed by `action: "click_checkbox"` to automatically bypass challenges.

---

## 🧭 SECTION 4: STEP-BY-STEP CHANNEL AUTOMATED WORKFLOWS

Each workflow corresponds to exactly one channel in the JSON output. Follow them in order. Each workflow includes its own **channel-level DOs & DONTs** in addition to the global rules in Section 6.

---

### 🗺️ Workflow 1: Google Maps Local SEO Auditing → Channel `google_seo`

#### Steps:
1.  Navigate `mcp_browser-mcp_browser_navigate` to `https://www.google.com`.
2.  For each of the **7 standard queries** (Section 1.4), search using `mcp_browser-mcp_browser_fill` + `mcp_browser-mcp_browser_click` (or Enter key submission):
    *   Note the doctor/clinic's exact position in **organic search results** and **Maps local pack**.
    *   Record the **Top 3 Competitor Names** appearing in the Maps pack.
    *   Calculate `points` using the **progressive interpolation** formula (Section 2.1).
3.  Check if the Google Business Profile (GBP) listing is **claimed** (look for "Suggest an edit" vs "Claim this business").
4.  Verify GBP primary category, photos count, and NAP details.
5.  Extract Google review count, average rating, and estimate review velocity (reviews in last 60 days).
6.  Count narrative success stories (detailed text reviews describing patient outcomes).
7.  Capture Google Maps ranking screenshot as `reports/v6/assets/[doctor_slug]_maps_proof.png` using `mcp_browser-mcp_browser_screenshot`.
8.  Populate all `queries`, `completeness_checks`, `sentiment_data`, and `sub_categories` in the `google_seo` channel object.

#### 🚦 Channel DOs & DONTs — Google SEO:
*   ✅ **DO** execute all 7 queries individually — do not batch or skip any.
*   ✅ **DO** scroll the Maps results to count beyond the initial 3-pack if the doctor is not in the top 3.
*   ✅ **DO** use `mcp_browser-mcp_browser_wait_for_network` after each search submission to ensure full rendering.
*   ✅ **DO** record the exact competitor names and their Maps profile links.
*   🛑 **DO NOT** assume Maps rank from organic search rank — they are separate result sets.
*   🛑 **DO NOT** count star ratings without opening the reviews section to verify the actual count.
*   🛑 **DO NOT** estimate review velocity without checking the dates of recent reviews.

---

### 🔍 Workflow 2: Bing Search & Maps Auditing → Channel `bing_seo`

#### Steps:
1.  Navigate `mcp_browser-mcp_browser_navigate` to `https://www.bing.com`.
2.  For each of the **7 standard queries**, search and record:
    *   Doctor/clinic's exact ranking in Bing Search results.
    *   Bing Maps local pack ranking (if present).
    *   **Top 3 Competitor Names** appearing in Bing Search local results.
    *   Calculate `points` using progressive interpolation.
3.  Check if a Bing Places listing is active and claimed.
4.  Verify photos, NAP details against Google data for consistency checks.
5.  Extract Bing review count and ratings.
6.  Capture Bing Maps/Search ranking proof screenshot as `reports/v6/assets/[doctor_slug]_bing_proof.png`.
7.  Populate all channel data for `bing_seo`.

#### 🚦 Channel DOs & DONTs — Bing SEO:
*   ✅ **DO** check Bing Maps separately from Bing web search — they return different result sets.
*   ✅ **DO** verify NAP against Google data character-by-character for consistency scoring.
*   ✅ **DO** note if Bing displays a local pack or only organic results for each query.
*   🛑 **DO NOT** skip Bing queries because Google data was already collected — Bing ranks independently.
*   🛑 **DO NOT** assume Bing Places data matches Google Business Profile data.

---

### 🩺 Workflow 3: Medical Aggregators Audit (Practo & Justdial) → Channel `aggregators`

#### Steps:
1.  Call `search_web` to locate Practo and Justdial profile URLs:
    *   `site:practo.com [Doctor Name] [city]`
    *   `site:justdial.com [Clinic Name] [city]`
    *   `site:justdial.com [Doctor Name] [city]`
2.  Navigate `mcp_browser-mcp_browser_navigate` to the discovered URLs.
3.  For each platform, audit:
    *   **Claimed profile status** (look for verification badges, "Claim this listing" prompts).
    *   **Category ranking** within the specialty for the area.
    *   **Appointment slot booking** availability (is a "Book Appointment" button present and functional?).
    *   **Reviews count**, average stars, and most recent review dates.
    *   **Profile completeness**: specialization tags, education, experience listed.
4.  Estimate review velocity (reviews in last 60 days).
5.  Count narrative success stories on each platform.
6.  Capture the Justdial/Practo claimed status and reviews screenshot as `reports/v6/assets/[doctor_slug]_aggregators_proof.png`.
7.  Populate all `metrics`, `sentiment_data`, and `sub_categories` in the `aggregators` channel object.

#### 🚦 Channel DOs & DONTs — Aggregators:
*   ✅ **DO** search for both Doctor Name AND Clinic Name on Justdial — listings may be under either.
*   ✅ **DO** check both Practo and Justdial even if one returns no results — score each independently.
*   ✅ **DO** use `mcp_browser-mcp_browser_get_page_content` to extract review counts from JavaScript-rendered pages.
*   ✅ **DO** verify whether the "Book Appointment" button is actually functional (not just a UI element).
*   🛑 **DO NOT** combine Practo and Justdial reviews into a single count — record them separately in `metrics`.
*   🛑 **DO NOT** skip slot booking verification — it is a distinct completeness metric.

---

### 🔬 Workflow 4: State Council E-E-A-T & Registration Credentials Verification → Channel `eeat_credentials`

#### Steps:
1.  Call `search_web` to locate the official search registry page for the specialty or state council:
    *   `[State Name] Dental Council search portal` (for dentists)
    *   `[State Name] Medical Council search portal` (for physicians)
    *   `NMC registry search page`
    *   `Ayushman Bharat HFR portal search`
2.  Navigate `mcp_browser-mcp_browser_navigate` directly to the registry lookup form.
3.  Input the doctor's full name using `mcp_browser-mcp_browser_fill` and execute the lookup with `mcp_browser-mcp_browser_click`.
4.  Call `mcp_browser-mcp_browser_wait_for_network` to ensure results are rendered.
5.  Extract from results: name, degrees, registration status, registration number, registration date, father's name or other verifiers.
6.  Search for CMO (Chief Medical Officer) clinic registrations:
    *   `search_web`: `[Doctor Name] CMO registration [city]`
    *   `search_web`: `Ayushman Bharat HFR [Clinic Name] [city]`
7.  Search for publications and professional memberships:
    *   `search_web`: `[Doctor Name] [specialty] publications` or `[Doctor Name] IDA member`
8.  Verify area of expertise by cross-referencing specializations listed on GBP, Practo, and Justdial.
9.  Capture registry proof screenshot as `reports/v6/assets/[doctor_slug]_eeat_proof.png`.
10. Populate all `checks` and `sub_categories` in the `eeat_credentials` channel object.

#### 🚦 Channel DOs & DONTs — E-E-A-T:
*   ✅ **DO** attempt BOTH state council AND NMC national registry lookups — they are independent registrations.
*   ✅ **DO** use `mcp_browser-mcp_browser_solve_captcha` if government registry portals present CAPTCHA challenges.
*   ✅ **DO** calculate years of experience from the council registration date, not from profile claims.
*   ✅ **DO** record the exact registration number and date for the JSON report.
*   🛑 **DO NOT** assume a doctor is unregistered if the first lookup fails — try alternate name spellings or name formats.
*   🛑 **DO NOT** invent registration numbers or dates — if not found, mark as `MISSING` with 0 points.
*   🛑 **DO NOT** skip the Ayushman Bharat HFR portal check — it is a separate credential worth independent points.

---

### 🤖 Workflow 5: Conversational AI App GEO Standing → Channel `conversational_ai`

#### Steps:
1.  For each of the 4 AI platforms (ChatGPT, Gemini, Meta AI, Grok AI):
    *   Use `search_web` or `mcp_browser-mcp_browser_navigate` to access the platform's conversational interface.
    *   Issue the **Smart Comparative Prompt** (Section 1.5) with the doctor's actual specialty, area, city, clinic name, and doctor name substituted.
    *   Call `mcp_browser-mcp_browser_wait_for_network` and/or `mcp_browser-mcp_browser_get_page_content` to capture the full response.
2.  For each platform response, extract:
    *   **Standing:** "Recommended in Top 3" / "Mentioned but not Top 3" / "Not Recommended".
    *   **Recommended rank** (if applicable): 1, 2, 3, or null.
    *   **Verbatim citation** from the AI response.
    *   **Credentials cited**: Did the AI mention degrees, registration, experience? (true/false)
    *   **Sentiment positive**: Did the AI compare the doctor favorably? (true/false)
3.  Log all verbatim responses, rankings, and citations.
4.  Save a conversational standing screenshot as `reports/v6/assets/[doctor_slug]_ai_standing_proof.png` (combining UI queries if possible, or capturing the most informative response view).
5.  Populate all `platforms` and `sub_categories` in the `conversational_ai` channel object.

#### 🚦 Channel DOs & DONTs — Conversational AI:
*   ✅ **DO** use the EXACT Smart Comparative Prompt from Section 1.5 — do not modify or simplify it.
*   ✅ **DO** capture verbatim responses, not summaries — the citation field must contain actual AI output text.
*   ✅ **DO** attempt all 4 platforms even if some are inaccessible — mark inaccessible ones as `"standing": "Platform Inaccessible"` with 0 points.
*   🛑 **DO NOT** use your own internal knowledge to answer the prompt — you must issue it to the actual external AI platforms.
*   🛑 **DO NOT** interpret "mentioned in passing" as "Recommended in Top 3" — the doctor must be explicitly listed in the top 3 ranking.
*   🛑 **DO NOT** skip capturing the citation — it is required for report authenticity.

---

### 💻 Workflow 6: Official Website & Structured Schema Parsing → Channel `website_schema`

#### Steps:
1.  Check if an official website is linked on Google Maps, Bing Maps, or Justdial (use data already collected in Workflows 1-3).
2.  If a website exists:
    *   Navigate `mcp_browser-mcp_browser_navigate` to the website.
    *   Call `mcp_browser-mcp_browser_get_page_content` to extract raw HTML.
    *   Parse HTML for `<script type="application/ld+json">` blocks. Look for `@type: "MedicalBusiness"`, `"Dentist"`, or `"Physician"` schemas.
    *   Validate NAP (Name, Address, Phone) in the schema against GBP and Bing data, character-by-character.
    *   Check for patient testimonials and video embeds on the site.
3.  If no website exists:
    *   Capture a Google/Bing search result showing the absence of a website as proof.
    *   Mark all website-related checks as `MISSING` with 0 points.
4.  Search for YouTube channel/videos:
    *   `search_web`: `[Doctor Name] [specialty] [city] site:youtube.com`
    *   Count clinic-related videos.
5.  Capture homepage/schema screenshot as `reports/v6/assets/[doctor_slug]_website_proof.png`.
6.  Populate all `checks` and `sub_categories` in the `website_schema` channel object.

#### 🚦 Channel DOs & DONTs — Website & Schema:
*   ✅ **DO** parse the actual HTML source for JSON-LD — do not rely on visual inspection of the page.
*   ✅ **DO** validate schema against https://schema.org/MedicalBusiness specifications.
*   ✅ **DO** check both the homepage and any `/about` or `/doctor` sub-pages for schema markup.
*   ✅ **DO** verify that the website URL on GBP actually resolves (is not a dead link).
*   🛑 **DO NOT** assume a website exists without verifying the URL resolves to a live page.
*   🛑 **DO NOT** count generic social media pages (Facebook/Instagram) as an "official website" — it must be a dedicated clinic domain.
*   🛑 **DO NOT** skip YouTube search — video content is a separate trust signal in this channel.

---

## 📋 SECTION 5: PER-CHANNEL STEP-VERIFICATION CHECKLIST

Every report execution must generate a separate step-verification checklist file alongside the JSON report.

*   **File Path:** `reports/v6/[doctor_slug]_run_checklist.md`
*   **Structure:** One top-level section per channel, with detailed sub-fields for each step.

```markdown
# DIGICLINIC AUDIT STEP VERIFICATION RUN LOG (VERSION 6)
**Audited Practitioner:** Dr. [Full Name]
**Clinic Name:** [Clinic Name]
**Run Timestamp:** [ISO Timestamp]
**Browser Session ID:** [Session UUID or Hash based on Doctor Name & Date]

---

## 📋 CHANNEL 1: Google Search & Maps (`google_seo`)

- [ ] STEP 1.1: Navigate to google.com
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `mcp_browser-mcp_browser_navigate`
  - Notes: [e.g., Page loaded successfully]

- [ ] STEP 1.2: Execute 7 standard search queries
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Queries Completed: [7/7]
  - Tools Used: `mcp_browser-mcp_browser_fill`, `mcp_browser-mcp_browser_click`, `mcp_browser-mcp_browser_wait_for_network`
  - Notes: [e.g., All queries returned results, Maps pack present for 5/7 queries]

- [ ] STEP 1.3: Verify GBP claimed status and profile details
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tools Used: `mcp_browser-mcp_browser_get_page_content`
  - Notes: [e.g., GBP claimed, primary category "Dentist", 2 photos]

- [ ] STEP 1.4: Extract Google reviews and sentiment data
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Notes: [e.g., 47 reviews, 4.6★ avg, 3 reviews in last 60 days]

- [ ] STEP 1.5: Capture maps proof screenshot
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Capture Saved: `reports/v6/assets/[doctor_slug]_maps_proof.png`
  - Tools Used: `mcp_browser-mcp_browser_screenshot`

- [ ] STEP 1.6: Populate google_seo channel JSON
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Sub-Category Scores: Visibility=[X], Completeness=[X], Sentiment=[X]
  - Channel Score: [X]%

### Channel 1 Issues & Notes:
- [Document any selector changes, CAPTCHA occurrences, or rendering issues]

---

## 📋 CHANNEL 2: Bing Search & Maps (`bing_seo`)

- [ ] STEP 2.1: Navigate to bing.com
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `mcp_browser-mcp_browser_navigate`
  - Notes: [...]

- [ ] STEP 2.2: Execute 7 standard search queries
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Queries Completed: [7/7]
  - Tools Used: `mcp_browser-mcp_browser_fill`, `mcp_browser-mcp_browser_click`, `mcp_browser-mcp_browser_wait_for_network`
  - Notes: [...]

- [ ] STEP 2.3: Verify Bing Places listing and NAP consistency
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Notes: [...]

- [ ] STEP 2.4: Extract Bing reviews and sentiment data
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Notes: [...]

- [ ] STEP 2.5: Capture Bing proof screenshot
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Capture Saved: `reports/v6/assets/[doctor_slug]_bing_proof.png`

- [ ] STEP 2.6: Populate bing_seo channel JSON
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Sub-Category Scores: Visibility=[X], Completeness=[X], Sentiment=[X]
  - Channel Score: [X]%

### Channel 2 Issues & Notes:
- [...]

---

## 📋 CHANNEL 3: Medical Aggregators (`aggregators`)

- [ ] STEP 3.1: Discover Practo and Justdial profile URLs via search_web
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `search_web`
  - Practo URL: [URL or "Not Found"]
  - Justdial URL: [URL or "Not Found"]
  - Notes: [...]

- [ ] STEP 3.2: Navigate to discovered profiles and audit
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tools Used: `mcp_browser-mcp_browser_navigate`, `mcp_browser-mcp_browser_get_page_content`
  - Notes: [e.g., Justdial claimed, Practo not found]

- [ ] STEP 3.3: Verify slot booking availability
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Notes: [e.g., No "Book Appointment" button on either platform]

- [ ] STEP 3.4: Extract reviews and sentiment data from each platform
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Notes: [e.g., Justdial: 23 reviews, 4.3★; Practo: N/A]

- [ ] STEP 3.5: Capture aggregators proof screenshot
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Capture Saved: `reports/v6/assets/[doctor_slug]_aggregators_proof.png`

- [ ] STEP 3.6: Populate aggregators channel JSON
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Sub-Category Scores: Visibility=[X], Completeness=[X], Sentiment=[X]
  - Channel Score: [X]%

### Channel 3 Issues & Notes:
- [...]

---

## 📋 CHANNEL 4: E-E-A-T & Credentials (`eeat_credentials`)

- [ ] STEP 4.1: Discover registry portal URLs via search_web
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `search_web`
  - State Council URL: [URL]
  - NMC URL: [URL]
  - Notes: [...]

- [ ] STEP 4.2: Navigate to registry and perform lookup
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tools Used: `mcp_browser-mcp_browser_navigate`, `mcp_browser-mcp_browser_fill`, `mcp_browser-mcp_browser_click`, `mcp_browser-mcp_browser_wait_for_network`
  - Notes: [e.g., UP Dental Council registry active registration found]

- [ ] STEP 4.3: Extract registration details
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Registration Number: [...]
  - Registration Date: [...]
  - Degrees: [...]
  - Notes: [...]

- [ ] STEP 4.4: Search for CMO/Ayushman Bharat HFR registration
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `search_web`
  - Notes: [...]

- [ ] STEP 4.5: Search for publications and professional memberships
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `search_web`
  - Notes: [...]

- [ ] STEP 4.6: Handle CAPTCHA if encountered
  - Status: [SUCCESS / FAILED / SKIPPED / N/A]
  - Tool Used: `mcp_browser-mcp_browser_solve_captcha`
  - Notes: [...]

- [ ] STEP 4.7: Capture E-E-A-T proof screenshot
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Capture Saved: `reports/v6/assets/[doctor_slug]_eeat_proof.png`

- [ ] STEP 4.8: Populate eeat_credentials channel JSON
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Sub-Category Scores: Visibility=[X], Completeness=[X], Sentiment=[X]
  - Channel Score: [X]%

### Channel 4 Issues & Notes:
- [...]

---

## 📋 CHANNEL 5: Conversational AI Standing (`conversational_ai`)

- [ ] STEP 5.1: Query ChatGPT with Smart Comparative Prompt
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tools Used: `search_web` or `mcp_browser-mcp_browser_navigate`
  - Standing: [Recommended / Mentioned / Not Recommended / Platform Inaccessible]
  - Notes: [...]

- [ ] STEP 5.2: Query Gemini with Smart Comparative Prompt
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Standing: [...]
  - Notes: [...]

- [ ] STEP 5.3: Query Meta AI with Smart Comparative Prompt
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Standing: [...]
  - Notes: [...]

- [ ] STEP 5.4: Query Grok AI with Smart Comparative Prompt
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Standing: [...]
  - Notes: [...]

- [ ] STEP 5.5: Capture conversational AI proof screenshot
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Capture Saved: `reports/v6/assets/[doctor_slug]_ai_standing_proof.png`

- [ ] STEP 5.6: Populate conversational_ai channel JSON
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Sub-Category Scores: Visibility=[X], Completeness=[X], Sentiment=[X]
  - Channel Score: [X]%

### Channel 5 Issues & Notes:
- [...]

---

## 📋 CHANNEL 6: Website & Schema Compliance (`website_schema`)

- [ ] STEP 6.1: Check if official website is linked from GBP/Bing/Justdial
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Website URL: [URL or "Not Found"]
  - Notes: [...]

- [ ] STEP 6.2: Navigate to website and extract HTML
  - Status: [SUCCESS / FAILED / SKIPPED / N/A (no website)]
  - Tools Used: `mcp_browser-mcp_browser_navigate`, `mcp_browser-mcp_browser_get_page_content`
  - Notes: [...]

- [ ] STEP 6.3: Parse JSON-LD schema from HTML source
  - Status: [SUCCESS / FAILED / SKIPPED / N/A]
  - Schema @type found: [MedicalBusiness / Dentist / Physician / None]
  - Notes: [...]

- [ ] STEP 6.4: Validate NAP in schema vs GBP/Bing data
  - Status: [SUCCESS / FAILED / SKIPPED / N/A]
  - Address Match: [Exact / Minor Mismatch / Major Mismatch]
  - Phone Match: [Match / Mismatch]
  - Notes: [...]

- [ ] STEP 6.5: Check for patient testimonials and video content
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Testimonials Found: [count]
  - Videos Found: [count]
  - Notes: [...]

- [ ] STEP 6.6: Search YouTube for clinic videos
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Tool Used: `search_web`
  - Videos Found: [count]
  - Notes: [...]

- [ ] STEP 6.7: Capture website proof screenshot
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Capture Saved: `reports/v6/assets/[doctor_slug]_website_proof.png`

- [ ] STEP 6.8: Populate website_schema channel JSON
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Sub-Category Scores: Visibility=[X], Completeness=[X], Sentiment=[X]
  - Channel Score: [X]%

### Channel 6 Issues & Notes:
- [...]

---

## 📝 TECHNICAL EXECUTION RUN LOG & ISSUES ENCOUNTERED
- [Document any site structural changes, selectors that had to be dynamically adapted, API delays, or CAPTCHA occurrences]

## 💡 SCOPE OF IMPROVEMENT / RECOMMENDATIONS FOR FUTURE GUIDE VERSIONS
- [Provide technical feedback, e.g., "Add Lybrate parsing selectors", "Integrate JSON-LD schema validators in Workflow 6", "Refine review sorting metrics"]
```

---

## 🚫 SECTION 6: STRICT OPERATIONAL DOs & DONTs MATRIX

### 🔴 GLOBAL OPERATIONAL DONTs

*   🛑 **NO INFORMATION LEAKAGE:** You **MUST NOT** read previously generated doctor reports (e.g., `reports/v5/*.md`, `reports/v6/*.json`, or any other version) to perform an audit for a new doctor. This is a strict operational firewall. Each report must be generated from fresh, live data only. The ONLY exception is reading previous `overall_score` values from prior V6 JSON reports for the **same doctor** to populate `historical_runs`.
*   🛑 **NO DATA HALLUCINATION:** Never invent medical credentials, state registrations, ratings, or phone numbers. If a detail cannot be verified through live browser queries, mark it as the appropriate status (`MISSING` or `CONFLICTING`) and score it exactly as **0** under the scoring engine.
*   🛑 **NO PLACEHOLDERS OR SUBJECTIVITY:** Do not place filler values or round up scores. Do not use generic images or generate screenshots using the AI image generation tool (`generate_image`). Every screenshot MUST be captured directly using the Browser MCP on the live browser tab to guarantee absolute authenticity.
*   🛑 **NO CHECKLIST OMISSION:** Do not skip creating the companion `[doctor_slug]_run_checklist.md` execution file. It is a mandatory audit deliverable generated alongside every JSON report.
*   🛑 **NO ABSOLUTE FILE IMAGE PATHS:** Do not use absolute paths starting with `file:///` for screenshot references in the JSON report. Always use relative paths (e.g., `assets/[doctor_slug]_maps_proof.png`) so the React Report Viewer can resolve and render them correctly.
*   🛑 **NO SCORE MANIPULATION:** Do not manually adjust or "gut feel" any score. Every point must be traceable to a specific rule in the scoring engine (Section 2). If the data doesn't meet the threshold, the score is 0 — no exceptions.
*   🛑 **DETERMINISTIC RUN TRACKING:** File names should support temporal tracking. Use date-suffixed names (e.g., `dr_vishal_maurya_report_2026-05.json`) to retain monthly records without overwriting.

### 🟢 GLOBAL OPERATIONAL DOs

*   ✅ **DO CAPTURE PROOF FOR EVERY CHANNEL:** Each of the 6 channels must have its own proof screenshot saved in `reports/v6/assets/`. The `evidence_screenshot` field in each channel object must point to the correct relative path.
*   ✅ **DO COMPILE VISUAL PROOF INDEX:** Populate the `visual_proof_index` array in the JSON output with all captured assets and their descriptions.
*   ✅ **DO DOUBLE-CHECK THE SCORING MATH:** Manual addition errors are unacceptable. Verify: (1) each sub-category score is correctly calculated from its data points, (2) each channel percentage score correctly applies the 50/30/20 weights, (3) the overall score correctly applies channel weights. Cross-check all arithmetic.
*   ✅ **DO UNIFY NAP EXPLICITLY:** Compare name, address, and phone details **character-by-character** across Google, Bing, Justdial, Practo, and website to identify conflicts. Record all conflicts in the relevant `completeness_checks`.
*   ✅ **DO POPULATE THE COMPETITOR CALLOUT:** Identify the primary local competitor dominating search volume and populate the `competitor_callout` object with their name, estimated market capture, and the reasons for their dominance.
*   ✅ **DO POPULATE ALL 6 TREATMENT PLAN PILLARS:** The `treatment_plan` array must contain all 6 pillars with actionable, specific implementation instructions.

---

## 🛠️ SECTION 7: SCHEMA EXTENSION & SYSTEM COMPLIANCE

*   **Flat Local SEO URLs:** Generated report URLs must strictly follow the routing architecture `/[city]/[specialty]/[doctor_slug]` with no state or provincial segments.
*   **Parallel Backend Modularity:** All channel data collection and scraping modules must reside parallel to `src/` inside `supabase/functions/scrapers`.
*   **Deterministic Calibration:** If the data schema is extended in the future, the scoring value must be represented by a binary (1/0), count-based, or interpolation-based formula to keep calculations 100% reproducible. No subjective or partial-credit scoring is ever permitted.
*   **React Report Viewer Integration:** The Report Viewer application resides in the `report-viewer/` directory under the nested route `/report`. It consumes the V6 JSON format to present interactive circular score charts, per-channel breakdowns, rank tables, proof galleries, historical timelines, and download formats (PDF, Markdown).
*   **Patient Footfall Verification:** Verified review velocity proxy (reviews/month calculated over last 60 days) and slot-booking integration status are recorded per-channel in `sentiment_data` and `completeness_checks` respectively.

# DigiClinic AI Rank & SEO Report Generator Guide (Version 3)

This document is the master operational specification (Version 3) for the DigiClinic Digital Presence & AI Rank Analyzer. It enforces a **100% deterministic scoring engine**, **visual proof capture standards using Browser MCP**, and a **rigid structural schema** so that any two runs for the same doctor yield identical data, and all reports across 1,000s of doctors maintain identical file structures.

---

## 🗂️ SECTION 1: SCHEMATIC SPECIFICATION FOR REPORT SECTIONS

Every generated report must strictly contain the following sections in this exact order, using the specified formatting and data schemas. No sections may be added or removed.

### 1. Header Metadata Section
*   **Fields required:**
    *   `Prepared for:` Dr. [Full Name]
    *   `Practice Specialty:` [Specialties, comma-separated]
    *   `Clinic Name:` [Clinic Name]
    *   `Location:` [Street, Area, City, State]
    *   `Last Verified Activity:` [Date / Description of the last online action]
*   **Format:** Plain text key-value block with standard bold markup.

### 2. Consolidated Rank & Summary Card
*   **Fields required:**
    *   `Overall Score:` [Score/100] (calculated using Section 2 formulas)
    *   `Discoverability Tier:` [EXCELLENT (>=80) / GOOD (60-79) / MODERATE (40-59) / WEAK (<40)]
    *   `Diagnostic Summary:` A highly focused paragraph highlighting core gaps.
*   **Format:** Standard Markdown border structure (double-column style using layout blocks or quote blocks).

### 3. Search Query Matrix
*   **Queries to execute:**
    1.  `top [specialty] in [city]`
    2.  `top [specialty] in [area]`
    3.  `best [specialty] in [city]`
    4.  `best [specialty] in [area]`
    5.  `best [specialty] for kids in [city]`
    6.  `best [specialty] for females in [city]`
    7.  `[Clinic Name] [city]`
*   **Format:** A strict 6-column Markdown table:
    `| Search Query | Google Search | Google Maps | Practo/Justdial | YouTube | AI Apps (Predictive) |`

### 4. Enrichment Audit & Gap Details (The Verification Schema)
Every entity details section must list specific items with the status **🟢 VERIFIED**, **🔴 MISSING**, or **🟡 CONFLICTING**, followed by a text explanation.
*   **Clinic Details (3 items):** Address consistency, Phone consistency, Visual asset count.
*   **Doctor Details (4 items):** Degrees/Experience, State/NMC Medical Registration, Articles/Publications, Professional Memberships.
*   **Patient Sentiment (4 items):** Aggregated reviews, Patient footfall proxy, Success stories count, YouTube testimonial count.

### 5. Visual Proof Index
*   **Requirements:** Must reference the captured browser screenshots verifying the doctor's website, registration status, or local search pack status.
*   **Format:** Standard Markdown image link referencing `reports/v3/assets/[doctor_slug]_proof.png` with a brief description.

### 6. Actionable 6-Pillar Treatment Plan
*   **Required Pillars:** Name/NAP Unification, Medical Registration indexing, Schema Landing Page setup, Slot Booking integration, Review Velocity engine, Video SEO.
*   **Format:** Numbered list with bold headings and 2-sentence implementation instructions for each.

---

## 🧭 SECTION 2: DETERMINISTIC SCORING ENGINE (GRADING RUBRIC)

To guarantee that generating a report for the same doctor on the same day always returns the exact same score, all scores must be calculated using this strict, binary or count-based grading rubric:

### 1. Visibility Index (30 Points Max)
*   **Google Maps Ranking (15 pts):**
    *   Ranks in Top 3 for `best [specialty] in [area]`: **15 pts**
    *   Ranks #4 to #10: **10 pts**
    *   Ranks >#10 or missing: **0 pts**
*   **Aggregator / Justdial Ranking (15 pts):**
    *   Ranks in Top 3 on Practo/Justdial for `[specialty] in [area]`: **15 pts**
    *   Ranks #4 to #10: **10 pts**
    *   Ranks >#10 or missing: **0 pts**

### 2. Completeness Index (30 Points Max)
*   **NAP Clinic Consistency (15 pts):**
    *   Address matches on Google Maps, Practo, and Website: **5 pts**
    *   Phone number matches and is active across listings: **5 pts**
    *   Visual assets present (>= 3 photos on maps/directories): **5 pts**
*   **EEAT Doctor Credentials (15 pts):**
    *   Degrees listed and matching specialty: **5 pts**
    *   Verifiable National Medical Commission (NMC)/State Council number listed: **5 pts**
    *   Active association memberships (e.g. IDA, IMA) listed: **5 pts**

### 3. Patient Sentiment Index (20 Points Max)
*   **Review Volume & Sentiment (10 pts):**
    *   Aggregate star rating >= 4.5★ AND >= 50 reviews: **10 pts**
    *   Aggregate star rating >= 4.0★ AND 10-49 reviews: **5 pts**
    *   Aggregate star rating < 4.0★ or < 10 reviews: **0 pts**
*   **Success Stories / Case Studies (10 pts):**
    *   At least 2 detailed patient success stories or text-based case studies: **10 pts**
    *   1 detailed story/case study: **5 pts**
    *   0 success stories: **0 pts**

### 4. GEO (Generative AI Optimization) Index (20 Points Max)
*   **LLM Recommendation Standing (10 pts):**
    *   Doctor AND Clinic name recommended in Top 3 Gemini/ChatGPT area queries: **10 pts**
    *   Doctor OR Clinic recommended but not in Top 3: **5 pts**
    *   Not recommended/cannot verify: **0 pts**
*   **Structured Schema Data (10 pts):**
    *   Website has active, valid JSON-LD `MedicalBusiness` or `Physician` schema: **10 pts**
    *   Website exists but lacks schema markup: **5 pts**
    *   No website exists: **0 pts**

---

## 🛠️ SECTION 3: BROWSER MCP AUTOMATION CAPTURE PROTOCOL

When compiling visual proof, the auditor must execute these steps to ensure uniform evidence gathering:

1.  **Launch DevTools Session:**
    *   Call `mcp_chrome-devtools-mcp_navigate_page` to go to the doctor's official clinic website or their primary Google Local Business listing.
2.  **Inspect Text Node Structure:**
    *   Call `mcp_chrome-devtools-mcp_take_snapshot` to extract text content, verifying clinical degrees and the registration number.
3.  **Capture Proof Screenshot:**
    *   Call `mcp_chrome-devtools-mcp_take_screenshot` to capture the page viewport showing verified details.
4.  **Save in Structured Workspace Path:**
    *   Save screenshots in `reports/v3/assets/` under the file name `[doctor_slug]_proof.png`. If the screenshot is captured in a temporary system directory, use a terminal copy command to move it into the structured workspace folder.

---

## 📁 SECTION 4: REUSABLE SCHEMA EXTENSION
The data schema can be extended by adding new columns to the search query matrix or adding new rows under the E-E-A-T details. However, any extension **must** define a strict, binary score value to keep calculations 100% deterministic and reproducible across multiple runs.

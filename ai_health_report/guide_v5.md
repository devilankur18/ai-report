# DigiClinic AI Rank & SEO Report Generator Guide (Version 5)

This document is the master operational specification (Version 5) for the DigiClinic Digital Presence & AI Rank Analyzer. It establishes a **100% deterministic scoring engine**, transitions core evidence-gathering entirely to **Browser MCP** (resolving anti-bot CAPTCHAs, search blockages, and interactive rendering limitations), implements **6 highly granular, step-by-step channel workflows** (including Google, Bing, and major AI conversational apps), and enforces a **rigid Operational DOs & DONTs Matrix** (including a strict Information Leakage Isolation Rule) to guarantee high-integrity, completely fresh digital presence reports.

---

## 🗂️ SECTION 1: SCHEMATIC SPECIFICATION FOR REPORT SECTIONS

Every generated report must strictly contain the following sections in this exact order, using the specified formatting and data schemas. No sections may be added, rearranged, or removed.

### 1. Header Metadata Section
*   **Required Input Fields (Simple & Minimal):**
    *   `Prepared for:` Dr. [Full Name]
    *   `Practice Specialty:` [Specialty]
    *   `Location:` [Area], [City]
    *   `Clinic Name:` [Clinic Name] (Optional - if missing, agent must search maps or directories using doctor name and location to discover it)
*   **Enriched Fields (Agent Auto-Discovered & Verified):**
    *   `Discovered Clinic Address:` [Street Address, Area, City, State, ZIP]
    *   `Primary Discovered Phone:` [Contact number formatted as +91 XXXXX XXXXX]
    *   `State Council Registration:` Council Name: [State Council], Registration Number: [Reg No], Date: [DD/MM/YYYY]
    *   `Last Verified Activity Date:` [Current Audit Date / Description of the last online action discovered, e.g., reply to Justdial review on 19 May 2026]
*   **Format:** Plain text key-value block with standard bold markup.

### 2. Consolidated Rank & Summary Card
*   **Required Fields:**
    *   `Overall Score:` [Score/100] (calculated using Section 3 formulas)
    *   `Discoverability Tier:` [EXCELLENT (>=80) / GOOD (60-79) / MODERATE (40-59) / WEAK (<40)]
    *   `Diagnostic Summary:` A highly focused, 2-3 sentence paragraph summarizing strengths, core technical gaps (e.g., missing schema, unclaimed profiles, wrong GBP primary categories), and local competitive standing.
*   **Format:** Standard Markdown quote block or layout block with a rating emoji (`🟢` for Excellent, `🟡` for Good/Moderate, `🔴` for Weak).

### 3. Cross-Channel Search Query Matrix (V5 Schema)
*   **Queries to execute:**
    1.  `top [specialty] in [city]`
    2.  `top [specialty] in [area]`
    3.  `best [specialty] in [city]`
    4.  `best [specialty] in [area]`
    5.  `best [specialty] for kids in [city]`
    6.  `best [specialty] for females in [city]`
    7.  `[Clinic Name] [city]` (or `[Doctor Name] [city]` if no clinic name)
*   **Format:** A strict 7-column Markdown table representing ranks AND naming the **Top 3 Competitor Names** in each cell for direct comparisons.
*   **Columns:**
    `| Search Query | Google Search (Rank & Top 3) | Google Maps (Rank & Top 3) | Bing Search (Rank & Top 3) | Practo (Rank & Top 3) | Justdial (Rank & Top 3) | YouTube (Rank & Top 3) |`
*   **Cell Content Structure:** Display the doctor's ranking position, followed by the top 3 competitor names in brackets:
    *   *Example:* `#1 (1. Self, 2. Swastika Dental, 3. Dental Care)` or `Unranked (1. Swastika Dental, 2. Apex Dental, 3. Shanti Dental)`
*   **Competitor Callout:** Immediately below the table, include a `> [!WARNING]` alert detailing the primary local competitor dominating the search volume in the micro-market, specifying their name and estimated market capture percentage due to their SEO setup.
*   **Inline Evidence:** Embed the Maps & GBP search ranking screenshot (`reports/v5/assets/[doctor_slug]_maps_proof.png`) immediately below this section to provide immediate visual proof of the ranking claims.

### 4. Dedicated AI App Conversational Standing (Non-Search GEO)
*   **Objective:** Audit the doctor/clinic recommendations on purely conversational, non-search AI applications.
*   **Platforms Audited:** **ChatGPT**, **Gemini**, **Meta AI**, and **Grok AI**.
*   **The Smart Comparative Prompt:**
    The agent must issue this exact prompt to the models (simulating conversational queries) and capture their rankings:
    > *"You are a local health advisor. Recommend the top [specialty] in [area], [city]. Compare their verified credentials (education, council registration, experience), review ratings, and patient sentiment. List them in a ranked table with reasons for their rank. Check if [Clinic Name] or [Doctor Name] is recommended and compare them with the top 3."*
*   **Format:** A strict 3-column Markdown table:
    `| AI Platform | Recommendation Standing | Verbatim Citation / Ranking Context |`
*   **Inline Evidence:** Embed the captured conversational proof screenshot (`reports/v5/assets/[doctor_slug]_ai_standing_proof.png`) immediately below this section.

### 5. Enrichment Audit & Gap Details (The Verification Schema)
Every entity details section must list specific items with the status **🟢 VERIFIED**, **🔴 MISSING**, or **🟡 CONFLICTING**, followed by a clear text explanation.

*   **Clinic Details (3 items):**
    *   `Location/Address Consistency:` Compare Google Business Profile, Bing Maps, Justdial, and official website character-by-character.
    *   `Phone Consistency:` Compare active primary numbers across all directories.
    *   `Visual Asset Count:` Count and verify clinic/staff photos across Google/Bing listings (target: >=3 photos).
*   **Doctor Details (6 items - The Expert Schema):**
    *   `Verified Years of Experience:` Calculated from graduation year/council registration year.
    *   `CMO/Ayushman Bharat Registration:` Search and verify local chief medical officer registration or Ayushman Bharat health facility registry status.
    *   `Verified Area of Expertise:` Audit specialized procedures listed (e.g. root canals, orthodontics).
    *   `Verified Education:` Degrees (BDS, MDS, MBBS, etc.) and college registration details.
    *   `Publications:` List of indexed papers, case study articles, or clinical write-ups.
    *   `Groups/Associations:` active professional memberships (e.g., IDA, IMA).
    *   *Inline Evidence:* Embed the council medical registry lookup screenshot (`reports/v5/assets/[doctor_slug]_eeat_proof.png`) directly under this section.
*   **Patient Sentiment (3 items):**
    *   `Narrative Success Stories:` Count of detailed patient case descriptions or text reviews detailing patient outcomes on profiles or websites.
    *   `Verified Patient Footfall Proxy:` Review Velocity (reviews/month calculated over the last 60 days).
    *   `Verified Patient Reviews:` Combined review volume and average ratings across Google, Bing, Practo, and Justdial.

### 6. Visual Proof Index
*   **Requirements:** Compile and link all captured browser screenshots verifying each audited digital channel, ensuring complete visual traceability.
*   **Format:** Standard Markdown image links with descriptive figure captions.
*   **Required Proof Assets (Strictly 5 assets):**
    1.  `![Google Maps Proof](assets/[doctor_slug]_maps_proof.png)` - Google Maps listing and rank evidence.
    2.  `![Bing Search & Maps Proof](assets/[doctor_slug]_bing_proof.png)` - Bing Search query and maps ranking.
    3.  `![Medical Aggregator Proof](assets/[doctor_slug]_aggregators_proof.png)` - Justdial or Practo claimed status and reviews.
    4.  `![Medical Registry EEAT Proof](assets/[doctor_slug]_eeat_proof.png)` - Official National/State Council registration registry verification.
    5.  `![Conversational AI Standing Proof](assets/[doctor_slug]_ai_standing_proof.png)` - Unified view of ChatGPT/Gemini prompt response showing recommendations.

### 7. Actionable 6-Pillar Treatment Plan
*   **Required Pillars:** Name/NAP Unification, Medical Registration indexing, Schema Landing Page setup, Slot Booking integration, Review Velocity engine, Video SEO.
*   **Format:** Numbered list with bold headings and 2-sentence implementation instructions for each, detailing the specific technical setup required.

### 8. Technical Architecture Compliance
*   **Required Fields:**
    *   `Flat Local SEO URLs:` Confirm URL resides at `/[city]/[specialty]/[doctor_slug]` with no state/provincial slugs.
    *   `Parallel Backend Modularity:` Scraper logic must reside parallel to `src/` inside `supabase/functions/scrapers`.
    *   `Patient Footfall verification:` Verified review velocity proxy (reviews/month) and slot-booking integration status.

---

## 📇 SECTION 2: THE COMPANION STEP-VERIFICATION CHECKLIST FILE

Every report execution must generate a separate step-verification checklist file parent or sibling to the report.
*   **File Path:** `reports/v5/[doctor_slug]_run_checklist.md`
*   **Required Contents & Structure:**

```markdown
# DIGICLINIC AUDIT STEP VERIFICATION RUN LOG (VERSION 5)
**Audited Practitioner:** Dr. [Full Name]
**Clinic Name:** [Clinic Name]
**Run Timestamp:** [ISO Timestamp]
**Browser Session ID:** [Session UUID or Hash based on Doctor Name & Date]

---

## 📋 VERIFICATION CHECKLIST & FLOW EXECUTION STATUS

- [ ] STEP 1: Google Search & Maps Local SEO Audit
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v5/assets/[doctor_slug]_maps_proof.png`
  - Notes: [e.g., GBP claimed, ranked #2 in Maps]

- [ ] STEP 2: Bing Search & Maps visibility Audit
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v5/assets/[doctor_slug]_bing_proof.png`
  - Notes: [e.g., Bing Local listing unranked, indexed on Bing search]

- [ ] STEP 3: Medical Aggregators Visibility Audit
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v5/assets/[doctor_slug]_aggregators_proof.png`
  - Notes: [e.g., Justdial claimed, Practo unclaimed]

- [ ] STEP 4: State Council E-E-A-T Registration lookup
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v5/assets/[doctor_slug]_eeat_proof.png`
  - Notes: [e.g., UP Dental Council registry active registration found]

- [ ] STEP 5: Conversational AI App GEO Auditing
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v5/assets/[doctor_slug]_ai_standing_proof.png`
  - Notes: [e.g., Recommended by Gemini, unmentioned by ChatGPT]

- [ ] STEP 6: Clinic Official Website & Structured Schema Parsing
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v5/assets/[doctor_slug]_website_proof.png` (optional, can be merged into bing proof)
  - Notes: [e.g., Parsed invalid JSON-LD schema / homepage loaded successfully]

---

## 📝 TECHNICAL EXECUTION RUN LOG & ISSUES ENCOUNTERED
- [Document any site structural changes, selectors that had to be dynamically adapted, API delays, or CAPTCHA occurrences that were bypassed using `browser_solve_captcha`]

## 💡 SCOPE OF IMPROVEMENT / RECOMMENDATIONS FOR FUTURE GUIDE VERSIONS
- [Provide technical feedback for the next version, e.g., "Add Lybrate parsing selectors", "Integrate automated JSON-LD schema schema validators in Workflow 6", or "Refine review sorting metrics for Justdial pages".]
```

---

## 🧭 SECTION 3: DETERMINISTIC SCORING ENGINE (GRADING RUBRIC)

To guarantee that generating a report for the same doctor on the same day always returns the exact same score, all scores must be calculated using this strict, count-based and binary grading rubric. No subjective "partial credit" is allowed:

### 1. Visibility Index (30 Points Max)
*   **Google Maps Ranking (10 pts):**
    *   Ranks in Top 3 for `best [specialty] in [area]` or `top [specialty] in [area]`: **10 pts**
    *   Ranks #4 to #10: **5 pts**
    *   Ranks >#10 or missing: **0 pts**
*   **Bing Search & Maps Ranking (10 pts):**
    *   Ranks in Top 3 on Bing for `best [specialty] in [area]` or `top [specialty] in [area]`: **10 pts**
    *   Ranks #4 to #10: **5 pts**
    *   Ranks >#10 or missing: **0 pts**
*   **Aggregator / Justdial/Practo Ranking (10 pts):**
    *   Ranks in Top 3 on Practo or Justdial for `[specialty] in [area]`: **10 pts**
    *   Ranks #4 to #10: **5 pts**
    *   Ranks >#10 or missing: **0 pts**

### 2. Completeness & E-E-A-T Index (30 Points Max)
*   **NAP & Visual Clinic Consistency (10 pts):**
    *   Address matches exactly (character-by-character) across GBP, Bing, and directories: **3 pts**
    *   Phone number matches exactly across GBP, Bing, and directories: **3 pts**
    *   Visual assets present (>= 3 photos of clinic/staff on maps/directories): **4 pts**
*   **EEAT Doctor Credentials (20 pts):**
    *   Degrees listed and matching specialty (e.g., BDS/MDS for Dentist, MBBS/MD for Physician): **5 pts**
    *   Verifiable National Medical Commission (NMC)/State Council registration number found: **5 pts**
    *   Verified CMO/Ayushman Bharat Registration listed or indexed: **5 pts**
    *   Publications or active Professional association memberships (e.g., IDA, IMA) listed: **5 pts**

### 3. Patient Sentiment Index (20 Points Max)
*   **Review Volume & Ratings (10 pts):**
    *   Aggregate star rating >= 4.5★ AND >= 50 reviews across GBP/Bing/directories: **10 pts**
    *   Aggregate star rating >= 4.0★ AND 10-49 reviews: **5 pts**
    *   Aggregate star rating < 4.0★ or < 10 reviews: **0 pts**
*   **Patient Footfall Review Velocity (5 pts):**
    *   Calculated review velocity >= 5.0 reviews/month (calculated over the last 60 days): **5 pts**
    *   Calculated review velocity 1.0 to 4.9 reviews/month: **3 pts**
    *   Calculated review velocity < 1.0 reviews/month: **0 pts**
*   **Narrative Success Stories & Testimonials (5 pts):**
    *   At least 3 patient success stories or detailed video/text case reviews on maps/website: **5 pts**
    *   1 or 2 detailed patient stories: **3 pts**
    *   0 success stories: **0 pts**

### 4. Conversational AI Standing & Schema Index (20 Points Max)
*   **LLM Conversational Standing (10 pts):**
    *   Recommended in Top 3 search outputs for area queries on ChatGPT, Gemini, Meta AI, and Grok AI: **10 pts**
    *   Recommended in Top 3 by some (1 to 3) LLMs but not all: **5 pts**
    *   Not recommended by any LLM: **0 pts**
*   **Structured Schema Data (10 pts):**
    *   Website has active, valid JSON-LD `MedicalBusiness`, `Dentist`, or `Physician` schema in the source: **10 pts**
    *   Website exists but lacks schema markup or schema is malformed: **5 pts**
    *   No clinical website exists: **0 pts**

---

## 🛠️ SECTION 4: HYBRID SEARCH & BROWSER MCP TOOLING BLUEPRINT

To guarantee the highest report speed, lowest token overhead, and complete resilience against bot detection, the auditor uses a **hybrid search system** that divides tasks between **Semantic Search APIs** (`search_web`) and **Human-Emulated Browser Sessions** (`browser-mcp`).

### Core Tooling Blueprint
The agent must execute the following tools strictly under these rules:
1.  **`search_web`**: Use to instantly resolve search queries (Google/Bing site-restricted searches, registry portal URLs, conversational GEO queries) to get text content or target URLs.
2.  **`mcp_browser-mcp_browser_navigate`**: Use to load targeted URLs directly. Reuses active tabs (`new_tab: false`) to prevent session and information leakage.
3.  **`mcp_browser-mcp_browser_fill`**: Use to input text strings into search inputs, database lookups, or form fields.
4.  **`mcp_browser-mcp_browser_click`**: Use to click buttons, submit forms, or navigate links.
5.  **`mcp_browser-mcp_browser_screenshot`**: Use to capture high-fidelity visual proof. Save directly to the target `reports/v5/assets/` directory.
6.  **`mcp_browser-mcp_browser_get_page_content`**: Use to extract DOM structure or raw text nodes.
7.  **`mcp_browser-mcp_browser_wait_for_network`**: Call immediately after clicking submit buttons or search forms to ensure AJAX APIs and SPAs are fully rendered before scraping.
8.  **`mcp_browser-mcp_browser_solve_captcha`**: In the rare event a bot challenge appears on government registries or directory portals, run this tool with `action: "detect"` followed by `action: "click_checkbox"` to automatically bypass challenges.

---

## 🧭 SECTION 5: STEP-BY-STEP CHANNEL AUTOMATED WORKFLOWS

### 🗺️ Workflow 1: Google Maps Local SEO Auditing
1. Navigate `mcp_browser-mcp_browser_navigate` to `https://www.google.com`.
2. Search for the local queries (e.g. `best dentist in naini, prayagraj`). Note the clinic's exact position and compile the list of the **Top 3 Competitor Names** appearing in the maps search rankings.
3. Check if the clinic listing is claimed.
4. Capture Google Maps ranking screenshot as `reports/v5/assets/[doctor_slug]_maps_proof.png` using `mcp_browser-mcp_browser_screenshot`.

### 🔍 Workflow 2: Bing Search & Maps Auditing
1. Navigate `mcp_browser-mcp_browser_navigate` to `https://www.bing.com`.
2. Search for all 7 localized queries. Note the doctor/clinic's exact ranking.
3. Compile the list of the **Top 3 Competitor Names** appearing in Bing Search local pack results.
4. Capture Bing Maps/Search ranking proof screenshot as `reports/v5/assets/[doctor_slug]_bing_proof.png`.

### 🩺 Workflow 3: Medical Aggregators Audit (Practo & Justdial)
1. Call `search_web` to locate Practo and Justdial profile URLs:
   * `site:practo.com [Doctor Name] [city]`
   * `site:justdial.com [Clinic Name] [city]`
2. Navigate `mcp_browser-mcp_browser_navigate` to the discovered URLs.
3. Audit claimed profile status, ranking inside categories, appointment slot booking buttons, reviews count, and stars.
4. Capture the Justdial / Practo claimed status and reviews profile screenshot as `reports/v5/assets/[doctor_slug]_aggregators_proof.png`.

### 🔬 Workflow 4: State Council E-E-A-T & Registration Credentials Verification
1. Call `search_web` to locate the official search registry page for the specialty or state council (e.g., `UP Dental Council search portal link` or `NMC registry search page`).
2. Navigate directly to the registry lookup form. Input the doctor's full name, and execute the lookup.
3. Scraping: Extract name, degrees, registration status, registration number, registration date, and father's name or other verifiers.
4. Search or discover CMO (Chief Medical Officer) clinic registrations or Ayushman Bharat health facilities listings.
5. Capture U.P. Dental Council or national medical registry proof screenshot as `reports/v5/assets/[doctor_slug]_eeat_proof.png`.

### 🤖 Workflow 5: Conversational AI App GEO Standing (ChatGPT, Gemini, Meta AI, Grok AI)
1. Use `search_web` or browser sessions to query ChatGPT, Gemini, Meta AI, and Grok AI with the smart comparative prompt.
2. Extract whether the doctor/clinic name is recommended and their position compared to the top 3.
3. Log verbatim responses, rankings, and citations.
4. Save a conversational standing screenshot as `reports/v5/assets/[doctor_slug]_ai_standing_proof.png` (combining the UI queries if possible, or capturing Gemini/ChatGPT response view).

### 💻 Workflow 6: Official Website & Structured Schema Parsing
1. Check if an official website is linked on Google Maps, Bing Maps, or Justdial.
2. If yes, navigate `mcp_browser-mcp_browser_navigate` to the website and call `mcp_browser-mcp_browser_get_page_content` to extract raw HTML.
3. Parse HTML for `<script type="application/ld+json">` parsing for `@type: "MedicalBusiness"`, `"Dentist"`, or `"Physician"`. Validate character-by-character NAP matching.
4. Capture a homepage/schema screenshot as `reports/v5/assets/[doctor_slug]_website_proof.png`. (If missing, capture a Google/Bing search showing the website is missing).

---

## 🚫 SECTION 6: STRICT OPERATIONAL DOs & DONTs MATRIX

### 🔴 GLOBAL OPERATIONAL DONTs
*   🛑 **NO INFORMATION LEAKAGE:** You **MUST NOT** read previously generated doctor reports (e.g. `reports/v3/*.md` or `reports/v4/*.md`) to perform an audit for a new doctor. This is a strict operational firewall.
*   🛑 **NO DATA HALLUCINATION:** Never invent medical credentials, state registrations, ratings, or phone numbers. If a detail cannot be verified through live browser queries, mark it **🔴 MISSING** and score it exactly as **0** under the scoring engine.
*   🛑 **NO PLACEHOLDERS OR SUBJECTIVITY:** Do not place filler values or round up scores. Do not use generic images or generate screenshots using the AI image generation tool (`generate_image`). Every screenshot MUST be captured directly using the Browser MCP on the live browser tab to guarantee absolute authenticity.
*   🛑 **NO CHECKLIST OMISSION:** Do not skip creating the separate companion `[doctor_slug]_run_checklist.md` execution file. It is a mandatory audit deliverable.
*   🛑 **NO ABSOLUTE FILE IMAGE PATHS:** Do not use absolute paths starting with `file:///` for embedded images in the report, as they are blocked by standard markdown viewer security sandboxes. Instead, always use relative paths (e.g., `assets/[doctor_slug]_[proof_type].png`) to ensure seamless markdown rendering and display.

### 🟢 GLOBAL OPERATIONAL DOs
*   ✅ **DO EMBED PROOF VISUALLY RELEVANT AND INLINE:** Always embed the specific channel-specific proof screenshots directly *inline* inside their relevant sections (e.g., search matrix rank screenshot under search matrix, NMC registration screenshot under credentials) to make the report visually engaging and immediate.
*   ✅ **DO CONSOLIDATE VISUAL PROOF:** Compile all captured visual assets in the final **Visual Proof Index** at the end of the report.
*   ✅ **DO DOUBLE-CHECK THE SCORING MATH:** Manual addition errors are unacceptable. Double-check all scores against the rubric rules (Visibility + Completeness + Sentiment + GEO = Overall Score).
*   ✅ **DO UNIFY NAP EXPLICITLY:** Compare name, address, and phone details character-by-character to identify conflicts across channels.

---

## 🛠️ SECTION 7: SCHEMA EXTENSION & SYSTEM COMPLIANCE

*   **Flat Local SEO URLs:** Generated report URLs must strictly follow the routing architecture `/[city]/[specialty]/[doctor_slug]` with no state or provincial segments.
*   **Parallel Backend Modularity:** All channel data collection and scraping modules must reside parallel to `src/` inside `supabase/functions/scrapers`.
*   **Deterministic Calibration:** If the data schema is extended in the future, the scoring value must be represented by a binary (1/0) or count-based formula to keep calculations 100% reproducible.

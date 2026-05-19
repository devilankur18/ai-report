# DigiClinic AI Rank & SEO Report Generator Guide (Version 4)

This document is the master operational specification (Version 4) for the DigiClinic Digital Presence & AI Rank Analyzer. It establishes a **100% deterministic scoring engine**, transitions core evidence-gathering entirely to **Browser MCP** (resolving anti-bot CAPTCHAs, search blockages, and interactive rendering limitations), implements **6 highly granular, step-by-step channel workflows**, and enforces a **rigid Operational DOs & DONTs Matrix** (including a strict Information Leakage Isolation Rule) to guarantee high-integrity, completely fresh digital presence reports.

---

## 🗂️ SECTION 1: SCHEMATIC SPECIFICATION FOR REPORT SECTIONS

Every generated report must strictly contain the following sections in this exact order, using the specified formatting and data schemas. No sections may be added, rearranged, or removed.

### 1. Header Metadata Section
*   **Required Fields:**
    *   `Prepared for:` Dr. [Full Name]
    *   `Practice Specialty:` [Specialties, comma-separated]
    *   `Clinic Name:` [Clinic Name]
    *   `Location:` [Street Address, Area, City, State]
    *   `Last Verified Activity:` [Current Audit Date / Description of the last online action discovered, e.g., Justdial review reply on 19 May 2026]
*   **Format:** Plain text key-value block with standard bold markup.

### 2. Consolidated Rank & Summary Card
*   **Required Fields:**
    *   `Overall Score:` [Score/100] (calculated using Section 2 formulas)
    *   `Discoverability Tier:` [EXCELLENT (>=80) / GOOD (60-79) / MODERATE (40-59) / WEAK (<40)]
    *   `Diagnostic Summary:` A highly focused, 2-3 sentence paragraph summarizing strengths, core technical gaps (e.g., missing schema, unclaimed profiles), and local competitive standing.
*   **Format:** Standard Markdown quote block or layout block with a rating emoji (`🟢` for Excellent, `🟡` for Good/Moderate, `🔴` for Weak).

### 3. Cross-Channel Search Query Matrix
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
*   **Table Content:** Display precise ranking positions (e.g., `#1`, `#4`, `Unranked`, `High`, `Moderate`, `Low`).
*   **Competitor Callout:** Immediately below the table, include a `> [!WARNING]` alert detailing the primary local competitor dominating the search volume in the micro-market, specifying their name and estimated market capture percentage due to their SEO setup.
*   **Inline Evidence:** Embed the Maps & GBP search ranking screenshot (`reports/v4/assets/[doctor_slug]_maps_proof.png`) immediately below this section to provide immediate visual proof of the ranking claims.

### 4. Enrichment Audit & Gap Details (The Verification Schema)
Every entity details section must list specific items with the status **🟢 VERIFIED**, **🔴 MISSING**, or **🟡 CONFLICTING**, followed by a clear text explanation.
*   **Clinic Details (3 items):** Address consistency, Phone consistency, Visual asset count.
*   **Doctor Details (4 items):** Degrees/Experience, State/NMC Medical Registration, Articles/Publications, Professional Memberships.
    *   *Inline Evidence:* Embed the council medical registry lookup screenshot (`reports/v4/assets/[doctor_slug]_eeat_proof.png`) directly under this section to visually verify the NMC/State dental registration credentials.
*   **Patient Sentiment (4 items):** Aggregated reviews, Patient footfall proxy, Success stories count, YouTube testimonial count.

### 5. Visual Proof Index
*   **Requirements:** Must compile and link all captured browser screenshots verifying each audited digital channel, ensuring complete visual traceability.
*   **Format:** Standard Markdown image links with descriptive figure captions. 
*   **Required Proof Assets:**
    1.  `![Google Maps Proof](file:///Users/ankur/dev/docx/ppt/reports/v4/assets/[doctor_slug]_maps_proof.png)` - Maps listing and rank evidence.
    2.  `![Medical Aggregator Proof](file:///Users/ankur/dev/docx/ppt/reports/v4/assets/[doctor_slug]_aggregators_proof.png)` - Practo / Justdial claimed status and booking widget.
    3.  `![Medical Registry EEAT Proof](file:///Users/ankur/dev/docx/ppt/reports/v4/assets/[doctor_slug]_eeat_proof.png)` - Official National/State Council registration registry verification.
    4.  `![Clinic Homepage & Schema Proof](file:///Users/ankur/dev/docx/ppt/reports/v4/assets/[doctor_slug]_website_proof.png)` - Homepage load and validated JSON-LD schema parsing.

### 6. Actionable 6-Pillar Treatment Plan
*   **Required Pillars:** Name/NAP Unification, Medical Registration indexing, Schema Landing Page setup, Slot Booking integration, Review Velocity engine, Video SEO.
*   **Format:** Numbered list with bold headings and 2-sentence implementation instructions for each, detailing the specific technical setup required.

### 7. Technical Architecture Compliance
*   **Required Fields:**
    *   `Flat Local SEO URLs:` Confirm URL resides at `/[city]/[specialty]/[doctor_slug]` with no state/provincial slugs.
    *   `Parallel Backend Modularity:` Scraper logic must reside parallel to `src/` inside `supabase/functions/scrapers`.
    *   `Patient Footfall verification:` Verified review velocity proxy (calculated reviews/month) and slot-booking integration availability status.

---

## 📇 SECTION 2: THE COMPANION STEP-VERIFICATION CHECKLIST FILE

To maintain high data integrity and capture technical insights across runs, **every report execution must generate a separate step-verification checklist file parent or sibling to the report**.

*   **File Path:** `reports/v4/[doctor_slug]_run_checklist.md`
*   **Required Contents & Structure:**

```markdown
# DIGICLINIC AUDIT STEP VERIFICATION RUN LOG
**Audited Practitioner:** Dr. [Full Name]
**Clinic Name:** [Clinic Name]
**Run Timestamp:** [ISO Timestamp]
**Browser Session ID:** [Session UUID]

---

## 📋 VERIFICATION CHECKLIST & FLOW EXECUTION STATUS

- [ ] STEP 1: Google Search & Maps Local SEO Audit
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v4/assets/[doctor_slug]_maps_proof.png`
  - Notes: [e.g., GBP claimed, ranked #2 in Maps]

- [ ] STEP 2: Medical Aggregators Visibility Audit
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v4/assets/[doctor_slug]_aggregators_proof.png`
  - Notes: [e.g., Justdial claimed, Practo unclaimed]

- [ ] STEP 3: State & National Medical Registry E-E-A-T Verification
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v4/assets/[doctor_slug]_eeat_proof.png`
  - Notes: [e.g., UP Dental Council registry active registration found]

- [ ] STEP 4: Review Volume & Patient Sentiment Scraping
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Notes: [e.g., Calculated review velocity of 15.5 reviews/month]

- [ ] STEP 5: Generative AI Optimization (GEO) Standing Simulated Search
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: [Optional, e.g., `reports/v4/assets/[doctor_slug]_geo_proof.png`]
  - Notes: [e.g., Recommended in top 3 by Gemini area queries]

- [ ] STEP 6: Clinic Official Website & Structured Schema Parsing
  - Status: [SUCCESS / FAILED / SKIPPED]
  - Visual Captures Saved: `reports/v4/assets/[doctor_slug]_website_proof.png`
  - Notes: [e.g., Parsed invalid JSON-LD schema / homepage loaded successfully]

---

## 📝 TECHNICAL EXECUTION RUN LOG & ISSUES ENCOUNTERED
- [Document any site structural changes, selectors that had to be dynamically adapted, API delays, or CAPTCHA occurrences that were bypassed using `browser_solve_captcha`]

## 💡 SCOPE OF IMPROVEMENT / RECOMMENDATIONS FOR FUTURE GUIDE VERSIONS
- [Provide technical feedback for the next version, e.g., "Add Lybrate parsing selectors", "Integrate automated JSON-LD schema schema validators in Workflow 6", or "Refine review sorting metrics for Justdial pages".]
```

---

## 🧭 SECTION 3: DETERMINISTIC SCORING ENGINE (GRADING RUBRIC)

To guarantee that generating a report for the same doctor on the same day always returns the exact same score, all scores must be calculated using this strict, count-based and binary grading rubric. No subjective "partial credit" is allowed outside the rules specified:

### 1. Visibility Index (30 Points Max)
*   **Google Maps Ranking (15 pts):**
    *   Ranks in Top 3 for `best [specialty] in [area]` or `top [specialty] in [area]`: **15 pts**
    *   Ranks #4 to #10: **10 pts**
    *   Ranks >#10 or missing: **0 pts**
*   **Aggregator / Justdial Ranking (15 pts):**
    *   Ranks in Top 3 on Practo/Justdial for `[specialty] in [area]`: **15 pts**
    *   Ranks #4 to #10: **10 pts**
    *   Ranks >#10 or missing: **0 pts**

### 2. Completeness Index (30 Points Max)
*   **NAP Clinic Consistency (15 pts):**
    *   Address matches exactly across Google Maps, Practo, Justdial, and Website: **5 pts**
    *   Phone number matches exactly and is active across listings: **5 pts**
    *   Visual assets present (>= 3 photos of clinic/staff on maps/directories): **5 pts**
*   **EEAT Doctor Credentials (15 pts):**
    *   Degrees listed and matching specialty (e.g., BDS/MDS for Dentist, MBBS/MD for Physician): **5 pts**
    *   Verifiable National Medical Commission (NMC)/State Council registration number listed: **5 pts**
    *   Active association memberships (e.g., IDA, IMA) listed: **5 pts**

### 3. Patient Sentiment Index (20 Points Max)
*   **Review Volume & Sentiment (10 pts):**
    *   Aggregate star rating >= 4.5★ AND >= 50 reviews across GBP/aggregators: **10 pts**
    *   Aggregate star rating >= 4.0★ AND 10-49 reviews: **5 pts**
    *   Aggregate star rating < 4.0★ or < 10 reviews: **0 pts**
*   **Success Stories / Case Studies (10 pts):**
    *   At least 2 detailed patient success stories or narrative text case studies published on maps, aggregator pages, or clinic website: **10 pts**
    *   1 detailed patient story / case study: **5 pts**
    *   0 success stories: **0 pts**

### 4. GEO (Generative AI Optimization) Index (20 Points Max)
*   **LLM Recommendation Standing (10 pts):**
    *   Doctor AND Clinic name recommended in Top 3 search outputs for area queries on ChatGPT/Gemini: **10 pts**
    *   Doctor OR Clinic recommended but not in Top 3: **5 pts**
    *   Not recommended/cannot verify: **0 pts**
*   **Structured Schema Data (10 pts):**
    *   Website has active, valid JSON-LD `MedicalBusiness`, `Dentist`, or `Physician` schema in the source: **10 pts**
    *   Website exists but lacks schema markup or schema is malformed: **5 pts**
    *   No clinical website exists: **0 pts**

---

## 🛠️ SECTION 4: HYBRID SEARCH & BROWSER MCP TOOLING BLUEPRINT

To guarantee the highest report speed, lowest token overhead, and complete resilience against bot detection, the auditor uses a **hybrid search system** that divides tasks between **Semantic Search APIs** (`search_web`) and **Human-Emulated Browser Sessions** (`browser-mcp`).

### The Scouting vs. Auditing Tool Split
1.  **`search_web` (The Scouting Engine):** Used as an extremely fast, zero-session, low-token scraper to locate exact URL coordinates (e.g. Practo profile links, Justdial clinic pages, official government registration lookup portals) and query simulated GEO recommendations. This prevents triggering search CAPTCHAs inside the browser tab during discovery.
2.  **`browser-mcp` (The Auditing & Proof Engine):** Operating inside an active, user-authenticated browser session with native OS-level human interaction emulation. Used strictly once target URLs are found to perform claim verification, interact with deep registry databases, load lazy-loaded elements, and capture screenshots.

### Core Tooling Blueprint
The agent must execute the following tools strictly under these rules:

1.  **`search_web`**: Use to instantly resolve search queries (Google site-restricted searches, registry portal URLs, conversational GEO queries) to get text content or target URLs.
2.  **`mcp_browser-mcp_browser_navigate`**: Use to load targeted URLs directly.
    *   *Parameters:* `url`, `new_tab: false` (always reuse active tabs to prevent session and information leakage).
3.  **`mcp_browser-mcp_browser_fill`**: Use to input text strings into search inputs, database lookups, or form fields.
    *   *Parameters:* `selector`, `value`.
4.  **`mcp_browser-mcp_browser_click`**: Use to click buttons, submit forms, or navigate links.
    *   *Parameters:* `selector`.
5.  **`mcp_chrome-devtools-mcp_take_screenshot`**: Use to capture high-fidelity visual proof. STRICTLY avoid using `mcp_browser-mcp_browser_screenshot` as it does not natively save to disk.
    *   *Parameters:* `filePath` (save directly or via `/tmp/` and move to the target `reports/v4/assets/` directory).
6.  **`mcp_browser-mcp_browser_get_page_content`**: Use to extract DOM structure or raw text nodes.
    *   *Parameters:* `format: "html"` (for parsing hydrated scripts/schemas) or `format: "text"` (for E-E-A-T indexing).
7.  **`mcp_browser-mcp_browser_wait_for_network`**: Call immediately after clicking submit buttons or search forms to ensure AJAX APIs and SPAs are fully rendered before scraping.
8.  **`mcp_browser-mcp_browser_solve_captcha`**: In the rare event a bot challenge appears on government registries or directory portals, run this tool with `action: "detect"` followed by `action: "click_checkbox"` to automatically bypass challenges.

---

## 🧭 SECTION 5: STEP-BY-STEP CHANNEL AUTOMATED WORKFLOWS

To ensure high reliability, easy maintenance, and clear enhancement paths in the future, the auditor must execute the following 6 step-by-step verification flows:

```
Workflow 1: Local SEO & Google Maps (Direct Browser MCP)
     └── Workflow 2: Medical Aggregators (Hybrid: search_web -> Browser MCP)
           └── Workflow 3: EEAT Registries (Hybrid: search_web -> Browser MCP)
                 └── Workflow 4: Patient Sentiment & Velocity (Direct Browser MCP)
                       └── Workflow 5: GEO Standing (Hybrid: search_web -> Browser MCP)
                             └── Workflow 6: Official Website & Schema (Direct Browser MCP)
```

---

### 🗺️ Workflow 1: Local SEO & Google Maps Auditing (Direct Browser MCP)
*   **Objective:** Verify map indexing, GBP claiming status, NAP consistency, and search ranking on Google Local Pack.
*   **Inputs:** `Clinic Name`, `Specialty`, `City`, `Area`.
*   **Workflow Steps:**
    1.  Call `mcp_browser-mcp_browser_navigate` to navigate to `https://www.google.com`.
    2.  Call `mcp_browser-mcp_browser_fill` on the search input with the query `best [specialty] in [area], [city]`.
    3.  Call `mcp_browser-mcp_browser_click` to submit the search, and run `mcp_browser-mcp_browser_wait_for_network`.
    4.  Inspect the local 3-pack structure. Note the clinic's exact position. If not in the local 3-pack, click "More businesses" to locate their exact numerical rank.
    5.  Navigate to the clinic's specific Google Maps listing page and check if the listing is claimed. Look for the "Own this business?" or "Claim this business" link.
    6.  Call `mcp_chrome-devtools-mcp_take_screenshot` to capture the maps rating overview. Save this screenshot as `reports/v4/assets/[doctor_slug]_maps_proof.png`.
*   **Outputs Expected:** Exact Local Pack rank, claimed/unclaimed status, visual asset count (GBP photos), maps profile screenshot saved, and linked inline under the Query Matrix section of the main report.

---

### 🩺 Workflow 2: Medical Aggregators & Directories Audit (Hybrid: search_web -> Browser MCP)
*   **Objective:** Audit visibility, completeness, and appointment conversion potential on major medical directories (Practo and Justdial).
*   **Inputs:** `Doctor Name`, `Clinic Name`, `Specialty`, `City`.
*   **Workflow Steps:**
    1.  Call `search_web` to execute site-restricted searches:
        *   `site:practo.com [Doctor Name] [city]`
        *   `site:justdial.com [Clinic Name] [city]`
    2.  Extract the top matching URL for each directory from the search results.
    3.  Call `mcp_browser-mcp_browser_navigate` with `new_tab: false` to go directly to the discovered Practo URL, then call `mcp_browser-mcp_browser_wait_for_network`.
    4.  Inspect the Practo listing to see if appointment booking is active (look for active slot booking buttons) and if the profile is claimed.
    5.  Call `mcp_chrome-devtools-mcp_take_screenshot` to capture the claimed/active booking proof. Save as `reports/v4/assets/[doctor_slug]_aggregators_proof.png`.
    6.  Call `mcp_browser-mcp_browser_navigate` with `new_tab: false` to navigate to the discovered Justdial URL. Verify matching name, phone number, and address coordinates against GBP.
*   **Outputs Expected:** Directory ranking position, claimed status on Practo/Justdial, slot booking availability (Yes/No), and aggregator landing page screenshot saved and linked inside the Visual Proof Index.

---

### 🔬 Workflow 3: E-E-A-T & Registration Credentials Verification (Hybrid: search_web -> Browser MCP)
*   **Objective:** Verify clinical qualifications and active medical registration status through authoritative national/state databases.
*   **Inputs:** `Doctor Name`, `Specialty`, `State Council`.
*   **Workflow Steps:**
    1.  Call `search_web` to locate the official search registry page for the specialty or state council (e.g. `UP Dental Council search portal link` or `NMC registry search page`).
    2.  Extract the portal URL and call `mcp_browser-mcp_browser_navigate` with `new_tab: false` to go directly to the registry lookup form.
    3.  Locate the search input field, call `mcp_browser-mcp_browser_fill` with the doctor's full name, click search, and run `mcp_browser-mcp_browser_wait_for_network`.
    4.  If a match is found, call `mcp_browser-mcp_browser_get_page_content` to scrape the text. Verify the doctor's name, registered degrees, active registration status, and exact registration number.
    5.  Call `mcp_chrome-devtools-mcp_take_screenshot` to capture the active registration record on the council portal. Save this screenshot as `reports/v4/assets/[doctor_slug]_eeat_proof.png`.
*   **Outputs Expected:** Verified registration status, exact medical registration number, degree confirmation, registry portal screenshot proof saved, and linked inline under the E-E-A-T Doctor Details section of the main report.

---

### 💬 Workflow 4: Patient Sentiment & Review Velocity Analysis (Direct Browser MCP)
*   **Objective:** Quantify aggregate patient satisfaction and recent footfall velocity to establish active practice traffic.
*   **Inputs:** GBP URL, Aggregator URLs.
*   **Workflow Steps:**
    1.  Call `mcp_browser-mcp_browser_navigate` to the clinic's Google Business profile reviews tab or Justdial reviews section.
    2.  Extract the total review count and aggregate star rating using `mcp_browser-mcp_browser_get_page_content`.
    3.  Sort or scan the latest 20 reviews. Count the number of reviews published within the last 60 days to calculate the **Review Velocity Proxy** (reviews per month).
    4.  Verify the existence of detailed patient text-based narratives (success stories or case descriptions) on the listings.
    5.  Call `mcp_chrome-devtools-mcp_take_screenshot` showing the ratings distribution card. Save this screenshot as `reports/v4/assets/[doctor_slug]_reviews_proof.png` (optional, can be compiled with Maps proof).
*   **Outputs Expected:** Exact review count, aggregate rating, calculated review velocity, count of narrative case studies, and review summary screenshot saved.

---

### 🤖 Workflow 5: Generative AI Optimization (GEO) & Predictive Recommendations (Hybrid: search_web -> Browser MCP)
*   **Objective:** Audit the probability of the doctor/clinic being recommended by LLMs for localized clinical queries.
*   **Inputs:** `Specialty`, `City`, `Area`, `Clinic Name`.
*   **Workflow Steps:**
    1.  Call `search_web` with simulated patient intent queries, such as:
        *   `Who are the best [specialty] in [area], [city]?`
        *   `Recommended clinical specialist for [specialty] near me`
    2.  Inspect the resulting text output and citations to verify if the doctor's name or clinic name appears in the recommended top 3 recommendations.
    3.  If a physical screenshot is required, navigate `mcp_browser-mcp_browser_navigate` with `new_tab: false` to an open, un-authenticated conversational engine (such as Google Search's AI Overview) and run the same queries.
    4.  Call `mcp_chrome-devtools-mcp_take_screenshot` to capture the recommendation citations. Save this screenshot as `reports/v4/assets/[doctor_slug]_geo_proof.png` (optional).
*   **Outputs Expected:** Recommendation tier (Top 3, Mentioned, or Unmentioned), citation details, and conversational recommendation screenshot saved.

---

### 💻 Workflow 6: Official Website & Structured Schema Parsing (Direct Browser MCP)
*   **Objective:** Verify clinical landing page performance and search engine indexing via structured JSON-LD schema.
*   **Inputs:** Website URL (discovered from maps or aggregators).
*   **Workflow Steps:**
    1.  Call `mcp_browser-mcp_browser_navigate` to the official clinic landing page.
    2.  Verify the website loads. Call `mcp_chrome-devtools-mcp_take_screenshot` to capture the homepage viewport. Save this screenshot as `reports/v4/assets/[doctor_slug]_website_proof.png`.
    3.  Call `mcp_browser-mcp_browser_get_page_content` with `format: "html"` to extract the raw page code.
    4.  Parse the HTML string using regex or semantic checks for `<script type="application/ld+json">`.
    5.  Locate JSON blocks and verify the presence of `@type: "MedicalBusiness"`, `"Dentist"`, or `"Physician"`. Validate that the name, address, and phone coordinates embedded in the JSON-LD match GBP data.
*   **Outputs Expected:** Website availability, structured JSON-LD schema presence (Yes/No, schema type), schema validity status, and homepage screenshot saved and linked inside the Visual Proof Index.

---

## 🚫 SECTION 6: STRICT OPERATIONAL DOs & DONTs MATRIX

To prevent errors, data contamination, and keep reports strictly professional and accurate, the agent must adhere to the following rules at all times.

### 🔴 GLOBAL OPERATIONAL DONTs (The Integrity Firewall)
*   🛑 **NO INFORMATION LEAKAGE:** You **MUST NOT** read previously generated doctor reports (e.g. `reports/v3/*.md` or `reports/v2/*.md` or `reports-old/*`) or look at other doctor data files in the workspace while performing an audit for a new doctor. This is a strict operational firewall. Every audit must be compiled purely from real-time browser session runs.
*   🛑 **NO DATA HALLUCINATION:** Never invent medical credentials, state registrations, ratings, or phone numbers. If a detail cannot be verified through live browser queries, mark it **🔴 MISSING** and score it exactly as **0** under the scoring engine.
*   🛑 **NO PLACEHOLDERS OR SUBJECTIVITY:** Do not place filler values or round up scores. Do not use generic images or generate screenshots using the AI image generation tool (`generate_image`). Every screenshot MUST be captured directly using the Chrome DevTools MCP (`mcp_chrome-devtools-mcp_take_screenshot`) on the live browser tab to guarantee absolute authenticity. Strictly avoid `mcp_browser-mcp_browser_screenshot`. Every visual proof reference must point to a captured screenshot `reports/v4/assets/[doctor_slug]_[channel]_proof.png` showing actual audited elements.
*   🛑 **NO TAB SPAM:** Keep all operations within the active browser tab by specifying `new_tab: false` or reusing the existing session. Do not launch multiple browser instances.
*   🛑 **NO SYSTEM DIRECTORY MUTATIONS:** Do not write project files to system temp, home, or desktop directories. All outputs must sit inside the active project directory under `reports/v4/`.
*   🛑 **NO CHECKLIST OMISSION:** Do not skip creating the separate companion `[doctor_slug]_run_checklist.md` execution file. It is a mandatory audit deliverable.
*   🛑 **NO BUNDLED SINGLE PROOF:** Do not bundle all proof into a single, generic image if multiple distinct pages were audited. Capture distinct screenshots for each workflow.

### 🟢 GLOBAL OPERATIONAL DOs
*   ✅ **DO EMBED PROOF VISUALLY RELEVANT AND INLINE:** Always embed the specific channel-specific proof screenshots directly *inline* inside their relevant sections (e.g., search matrix rank screenshot under search matrix, NMC registration screenshot under credentials) to make the report visually engaging and immediate.
*   ✅ **DO CONSOLIDATE VISUAL PROOF:** Compile all captured visual assets in the final **Visual Proof Index** at the end of the report.
*   ✅ **DO DOUBLE-CHECK THE SCORING MATH:** Manual addition errors are unacceptable. Double-check all scores against the rubric rules (Visibility + Completeness + Sentiment + GEO = Overall Score).
*   ✅ **DO UNIFY NAP EXPLICITLY:** Compare name, address, and phone details character-by-character to identify conflicts across channels.

### 🔍 CHANNEL-LEVEL GUIDELINES

| Channel | 🟢 STRICT DOs | 🔴 STRICT DONTs |
| :--- | :--- | :--- |
| **Traditional SEO & Maps** | Verify actual rank in the Google Maps App listing or local 3-pack. Confirm physical clinic address matches exactly. Save screenshot as `[doctor_slug]_maps_proof.png` and embed inline. | **DO NOT** count third-party listings or blogs (e.g., "top dentist list blogs") as GBP proof. |
| **Medical Aggregators** | Check if the Practo profile is claimed. Check if "Book Appointment" is active. Save screenshot as `[doctor_slug]_aggregators_proof.png`. | **DO NOT** assume booking is active unless booking slots are displayed. |
| **E-E-A-T & Registration** | Scrape the exact State Medical Council / Dental Council page. Verify matching degrees. Save screenshot as `[doctor_slug]_eeat_proof.png` and embed inline. | **DO NOT** assume credential validation without finding the actual registration number. |
| **Patient Sentiment** | Calculate review velocity precisely over the last 60 days. | **DO NOT** estimate review metrics or sentiment trends; count exact reviews. |
| **GEO / AI Search** | Check ChatGPT/Gemini outputs for real-time recommendations. | **DO NOT** assume high GEO scores unless doctor/clinic is recommended in localized queries. |
| **Clinic Website** | Retrieve raw HTML and parse scripts for active `MedicalBusiness` JSON-LD. Save homepage and schema screenshot as `[doctor_slug]_website_proof.png`. | **DO NOT** score a website as 10/10 if schema is missing or invalid. Lacking schema yields exactly 5/10. |

---

## 🛠️ SECTION 7: SCHEMA EXTENSION & SYSTEM COMPLIANCE

*   **Flat Local SEO URLs:** Generated report URLs must strictly follow the routing architecture `/[city]/[specialty]/[doctor_slug]` with no state or provincial segments.
*   **Parallel Backend Modularity:** All channel data collection and scraping modules must reside parallel to `src/` inside `supabase/functions/scrapers`.
*   **Deterministic Calibration:** If the data schema is extended in the future, the scoring value must be represented by a binary (1/0) or count-based formula to keep calculations 100% reproducible.

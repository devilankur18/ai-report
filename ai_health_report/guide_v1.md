# DigiClinic AI Rank & SEO Report Generator Guide

This file serves as a reusable operational blueprint for analyzing any Indian doctor's and clinic's online discoverability and generating a high-impact, professional "AI Rank & SEO Audit Report."

Whenever this file is provided as context, the agent must follow the instructions below to run search audits and compile the report.

---

## 🧭 PHASE 1: SEARCH & DISCOVERY MATRIX

To evaluate the doctor's discoverability across channels, execute simulated queries using the following matrix. Intersect the **Specialty** with the **City** and **Area** provided by the user.

### Monitored Channels
1. **Traditional Search:** Google Organic Search, Google Business Profile (Maps/Local 3-Pack).
2. **Generative AI Apps (GEO):** ChatGPT, Gemini, Claude, Perplexity, Meta AI.
3. **Medical Aggregators:** Practo, Lybrate, Justdial.
4. **Video Search:** YouTube (evaluating thought leadership and patient education).

### Localized Query permuntations to Run
*   `top [specialty] in [city]` (e.g., *top dentist in Prayagraj*)
*   `top [specialty] in [area]` (e.g., *top dentist in Naini*)
*   `best [specialty] in [city]`
*   `best [specialty] in [area]`
*   `best [specialty] for kids in [city]` (Pediatric modifier)
*   `best [specialty] for females in [city]` (Gender-specific modifier)
*   `[Clinic Name] [specialty] [city]` (Branded search)
*   `[Doctor Name] [specialty] [city]` (Practitioner search)

---

## 📊 PHASE 2: SCORING METRICS & WEIGHTS

Compute the final **AI Rank** (Consolidated Score out of 100) using these five weighted categories:

```
[Google maps (30%)] + [GEO AI Apps (20%)] + [Aggregators (25%)] + [Video Presence (10%)] + [EEAT Details (15%)] = AI Rank (100%)
```

### 1. Google Maps / Local SEO (30%)
*   **30 points:** Clinic ranks in the Top 3 (Local Pack) for local area queries; verified consistent NAP.
*   **20 points:** Clinic listed but ranks #4-#10; minor NAP mismatches.
*   **10 points:** Clinic listed but unranked (>#10); major NAP mismatches.
*   **0 points:** Completely missing from Google Maps.

### 2. GEO (Generative AI Optimization) Score (20%)
*   **20 points:** Highly recommended by ChatGPT/Gemini; clear citations/structured markup.
*   **10 points:** Moderately mentioned only in generic listings.
*   **0 points:** Completely ignored or unfindable by LLM models.

### 3. Medical Aggregators (25%)
*   **25 points:** High-ranking profiles on Practo and Lybrate, with **active online slot booking enabled**.
*   **15 points:** Profiles exist but lack active slot booking (patients must call).
*   **5 points:** Profile is a basic unclaimed system auto-generation.
*   **0 points:** Completely missing.

### 4. Video & YouTube Presence (10%)
*   **10 points:** Active patient education videos or video testimonials under the doctor's/clinic's name.
*   **5 points:** 1 or 2 basic static slide-show videos.
*   **0 points:** Zero video presence.

### 5. Medical EEAT Details (15%)
*   **15 points:** Explicitly lists qualifications (BDS, MBBS, MD, MDS), **verifiable state registration/NMC number**, clinical articles/publications, and professional associations.
*   **5 points:** Basic degrees listed, but missing NMC registration, publications, and associations.
*   **0 points:** No qualifications or registrations visible online.

---

## 🏥 PHASE 3: DATA ENRICHMENT VALIDATION STANDARDS

For each doctor/clinic audited, classify all data points into **VERIFIED**, **PARTIAL**, or **MISSING** based on these standards:

| Data Category | Specific Data Point | Verification Standard | SEO Value |
| :--- | :--- | :--- | :--- |
| **Clinic Entity** | Location & Address | Must match NAP (Name, Address, Phone) across Google, Practo, and website. | Critical for Local Map Pack. |
| | Phone Number | Verified active and consistent across all directories. | High trust signal for LLMs. |
| | Visual Assets | Exterior, interior, and staff photos on Google Maps/Practo. | Major patient conversion impact. |
| **Doctor Entity** | Specialty & Experience | Years of practice explicitly stated on authoritative portals. | Establishes experience. |
| | Medical Registration | Cross-referenced state council or National Medical Commission (NMC). | Baseline medical authority signal. |
| | Education | Verified medical degrees (BDS, MDS, MBBS, MD) explicitly linked. | High trust signal. |
| | Publications | Authored medical papers, blog articles, or recognized columns. | Strong GEO citation signal. |
| | Associations | Membership in groups like IDA, IMA, or specialty boards. | High authority backlink potential. |
| **Sentiment** | Patient Reviews | Aggregated star ratings and star count across platforms. | Local SERP CTR trigger. |
| | Success Stories | Case studies, video testimonials, or long narrative reviews. | LLM conversational quote source. |

---

## 📝 PHASE 4: REPORT TEMPLATE FORMAT

Generate the final report matching this precise Markdown structure:

```markdown
# DIGICLINIC DIGITAL PRESENCE AUDIT & AI RANK REPORT

**Prepared for:** [Dr. Doctor Name]  
**Practice Specialty:** [Specialty]  
**Clinic Name:** [Clinic Name]  
**Location:** [Exact Address, Area, City]  
**Audit Date:** [Current Date]  

---

## 🏆 THE CONSOLIDATED AI RANKING
Based on the real-time crawl and multi-channel discoverability indexes:

### [🟢/🟡/🔴] [ score / 100 ] — [EXCELLENT/MODERATE/WEAK] DISCOVERABILITY
> **Diagnostic Summary:** [1-2 sentences summarizing overall digital presence, key achievements, and primary vulnerabilities.]

*   **Google Search & Maps:** [Summary of local SEO standings]
*   **Medical Aggregators (Practo/Lybrate):** [Summary of directory standings]
*   **GEO Score (AI Apps Recommended):** [Summary of Generative AI discoverability]

---

## 🔍 LOCALIZED SEARCH QUERY RANKING MATRIX
Simulated patient queries run across local search engines:

| Search Query | Google Search | Google Maps | Practo/Aggregators | YouTube | AI Apps (ChatGPT/Gemini) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **top [specialty] in [city]** | [#Rank] | [#Rank] | [#Rank] | [#Rank] | [High/Mod/Low] |
| **top [specialty] in [area]** | [#Rank] | [#Rank] | [#Rank] | [#Rank] | [High/Mod/Low] |
| **best [specialty] in [city]** | [#Rank] | [#Rank] | [#Rank] | [#Rank] | [High/Mod/Low] |
| **best [specialty] in [area]** | [#Rank] | [#Rank] | [#Rank] | [#Rank] | [High/Mod/Low] |
| **best [specialty] for kids in [city]** | [#Rank] | [#Rank] | [#Rank] | [#Rank] | [High/Mod/Low] |
| **[Clinic Name] [city]** | [#Rank] | [#Rank] | [#Rank] | [#Rank] | [High/Mod/Low] |

> [!WARNING]
> **Niche Competitor Domination:** [Document the top local competitor dominating these keywords and their estimated market capture percentage due to their SEO setup.]

---

## 🏥 ENRICHMENT AUDIT & GAP ANALYSIS

### 1. Clinic Entity Details (NAP Consistency)
*   **Location & Address:** [VERIFIED/PARTIAL/MISSING] - [Reason]
*   **Phone Number:** [VERIFIED/PARTIAL/MISSING] - [Reason]
*   **Visual Assets (Pics):** [VERIFIED/PARTIAL/MISSING] - [Reason]

### 2. Doctor Entity Details (E-E-A-T Verification)
*   **Expertise & Experience:** [VERIFIED/PARTIAL/MISSING] - [Reason]
*   **Medical Registration:** [VERIFIED/PARTIAL/MISSING] - [Reason]
*   **Publications / Articles:** [VERIFIED/PARTIAL/MISSING] - [Reason]
*   **Associations:** [VERIFIED/PARTIAL/MISSING] - [Reason]

### 3. Patient Sentiment & Trust Signals
*   **Verified Patient Reviews:** [VERIFIED/PARTIAL/MISSING] - [Reason & Star rating]
*   **Verified Patient Footfall:** [VERIFIED/PARTIAL/MISSING] - [Reason & velocity estimation]
*   **Success Stories:** [VERIFIED/PARTIAL/MISSING] - [Reason]
*   **YouTube Sentiment:** [VERIFIED/PARTIAL/MISSING] - [Reason]

---

## 💬 ACTIONABLE DYNAMIC TREATMENT PLAN (6 PILLARS)

*Provide a 6-Pillar custom timeline-based roadmap based on identified gaps:*

1.  **Pillar 1: NAP & Name Unification (7-Day Setup)**  
    [Action plan for name and location uniformity]
2.  **Pillar 2: Medical Registration Indexing (Immediate)**  
    [Action plan for NMC number crawling stabilization]
3.  **Pillar 4: Authority Domain & Local SEO Setup (15-Day Setup)**  
    [Action plan for Schema.org JSON-LD web landing page]
4.  **Pillar 4: Practo Booking & WhatsApp Sync (7-Day Setup)**  
    [Action plan for instant scheduling]
5.  **Pillar 5: Patient review loops (Ongoing)**  
    [Action plan for Google Review automation]
6.  **Pillar 6: Thought Leadership via YouTube Shorts (30-Day Setup)**  
    [Action plan for localized video content]

---

## 🛠️ WHAT WE NEED TO DO REALLY DO (Product Engineering Strategy)
*Always append these product guidelines to maintain technical alignment:*

*   **URL Localized Structure:** Renders under `/[city]/[speciality]/[report_id]` for strict Local SEO without state slugs.
*   **Supabase Modular Edge Functions:** Keep crawling, scraping, and scoring microservices parallel to `src/` inside the `supabase/functions/` directory.
*   **Footfall Verification:** Support instant proxy calculations via review velocities for acquisition, and offer direct PMS API integrations (Practo Ray/WhatsApp Booking Bot) for premium upgrades.
```

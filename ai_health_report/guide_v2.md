# DigiClinic AI Rank & SEO Report Generator Guide (Version 2)

This V2 operational blueprint defines a highly structured, channel-by-channel methodology for auditing a doctor's and clinic's online discoverability. It is designed to be fully self-contained so that any AI agent can read it, execute the precise search sequences, and output a standardized **DigiClinic Digital Presence & AI Rank Report** for any practitioner.

---

## 📂 SECTION 1: CHANNEL-BY-CHANNEL AUDIT & QUERY MATRIX

The reporting engine executes simulated query queries across four primary patient discovery channels. For each channel, check the specific details listed to categorize them as **AVAILABLE**, **MISSING**, or **CONFLICTING**.

---

### 🌐 1. GENERATIVE AI APPS (GEO - Generative Engine Optimization)
* **Objective:** Audit the doctor's and clinic's predictability of being cited and recommended by LLM-based conversational search engines.
* **Target Platforms:** ChatGPT, Gemini, Claude, Perplexity, Meta AI.

#### 🔍 Channel Search Matrix (Simulated Queries)
*   `top [speciality] in [city]` (e.g., *top dentist in Prayagraj*)
*   `best [speciality] in [city area]` (e.g., *best dentist in Naini*)
*   `best [speciality] for kids in [city]`
*   `best [speciality] for females in [city]`
*   `Is [Doctor Name] a registered [speciality] in [city]?`
*   `Which is the best clinic for [speciality] near [area], [city]?`

#### 📋 Details Categorization Standards
*   🟢 **AVAILABLE:** The LLM recommends the doctor/clinic by name, provides an accurate clinic description, and correctly references the clinic website or primary directory as a source citation.
*   🔴 **MISSING:** The LLM either returns other local practitioners, claims it has no information about the doctor/clinic, or states it cannot verify the practitioner's medical credentials.
*   🟡 **CONFLICTING:** The LLM confuses the doctor with another practitioner of a similar name, mixes up specialties (e.g., citing a dentist as a dermatologist), or points to incorrect addresses/phone numbers.

---

### 🗺️ 2. TRADITIONAL SEARCH & LOCAL MAPS (Google organic & Maps Pack)
* **Objective:** Evaluate local pack discoverability, map indexing, NAP consistency, and search ranking on traditional SERPs.
* **Target Platforms:** Google Search, Google Business Profile (GBP), Google Maps, Apple Maps.

#### 🔍 Channel Search Matrix (Simulated Queries)
*   `[speciality] in [city area]` (e.g., *dentist in Naini*)
*   `[Clinic Name] [city]` (e.g., *Pravisha Healthcare Prayagraj*)
*   `[Doctor Name] [city]` (e.g., *Dr. Vishal Maurya Prayagraj*)
*   `[Clinic Name] phone number`
*   `[Clinic Name] photos / reviews`

#### 📋 Details Categorization Standards
*   🟢 **AVAILABLE:** Google Business Profile is claimed and verified. Address matches exact physical location. Interior/exterior photos are present. Phone number is active and click-to-call enabled.
*   🔴 **MISSING:** Clinic does not have a Google Business listing. Timings of operations are completely unlisted. Visual assets (clinic photos, doctor professional headshots) are absent.
*   🟡 **CONFLICTING:** Name, Address, or Phone (NAP) details vary across search listings (e.g., listed under one name on Google Maps but a different name on directories). Timings on maps conflict with timings on local pages.

---

### 🩺 3. MEDICAL AGGREGATORS & LOCAL DIRECTORIES
* **Objective:** Audit profiles on dedicated medical listing directories and local directories for visibility, completeness, and appointment conversion potential.
* **Target Platforms:** Practo, Lybrate, Justdial, Magicpin.

#### 🔍 Channel Search Matrix (Simulated Queries)
*   `site:practo.com [Doctor Name] [city]`
*   `site:lybrate.com [Doctor Name] [speciality]`
*   `site:justdial.com [Clinic Name] [city]`
*   `[Clinic Name] reviews [city]`

#### 📋 Details Categorization Standards
*   🟢 **AVAILABLE:** Fully claimed and updated profiles. Timings, fees, qualifications, and NMC/State registration are filled out. **Active online slot booking is enabled** (Practo Book/instant scheduler).
*   🔴 **MISSING:** No profile exists on Practo or Lybrate. Claim button is visible on Justdial (unclaimed profile). Online appointment slots are completely absent (forces patient to call or visit).
*   🟡 **CONFLICTING:** Ratings or reviews are highly fragmented (e.g., 4.8★ on Justdial but unclaimed on Practo). Consultation fees or experience years listed differ across aggregators.

---

### 🎥 4. VIDEO & VISUAL SEARCH (YouTube & Thought Leadership)
* **Objective:** Verify patient trust signals, visual case studies, and clinical expertise authority through video content.
* **Target Platforms:** YouTube, YouTube Shorts.

#### 🔍 Channel Search Matrix (Simulated Queries)
*   `[Doctor Name] [speciality] [city] youtube`
*   `[Clinic Name] youtube`
*   `[speciality] treatment in [city area]` (video search)

#### 📋 Details Categorization Standards
*   🟢 **AVAILABLE:** Verified YouTube channel with patient testimonials, clinical case outcomes, before/after videos, or educational videos. Video descriptions contain active NAP information and booking links.
*   🔴 **MISSING:** Zero video footprint. Search results yield no content related to the doctor or clinic.
*   🟡 **CONFLICTING:** Videos exist but are completely outdated (older than 2 years), mention an old clinic name/address, or list inactive phone numbers.

---

## 📊 SECTION 2: THE AI RANK FORMULA (Scoring Engine)

The reporting engine must compute a consolidated **AI Rank** score out of 100 based on these four core indexes:

```
Consolidated AI Rank (100) = 
  Visibility Index (30 pts) + 
  Completeness Index (30 pts) + 
  Patient Sentiment Index (20 pts) + 
  GEO Index (20 pts)
```

### 1. Visibility Index (30 Points Max)
How often the doctor or clinic ranks in the Top 5 or Top 10 for local search terms:
*   **30 pts:** Ranks in the Top 3 on Google Local Pack AND Top 5 on Practo/Justdial for localized area searches.
*   **20 pts:** Ranks #4-#10 in Google Maps; ranks Top 10 on aggregators.
*   **10 pts:** Ranks outside the Top 10 but is indexed on search platforms.
*   **0 pts:** Completely unindexed or unranked for all keywords.

### 2. Completeness Index (30 Points Max)
Percentage of critical clinical entity details verified and active:
*   **Clinic Details (15 pts):** Location & Address (5 pts) + Phone Contact (5 pts) + Visual Assets/Photos (5 pts).
*   **Doctor Details (15 pts):** Specialties & Degrees (5 pts) + Verifiable Medical Registration/NMC Number (5 pts) + Publications/Associations (5 pts).

### 3. Patient Sentiment Index (20 Points Max)
The volume, velocity, and quality of customer ratings:
*   **20 pts:** Aggregate rating of 4.5★+ across platforms with 100+ reviews AND at least 5 verified success stories/testimonials.
*   **10 pts:** Good ratings (4.0★+) but low review volume (<20 reviews) or missing success stories.
*   **0 pts:** No ratings or negative sentiment trends (>30% negative reviews).

### 4. GEO (Generative AI Optimization) Index (20 Points Max)
Predictability of recommendations by large language models based on digital citations:
*   **20 pts:** The doctor/clinic is recommended in the Top 3 conversational outputs for area queries on Gemini and ChatGPT, citing their domain.
*   **10 pts:** The doctor/clinic is occasionally cited but has no structural schema data or direct referral links.
*   **0 pts:** Excluded from conversational recommendations due to zero EEAT verification.

---

## 📝 SECTION 3: REPORT COMPLIANCE TEMPLATE

Use this exact structure for generating the output report:

```markdown
# DIGICLINIC DIGITAL PRESENCE AUDIT & AI RANK REPORT

**Prepared for:** Dr. [Doctor Name]  
**Practice Specialty:** [Specialty]  
**Clinic Name:** [Clinic Name]  
**Location:** [Exact Address, Area, City, State]  
**Last Verified Activity:** [Date/Recent Interaction, e.g., GBP Review Reply 2 days ago]

---

## 🏆 OVERALL CONSOLIDATED AI RANK
Based on the channel-by-channel automated discoverability indexes:

### [🟢/🟡/🔴] [ Score / 100 ] — [EXCELLENT/GOOD/WEAK] DISCOVERABILITY
> **AI Insights Summary:** [2-3 sentences summarizing their strengths, major vulnerabilities, and local SERP competitive standing.]

*   **Google Maps & GBP:** [GBP Rank & local pack status]
*   **Medical Aggregators:** [Practo & directory scheduling status]
*   **GEO Recommendation Index:** [LLM citing probability summary]

---

## 🔍 CROSS-CHANNEL SEARCH QUERY RANKING MATRIX
Simulated query outcomes for the specific [City] & [Area] query matrix:

| Search Query | Google Search | Google Maps | Practo/Justdial | YouTube | AI Apps (Predictive) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **top [specialty] in [city]** | [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |
| **top [specialty] in [area]** | [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |
| **best [specialty] in [city]** | [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |
| **best [specialty] in [area]** | [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |
| **best [specialty] for kids in [city]**| [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |
| **best [specialty] for females...** | [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |
| **[Clinic Name] [city]** | [#Rank] | [#Rank] | [#Rank] | [Rank] | [High/Moderate/Low] |

> [!WARNING]
> **Primary Competitor Domination:** [Top Competitor Clinic Name] in [Area] occupies the top Local Map Pack and aggregator spots, capturing approximately [X]% of patient inquiries.

---

## 🏥 ENRICHMENT AUDIT & GAP DETAILS

### 🌐 1. Generative AI Apps (GEO)
*   **Target Queries Evaluated:** `best [specialty] in [area]`, `credentials of [Doctor Name]`
*   **Verified Details:** [List of available details, e.g., Degrees BDS, MDS]
*   **Missing Details:** [e.g., NMC Registration Number missing on directory indices, no schema-coded website]
*   **Conflicting Details:** [e.g., LLMs confuse dentistry practice with clinical dermatology tags]

### 🗺️ 2. Traditional Search & Maps
*   **Target Queries Evaluated:** `[Clinic Name] [city]`, `[Doctor Name] [specialty]`
*   **Verified Details:** [e.g., Consistent phone number on search]
*   **Missing Details:** [e.g., Clinic hours are unlisted, zero exterior/interior staff photos]
*   **Conflicting Details:** [e.g., Listed as "Health Care" on Justdial but "Hair Clinic" on Google Maps]

### 🩺 3. Medical Aggregators & Directories
*   **Target Queries Evaluated:** `site:practo.com [Doctor Name]`, `site:justdial.com [Clinic Name]`
*   **Verified Details:** [e.g., Lybrate listing exists with positive feedback]
*   **Missing Details:** [e.g., Practo profile is unclaimed and has no slot-booking integration]
*   **Conflicting Details:** [e.g., Timings listed on Lybrate mismatch Google Maps hours]

### 🎥 4. Video & Visual Search
*   **Target Queries Evaluated:** `[Doctor Name] dentist Prayagraj YouTube`
*   **Verified Details:** [e.g., None]
*   **Missing Details:** [e.g., Total absence of YouTube channel, educational reels, or video success stories]
*   **Conflicting Details:** [e.g., None]

---

## 💬 ACTIONABLE DYNAMIC TREATMENT PLAN (6 PILLARS)

1.  **Pillar 1: NAP & Name Unification (7 Days):** [Steps to resolve conflicting clinic names across Maps and directories.]
2.  **Pillar 2: NMC/Registration Indexing (Immediate):** [Update directories to list the State Medical Council registration number to trigger LLM E-E-A-T trust signals.]
3.  **Pillar 3: Schema-Rich Web Landing Page (15 Days):** [Launch an optimized landing page with local schema tags to feed conversational crawlers.]
4.  **Pillar 4: Practo Booking & WhatsApp Sync (7 Days):** [Link Practo slot booking and connect a WhatsApp automation bot for 1-click scheduling.]
5.  **Pillar 5: Patient Review Velocity Booster (Ongoing):** [Set up automated WhatsApp text prompts post-visit to collect Google Business reviews.]
6.  **Pillar 6: Visual Trust & Video SEO (30 Days):** [Produce and upload local patient success story reels on YouTube to dominate video listings.]

---

## 🛠️ TECHNICAL ARCHITECTURE COMPLIANCE

*   **Flat Local SEO URLs:** Profiles must render at `/[city]/[speciality]/[db_id]` with no state segments in the routing slug.
*   **Parallel Backend Modularity:** All channel data collection scripts (Google, Practo, Jina APIs) must remain in the `supabase/functions/` directory, parallel to the `src/` folder.
*   **Patient Footfall verification:** Proxy through review velocity (velocity and star count) for instant scans; use PMS direct API token synchronization for premium verified accounts.
```

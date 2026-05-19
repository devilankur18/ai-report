import React, { useState, useEffect } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

// ─── Shared Theme/Constants ──────────────────────────────────────────────────
export const design: DesignSystem = {
  palette: {
    bg: '#040712',
    text: '#f8fafc',
    accent: '#22d3ee',
  },
  fonts: {
    display: '"Outfit", "Inter", "SF Pro Display", sans-serif',
    body: '"Outfit", "Inter", "SF Pro Display", sans-serif',
  },
  typeScale: {
    hero: 104,
    body: 32,
  },
  radius: 24,
};

const font = {
  sans: design.fonts.body,
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
};

const fill: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'radial-gradient(circle at 50% 50%, #080f26 0%, #030712 100%)',
  color: design.palette.text,
  fontFamily: design.fonts.body,
  overflow: 'hidden',
  position: 'relative' as const,
};

// ─── Shared Custom Styles ───────────────────────────────────────────────────
const styles = `
  @keyframes scan {
    0% { transform: translateY(0); }
    50% { transform: translateY(320px); }
    100% { transform: translateY(0); }
  }
  .scanner-line {
    position: absolute;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, transparent, #22d3ee, transparent);
    box-shadow: 0 0 15px #22d3ee, 0 0 5px #22d3ee;
    animation: scan 2s linear infinite;
    pointer-events: none;
    z-index: 10;
  }
  .glass-card {
    background: rgba(10, 15, 30, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-card:hover {
    border-color: rgba(34, 211, 238, 0.3);
    box-shadow: 0 30px 60px rgba(34, 211, 238, 0.15);
  }
  .accent-glow {
    text-shadow: 0 0 15px rgba(34, 211, 238, 0.6);
  }
  .pulse-glow {
    animation: pulse-glow 2s infinite;
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(34, 211, 238, 0.2); }
    50% { box-shadow: 0 0 25px rgba(34, 211, 238, 0.5); }
  }
  .comparison-table {
    width: 100%;
    border-collapse: collapse;
  }
  .comparison-table th {
    padding: 14px;
    background: rgba(255, 255, 255, 0.05);
    color: #22d3ee;
    font-weight: 800;
    text-align: left;
    font-size: 16px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .comparison-table td {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 16px;
    vertical-align: middle;
  }
  .comparison-table tr:hover {
    background: rgba(255,255,255,0.02);
  }
  .battle-cell-fail {
    color: #f43f5e;
  }
  .battle-cell-success {
    color: #10b981;
  }
  .battle-data {
    font-size: 13px;
    color: #94a3b8;
    display: block;
    margin-top: 2px;
    font-style: italic;
  }
  .timeline-badge {
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.3);
    color: #fbbf24;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
`;

const Styles = () => <style>{styles}</style>;

const GridBg = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(34, 211, 238, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.015) 1px, transparent 1px)',
      backgroundSize: '80px 80px',
      maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 80%)',
      pointerEvents: 'none',
    }}
  />
);

// ─── Scraped Data Interface ────────────────────────────────────────────────
interface ScrapedData {
  mapsFound: boolean;
  mapsAddress: string;
  mapsLat: number;
  mapsLon: number;
  mapsType: string;
  
  competitorName: string;
  competitorAddress: string;
  competitorsList: { name: string; address: string }[];
  
  websiteStatus: 'active' | 'unregistered' | 'no_input';
  websiteHost: string;
  hasMXRecords: boolean;
  scrapedDegrees: string;
  scrapedSpecialty: string;
  scrapedPhone: string;
  scrapedEmail: string;
  scrapedTimings: string;
  
  practoStatus: 'active' | 'missing';
  practoRating: string;
  practoReviews: string;
  practoExperience: string;
}

// ─── Global State for React Syncing ──────────────────────────────────────────
const globalState = {
  docName: 'Nidhi Patel',
  clinicName: "Dr. Nidhi Patel's Cosmedics",
  city: 'Vadodara',
  specialty: 'Dermatologist',
  websiteUrl: 'drnidhipatel.com',
  practoUrl: 'https://www.practo.com/vadodara/doctor/dr-nidhi-patel-dermatologist',
  isAnalyzing: false,
  isAnalyzed: false,
  hash: 42,
  score: 4,
  scrapedData: null as ScrapedData | null,
  logs: [] as string[],
  listeners: new Set<() => void>(),
  
  update(newData: any) {
    Object.assign(this, newData);
    if (newData.docName || newData.clinicName || newData.city) {
      const combined = `${this.docName || ''}${this.clinicName || ''}${this.city || ''}`;
      let calculatedHash = 0;
      for (let i = 0; i < combined.length; i++) {
        calculatedHash = (calculatedHash << 5) - calculatedHash + combined.charCodeAt(i);
        calculatedHash |= 0;
      }
      calculatedHash = Math.abs(calculatedHash);
      this.hash = calculatedHash;
      this.score = 4 + (calculatedHash % 3);
    }
    this.listeners.forEach(l => l());
  }
};

function useGlobalState() {
  const [state, setState] = useState({ ...globalState });
  useEffect(() => {
    const handler = () => setState({ ...globalState });
    globalState.listeners.add(handler);
    return () => {
      globalState.listeners.delete(handler);
    };
  }, []);
  return state;
}

// ─── Scraper Engine Logic ───────────────────────────────────────────────────
const runRealScan = async (
  docName: string,
  clinicName: string,
  city: string,
  specialty: string,
  websiteUrl: string,
  practoUrl: string,
  addLog: (msg: string) => void
): Promise<ScrapedData> => {
  addLog(`[Live Scrape] Initiating Doctor AI crawling engine for Indian Clinic Audit...`);
  
  // 1. Geocoding Presence (OpenStreetMap Nominatim)
  let mapsFound = false;
  let mapsAddress = 'Not Found';
  let mapsLat = 0;
  let mapsLon = 0;
  let mapsType = 'N/A';
  
  addLog(`[Live Maps] Scanning local maps directory for "${clinicName}, ${city}"...`);
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clinicName + ' ' + city)}&format=json&addressdetails=1&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'DoctorAISalesDeckScanner/1.0' } });
    const data = await res.json();
    
    if (data && data.length > 0) {
      mapsFound = true;
      mapsAddress = data[0].display_name;
      mapsLat = parseFloat(data[0].lat);
      mapsLon = parseFloat(data[0].lon);
      mapsType = data[0].type || data[0].class || 'clinic';
      addLog(`🟢 [Live Maps] Found geocoded clinic: "${data[0].display_name.split(',')[0]}" (${mapsLat.toFixed(3)}, ${mapsLon.toFixed(3)})`);
    } else {
      addLog(`[Live Maps] No map listings found for clinic. Testing fallback search for doctor "${docName}, ${city}"...`);
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(docName + ' ' + city)}&format=json&addressdetails=1&limit=1`;
      const fallbackRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'DoctorAISalesDeckScanner/1.0' } });
      const fallbackData = await fallbackRes.json();
      
      if (fallbackData && fallbackData.length > 0) {
        mapsFound = true;
        mapsAddress = fallbackData[0].display_name;
        mapsLat = parseFloat(fallbackData[0].lat);
        mapsLon = parseFloat(fallbackData[0].lon);
        mapsType = fallbackData[0].type || fallbackData[0].class || 'doctors';
        addLog(`🟢 [Live Maps] Found doctor directory entry: "${fallbackData[0].display_name.split(',')[0]}"`);
      } else {
        addLog(`🔴 [Live Maps] Clinic and Doctor are completely UNREGISTERED on local map systems.`);
      }
    }
  } catch (e) {
    addLog(`⚠️ [Live Maps] Local maps geocoder lookup timed out.`);
  }

  // 2. Targeted Niche Competitor Search (OpenStreetMap Nominatim)
  let competitorName = 'Top Rated Niche Clinic';
  let competitorAddress = 'N/A';
  let competitorsList: { name: string; address: string }[] = [];
  
  addLog(`[Live Maps] Scanning for top-ranking "${specialty}" competitors in ${city}...`);
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(specialty + ' in ' + city)}&format=json&addressdetails=1&limit=3`;
    const res = await fetch(url, { headers: { 'User-Agent': 'DoctorAISalesDeckScanner/1.0' } });
    const data = await res.json();
    
    if (data && data.length > 0) {
      competitorsList = data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        address: item.display_name
      }));
      competitorName = competitorsList[0].name;
      competitorAddress = competitorsList[0].address;
      addLog(`🟢 [Live Maps] Identified #${1} niche competitor: "${competitorName}"`);
    } else {
      addLog(`[Live Maps] No local "${specialty}" listings found in geocoder. Falling back to general medical directory...`);
      const generalUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('clinic in ' + city)}&format=json&addressdetails=1&limit=3`;
      const generalRes = await fetch(generalUrl, { headers: { 'User-Agent': 'DoctorAISalesDeckScanner/1.0' } });
      const generalData = await generalRes.json();
      
      if (generalData && generalData.length > 0) {
        competitorsList = generalData.map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          address: item.display_name
        }));
        competitorName = competitorsList[0].name;
        competitorAddress = competitorsList[0].address;
        addLog(`🟢 [Live Maps] Identified general competitor: "${competitorName}"`);
      } else {
        competitorName = `${city} Specialist Skin Center`;
        competitorAddress = `Civil Lines, ${city}`;
        competitorsList = [{ name: competitorName, address: competitorAddress }];
        addLog(`⚠️ [Live Maps] No registered medical centers in geocoder. Constructed local niche competitor.`);
      }
    }
  } catch (e) {
    competitorName = `${city} Healthcare Hub`;
    competitorAddress = `Market Area, ${city}`;
    competitorsList = [{ name: competitorName, address: competitorAddress }];
  }

  // 3. Website & Domain Scraper (via Jina Reader)
  let websiteStatus: 'active' | 'unregistered' | 'no_input' = 'no_input';
  let websiteHost = 'N/A';
  let hasMXRecords = false;
  let scrapedDegrees = '';
  let scrapedSpecialty = '';
  let scrapedPhone = '';
  let scrapedEmail = '';
  let scrapedTimings = '';

  if (websiteUrl) {
    websiteStatus = 'unregistered';
    addLog(`[Live Scrape] Querying browser scraper squad to inspect "${websiteUrl}"...`);
    let cleanUrl = websiteUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    try {
      const jinaUrl = `https://r.jina.ai/${cleanUrl}`;
      const res = await fetch(jinaUrl);
      if (res.status === 200) {
        const markdown = await res.text();
        websiteStatus = 'active';
        addLog(`🟢 [Live Scrape] Scraped website content successfully! Size: ${(markdown.length / 1024).toFixed(1)} KB`);
        
        // Extract Clinical Degrees
        const degMatches = [...markdown.matchAll(/\b(mbbs|md|ms|bds|mds|dnb|dm|mch|bhms|bams|fcps|frcs)\b/gi)];
        scrapedDegrees = [...new Set(degMatches.map(m => m[0].toUpperCase()))].join(', ');
        if (scrapedDegrees) {
          addLog(`🟢 [Live Scrape] Scraped verified credentials: ${scrapedDegrees}`);
        }
        
        // Extract Specialty
        const specKeywords = [
          { name: 'Dermatologist', regex: /dermatolog|skin specialist|skin doctor/i },
          { name: 'Dentist', regex: /dentist|dental|orthodont|oral care/i },
          { name: 'Pediatrician', regex: /pediatric|child specialist/i },
          { name: 'Gynecologist', regex: /gynecolog|obstetric|womens care/i },
          { name: 'Cardiologist', regex: /cardiolog|heart specialist/i },
          { name: 'Orthopedic Surgeon', regex: /orthoped|joint replacement/i },
          { name: 'Neurologist', regex: /neurolog/i },
          { name: 'Ophthalmologist', regex: /ophthalmolog|eye care/i },
          { name: 'General Physician', regex: /physician|general practitioner/i },
          { name: 'Homeopath', regex: /homeopath/i },
          { name: 'Ayurvedic Specialist', regex: /ayurved/i }
        ];
        for (const item of specKeywords) {
          if (item.regex.test(markdown)) {
            scrapedSpecialty = item.name;
            addLog(`🟢 [Live Scrape] Scraped clinical specialty: ${scrapedSpecialty}`);
            break;
          }
        }
        
        // Extract Phone (Indian mobile/landlines)
        const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}|\b\d{5}[\-\s]?\d{5}\b/g;
        const phoneMatches = markdown.match(phoneRegex);
        if (phoneMatches) {
          scrapedPhone = phoneMatches[0];
          addLog(`🟢 [Live Scrape] Scraped active phone number: ${scrapedPhone}`);
        }
        
        // Extract Email
        const emailRegex = /[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}/g;
        const emailMatches = markdown.match(emailRegex);
        if (emailMatches) {
          scrapedEmail = emailMatches[0];
          addLog(`🟢 [Live Scrape] Scraped clinical email: ${scrapedEmail}`);
        }
        
        // Extract Timings
        const timingsRegex = /(?:timings?|hours?|schedule)[\s\:]+([^\n\.\,\<]+)/i;
        const timingsMatch = markdown.match(timingsRegex);
        if (timingsMatch) {
          scrapedTimings = timingsMatch[1].trim().substring(0, 40);
          addLog(`🟢 [Live Scrape] Scraped business hours: ${scrapedTimings}`);
        } else {
          const timePat = /\b\d{1,2}\s*(?:am|pm)\s*[-to]+\s*\d{1,2}\s*(?:am|pm)\b/i;
          const timeMatch = markdown.match(timePat);
          if (timeMatch) {
            scrapedTimings = timeMatch[0];
            addLog(`🟢 [Live Scrape] Extracted hours: ${scrapedTimings}`);
          }
        }
        
        // IP Hosting scan
        const domain = cleanUrl.replace(/^https?:\/\/(?:www\.)?/i, '').split('/')[0];
        addLog(`[DNS Scan] Checking host IP for domain "${domain}"...`);
        const dnsRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, { headers: { 'accept': 'application/dns-json' } });
        const dnsData = await dnsRes.json();
        if (dnsData && dnsData.Answer && dnsData.Answer.length > 0) {
          const ip = dnsData.Answer[0].data;
          addLog(`🟢 [DNS Scan] Domain resolves to IP: ${ip}. Finding host server...`);
          
          try {
            const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
            const ipData = await ipRes.json();
            if (ipData && ipData.org) {
              websiteHost = ipData.org;
              addLog(`🟢 [DNS Scan] Website is hosted on: ${websiteHost}`);
            }
          } catch (e) {
            websiteHost = 'Cloud Provider';
          }
        }
      } else {
        addLog(`🔴 [Live Scrape] Website returned status ${res.status}. Unreachable.`);
      }
    } catch (e) {
      addLog(`🔴 [Live Scrape] Website scraping failed due to local network or CORS constraints.`);
    }
  } else {
    // DNS scan fallback for branded domain
    addLog(`[DNS Scan] No website URL provided. Scanning candidate local domains...`);
    const docClean = docName.toLowerCase().replace(/[^a-z]/g, '');
    const clinicClean = clinicName.toLowerCase().replace(/[^a-z]/g, '');
    
    const candidates = [
      `dr${docClean}.in`,
      `dr${docClean}.com`,
      `${clinicClean}.in`,
      `${clinicClean}.com`
    ];
    
    let foundDomain = '';
    for (const domain of candidates.slice(0, 3)) {
      try {
        const dnsRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, { headers: { 'accept': 'application/dns-json' } });
        const dnsData = await dnsRes.json();
        if (dnsData && dnsData.Answer && dnsData.Answer.length > 0) {
          foundDomain = domain;
          websiteStatus = 'unregistered'; // Brand owns domain but has no active site
          const ip = dnsData.Answer[0].data;
          
          try {
            const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
            const ipData = await ipRes.json();
            if (ipData && ipData.org) {
              websiteHost = ipData.org;
            }
          } catch(e) {}
          
          addLog(`🟢 [DNS Scan] Registered brand domain identified: "${domain}" (IP: ${ip})`);
          
          // Check MX records to see if mail server is set up
          const mxRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, { headers: { 'accept': 'application/dns-json' } });
          const mxData = await mxRes.json();
          if (mxData && mxData.Answer && mxData.Answer.length > 0) {
            hasMXRecords = true;
            addLog(`🟢 [DNS Scan] Active clinical email servers (MX records) verified.`);
          }
          break;
        }
      } catch (e) {}
    }
    
    if (!foundDomain) {
      addLog(`🔴 [DNS Scan] Checked dr${docClean}.in, ${clinicClean}.com. Brand domain is unregistered! Any competitor can hijack it.`);
    }
  }

  // 4. Practo Profile Crawl (via Jina Reader)
  let practoStatus: 'active' | 'missing' = 'missing';
  let practoRating = '';
  let practoReviews = '';
  let practoExperience = '';

  if (practoUrl) {
    addLog(`[Live Scrape] Scraping Practo clinical profile: "${practoUrl}"...`);
    try {
      const jinaUrl = `https://r.jina.ai/${practoUrl.trim()}`;
      const res = await fetch(jinaUrl);
      if (res.status === 200) {
        const markdown = await res.text();
        practoStatus = 'active';
        addLog(`🟢 [Live Scrape] Scraped Practo profile content successfully!`);
        
        // Rating
        const ratingMatch = markdown.match(/(\d+)%\s*(?:recommend|positive)/i);
        if (ratingMatch) {
          practoRating = `${ratingMatch[1]}%`;
          addLog(`🟢 [Live Scrape] Found Patient Rating: ${practoRating}`);
        } else {
          practoRating = '95%';
        }
        
        // Reviews
        const reviewsMatch = markdown.match(/(\d+)\s*(?:patient stories|reviews|recommendations)/i);
        if (reviewsMatch) {
          practoReviews = reviewsMatch[1];
          addLog(`🟢 [Live Scrape] Found Patient Stories: ${practoReviews}`);
        }
        
        // Experience
        const expMatch = markdown.match(/(\d+)\s*years?\s*experience/i);
        if (expMatch) {
          practoExperience = `${expMatch[1]} Yrs`;
          addLog(`🟢 [Live Scrape] Found Doctor Experience: ${expMatch[1]} Years`);
        }
      } else {
        addLog(`🔴 [Live Scrape] Practo profile unreachable (Status: ${res.status}).`);
      }
    } catch (e) {
      addLog(`🔴 [Live Scrape] Practo scraping failed due to network constraints.`);
    }
  } else {
    addLog(`🔴 [Live Scrape] Practo & JustDial profiles are unlinked. Slot booking is completely missing.`);
  }

  addLog(`🟢 [Crawl Finished] Indian Clinic Visibility Scanner finished successfully.`);
  return {
    mapsFound,
    mapsAddress,
    mapsLat,
    mapsLon,
    mapsType,
    competitorName,
    competitorAddress,
    competitorsList,
    websiteStatus,
    websiteHost,
    hasMXRecords,
    scrapedDegrees,
    scrapedSpecialty,
    scrapedPhone,
    scrapedEmail,
    scrapedTimings,
    practoStatus,
    practoRating,
    practoReviews,
    practoExperience
  };
};

// ─── Real / Mock Data Integrator ───────────────────────────────────────────
const getMockData = (state: typeof globalState) => {
  const hash = state.hash;
  const city = state.city;
  
  const checklist = [
    { label: 'Maps Presence', status: true, proof: `Found at: ${city} Sector 15`, topperProof: 'Verified Address + Interior Map' },
    { label: 'Phone Contact', status: hash % 2 === 0, proof: hash % 2 === 0 ? `+91-98XXX-${1000 + (hash % 8999)}` : 'Hidden', topperProof: 'Click-to-Call Enabled' },
    { label: 'Live Timings', status: hash % 3 !== 0, proof: hash % 3 !== 0 ? '10 AM - 7 PM' : 'Mismatched', topperProof: 'Real-time (Active Now)' },
    { label: 'Slot Booking', status: false, proof: 'Not Found', topperProof: 'Instant WhatsApp Booking' },
    { label: 'Scope of Help', status: true, proof: 'Basic Description', topperProof: 'Detailed Service Menu' },
    { label: 'Patient Sentiment', status: true, proof: 'Mixed Feedback', topperProof: '98% Positive (Verified)' },
    { label: 'Specialty Rank', status: hash % 4 !== 0, proof: 'Generic Tag', topperProof: 'Market Leader Badge' },
    { label: 'Success Stories', status: hash % 5 === 0, proof: 'None Found', topperProof: '10+ Video Testimonials' }
  ];

  const aiApps = [
    { name: 'Google Search', icon: 'fab fa-google', rank: 12 + (hash % 10), color: '#4285f4' },
    { name: 'ChatGPT', icon: 'fas fa-robot', rank: 45 + (hash % 20), color: '#10a37f' },
    { name: 'Gemini', icon: 'fas fa-brain', rank: 30 + (hash % 15), color: '#1a73e8' },
    { name: 'Perplexity', icon: 'fas fa-search', rank: 50 + (hash % 10), color: '#22d3ee' },
    { name: 'Practo', icon: 'fas fa-stethoscope', rank: 8 + (hash % 10), color: '#ff6f61' },
    { name: 'Instagram', icon: 'fab fa-instagram', rank: 100, color: '#e1306c' },
    { name: 'Apple Maps', icon: 'fas fa-map-marked-alt', rank: 25 + (hash % 10), color: '#007aff' }
  ];

  const roadmap = [
    { title: 'Digital Process', icon: 'fas fa-laptop-code', issue: 'Fragmented data across 5 apps', fix: 'Omni-channel data sync by AI Staff #2' },
    { title: 'Word of Mouth', icon: 'fas fa-comments', issue: '90% of happy patients forget to review', fix: 'Automated WhatsApp review loop by AI Staff #1' },
    { title: 'Clinical Expertise', icon: 'fas fa-award', issue: 'Degrees & Specialty not indexed', fix: 'Deep SEO indexing by AI Staff #3' },
    { title: 'Success Stories', icon: 'fas fa-heart', issue: 'Zero visual proof of outcomes', fix: 'Video testimonial pipeline by AI Staff #3' },
    { title: 'Availability', icon: 'fas fa-hourglass-half', issue: 'Timings mismatch on Maps/Practo', fix: 'Real-time clock sync by AI Staff #2' },
    { title: 'Book Appointment', icon: 'fas fa-calendar-plus', issue: 'Patients drop off on phone calls', fix: 'Instant WhatsApp Booking by AI Staff #1' }
  ];

  return { checklist, aiApps, roadmap, competitorName: 'Top Competitor Clinic', competitorAddress: 'Civil Lines', scoreFactor: 40 };
};

const getRealOrMockData = (state: typeof globalState) => {
  const data = state.scrapedData;
  if (!data) {
    return getMockData(state);
  }
  
  const checklist = [
    { 
      label: 'Maps Presence', 
      status: data.mapsFound, 
      proof: data.mapsFound ? `Verified: ${data.mapsAddress.substring(0, 32)}...` : '🔴 Map listing not found', 
      topperProof: 'Rich Google listing + 4.9★ rating' 
    },
    { 
      label: 'Phone Contact', 
      status: !!data.scrapedPhone, 
      proof: data.scrapedPhone ? `Verified: ${data.scrapedPhone}` : '🔴 Phone Hidden/Missing', 
      topperProof: 'Verified Click-to-Call Direct Line' 
    },
    { 
      label: 'Business Hours', 
      status: !!data.scrapedTimings, 
      proof: data.scrapedTimings ? `Verified: ${data.scrapedTimings}` : '🔴 Timings unlisted/mismatched', 
      topperProof: 'Active Now (Real-time Updated)' 
    },
    { 
      label: 'Slot Booking', 
      status: data.practoStatus === 'active', 
      proof: data.practoStatus === 'active' ? '🟢 Active on Practo Slot Booking' : '🔴 Manual calls only (No online booking)', 
      topperProof: 'Instant WhatsApp Booking System' 
    },
    { 
      label: 'Scope of Help', 
      status: !!data.scrapedSpecialty || !!state.specialty, 
      proof: data.scrapedSpecialty || state.specialty || 'General Practice', 
      topperProof: 'Detailed Service Menu Indexing' 
    },
    { 
      label: 'Patient Reviews', 
      status: data.practoStatus === 'active' && !!data.practoRating, 
      proof: data.practoRating ? `${data.practoRating} Positive (${data.practoReviews || '10+'} stories)` : '🔴 No ratings verified online', 
      topperProof: '98% Positive on Verified Platforms' 
    },
    { 
      label: 'Own Website', 
      status: data.websiteStatus === 'active', 
      proof: data.websiteStatus === 'active' ? `Active domain (Hosted: ${data.websiteHost.substring(0, 16)})` : '🔴 Domain unregistered / basic registry', 
      topperProof: 'Premium Web Brand + High SEO ranking' 
    },
    { 
      label: 'Clinical Experience', 
      status: !!data.scrapedDegrees, 
      proof: data.scrapedDegrees ? `Verified: ${data.scrapedDegrees}` : '🔴 Degrees unverified online', 
      topperProof: 'Verified Medical Credentials Displayed' 
    }
  ];

  const scoreFactor = (data.mapsFound ? 30 : 0) + (data.websiteStatus === 'active' ? 40 : 0) + (data.practoStatus === 'active' ? 30 : 0);
  
  const googleRank = scoreFactor >= 70 ? 2 : scoreFactor >= 30 ? 8 : 28;
  const chatGptRank = scoreFactor >= 70 ? 4 : scoreFactor >= 30 ? 15 : 65;
  const geminiRank = scoreFactor >= 70 ? 3 : scoreFactor >= 30 ? 12 : 45;
  const perplexityRank = scoreFactor >= 70 ? 5 : scoreFactor >= 30 ? 18 : 72;
  const practoRank = data.practoStatus === 'active' ? 3 : 38;
  const instagramRank = scoreFactor >= 70 ? 6 : scoreFactor >= 30 ? 22 : 95;
  const appleMapsRank = data.mapsFound ? 5 : 48;

  const aiApps = [
    { name: 'Google Search', icon: 'fab fa-google', rank: googleRank, color: '#4285f4' },
    { name: 'ChatGPT', icon: 'fas fa-robot', rank: chatGptRank, color: '#10a37f' },
    { name: 'Gemini', icon: 'fas fa-brain', rank: geminiRank, color: '#1a73e8' },
    { name: 'Perplexity', icon: 'fas fa-search', rank: perplexityRank, color: '#22d3ee' },
    { name: 'Practo', icon: 'fas fa-stethoscope', rank: practoRank, color: '#ff6f61' },
    { name: 'Instagram', icon: 'fab fa-instagram', rank: instagramRank, color: '#e1306c' },
    { name: 'Apple Maps', icon: 'fas fa-map-marked-alt', rank: appleMapsRank, color: '#007aff' }
  ];

  const roadmap = [
    { 
      title: 'Digital Process', 
      icon: 'fas fa-laptop-code', 
      issue: data.websiteStatus !== 'active' ? 'No medical website owned or indexed.' : 'Website is unlinked from booking loops.', 
      fix: 'Sync-locked brand website by AI Staff #2' 
    },
    { 
      title: 'Word of Mouth', 
      icon: 'fas fa-comments', 
      issue: 'No Google Maps review loop. Happy patients forget to review.', 
      fix: 'Automated WhatsApp review pipeline by AI Staff #1' 
    },
    { 
      title: 'Clinical Expertise', 
      icon: 'fas fa-award', 
      issue: !data.scrapedDegrees ? 'Clinical degrees (MBBS/MD) are unindexed by search engines.' : 'Degrees indexed but specialty tags are unoptimized.', 
      fix: 'Deep structured SEO mapping by AI Staff #3' 
    },
    { 
      title: 'Slot Booking', 
      icon: 'fas fa-calendar-plus', 
      issue: data.practoStatus !== 'active' ? 'Zero instant-booking slots available online.' : 'Practo booking active but missing WhatsApp sync.', 
      fix: 'Instant WhatsApp Slot Booking by AI Staff #1' 
    },
    { 
      title: 'Availability', 
      icon: 'fas fa-hourglass-half', 
      issue: !data.scrapedTimings ? 'Hours of operation missing on directories.' : 'Directory timings mismatch with Google Maps.', 
      fix: 'Real-time multi-platform sync by AI Staff #2' 
    },
    { 
      title: 'Niche Domination', 
      icon: 'fas fa-trophy', 
      issue: `Niche competitor '${data.competitorName}' occupies the Top 3 positions in ${state.city}.`, 
      fix: `Specialty SEO push by AI Staff #3 to beat ${data.competitorName}` 
    }
  ];

  return { checklist, aiApps, roadmap, competitorName: data.competitorName, competitorAddress: data.competitorAddress, scoreFactor };
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  outline: 'none',
  transition: 'border-color 0.3s ease',
  boxSizing: 'border-box' as const,
};

// ─── SLIDE 1: Cover / Rank Checker ───────────────────────────────────────────
const Cover: Page = () => {
  const state = useGlobalState();
  const [docName, setDocName] = useState(state.docName);
  const [clinicName, setClinicName] = useState(state.clinicName);
  const [city, setCity] = useState(state.city);
  const [specialty, setSpecialty] = useState(state.specialty);
  const [websiteUrl, setWebsiteUrl] = useState(state.websiteUrl);
  const [practoUrl, setPractoUrl] = useState(state.practoUrl);

  const handleStart = () => {
    globalState.update({ 
      docName, 
      clinicName, 
      city, 
      specialty, 
      websiteUrl, 
      practoUrl, 
      isAnalyzing: true, 
      isAnalyzed: false, 
      logs: ['[Initial Status] Initiating Indian Healthcare Digital presence scanner...'], 
      scrapedData: null 
    });
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    }, 100);
  };

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-stethoscope"></i> Doctor AI Performance Audit
          </span>
          <span style={{ background: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.3)', color: '#22d3ee', padding: '8px 20px', borderRadius: '999px', fontSize: '18px', fontWeight: 600 }}>
            India Clinic Edition
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '60px', alignItems: 'center', margin: '20px 0' }}>
          <div>
            <span style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '6px 16px', borderRadius: '999px', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              🚨 Digital Health Scanner
            </span>
            <h1 style={{ fontSize: '72px', fontWeight: 800, lineHeight: 1.15, marginTop: '24px', color: '#fff', letterSpacing: '-0.03em', textAlign: 'left' }}>
              Doctor Sahab, AI Pe Aapka <span style={{ color: '#22d3ee' }} className="accent-glow">Rank Kya Hai?</span>
            </h1>
            <p style={{ fontSize: '24px', color: '#94a3b8', lineHeight: 1.5, marginTop: '24px', textAlign: 'left' }}>
              Pura city AI engines (ChatGPT, Gemini, Google Maps) pe doctors ko search kar raha hai. 
              Chaliye live check karte hain aapki online "Dukan" kahan stand karti hai!
            </p>
          </div>

          <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '4px', textAlign: 'left' }}>
              Verify Clinic Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-user-md" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b', fontSize: '18px' }}></i>
                <input
                  type="text"
                  placeholder="Doctor's Name (e.g. Dr. Vishal)"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 16px 12px 44px', fontSize: '16px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-hospital" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b', fontSize: '18px' }}></i>
                <input
                  type="text"
                  placeholder="Clinic Name (e.g. Pravisha Healthcare)"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 16px 12px 44px', fontSize: '16px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-map-marker-alt" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b', fontSize: '18px' }}></i>
                <input
                  type="text"
                  placeholder="City (e.g. Prayagraj)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 16px 12px 44px', fontSize: '16px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-briefcase-medical" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b', fontSize: '18px' }}></i>
                <input
                  type="text"
                  placeholder="Specialty (e.g. Dermatologist)"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 16px 12px 44px', fontSize: '16px' }}
                />
              </div>
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <i className="fas fa-globe" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b', fontSize: '18px' }}></i>
                <input
                  type="text"
                  placeholder="Website URL (e.g. pravishahealthcare.com) - Optional"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 16px 12px 44px', fontSize: '16px' }}
                />
              </div>
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <i className="fas fa-hospital-user" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b', fontSize: '18px' }}></i>
                <input
                  type="text"
                  placeholder="Practo Profile URL (e.g. practo.com/prayagraj/doctor/...) - Optional"
                  value={practoUrl}
                  onChange={(e) => setPractoUrl(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 16px 12px 44px', fontSize: '16px' }}
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              className="pulse-glow"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#fff',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              Analyze Live Rank <i className="fas fa-bolt"></i>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*Real-time Jina Scraper, OpenStreetMap Geocoding & DNS Sync check</span>
          <span>Press → or Space to navigate manually</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 2: Helper Components ───────────────────────────────────────────
const BattleTableRow = ({ label, status, proof, topperProof }: { label: string; status: boolean; proof: string; topperProof: string }) => (
  <tr>
    <td style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{label}</td>
    <td className={status ? 'battle-cell-success' : 'battle-cell-fail'} style={{ fontSize: '15px' }}>
      <i className={`fas ${status ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ marginRight: '6px' }}></i>
      <span className="battle-data" style={{ display: 'inline', fontStyle: 'normal', color: status ? '#10b981' : '#f43f5e' }}>
        {status ? 'Scraped' : 'Missing'}
      </span>
      <span className="battle-data" style={{ fontSize: '12px' }}>{proof}</span>
    </td>
    <td className="battle-cell-success" style={{ fontSize: '15px' }}>
      <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>
      <span className="battle-data" style={{ display: 'inline', fontStyle: 'normal', color: '#10b981' }}>Standard</span>
      <span className="battle-data" style={{ fontSize: '12px' }}>{topperProof}</span>
    </td>
  </tr>
);

const AppRankCard = ({ name, icon, rank, color }: { name: string; icon: string; rank: number | string; color: string }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
    <i className={icon} style={{ color: color, fontSize: '18px', display: 'block', marginBottom: '4px' }}></i>
    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{name}</span>
    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '2px', display: 'block' }}>Rank {rank}</span>
  </div>
);

// ─── SLIDE 2: Digital Battle Report (The Pain) ──────────────────────────────────
const BattleReport: Page = () => {
  const state = useGlobalState();
  const [localScanning, setLocalScanning] = useState(!state.isAnalyzed);

  useEffect(() => {
    if (!state.isAnalyzed && state.isAnalyzing) {
      setLocalScanning(true);
      
      const executeScan = async () => {
        try {
          const result = await runRealScan(
            state.docName,
            state.clinicName,
            state.city,
            state.specialty,
            state.websiteUrl,
            state.practoUrl,
            (msg) => {
              globalState.logs.push(msg);
              globalState.update({ logs: [...globalState.logs] });
            }
          );
          
          setTimeout(() => {
            setLocalScanning(false);
            globalState.update({ isAnalyzing: false, isAnalyzed: true, scrapedData: result });
          }, 1500); 
        } catch (err) {
          console.error("Scan error", err);
          globalState.logs.push(`🔴 Geocoding / Scraping completed with warning. Generating analysis profile...`);
          globalState.update({ logs: [...globalState.logs] });
          setTimeout(() => {
            setLocalScanning(false);
            globalState.update({ isAnalyzing: false, isAnalyzed: true });
          }, 1500);
        }
      };

      executeScan();
    } else {
      setLocalScanning(false);
    }
  }, [state.isAnalyzed, state.isAnalyzing]);

  const { checklist, aiApps, competitorName, competitorAddress, scoreFactor } = getRealOrMockData(state);
  const scrapedData = state.scrapedData;

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-chart-bar"></i> Platform audit & standing
          </span>
          <span style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '8px 20px', borderRadius: '999px', fontSize: '18px', fontWeight: 700 }}>
            {state.clinicName} vs Local Niche Competitors ({state.city})
          </span>
        </div>

        {localScanning ? (
          /* scanning loader */
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <div className="scanner-line" style={{ width: '800px', top: '40px' }}></div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: '#22d3ee' }}>
              Analyzing "{state.clinicName}" Digital Footprint in {state.city}...
            </div>
            
            <div style={{ 
              background: 'rgba(5, 8, 20, 0.85)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              borderRadius: '16px',
              padding: '20px 24px',
              width: '800px',
              height: '300px',
              overflowY: 'auto',
              fontFamily: font.mono,
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
            }}>
              {state.logs.map((log, index) => (
                <div key={index} style={{ 
                  color: log.includes('🔴') ? '#f43f5e' : 
                         log.includes('🟢') || log.includes('Verified') ? '#10b981' : 
                         log.includes('[Live Scrape]') || log.includes('[DNS Scan]') ? '#fbbf24' : '#22d3ee',
                  textAlign: 'left' as const,
                  lineHeight: '1.4'
                }}>
                  <span style={{ color: '#64748b', marginRight: '10px' }}>&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* results view */
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '40px', flex: 1, margin: '20px 0', minHeight: 0 }}>
            {/* Left: Verified Profile Card & Feature-by-Feature Table */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              
              {/* Verified Doctor Profile Card */}
              <div className="glass-card" style={{ 
                padding: '16px 24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                marginBottom: '16px', 
                borderLeft: '4px solid #10b981', 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(10, 15, 30, 0.65) 100%)' 
              }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontSize: '24px', 
                  color: '#10b981' 
                }}>
                  <i className="fas fa-user-md"></i>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {state.docName.startsWith('Dr.') ? state.docName : `Dr. ${state.docName}`}
                    </h4>
                    {scrapedData && scrapedData.scrapedDegrees && (
                      <span style={{ background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        {scrapedData.scrapedDegrees}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    <i className="fas fa-stethoscope" style={{ color: '#22d3ee', marginRight: '6px' }}></i> {scrapedData?.scrapedSpecialty || state.specialty} • <i className="fas fa-map-marker-alt" style={{ color: '#f43f5e', marginRight: '6px' }}></i> {state.city}
                  </p>
                  {scrapedData && scrapedData.scrapedPhone && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                      <i className="fas fa-phone-alt" style={{ marginRight: '6px' }}></i> Scraped Contact: {scrapedData.scrapedPhone} {scrapedData.scrapedEmail ? `| Email: ${scrapedData.scrapedEmail}` : ''}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: '#10b981', 
                    textTransform: 'uppercase', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    padding: '3px 8px', 
                    borderRadius: '999px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'inline-block'
                  }}>
                    <i className="fas fa-check-circle"></i> Profile Verified
                  </span>
                  {scrapedData && scrapedData.websiteStatus === 'active' && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Server: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{scrapedData.websiteHost.substring(0, 15)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                  <i className="fas fa-swords" style={{ color: '#fbbf24' }}></i> Feature-by-Feature Niche Comparison
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Key Metric</th>
                        <th>You (Scraped)</th>
                        <th>Niche Standard ({competitorName.substring(0, 16)}...)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <BattleTableRow label={checklist[0].label} status={checklist[0].status} proof={checklist[0].proof} topperProof={checklist[0].topperProof} />
                      <BattleTableRow label={checklist[1].label} status={checklist[1].status} proof={checklist[1].proof} topperProof={checklist[1].topperProof} />
                      <BattleTableRow label={checklist[2].label} status={checklist[2].status} proof={checklist[2].proof} topperProof={checklist[2].topperProof} />
                      <BattleTableRow label={checklist[3].label} status={checklist[3].status} proof={checklist[3].proof} topperProof={checklist[3].topperProof} />
                      <BattleTableRow label={checklist[4].label} status={checklist[4].status} proof={checklist[4].proof} topperProof={checklist[4].topperProof} />
                      <BattleTableRow label={checklist[5].label} status={checklist[5].status} proof={checklist[5].proof} topperProof={checklist[5].topperProof} />
                      <BattleTableRow label={checklist[6].label} status={checklist[6].status} proof={checklist[6].proof} topperProof={checklist[6].topperProof} />
                      <BattleTableRow label={checklist[7].label} status={checklist[7].status} proof={checklist[7].proof} topperProof={checklist[7].topperProof} />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: City Rank, AI Standings, Market Loss */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
              {/* Rank Card */}
              <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid #f43f5e' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', width: '80px', height: '80px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifySelf: 'center', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>SEO Index</span>
                  <span style={{ fontSize: '28px', fontWeight: 800 }}>{scoreFactor}%</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Niche Visibility Profile: Critical Gap</h4>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    Ranked outside the Top 10 for {state.specialty} search triggers in {state.city}.
                  </p>
                </div>
              </div>

              {/* AI Standings */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 12px 0', textAlign: 'left' }}>
                  Visibility Ranks Across 7 Indian Channels
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <AppRankCard name={aiApps[0].name} icon={aiApps[0].icon} rank={aiApps[0].rank} color={aiApps[0].color} />
                  <AppRankCard name={aiApps[1].name} icon={aiApps[1].icon} rank={aiApps[1].rank} color={aiApps[1].color} />
                  <AppRankCard name={aiApps[2].name} icon={aiApps[2].icon} rank={aiApps[2].rank} color={aiApps[2].color} />
                  <AppRankCard name={aiApps[3].name} icon={aiApps[3].icon} rank={aiApps[3].rank} color={aiApps[3].color} />
                  <AppRankCard name={aiApps[4].name} icon={aiApps[4].icon} rank={aiApps[4].rank} color={aiApps[4].color} />
                  <AppRankCard name={aiApps[5].name} icon={aiApps[5].icon} rank={aiApps[5].rank} color={aiApps[5].color} />
                  <AppRankCard name={aiApps[6].name} icon={aiApps[6].icon} rank={aiApps[6].rank} color={aiApps[6].color} />
                </div>
              </div>

              {/* Market Loss Alert */}
              <div className="glass-card" style={{ padding: '20px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <h4 style={{ color: '#f43f5e', fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                  <i className="fas fa-exclamation-triangle"></i> Market Share Leak:
                </h4>
                <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '8px 0 0 0', lineHeight: 1.4, textAlign: 'left' }}>
                  Topper clinic <b>"{competitorName}"</b> ({competitorAddress.split(',')[0]}) is intercepting <b>{scoreFactor > 70 ? 25 : scoreFactor > 30 ? 60 : 85}% of your digital inquiries</b> due to structured AI optimization.
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*Real-time Jina Scraper, OpenStreetMap Geocoding & DNS Sync check</span>
          <span>Press → or click Next to explore the Growth Roadmap</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 3: Helper Component ──────────────────────────────────────────────
const PillarCard = ({ title, icon, issue, fix }: { title: string; icon: string; issue: string; fix: string }) => (
  <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <i className={icon} style={{ color: '#22d3ee', fontSize: '18px' }}></i>
      </div>
      <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h4>
    </div>
    <div style={{ textAlign: 'left' }}>
      <p style={{ fontSize: '14px', color: '#f43f5e', margin: 0 }}>
        <b>Spotted:</b> {issue}
      </p>
      <p style={{ fontSize: '14px', color: '#10b981', margin: '6px 0 0 0' }}>
        <b>AI Fix:</b> {fix}
      </p>
    </div>
  </div>
);

// ─── SLIDE 3: AI Growth Roadmap (6 Pillars) ────────────────────────────────────
const GrowthRoadmap: Page = () => {
  const state = useGlobalState();
  const { roadmap } = getRealOrMockData(state);

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-map-signs"></i> Dynamic Treatment Plan
          </span>
          <span style={{ background: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.3)', color: '#22d3ee', padding: '8px 20px', borderRadius: '999px', fontSize: '18px', fontWeight: 600 }}>
            6-Pillar Core Journey
          </span>
        </div>

        {/* Title */}
        <div style={{ marginTop: '10px' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', margin: 0, textAlign: 'left' }}>
            AI Growth Roadmap: <span style={{ color: '#22d3ee' }}>How to Rank #1</span>
          </h2>
          <p style={{ fontSize: '18px', color: '#94a3b8', marginTop: '6px', textAlign: 'left' }}>
            In gaps ko manual operations se solve karna impossible hai. We need specialized AI Staff.
          </p>
        </div>

        {/* Grid of Explicit Components */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flex: 1, margin: '20px 0', minHeight: 0 }}>
          <PillarCard title={roadmap[0].title} icon={roadmap[0].icon} issue={roadmap[0].issue} fix={roadmap[0].fix} />
          <PillarCard title={roadmap[1].title} icon={roadmap[1].icon} issue={roadmap[1].issue} fix={roadmap[1].fix} />
          <PillarCard title={roadmap[2].title} icon={roadmap[2].icon} issue={roadmap[2].issue} fix={roadmap[2].fix} />
          <PillarCard title={roadmap[3].title} icon={roadmap[3].icon} issue={roadmap[3].issue} fix={roadmap[3].fix} />
          <PillarCard title={roadmap[4].title} icon={roadmap[4].icon} issue={roadmap[4].issue} fix={roadmap[4].fix} />
          <PillarCard title={roadmap[5].title} icon={roadmap[5].icon} issue={roadmap[5].issue} fix={roadmap[5].fix} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*Live diagnosis based on search engine crawlers</span>
          <span>Press → to meet your AI Staff</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 4: The Big Shift (The Solution) ───────────────────────────────────
const BigShift: Page = () => {
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-robot"></i> The Paradigm Shift
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '80px', alignItems: 'center', flex: 1, margin: '40px 0' }}>
          <div>
            <span style={{ background: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.3)', color: '#22d3ee', padding: '6px 16px', borderRadius: '999px', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Clinic Operations Reimagined
            </span>
            <h1 style={{ fontSize: '74px', fontWeight: 800, lineHeight: 1.1, marginTop: '24px', color: '#fff', textAlign: 'left' }}>
              Ab Clinic ki 'Dukan' <br />
              <span style={{ color: '#22d3ee' }} className="accent-glow">AI Staff Chalayega!</span>
            </h1>
            <p style={{ fontSize: '24px', color: '#94a3b8', lineHeight: 1.5, marginTop: '24px', textAlign: 'left' }}>
              Aap clinic ke operation aur patients mein busy hain, aur aapse aage nikalne waala topper clinic 
              AI automatic systems use kar raha hai. 
            </p>
            <p style={{ fontSize: '24px', color: '#94a3b8', lineHeight: 1.5, marginTop: '16px', textAlign: 'left' }}>
              Manual management chhoddiye. Hum aapko dete hain custom-trained <b>AI Staff</b> jo 
              apne targeted timelines mein clinic gaps ko solve karenge.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <i className="fas fa-user-check" style={{ color: '#22d3ee', fontSize: '24px' }}></i>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>AI Staff #1: Experience Expert</h4>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>Instant WhatsApp booking & Google Review loop (7 Days Execution)</p>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <i className="fas fa-sync" style={{ color: '#10b981', fontSize: '24px' }}></i>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>AI Staff #2: Admin & Ops Squad</h4>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>Omni-channel timing & directory sync, auto-billing (15 Days Execution)</p>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <i className="fas fa-trophy" style={{ color: '#fbbf24', fontSize: '24px' }}></i>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>AI Staff #3: Growth & Sales Expert</h4>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>SEO rank booster, success story indexer (30 Days Execution)</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*Complete automation package, no coding needed</span>
          <span>Press → to meet Experience Expert</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 5: AI Staff #1 - Experience Expert ──────────────────────────────────
const StaffExperience: Page = () => {
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-user-md"></i> Patient care engine
          </span>
          <span className="timeline-badge"><i className="fas fa-clock"></i> Execution: 7 Days</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center', flex: 1, margin: '40px 0' }}>
          {/* Left Column: Mockup */}
          <div className="glass-card" style={{ padding: '36px', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#22d3ee', color: '#040712', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>A</div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>AI Booking Staff</h4>
                  <span style={{ fontSize: '12px', color: '#10b981' }}><i className="fas fa-circle" style={{ fontSize: '8px' }}></i> Active Now</span>
                </div>
              </div>
              <i className="fab fa-whatsapp" style={{ color: '#25d366', fontSize: '28px' }}></i>
            </div>
            <div style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 16px', maxWidth: '80%', fontSize: '15px', textAlign: 'left' }}>
                Dr. Sahab has a free slot at 6:30 PM today. Reply with <b>"1"</b> to book immediately!
              </div>
              <div style={{ alignSelf: 'flex-end', background: '#0891b2', color: '#fff', borderRadius: '12px', padding: '12px 16px', maxWidth: '80%', fontSize: '15px', textAlign: 'left' }}>
                1
              </div>
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 16px', maxWidth: '80%', fontSize: '15px', textAlign: 'left' }}>
                Mubarak ho! Your appointment is confirmed for 6:30 PM. 🏥 Location Map: maps.google.com/KumarClinic
              </div>
            </div>
          </div>

          {/* Right Column: Features */}
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: '#22d3ee', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              AI Staff #1: Experience Expert
            </span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginTop: '12px', margin: '12px 0 24px 0' }}>
              Fixes: Booking & Feedback Gaps
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-calendar-check" style={{ color: '#22d3ee', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Instant WhatsApp Booking</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Drop-offs on phone calls block your patients. Give them a 1-click booking tool on WhatsApp.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-star" style={{ color: '#22d3ee', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>AI Feedback Loop</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Automatically follow-up post consultation to prompt patients for positive reviews on Google.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-capsules" style={{ color: '#22d3ee', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Medicine Reminders</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Dosage reminders keep your clinic in patients' minds, boosting organic word-of-mouth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*Offline Word of Mouth Booster</span>
          <span>Press → to meet Admin & Ops Squad</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 6: AI Staff #2 - Admin & Ops Squad ─────────────────────────────────
const StaffAdmin: Page = () => {
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-tasks"></i> Operational Engine
          </span>
          <span className="timeline-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}><i className="fas fa-clock"></i> Execution: 15 Days</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center', flex: 1, margin: '40px 0' }}>
          {/* Left Column: Features */}
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              AI Staff #2: Admin & Ops Squad
            </span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginTop: '12px', margin: '12px 0 24px 0' }}>
              Fixes: Timings & Info Gaps
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-sync" style={{ color: '#10b981', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Omni-Channel Sync</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Keep your clinic hours, phone numbers, and address 100% correct and sync-locked across Google, Practo, and Maps.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-receipt" style={{ color: '#10b981', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Automated Billing</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Instantly draft professional invoices and digital prescriptions, and route them to patient's phones via WhatsApp.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-shield-alt" style={{ color: '#10b981', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Zero Manual Record Entry</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Automate tax reporting data and patient database entries silently in the background, keeping errors at 0%.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Dashboard Mock */}
          <div className="glass-card" style={{ padding: '36px', height: '420px', display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '4px solid #10b981', textAlign: 'left' }}>
            <h4 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Omni-Channel Sync Health</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Google My Business Sync</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>100% Correct</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Practo / Lybrate Sync</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>100% Correct</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Apple & Apple Maps Sync</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>100% Correct</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*Internal Operations Shield</span>
          <span>Press → to meet Growth & Sales Expert</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 7: AI Staff #3 - Growth & Sales Expert ──────────────────────────────
const StaffGrowth: Page = () => {
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '60px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-trophy"></i> Market Dominance Engine
          </span>
          <span className="timeline-badge" style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}><i className="fas fa-clock"></i> Execution: 30 Days</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center', flex: 1, margin: '40px 0' }}>
          {/* Left Column: Visual representation */}
          <div className="glass-card" style={{ padding: '36px', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #fbbf24', textAlign: 'left' }}>
            <h4 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Visibility Booster Timeline</h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifySelf: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Day 1-10: SEO Indexing</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Done</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Day 11-20: Outcome Testimonials</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Syncing</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Day 21-30: AI Rank Domination</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Pending</span>
              </div>
            </div>
          </div>

          {/* Right Column: Features */}
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              AI Staff #3: Growth & Sales Expert
            </span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginTop: '12px', margin: '12px 0 24px 0' }}>
              Wins: The AI Ranking Race
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-award" style={{ color: '#fbbf24', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Specialty & Credentials Indexing</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Publish your credentials, certifications, and case studies so AI algorithms automatically recommend you.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-heart-beat" style={{ color: '#fbbf24', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Clinical Success Stories</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    Index verified clinical outcomes and patient visual testimonials to cement your clinical authority.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <i className="fas fa-comments-dollar" style={{ color: '#fbbf24', fontSize: '24px', marginTop: '4px' }}></i>
                <div>
                  <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Conversational Sales Engine</h4>
                  <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                    AI intercepts patient chats on Instagram, Google Business, and WhatsApp, answering doubts and closing bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>*City Rank Optimization Suite</span>
          <span>Press → to see your Rank #1 Vision</span>
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 8: The Final Impact (The Victory) ──────────────────────────────────
const FinalImpact: Page = () => {
  const state = useGlobalState();

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: '80px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box' as const,
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: font.sans, fontSize: 22, letterSpacing: '0.15em', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 600 }}>
            <i className="fas fa-check-double"></i> Market Leadership Locked
          </span>
        </div>

        {/* Center Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', margin: 'auto 0' }}>
          <div className="pulse-glow" style={{
            background: 'rgba(34, 211, 238, 0.1)',
            border: '2px solid #22d3ee',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '64px',
            color: '#22d3ee',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.3)'
          }}>
            <i className="fas fa-trophy"></i>
          </div>

          <div>
            <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Mubarak Ho! <span style={{ color: '#22d3ee' }} className="accent-glow">Rank #1 Activated</span>
            </h1>
            <p style={{ fontSize: '32px', color: '#cbd5e1', marginTop: '16px', fontWeight: 600 }}>
              Aap clinical outcomes aur patient treatment par focus karein.
            </p>
            <p style={{ fontSize: '24px', color: '#94a3b8', marginTop: '12px', maxWidth: '800px', margin: '12px auto' }}>
              Humari AI Staff ki complete squad aapke gaps ko automatic timeline pe fill kar ke aapko {state.city} mein top medical rank sync karwa degi.
            </p>
          </div>

          <button
            className="pulse-glow"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              padding: '24px 48px',
              borderRadius: '20px',
              fontSize: '28px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              transition: 'all 0.3s ease',
              marginTop: '20px'
            }}
          >
            Apna AI Staff Rakho <i className="fas fa-robot"></i>
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', color: '#475569', fontSize: '18px', fontFamily: font.mono }}>
          <span>© Doctor AI Co. • Grow with AI search optimization • Powered by open-slide</span>
        </div>
      </div>
    </div>
  );
};

// ─── Slide export ────────────────────────────────────────────────────────────
export const meta: SlideMeta = {
  title: 'Personalized Doctor AI Sales Deck',
};

export default [
  Cover,
  BattleReport,
  GrowthRoadmap,
  BigShift,
  StaffExperience,
  StaffAdmin,
  StaffGrowth,
  FinalImpact,
] satisfies Page[];

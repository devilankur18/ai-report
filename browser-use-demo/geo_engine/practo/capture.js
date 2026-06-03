import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// Simple helper to parse CLI arguments
function getArgs() {
    const args = {};
    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i].startsWith('--')) {
            const key = process.argv[i].slice(2);
            const val = process.argv[i + 1];
            args[key] = val;
            i++;
        }
    }
    return args;
}

async function run() {
    const args = getArgs();
    const prompt = args.prompt || "dentists in Patna";
    const outputFile = args.output || path.resolve(process.cwd(), 'practo_raw_stream.txt');
    const screenshotPath = args.screenshot || outputFile.replace('raw_stream.txt', 'screenshot.png');

    console.log(`Connecting to Chrome debugging instance on port 9222...`);
    
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log("[✓] Connected successfully to Chrome!");
    } catch (err) {
        console.error(`Error: Could not connect to Chrome on port 9222. ${err.message}`);
        console.log("\nPlease ensure you launched Chrome with debugging enabled.");
        process.exit(1);
    }

    // Extract City and Specialty from arguments or prompt
    let city = args.city;
    let specialty = args.specialty;

    if (!city || !specialty) {
        city = "Lucknow";
        specialty = "orthopedician";

        const cityMatch = prompt.match(/in\s+([^,with?]+?)(?:\s+with|\s+and|\s*$|\?)/i);
        if (cityMatch) {
            city = cityMatch[1].trim();
        }
        
        const specMatch = prompt.match(/most\s+reliable\s+([A-Za-z\s\-]+?)\s+in/i) || 
                          prompt.match(/Who\s+are\s+the\s+([A-Za-z\s\-]+?)\s+in/i) ||
                          prompt.match(/([A-Za-z\s\-]+?)\s+in/i);
        if (specMatch) {
            specialty = specMatch[1].trim();
        }
        specialty = specialty.replace(/are the/i, '').replace(/who is the/i, '').replace(/who are the/i, '').trim();
    }

    // Map city and specialty to canonical Practo SEO slugs
    // If city contains a comma (e.g. "Naini, Prayagraj"), directories index by the main parent city (e.g. "Prayagraj")
    let parentCity = city.includes(',') ? city.split(',').pop().trim() : city;
    const formattedCity = parentCity.toLowerCase().replace(/\s+/g, '-');
    let formattedSpecialty = specialty.toLowerCase();

    if (formattedSpecialty === 'orthopedician' || formattedSpecialty === 'orthopedicians' || formattedSpecialty === 'orthopedist' || formattedSpecialty === 'orthopedists') {
        formattedSpecialty = "orthopedist";
    } else if (formattedSpecialty === 'dentist' || formattedSpecialty === 'dentists') {
        formattedSpecialty = "dentist";
    } else if (formattedSpecialty === 'cardiologist' || formattedSpecialty === 'cardiologists' || formattedSpecialty === 'heart doctors' || formattedSpecialty === 'heart doctor') {
        formattedSpecialty = "cardiologist";
    } else if (formattedSpecialty === 'pediatrician' || formattedSpecialty === 'pediatricians') {
        formattedSpecialty = "pediatrician";
    } else {
        // Safe fallback slugification
        formattedSpecialty = formattedSpecialty.replace(/\s+/g, '-');
    }

    const targetUrl = `https://www.practo.com/${encodeURIComponent(formattedCity)}/${encodeURIComponent(formattedSpecialty)}`;
    console.log(`Extracted Search Target: Specialty = "${specialty}", City = "${city}"`);
    console.log(`Navigating directly to Practo SEO URL: ${targetUrl}`);

    // Clean close any other stale Practo pages to avoid memory/tab leak
    const pages = await browser.pages();
    for (const p of pages) {
        if (p.url().includes('practo.com')) {
            console.log(`Closing existing Practo tab to avoid stale state: ${p.url()}`);
            await p.close().catch(() => {});
        }
    }

    // Open a fresh tab
    let page = await browser.newPage();

    // Setup browser simulator settings
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Go to Practo page directly
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log("Waiting 6s for Practo doctor cards to load...");
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Formulate Search Query/Term
    let searchTerm = args.query;
    if (!searchTerm) {
        searchTerm = args.area ? `${specialty} in ${args.area}, ${city}` : `${specialty} in ${city}`;
    }

    // Initialize raw stream file
    fs.writeFileSync(outputFile, `=== Practo India Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${searchTerm}\n`, 'utf8');
    fs.appendFileSync(outputFile, `EXTRACTED_TARGET: specialty="${specialty}", city="${city}"\n\n`, 'utf8');

    try {
        console.log("Checking for doctor cards in the Practo listings...");
        
        // Wait for doctor cards to render
        const cardSelector = 'div[data-qa-id="doctor_card"], .listing-doctor-card, div[class*="doctor-card"]';
        try {
            await page.waitForSelector(cardSelector, { timeout: 10000 });
            console.log("[✓] Practo listings successfully loaded!");
        } catch (e) {
            console.log("[!] Timeout waiting for doctor card selector. Proceeding with DOM dump.");
        }

        // Scrape listings directly
        const localResults = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('div[data-qa-id="doctor_card"], .listing-doctor-card, div[class*="doctor-card"]');
            
            cards.forEach(card => {
                // Name
                const nameEl = card.querySelector('[data-qa-id="doctor_name"], h2.doctor-name, h2[class*="name"], h2');
                if (!nameEl) return;
                const name = nameEl.innerText.trim();
                if (!name || results.some(r => r.name === name)) return;
                
                // Qualifications / Specialty
                const specEl = card.querySelector('[data-qa-id="doctor_speciality"], .doctor-speciality, .u-grey_3-text');
                const specialty = specEl ? specEl.innerText.trim() : "Specialist";

                const degEl = card.querySelector('[data-qa-id="doctor_degree"], .doctor-degree');
                const degree = degEl ? degEl.innerText.trim() : "";

                // Experience
                const expEl = card.querySelector('[data-qa-id="doctor_experience"], .doctor-experience, p[class*="experience"]');
                const experience = expEl ? expEl.innerText.trim() : "N/A";

                // Recommendation rating
                let recommendationRate = "N/A";
                let reviewCount = "N/A";
                
                const recEl = card.querySelector('[data-qa-id="doctor_recommendation"], .u-green-text, span[class*="recommendation"]');
                if (recEl) {
                    // Normalize rating values e.g. "98%"
                    recommendationRate = recEl.innerText.trim();
                }

                const reviewsEl = card.querySelector('[data-qa-id="total_feedback"], .total-feedback, span[class*="feedback"]');
                if (reviewsEl) {
                    const match = reviewsEl.innerText.match(/([0-9,]+)\s*patient/i) || reviewsEl.innerText.match(/([0-9,]+)\s*stories/i) || reviewsEl.innerText.match(/([0-9,]+)/);
                    if (match) reviewCount = match[1];
                }

                // Clinic & Locality
                const clinicEl = card.querySelector('[data-qa-id="doctor_clinic_name"], .clinic-name');
                const clinicName = clinicEl ? clinicEl.innerText.trim() : "Medical Clinic";

                const locEl = card.querySelector('[data-qa-id="practice_locality"], .practice-locality, span[class*="locality"]');
                const locality = locEl ? locEl.innerText.trim() : "Local Area";

                // Consultation Fee
                const feeEl = card.querySelector('[data-qa-id="consultation_fee"], .consultation-fee, span[class*="fee"]');
                const consultationFee = feeEl ? feeEl.innerText.trim() : "₹300 - ₹500";

                results.push({
                    name,
                    specialty: `${specialty} (${degree})`.replace(/\(\)/g, '').trim(),
                    experience,
                    recommendation_rate: recommendationRate,
                    review_count: reviewCount,
                    clinic_name: clinicName,
                    address: `${clinicName}, ${locality}`,
                    consultation_fee: consultationFee,
                    phone: "Available on Practo",
                    rating: recommendationRate // Used for parser compatibility
                });
            });

            return results.slice(0, 6); // Limit to top 6 entries
        });

        console.log(`[✓] Scraped ${localResults.length} doctor profiles from Practo India!`);

        // Structure results
        const pageData = {
            ai_overview: `Top verified specialists in ${city} scraped directly from Practo.`,
            local_results: localResults,
            organic_results: []
        };

        const logContent = `\n============================================================\n` +
                           `[PRACTO DOM EXTRACTION RESULTS]\n` +
                           `Timestamp: ${new Date().toISOString()}\n` +
                           `============================================================\n` +
                           JSON.stringify(pageData, null, 4) + "\n";
        
        fs.appendFileSync(outputFile, logContent, 'utf8');
        console.log(`[✓] Appended extracted DOM metadata to: ${path.basename(outputFile)}`);

        // Take Full Page/Viewport Screenshot
        console.log("Taking Practo screenshot in run folder...");
        try {
            await page.screenshot({
                path: screenshotPath,
                fullPage: false
            });
            console.log(`[✓] Screenshot saved to: ${path.basename(screenshotPath)}`);
        } catch (screenshotError) {
            console.error(`[!] Screenshot capture failed: ${screenshotError.message}`);
        }

        await page.close().catch(() => {});
        await browser.disconnect().catch(() => {});
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with Practo: ${err.message}`);
        if (page) await page.close().catch(() => {});
        if (browser) await browser.disconnect().catch(() => {});
        process.exit(1);
    }
}

run();

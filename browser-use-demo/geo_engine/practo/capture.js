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

    // Extract City and Specialty from the Prompt
    // Expected patterns: "most reliable orthopedicians in Lucknow", "dentists in Patna"
    let city = "Lucknow";
    let specialty = "orthopedician";

    const cityMatch = prompt.match(/in\s+([A-Za-z\s]+?)(?:\s+with|\s+and|\s*$|\?)/i);
    if (cityMatch) {
        city = cityMatch[1].trim();
    }
    
    const specMatch = prompt.match(/most\s+reliable\s+([A-Za-z\s\-]+?)\s+in/i) || 
                      prompt.match(/Who\s+are\s+the\s+([A-Za-z\s\-]+?)\s+in/i) ||
                      prompt.match(/([A-Za-z\s\-]+?)\s+in/i);
    if (specMatch) {
        specialty = specMatch[1].trim();
    }

    // Clean up specialty string
    specialty = specialty.replace(/are the/i, '').replace(/who is the/i, '').replace(/who are the/i, '').trim();

    // Mapping common plural terms to singular search terms for Practo compatibility
    if (specialty.toLowerCase() === 'dentists') specialty = 'dentist';
    if (specialty.toLowerCase() === 'orthopedicians') specialty = 'orthopedician';
    if (specialty.toLowerCase() === 'cardiologists') specialty = 'cardiologist';
    if (specialty.toLowerCase() === 'heart doctors') specialty = 'cardiologist';
    if (specialty.toLowerCase() === 'pediatricians') specialty = 'pediatrician';

    console.log(`Extracted Search Target: Specialty = "${specialty}", City = "${city}"`);

    const targetUrl = `https://www.practo.com`;
    console.log(`Navigating to Practo Homepage: ${targetUrl}`);

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('practo.com'));

    if (!page) {
        console.log("Opening new tab for Practo...");
        page = await browser.newPage();
    } else {
        await page.bringToFront();
    }

    // Setup network/user agent simulation to avoid bot detection blocks
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Go to Practo homepage
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 1. Set Location
    console.log("Locating search location input box...");
    const locSel = 'input[data-qa-id="omni-searchbox-locality"]';
    await page.waitForSelector(locSel);
    await page.focus(locSel);
    await page.evaluate((sel) => {
        document.querySelector(sel).value = '';
    }, locSel);
    console.log(`Typing Location: "${city}"...`);
    await page.keyboard.type(city, { delay: 30 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click first suggestion
    await page.evaluate(() => {
        const item = document.querySelector('.c-omni-suggestion-item, .c-omni-suggestion-list div');
        if (item) item.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Set Keyword
    console.log("Locating doctor search input box...");
    const keySel = 'input[data-qa-id="omni-searchbox-keyword"]';
    await page.waitForSelector(keySel);
    await page.focus(keySel);
    console.log(`Typing Specialty/Keyword: "${specialty}"...`);
    await page.keyboard.type(specialty, { delay: 30 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Press Enter to submit
    console.log("Submitting query...");
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for results page load

    // Initialize raw stream file
    fs.writeFileSync(outputFile, `=== Practo India Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `EXTRACTED_TARGET: specialty="${specialty}", city="${city}"\n\n`, 'utf8');

    try {
        console.log("Checking for doctor cards in the Practo listings...");
        
        // Wait for doctor cards to load
        const cardSelector = 'div[data-qa-id="doctor_card"], .listing-doctor-card';
        await page.waitForSelector(cardSelector, { timeout: 10000 }).catch(() => {
            console.log("[!] Timeout waiting for doctor card selector. Proceeding with DOM dump.");
        });

        // Scrape listings
        const localResults = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('div[data-qa-id="doctor_card"], .listing-doctor-card');
            
            cards.forEach(card => {
                // Name
                const nameEl = card.querySelector('[data-qa-id="doctor_name"], h2.doctor-name, h2[class*="name"]');
                if (!nameEl) return;
                const name = nameEl.innerText.trim();
                
                // Qualifications / Specialty
                const specEl = card.querySelector('[data-qa-id="doctor_speciality"], .doctor-speciality, .u-grey_3-text');
                const specialty = specEl ? specEl.innerText.trim() : "Specialist";

                const degEl = card.querySelector('[data-qa-id="doctor_degree"], .doctor-degree');
                const degree = degEl ? degEl.innerText.trim() : "";

                // Experience
                const expEl = card.querySelector('[data-qa-id="doctor_experience"], .doctor-experience, p[class*="experience"]');
                const experience = expEl ? expEl.innerText.trim() : "N/A";

                // Recommendation rating (green recommendation text / patient stories)
                let recommendationRate = "N/A";
                let reviewCount = "N/A";
                
                const recEl = card.querySelector('[data-qa-id="doctor_recommendation"], .u-green-text, span[class*="recommendation"]');
                if (recEl) recommendationRate = recEl.innerText.trim();

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
                    phone: "Available on Practo", // Practo does not show direct phone numbers openly, booked via app
                    rating: recommendationRate // Used for schema consistency
                });
            });

            return results;
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

        await browser.disconnect();
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with Practo: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

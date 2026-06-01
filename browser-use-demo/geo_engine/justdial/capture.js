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
    const outputFile = args.output || path.resolve(process.cwd(), 'justdial_raw_stream.txt');
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

    // Extract City and Specialty from prompt
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

    specialty = specialty.replace(/are the/i, '').replace(/who is the/i, '').replace(/who are the/i, '').trim();

    // Map to canonical Justdial URL slugs
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    let formattedSpecialty = specialty.charAt(0).toUpperCase() + specialty.slice(1).toLowerCase();

    if (formattedSpecialty.toLowerCase() === 'orthopedician' || formattedSpecialty.toLowerCase() === 'orthopedicians') {
        formattedSpecialty = "Orthopedic-Doctors";
    } else if (formattedSpecialty.toLowerCase() === 'dentist' || formattedSpecialty.toLowerCase() === 'dentists') {
        formattedSpecialty = "Dentists";
    } else if (formattedSpecialty.toLowerCase() === 'cardiologist' || formattedSpecialty.toLowerCase() === 'cardiologists') {
        formattedSpecialty = "Cardiologists";
    } else if (formattedSpecialty.toLowerCase() === 'heart doctors' || formattedSpecialty.toLowerCase() === 'heart doctor') {
        formattedSpecialty = "Cardiologists";
    } else if (formattedSpecialty.toLowerCase() === 'pediatrician' || formattedSpecialty.toLowerCase() === 'pediatricians') {
        formattedSpecialty = "Paediatric-Doctors";
    }

    const targetUrl = `https://www.justdial.com/${encodeURIComponent(formattedCity)}/${encodeURIComponent(formattedSpecialty)}`;
    console.log(`Navigating to Justdial URL: ${targetUrl}`);

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('justdial.com'));

    if (!page) {
        console.log("Opening new tab for Justdial...");
        page = await browser.newPage();
    } else {
        await page.bringToFront();
    }

    // Standard user-agent mapping to avoid bot detection blocks
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // Go to Justdial page
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 6000)); // Justdial dynamic overlay protection wait

    // Initialize raw stream file
    fs.writeFileSync(outputFile, `=== Justdial India Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `EXTRACTED_TARGET: specialty="${specialty}", slug="${formattedSpecialty}", city="${formattedCity}"\n\n`, 'utf8');

    try {
        console.log("Scraping local Justdial results list...");
        
        // Extract results
        const localResults = await page.evaluate(() => {
            const results = [];
            // Justdial result list selectors
            const cards = document.querySelectorAll('div.result-box, li.cntanr, div.store-details, div[class*="store-box"], div[class*="result-box"]');
            
            cards.forEach(card => {
                // Name
                const nameEl = card.querySelector('.store-name, h2 a span, h2 span, h2, a[class*="jcn"], .jcn');
                if (!nameEl) return;
                const name = nameEl.innerText.trim();
                if (!name || results.some(r => r.name === name)) return;

                // Ratings and reviews count
                let rating = "N/A";
                let reviewCount = "N/A";
                const ratingEl = card.querySelector('.green-box, .rating-value, span[class*="green-box"]');
                if (ratingEl) rating = ratingEl.innerText.trim();

                const countEl = card.querySelector('.rt_count, span[class*="vote"], span[class*="count"]');
                if (countEl) {
                    const match = countEl.innerText.match(/([0-9,]+)/);
                    if (match) reviewCount = match[1];
                }

                // Verified Badge Status
                // JD shows checkmark icons or span elements for verified / trust stamp
                const verifiedEl = card.querySelector('.verified, .trust, span[title*="Verified"], span[class*="verified"]');
                const verifiedStatus = verifiedEl ? "Verified" : "Standard Listing";

                // Address / Locality
                let address = "Local Area, India";
                const addrEl = card.querySelector('.cont_fl_addr, .address, span[class*="address"]');
                if (addrEl) address = addrEl.innerText.trim();

                // Contact Phone Number
                let phone = "N/A";
                const phoneEl = card.querySelector('.contact-info, .call-btn, span[class*="mobile"], span.mobiles');
                if (phoneEl) {
                    phone = phoneEl.innerText.replace(/\s+/g, ' ').trim();
                } else {
                    // Try getting title or button content
                    const callBtn = card.querySelector('a[href*="tel:"]');
                    if (callBtn) {
                        const href = callBtn.getAttribute('href');
                        phone = href.replace('tel:', '').trim();
                    }
                }

                results.push({
                    name,
                    category: "Medical Clinic",
                    address,
                    rating,
                    review_count: reviewCount,
                    phone,
                    website_url: "N/A",
                    verified_badge: verifiedStatus
                });
            });

            // Fallback for JD layout variations
            if (results.length === 0) {
                // Scrape general header elements as fallback
                const headers = document.querySelectorAll('h2');
                headers.forEach(h => {
                    const txt = h.innerText.trim();
                    if (txt && txt.length > 5 && !txt.includes('Justdial') && !results.some(r => r.name === txt)) {
                        results.push({
                            name: txt,
                            category: "Healthcare provider",
                            address: "Local Locality",
                            rating: "N/A",
                            review_count: "N/A",
                            phone: "N/A",
                            website_url: "N/A",
                            verified_badge: "Standard"
                        });
                    }
                });
            }

            return results.slice(0, 5); // Limit to top 5
        });

        console.log(`[✓] Scraped ${localResults.length} profiles from Justdial India!`);

        // Structure results
        const pageData = {
            ai_overview: `Verified hyper-local doctor listings in ${city} from Justdial.`,
            local_results: localResults,
            organic_results: []
        };

        const logContent = `\n============================================================\n` +
                           `[JUSTDIAL DOM EXTRACTION RESULTS]\n` +
                           `Timestamp: ${new Date().toISOString()}\n` +
                           `============================================================\n` +
                           JSON.stringify(pageData, null, 4) + "\n";
        
        fs.appendFileSync(outputFile, logContent, 'utf8');
        console.log(`[✓] Appended extracted DOM metadata to: ${path.basename(outputFile)}`);

        // Take Full Page/Viewport Screenshot
        console.log("Taking Justdial screenshot in run folder...");
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
        console.error(`Error interacting with Justdial: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

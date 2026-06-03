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

    // Map to canonical Justdial URL slugs
    // If city contains a comma (e.g. "Naini, Prayagraj"), directories index by the main parent city (e.g. "Prayagraj")
    let parentCity = city.includes(',') ? city.split(',').pop().trim() : city;
    const formattedCity = parentCity.charAt(0).toUpperCase() + parentCity.slice(1).toLowerCase();
    let formattedSpecialty = specialty.charAt(0).toUpperCase() + specialty.slice(1).toLowerCase();

    if (formattedSpecialty.toLowerCase() === 'orthopedician' || formattedSpecialty.toLowerCase() === 'orthopedicians' || formattedSpecialty.toLowerCase() === 'orthopedist' || formattedSpecialty.toLowerCase() === 'orthopedists') {
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
    console.log(`Navigating directly to Justdial URL: ${targetUrl}`);

    // Clean close any other stale Justdial pages to avoid memory/tab leak
    const pages = await browser.pages();
    for (const p of pages) {
        if (p.url().includes('justdial.com')) {
            console.log(`Closing existing Justdial tab to avoid stale state: ${p.url()}`);
            await p.close().catch(() => {});
        }
    }

    // Open a fresh tab for the direct navigation
    let page = await browser.newPage();

    // DO NOT override the User Agent with a mismatched OS! Let Chrome use its real, native Mac user agent & session to bypass Akamai blocks.
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log("Waiting 8s for Justdial results sidebar to render...");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Formulate Search Query/Term
    let searchTerm = args.query;
    if (!searchTerm) {
        searchTerm = args.area ? `${specialty} in ${args.area}, ${city}` : `${specialty} in ${city}`;
    }

    // Initialize raw stream file
    fs.writeFileSync(outputFile, `=== Justdial India Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${searchTerm}\n`, 'utf8');
    fs.appendFileSync(outputFile, `EXTRACTED_TARGET: specialty="${specialty}", slug="${formattedSpecialty}", city="${formattedCity}"\n\n`, 'utf8');

    try {
        console.log("Scraping local Justdial results list...");
        
        let localResults = [];
        let retries = 3;
        while (retries > 0) {
            try {
                // Wait for body to be loaded
                await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
                
                // Extract results using correct up-to-date DOM selectors from inspection
                localResults = await page.evaluate(() => {
                    const results = [];
                    const cards = document.querySelectorAll('div.resultbox, [class*="resultbox"]');
                    
                    cards.forEach(card => {
                        // Name
                        const nameEl = card.querySelector('.resultbox_title_anchor, h2.resultbox_title, h2, [class*="title"]');
                        if (!nameEl) return;
                        const name = nameEl.innerText.trim();
                        if (!name || results.some(r => r.name === name)) return;

                        // Ratings and reviews count
                        let rating = "N/A";
                        const ratingEl = card.querySelector('.resultbox_totalrate, [class*="totalrate"]');
                        if (ratingEl) rating = ratingEl.innerText.trim();

                        let reviewCount = "N/A";
                        const countEl = card.querySelector('.resultbox_countrate, [class*="countrate"]');
                        if (countEl) {
                            const match = countEl.innerText.match(/([0-9,]+)/);
                            if (match) reviewCount = match[1];
                        }

                        // Verified Badge Status
                        const verifiedEl = card.querySelector('.results_jdverified, [class*="jdverified"]');
                        const verifiedStatus = verifiedEl ? "Verified" : "Standard Listing";

                        // Address / Locality
                        let address = "Local Area, India";
                        const addrEl = card.querySelector('.resultbox_address, [class*="address"]');
                        if (addrEl) address = addrEl.innerText.trim();

                        // Contact Phone Number (highly structured call Now span)
                        let phone = "N/A";
                        const phoneEl = card.querySelector('.callcontent, [class*="callcontent"]');
                        if (phoneEl) {
                            phone = phoneEl.innerText.replace(/\s+/g, ' ').trim();
                        }

                        // Category
                        const catEl = card.querySelector('.resultbox_catalogue, [class*="catalogue"]');
                        const category = catEl ? catEl.innerText.replace(/\n/g, ' ').trim() : "Medical Clinic";

                        results.push({
                            name,
                            category,
                            address,
                            rating,
                            review_count: reviewCount,
                            phone,
                            website_url: "N/A",
                            verified_badge: verifiedStatus
                        });
                    });

                    // General headers fallback if standard selectors are missing
                    if (results.length === 0) {
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

                    return results.slice(0, 6); // Limit to top 6 entries
                });
                break; // Success
            } catch (evalErr) {
                retries--;
                if (retries === 0) throw evalErr;
                console.log(`[!] Justdial scrape failed: ${evalErr.message}. Retrying in 2s... (${retries} retries left)`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

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

        await page.close().catch(() => {});
        await browser.disconnect().catch(() => {});
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with Justdial: ${err.message}`);
        if (page) await page.close().catch(() => {});
        if (browser) await browser.disconnect().catch(() => {});
        process.exit(1);
    }
}

run();

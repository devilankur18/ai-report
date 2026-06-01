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
    const outputFile = args.output || path.resolve(process.cwd(), 'bing_maps_raw_stream.txt');
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

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('bing.com/maps'));

    if (!page) {
        console.log("No active Bing Maps tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://www.bing.com/maps', { waitUntil: 'networkidle2' });
    } else {
        console.log(`Found active Bing Maps tab: ${page.url()}`);
        await page.bringToFront();
        await page.goto('https://www.bing.com/maps', { waitUntil: 'networkidle2' });
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract City and Specialty from the Prompt if it is a long conversational sentence
    let searchTerm = prompt;
    if (prompt.length > 50) {
        let city = "Lucknow";
        let specialty = "orthopedicians";

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
        searchTerm = `${specialty} in ${city}`;
        console.log(`[Parser] Parsed long prompt into local maps query: "${searchTerm}"`);
    }

    fs.writeFileSync(outputFile, `=== Bing Maps Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${searchTerm}\n\n`, 'utf8');

    // Handle Bing Consent/Cookie Dialog if present
    try {
        console.log("Checking for Bing Consent Dialog/Banner...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const consentBtn = buttons.find(b => {
                const text = (b.innerText || b.textContent || '').toLowerCase();
                return text.includes('accept') || text.includes('agree') || text.includes('allow all') || text.includes('i agree');
            });
            if (consentBtn) {
                console.log("Dismissing Bing Consent Dialog...");
                consentBtn.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (consentErr) {
        console.log(`[!] Consent dialog check skipped: ${consentErr.message}`);
    }

    console.log(`Searching for "${searchTerm}" on Bing Maps...`);

    try {
        // Bing Maps Search Box Selector
        const searchInputSelector = 'input#searchBoxInput, input#maps_sb, input[title*="Search"], input[aria-label*="Search"]';
        
        // Wait for search box using evaluate for maximum reliability
        let searchBoxFound = false;
        for (let i = 0; i < 5; i++) {
            searchBoxFound = await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                return !!el;
            }, 'input#searchBoxInput, input#maps_sb, input[title*="Search"], input[aria-label*="Search"]');
            
            if (searchBoxFound) break;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        if (!searchBoxFound) {
            throw new Error("Failed to find Bing Maps search input box after multiple retries.");
        }

        // Get the active search box selector
        const activeSelector = await page.evaluate(() => {
            const sels = ['input#searchBoxInput', 'input#maps_sb', 'input[title*="Search"]', 'input[aria-label*="Search"]'];
            for (const s of sels) {
                if (document.querySelector(s)) return s;
            }
            return 'input#searchBoxInput';
        });

        await page.focus(activeSelector);
        
        // Clear input first
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.value = '';
        }, activeSelector);

        // Type query
        await page.keyboard.type(searchTerm, { delay: 15 });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Press Enter or click search icon
        await page.keyboard.press('Enter');
        
        console.log("Search query submitted. Waiting for Bing Maps to load results (max 15s)...");
        await new Promise(resolve => setTimeout(resolve, 8000)); // Dynamic loading safety wait

        let localResults = [];

        // ---------- NEW OVERLAY‑BFPR FETCH ----------
        console.log("Fetching detailed data via Bing overlaybfpr endpoint...");
        // 1️⃣ Get a list of result cards (same selector groups as before) to obtain the internal ypid for each place
        const resultCards = await page.evaluate(() => {
            const selectors = [
                'a[href*="/maps/detail"], a[href*="/maps/place"], .b_entityTitle, .list_item, .ent-card',
                '.entityTitle, .entityCard, .place-card',
                'div[role="listitem"] a'
            ];
            const elems = [];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(node => elems.push(node));
            });
            // Extract the display name and the internal ypid (local_ypid) if present in the href
            return elems.map(el => {
                const name = el.innerText.trim();
                const href = el.getAttribute('href') || '';
                const ypidMatch = href.match(/local_ypid%3A%22([^\"]+)\%22/);
                const ypid = ypidMatch ? decodeURIComponent(ypidMatch[1]) : null;
                return {name, ypid, href};
            }).filter(o => o.name && o.ypid);
        });

        // 2️⃣ For each card (up to 10) request the overlay endpoint directly
        const enriched = [];
        for (let i = 0; i < resultCards.length && enriched.length < 10; i++) {
            const {name, ypid} = resultCards[i];
            // Construct the overlay URL – most parameters can be static; only the ypid varies
            const overlayUrl = `https://www.bing.com/maps/overlaybfpr?local_ypid="${ypid}"&cardType=details&count=20&ecount=20&first=0&efirst=1&form=MPSRBX&mapsV10=1`;
            console.log(`Fetching overlay for "${name}" → ${overlayUrl}`);
            try {
                const response = await page.goto(overlayUrl, {waitUntil: 'networkidle2'});
                const json = await response.json();
                // The JSON structure varies; we pick common fields with graceful fallbacks
                const entry = {
                    name: name,
                    category: 'Medical',
                    address: json.address?.freeformAddress || json.address?.addressLine || 'N/A',
                    rating: json.rating?.value?.toString() || 'N/A',
                    review_count: json.userRatingCount?.toString() || 'N/A',
                    phone: json.phoneNumber?.toString() || 'N/A',
                    website_url: json.websiteUrl?.toString() || 'N/A',
                    claimed_status: json.claimed ? 'Claimed' : 'Unclaimed',
                    opening_hours: json.openingHours?.join(', ') || 'N/A'
                };
                console.log('Overlay entry extracted:', entry);
                enriched.push(entry);
            } catch (err) {
                console.warn(`Failed overlay fetch for "${name}": ${err.message}`);
            }
        }
        // Return the enriched list (already limited to 10)
        localResults = enriched;
        console.log(`[✓] Scraped ${localResults.length} business profile entries from Bing Maps!`);

        // Output structured results to log stream
        const pageData = {
            ai_overview: "",
            local_results: localResults,
            organic_results: []
        };

        const logContent = `\n============================================================\n` +
                           `[BING_MAPS DOM EXTRACTION RESULTS]\n` +
                           `Timestamp: ${new Date().toISOString()}\n` +
                           `============================================================\n` +
                           JSON.stringify(pageData, null, 4) + "\n";
        
        fs.appendFileSync(outputFile, logContent, 'utf8');
        console.log(`[✓] Appended extracted DOM metadata to: ${path.basename(outputFile)}`);

        // Take Full Page/Viewport Screenshot
        console.log("Taking Bing Maps screenshot in run folder...");
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
        console.error(`Error interacting with Bing Maps: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

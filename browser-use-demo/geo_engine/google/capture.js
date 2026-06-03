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
    const prompt = args.prompt || "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. Who are the most reliable orthopedicians in Lucknow with good reviews, and what should I ask them?";
    const outputFile = args.output || path.resolve(process.cwd(), 'google_raw_stream.txt');
    const screenshotPath = args.screenshot || outputFile.replace('raw_stream.txt', 'screenshot.png');
    const autocompleteFile = path.join(path.dirname(outputFile), 'autocomplete_suggestions.json');

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
        console.log("\nPlease ensure you launched Chrome with debugging enabled:");
        process.exit(1);
    }

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('google.com') && !p.url().includes('gemini.google.com'));

    if (!page) {
        console.log("No active Google tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://www.google.com/');
    } else {
        console.log(`Found active Google tab: ${page.url()}`);
        await page.bringToFront();
        await page.goto('https://www.google.com/');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize raw stream file with header info
    fs.writeFileSync(outputFile, `=== Google Search Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${args.query || ''}\n\n`, 'utf8');

    console.log("Entering prompt to Google Search...");

    try {
        // Find Google search box
        const searchInputSelector = 'textarea[name="q"], input[name="q"]';
        await page.waitForSelector(searchInputSelector, { timeout: 8000 });
        
        await page.focus(searchInputSelector);
        
        // Clear input first
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.value = '';
        }, searchInputSelector);

        // Type query slowly to trigger autocomplete suggestions
        await page.keyboard.type(prompt, { delay: 10 });
        console.log("Prompt typed. Waiting for autocomplete suggestions to appear...");
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract autocomplete suggestions
        let suggestions = [];
        try {
            suggestions = await page.evaluate(() => {
                const items = document.querySelectorAll('ul[role="listbox"] li, div.erkvQe li, [role="option"]');
                const list = [];
                items.forEach(item => {
                    // Try to find the text container
                    const textSpan = item.querySelector('span, div.wM6W7d span, b');
                    if (textSpan) {
                        const txt = textSpan.innerText || textSpan.textContent;
                        if (txt && txt.trim() && !list.includes(txt.trim())) {
                            list.push(txt.trim());
                        }
                    } else {
                        const txt = item.innerText || item.textContent;
                        if (txt && txt.trim() && !list.includes(txt.trim())) {
                            list.push(txt.trim());
                        }
                    }
                });
                return list.filter(s => s.length > 0);
            });
            console.log(`[✓] Extracted ${suggestions.length} autocomplete suggestions!`);
        } catch (e) {
            console.log(`[!] Failed to extract autocomplete suggestions: ${e.message}`);
        }

        // Save autocomplete suggestions
        fs.writeFileSync(autocompleteFile, JSON.stringify({
            engine: "google",
            timestamp: new Date().toISOString(),
            query: prompt,
            suggestions: suggestions
        }, null, 4), 'utf8');
        console.log(`[✓] Suggestions saved to: ${path.basename(autocompleteFile)}`);

        // Press Enter to search
        console.log("Submitting Google search query...");
        await page.keyboard.press('Enter');

        console.log("Waiting for search results to load (max 15s)...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 5000)); // Additional safety wait for lazy components

        // Scroll page slowly to trigger lazy loading of local packs/AI overview
        console.log("Scrolling page to trigger dynamic content loading...");
        await page.evaluate(async () => {
            window.scrollBy(0, 400);
            await new Promise(resolve => setTimeout(resolve, 500));
            window.scrollBy(0, 400);
            await new Promise(resolve => setTimeout(resolve, 500));
            window.scrollBy(0, -800);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract structured data from DOM
        console.log("Extracting search results from the DOM...");
        const pageData = await page.evaluate(() => {
            const data = {
                ai_overview: "",
                local_results: [],
                organic_results: []
            };

            // 1. Extract AI Overview Text (Google AI Overviews)
            // Look for AI Overview headers/containers
            const aiSelectors = [
                'div[class*="ai-overview"]', 
                'div[data-asoch-area="ao-header"]', 
                'div[class*="ao-"]', 
                'div[class*="super-root"]',
                '.F92Zuf',
                '.HwtZmb'
            ];
            
            for (const selector of aiSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    // Try to fetch parent container or clean text
                    const parent = el.closest('div[class*="container"]') || el.parentElement || el;
                    data.ai_overview = parent.innerText || parent.textContent;
                    if (data.ai_overview) break;
                }
            }

            // Fallback for AI Overview search by heading
            if (!data.ai_overview) {
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, div'));
                const overviewHeading = headings.find(h => (h.innerText || '').includes('AI Overview'));
                if (overviewHeading) {
                    const container = overviewHeading.closest('div[class*="card"]') || overviewHeading.parentElement;
                    data.ai_overview = container ? container.innerText : overviewHeading.innerText;
                }
            }

            // 2. Extract Local Pack Results
            // Standard selectors for google maps items inside SERP
            const localItems = document.querySelectorAll('.Vk5Yce, .rl_item, [data-fid], .rllt__details');
            localItems.forEach(item => {
                // Extractor inside each local card
                const nameEl = item.querySelector('[role="heading"], span.Lrzca, .OSrXXb, div.BNeawe, a.rl_item-title');
                if (!nameEl) return;
                const name = (nameEl.innerText || nameEl.textContent).trim();
                if (!name) return;

                // Avoid duplicate names in extraction
                if (data.local_results.some(r => r.name === name)) return;

                // Ratings and reviews
                let rating = "N/A";
                let reviewCount = "N/A";
                const ratingEl = item.querySelector('.Yw7Pfc, span[aria-label*="rating"], span[aria-label*="reviews"]');
                if (ratingEl) {
                    const txt = ratingEl.getAttribute('aria-label') || ratingEl.innerText;
                    const ratMatch = txt.match(/([0-9.]+)\s*star/i) || txt.match(/([0-9.]+)\s*out/);
                    if (ratMatch) rating = ratMatch[1];
                    const revMatch = txt.match(/([0-9,]+)\s*reviews/i) || txt.match(/\(([0-9,]+)\)/);
                    if (revMatch) reviewCount = revMatch[1];
                } else {
                    // Alternative regex on inner text
                    const txt = item.innerText || '';
                    const match = txt.match(/([0-9.]+)\s*★\s*\(([0-9,]+)\)/) || txt.match(/([0-9.]+)\s*\(([0-9,]+)\s*reviews\)/);
                    if (match) {
                        rating = match[1];
                        reviewCount = match[2];
                    }
                }

                // Address & Phone & Category
                let address = "Lucknow, India";
                let phone = "N/A";
                let category = "Orthopedic surgeon";
                
                const details = item.querySelectorAll('div, span');
                details.forEach(d => {
                    const txt = (d.innerText || '').trim();
                    // Phone regex
                    if (txt.match(/(\+?\d{2,4}[- ]?\d{3,4}[- ]?\d{3,4}|\d{5}\s?\d{5})/)) {
                        phone = txt;
                    } else if (txt.includes('·') && txt.length > 5) {
                        // Usually category · address structure
                        const parts = txt.split('·');
                        if (parts.length > 1) {
                            category = parts[0].trim();
                            address = parts[1].trim();
                        }
                    }
                });

                // Website URL
                let websiteUrl = "N/A";
                const websiteLink = item.querySelector('a[href*="http"]');
                if (websiteLink) {
                    const href = websiteLink.getAttribute('href');
                    if (href && !href.includes('google.com/search')) {
                        websiteUrl = href;
                    }
                }

                data.local_results.push({
                    name,
                    category,
                    address,
                    rating,
                    reviewCount,
                    phone,
                    websiteUrl
                });
            });

            // 3. Extract Organic Citations / Search Rankings
            const organicItems = document.querySelectorAll('.g, .yuRUbf, .tF2Cxc');
            organicItems.forEach(item => {
                const titleEl = item.querySelector('h3');
                const linkEl = item.querySelector('a[href]');
                if (titleEl && linkEl) {
                    const title = titleEl.innerText || titleEl.textContent;
                    const url = linkEl.getAttribute('href');
                    if (url && url.startsWith('http') && !data.organic_results.some(r => r.url === url)) {
                        data.organic_results.push({
                            title: title.trim(),
                            url: url.trim()
                        });
                    }
                }
            });

            return data;
        });

        // Write beautiful serialized text to raw_stream.txt
        const logContent = `\n============================================================\n` +
                           `[GOOGLE DOM EXTRACTION RESULTS]\n` +
                           `Timestamp: ${new Date().toISOString()}\n` +
                           `============================================================\n` +
                           JSON.stringify(pageData, null, 4) + "\n";
        
        fs.appendFileSync(outputFile, logContent, 'utf8');
        console.log(`[✓] Appended extracted DOM metadata to: ${path.basename(outputFile)}`);

        // Take Conversation Screenshot with Zoomout
        console.log("Taking conversation screenshot in run folder...");
        try {
            await page.evaluate(() => {
                document.body.style.zoom = "0.8";
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            await page.screenshot({
                path: screenshotPath,
                fullPage: true
            });
            
            await page.evaluate(() => {
                document.body.style.zoom = "1.0";
            });
            console.log(`[✓] Screenshot saved to: ${path.basename(screenshotPath)}`);
        } catch (screenshotError) {
            console.error(`[!] Screenshot capture failed: ${screenshotError.message}`);
        }

        await browser.disconnect().catch(() => {});
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with Google page: ${err.message}`);
        await browser.disconnect().catch(() => {});
        process.exit(1);
    }
}

run();

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
    const outputFile = args.output || path.resolve(process.cwd(), 'bing_raw_stream.txt');
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
    let page = pages.find(p => p.url().includes('bing.com'));

    if (!page) {
        console.log("No active Bing tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://www.bing.com/');
    } else {
        console.log(`Found active Bing tab: ${page.url()}`);
        await page.bringToFront();
        await page.goto('https://www.bing.com/');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize raw stream file with header info
    fs.writeFileSync(outputFile, `=== Bing Search Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${args.query || ''}\n\n`, 'utf8');

    console.log("Entering prompt to Bing Search...");

    try {
        // Find Bing search input
        const searchInputSelector = 'input[name="q"], #sb_form_q';
        await page.waitForSelector(searchInputSelector, { timeout: 8000 });
        
        await page.focus(searchInputSelector);
        
        // Clear input first
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.value = '';
        }, searchInputSelector);

        // Type query slowly to trigger autocomplete suggestions
        await page.keyboard.type(prompt, { delay: 10 });
        console.log("Prompt typed. Waiting for Bing autocomplete suggestions to appear...");
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract autocomplete suggestions
        let suggestions = [];
        try {
            suggestions = await page.evaluate(() => {
                const items = document.querySelectorAll('ul.sa_drw li, li.sa_sg, [role="option"]');
                const list = [];
                items.forEach(item => {
                    const txt = item.innerText || item.textContent;
                    if (txt && txt.trim() && !list.includes(txt.trim())) {
                        list.push(txt.trim());
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
            engine: "bing",
            timestamp: new Date().toISOString(),
            query: prompt,
            suggestions: suggestions
        }, null, 4), 'utf8');
        console.log(`[✓] Suggestions saved to: ${path.basename(autocompleteFile)}`);

        // Press Enter to search
        console.log("Submitting Bing search query...");
        await page.keyboard.press('Enter');

        console.log("Waiting for search results to load (max 15s)...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Scroll page slowly to trigger lazy loading of local listings/Copilot
        console.log("Scrolling page to trigger dynamic content loading...");
        await page.evaluate(async () => {
            window.scrollBy(0, 400);
            await new Promise(resolve => setTimeout(resolve, 500));
            window.scrollBy(0, 400);
            await new Promise(resolve => setTimeout(resolve, 500));
            window.scrollBy(0, -800);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract structured data from Bing DOM
        console.log("Extracting search results from the DOM...");
        const pageData = await page.evaluate(() => {
            const data = {
                copilot_generative: "",
                local_results: [],
                organic_results: []
            };

            // 1. Extract Copilot / Generative Text
            const copilotSelectors = [
                'div[class*="copilot"]', 
                'div[class*="cib-"]',
                '.b_ans.b_generative', 
                'div[id*="generative"]',
                '#b_ans_chat'
            ];
            for (const selector of copilotSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    data.copilot_generative = el.innerText || el.textContent;
                    if (data.copilot_generative) break;
                }
            }

            // 2. Extract Bing Local Listings (.b_localLst)
            const localCards = document.querySelectorAll('.b_localLst li, .b_localLst .b_entityCard, .b_localLst .b_cards');
            localCards.forEach(card => {
                const nameEl = card.querySelector('h2, h3, .b_focusLabel, .b_entityTitle, a');
                if (!nameEl) return;
                const name = (nameEl.innerText || nameEl.textContent).trim();
                if (!name || name.length < 3) return;

                if (data.local_results.some(r => r.name === name)) return;

                // Rating and reviews
                let rating = "N/A";
                let reviewCount = "N/A";
                const ratingEl = card.querySelector('.b_rating, span[aria-label*="rating"], span.cstar');
                if (ratingEl) {
                    const txt = ratingEl.getAttribute('aria-label') || ratingEl.innerText;
                    const rMatch = txt.match(/([0-9.]+)\s*out/) || txt.match(/([0-9.]+)\s*star/i);
                    if (rMatch) rating = rMatch[1];
                    const revMatch = txt.match(/\(([0-9,]+)\)/) || txt.match(/([0-9,]+)\s*reviews/i);
                    if (revMatch) reviewCount = revMatch[1];
                }

                // Address & Phone
                let address = "Lucknow, India";
                let phone = "N/A";
                let category = "Orthopedic surgeon";

                const detailTexts = card.querySelectorAll('div, span');
                detailTexts.forEach(d => {
                    const txt = (d.innerText || '').trim();
                    if (txt.match(/(\+?\d{2,4}[- ]?\d{3,4}[- ]?\d{3,4}|\d{5}\s?\d{5})/)) {
                        phone = txt;
                    } else if (txt.includes('·') && txt.length > 5) {
                        const parts = txt.split('·');
                        category = parts[0].trim();
                        address = parts[1].trim();
                    }
                });

                // Website URL
                let websiteUrl = "N/A";
                const websiteLink = card.querySelector('a[href*="http"]');
                if (websiteLink) {
                    const href = websiteLink.getAttribute('href');
                    if (href && !href.includes('bing.com/search')) {
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

            // 3. Extract Organic Results
            const organicItems = document.querySelectorAll('.b_algo');
            organicItems.forEach(item => {
                const linkEl = item.querySelector('h2 a');
                if (linkEl) {
                    const title = linkEl.innerText || linkEl.textContent;
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
                           `[BING DOM EXTRACTION RESULTS]\n` +
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

        await browser.disconnect();
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with Bing page: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

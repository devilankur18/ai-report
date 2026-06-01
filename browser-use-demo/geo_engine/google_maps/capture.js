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
    const outputFile = args.output || path.resolve(process.cwd(), 'google_maps_raw_stream.txt');
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
    let page = pages.find(p => p.url().includes('google.com/maps'));

    if (!page) {
        console.log("No active Google Maps tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://www.google.com/maps', { waitUntil: 'networkidle2' });
    } else {
        console.log(`Found active Google Maps tab: ${page.url()}`);
        await page.bringToFront();
        await page.goto('https://www.google.com/maps', { waitUntil: 'networkidle2' });
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

    fs.writeFileSync(outputFile, `=== Google Maps GBP Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${searchTerm}\n\n`, 'utf8');

    // Handle Google Consent Dialog if present
    try {
        console.log("Checking for Google Consent Dialog/Banner...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const consentBtn = buttons.find(b => {
                const text = (b.innerText || b.textContent || '').toLowerCase();
                return text.includes('accept all') || text.includes('i agree') || text.includes('agree') || text.includes('accept');
            });
            if (consentBtn) {
                console.log("Dismissing Google Consent Dialog...");
                consentBtn.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (consentErr) {
        console.log(`[!] Consent dialog check skipped: ${consentErr.message}`);
    }

    console.log(`Searching for "${searchTerm}" on Google Maps...`);

    try {
        // Broad range of Google Maps search box selectors
        const searchInputSelector = 'input#searchboxinput, input[name="q"], #searchboxinput, input.searchboxinput, input[aria-label*="Search"]';
        
        // Wait for search box using querySelector evaluation for robustness
        let searchBoxFound = false;
        for (let i = 0; i < 5; i++) {
            searchBoxFound = await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                return !!el;
            }, 'input#searchboxinput, input[name="q"], #searchboxinput, input[aria-label*="Search"]');
            
            if (searchBoxFound) break;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        if (!searchBoxFound) {
            throw new Error("Failed to find Google Maps search input box after multiple retries.");
        }

        // Get the working selector
        const activeSelector = await page.evaluate(() => {
            const sels = ['input#searchboxinput', 'input[name="q"]', '#searchboxinput', 'input[aria-label*="Search"]'];
            for (const s of sels) {
                if (document.querySelector(s)) return s;
            }
            return 'input#searchboxinput';
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
        
        // Click search button
        const searchButtonSelector = 'button#searchbox-searchbutton, button.aria-search-btn, button[aria-label*="Search"]';
        await page.click(searchButtonSelector).catch(async () => {
            // Fallback to Enter key
            await page.keyboard.press('Enter');
        });
        
        console.log("Search query submitted. Waiting for Maps to load results (max 15s)...");
        
        const listSelector = 'a[href*="/maps/place/"]';
        const singleSelector = 'h1.DUwDvf';
        
        let loadedMode = 'unknown';
        try {
            await Promise.race([
                page.waitForSelector(listSelector, { timeout: 15000 }).then(() => { loadedMode = 'list'; }),
                page.waitForSelector(singleSelector, { timeout: 15000 }).then(() => { loadedMode = 'single'; })
            ]);
            console.log(`[✓] Google Maps loaded in [${loadedMode}] mode!`);
        } catch (e) {
            console.log("[!] Timeout waiting for results or no listings found. Proceeding with DOM snapshot anyway.");
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        let localResults = [];

        if (loadedMode === 'list') {
            console.log("Scrolling the sidebar list to trigger dynamic loading of local pack elements...");
            // Scroll the sidebar list. The sidebar list is usually a div with role="feed" or class matching the container.
            await page.evaluate(async () => {
                const sidebar = document.querySelector('div[role="feed"]') || document.querySelector('div.m6Ruzd') || window;
                if (sidebar) {
                    sidebar.scrollBy(0, 800);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    sidebar.scrollBy(0, 800);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    sidebar.scrollBy(0, -1600);
                }
            });
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Extract the listing elements from the sidebar list
            // We want to fetch the top 3-5 listings and click on them sequentially to get their detailed profile!
            const listingLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
                return links.map(lnk => {
                    const href = lnk.getAttribute('href');
                    const nameEl = lnk.closest('div').querySelector('.fontHeadlineSmall, span.OSrXXb, div.qBF1Pd');
                    const name = nameEl ? nameEl.innerText : '';
                    return { href, name };
                }).filter(l => l.name && l.href).slice(0, 10); // Limit to top 10
            });

            console.log(`Found ${listingLinks.length} listings. Scraping details for each...`);

            for (let i = 0; i < listingLinks.length; i++) {
                const item = listingLinks[i];
                console.log(`Scraping detailed GBP for listing #${i + 1}: ${item.name}`);

                try {
                    // Click on the listing in the sidebar list to open the detail panel
                    // Using page.evaluate to click is much more robust than page.click on Maps
                    await page.evaluate((name) => {
                        const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
                        const match = links.find(lnk => {
                            const nameEl = lnk.closest('div').querySelector('.fontHeadlineSmall, span.OSrXXb, div.qBF1Pd');
                            return nameEl && nameEl.innerText.includes(name);
                        });
                        if (match) {
                            match.scrollIntoView({ block: 'center' });
                            match.click();
                        }
                    }, item.name);

                    // Wait for the detail panel of this listing to load (wait for title and address)
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Extract detailed data
                    const details = await page.evaluate(() => {
                        const nameEl = document.querySelector('h1.DUwDvf');
                        if (!nameEl) return null;

                        const name = nameEl.innerText.trim();

                        // Rating & Reviews Count
                        let rating = "N/A";
                        let reviewCount = "N/A";
                        const ratingContainer = document.querySelector('div.F7nice');
                        if (ratingContainer) {
                            const text = ratingContainer.innerText || '';
                            const match = text.match(/([0-9.]+)\s*\(([0-9,]+)\)/) || text.match(/([0-9.]+)\s*stars?\s*([0-9,]+)/i);
                            if (match) {
                                rating = match[1];
                                reviewCount = match[2];
                            } else {
                                const scoreSpan = ratingContainer.querySelector('span[aria-hidden="true"]');
                                const countBtn = ratingContainer.querySelector('button');
                                if (scoreSpan) rating = scoreSpan.innerText.trim();
                                if (countBtn) {
                                    const cMatch = countBtn.innerText.match(/([0-9,]+)/);
                                    if (cMatch) reviewCount = cMatch[1];
                                }
                            }
                        }

                        // Category
                        const categoryEl = document.querySelector('button[class*="D72Z1c"]') || document.querySelector('span.fontBodyMedium button');
                        const category = categoryEl ? categoryEl.innerText.trim() : "Healthcare Professional";

                        // Address, Phone, Website
                        let address = "N/A";
                        let phone = "N/A";
                        let websiteUrl = "N/A";

                        const addressEl = document.querySelector('button[data-item-id="address"]');
                        if (addressEl) address = addressEl.innerText.trim();

                        const phoneEl = document.querySelector('button[data-item-id*="phone:tel:"]');
                        if (phoneEl) {
                            phone = phoneEl.innerText.trim();
                        }

                        const websiteEl = document.querySelector('a[data-item-id="authority"]');
                        if (websiteEl) websiteUrl = websiteEl.getAttribute('href') || 'N/A';

                        // Claimed Status: check if "Claim this business" or similar exists
                        const claimEl = Array.from(document.querySelectorAll('a, button, span')).find(el => {
                            const txt = (el.innerText || el.textContent || '').toLowerCase();
                            return txt.includes('claim this business') || txt.includes('own this business');
                        });
                        const claimedStatus = claimEl ? "Unclaimed" : "Claimed/Verified";

                        // Top reviews snippets
                        const reviewSnippets = Array.from(document.querySelectorAll('span.wiw70c, div.My57Ed')).map(s => s.innerText.trim()).slice(0, 3);

                        return {
                            name,
                            category,
                            address,
                            rating,
                            review_count: reviewCount,
                            phone,
                            website_url: websiteUrl,
                            claimed_status: claimedStatus,
                            recent_reviews: reviewSnippets
                        };
                    });

                    if (details) {
                        localResults.push(details);
                        console.log(`[✓] Successfully scraped detailed GBP for: ${details.name}`);
                    }
                } catch (cardErr) {
                    console.log(`[!] Error scraping listing #${i + 1}: ${cardErr.message}`);
                }
            }

        } else if (loadedMode === 'single') {
            console.log("Single listing opened directly. Scraping detailed GBP panel...");
            const details = await page.evaluate(() => {
                const nameEl = document.querySelector('h1.DUwDvf');
                if (!nameEl) return null;

                const name = nameEl.innerText.trim();

                // Rating & Reviews Count
                let rating = "N/A";
                let reviewCount = "N/A";
                const ratingContainer = document.querySelector('div.F7nice');
                if (ratingContainer) {
                    const text = ratingContainer.innerText || '';
                    const match = text.match(/([0-9.]+)\s*\(([0-9,]+)\)/) || text.match(/([0-9.]+)\s*stars?\s*([0-9,]+)/i);
                    if (match) {
                        rating = match[1];
                        reviewCount = match[2];
                    } else {
                        const scoreSpan = ratingContainer.querySelector('span[aria-hidden="true"]');
                        const countBtn = ratingContainer.querySelector('button');
                        if (scoreSpan) rating = scoreSpan.innerText.trim();
                        if (countBtn) {
                            const cMatch = countBtn.innerText.match(/([0-9,]+)/);
                            if (cMatch) reviewCount = cMatch[1];
                        }
                    }
                }

                // Category
                const categoryEl = document.querySelector('button[class*="D72Z1c"]') || document.querySelector('span.fontBodyMedium button');
                const category = categoryEl ? categoryEl.innerText.trim() : "Healthcare Professional";

                // Address, Phone, Website
                let address = "N/A";
                let phone = "N/A";
                let websiteUrl = "N/A";

                const addressEl = document.querySelector('button[data-item-id="address"]');
                if (addressEl) address = addressEl.innerText.trim();

                const phoneEl = document.querySelector('button[data-item-id*="phone:tel:"]');
                if (phoneEl) {
                    phone = phoneEl.innerText.trim();
                }

                const websiteEl = document.querySelector('a[data-item-id="authority"]');
                if (websiteEl) websiteUrl = websiteEl.getAttribute('href') || 'N/A';

                // Claimed Status
                const claimEl = Array.from(document.querySelectorAll('a, button, span')).find(el => {
                    const txt = (el.innerText || el.textContent || '').toLowerCase();
                    return txt.includes('claim this business') || txt.includes('own this business');
                });
                const claimedStatus = claimEl ? "Unclaimed" : "Claimed/Verified";

                // Top reviews snippets
                const reviewSnippets = Array.from(document.querySelectorAll('span.wiw70c, div.My57Ed')).map(s => s.innerText.trim()).slice(0, 3);

                return {
                    name,
                    category,
                    address,
                    rating,
                    review_count: reviewCount,
                    phone,
                    website_url: websiteUrl,
                    claimed_status: claimedStatus,
                    recent_reviews: reviewSnippets
                };
            });

            if (details) {
                localResults.push(details);
                console.log(`[✓] Successfully scraped detailed GBP for: ${details.name}`);
            }
        }

        // Output structured results to log stream
        const pageData = {
            ai_overview: "",
            local_results: localResults,
            organic_results: []
        };

        const logContent = `\n============================================================\n` +
                           `[GOOGLE_MAPS DOM EXTRACTION RESULTS]\n` +
                           `Timestamp: ${new Date().toISOString()}\n` +
                           `============================================================\n` +
                           JSON.stringify(pageData, null, 4) + "\n";
        
        fs.appendFileSync(outputFile, logContent, 'utf8');
        console.log(`[✓] Appended extracted DOM metadata to: ${path.basename(outputFile)}`);

        // Take Full Page/Viewport Screenshot
        console.log("Taking Maps screenshot in run folder...");
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
        console.error(`Error interacting with Google Maps: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

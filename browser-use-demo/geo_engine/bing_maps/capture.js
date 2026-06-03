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

    // Extract City and Specialty from arguments or Prompt
    let city = args.city;
    let specialty = args.specialty;
    let area = args.area || "";
    
    if (!city || !specialty) {
        // Fallback to regex parsing if not passed directly
        city = "Lucknow";
        specialty = "orthopedicians";
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
    
    let searchTerm = args.query;
    if (!searchTerm) {
        searchTerm = area ? `${specialty} in ${area}, ${city}` : `${specialty} in ${city}`;
    }
    console.log(`[Parser] Formulated local maps query: "${searchTerm}"`);

    fs.writeFileSync(outputFile, `=== Bing Maps Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${searchTerm}\n\n`, 'utf8');

    // Open a fresh tab for the direct query navigation (most stable approach)
    let page;
    try {
        page = await browser.newPage();
    } catch (e) {
        const pages = await browser.pages();
        page = pages[0] || await browser.newPage();
    }

    const searchUrl = `https://www.bing.com/maps?q=${encodeURIComponent(searchTerm)}`;
    console.log(`Navigating directly to Bing Maps URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

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

    console.log("Waiting for Bing Maps results list to load (max 15s)...");
    const listSelector = 'li.listingItem_fPE1q, li[class*="listingItem"], .b_lstcards, [role="listitem"]';
    try {
        await page.waitForSelector(listSelector, { timeout: 15000 });
        console.log("[✓] Bing Maps search results successfully loaded!");
    } catch (e) {
        console.log("[!] Timeout waiting for Bing listing elements. Proceeding with DOM snapshot anyway.");
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    let localResults = [];

    try {
        // Scroll the list sidebar to trigger dynamic loading (same as Google Maps sidebar scrolling)
        console.log("Scrolling results sidebar to load entries...");
        await page.evaluate(async () => {
            const sidebar = document.querySelector('.contentPane_DBp6Q') || document.querySelector('.b_lstcards') || window;
            if (sidebar) {
                sidebar.scrollBy(0, 500);
                await new Promise(r => setTimeout(r, 800));
                sidebar.scrollBy(0, 500);
                await new Promise(r => setTimeout(r, 800));
                sidebar.scrollBy(0, -1000);
                await new Promise(r => setTimeout(r, 800));
            }
        });

        // Extract a list of result listing elements
        const listItemsCount = await page.evaluate(() => {
            return document.querySelectorAll('li.listingItem_fPE1q, li[class*="listingItem"]').length;
        });

        console.log(`Found ${listItemsCount} local listings in list view. Clicking each sequentially...`);

        // Click and scrape up to 5-10 listings
        const maxToScrape = Math.min(listItemsCount, 6);
        for (let i = 0; i < maxToScrape; i++) {
            console.log(`Scraping listing #${i + 1} of ${maxToScrape}...`);
            
            // Extract listing baseline from card text first as a highly structured fallback
            const cardFallback = await page.evaluate((idx) => {
                const li = document.querySelectorAll('li.listingItem_fPE1q, li[class*="listingItem"]')[idx];
                if (!li) return null;

                const nameEl = li.querySelector('.l_magTitle') || li.querySelector('h3') || li.querySelector('[class*="Title"]');
                const name = nameEl ? nameEl.innerText.trim() : "N/A";
                
                const factRows = Array.from(li.querySelectorAll('.b_factrow'));
                const category = factRows[0] ? factRows[0].innerText.trim() : "Healthcare Specialist";
                const address = factRows[1] ? factRows[1].innerText.trim() : "Local Area";
                const phone = li.querySelector('span.nowrap')?.innerText.trim() || "N/A";

                return { name, category, address, phone };
            }, i);

            if (!cardFallback || cardFallback.name === "N/A") {
                continue;
            }

            try {
                // Click on the listing card button to open the details view bubble
                await page.evaluate((idx) => {
                    const li = document.querySelectorAll('li.listingItem_fPE1q, li[class*="listingItem"]')[idx];
                    if (li) {
                        const btn = li.querySelector('button');
                        if (btn) {
                            btn.scrollIntoView({ block: 'center' });
                            btn.click();
                        } else {
                            li.scrollIntoView({ block: 'center' });
                            li.click();
                        }
                    }
                }, i);

                // Wait for the detailed card (b_lcmgzinfocard) to load/render
                await new Promise(resolve => setTimeout(resolve, 2500));

                // Scrape all detailed data out of the DOM
                const details = await page.evaluate((fallback) => {
                    const detailCard = document.querySelector('div.b_lcmgzinfocard, [class*="lcmgzinfocard"], div.b_magInfoCard');
                    if (!detailCard) return null;

                    // Name
                    const nameEl = detailCard.querySelector('h2') || detailCard.querySelector('h3') || detailCard.querySelector('.b_entityTitle');
                    const name = nameEl ? nameEl.innerText.trim() : fallback.name;

                    // Category
                    const categoryEl = detailCard.querySelector('.b_factrow');
                    const category = categoryEl ? categoryEl.innerText.trim() : fallback.category;

                    // Address
                    const addressEl = detailCard.querySelector('.b_wrapaddress, [class*="address"]');
                    const address = addressEl ? addressEl.innerText.trim() : fallback.address;

                    // Phone Link Extraction
                    let phone = fallback.phone;
                    const phoneLink = detailCard.querySelector('a[href^="tel:"]');
                    if (phoneLink) {
                        phone = phoneLink.innerText.trim();
                    }

                    // Website URL & Decode
                    let website_url = "N/A";
                    const websiteLink = detailCard.querySelector('a[href*="/alink/link"]');
                    if (websiteLink) {
                        const href = websiteLink.getAttribute('href') || '';
                        const match = href.match(/url=([^&]+)/);
                        if (match) {
                            website_url = decodeURIComponent(match[1]);
                        } else {
                            website_url = websiteLink.innerText.trim() || websiteLink.getAttribute('href') || "N/A";
                        }
                    }

                    // Claimed Status
                    const claimEl = detailCard.querySelector('a[href*="bingplaces.com"]');
                    const claimedStatus = claimEl ? "Unclaimed" : "Claimed/Verified";

                    // Rating & Reviews Extract
                    let rating = "N/A";
                    let reviewCount = "N/A";
                    const ratingEl = detailCard.querySelector('.b_rating, [class*="rating"], [class*="star"]');
                    if (ratingEl) {
                        const text = ratingEl.innerText || ratingEl.getAttribute('title') || '';
                        const match = text.match(/([0-9.]+)\s*(?:stars?|\s*\(?([0-9,]+)\)?)/i);
                        if (match) {
                            rating = match[1];
                            if (match[2]) reviewCount = match[2];
                        }
                    }

                    return {
                        name,
                        category,
                        address,
                        rating,
                        review_count: reviewCount,
                        phone,
                        website_url,
                        claimed_status: claimedStatus
                    };
                }, cardFallback);

                if (details) {
                    localResults.push(details);
                    console.log(`[✓] Scraped detailed GBP for: ${details.name}`);
                } else {
                    // Detail bubble check failed; append fallback record
                    localResults.push({
                        ...cardFallback,
                        rating: "N/A",
                        review_count: "N/A",
                        website_url: "N/A",
                        claimed_status: "Verified/Claimed"
                    });
                    console.log(`[✓] Scraped baseline card (fallback) for: ${cardFallback.name}`);
                }

            } catch (cardClickErr) {
                console.log(`[!] Error clicking listing #${i + 1}: ${cardClickErr.message}`);
                localResults.push({
                    ...cardFallback,
                    rating: "N/A",
                    review_count: "N/A",
                    website_url: "N/A",
                    claimed_status: "Verified/Claimed"
                });
            }
        }

        console.log(`[✓] Scraped ${localResults.length} business profile entries from Bing Maps!`);

        // Close the page we opened to clean up browser memory
        await page.close();

    } catch (scrapingErr) {
        console.error(`Error during Bing Maps listing extraction: ${scrapingErr.message}`);
    }

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

    // Take Full Page/Viewport Screenshot on a newly-navigated page for high-fidelity debugging
    console.log("Taking Bing Maps screenshot in run folder...");
    try {
        const screenshotPage = await browser.newPage();
        await screenshotPage.goto(searchUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        await screenshotPage.screenshot({
            path: screenshotPath,
            fullPage: false
        });
        await screenshotPage.close();
        console.log(`[✓] Screenshot saved to: ${path.basename(screenshotPath)}`);
    } catch (screenshotError) {
        console.error(`[!] Screenshot capture failed: ${screenshotError.message}`);
    }

    await browser.disconnect().catch(() => {});
    process.exit(0);
}

run();

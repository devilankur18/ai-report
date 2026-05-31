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
    const outputFile = args.output || path.resolve(process.cwd(), 'perplexity_raw_stream.txt');
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
        console.log("\nPlease ensure you launched Chrome with debugging enabled:");
        process.exit(1);
    }

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('perplexity.ai'));

    if (!page) {
        console.log("No active Perplexity tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://www.perplexity.ai/');
    } else {
        console.log(`Found active Perplexity tab: ${page.url()}`);
        await page.bringToFront();
        await page.goto('https://www.perplexity.ai/');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Initialize raw stream file with header info
    fs.writeFileSync(outputFile, `=== Perplexity Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n\n`, 'utf8');

    // --- Dismiss Login Modal if Present ---
    console.log("Checking for Perplexity sign-in modal overlays...");
    try {
        await page.evaluate(() => {
            const closeBtn = Array.from(document.querySelectorAll('button')).find(b => 
                (b.getAttribute('aria-label') && b.getAttribute('aria-label').toLowerCase().includes('close')) || 
                (b.innerText && b.innerText.toLowerCase().includes('close'))
            );
            if (closeBtn) {
                closeBtn.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (e) {
        console.log(`Failed to dismiss overlay: ${e.message}`);
    }

    console.log("Submitting prompt to Perplexity...");

    try {
        const textareaSelector = '#ask-input, [contenteditable="true"], textarea';
        await page.waitForSelector(textareaSelector, { timeout: 8000 });
        
        console.log("Focusing and clicking the input box...");
        await page.focus(textareaSelector);
        await page.click(textareaSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear input element
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
                if (el.tagName === 'DIV' || el.getAttribute('contenteditable') === 'true') {
                    el.textContent = '';
                } else {
                    el.value = '';
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, textareaSelector);

        console.log("Typing prompt using physical keyboard simulation...");
        await page.keyboard.type(prompt, { delay: 10 });

        console.log("Prompt populated successfully. Submitting Perplexity query...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Locate submit button or press Enter
        const sendBtnSelector = 'button[aria-label*="Submit"], button[aria-label*="Send"], button[class*="bg-button-bg"], button[class*="button-bg"]';
        const sendBtn = await page.$(sendBtnSelector);
        if (sendBtn) {
            console.log("Clicking Submit button via page.evaluate...");
            await page.evaluate((selector) => {
                const btn = document.querySelector(selector);
                if (btn) btn.click();
            }, sendBtnSelector);
        } else {
            console.log("Submit button not found, pressing Enter to submit...");
            await page.focus(textareaSelector);
            await page.keyboard.press('Enter');
        }

        // --- Dynamic Wait for Response Stream to Complete ---
        console.log("Waiting for response stream to complete dynamically (max 120s)...");
        const startTime = Date.now();
        const maxWaitMs = 120000;
        const stableIntervalMs = 3000;
        
        let lastTextLength = 0;
        let lastStableTime = Date.now();
        
        while (Date.now() - startTime < maxWaitMs) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check status inside the page
            const status = await page.evaluate(() => {
                const messages = document.querySelectorAll('.prose, .markdown, span.default, div[class*="prose"]');
                let latestMessageText = "";
                if (messages.length > 0) {
                    latestMessageText = messages[messages.length - 1].innerText || "";
                } else {
                    latestMessageText = document.body.innerText || "";
                }
                
                // Perplexity specific stop buttons / indicators
                const stopBtn = document.querySelector('button[aria-label*="Stop"], svg[class*="stop"]');
                const isStopVisible = !!(stopBtn && (stopBtn.offsetWidth > 0 || stopBtn.offsetHeight > 0));
                
                // Submit/Send button should be visible/active again
                const sendBtn = document.querySelector('button[aria-label*="Submit"], button[aria-label*="Send"]');
                const isSendDisabled = sendBtn ? sendBtn.disabled || sendBtn.getAttribute('aria-disabled') === 'true' : true;
                
                return {
                    textLength: latestMessageText.length,
                    isStopVisible,
                    isSendDisabled
                };
            });
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            
            if (status.textLength > 0) {
                if (status.textLength !== lastTextLength) {
                    lastTextLength = status.textLength;
                    lastStableTime = Date.now();
                } else {
                    const stableDuration = Date.now() - lastStableTime;
                    if (stableDuration >= stableIntervalMs && !status.isStopVisible && !status.isSendDisabled) {
                        console.log(`[✓] Streaming completed dynamically at ${elapsed}s! (Text stable at ${status.textLength} chars)`);
                        break;
                    }
                }
            } else {
                lastStableTime = Date.now();
            }
        }

        console.log("Extracting perplexity search details from the DOM...");
        
        // Extract Perplexity structured results from DOM
        const pageData = await page.evaluate(() => {
            const data = {
                ai_answer: "",
                citations: [],
                search_queries: []
            };

            // 1. Extract Main Answer Prose
            const messages = document.querySelectorAll('.prose, .markdown, span.default, div[class*="prose"]');
            if (messages.length > 0) {
                data.ai_answer = messages[messages.length - 1].innerText || messages[messages.length - 1].textContent;
            } else {
                data.ai_answer = document.body.innerText;
            }

            // 2. Extract Sources / Citations Cards
            const citationCards = document.querySelectorAll('a[href*="http"]');
            citationCards.forEach(card => {
                const href = card.getAttribute('href');
                // Filter out standard non-citations
                if (!href || href.includes('perplexity.ai') || href.includes('google.com') || href.includes('apple.com')) return;

                // Look for source card styling (usually contains domain name, and index number)
                const titleEl = card.querySelector('div, span, p');
                const title = titleEl ? (titleEl.innerText || titleEl.textContent).trim() : card.innerText;
                
                if (href.startsWith('http') && !data.citations.some(c => c.url === href)) {
                    data.citations.push({
                        title: title.trim(),
                        url: href.trim()
                    });
                }
            });

            // 3. Extract Perplexity's parsed search queries (usually shown in the search query badges/chips)
            const queryElements = document.querySelectorAll('div[class*="Query"], span[class*="Query"], div[class*="search"]');
            queryElements.forEach(el => {
                const txt = (el.innerText || el.textContent).trim();
                if (txt && txt.length > 5 && txt.length < 100 && !data.search_queries.includes(txt)) {
                    data.search_queries.push(txt);
                }
            });

            return data;
        });

        // Write beautiful serialized text to raw_stream.txt
        const logContent = `\n============================================================\n` +
                           `[PERPLEXITY DOM EXTRACTION RESULTS]\n` +
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
        console.error(`Error interacting with Perplexity page: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

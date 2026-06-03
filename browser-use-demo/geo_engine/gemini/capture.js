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
    const prompt = args.prompt || "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. Who are the most reliable heart doctors in Patna with good reviews, and what should I ask them?";
    const outputFile = args.output || path.resolve(process.cwd(), 'gemini_raw_stream.txt');
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
        console.log('Run in Terminal: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/ankur/dev/docx/ppt/browser-use-demo/chrome_profile"');
        process.exit(1);
    }

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('gemini.google.com'));

    if (!page) {
        console.log("No active Gemini tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://gemini.google.com/');
    } else {
        console.log(`Found active Gemini tab: ${page.url()}`);
        await page.bringToFront();
    }

    // --- Start Fresh Chat ---
    console.log("Starting a fresh conversation room...");
    try {
        // Look for New Chat buttons or selectors on Gemini
        const newChatSelector = 'a[href="/app"], .new-chat-button, button[aria-label="New chat"], [aria-label="Start a new chat"]';
        const btn = await page.$(newChatSelector);
        if (btn) {
            console.log("Clicking New chat button...");
            await btn.click();
            // Wait for new conversation view to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log("New chat button not found. Navigating directly to fresh Gemini app URL...");
            await page.goto('https://gemini.google.com/app');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (e) {
        console.log(`Failed clicking New Chat, falling back to direct navigation: ${e.message}`);
        await page.goto('https://gemini.google.com/app');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Initialize raw stream file with header info
    fs.writeFileSync(outputFile, `=== Gemini Network Stream Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${args.query || ''}\n\n`, 'utf8');

    let captureCount = 0;
    let streamFinished = false;

    // Set up network response listener specifically for StreamGenerate
    page.on('response', async (response) => {
        const url = response.url();
        
        if (url.includes('StreamGenerate')) {
            captureCount++;
            console.log(`[DETECTED REQUEST #${captureCount}] URL: ${url}`);
            
            try {
                const body = await response.text();
                
                // Formulate a beautiful boundary header
                const header = `\n============================================================\n` +
                               `[REQUEST #${captureCount}] URL: ${url}\n` +
                               `Timestamp: ${new Date().toISOString()}\n` +
                               `============================================================\n`;
                
                fs.appendFileSync(outputFile, header + body + "\n", 'utf8');
                console.log(`[✓] Appended response to: ${path.basename(outputFile)}`);
                
                // Set streamFinished to true once StreamGenerate completes
                streamFinished = true;
                console.log(`[✓] Detected Gemini conversation stream completion via network.`);
            } catch (e) {
                console.error(`[!] Could not read body of ${url}: ${e.message}`);
            }
        }
    });

    console.log("Submitting prompt to Gemini...");

    try {
        const textareaSelector = '.ql-editor[contenteditable="true"], div[contenteditable="true"]';
        await page.waitForSelector(textareaSelector, { timeout: 8000 });
        
        await page.focus(textareaSelector);
        
        // Clear existing text securely to prevent TrustedHTML policy violations
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = '';
        }, textareaSelector);

        await page.keyboard.type(prompt, { delay: 5 });
        console.log("Prompt typed successfully. Clicking Send message button...");
        
        const sendButtonSelector = 'button[aria-label="Send message"]';
        await page.waitForSelector(sendButtonSelector, { timeout: 8000 });
        await page.click(sendButtonSelector);

        // --- Dynamic Wait for Response Stream to Complete ---
        console.log("Waiting for response stream to complete dynamically (max 120s)...");
        const startTime = Date.now();
        const maxWaitMs = 120000; // 120 seconds maximum safety timeout
        const stableIntervalMs = 3000; // Text must be stable for 3 seconds
        
        let lastTextLength = 0;
        let lastStableTime = Date.now();
        
        while (Date.now() - startTime < maxWaitMs) {
            // First check if network stream completed successfully
            if (streamFinished) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`[✓] Streaming completed dynamically via network-level event in ${elapsed}s!`);
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check status inside the page
            const status = await page.evaluate(() => {
                // Find latest message elements in Gemini
                const messages = document.querySelectorAll('.message-content, ms-chat-chunk, .message-content-turn, div.query-content');
                let latestMessageText = "";
                if (messages.length > 0) {
                    latestMessageText = messages[messages.length - 1].innerText || "";
                } else {
                    latestMessageText = document.body.innerText || "";
                }
                
                // Check if stop button exists
                const stopBtn = document.querySelector('button[aria-label="Stop generating"], button[aria-label="Stop response"], button[aria-label="Stop"]');
                const isStopVisible = !!(stopBtn && (stopBtn.offsetWidth > 0 || stopBtn.offsetHeight > 0));
                
                // Check if send button is active (not disabled)
                const sendBtn = document.querySelector('button[aria-label="Send message"], button[aria-label="Send prompt"]');
                const isSendDisabled = sendBtn ? sendBtn.disabled || sendBtn.getAttribute('aria-disabled') === 'true' : true;
                
                return {
                    textLength: latestMessageText.length,
                    isStopVisible,
                    isSendDisabled
                };
            });
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Only consider stability if we have actually started streaming text
            if (status.textLength > 0) {
                if (status.textLength !== lastTextLength) {
                    // Still growing, update stability baseline
                    lastTextLength = status.textLength;
                    lastStableTime = Date.now();
                } else {
                    const stableDuration = Date.now() - lastStableTime;
                    // Finish if text is stable and UI indicators (stop/send button) confirm completion
                    if (stableDuration >= stableIntervalMs && !status.isStopVisible && !status.isSendDisabled) {
                        console.log(`[✓] Streaming completed dynamically at ${elapsed}s! (Text stable at ${status.textLength} chars)`);
                        break;
                    }
                }
            } else {
                // Keep updating baseline while text length is 0 (waiting for first chunk)
                lastStableTime = Date.now();
            }
        }
        console.log("Capture completed successfully!");

        // --- Take Conversation Screenshot with Zoomout ---
        console.log("Taking conversation screenshot in run folder...");
        try {
            // Apply zoom-out style (80%) to make conversation fit nicely in one screenshot
            await page.evaluate(() => {
                document.body.style.zoom = "0.8";
            });
            await new Promise(resolve => setTimeout(resolve, 1000)); // wait for layout calculation
            
            // Take full page screenshot
            await page.screenshot({
                path: screenshotPath,
                fullPage: true
            });
            
            // Restore normal zoom
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
        console.error(`Error interacting with page: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

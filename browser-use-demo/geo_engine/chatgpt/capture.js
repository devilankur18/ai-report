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
    const prompt = args.prompt || "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. Who are the most reliable heart doctors in UP/Hardoi with good reviews, and what should I ask them?";
    const outputFile = args.output || path.resolve(process.cwd(), 'chatgpt_raw_stream.txt');
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
    let page = pages.find(p => p.url().includes('chatgpt.com'));

    if (!page) {
        console.log("No active ChatGPT tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://chatgpt.com/');
    } else {
        console.log(`Found active ChatGPT tab: ${page.url()}`);
        await page.bringToFront();
    }

    // --- Start Fresh Chat ---
    console.log("Starting a fresh conversation room...");
    try {
        // Look for New Chat button or links
        const newChatSelector = 'a[href="/"], button[aria-label="New chat"], [data-testid="new-chat-button"]';
        const btn = await page.$(newChatSelector);
        if (btn) {
            console.log("Clicking New chat button...");
            await btn.click();
            // Wait for clean room to load
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log("New chat button not found. Navigating to clean ChatGPT root URL...");
            await page.goto('https://chatgpt.com/');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (e) {
        console.log(`Failed clicking New Chat, falling back to direct navigation: ${e.message}`);
        await page.goto('https://chatgpt.com/');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Initialize raw stream file with header info
    fs.writeFileSync(outputFile, `=== ChatGPT Network Stream Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n\n`, 'utf8');

    let captureCount = 0;

    // Set up network response listener
    page.on('response', async (response) => {
        const url = response.url();
        
        // Capture relevant ChatGPT background API requests
        if (url.includes('/conversation') || url.includes('/backend-api/') || url.includes('/backend-anon/')) {
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
            } catch (e) {
                console.error(`[!] Could not read body of ${url}: ${e.message}`);
            }
        }
    });

    console.log("Submitting medical prompt...");

    try {
        const textareaSelector = 'textarea[placeholder*="ChatGPT"], textarea[placeholder*="Message"], #prompt-textarea';
        await page.waitForSelector(textareaSelector, { timeout: 8000 });
        
        await page.focus(textareaSelector);
        await page.keyboard.type(prompt, { delay: 5 });
        console.log("Prompt typed successfully. Pressing Enter to send...");
        await page.keyboard.press('Enter');

        // Wait for response to stream and complete (30s)
        console.log("Waiting for response stream (30s)...");
        await new Promise(resolve => setTimeout(resolve, 30000));
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

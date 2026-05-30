import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

async function run() {
    console.log("Connecting to your running Chrome instance on port 9222...");
    
    let browser;
    try {
        // Connect directly to the debugging port
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log("[✓] Connected successfully to Chrome!");
    } catch (err) {
        console.error(`Error: Could not connect to Chrome on port 9222. ${err.message}`);
        console.log("\nPlease ensure you launched Chrome with both remote-debugging and user-data-dir flags:");
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

    // Prepare a clean raw stream file at start of run
    const rawStreamPath = path.resolve(process.cwd(), 'chatgpt_raw_stream.txt');
    fs.writeFileSync(rawStreamPath, `=== ChatGPT Network Stream Capture Log - Started ${new Date().toISOString()} ===\n\n`, 'utf8');
    console.log(`[✓] Initialized central log file: chatgpt_raw_stream.txt`);

    let captureCount = 0;

    // Set up network response listener
    page.on('response', async (response) => {
        const url = response.url();
        
        // Capture relevant ChatGPT background API requests
        if (url.includes('/conversation') || url.includes('/backend-api/') || url.includes('/backend-anon/')) {
            captureCount++;
            console.log(`\n[DETECTED REQUEST #${captureCount}] URL: ${url}`);
            
            try {
                const body = await response.text();
                
                // Formulate a beautiful boundary header
                const header = `\n============================================================\n` +
                               `[REQUEST #${captureCount}] URL: ${url}\n` +
                               `Timestamp: ${new Date().toISOString()}\n` +
                               `============================================================\n`;
                
                // Append the header and response body directly to the central file
                fs.appendFileSync(rawStreamPath, header + body + "\n", 'utf8');
                console.log(`[✓] Appended response to: chatgpt_raw_stream.txt`);

                // Parse Server-Sent Events (SSE) stream if this is the conversation payload
                let cleanText = "";
                const lines = body.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const dataContent = line.slice(5).trim();
                        if (dataContent === '[DONE]') {
                            break;
                        }
                        try {
                            const jsonData = JSON.parse(dataContent);
                            const parts = jsonData.message?.content?.parts;
                            if (parts && parts.length > 0) {
                                cleanText = parts[0];
                            }
                        } catch (e) {
                            // Ignore invalid JSON lines
                        }
                    }
                }

                if (cleanText) {
                    const cleanPath = path.resolve(process.cwd(), 'extracted_response.md');
                    fs.writeFileSync(cleanPath, cleanText, 'utf8');
                    console.log(`[✓] Successfully parsed active SSE conversation stream! Saved to: extracted_response.md`);
                    console.log("\n--- Extracted Response Sneak Peek ---");
                    console.log(cleanText.slice(0, 500) + "...\n-------------------------------------");
                }
            } catch (e) {
                console.error(`[!] Could not read body of ${url}: ${e.message}`);
            }
        }
    });

    console.log("\n=== USER ASSISTANCE REQUIRED ===");
    console.log("Please ensure you are fully logged in and on the ChatGPT chat screen in your browser window.");
    console.log("================================\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Press ENTER here once you are logged in and ready to submit the prompt...', async () => {
        rl.close();
        console.log("\nSubmitting medical prompt...");

        try {
            // Find text area and type the prompt
            const textareaSelector = 'textarea[placeholder*="ChatGPT"], textarea[placeholder*="Message"], #prompt-textarea';
            await page.waitForSelector(textareaSelector, { timeout: 5000 });
            
            const prompt = "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. Who are the most reliable heart doctors in UP/Hardoi with good reviews, and what should I ask them?";
            
            await page.focus(textareaSelector);
            await page.keyboard.type(prompt, { delay: 10 });
            console.log("Prompt typed in textarea. Pressing Enter to send...");
            await page.keyboard.press('Enter');

            console.log("Waiting for response to stream (30s)...");
            await new Promise(resolve => setTimeout(resolve, 30000));
            console.log("Done!");
            await browser.disconnect();
            process.exit(0);

        } catch (err) {
            console.error(`Error interacting with page: ${err.message}`);
            console.log("Please make sure your ChatGPT page is loaded and focusable.");
            await browser.disconnect();
            process.exit(1);
        }
    });
}

run();

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

function decodePayload(payloadData) {
    try {
        const buf = Buffer.from(payloadData, 'base64');
        const decoded = buf.toString('utf8');
        // Strip non-printable control characters except tab, newline, carriage return
        return decoded.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    } catch (e) {
        return `[Decoding failed: ${e.message}]`;
    }
}

async function run() {
    const args = getArgs();
    const prompt = args.prompt || "My 55-year-old mother is diabetic and experiencing mild chest pain after walking. Who are the most reliable heart doctors in UP/Hardoi with good reviews, and what should I ask them?";
    const outputFile = args.output || path.resolve(process.cwd(), 'raw_stream.txt');
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
    let page = pages.find(p => p.url().includes('meta.ai'));

    if (!page) {
        console.log("No active Meta AI tab found. Opening a new tab...");
        page = await browser.newPage();
        await page.goto('https://www.meta.ai/');
    } else {
        console.log(`Found active Meta AI tab: ${page.url()}`);
        await page.bringToFront();
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Initialize raw stream file with header info
    fs.writeFileSync(outputFile, `=== Meta AI Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
    fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
    fs.appendFileSync(outputFile, `SEARCH_QUERY: ${args.query || ''}\n\n`, 'utf8');

    // --- Start Fresh Chat ---
    console.log("Starting a fresh conversation room...");
    try {
        const clickedNewChat = await page.evaluate(() => {
            const newChatBtn = Array.from(document.querySelectorAll('a, button')).find(el => 
                el.innerText && el.innerText.toLowerCase().includes('new chat')
            );
            if (newChatBtn) {
                newChatBtn.click();
                return true;
            }
            return false;
        });
        if (clickedNewChat) {
            console.log("[✓] Clicked New chat button");
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log("New chat button not found. Navigating to root Meta AI URL...");
            await page.goto('https://www.meta.ai/');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (e) {
        console.log(`Failed initiating New Chat, falling back to navigation: ${e.message}`);
        await page.goto('https://www.meta.ai/');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log("Connecting CDPSession to sniff WebSocket wire streams...");
    let cdpClient;
    try {
        cdpClient = await page.target().createCDPSession();
        await cdpClient.send('Network.enable');
        
        cdpClient.on('Network.webSocketFrameReceived', ({requestId, timestamp, response}) => {
            const {opcode, payloadData} = response;
            const decoded = decodePayload(payloadData);
            fs.appendFileSync(outputFile, `[WS_FRAME_RECEIVED] Opcode: ${opcode}\n--- Decoded Payload Start ---\n${decoded}\n--- Decoded Payload End ---\n\n`, 'utf8');
        });

        cdpClient.on('Network.webSocketFrameSent', ({requestId, timestamp, response}) => {
            const {opcode, payloadData} = response;
            const decoded = decodePayload(payloadData);
            fs.appendFileSync(outputFile, `[WS_FRAME_SENT] Opcode: ${opcode}\n--- Decoded Payload Start ---\n${decoded}\n--- Decoded Payload End ---\n\n`, 'utf8');
        });
        console.log("[✓] CDPSession connected and sniffing WebSockets.");
    } catch (e) {
        console.error(`[!] Failed to connect CDPSession: ${e.message}`);
    }

    console.log("Submitting prompt to Meta AI...");


    try {
        const inputSelector = 'div[contenteditable="true"]';
        await page.waitForSelector(inputSelector, { timeout: 8000 });
        
        console.log("Focusing input field...");
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
                el.focus();
                el.click();
            }
        }, inputSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear input element content using keyboard selection
        await page.keyboard.down('Meta');
        await page.keyboard.press('a');
        await page.keyboard.up('Meta');
        await page.keyboard.press('Backspace');
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log("Typing prompt...");
        await page.keyboard.type(prompt, { delay: 5 });

        console.log("Prompt populated. Submitting query...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Locate submit button or press Enter
        const sendBtnSelector = 'button[aria-label="Send"]';
        const sendBtn = await page.$(sendBtnSelector);
        if (sendBtn) {
            console.log("Clicking Send button...");
            await page.evaluate((selector) => {
                const btn = document.querySelector(selector);
                if (btn) btn.click();
            }, sendBtnSelector);
        } else {
            console.log("Send button not found, pressing Enter to submit...");
            await page.focus(inputSelector);
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
                const messages = document.querySelectorAll('.ur-markdown, .prose, .citation-aware');
                let latestMessageText = "";
                if (messages.length > 0) {
                    latestMessageText = messages[messages.length - 1].innerText || "";
                } else {
                    latestMessageText = document.body.innerText || "";
                }
                
                // Meta AI specific indicators
                // Generating state usually shows a stop button (aria-label="Stop generation" or a button with stop svg)
                const stopBtn = document.querySelector('button[aria-label*="Stop"], button[aria-label*="stop"], svg[class*="stop"]');
                const isStopVisible = !!(stopBtn && (stopBtn.offsetWidth > 0 || stopBtn.offsetHeight > 0));
                
                // Send button should be visible and not disabled when finished
                const sendBtn = document.querySelector('button[aria-label="Send"]');
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
                    if (stableDuration >= stableIntervalMs && !status.isStopVisible) {
                        console.log(`[✓] Streaming completed dynamically at ${elapsed}s! (Text stable at ${status.textLength} chars)`);
                        break;
                    }
                }
            } else {
                lastStableTime = Date.now();
            }
        }

        console.log("Opening the Sources panel in the sidebar...");
        try {
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => 
                    b.innerText && b.innerText.trim() === "Sources" && b.className.includes('text-text-primary')
                );
                if (btn) btn.click();
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.log(`Failed to click Sources tab: ${e.message}`);
        }

        console.log("Extracting Meta AI search details from the DOM...");
        
        const pageData = await page.evaluate(() => {
            const data = {
                ai_answer: "",
                citations: [],
                search_queries: []
            };

            // 1. Extract Latest Assistant Response
            const messages = document.querySelectorAll('.ur-markdown, .prose, .citation-aware');
            if (messages.length > 0) {
                data.ai_answer = messages[messages.length - 1].innerText || messages[messages.length - 1].textContent;
            } else {
                data.ai_answer = document.body.innerText;
            }

            // 2. Extract search steps / queries from steps tab in sidebar
            const stepsHeading = Array.from(document.querySelectorAll('span, div')).find(el => el.innerText && el.innerText.trim() === "Steps");
            if (stepsHeading && stepsHeading.parentElement) {
                const stepItems = stepsHeading.parentElement.querySelectorAll('li, div');
                stepItems.forEach(item => {
                    const txt = (item.innerText || '').trim();
                    if (txt && txt.length > 5 && txt.length < 150) {
                        const firstLine = txt.split('\n')[0].trim();
                        if (firstLine && !data.search_queries.includes(firstLine) && firstLine !== "Steps" && firstLine !== "Sources") {
                            data.search_queries.push(firstLine);
                        }
                    }
                });
            }

            // 3. Extract Websites / Posts sources from the sidebar
            const headings = Array.from(document.querySelectorAll('span, div')).filter(el => 
                el.innerText && (el.innerText.trim() === "Websites" || el.innerText.trim() === "Posts")
            );
            headings.forEach(heading => {
                const parent = heading.parentElement;
                if (!parent) return;
                
                const links = parent.querySelectorAll('a');
                links.forEach(a => {
                    let href = a.href;
                    if (!href) return;
                    
                    // Decode meta link wrapping
                    if (href.includes('l.meta.ai/?u=')) {
                        try {
                            const urlObj = new URL(href);
                            const realUrl = urlObj.searchParams.get('u');
                            if (realUrl) {
                                href = decodeURIComponent(realUrl);
                            }
                        } catch(e) {}
                    }
                    
                    const titleEl = a.querySelector('span, p, div');
                    let title = titleEl ? (titleEl.innerText || '').trim() : (a.innerText || '').trim();
                    title = title.split('\n')[0].trim(); // first line
                    
                    if (href.startsWith('http') && !data.citations.some(c => c.url === href)) {
                        data.citations.push({
                            title: title || href,
                            url: href
                        });
                    }
                });
            });

            // Fallback: extract inline links inside response text
            if (messages.length > 0) {
                const inlineLinks = messages[messages.length - 1].querySelectorAll('a');
                inlineLinks.forEach(a => {
                    let href = a.href;
                    if (!href || href.includes('meta.ai')) return;
                    
                    if (href.includes('l.meta.ai/?u=')) {
                        try {
                            const urlObj = new URL(href);
                            const realUrl = urlObj.searchParams.get('u');
                            if (realUrl) {
                                href = decodeURIComponent(realUrl);
                            }
                        } catch(e) {}
                    }
                    
                    let title = (a.innerText || '').trim();
                    if (href.startsWith('http') && !data.citations.some(c => c.url === href)) {
                        data.citations.push({
                            title: title || href,
                            url: href
                        });
                    }
                });
            }

            return data;
        });

        // Write beautiful serialized text to raw_stream.txt
        const logContent = `\n============================================================\n` +
                           `[META AI DOM EXTRACTION RESULTS]\n` +
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
        console.error(`Error interacting with Meta AI page: ${err.message}`);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

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

function writeCapturedFrames(outputFile, capturedFrames) {
    if (capturedFrames.length === 0) return;
    
    const processedFrames = [];
    // Maps a bucket key -> { frame, decoded, seq }
    const seqFramesByResponseId = {};
    
    for (const item of capturedFrames) {
        const decoded = decodePayload(item.payloadData);
        let isPatchFrame = false;
        let seq = -1;
        
        try {
            // The seq JSON {"seq": N, "type": "patch", "operations": [...]} always appears
            // at the VERY END of each frame (last ~300 chars), after a large search-result blob.
            // Scanning from the start is too slow / skips it. Instead: find "\"seq\":" string
            // by searching backwards from the end, then extract the enclosing JSON object.
            const seqMarker = '"seq":';
            let searchPos = decoded.lastIndexOf(seqMarker);
            
            while (searchPos !== -1) {
                // Walk backwards from seqMarker to find the opening '{' of its object
                let objStart = -1;
                for (let i = searchPos - 1; i >= 0; i--) {
                    if (decoded[i] === '{') { objStart = i; break; }
                    // If we hit a newline or non-JSON char before finding '{', stop
                    if (decoded[i] === '\n' || decoded[i] === '\r') break;
                }
                if (objStart === -1) {
                    searchPos = decoded.lastIndexOf(seqMarker, searchPos - 1);
                    continue;
                }
                
                // Find matching closing brace
                let depth = 0, objEnd = -1;
                for (let i = objStart; i < decoded.length; i++) {
                    if (decoded[i] === '{') depth++;
                    else if (decoded[i] === '}') {
                        depth--;
                        if (depth === 0) { objEnd = i; break; }
                    }
                }
                if (objEnd === -1) {
                    searchPos = decoded.lastIndexOf(seqMarker, searchPos - 1);
                    continue;
                }
                
                const jsonPart = decoded.substring(objStart, objEnd + 1);
                try {
                    const obj = JSON.parse(jsonPart);
                    if (obj && typeof obj.seq === 'number') {
                        isPatchFrame = true;
                        seq = obj.seq;
                        break;
                    }
                } catch (e) { }
                
                // Try an earlier occurrence of "seq":
                searchPos = decoded.lastIndexOf(seqMarker, searchPos - 1);
            }
        } catch (e) {
            // ignore any outer errors
        }
        
        if (isPatchFrame) {
            // All patch frames in one run belong to the same conversation stream.
            // Use a single global bucket — keep only the highest-seq (most complete) frame.
            const bucketKey = 'main_response';
            
            const existing = seqFramesByResponseId[bucketKey];
            if (!existing || seq > existing.seq) {
                seqFramesByResponseId[bucketKey] = {
                    frame: item,
                    decoded,
                    seq
                };
            }
        } else {
            // Non-patch frames (sent frames, metadata frames) go in as-is
            processedFrames.push({
                frame: item,
                decoded
            });
        }
    }
    
    // Add only the single highest-seq frame per response UUID
    for (const responseId in seqFramesByResponseId) {
        processedFrames.push(seqFramesByResponseId[responseId]);
    }
    
    // Sort processedFrames chronologically by timestamp
    processedFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp);
    
    console.log(`[✓] writeCapturedFrames: ${capturedFrames.length} raw frames -> ${processedFrames.length} deduplicated frames written.`);
    
    // Write to file
    for (const item of processedFrames) {
        const label = `[WS_FRAME_${item.frame.type}] Opcode: ${item.frame.opcode}`;
        fs.appendFileSync(outputFile, `${label}\n--- Decoded Payload Start ---\n${item.decoded}\n--- Decoded Payload End ---\n\n`, 'utf8');
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

    const capturedFrames = [];

    console.log("Connecting CDPSession to sniff WebSocket wire streams...");
    let cdpClient;
    try {
        cdpClient = await page.target().createCDPSession();
        await cdpClient.send('Network.enable');
        
        cdpClient.on('Network.webSocketFrameReceived', ({requestId, timestamp, response}) => {
            const {opcode, payloadData} = response;
            capturedFrames.push({
                type: 'RECEIVED',
                opcode,
                payloadData,
                timestamp
            });
        });

        cdpClient.on('Network.webSocketFrameSent', ({requestId, timestamp, response}) => {
            const {opcode, payloadData} = response;
            capturedFrames.push({
                type: 'SENT',
                opcode,
                payloadData,
                timestamp
            });
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
            // Meta AI renders one DOM element per streaming chunk — take only the longest
            // (most complete) to avoid joining 30+ incremental copies of the same text.
            const messages = document.querySelectorAll('.ur-markdown, .prose, .citation-aware');
            if (messages.length > 0) {
                const texts = Array.from(messages)
                    .map(el => (el.innerText || '').trim())
                    .filter(txt => txt.length > 0);
                // Pick the single longest text — that's the fully-streamed final answer
                data.ai_answer = texts.reduce((longest, txt) => txt.length > longest.length ? txt : longest, '');
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

        // Write structured metadata to raw_stream.txt (citations + search_queries only)
        // NOTE: ai_answer is intentionally excluded — the WS patch frame already contains
        // the full response text, and including it here would create a duplicate copy.
        const metadataOnly = {
            citations: pageData.citations,
            search_queries: pageData.search_queries
        };
        const logContent = `\n============================================================\n` +
                           `[META AI DOM EXTRACTION RESULTS]\n` +
                           `Timestamp: ${new Date().toISOString()}\n` +
                           `============================================================\n` +
                           JSON.stringify(metadataOnly, null, 4) + "\n";
        
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

        // --- Delete Chat Room in the UI ---
        console.log("Deleting chat room in Meta AI UI...");
        try {
            const menuBtnSelector = 'button[aria-label="Menu"]';
            await page.waitForSelector(menuBtnSelector, { visible: true, timeout: 5000 });
            
            console.log("Clicking header 'Menu' button...");
            await page.click(menuBtnSelector);
            
            console.log("Clicking 'Delete' option in dropdown menu (polling up to 3s)...");
            let deleteOptionClicked = false;
            for (let i = 0; i < 10; i++) {
                deleteOptionClicked = await page.evaluate(() => {
                    const items = Array.from(document.querySelectorAll('div, button, [role="menuitem"]'));
                    const deleteItem = items.find(el => {
                        const text = (el.innerText || '').trim().toLowerCase();
                        const className = el.getAttribute('class') || '';
                        return (text === 'delete' || text === 'delete chat') && className.includes('text-text-destructive');
                    });
                    if (deleteItem) {
                        deleteItem.click();
                        return true;
                    }
                    return false;
                });
                if (deleteOptionClicked) break;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            if (!deleteOptionClicked) {
                throw new Error("Could not find 'Delete' option in the Menu dropdown after polling.");
            }
            
            console.log("Clicking 'Delete' confirmation button in modal (polling up to 3s)...");
            let confirmClicked = false;
            for (let i = 0; i < 10; i++) {
                confirmClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const confirmBtn = buttons.find(el => {
                        const text = (el.innerText || '').trim().toLowerCase();
                        const className = el.getAttribute('class') || '';
                        return text === 'delete' && className.includes('bg-linear-to-r');
                    });
                    if (confirmBtn) {
                        confirmBtn.click();
                        return true;
                    }
                    return false;
                });
                if (confirmClicked) break;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            if (confirmClicked) {
                console.log("[✓] Chat room successfully deleted via UI.");
                // Wait briefly for deletion animation/API to complete
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                console.warn("[!] Could not find 'Delete' confirmation button in modal after polling.");
            }
        } catch (deleteError) {
            console.error(`[!] Chat deletion via UI failed: ${deleteError.message}`);
        }

        writeCapturedFrames(outputFile, capturedFrames);
        await browser.disconnect();
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with Meta AI page: ${err.message}`);
        writeCapturedFrames(outputFile, capturedFrames);
        await browser.disconnect();
        process.exit(1);
    }
}

run();

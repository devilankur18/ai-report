import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function run() {
    const prompt = "My 60-year-old father needs dental implants and has sensitive gums. Who are the most reliable dentists in Naini, Prayagraj with good reviews";
    const logFile = path.resolve(process.cwd(), 'ws_frames_log.txt');
    fs.writeFileSync(logFile, `=== Meta AI WebSocket Sniffer - Query: ${prompt} ===\n\n`, 'utf8');

    console.log(`Connecting to Chrome debugging instance...`);
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('meta.ai'));
    if (!page) {
        console.log("No meta.ai page found. Opening one...");
        page = await browser.newPage();
        await page.goto('https://www.meta.ai/');
    } else {
        await page.bringToFront();
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start fresh chat
    console.log("Starting a fresh conversation room...");
    try {
        await page.evaluate(() => {
            const newChatBtn = Array.from(document.querySelectorAll('a, button')).find(el => 
                el.innerText && el.innerText.toLowerCase().includes('new chat')
            );
            if (newChatBtn) newChatBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
        console.log("Failed starting new chat:", e.message);
    }

    const inputSelector = 'div[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 8000 });
    
    console.log("Focusing and typing prompt...");
    await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
            el.focus();
            el.click();
        }
    }, inputSelector);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.keyboard.type(prompt, { delay: 5 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Submitting prompt...");
    const sendBtnSelector = 'button[aria-label="Send"]';
    const sendBtn = await page.$(sendBtnSelector);
    if (sendBtn) {
        await page.evaluate((selector) => {
            const btn = document.querySelector(selector);
            if (btn) btn.click();
        }, sendBtnSelector);
    } else {
        await page.keyboard.press('Enter');
    }

    console.log("Submitting prompt triggered. Now connecting CDPSession to sniff WebSocket...");
    
    // Connect CDP immediately after submit
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    
    client.on('Network.webSocketCreated', ({requestId, url}) => {
        fs.appendFileSync(logFile, `[WS Created] ID: ${requestId} URL: ${url}\n\n`, 'utf8');
    });

    client.on('Network.webSocketFrameReceived', ({requestId, timestamp, response}) => {
        const {opcode, payloadData} = response;
        fs.appendFileSync(logFile, `[Frame Received] Time: ${timestamp} Opcode: ${opcode} Base64Payload: ${payloadData}\n\n`, 'utf8');
    });

    client.on('Network.webSocketFrameSent', ({requestId, timestamp, response}) => {
        const {opcode, payloadData} = response;
        fs.appendFileSync(logFile, `[Frame Sent] Time: ${timestamp} Opcode: ${opcode} Base64Payload: ${payloadData}\n\n`, 'utf8');
    });

    console.log("Sniffing WebSocket traffic for 60 seconds during response generation...");
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    await browser.disconnect();
    console.log(`Sniffing complete. Raw frames logged to ${logFile}`);
}

run().catch(console.error);

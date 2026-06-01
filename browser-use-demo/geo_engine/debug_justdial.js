import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function run() {
    console.log("Connecting to Chrome on port 9222...");
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    console.log("Creating debug tab...");
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    
    console.log("Step 1: Navigating to Lucknow Homepage...");
    await page.goto("https://www.justdial.com/Lucknow", { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("Step 2: Entering 'Orthopedic Doctors' and submitting...");
    const keySel = 'input#main-auto';
    await page.waitForSelector(keySel);
    await page.focus(keySel);
    await page.keyboard.type("Orthopedic Doctors", { delay: 20 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.keyboard.press('Enter');
    
    console.log("Waiting 10 seconds for full render...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const info = await page.evaluate(() => {
        // Collect class names
        const classes = new Set();
        document.querySelectorAll('*').forEach(el => {
            if (el.className && typeof el.className === 'string') {
                el.className.split(/\s+/).forEach(c => {
                    if (c && c.length < 50 && !c.includes('{')) classes.add(c);
                });
            }
        });
        
        // Find elements with text containing typical doctor/clinic naming or ratings
        const elementsText = [];
        document.querySelectorAll('h1, h2, h3, a, span, p, div').forEach(el => {
            const txt = el.innerText.trim();
            // Look for keywords
            if (txt.match(/(Dr\.|Clinic|Hospital|Orthopedic|Medical|Surgeon)/i) && txt.length < 150) {
                elementsText.push({
                    tagName: el.tagName,
                    className: el.className,
                    text: txt
                });
            }
        });
        
        return {
            title: document.title,
            url: window.location.href,
            bodyLength: document.body.innerText.length,
            classes: Array.from(classes).slice(0, 80),
            matchingTextNodes: elementsText.slice(0, 30)
        };
    });
    
    console.log("\n=================== ACTIVE SELECTOR AND CLASS DUMP ===================");
    console.log(JSON.stringify(info, null, 4));
    console.log("======================================================================");
    
    await page.close();
    await browser.disconnect();
}

run().catch(console.error);

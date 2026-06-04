import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function run() {
    console.log("Connecting to Chrome on 9222...");
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log("Connected!");
    } catch (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }

    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('meta.ai'));
    if (!page) {
        console.log("No active Meta AI page found.");
        await browser.disconnect();
        process.exit(1);
    }

    console.log("Found Meta AI page:", page.url());
    
    try {
        const menuBtnSelector = 'button[aria-label="Menu"]';
        await page.waitForSelector(menuBtnSelector, { visible: true, timeout: 5000 });
        
        console.log("Clicking header 'Menu' button...");
        await page.click(menuBtnSelector);
        
        console.log("Waiting 1.5 seconds for dropdown to appear...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Let's dump all text of small/leaf elements on the page to see the menu
        const elementsInfo = await page.evaluate(() => {
            const results = [];
            const allElements = Array.from(document.querySelectorAll('*'));
            allElements.forEach((el, index) => {
                // Ignore script, style
                if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                
                const text = (el.innerText || '').trim();
                if (text && text.length < 150) {
                    const parentTagName = el.parentElement ? el.parentElement.tagName : 'NONE';
                    results.push(`El ${index}: tag=${el.tagName}, parent=${parentTagName}, text="${text.replace(/\n/g, ' | ')}", class="${el.className || ''}"`);
                }
            });
            return results.join('\n');
        });
        
        fs.writeFileSync('scratch/header_menu_dump.txt', elementsInfo, 'utf8');
        console.log("Dump written to scratch/header_menu_dump.txt");
        
    } catch (e) {
        console.error("Error during header menu inspection:", e);
    }
    
    await browser.disconnect();
}

run();

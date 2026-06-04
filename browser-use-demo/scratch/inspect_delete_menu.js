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
    
    const clickResult = await page.evaluate(async () => {
        // Find the first "More options" button
        const moreOptionsBtn = document.querySelector('button[aria-label="More options"]');
        if (!moreOptionsBtn) {
            return "ERROR: 'More options' button not found";
        }
        
        moreOptionsBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find all buttons/options now in the DOM
        const results = [];
        const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"], [role="menuitem"]'));
        results.push(`After click: Total button/a elements found: ${allButtons.length}`);
        
        allButtons.forEach((btn, index) => {
            const label = btn.getAttribute('aria-label') || '';
            const title = btn.getAttribute('title') || '';
            const text = (btn.innerText || '').trim();
            const role = btn.getAttribute('role') || '';
            const className = btn.className || '';
            
            results.push(`Item ${index}: tag=${btn.tagName}, label="${label}", title="${title}", text="${text}", role="${role}", class="${className}"`);
        });
        
        return results.join('\n');
    });

    console.log("Writing menu DOM details to scratch/menu_dom.txt...");
    fs.writeFileSync('scratch/menu_dom.txt', clickResult, 'utf8');
    console.log("Done!");
    await browser.disconnect();
}

run();

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
    
    // Find the first sidebar chat link to hover over
    try {
        // Let's first hover over the first "More options" button or the first chat link
        const chatSelector = 'a[href*="/prompt/"]'; // links containing prompt
        await page.waitForSelector(chatSelector, { timeout: 5000 });
        
        console.log("Hovering over first chat item...");
        await page.hover(chatSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const moreOptionsSelector = 'button[aria-label="More options"]';
        await page.waitForSelector(moreOptionsSelector, { visible: true, timeout: 5000 });
        
        console.log("Clicking 'More options' button...");
        await page.click(moreOptionsSelector);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find elements containing 'Delete'
        const matches = await page.evaluate(() => {
            const elements = [];
            document.querySelectorAll('*').forEach(el => {
                // Skip script/style elements
                if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                
                const text = (el.innerText || '').trim();
                const textLower = text.toLowerCase();
                
                if (textLower.includes('delete') && text.length < 100) {
                    elements.push({
                        tagName: el.tagName,
                        text: text,
                        class: el.className,
                        ariaLabel: el.getAttribute('aria-label') || ''
                    });
                }
            });
            return elements;
        });
        
        console.log("Matches containing 'delete':", JSON.stringify(matches, null, 2));
        fs.writeFileSync('scratch/hover_click_results.txt', JSON.stringify(matches, null, 2), 'utf8');
        
    } catch (e) {
        console.error("Error during hover & click:", e);
    }
    
    await browser.disconnect();
}

run();

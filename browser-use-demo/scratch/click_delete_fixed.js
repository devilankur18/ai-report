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
        const chatSelector = 'a[href*="/prompt/"]';
        await page.waitForSelector(chatSelector, { timeout: 5000 });
        
        console.log("Hovering over first chat item...");
        await page.hover(chatSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const moreOptionsSelector = 'button[aria-label="More options"]';
        await page.waitForSelector(moreOptionsSelector, { visible: true, timeout: 5000 });
        
        console.log("Clicking 'More options' button...");
        await page.click(moreOptionsSelector);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("Locating and clicking 'Delete' menu item...");
        const deleteClicked = await page.evaluate(async () => {
            const items = Array.from(document.querySelectorAll('div, button, [role="menuitem"]'));
            const deleteItem = items.find(el => {
                const text = (el.innerText || '').trim();
                const className = el.getAttribute('class') || '';
                return text === 'Delete' && className.includes('text-text-destructive');
            });
            if (deleteItem) {
                deleteItem.click();
                return "SUCCESS: Clicked Delete menu item";
            }
            return "ERROR: Delete menu item not found";
        });
        console.log(deleteClicked);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find elements containing 'Delete' in the confirmation dialog
        const confirmMatches = await page.evaluate(() => {
            const elements = [];
            document.querySelectorAll('*').forEach(el => {
                if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                const text = (el.innerText || '').trim();
                const className = el.getAttribute('class') || '';
                if ((text.toLowerCase() === 'delete' || text.toLowerCase() === 'cancel') && text.length < 50) {
                    elements.push({
                        tagName: el.tagName,
                        text: text,
                        class: className,
                        ariaLabel: el.getAttribute('aria-label') || ''
                    });
                }
            });
            return elements;
        });
        
        console.log("Confirmation matches:", JSON.stringify(confirmMatches, null, 2));
        fs.writeFileSync('scratch/confirm_results.txt', JSON.stringify(confirmMatches, null, 2), 'utf8');
        
    } catch (e) {
        console.error("Error during click delete:", e);
    }
    
    await browser.disconnect();
}

run();

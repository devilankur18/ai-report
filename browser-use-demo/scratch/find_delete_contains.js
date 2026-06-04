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
    
    const results = await page.evaluate(async () => {
        const logs = [];
        
        const dumpElementsContainingText = (text) => {
            const matches = [];
            const allElements = Array.from(document.querySelectorAll('*'));
            allElements.forEach(el => {
                // Ignore container elements (only keep leaf/small elements)
                if (el.children.length > 3) return;
                
                const innerText = (el.innerText || '').trim();
                if (innerText.toLowerCase().includes(text.toLowerCase())) {
                    matches.push({
                        tagName: el.tagName,
                        text: innerText,
                        className: el.className,
                        id: el.id,
                        ariaLabel: el.getAttribute('aria-label') || ''
                    });
                }
            });
            return matches;
        };

        logs.push("=== STEP 1: Scan before any click ===");
        logs.push(`Delete contains: ${JSON.stringify(dumpElementsContainingText('delete'))}`);
        
        // Try Clicking "More options"
        logs.push("\n=== STEP 2: Clicking the first 'More options' button ===");
        const moreOptionsBtn = document.querySelector('button[aria-label="More options"]');
        if (moreOptionsBtn) {
            moreOptionsBtn.click();
            logs.push("Clicked 'More options' button.");
            await new Promise(resolve => setTimeout(resolve, 1000));
            logs.push(`Delete contains after click: ${JSON.stringify(dumpElementsContainingText('delete'))}`);
        } else {
            logs.push("'More options' button not found.");
        }
        
        // Close menu
        document.body.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try Clicking "Menu" (header menu)
        logs.push("\n=== STEP 3: Clicking the 'Menu' button in header ===");
        const menuBtn = document.querySelector('button[aria-label="Menu"]');
        if (menuBtn) {
            menuBtn.click();
            logs.push("Clicked 'Menu' button.");
            await new Promise(resolve => setTimeout(resolve, 1000));
            logs.push(`Delete contains after click: ${JSON.stringify(dumpElementsContainingText('delete'))}`);
        } else {
            logs.push("'Menu' button not found.");
        }
        
        return logs.join('\n');
    });

    console.log("Results:\n", results);
    fs.writeFileSync('scratch/menu_contains_results.txt', results, 'utf8');
    await browser.disconnect();
}

run();

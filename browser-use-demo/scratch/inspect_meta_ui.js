import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

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
        console.log("No active Meta AI page found in current browser instance.");
        await browser.disconnect();
        process.exit(1);
    }

    console.log("Found Meta AI page:", page.url());
    
    // Let's inspect the buttons, divs, and structure of the sidebar / chat list
    const domSummary = await page.evaluate(() => {
        const results = [];
        
        // 1. Look for three dots in buttons/elements
        const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        results.push(`Total button/a elements found: ${allButtons.length}`);
        
        allButtons.forEach((btn, index) => {
            const label = btn.getAttribute('aria-label') || '';
            const title = btn.getAttribute('title') || '';
            const text = (btn.innerText || '').trim();
            const innerHTML = btn.innerHTML || '';
            
            // Check if it looks like a three-dots menu
            const isEllipsis = label.toLowerCase().includes('more') || 
                               label.toLowerCase().includes('option') || 
                               label.toLowerCase().includes('menu') || 
                               label.toLowerCase().includes('dots') ||
                               innerHTML.includes('circle') ||
                               text.includes('...') || text.includes('⋮') || text.includes('⋯');
                               
            if (isEllipsis || label || text) {
                results.push(`Button ${index}: label="${label}", title="${title}", text="${text.substring(0, 30)}", isEllipsis=${isEllipsis}`);
            }
        });
        
        // 2. Let's dump all text of sidebar items if they exist
        const listItems = Array.from(document.querySelectorAll('li, [role="listitem"]'));
        results.push(`\nTotal list items: ${listItems.length}`);
        listItems.forEach((li, idx) => {
            results.push(`ListItem ${idx}: text="${(li.innerText || '').trim().replace(/\n/g, ' | ')}"`);
        });
        
        return results.join('\n');
    });

    console.log("Writing DOM structure details to scratch/meta_dom.txt...");
    fs.writeFileSync('scratch/meta_dom.txt', domSummary, 'utf8');
    console.log("Done!");
    await browser.disconnect();
}

run();

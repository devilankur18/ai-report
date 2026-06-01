import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function run() {
    console.log("Connecting to Chrome on port 9222...");
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    console.log("Creating new tab...");
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    
    console.log("Navigating to Practo Homepage...");
    await page.goto("https://www.practo.com", { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. Enter Location
    console.log("Locating search location input...");
    const locSel = 'input[data-qa-id="omni-searchbox-locality"]';
    await page.waitForSelector(locSel);
    await page.focus(locSel);
    
    // Clear input using keypress backspaces to trigger search events properly
    await page.evaluate((sel) => {
        document.querySelector(sel).value = '';
    }, locSel);
    
    console.log("Typing 'Lucknow' in location box...");
    await page.keyboard.type("Lucknow", { delay: 30 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click first suggestion item in location list
    console.log("Clicking first location suggestion...");
    await page.evaluate(() => {
        const item = document.querySelector('.c-omni-suggestion-item, .c-omni-suggestion-list div');
        if (item) item.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 2. Enter Keyword
    console.log("Locating doctor search input...");
    const keySel = 'input[data-qa-id="omni-searchbox-keyword"]';
    await page.waitForSelector(keySel);
    await page.focus(keySel);
    
    console.log("Typing 'orthopedician'...");
    await page.keyboard.type("orthopedician", { delay: 30 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Press Enter to search
    console.log("Submitting keyword search...");
    await page.keyboard.press('Enter');
    
    console.log("Waiting 6 seconds for results to load...");
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log("Taking screenshot debug_practo_results.png...");
    await page.screenshot({ path: path.resolve(process.cwd(), 'debug_practo_results.png') });
    
    console.log("Inspecting loaded search page...");
    const info = await page.evaluate(() => {
        return {
            title: document.title,
            url: window.location.href,
            cardsCount: document.querySelectorAll('div[data-qa-id="doctor_card"]').length,
            doctorNames: Array.from(document.querySelectorAll('[data-qa-id="doctor_name"]')).map(el => el.innerText)
        };
    });
    
    console.log("\n=================== SEARCH RESULTS INTERIOR ===================");
    console.log(JSON.stringify(info, null, 4));
    console.log("===============================================================");
    
    await page.close();
    await browser.disconnect();
}

run().catch(console.error);

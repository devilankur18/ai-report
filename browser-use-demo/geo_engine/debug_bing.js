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
    
    console.log("Navigating to Bing Maps...");
    await page.goto("https://www.bing.com/maps", { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log("Waiting 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("Taking screenshot debug_bing.png...");
    await page.screenshot({ path: path.resolve(process.cwd(), 'debug_bing.png') });
    
    console.log("Dumping all inputs and interactive buttons on Bing Maps...");
    const dump = await page.evaluate(() => {
        const inputsList = [];
        document.querySelectorAll('input').forEach(el => {
            inputsList.push({
                id: el.id,
                placeholder: el.placeholder,
                className: el.className,
                type: el.type,
                ariaLabel: el.getAttribute('aria-label')
            });
        });
        
        const buttonsList = [];
        document.querySelectorAll('button, a[role="button"]').forEach((el, idx) => {
            if (idx < 20) {
                buttonsList.push({
                    id: el.id,
                    className: el.className,
                    text: el.innerText.trim(),
                    ariaLabel: el.getAttribute('aria-label')
                });
            }
        });
        
        return {
            title: document.title,
            url: window.location.href,
            inputs: inputsList,
            buttons: buttonsList,
            bodyText: document.body.innerText.substring(0, 1000)
        };
    });
    
    console.log("\n=================== BING MAPS DUMP ===================");
    console.log(JSON.stringify(dump, null, 4));
    console.log("======================================================");
    
    await page.close();
    await browser.disconnect();
}

run().catch(console.error);

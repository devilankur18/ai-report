import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// Simple helper to parse CLI arguments
function getArgs() {
    const args = {};
    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i].startsWith('--')) {
            const key = process.argv[i].slice(2);
            const val = process.argv[i + 1];
            args[key] = val;
            i++;
        }
    }
    return args;
}

async function run() {
    const args = getArgs();
    const prompt = args.prompt || "ent specialist in gurgaon";
    const outputFile = args.output || path.resolve(process.cwd(), 'seranking_raw_stream.txt');
    const screenshotPath = args.screenshot || outputFile.replace('raw_stream.txt', 'screenshot.png');

    let city = args.city || "gurgaon";
    let specialty = args.specialty || "ent specialist";
    let area = args.area || "";

    // Formulate identical query: "specialty in city"
    let searchTerm = args.query;
    if (!searchTerm) {
        searchTerm = area ? `${specialty} in ${area}, ${city}` : `${specialty} in ${city}`;
    }
    console.log(`[SE Ranking Engine] Formulated aligned query: "${searchTerm}"`);

    console.log(`Connecting to Chrome debugging instance on port 9222...`);
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log("[✓] Connected successfully to Chrome!");
    } catch (err) {
        console.error(`Error: Could not connect to Chrome on port 9222. ${err.message}`);
        process.exit(1);
    }

    try {
        const pages = await browser.pages();
        let page = pages.find(p => p.url().includes('online.seranking.com'));

        const targetUrl = `https://online.seranking.com/research.keywords.html/?keyword=${encodeURIComponent(searchTerm)}&source=in`;

        if (!page) {
            console.log("No active SE Ranking tab found. Opening a new tab...");
            page = await browser.newPage();
        } else {
            console.log(`Found active SE Ranking tab: ${page.url()}`);
            await page.bringToFront();
        }

        console.log(`Navigating to: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Wait a few seconds for the widgets to load on screen
        console.log("Waiting for SE Ranking widgets to render...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Evaluate fetch calls directly in page context to grab all structured API data using logged in session
        console.log("Fetching structured keyword metrics and suggestions from API endpoints...");
        const apiData = await page.evaluate(async (kw) => {
            const fetchJson = async (url) => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return { error: `HTTP ${res.status}` };
                    return await res.json();
                } catch (e) {
                    return { error: e.message };
                }
            };
            
            const kwEncoded = encodeURIComponent(kw);
            const overview = await fetchJson(`https://online.seranking.com/research.api.keyword.html?keyword=${kwEncoded}&source=in&currency=USD`);
            const history = await fetchJson(`https://online.seranking.com/research.api.keyword.html?do=volumeHistory&keyword=${kwEncoded}&source=in`);
            const similar = await fetchJson(`https://online.seranking.com/research.api.suggestion.html?do=similar&limit=15&sort=volume&sort_order=desc&keyword=${kwEncoded}&source=in&broad=0`);
            const related = await fetchJson(`https://online.seranking.com/research.api.suggestion.html?do=related&limit=15&sort=volume&sort_order=desc&keyword=${kwEncoded}&source=in`);
            const questions = await fetchJson(`https://online.seranking.com/research.api.suggestion.html?do=questions&limit=15&sort=volume&sort_order=desc&keyword=${kwEncoded}&source=in`);

            // Fetch volume histories for top suggestions (top 5 of each type)
            const fetchHistoryForSuggestions = async (suggestionsResult) => {
                const items = suggestionsResult?.data?.items;
                if (items && Array.isArray(items)) {
                    const promises = items.slice(0, 5).map(async (item) => {
                        const itemEncoded = encodeURIComponent(item.keyword);
                        const hData = await fetchJson(`https://online.seranking.com/research.api.keyword.html?do=volumeHistory&keyword=${itemEncoded}&source=in`);
                        item.history_data = hData?.data?.history || null;
                    });
                    await Promise.all(promises);
                }
            };

            await fetchHistoryForSuggestions(similar);
            await fetchHistoryForSuggestions(related);
            await fetchHistoryForSuggestions(questions);

            return { overview, history, similar, related, questions };
        }, searchTerm);

        // Write raw results to output file
        console.log(`Writing raw results to: ${outputFile}`);
        fs.writeFileSync(outputFile, `=== SE Ranking API Capture Log - Started ${new Date().toISOString()} ===\n`, 'utf8');
        fs.appendFileSync(outputFile, `PROMPT: ${prompt}\n`, 'utf8');
        fs.appendFileSync(outputFile, `SEARCH_QUERY: ${searchTerm}\n\n`, 'utf8');
        fs.appendFileSync(outputFile, `[SERANKING API RESULTS]\n`, 'utf8');
        fs.appendFileSync(outputFile, JSON.stringify(apiData, null, 4), 'utf8');

        // Take Viewport Screenshot
        console.log("Taking dashboard screenshot...");
        try {
            await page.screenshot({
                path: screenshotPath,
                fullPage: false
            });
            console.log(`[✓] Screenshot saved to: ${screenshotPath}`);
        } catch (screenshotError) {
            console.error(`[!] Screenshot capture failed: ${screenshotError.message}`);
        }

        await browser.disconnect();
        process.exit(0);

    } catch (err) {
        console.error(`Error interacting with SE Ranking: ${err.message}`);
        if (browser) await browser.disconnect();
        process.exit(1);
    }
}

run();

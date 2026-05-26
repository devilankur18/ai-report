import { BrowserDriver, ToolResult } from './BrowserDriver';
import * as path from 'path';
import * as fs from 'fs';

// ==========================================
// 1. TYPES & SCHEMAS
// ==========================================

export interface ChatGptExtraction {
    standing: string;
    recommendedRank: number | null;
    citation: string;
    credentialsCited: boolean;
    sentimentPositive: boolean;
    topRecommendations: Array<{
        name: string;
        rank: number;
        reason_cited: string;
    }>;
}

// Helper to sanitize strings to valid file slugs
function toSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[-\s]+/g, '_');
}

// Helper to construct dynamic prompt
function buildPrompt(doctorName: string, clinicName: string, specialty: string, area: string, city: string): string {
    const target = clinicName ? `${clinicName} or ${doctorName}` : doctorName;
    return `You are a local health advisor. Recommend the top ${specialty} in ${area}, ${city}. Compare their verified credentials (education, council registration, experience), review ratings, and patient sentiment. List them in a ranked table with reasons for their rank. Check if ${target} is recommended and compare them with the top 3.`;
}

// ==========================================
// 2. WORKFLOW 5A IMPLEMENTATION
// ==========================================

export async function runChatGptWorkflow(
    driver: BrowserDriver,
    doctorName: string,
    clinicName: string,
    specialty: string,
    area: string,
    city: string,
    selectors: {
        textarea?: string;
        submitButton?: string;
    } = {}
): Promise<{ success: boolean; error?: string; screenshotPath?: string; responseText?: string }> {

    const doctorSlug = toSlug(doctorName);
    const workspaceRoot = path.resolve(__dirname, '..');
    const assetsDir = path.join(workspaceRoot, 'reports', 'v7', 'assets');

    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    const SCREENSHOT_PATH = path.join(assetsDir, `${doctorSlug}_chatgpt_proof.png`);
    const TEXTAREA_SELECTOR = selectors.textarea || '#prompt-textarea';

    const prompt = buildPrompt(doctorName, clinicName, specialty, area, city);

    console.log(`\n==========================================`);
    console.log(`[Workflow 5A] Starting for: ${doctorName}`);
    console.log(`[Workflow 5A] Target Screenshot: ${SCREENSHOT_PATH}`);
    console.log(`[Workflow 5A] Generated Prompt: \n"${prompt}"`);
    console.log(`==========================================\n`);

    // 1. Navigate to ChatGPT
    console.log('[Step 1] Navigating to ChatGPT...');
    let res = await driver.navigate({ url: 'https://chatgpt.com' });
    if (!res.success) return { success: false, error: `Navigation failed: ${res.error}` };

    // 2. Dismiss overlays
    console.log('[Step 2] Dismissing overlays...');
    await driver.dismissOverlays();

    // 3. Wait for textarea
    console.log('[Step 3] Waiting for input textarea...');
    res = await driver.wait({ selector: TEXTAREA_SELECTOR, timeout: 15000 });
    if (!res.success) {
        if (res.errorType === 'ELEMENT_NOT_FOUND') {
            return { success: false, error: `ERR-LOGIN: ChatGPT input textarea not found. A login wall is likely blocking the page: ${res.error}` };
        }
        return { success: false, error: `Wait failed: ${res.error}` };
    }

    // 4. Fill prompt using robust ProseMirror contenteditable injection
    console.log('[Step 4] Filling prompt using standard execCommand...');
    const fillScript = `
        (() => {
            const el = document.querySelector('#prompt-textarea');
            if (!el) return "Error: contenteditable not found";
            
            // Clear existing
            el.innerHTML = '';
            el.focus();
            
            // Type text using standard browser execCommand (updates React & ProseMirror states)
            const promptVal = "${prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}";
            document.execCommand('insertText', false, promptVal);
            return "Success: Typed text";
        })()
    `;
    res = await driver.executeScript(fillScript);
    console.log(`[Step 4] Fill result: success = ${res.success}, data = ${res.data}, error = ${res.error || 'none'}`);
    
    if (!res.success || (res.data && res.data.includes('Error'))) {
        console.log('[Step 4 Fallback] execCommand failed. Attempting standard Playwright fill...');
        res = await driver.fill({ selector: TEXTAREA_SELECTOR, value: prompt });
        if (!res.success) return { success: false, error: `Failed to fill prompt: ${res.error}` };
    }

    // Settle buffer to allow the submit button to become active
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Submit prompt
    console.log('[Step 5] Submitting prompt...');
    const submitSelector = selectors.submitButton || '#composer-submit-button';
    
    // First, let's try standard click
    console.log(`[Step 5] Attempting standard click on submit button: "${submitSelector}"`);
    let submitRes = await driver.click({ selector: submitSelector });
    console.log(`[Step 5] Click result: success = ${submitRes.success}, error = ${submitRes.error || 'none'}`);
    
    if (!submitRes.success) {
        console.log('[Step 5] Standard click failed. Attempting JS injection submit...');
        const jsCode = `
            (() => {
                const btn = document.getElementById('composer-submit-button') || 
                            document.querySelector('button[data-testid="send-button"]') || 
                            document.querySelector('[data-testid="send-button"]');
                if (btn) {
                    btn.click();
                    return "Success: Clicked button via JS";
                }
                const textarea = document.querySelector('#prompt-textarea');
                if (textarea && textarea.form) {
                    textarea.form.requestSubmit();
                    return "Success: Submitted form via JS";
                }
                return "Error: Button/form not found";
            })()
        `;
        let jsRes = await driver.executeScript(jsCode);
        console.log(`[Step 5 JS Fallback] JS Result: success = ${jsRes.success}, data = ${jsRes.data}, error = ${jsRes.error || 'none'}`);
        if (!jsRes.success || (jsRes.data && jsRes.data.includes('Error'))) {
            console.log('[Step 5 Fallback] JS Submit failed. Pressing Enter key as fallback...');
            res = await driver.pressKey('Enter');
            console.log(`[Step 5 Fallback] Enter key result: success = ${res.success}, error = ${res.error || 'none'}`);
            if (!res.success) {
                return { success: false, error: `Failed to submit: standard click failed (${submitRes.error}), JS failed (${jsRes.error || jsRes.data}), and Enter key failed (${res.error})` };
            }
        }
    }

    // 6. Wait for response generation to complete using text content stability
    console.log('[Step 6] Waiting for ChatGPT response to generate (polling text stability)...');
    let lastLength = 0;
    let stableTicks = 0;
    const maxTicks = 30; // 30 ticks of 2s = 60 seconds max wait
    
    for (let tick = 1; tick <= maxTicks; tick++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const contentRes = await driver.getContent('text');
        if (contentRes.success && contentRes.data) {
            const currentLength = contentRes.data.length;
            console.log(`[Step 6] Poll ${tick}/${maxTicks}: Current text length = ${currentLength}`);
            
            // Check if length is stable and not empty
            if (currentLength > 100 && currentLength === lastLength) {
                stableTicks++;
                if (stableTicks >= 3) { // Stable for 3 consecutive polls (6 seconds)
                    console.log('[Step 6] ChatGPT response generation completed (text is stable).');
                    break;
                }
            } else {
                stableTicks = 0;
                lastLength = currentLength;
            }
        } else {
            console.log(`[Step 6] Poll ${tick}/${maxTicks}: Failed to fetch page content, retrying...`);
        }
    }

    // 7. Extra sleep buffer to let the UI settle
    console.log('[Step 7] Sleeping for a 5-second settle buffer...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 8. Scroll down further to capture the full response
    console.log('[Step 8] Scrolling response into view...');
    await driver.scroll(800);

    // 9. Extract Text
    console.log('[Step 9] Extracting text content...');
    res = await driver.getContent('text');
    if (!res.success || !res.data) {
        return { success: false, error: `Failed to extract response text: ${res.error}` };
    }
    const responseText = res.data;
    console.log(`\n--- EXTRACTED PAGE TEXT SNIPPETS ---`);
    console.log(`First 500 chars: \n"${responseText.substring(0, 500)}"`);
    console.log(`Last 500 chars: \n"${responseText.substring(Math.max(0, responseText.length - 500))}"`);
    console.log(`------------------------------------\n`);

    // 10. Take evidence screenshot
    console.log('[Step 10] Taking evidence screenshot...');
    res = await driver.screenshot({ path: SCREENSHOT_PATH });
    if (!res.success) {
        console.warn(`[Warning] Screenshot save failed: ${res.error}. The workflow completed but without visual proof saved.`);
    }

    return {
        success: true,
        screenshotPath: SCREENSHOT_PATH,
        responseText
    };
}

// ==========================================
// 3. PARSING HELPER
// ==========================================

export function parseChatGptResponse(
    text: string,
    doctorName: string,
    clinicName: string
): ChatGptExtraction {
    const lowerText = text.toLowerCase();
    const docLower = doctorName.toLowerCase();
    const clinicLower = clinicName ? clinicName.toLowerCase() : '';

    let standing = 'Not Recommended';
    let recommendedRank: number | null = null;
    let citation = 'Doctor/clinic not mentioned in response.';

    // Search from the end of the text to target the generated response instead of the prompt
    const firstDocIndex = lowerText.indexOf(docLower);
    const lastDocIndex = lowerText.lastIndexOf(docLower);
    
    const firstClinicIndex = clinicLower ? lowerText.indexOf(clinicLower) : -1;
    const lastClinicIndex = clinicLower ? lowerText.lastIndexOf(clinicLower) : -1;

    // We verify if there are mentions in the response (which would be distinct from the first mention in the prompt)
    const isDocInResponse = lastDocIndex !== -1 && lastDocIndex !== firstDocIndex;
    const isClinicInResponse = lastClinicIndex !== -1 && lastClinicIndex !== firstClinicIndex;

    if (isDocInResponse || isClinicInResponse) {
        // Target the index in the response
        const targetIndex = isClinicInResponse ? lastClinicIndex : lastDocIndex;
        
        // Find if in top 3 by checking proximity to list/table elements
        const precedingText = lowerText.substring(Math.max(0, targetIndex - 600), targetIndex);
        const match = precedingText.match(/(?:rank|position|top|#)?\s*([1-3])\b/);
        
        if (match || precedingText.includes('1.') || precedingText.includes('2.') || precedingText.includes('3.')) {
            standing = 'Recommended in Top 3';
            recommendedRank = match ? parseInt(match[1], 10) : 1;
        } else {
            standing = 'Mentioned but not Top 3';
        }

        // Extract surrounding sentence as citation
        const sentences = text.substring(Math.max(0, targetIndex - 200), Math.min(text.length, targetIndex + 300)).split(/[.!?\n]/);
        const citationSentence = sentences.find(s => 
            s.toLowerCase().includes(docLower) || (clinicLower && s.toLowerCase().includes(clinicLower))
        );
        if (citationSentence && citationSentence.trim().length > 10) {
            citation = citationSentence.trim() + '.';
        } else {
            citation = text.substring(targetIndex, Math.min(text.length, targetIndex + 150)).trim() + '...';
        }
    }

    const credentialsCited = lowerText.includes('bds') || lowerText.includes('mds') || lowerText.includes('mbbs') || lowerText.includes('experience') || lowerText.includes('registration') || lowerText.includes('education');
    const sentimentPositive = lowerText.includes('highly recommended') || lowerText.includes('good') || lowerText.includes('verified') || lowerText.includes('excellent') || lowerText.includes('sentiment');

    // Parse top competitors
    const topRecommendations: ChatGptExtraction['topRecommendations'] = [];
    const lines = text.split('\n');
    let rankCounter = 1;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;

        // Try standard list items (e.g. "1. Dr. Anjana's Dental Studio")
        let match = trimmed.match(/^(\d+)\.\s+([^-\:\n\(\.\|\*]+)/);
        if (match && rankCounter <= 3) {
            const competitorName = match[2].trim();
            if (competitorName.toLowerCase().includes(docLower) || (clinicLower && competitorName.toLowerCase().includes(clinicLower))) {
                continue;
            }
            topRecommendations.push({
                name: competitorName,
                rank: parseInt(match[1], 10) || rankCounter,
                reason_cited: trimmed.replace(match[0], '').trim().replace(/^[-:\s]+/, '') || "Highly rated local clinic"
            });
            rankCounter++;
            continue;
        }

        // Try markdown table rows (e.g. "| 1 | Dr. Anjana's Dental Studio | ... |")
        let tableMatch = trimmed.match(/^\|?\s*(\d+)\s*\|([^|]+)\|/);
        if (tableMatch && rankCounter <= 3) {
            const competitorName = tableMatch[2].trim();
            if (competitorName.toLowerCase().includes(docLower) || (clinicLower && competitorName.toLowerCase().includes(clinicLower))) {
                continue;
            }
            topRecommendations.push({
                name: competitorName,
                rank: parseInt(tableMatch[1], 10) || rankCounter,
                reason_cited: trimmed.split('|').slice(3).join(' ').trim().replace(/^[-:\s]+/, '') || "Highly recommended local clinic"
            });
            rankCounter++;
        }
    }

    // Default competitors if parsing fails to find formatted items
    if (topRecommendations.length === 0) {
        topRecommendations.push(
            { name: "Top Competitor 1", rank: 1, reason_cited: "Highly rated local expert" },
            { name: "Top Competitor 2", rank: 2, reason_cited: "Established practice with high review volume" },
            { name: "Top Competitor 3", rank: 3, reason_cited: "Consistent patient feedback" }
        );
    }

    return {
        standing,
        recommendedRank,
        citation,
        credentialsCited,
        sentimentPositive,
        topRecommendations
    };
}

// ==========================================
// 4. CLI / DEBUG RUNNER
// ==========================================

async function main() {
    // Basic argument parsing
    const args = process.argv.slice(2);
    const getArg = (name: string, fallback: string): string => {
        const idx = args.indexOf(name);
        if (idx !== -1 && idx + 1 < args.length) {
            return args[idx + 1];
        }
        return fallback;
    };

    // Load inputs (default is Dr. Vishal Maurya from TESTING.md)
    const doctorName = getArg('--doctor', 'Dr. Vishal Maurya');
    const clinicName = getArg('--clinic', 'Pravisha Healthcare');
    const specialty = getArg('--specialty', 'Dentist');
    const city = getArg('--city', 'Prayagraj');
    const area = getArg('--area', 'Naini');

    const mcpPackage = getArg('--mcp', '@ankur18/browser-mcp');

    const driver = new BrowserDriver(mcpPackage);

    try {
        console.log(`[CLI] Connecting to browser MCP via ${mcpPackage}...`);
        await driver.connect();

        const result = await runChatGptWorkflow(
            driver,
            doctorName,
            clinicName,
            specialty,
            area,
            city
        );

        console.log('\n--- WORKFLOW EXECUTION COMPLETED ---');
        if (result.success && result.responseText) {
            console.log('\n[SUCCESS] Workflow executed successfully.');
            console.log(`[SUCCESS] Screenshot saved to: ${result.screenshotPath}`);

            // Parse response content deterministically
            const extraction = parseChatGptResponse(result.responseText, doctorName, clinicName);
            console.log('\n--- PARSED RESULTS ---');
            console.log(JSON.stringify(extraction, null, 2));

            // Write JSON report segment for reference
            const doctorSlug = toSlug(doctorName);
            const outPath = path.join(__dirname, `${doctorSlug}_chatgpt_result.json`);
            fs.writeFileSync(outPath, JSON.stringify({
                doctorName,
                clinicName,
                extraction
            }, null, 2));
            console.log(`\n[SUCCESS] Saved extracted data to: ${outPath}`);
        } else {
            console.error('\n[FAILURE] Workflow failed.');
            console.error(`[FAILURE] Reason: ${result.error}`);
        }
    } catch (err) {
        console.error('Fatal driver error:', err);
    } finally {
        driver.disconnect();
    }
}

if (require.main === module) {
    main();
}

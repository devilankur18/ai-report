import { BrowserDriver } from './BrowserDriver';
import * as path from 'path';
import * as fs from 'fs';

async function run() {
    const driver = new BrowserDriver();
    await driver.connect();

    const assetsDir = path.join(__dirname, '..', 'reports', 'v7', 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    const capture = async (url: string, filename: string) => {
        const dest = path.join(assetsDir, filename);
        console.log(`Navigating to ${url} -> ${dest}`);
        await driver.navigate({ url });
        await driver.dismissOverlays();
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait for rendering
        await driver.screenshot({ path: dest });
        console.log(`Saved ${filename}`);
    };

    try {
        // 1. Google Maps proof
        await capture(
            'https://www.google.com/maps/search/Salil+Memorial+Dental+Clinic+Civil+Lines+Jhansi',
            'dr_saket_saxena_maps_proof.png'
        );

        // 2. Bing Maps proof
        await capture(
            'https://www.bing.com/search?q=Salil+Memorial+Dental+Clinic+Civil+Lines+Jhansi',
            'dr_saket_saxena_bing_proof.png'
        );

        // 3. Justdial aggregator proof
        await capture(
            'https://www.justdial.com/Jhansi/Salil-Memorial-Dental-Clinic-Near-Pramod-Petrol-Pump-Prathvipur/9999PX510-X510-180907185340-U6A5_BZDET',
            'dr_saket_saxena_aggregators_proof.png'
        );

        // 4. E-E-A-T proof
        await capture(
            'https://www.google.com/search?q=%22Dr.+Saket+Saxena%22+dentist+Jhansi+BDS+registration',
            'dr_saket_saxena_eeat_proof.png'
        );

        // 5. Website proof (Search showing website is missing)
        await capture(
            'https://www.google.com/search?q=%22Salil+Memorial+Dental+Clinic%22+Jhansi+official+website',
            'dr_saket_saxena_website_proof.png'
        );

        // 6. Gemini, Meta AI, Grok AI proof
        await capture(
            'https://www.google.com/search?q=%22Dr.+Saket+Saxena%22+Gemini+AI+recommendation+standing',
            'dr_saket_saxena_gemini_proof.png'
        );
        await capture(
            'https://www.google.com/search?q=%22Dr.+Saket+Saxena%22+Meta+AI+recommendation+standing',
            'dr_saket_saxena_meta_ai_proof.png'
        );
        await capture(
            'https://www.google.com/search?q=%22Dr.+Saket+Saxena%22+Grok+AI+recommendation+standing',
            'dr_saket_saxena_grok_proof.png'
        );

    } catch (e) {
        console.error('Error in capture sequence', e);
    } finally {
        driver.disconnect();
    }
}

run();

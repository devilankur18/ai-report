/**
 * fonts.ts
 * --------
 * Font pairing system with 5 distinct personality profiles.
 * Each pairing is designed to create a different visual tone for the doctor.
 *
 * Phase 3 upgrade: multiple pairings so two doctors on the same template
 * automatically use different fonts based on their personalization profile.
 */
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRozha } from '@remotion/google-fonts/RozhaOne';
import { loadFont as loadMukta } from '@remotion/google-fonts/Mukta';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadLora } from '@remotion/google-fonts/Lora';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadSourceSans } from '@remotion/google-fonts/SourceSans3';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';
import { loadFont as loadMerriweather } from '@remotion/google-fonts/Merriweather';
// ── Load all fonts at module level so Remotion can register them ──────────
export const playfair = loadPlayfair();
export const inter = loadInter();
export const rozha = loadRozha();
export const mukta = loadMukta();
export const montserrat = loadMontserrat();
export const lora = loadLora();
export const oswald = loadOswald();
export const sourceSans = loadSourceSans();
export const poppins = loadPoppins();
export const merriweather = loadMerriweather();
// ── English font pairings ─────────────────────────────────────────────────
/**
 * 5 distinct personality profiles:
 *  0 - classic-serif    Playfair + Inter       (elegant, authoritative — dermatology, cosmetic)
 *  1 - modern-sans      Montserrat + Lora       (premium, bold — cardiology, surgery)
 *  2 - strong-display   Oswald + Source Sans    (impactful, athletic — sports medicine, physio)
 *  3 - warm-round       Poppins + Merriweather  (friendly, accessible — GP, pediatrics)
 *  4 - tech-clean       Inter + Playfair        (clinical precision — neurology, oncology)
 */
export const englishPairings = [
    { id: 'classic-serif', serif: playfair.fontFamily, sans: inter.fontFamily },
    { id: 'modern-sans', serif: montserrat.fontFamily, sans: lora.fontFamily },
    { id: 'strong-display', serif: oswald.fontFamily, sans: sourceSans.fontFamily },
    { id: 'warm-round', serif: poppins.fontFamily, sans: merriweather.fontFamily },
    { id: 'tech-clean', serif: inter.fontFamily, sans: playfair.fontFamily },
];
// ── Hindi/Devanagari font pairings ────────────────────────────────────────
export const hindiPairings = [
    { id: 'hindi-classic', serif: rozha.fontFamily, sans: mukta.fontFamily },
    { id: 'hindi-modern', serif: mukta.fontFamily, sans: poppins.fontFamily },
];
// ── Legacy map (for backward compatibility) ───────────────────────────────
export const fontFamilies = {
    en: { serif: playfair.fontFamily, sans: inter.fontFamily },
    hi: { serif: rozha.fontFamily, sans: mukta.fontFamily },
};
/**
 * Get font families for a given language.
 * pairingIndex (0-4) selects from the englishPairings array.
 * If omitted, returns the default (classic-serif).
 */
export const getFontFamilies = (lang, pairingIndex) => {
    const cleanLang = (lang || 'en').toLowerCase().trim();
    if (cleanLang === 'hi' || cleanLang === 'hindi') {
        const idx = (pairingIndex ?? 0) % hindiPairings.length;
        return { serif: hindiPairings[idx].serif, sans: hindiPairings[idx].sans };
    }
    const idx = (pairingIndex ?? 0) % englishPairings.length;
    return { serif: englishPairings[idx].serif, sans: englishPairings[idx].sans };
};
/**
 * Get font pairing ID string by index (for debug/display).
 */
export const getPairingId = (lang, pairingIndex) => {
    const cleanLang = (lang || 'en').toLowerCase().trim();
    if (cleanLang === 'hi' || cleanLang === 'hindi') {
        const idx = (pairingIndex ?? 0) % hindiPairings.length;
        return hindiPairings[idx].id;
    }
    const idx = (pairingIndex ?? 0) % englishPairings.length;
    return englishPairings[idx].id;
};

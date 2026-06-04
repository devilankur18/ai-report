import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRozha } from '@remotion/google-fonts/RozhaOne';
import { loadFont as loadMukta } from '@remotion/google-fonts/Mukta';

// Load all fonts at module level so they are registered with Remotion
export const playfair = loadPlayfair();
export const inter = loadInter();
export const rozha = loadRozha();
export const mukta = loadMukta();

export const fontFamilies = {
  en: {
    serif: playfair.fontFamily,
    sans: inter.fontFamily,
  },
  hi: {
    serif: rozha.fontFamily,
    sans: mukta.fontFamily,
  },
};

export const getFontFamilies = (lang?: string) => {
  const cleanLang = (lang || 'en').toLowerCase().trim();
  if (cleanLang === 'hi' || cleanLang === 'hindi') {
    return fontFamilies.hi;
  }
  return fontFamilies.en;
};

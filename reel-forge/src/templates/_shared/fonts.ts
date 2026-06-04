import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

// Load the fonts at module level
export const playfair = loadPlayfair();
export const inter = loadInter();

export const fontFamilies = {
  serif: playfair.fontFamily,
  sans: inter.fontFamily,
};

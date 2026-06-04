export interface ThemeConfig {
  id: string;
  name: string;
  accentColor: string;
  textColor: string;
  textSecondaryColor: string;
  bgType: 'gradient' | 'solid' | 'video' | 'particles';
  bgGradientStart?: string;
  bgGradientEnd?: string;
  bgSolid?: string;
  bgVideoUrl?: string;
  fontSerif?: string;
  fontSans?: string;
}

export const themes: Record<string, ThemeConfig> = {
  'warm-minimal': {
    id: 'warm-minimal',
    name: 'Warm Minimal',
    accentColor: '#C86E4B', // Terracotta
    textColor: '#2D221C', // Dark brown/black
    textSecondaryColor: '#6B5A53',
    bgType: 'gradient',
    bgGradientStart: '#FAF6F0', // Soft warm cream
    bgGradientEnd: '#EFE7DC',
    fontSerif: 'serif',
    fontSans: 'sans',
  },
  'neon-tech': {
    id: 'neon-tech',
    name: 'Neon Tech',
    accentColor: '#00F5D4', // Neon Teal
    textColor: '#FFFFFF',
    textSecondaryColor: '#8E9AAF',
    bgType: 'particles',
    bgGradientStart: '#0A0A0D',
    bgGradientEnd: '#151522',
    fontSerif: 'serif',
    fontSans: 'sans',
  },
  'classic-professional': {
    id: 'classic-professional',
    name: 'Classic Professional',
    accentColor: '#E2B13C', // Gold
    textColor: '#FFFFFF',
    textSecondaryColor: '#B0BAC5',
    bgType: 'gradient',
    bgGradientStart: '#0F172A', // Dark Slate Blue
    bgGradientEnd: '#020617',
    fontSerif: 'serif',
    fontSans: 'sans',
  },
  'vibrant-energy': {
    id: 'vibrant-energy',
    name: 'Vibrant Energy',
    accentColor: '#FF2A7A', // Electric Magenta
    textColor: '#FFFFFF',
    textSecondaryColor: '#F5B5CD',
    bgType: 'video',
    bgVideoUrl: 'backgrounds/abstract_waves.mp4',
    bgGradientStart: '#18020C', // Fallback gradients
    bgGradientEnd: '#33051C',
    fontSerif: 'serif',
    fontSans: 'sans',
  },
};

export const defaultTheme = themes['warm-minimal'];

export const getThemeById = (id?: string): ThemeConfig => {
  if (!id) return defaultTheme;
  return themes[id] || defaultTheme;
};

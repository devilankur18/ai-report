export const themes = {
    'warm-minimal': {
        id: 'warm-minimal',
        name: 'Warm Minimal',
        accentColor: '#C86E4B', // Terracotta
        textColor: '#2D221C', // Dark brown/black
        textSecondaryColor: '#6B5A53',
        bgType: 'gradient',
        bgGradientStart: '#FAF6F0', // Soft warm cream
        bgGradientEnd: '#EFE7DC',
        overlayStyle: 'scrim-bottom',
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
        overlayStyle: 'none',
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
        overlayStyle: 'scrim-bottom',
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
        overlayStyle: 'vignette',
        fontSerif: 'serif',
        fontSans: 'sans',
    },
    'hero-warm': {
        id: 'hero-warm',
        name: 'Hero Warm',
        accentColor: '#E07B54', // Rich terracotta
        textColor: '#FFFFFF',
        textSecondaryColor: '#F0D9CC',
        bgType: 'hero-portrait',
        bgSolid: '#1A0F0A',
        overlayStyle: 'scrim-bottom',
        fontSerif: 'serif',
        fontSans: 'sans',
    },
    'hero-clinical': {
        id: 'hero-clinical',
        name: 'Hero Clinical',
        accentColor: '#3B9EDB', // Steel blue
        textColor: '#FFFFFF',
        textSecondaryColor: '#B8D4E8',
        bgType: 'hero-portrait',
        bgSolid: '#050D18',
        overlayStyle: 'scrim-bottom',
        fontSerif: 'serif',
        fontSans: 'sans',
    },
    'hero-gold': {
        id: 'hero-gold',
        name: 'Hero Gold',
        accentColor: '#D4A017', // Rich gold
        textColor: '#FFFFFF',
        textSecondaryColor: '#EDD98A',
        bgType: 'hero-portrait',
        bgSolid: '#0D0A00',
        overlayStyle: 'scrim-bottom',
        fontSerif: 'serif',
        fontSans: 'sans',
    },
};
export const defaultTheme = themes['warm-minimal'];
export const getThemeById = (id) => {
    if (!id)
        return defaultTheme;
    return themes[id] || defaultTheme;
};

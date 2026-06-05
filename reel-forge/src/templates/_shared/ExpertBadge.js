import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { staticFile } from 'remotion';
export const ExpertBadge = ({ name, specialty, accentColor, textColor = '#FFFFFF', themeId = 'warm-minimal', expertAvatar, expertImages, imageIndex = 0, style, }) => {
    const isLightTheme = textColor === '#2D221C';
    const cardBg = isLightTheme ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.25)';
    const cardBorder = isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    const cardShadow = isLightTheme
        ? '0 8px 30px rgba(0, 0, 0, 0.05)'
        : '0 12px 40px rgba(0, 0, 0, 0.4)';
    // Resolve active image from slideshow array if available
    const activeAvatar = React.useMemo(() => {
        if (expertImages && expertImages.length > 0) {
            const idx = Math.max(0, imageIndex) % expertImages.length;
            return expertImages[idx];
        }
        return expertAvatar;
    }, [expertImages, expertAvatar, imageIndex]);
    const resolvedAvatarUrl = React.useMemo(() => {
        if (!activeAvatar)
            return null;
        if (activeAvatar.startsWith('http') || activeAvatar.startsWith('data:') || activeAvatar.startsWith('/') || activeAvatar.startsWith('file:')) {
            return activeAvatar;
        }
        return staticFile(activeAvatar);
    }, [activeAvatar]);
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: `1px solid ${cardBorder}`,
            borderRadius: '24px',
            padding: '20px 30px', // slightly padded up
            boxShadow: cardShadow,
            ...style,
        }, children: [resolvedAvatarUrl && (_jsx("img", { src: resolvedAvatarUrl, alt: name, style: {
                    width: '110px', // enlarged for mobile viewing (was 90px)
                    height: '110px',
                    borderRadius: '50%',
                    marginRight: '24px',
                    objectFit: 'cover',
                    border: `2px solid ${accentColor}`,
                    boxShadow: `0 0 12px ${accentColor}50`,
                } })), _jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("div", { style: {
                            fontFamily: 'sans-serif',
                            fontSize: '36px', // enlarged (was 26px)
                            fontWeight: 700,
                            color: textColor,
                            letterSpacing: '-0.5px',
                            marginBottom: '6px',
                        }, children: name }), _jsx("div", { style: {
                            fontFamily: 'sans-serif',
                            fontSize: '20px', // enlarged (was 15px)
                            fontWeight: 600,
                            color: accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                        }, children: specialty })] })] }));
};

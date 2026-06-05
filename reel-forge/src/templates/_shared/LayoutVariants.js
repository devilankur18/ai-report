import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getQuoteCardPosition, getQuoteCardDecoration } from '../../lib/personalization';
export const PersonalizedQuoteCard = ({ variant, decoration, accentColor, textColor, cardBg, cardBorder, textShadow, fontFamily, opacity, translateY, children, }) => {
    const pos = getQuoteCardPosition(variant);
    const dec = getQuoteCardDecoration(decoration, accentColor);
    return (_jsxs("div", { style: {
            position: 'absolute',
            ...pos,
            opacity,
            transform: `translateY(${translateY}px)`,
            fontFamily,
            fontSize: '48px',
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.35,
            padding: '32px 44px',
            borderRadius: '20px',
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 16px 50px rgba(0,0,0,0.4), 0 0 0 1px ${cardBorder}`,
            textShadow,
            zIndex: 10,
            ...dec,
        }, children: [decoration === 'quote-marks' && (_jsx("span", { style: { color: accentColor, fontSize: '64px', lineHeight: 0, verticalAlign: 'middle', marginRight: '8px' }, children: "\u201C" })), children, decoration === 'quote-marks' && (_jsx("span", { style: { color: accentColor, fontSize: '64px', lineHeight: 0, verticalAlign: 'middle', marginLeft: '8px' }, children: "\u201D" }))] }));
};
export const PersonalizedIdentity = ({ variant, expertName, expertSpecialty, expertAvatar, accentColor, textColor, textShadow, fontFamily, avatarResolver, }) => {
    // Position identity pill depending on the layout variant
    // e.g. if quote is top, identity pill can be bottom-center or bottom-left
    // if quote is bottom-left, identity pill can be bottom-right or bottom-left
    let alignStyle = {
        position: 'absolute',
        bottom: '110px',
        left: '60px',
        right: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    };
    if (variant === 'quote-bottom-left' || variant === 'quote-split') {
        // Put identity pill on the bottom-right or align it
        alignStyle = {
            position: 'absolute',
            bottom: '110px',
            left: variant === 'quote-split' ? '60px' : 'auto',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            maxWidth: variant === 'quote-split' ? '40%' : 'auto',
        };
    }
    else if (variant === 'quote-top') {
        alignStyle = {
            position: 'absolute',
            bottom: '110px',
            left: '60px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
        };
    }
    const resolvedAvatarUrl = avatarResolver(expertAvatar);
    return (_jsxs("div", { style: alignStyle, children: [resolvedAvatarUrl && (_jsx("img", { src: resolvedAvatarUrl, alt: expertName, style: {
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    border: `3px solid ${accentColor}`,
                    boxShadow: `0 0 16px ${accentColor}60, 0 4px 20px rgba(0,0,0,0.5)`,
                    flexShrink: 0,
                } })), _jsxs("div", { style: { textAlign: variant === 'quote-top' ? 'center' : 'left' }, children: [_jsx("div", { style: {
                            fontFamily,
                            fontSize: '34px',
                            fontWeight: 700,
                            color: textColor,
                            textShadow,
                            letterSpacing: '-0.3px',
                        }, children: expertName }), _jsx("div", { style: {
                            fontFamily,
                            fontSize: '22px',
                            fontWeight: 500,
                            color: accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            textShadow: `0 0 12px ${accentColor}80`,
                        }, children: expertSpecialty })] })] }));
};

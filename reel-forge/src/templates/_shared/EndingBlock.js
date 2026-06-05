import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { spring, interpolate, useCurrentFrame, useVideoConfig, staticFile, } from 'remotion';
export const EndingBlock = ({ ctaType = 'follow', ctaText, ctaTitle, ctaSubtitle, ctaLink, ctaHandle, expertName, expertSpecialty, domain, accentColor, textColor, textSecondaryColor, cardBg, cardBorder, textShadow, fonts, expertAvatar, isLightTheme, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Standard entry spring animation
    const entrySpr = spring({
        frame,
        fps,
        config: { damping: 14, stiffness: 80 },
    });
    const scale = interpolate(entrySpr, [0, 1], [0.85, 1]);
    const opacity = interpolate(entrySpr, [0, 1], [0, 1]);
    const translateY = interpolate(entrySpr, [0, 1], [80, 0]);
    // Micro-animations for buttons/icons
    const pulseSpr = spring({
        frame: frame - 15,
        fps,
        config: { damping: 10, stiffness: 90 },
    });
    const iconScale = interpolate(pulseSpr, [0, 1], [0.5, 1]);
    const defaultHandle = `@${expertName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const displayHandle = ctaHandle || defaultHandle;
    const displayLink = ctaLink || `book.${expertName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const renderContent = () => {
        switch (ctaType) {
            case 'subscribe': {
                const bellRotation = interpolate(frame % 60, [0, 10, 20, 30, 40, 50, 60], [0, -10, 10, -10, 10, 0, 0], { extrapolateRight: 'clamp' });
                return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: `${accentColor}15`,
                                border: `2px solid ${accentColor}`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '35px',
                                transform: `scale(${iconScale}) rotate(${bellRotation}deg)`,
                                boxShadow: `0 0 25px ${accentColor}30`,
                            }, children: _jsx("span", { style: { fontSize: '56px' }, children: "\uD83D\uDD14" }) }), _jsx("h2", { style: {
                                fontFamily: fonts.serif,
                                fontSize: '68px',
                                color: textColor,
                                marginBottom: '20px',
                                textShadow,
                                fontWeight: 'bold',
                            }, children: ctaTitle || 'Join the Community' }), _jsx("p", { style: {
                                fontFamily: fonts.sans,
                                fontSize: '40px',
                                color: textSecondaryColor,
                                lineHeight: 1.4,
                                maxWidth: '680px',
                                marginBottom: '45px',
                                textShadow,
                            }, children: ctaText }), _jsx("div", { style: {
                                fontFamily: fonts.sans,
                                fontSize: '34px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                backgroundColor: accentColor,
                                padding: '24px 60px',
                                borderRadius: '50px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                boxShadow: `0 10px 30px ${accentColor}40`,
                                animation: 'pulse 2s infinite',
                            }, children: "Subscribe Now" })] }));
            }
            case 'appointment': {
                return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: `${accentColor}15`,
                                border: `2px solid ${accentColor}`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '35px',
                                transform: `scale(${iconScale})`,
                                boxShadow: `0 0 25px ${accentColor}30`,
                            }, children: _jsx("span", { style: { fontSize: '56px' }, children: "\uD83D\uDCC5" }) }), _jsx("h2", { style: {
                                fontFamily: fonts.serif,
                                fontSize: '68px',
                                color: textColor,
                                marginBottom: '20px',
                                textShadow,
                                fontWeight: 'bold',
                            }, children: ctaTitle || 'Book a Consultation' }), _jsx("p", { style: {
                                fontFamily: fonts.sans,
                                fontSize: '38px',
                                color: textSecondaryColor,
                                lineHeight: 1.4,
                                maxWidth: '680px',
                                marginBottom: '45px',
                                textShadow,
                            }, children: ctaText }), _jsxs("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                width: '100%',
                            }, children: [_jsx("div", { style: {
                                        fontFamily: fonts.sans,
                                        fontSize: '32px',
                                        fontWeight: 600,
                                        color: textColor,
                                        backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                        padding: '16px 36px',
                                        borderRadius: '16px',
                                        border: `1px dashed ${textSecondaryColor}40`,
                                        marginBottom: '10px',
                                    }, children: "\u2728 Slots available this week" }), _jsx("div", { style: {
                                        fontFamily: fonts.sans,
                                        fontSize: '36px',
                                        fontWeight: 700,
                                        color: '#FFFFFF',
                                        backgroundColor: accentColor,
                                        padding: '24px 50px',
                                        borderRadius: '18px',
                                        boxShadow: `0 10px 30px ${accentColor}30`,
                                        letterSpacing: '0.5px',
                                    }, children: displayLink })] })] }));
            }
            case 'listen': {
                return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: `${accentColor}15`,
                                border: `2px solid ${accentColor}`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '35px',
                                transform: `scale(${iconScale})`,
                                boxShadow: `0 0 25px ${accentColor}30`,
                            }, children: _jsx("span", { style: { fontSize: '56px' }, children: "\uD83C\uDFA7" }) }), _jsx("h2", { style: {
                                fontFamily: fonts.serif,
                                fontSize: '68px',
                                color: textColor,
                                marginBottom: '20px',
                                textShadow,
                                fontWeight: 'bold',
                            }, children: ctaTitle || 'Listen to Full Episode' }), _jsx("p", { style: {
                                fontFamily: fonts.sans,
                                fontSize: '40px',
                                color: textSecondaryColor,
                                lineHeight: 1.4,
                                maxWidth: '680px',
                                marginBottom: '45px',
                                textShadow,
                            }, children: ctaText }), _jsxs("div", { style: {
                                display: 'flex',
                                gap: '20px',
                                justifyContent: 'center',
                            }, children: [_jsxs("div", { style: {
                                        backgroundColor: '#1DB954',
                                        color: '#FFFFFF',
                                        padding: '16px 36px',
                                        borderRadius: '30px',
                                        fontFamily: fonts.sans,
                                        fontSize: '28px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }, children: [_jsx("span", { children: "\uD83D\uDFE2" }), " Spotify"] }), _jsxs("div", { style: {
                                        backgroundColor: '#FC3C44',
                                        color: '#FFFFFF',
                                        padding: '16px 36px',
                                        borderRadius: '30px',
                                        fontFamily: fonts.sans,
                                        fontSize: '28px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }, children: [_jsx("span", { children: "\uD83C\uDF4E" }), " Podcasts"] })] })] }));
            }
            case 'follow':
            default: {
                return (_jsxs(_Fragment, { children: [expertAvatar ? (_jsx("img", { src: expertAvatar.startsWith('http') || expertAvatar.startsWith('/') || expertAvatar.startsWith('data:') ? expertAvatar : staticFile(expertAvatar), alt: expertName, style: {
                                width: '160px',
                                height: '160px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginBottom: '30px',
                                border: `4px solid ${accentColor}`,
                                boxShadow: `0 10px 25px rgba(0, 0, 0, 0.25)`,
                                transform: `scale(${iconScale})`,
                            } })) : (_jsx("div", { style: {
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: `${accentColor}15`,
                                border: `2px solid ${accentColor}`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '30px',
                                transform: `scale(${iconScale})`,
                            }, children: _jsx("span", { style: { fontSize: '56px' }, children: "\uD83D\uDC64" }) })), _jsx("h2", { style: {
                                fontFamily: fonts.serif,
                                fontSize: '64px',
                                color: textColor,
                                marginBottom: '10px',
                                textShadow,
                                fontWeight: 'bold',
                            }, children: expertName }), _jsx("div", { style: {
                                fontFamily: fonts.sans,
                                fontSize: '32px',
                                color: accentColor,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '20px',
                            }, children: expertSpecialty }), _jsx("p", { style: {
                                fontFamily: fonts.sans,
                                fontSize: '38px',
                                color: textSecondaryColor,
                                lineHeight: 1.4,
                                maxWidth: '680px',
                                marginBottom: '40px',
                                textShadow,
                            }, children: ctaText }), _jsxs("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                            }, children: [_jsx("span", { style: {
                                        fontFamily: fonts.sans,
                                        fontSize: '36px',
                                        fontWeight: 700,
                                        color: textColor,
                                        letterSpacing: '0.5px',
                                    }, children: displayHandle }), _jsx("div", { style: {
                                        fontFamily: fonts.sans,
                                        fontSize: '32px',
                                        fontWeight: 700,
                                        color: '#FFFFFF',
                                        backgroundColor: accentColor,
                                        padding: '20px 60px',
                                        borderRadius: '40px',
                                        boxShadow: `0 10px 25px ${accentColor}40`,
                                    }, children: "Follow" })] })] }));
            }
        }
    };
    return (_jsx("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: cardBg,
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: `1px solid ${cardBorder}`,
            borderRadius: '32px',
            padding: '70px 50px',
            boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
            width: '840px',
            opacity,
            transform: `scale(${scale}) translateY(${translateY}px)`,
        }, children: renderContent() }));
};

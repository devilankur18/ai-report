import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * HookIntro.tsx
 * -------------
 * Renders the first 3-second hook screen with multiple animation styles.
 * Each style is designed to create a pattern-interrupt that stops scrolling.
 *
 * Hook Styles:
 *  - zoom-face      Doctor face fills screen, zooms out, text overlays dramatically
 *  - stat-counter   Large number counts up with impact
 *  - text-slam      Bold words slam in sequentially (strong kinetic energy)
 *  - typewriter-bold Large typewriter cursor (authoritative/podcast feel)
 *  - split-reveal   Doctor image slides up from bottom, text comes from top
 *  - word-cascade   Original word-by-word spring (legacy fallback)
 */
import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig, Img, staticFile, } from 'remotion';
const resolveUrl = (url) => {
    if (!url)
        return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/') || url.startsWith('file:')) {
        return url;
    }
    return staticFile(url);
};
// ── Hook: zoom-face ──────────────────────────────────────────────────────
const ZoomFaceHook = ({ hookText, hookEmoji, accentColor, textColor, fonts, resolvedHeroUrl, durationFrames = 90, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Image zooms from 1.25 → 1.0 over first 60 frames (zoom-out reveal)
    const imgScale = interpolate(frame, [0, 60], [1.28, 1.0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    // Image opacity: starts visible
    const imgOpacity = interpolate(frame, [0, 10], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    // Text enters at frame 20 via spring
    const textSpr = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 120 } });
    const textTranslateY = interpolate(textSpr, [0, 1], [80, 0]);
    const textOpacity = interpolate(textSpr, [0, 1], [0, 1]);
    // Accent bar width grows from 0 to full at frame 35
    const barWidth = interpolate(frame, [35, 65], [0, 100], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    return (_jsxs("div", { style: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0A0A0A' }, children: [resolvedHeroUrl && (_jsxs("div", { style: {
                    position: 'absolute', inset: 0,
                    opacity: imgOpacity,
                    transform: `scale(${imgScale})`,
                    transformOrigin: 'center 30%',
                }, children: [_jsx(Img, { src: resolvedHeroUrl, style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' } }), _jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.88) 100%)',
                        } }), _jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 15%)',
                        } })] })), _jsxs("div", { style: {
                    position: 'absolute',
                    bottom: '180px',
                    left: '80px',
                    right: '80px',
                    opacity: textOpacity,
                    transform: `translateY(${textTranslateY}px)`,
                }, children: [_jsx("div", { style: {
                            width: `${barWidth}%`,
                            height: '4px',
                            backgroundColor: accentColor,
                            borderRadius: '2px',
                            marginBottom: '24px',
                            boxShadow: `0 0 12px ${accentColor}80`,
                        } }), _jsxs("div", { style: {
                            fontFamily: fonts.serif,
                            fontSize: '76px',
                            fontWeight: 900,
                            color: '#FFFFFF',
                            lineHeight: 1.15,
                            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
                            letterSpacing: '-1px',
                        }, children: [hookEmoji && _jsx("span", { style: { marginRight: '16px' }, children: hookEmoji }), hookText] })] })] }));
};
// ── Hook: stat-counter ───────────────────────────────────────────────────
const StatCounterHook = ({ hookText, hookStat, hookEmoji, accentColor, fonts, resolvedHeroUrl, durationFrames = 90, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Stat number counts up from 0 to final value over frames 0-55
    const statValue = hookStat || '90%';
    const isPercent = statValue.includes('%');
    const numericPart = parseFloat(statValue.replace(/[^0-9.]/g, ''));
    const suffix = statValue.replace(/[0-9.]/g, '');
    const countedNum = Math.floor(interpolate(frame, [5, 55], [0, numericPart], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }));
    // Stat scale: punch-in then settle
    const statSpr = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 150 } });
    const statScale = interpolate(statSpr, [0, 1], [0.4, 1]);
    // Text enters after stat is revealed
    const textSpr = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 100 } });
    const textOpacity = interpolate(textSpr, [0, 1], [0, 1]);
    const textTranslateY = interpolate(textSpr, [0, 1], [30, 0]);
    // Background image opacity
    const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    return (_jsxs("div", { style: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#050505' }, children: [resolvedHeroUrl && (_jsx("div", { style: { position: 'absolute', inset: 0, opacity: bgOpacity * 0.35 }, children: _jsx(Img, { src: resolvedHeroUrl, style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' } }) })), _jsx("div", { style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' } }), _jsxs("div", { style: {
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '0 80px', textAlign: 'center',
                }, children: [_jsxs("div", { style: {
                            fontFamily: fonts.sans,
                            fontSize: '220px',
                            fontWeight: 900,
                            color: accentColor,
                            lineHeight: 1,
                            transform: `scale(${statScale})`,
                            textShadow: `0 0 80px ${accentColor}60`,
                            letterSpacing: '-6px',
                        }, children: [countedNum, suffix] }), _jsxs("div", { style: {
                            fontFamily: fonts.sans,
                            fontSize: '52px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            lineHeight: 1.3,
                            marginTop: '30px',
                            opacity: textOpacity,
                            transform: `translateY(${textTranslateY}px)`,
                            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
                            maxWidth: '820px',
                        }, children: [hookEmoji && _jsx("span", { style: { marginRight: '12px' }, children: hookEmoji }), hookText] })] })] }));
};
// ── Hook: text-slam ──────────────────────────────────────────────────────
const TextSlamHook = ({ hookText, hookEmoji, accentColor, textColor, fonts, resolvedHeroUrl, durationFrames = 90, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const words = hookText.split(' ');
    const FRAMES_PER_WORD = Math.floor(Math.min(14, 70 / words.length));
    // Background
    const bgOpacity = interpolate(frame, [0, 8], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    return (_jsxs("div", { style: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000000' }, children: [resolvedHeroUrl && (_jsx("div", { style: { position: 'absolute', inset: 0, opacity: bgOpacity * 0.28 }, children: _jsx(Img, { src: resolvedHeroUrl, style: { width: '100%', height: '100%', objectFit: 'cover' } }) })), _jsx("div", { style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' } }), _jsx("div", { style: {
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '6px',
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
                    zIndex: 10,
                } }), _jsxs("div", { style: {
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', justifyContent: 'center',
                    padding: '0 90px',
                }, children: [words.map((word, i) => {
                        const wordFrame = frame - i * FRAMES_PER_WORD;
                        const spr = spring({ frame: wordFrame, fps, config: { damping: 9, stiffness: 200 } });
                        const scale = interpolate(spr, [0, 1], [1.6, 1]);
                        const opacity = interpolate(spr, [0, 1], [0, 1]);
                        const translateX = interpolate(spr, [0, 1], [-60, 0]);
                        // Highlight every third word with accent color
                        const isAccent = i % 3 === 0;
                        return (_jsx("div", { style: {
                                fontFamily: fonts.serif,
                                fontSize: '90px',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                color: isAccent ? accentColor : '#FFFFFF',
                                transform: `scale(${scale}) translateX(${translateX}px)`,
                                opacity,
                                display: 'block',
                                textShadow: isAccent
                                    ? `0 0 40px ${accentColor}80`
                                    : '0 4px 20px rgba(0,0,0,0.7)',
                                letterSpacing: '-1px',
                            }, children: word }, i));
                    }), hookEmoji && (_jsx("div", { style: {
                            fontSize: '72px',
                            marginTop: '12px',
                            opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                        }, children: hookEmoji }))] })] }));
};
// ── Hook: typewriter-bold ────────────────────────────────────────────────
const TypewriterBoldHook = ({ hookText, hookEmoji, expertName, expertSpecialty, accentColor, fonts, resolvedHeroUrl, durationFrames = 90, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Type out hook text char by char
    const charCount = Math.floor(interpolate(frame, [8, 72], [0, hookText.length], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }));
    const displayText = hookText.substring(0, charCount);
    const showCursor = frame % 15 < 8;
    // Name tag fades in at frame 65
    const nameSpr = spring({ frame: frame - 65, fps, config: { damping: 14 } });
    const nameOpacity = interpolate(nameSpr, [0, 1], [0, 1]);
    const nameTranslateY = interpolate(nameSpr, [0, 1], [20, 0]);
    return (_jsxs("div", { style: {
            width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
            backgroundColor: '#08080E',
        }, children: [resolvedHeroUrl && (_jsx("div", { style: { position: 'absolute', inset: 0, opacity: 0.12 }, children: _jsx(Img, { src: resolvedHeroUrl, style: { width: '100%', height: '100%', objectFit: 'cover' } }) })), _jsx("div", { style: {
                    position: 'absolute', top: '20%', left: '-10%',
                    width: '600px', height: '600px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                } }), _jsxs("div", { style: {
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', justifyContent: 'center',
                    padding: '0 100px',
                }, children: [_jsxs("div", { style: {
                            fontFamily: fonts.serif,
                            fontSize: '82px',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            lineHeight: 1.2,
                            letterSpacing: '-1.5px',
                            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                        }, children: [hookEmoji && _jsx("span", { style: { marginRight: '16px' }, children: hookEmoji }), displayText, showCursor && (_jsx("span", { style: { color: accentColor, fontWeight: 300, marginLeft: '4px' }, children: "|" }))] }), _jsxs("div", { style: {
                            marginTop: '50px',
                            opacity: nameOpacity,
                            transform: `translateY(${nameTranslateY}px)`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                        }, children: [_jsx("div", { style: {
                                    width: '4px', height: '48px',
                                    backgroundColor: accentColor,
                                    borderRadius: '2px',
                                    boxShadow: `0 0 10px ${accentColor}80`,
                                } }), _jsxs("div", { children: [_jsx("div", { style: {
                                            fontFamily: fonts.sans,
                                            fontSize: '34px',
                                            fontWeight: 700,
                                            color: '#FFFFFF',
                                            letterSpacing: '0.5px',
                                        }, children: expertName }), _jsx("div", { style: {
                                            fontFamily: fonts.sans,
                                            fontSize: '22px',
                                            fontWeight: 500,
                                            color: accentColor,
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px',
                                        }, children: expertSpecialty })] })] })] })] }));
};
// ── Hook: split-reveal ────────────────────────────────────────────────────
const SplitRevealHook = ({ hookText, hookEmoji, accentColor, fonts, resolvedHeroUrl, durationFrames = 90, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Image slides up from bottom
    const imgSpr = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 90 } });
    const imgTranslateY = interpolate(imgSpr, [0, 1], [400, 0]);
    const imgOpacity = interpolate(imgSpr, [0, 1], [0, 1]);
    // Text drops from top
    const textSpr = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 100 } });
    const textTranslateY = interpolate(textSpr, [0, 1], [-80, 0]);
    const textOpacity = interpolate(textSpr, [0, 1], [0, 1]);
    return (_jsxs("div", { style: {
            width: '100%', height: '100%', position: 'relative',
            overflow: 'hidden', backgroundColor: '#0A0A0A',
        }, children: [_jsx("div", { style: {
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '55%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '100px 80px 40px',
                    backgroundColor: '#0A0A0A',
                    opacity: textOpacity,
                    transform: `translateY(${textTranslateY}px)`,
                    zIndex: 5,
                }, children: _jsxs("div", { style: {
                        fontFamily: fonts.serif,
                        fontSize: '72px',
                        fontWeight: 900,
                        color: '#FFFFFF',
                        lineHeight: 1.2,
                        textAlign: 'center',
                        letterSpacing: '-1px',
                    }, children: [hookEmoji && (_jsx("div", { style: { fontSize: '80px', marginBottom: '20px' }, children: hookEmoji })), hookText] }) }), _jsx("div", { style: {
                    position: 'absolute',
                    top: '52%',
                    left: 0, right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
                    zIndex: 10,
                    boxShadow: `0 0 20px ${accentColor}60`,
                    opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                } }), _jsxs("div", { style: {
                    position: 'absolute',
                    top: '54%', left: 0, right: 0, bottom: 0,
                    overflow: 'hidden',
                    opacity: imgOpacity,
                    transform: `translateY(${imgTranslateY}px)`,
                }, children: [resolvedHeroUrl ? (_jsx(Img, { src: resolvedHeroUrl, style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' } })) : (_jsx("div", { style: { width: '100%', height: '100%', backgroundColor: `${accentColor}20` } })), _jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, transparent 40%)',
                        } })] })] }));
};
// ── Hook: word-cascade (legacy fallback) ─────────────────────────────────
const WordCascadeHook = ({ hookText, hookEmoji, accentColor, textColor, fonts, resolvedHeroUrl, durationFrames = 90, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const words = hookText.split(' ');
    const bgOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return (_jsxs("div", { style: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }, children: [resolvedHeroUrl && (_jsxs("div", { style: { position: 'absolute', inset: 0, opacity: bgOpacity }, children: [_jsx(Img, { src: resolvedHeroUrl, style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' } }), _jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9) 100%)',
                        } })] })), _jsx("div", { style: {
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    padding: '0 80px', textAlign: 'center',
                }, children: _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }, children: [hookEmoji && (_jsx("span", { style: {
                                fontSize: '80px',
                                opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                                display: 'block', width: '100%', marginBottom: '10px',
                            }, children: hookEmoji })), words.map((word, i) => {
                            const delay = i * 5;
                            const spr = spring({ frame: frame - delay, fps, config: { damping: 12 } });
                            return (_jsx("span", { style: {
                                    fontFamily: fonts.serif,
                                    fontSize: '84px',
                                    fontWeight: 'bold',
                                    color: '#FFFFFF',
                                    textShadow: '0 4px 20px rgba(0,0,0,0.7)',
                                    opacity: interpolate(spr, [0, 1], [0, 1]),
                                    transform: `scale(${interpolate(spr, [0, 1], [0.5, 1])}) translateY(${interpolate(spr, [0, 1], [50, 0])}px)`,
                                    display: 'inline-block',
                                }, children: word }, i));
                        })] }) })] }));
};
// ── Main exported component ───────────────────────────────────────────────
export const HookIntro = (props) => {
    const { heroImageUrl, hookStyle = 'zoom-face' } = props;
    const resolvedHeroUrl = React.useMemo(() => resolveUrl(heroImageUrl), [heroImageUrl]);
    const sharedProps = { ...props, resolvedHeroUrl };
    switch (hookStyle) {
        case 'zoom-face':
            return _jsx(ZoomFaceHook, { ...sharedProps });
        case 'stat-counter':
            return _jsx(StatCounterHook, { ...sharedProps });
        case 'text-slam':
            return _jsx(TextSlamHook, { ...sharedProps });
        case 'typewriter-bold':
            return _jsx(TypewriterBoldHook, { ...sharedProps });
        case 'split-reveal':
            return _jsx(SplitRevealHook, { ...sharedProps });
        case 'word-cascade':
        default:
            return _jsx(WordCascadeHook, { ...sharedProps });
    }
};

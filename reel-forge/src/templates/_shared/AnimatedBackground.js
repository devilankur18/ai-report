import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Video, Img, staticFile, } from 'remotion';
export const AnimatedBackground = ({ bgType, bgGradientStart = '#0F0F23', bgGradientEnd = '#1A1A3E', bgSolid = '#0A0A0A', bgVideoUrl, bgImageUrl, overlayStyle = 'scrim-bottom', accentColor, imageFilter, }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    // Shifting angle for gradient rotation (slow 360-deg rotation)
    const bgAngle = interpolate(frame, [0, durationInFrames], [0, 360]);
    // Ken Burns scale effect (zoom from 1.0 to 1.06 over full duration — subtle)
    const kbScale = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateRight: 'clamp' });
    // Resolve video path if provided
    const resolvedVideoUrl = React.useMemo(() => {
        if (!bgVideoUrl)
            return '';
        if (bgVideoUrl.startsWith('http') || bgVideoUrl.startsWith('data:') || bgVideoUrl.startsWith('/') || bgVideoUrl.startsWith('file:')) {
            return bgVideoUrl;
        }
        return staticFile(bgVideoUrl);
    }, [bgVideoUrl]);
    // Resolve image path if provided
    const resolvedImageUrl = React.useMemo(() => {
        if (!bgImageUrl)
            return '';
        if (bgImageUrl.startsWith('http') || bgImageUrl.startsWith('data:') || bgImageUrl.startsWith('/') || bgImageUrl.startsWith('file:')) {
            return bgImageUrl;
        }
        return staticFile(bgImageUrl);
    }, [bgImageUrl]);
    // ── Overlay helpers ────────────────────────────────────────────────────
    const renderOverlay = (style) => {
        switch (style) {
            case 'scrim-bottom':
                // Gradient transparent → dark, covering bottom 55% — keeps face visible
                return (_jsx(AbsoluteFill, { style: {
                        background: 'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                        zIndex: 1,
                    } }));
            case 'scrim-full':
                // Moderate full-screen darken — doctor still visible but text is very readable
                return (_jsx(AbsoluteFill, { style: {
                        background: 'rgba(0,0,0,0.38)',
                        zIndex: 1,
                    } }));
            case 'vignette':
                // Radial vignette — edges darken, center stays bright
                return (_jsx(AbsoluteFill, { style: {
                        background: 'radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(0,0,0,0.65) 100%)',
                        zIndex: 1,
                    } }));
            case 'none':
            default:
                return null;
        }
    };
    // ── Solid ──────────────────────────────────────────────────────────────
    if (bgType === 'solid') {
        return _jsx(AbsoluteFill, { style: { backgroundColor: bgSolid } });
    }
    // ── Video background ───────────────────────────────────────────────────
    if (bgType === 'video' && resolvedVideoUrl) {
        return (_jsxs(AbsoluteFill, { style: { backgroundColor: bgSolid }, children: [_jsx(Video, { src: resolvedVideoUrl, loop: true, muted: true, style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.45,
                    } }), _jsx(AbsoluteFill, { style: {
                        background: 'radial-gradient(circle, transparent 20%, rgba(0, 0, 0, 0.6) 90%)',
                    } })] }));
    }
    // ── Hero Portrait — doctor fills entire screen, NO blur, bottom scrim ──
    if (bgType === 'hero-portrait' && resolvedImageUrl) {
        return (_jsxs(AbsoluteFill, { style: { backgroundColor: '#0A0A0A', overflow: 'hidden' }, children: [_jsx(Img, { src: resolvedImageUrl, style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top', // Prioritise face/upper body
                        transform: `scale(${kbScale})`,
                        transformOrigin: 'center 25%',
                        filter: imageFilter || 'none',
                    } }), renderOverlay(overlayStyle), _jsx(AbsoluteFill, { style: {
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 20%)',
                        zIndex: 2,
                    } })] }));
    }
    // ── Image background (legacy / used when bgType === 'image') ───────────
    // IMPROVED: Remove heavy blur overlay. Use scrim-bottom by default.
    if (bgType === 'image' && resolvedImageUrl) {
        return (_jsxs(AbsoluteFill, { style: { backgroundColor: '#0A0A0A', overflow: 'hidden' }, children: [_jsx(Img, { src: resolvedImageUrl, style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        transform: `scale(${kbScale})`,
                        transformOrigin: 'center 25%',
                        filter: imageFilter || 'none',
                    } }), renderOverlay(overlayStyle), _jsx(AbsoluteFill, { style: {
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 18%)',
                        zIndex: 2,
                    } })] }));
    }
    // ── Particles background ───────────────────────────────────────────────
    if (bgType === 'particles') {
        return (_jsxs(AbsoluteFill, { style: {
                background: `linear-gradient(${bgAngle}deg, ${bgGradientStart}, ${bgGradientEnd})`,
                overflow: 'hidden',
            }, children: [_jsx("style", { children: `
          @keyframes float-bubble-1 {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(100px, 150px) scale(1.1); }
            66% { transform: translate(-80px, 80px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes float-bubble-2 {
            0% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(-120px, -180px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes float-bubble-3 {
            0% { transform: translate(0px, 0px) scale(1); }
            40% { transform: translate(150px, -100px) scale(1.15); }
            70% { transform: translate(-50px, 120px) scale(0.85); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
        ` }), _jsx("div", { style: {
                        position: 'absolute',
                        top: '15%',
                        left: '-10%',
                        width: '450px',
                        height: '450px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${accentColor ? accentColor + '26' : 'rgba(255, 107, 53, 0.15)'} 0%, transparent 70%)`,
                        filter: 'blur(50px)',
                        animation: 'float-bubble-1 25s infinite ease-in-out',
                    } }), _jsx("div", { style: {
                        position: 'absolute',
                        bottom: '10%',
                        right: '-15%',
                        width: '550px',
                        height: '550px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0, 245, 212, 0.12) 0%, rgba(0, 245, 212, 0) 70%)',
                        filter: 'blur(60px)',
                        animation: 'float-bubble-2 30s infinite ease-in-out',
                    } }), _jsx("div", { style: {
                        position: 'absolute',
                        top: '45%',
                        left: '30%',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)',
                        filter: 'blur(55px)',
                        animation: 'float-bubble-3 20s infinite ease-in-out',
                    } }), _jsx("div", { style: {
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: 0.03,
                        backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                        backgroundSize: '30px 30px',
                    } })] }));
    }
    // ── Default: Dynamic rotating gradient ────────────────────────────────
    return (_jsx(AbsoluteFill, { style: {
            background: `linear-gradient(${bgAngle}deg, ${bgGradientStart}, ${bgGradientEnd})`,
        } }));
};

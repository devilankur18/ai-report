import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * hook-quote/index.tsx
 * --------------------
 * Instagram-grade hook-quote template.
 *
 * Phase 1 changes:
 *  - Doctor photo fills entire 1080×1920 background (no blur, bottom scrim only)
 *  - Quote card moves to bottom third (Instagram caption zone)
 *  - ExpertBadge repositioned as slim bottom overlay pill
 *  - Scene transitions crossfade between doctor photos smoothly
 *  - Thin waveform accent bar replaces large center waveform
 *
 * Phase 2 changes:
 *  - 3-second hook uses new HookIntro component with multiple styles
 *  - hookStyle, hookStat, hookEmoji, toneTag are all consumed
 */
import React from 'react';
import { AbsoluteFill, Sequence, Audio, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile, Img, } from 'remotion';
import { getFontFamilies } from '../_shared/fonts';
import { getThemeById } from '../_shared/themes';
import { AnimatedBackground } from '../_shared/AnimatedBackground';
import { HookIntro } from '../_shared/HookIntro';
import { SafeZone } from '../_shared/SafeZone';
import { ProgressBar } from '../_shared/ProgressBar';
import { EndingBlock } from '../_shared/EndingBlock';
import { getPersonalizationProfile, getImageFilter } from '../../lib/personalization';
import { PersonalizedQuoteCard, PersonalizedIdentity } from '../_shared/LayoutVariants';
const CrossfadeImage = ({ fromUrl, toUrl, crossfadeFrame, crossfadeDuration, objectPosition = 'center top', imageFilter, }) => {
    const toOpacity = interpolate(crossfadeFrame, [0, crossfadeDuration], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    const resolveUrl = (u) => {
        if (!u)
            return '';
        if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:'))
            return u;
        return staticFile(u);
    };
    return (_jsxs(AbsoluteFill, { style: { overflow: 'hidden' }, children: [fromUrl && (_jsx(Img, { src: resolveUrl(fromUrl), style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition, filter: imageFilter || 'none' } })), toUrl && toUrl !== fromUrl && (_jsx(Img, { src: resolveUrl(toUrl), style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition, opacity: toOpacity, filter: imageFilter || 'none' } }))] }));
};
// ── Helper: thin audio visualiser bar ────────────────────────────────────
// A simpler, less dominant waveform — a row of thin bars behind the quote card
const ThinWaveBar = ({ accentColor, frame }) => {
    const BAR_COUNT = 40;
    const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
        // Pseudo-random oscillation per bar (no actual audio data needed for background decoration)
        const phase = (i / BAR_COUNT) * Math.PI * 4 + frame * 0.08;
        const h = Math.abs(Math.sin(phase) * 0.5 + Math.sin(phase * 1.7) * 0.3) * 28 + 4;
        return h;
    });
    return (_jsx("div", { style: {
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '5px', width: '100%', height: '40px',
        }, children: bars.map((h, i) => (_jsx("div", { style: {
                width: '5px',
                height: `${h}px`,
                backgroundColor: accentColor,
                borderRadius: '3px',
                opacity: 0.55,
                boxShadow: h > 20 ? `0 0 6px ${accentColor}70` : 'none',
            } }, i))) }));
};
// ── Main template ─────────────────────────────────────────────────────────
export const HookQuoteTemplate = ({ audioUrl, expertName, expertSpecialty, domain, hookText, hookStyle = 'zoom-face', hookStat, hookEmoji, toneTag, scenes, ctaText, ctaType, ctaTitle, ctaSubtitle, ctaLink, ctaHandle, accentColor: customAccent, bgGradientStart: customStart, bgGradientEnd: customEnd, bgSolid: customSolid, themeId, bgVideoUrl: customBgVideo, language = 'en', expertAvatar, expertLogo, expertImages, expertImageSet, overlayStyle: customOverlayStyle, 
// Personalization fields
clientId, designId, fontPairingIndex: customFontPairingIndex, layoutVariant: customLayoutVariant, decorationStyle: customDecorationStyle, imageTreatment: customImageTreatment, }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    // ── 1. Resolve theme ────────────────────────────────────────────────────
    const theme = getThemeById(themeId);
    const resolvedAccent = customAccent || theme.accentColor;
    const resolvedTextColor = theme.textColor;
    const resolvedTextSecondary = theme.textSecondaryColor;
    const resolvedBgStart = customStart || theme.bgGradientStart;
    const resolvedBgEnd = customEnd || theme.bgGradientEnd;
    const resolvedBgSolid = customSolid || theme.bgSolid;
    const resolvedBgVideo = customBgVideo || theme.bgVideoUrl;
    const resolvedBgType = theme.bgType;
    // ── 1b. Resolve personalization profile ─────────────────────────────────
    const pProfile = React.useMemo(() => {
        return getPersonalizationProfile(clientId || 'default-client', designId || 'default-design', {
            fontPairingIndex: customFontPairingIndex,
            layoutVariant: customLayoutVariant,
            overlayStyle: customOverlayStyle,
            decorationStyle: customDecorationStyle,
            imageTreatment: customImageTreatment,
        });
    }, [clientId, designId, customFontPairingIndex, customLayoutVariant, customOverlayStyle, customDecorationStyle, customImageTreatment]);
    const resolvedOverlayStyle = pProfile.overlayStyle || theme.overlayStyle || 'scrim-bottom';
    const resolvedImageFilter = React.useMemo(() => {
        return getImageFilter(pProfile.imageTreatment, resolvedAccent);
    }, [pProfile.imageTreatment, resolvedAccent]);
    // ── 2. Fonts ────────────────────────────────────────────────────────────
    const fonts = getFontFamilies(language, pProfile.fontPairingIndex);
    // ── 3. Audio path ────────────────────────────────────────────────────────
    const resolvedAudioUrl = React.useMemo(() => {
        if (!audioUrl)
            return '';
        if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:'))
            return audioUrl;
        return staticFile(audioUrl);
    }, [audioUrl]);
    // ── 4. Timing ────────────────────────────────────────────────────────────
    const INTRO_DURATION = 90; // 3 seconds
    const OUTRO_DURATION = 120; // 4 seconds
    const CROSSFADE_DURATION = 18; // 0.6s crossfade between scenes
    const AUDIO_START_FRAME = INTRO_DURATION;
    const ctaStartFrame = durationInFrames - OUTRO_DURATION;
    const isCtaActive = frame >= ctaStartFrame;
    const allImages = React.useMemo(() => {
        if (expertImageSet && expertImageSet.length > 0)
            return expertImageSet.map((e) => e.file);
        return expertImages || [];
    }, [expertImages, expertImageSet]);
    const hookImage = React.useMemo(() => {
        if (expertImageSet) {
            const hi = expertImageSet.find((e) => e.role === 'hook' || e.role === 'portrait');
            if (hi)
                return hi.file;
        }
        return allImages[0] || expertAvatar;
    }, [expertImageSet, allImages, expertAvatar]);
    const ctaImage = React.useMemo(() => {
        if (expertImageSet) {
            const ci = expertImageSet.find((e) => e.role === 'cta');
            if (ci)
                return ci.file;
        }
        return allImages[2] || allImages[0];
    }, [expertImageSet, allImages]);
    const sceneImages = React.useMemo(() => {
        if (expertImageSet) {
            const si = expertImageSet.filter((e) => e.role === 'scene' || e.role === 'portrait');
            if (si.length > 0)
                return si.map((e) => e.file);
        }
        return allImages;
    }, [expertImageSet, allImages]);
    // ── 6. Scene tracking ────────────────────────────────────────────────────
    const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
    const activeSceneIndex = (scenes || []).findIndex((s) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec);
    const activeScene = activeSceneIndex >= 0 ? scenes[activeSceneIndex] : null;
    // ── 7. Scene-based background image with crossfade ───────────────────────
    const prevSceneIndex = Math.max(0, activeSceneIndex - 1);
    const currentBgImage = React.useMemo(() => {
        if (sceneImages.length === 0)
            return undefined;
        if (isCtaActive)
            return ctaImage;
        if (frame < AUDIO_START_FRAME)
            return hookImage;
        const idx = activeSceneIndex >= 0
            ? activeSceneIndex % sceneImages.length
            : 0;
        return sceneImages[idx];
    }, [sceneImages, frame, activeSceneIndex, isCtaActive, hookImage, ctaImage]);
    const prevBgImage = React.useMemo(() => {
        if (sceneImages.length === 0)
            return undefined;
        const idx = prevSceneIndex % sceneImages.length;
        return sceneImages[idx];
    }, [sceneImages, prevSceneIndex]);
    // Detect scene boundary to drive crossfade
    const activeSceneStartFrame = React.useMemo(() => {
        if (!scenes || activeSceneIndex < 0)
            return AUDIO_START_FRAME;
        return Math.round(scenes[activeSceneIndex].startSec * fps) + AUDIO_START_FRAME;
    }, [scenes, activeSceneIndex, fps]);
    const frameWithinScene = Math.max(0, frame - activeSceneStartFrame);
    const isCrossfading = frameWithinScene < CROSSFADE_DURATION && activeSceneIndex > 0;
    // ── 8. Theme helpers (image/portrait bg mode) ────────────────────────────
    const isHeroMode = resolvedBgType === 'hero-portrait' || resolvedBgType === 'image';
    // In hero mode everything overlays on the full-screen doctor image
    const displayTextColor = '#FFFFFF'; // Always white on image backgrounds
    const displayTextSecondary = 'rgba(255,255,255,0.80)';
    const cardBg = 'rgba(0, 0, 0, 0.52)';
    const cardBorder = 'rgba(255, 255, 255, 0.12)';
    const textShadowValue = '0 3px 20px rgba(0, 0, 0, 0.7)';
    // ── 9. Animations ─────────────────────────────────────────────────────────
    const mainContentOpacity = interpolate(frame, [ctaStartFrame, ctaStartFrame + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    // Quote card: slide up from bottom when scene changes
    const quoteEnterSpr = spring({
        frame: frameWithinScene,
        fps,
        config: { damping: 14, stiffness: 110 },
    });
    const quoteTranslateY = interpolate(quoteEnterSpr, [0, 1], [60, 0]);
    const quoteOpacity = interpolate(quoteEnterSpr, [0, 1], [0, 1]);
    const audioVolume = interpolate(frame, [durationInFrames - OUTRO_DURATION, durationInFrames - 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    // ── Resolve logo URL ──────────────────────────────────────────────────────
    const resolvedLogoUrl = React.useMemo(() => {
        if (!expertLogo)
            return null;
        if (expertLogo.startsWith('http') || expertLogo.startsWith('/') || expertLogo.startsWith('data:'))
            return expertLogo;
        return staticFile(expertLogo);
    }, [expertLogo]);
    return (_jsxs(AbsoluteFill, { children: [isHeroMode && currentBgImage ? (
            // Hero mode: full-screen doctor photo with crossfade transitions
            _jsx(AbsoluteFill, { style: { overflow: 'hidden' }, children: isCrossfading ? (_jsx(CrossfadeImage, { fromUrl: prevBgImage, toUrl: currentBgImage, crossfadeFrame: frameWithinScene, crossfadeDuration: CROSSFADE_DURATION, imageFilter: resolvedImageFilter })) : (_jsx(AnimatedBackground, { bgType: resolvedBgType, bgImageUrl: currentBgImage, bgGradientStart: resolvedBgStart, bgGradientEnd: resolvedBgEnd, bgSolid: resolvedBgSolid, bgVideoUrl: resolvedBgVideo, overlayStyle: resolvedOverlayStyle, accentColor: resolvedAccent, imageFilter: resolvedImageFilter })) })) : (
            // Gradient / particles / video fallback
            _jsx(AnimatedBackground, { bgType: resolvedBgType, bgGradientStart: resolvedBgStart, bgGradientEnd: resolvedBgEnd, bgSolid: resolvedBgSolid, bgVideoUrl: resolvedBgVideo, overlayStyle: resolvedOverlayStyle, accentColor: resolvedAccent, imageFilter: resolvedImageFilter })), _jsx(SafeZone, { show: false }), resolvedLogoUrl && frame >= AUDIO_START_FRAME && (_jsx("div", { style: {
                    position: 'absolute',
                    top: '80px', right: '80px',
                    opacity: 0.75,
                    zIndex: 20,
                }, children: _jsx("img", { src: resolvedLogoUrl, alt: "Brand Logo", style: { maxHeight: '56px', maxWidth: '170px', objectFit: 'contain' } }) })), frame < INTRO_DURATION && (_jsx(AbsoluteFill, { style: { zIndex: 30 }, children: _jsx(HookIntro, { hookText: hookText || '', hookStyle: hookStyle, hookStat: hookStat, hookEmoji: hookEmoji, toneTag: toneTag, expertName: expertName, expertSpecialty: expertSpecialty, heroImageUrl: hookImage, accentColor: resolvedAccent, textColor: displayTextColor, fonts: fonts, durationFrames: INTRO_DURATION }) })), frame >= AUDIO_START_FRAME && (_jsxs(AbsoluteFill, { style: { opacity: mainContentOpacity, zIndex: 10 }, children: [activeScene?.keyQuote && (_jsxs(PersonalizedQuoteCard, { variant: pProfile.layoutVariant, decoration: pProfile.decorationStyle, accentColor: resolvedAccent, textColor: displayTextColor, cardBg: cardBg, cardBorder: cardBorder, textShadow: textShadowValue, fontFamily: fonts.serif, opacity: quoteOpacity, translateY: quoteTranslateY, children: [_jsx(ThinWaveBar, { accentColor: resolvedAccent, frame: frame }), _jsx("div", { style: { marginTop: '12px' }, children: activeScene.keyQuote })] })), _jsx(PersonalizedIdentity, { variant: pProfile.layoutVariant, expertName: expertName, expertSpecialty: expertSpecialty, expertAvatar: expertAvatar, accentColor: resolvedAccent, textColor: displayTextColor, textShadow: textShadowValue, fontFamily: fonts.sans, avatarResolver: (u) => {
                            if (!u)
                                return '';
                            if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:'))
                                return u;
                            return staticFile(u);
                        } })] })), isCtaActive && (_jsx(Sequence, { from: ctaStartFrame, children: _jsx(AbsoluteFill, { style: {
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center',
                        padding: '0 100px', textAlign: 'center', zIndex: 20,
                    }, children: _jsx(EndingBlock, { ctaType: ctaType, ctaText: ctaText, ctaTitle: ctaTitle, ctaSubtitle: ctaSubtitle, ctaLink: ctaLink, ctaHandle: ctaHandle, expertName: expertName, expertSpecialty: expertSpecialty, domain: domain, accentColor: resolvedAccent, textColor: displayTextColor, textSecondaryColor: displayTextSecondary, cardBg: cardBg, cardBorder: cardBorder, textShadow: textShadowValue, fonts: fonts, expertAvatar: expertAvatar, isLightTheme: false }) }) })), _jsx(ProgressBar, { accentColor: resolvedAccent }), frame >= AUDIO_START_FRAME && resolvedAudioUrl && (_jsx(Sequence, { from: AUDIO_START_FRAME, children: _jsx(Audio, { src: resolvedAudioUrl, volume: audioVolume }) }))] }));
};

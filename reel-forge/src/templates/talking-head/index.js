import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * talking-head/index.tsx
 * ----------------------
 * Premium talking-head template featuring high-impact, TikTok/Reels style
 * word-by-word karaoke captions, full-screen doctor imagery with crossfade,
 * and layout personalization.
 */
import React from 'react';
import { AbsoluteFill, Sequence, Audio, interpolate, useCurrentFrame, useVideoConfig, staticFile, Img, } from 'remotion';
import { getFontFamilies } from '../_shared/fonts';
import { getThemeById } from '../_shared/themes';
import { AnimatedBackground } from '../_shared/AnimatedBackground';
import { HookIntro } from '../_shared/HookIntro';
import { SafeZone } from '../_shared/SafeZone';
import { ProgressBar } from '../_shared/ProgressBar';
import { EndingBlock } from '../_shared/EndingBlock';
import { getPersonalizationProfile, getImageFilter } from '../../lib/personalization';
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
const groupWordsIntoLines = (words) => {
    const lines = [];
    if (!words || words.length === 0)
        return lines;
    let currentLineWords = [];
    const maxLineChars = 24; // Short and punchy for Reels
    const maxGapSec = 0.55;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const prevWord = currentLineWords[currentLineWords.length - 1];
        const isFirstWord = currentLineWords.length === 0;
        const isTooLong = !isFirstWord && currentLineWords.map(w => w.word).join(' ').length + word.word.length > maxLineChars;
        const isGapLarge = !isFirstWord && (word.start - prevWord.end) > maxGapSec;
        if (isTooLong || isGapLarge) {
            lines.push({
                words: currentLineWords,
                start: currentLineWords[0].start,
                end: currentLineWords[currentLineWords.length - 1].end,
            });
            currentLineWords = [word];
        }
        else {
            currentLineWords.push(word);
        }
    }
    if (currentLineWords.length > 0) {
        lines.push({
            words: currentLineWords,
            start: currentLineWords[0].start,
            end: currentLineWords[currentLineWords.length - 1].end,
        });
    }
    return lines;
};
export const TalkingHeadTemplate = ({ audioUrl, expertName, expertSpecialty, domain, hookText, hookStyle = 'zoom-face', hookStat, hookEmoji, toneTag, scenes, ctaText, ctaType, ctaTitle, ctaSubtitle, ctaLink, ctaHandle, accentColor: customAccent, bgGradientStart: customStart, bgGradientEnd: customEnd, bgSolid: customSolid, themeId = 'gold-clinical', bgVideoUrl: customBgVideo, language = 'en', expertAvatar, expertLogo, expertImages, expertImageSet, overlayStyle: customOverlayStyle, wordTimestamps, clientId, designId, fontPairingIndex: customFontPairingIndex, layoutVariant: customLayoutVariant, decorationStyle: customDecorationStyle, imageTreatment: customImageTreatment, }) => {
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
    const resolvedBgType = theme.bgType === 'solid' || theme.bgType === 'gradient' ? 'hero-portrait' : theme.bgType;
    // ── 1b. Resolve personalization ──────────────────────────────────────────
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
    const INTRO_DURATION = 90;
    const OUTRO_DURATION = 120;
    const CROSSFADE_DURATION = 18;
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
    const prevSceneIndex = Math.max(0, activeSceneIndex - 1);
    const currentBgImage = React.useMemo(() => {
        if (sceneImages.length === 0)
            return undefined;
        if (isCtaActive)
            return ctaImage;
        if (frame < AUDIO_START_FRAME)
            return hookImage;
        const idx = activeSceneIndex >= 0 ? activeSceneIndex % sceneImages.length : 0;
        return sceneImages[idx];
    }, [sceneImages, frame, activeSceneIndex, isCtaActive, hookImage, ctaImage]);
    const prevBgImage = React.useMemo(() => {
        if (sceneImages.length === 0)
            return undefined;
        const idx = prevSceneIndex % sceneImages.length;
        return sceneImages[idx];
    }, [sceneImages, prevSceneIndex]);
    const activeSceneStartFrame = React.useMemo(() => {
        if (!scenes || activeSceneIndex < 0)
            return AUDIO_START_FRAME;
        return Math.round(scenes[activeSceneIndex].startSec * fps) + AUDIO_START_FRAME;
    }, [scenes, activeSceneIndex, fps]);
    const frameWithinScene = Math.max(0, frame - activeSceneStartFrame);
    const isCrossfading = frameWithinScene < CROSSFADE_DURATION && activeSceneIndex > 0;
    // ── 7. Theme helpers ────────────────────────────────────────────────────
    const displayTextColor = '#FFFFFF';
    const displayTextSecondary = 'rgba(255,255,255,0.75)';
    const cardBg = 'rgba(0,0,0,0.52)';
    const cardBorder = 'rgba(255,255,255,0.12)';
    const textShadowValue = '0 3px 20px rgba(0,0,0,0.75)';
    // ── 8. Animations ───────────────────────────────────────────────────────
    const mainContentOpacity = interpolate(frame, [ctaStartFrame, ctaStartFrame + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const audioVolume = interpolate(frame, [durationInFrames - OUTRO_DURATION, durationInFrames - 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    // ── 9. Caption assembly & highlighting ──────────────────────────────────
    const captionLines = React.useMemo(() => {
        return groupWordsIntoLines(wordTimestamps || []);
    }, [wordTimestamps]);
    // Find active line, or fallback to the closest line
    const activeLine = React.useMemo(() => {
        if (captionLines.length === 0)
            return null;
        let found = captionLines.find(l => audioCurrentSec >= l.start && audioCurrentSec <= l.end);
        if (!found) {
            const past = captionLines.filter(l => audioCurrentSec >= l.end);
            if (past.length > 0) {
                found = past[past.length - 1];
            }
            else {
                found = captionLines[0];
            }
        }
        return found;
    }, [captionLines, audioCurrentSec]);
    // Logo resolver
    const resolvedLogoUrl = React.useMemo(() => {
        if (!expertLogo)
            return null;
        if (expertLogo.startsWith('http') || expertLogo.startsWith('/') || expertLogo.startsWith('data:'))
            return expertLogo;
        return staticFile(expertLogo);
    }, [expertLogo]);
    // Position captions dynamically based on layoutVariant
    const captionStyle = React.useMemo(() => {
        const isTop = pProfile.layoutVariant === 'quote-top';
        const isLeft = pProfile.layoutVariant === 'quote-bottom-left' || pProfile.layoutVariant === 'quote-split';
        return {
            position: 'absolute',
            left: '60px',
            right: isLeft ? '180px' : '60px',
            bottom: isTop ? 'auto' : '330px',
            top: isTop ? '220px' : 'auto',
            textAlign: isLeft ? 'left' : 'center',
            zIndex: 10,
            padding: '24px 32px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
        };
    }, [pProfile.layoutVariant]);
    return (_jsxs(AbsoluteFill, { children: [currentBgImage ? (_jsx(AbsoluteFill, { style: { overflow: 'hidden' }, children: isCrossfading ? (_jsx(CrossfadeImage, { fromUrl: prevBgImage, toUrl: currentBgImage, crossfadeFrame: frameWithinScene, crossfadeDuration: CROSSFADE_DURATION, imageFilter: resolvedImageFilter })) : (_jsx(AnimatedBackground, { bgType: "hero-portrait", bgImageUrl: currentBgImage, bgGradientStart: resolvedBgStart, bgGradientEnd: resolvedBgEnd, bgSolid: resolvedBgSolid, bgVideoUrl: resolvedBgVideo, overlayStyle: resolvedOverlayStyle, accentColor: resolvedAccent, imageFilter: resolvedImageFilter })) })) : (_jsx(AnimatedBackground, { bgType: "hero-portrait", bgGradientStart: resolvedBgStart, bgGradientEnd: resolvedBgEnd, bgSolid: resolvedBgSolid, bgVideoUrl: resolvedBgVideo, overlayStyle: resolvedOverlayStyle, accentColor: resolvedAccent, imageFilter: resolvedImageFilter })), _jsx(SafeZone, { show: false }), resolvedLogoUrl && frame >= AUDIO_START_FRAME && (_jsx("div", { style: {
                    position: 'absolute',
                    top: '80px', right: '80px',
                    opacity: 0.8,
                    zIndex: 20,
                }, children: _jsx("img", { src: resolvedLogoUrl, alt: "Brand Logo", style: { maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' } }) })), frame < INTRO_DURATION && (_jsx(AbsoluteFill, { style: { zIndex: 30 }, children: _jsx(HookIntro, { hookText: hookText || '', hookStyle: hookStyle, hookStat: hookStat, hookEmoji: hookEmoji, toneTag: toneTag, expertName: expertName, expertSpecialty: expertSpecialty, heroImageUrl: hookImage, accentColor: resolvedAccent, textColor: displayTextColor, fonts: fonts, durationFrames: INTRO_DURATION }) })), frame >= AUDIO_START_FRAME && (_jsxs(AbsoluteFill, { style: { opacity: mainContentOpacity, zIndex: 10 }, children: [activeLine && (_jsx("div", { style: captionStyle, children: _jsx("div", { style: {
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: pProfile.layoutVariant === 'quote-bottom-left' || pProfile.layoutVariant === 'quote-split' ? 'flex-start' : 'center',
                                alignItems: 'center',
                                gap: '10px 14px',
                                width: '100%',
                            }, children: activeLine.words.map((w, idx) => {
                                const isActive = audioCurrentSec >= w.start && audioCurrentSec <= w.end;
                                const isPast = audioCurrentSec > w.end;
                                const scale = isActive ? 1.12 : 1.0;
                                const color = isActive
                                    ? resolvedAccent
                                    : isPast
                                        ? '#FFFFFF'
                                        : 'rgba(255, 255, 255, 0.4)';
                                const glow = isActive ? `0 0 16px ${resolvedAccent}aa` : 'none';
                                return (_jsx("span", { style: {
                                        fontFamily: fonts.serif,
                                        fontSize: '56px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        color,
                                        transform: `scale(${scale})`,
                                        textShadow: glow !== 'none' ? glow : textShadowValue,
                                        transition: 'all 0.08s ease-out',
                                        display: 'inline-block',
                                    }, children: w.word }, idx));
                            }) }) })), _jsxs("div", { style: {
                            position: 'absolute',
                            bottom: '120px',
                            left: '60px',
                            right: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                        }, children: [expertAvatar && (_jsx("img", { src: expertAvatar.startsWith('http') || expertAvatar.startsWith('/') || expertAvatar.startsWith('data:')
                                    ? expertAvatar
                                    : staticFile(expertAvatar), alt: expertName, style: {
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: `2px solid ${resolvedAccent}`,
                                    boxShadow: `0 0 10px ${resolvedAccent}40`,
                                } })), _jsxs("div", { children: [_jsx("div", { style: {
                                            fontFamily: fonts.sans,
                                            fontSize: '26px',
                                            fontWeight: 800,
                                            color: displayTextColor,
                                            textShadow: textShadowValue,
                                            letterSpacing: '-0.2px',
                                        }, children: expertName }), _jsx("div", { style: {
                                            fontFamily: fonts.sans,
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: resolvedAccent,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            textShadow: `0 0 8px ${resolvedAccent}60`,
                                        }, children: expertSpecialty })] })] })] })), isCtaActive && (_jsx(Sequence, { from: ctaStartFrame, children: _jsx(AbsoluteFill, { style: {
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center',
                        padding: '0 80px', textAlign: 'center', zIndex: 20,
                    }, children: _jsx(EndingBlock, { ctaType: ctaType, ctaText: ctaText, ctaTitle: ctaTitle, ctaSubtitle: ctaSubtitle, ctaLink: ctaLink, ctaHandle: ctaHandle, expertName: expertName, expertSpecialty: expertSpecialty, domain: domain, accentColor: resolvedAccent, textColor: displayTextColor, textSecondaryColor: displayTextSecondary, cardBg: cardBg, cardBorder: cardBorder, textShadow: textShadowValue, fonts: fonts, expertAvatar: expertAvatar, isLightTheme: false }) }) })), _jsx(ProgressBar, { accentColor: resolvedAccent }), frame >= AUDIO_START_FRAME && resolvedAudioUrl && (_jsx(Sequence, { from: AUDIO_START_FRAME, children: _jsx(Audio, { src: resolvedAudioUrl, volume: audioVolume }) }))] }));
};

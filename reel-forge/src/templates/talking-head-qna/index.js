import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * talking-head-qna/index.tsx
 * --------------------------
 * High-engagement Q&A Reel Template.
 * Plays audio from frame 0 or 90 based on content detection.
 * Integrates programmatic SFX (boom, whoosh, pop, ding, click), glassmorphic Q&A sticker,
 * PIP corner transition, typewriter character reveal, auto-zoom pattern interrupts,
 * visual flash transitions, and keyword highlight animations.
 */
import React from 'react';
import { AbsoluteFill, Sequence, Audio, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile, Img, } from 'remotion';
import { getFontFamilies } from '../_shared/fonts.js';
import { EHRFileHook, ParallaxHook, RedactedHook, TypewriterTerminalHook, TypewriterWordPopHook, TypewriterStaggeredSlideHook, CardStackFractureHook, BlurInDiagnosticHook, ParallaxWaveformHook, GlitchCycleAlertHook, MosaicReframeHook, EhrVariableTypewriterHook, DiagnosticCarousel3DHook, SymptomMatrixFlybyHook, ListRevealCountdownHook, Transform3DShowcaseHook, } from './HookGallery.js';
import { getThemeById } from '../_shared/themes.js';
import { AnimatedBackground } from '../_shared/AnimatedBackground.js';
import { SafeZone } from '../_shared/SafeZone.js';
import { ProgressBar } from '../_shared/ProgressBar.js';
import { EndingBlock } from '../_shared/EndingBlock.js';
import { getPersonalizationProfile, getImageFilter } from '../../lib/personalization.js';
const SoundEffect = ({ src, triggerFrames, volume = 0.8 }) => {
    const frame = useCurrentFrame();
    // Find if a trigger matches the current frame
    const activeTrigger = triggerFrames.find(tf => frame === tf);
    if (activeTrigger === undefined)
        return null;
    return (_jsx(Sequence, { from: activeTrigger, durationInFrames: 60, layout: "none", children: _jsx(Audio, { src: staticFile(src), volume: volume }) }));
};
const CrossfadeImage = ({ fromUrl, toUrl, crossfadeFrame, crossfadeDuration, objectPosition = 'center top', imageFilter, currentSceneFrame, zoomScale, }) => {
    const toOpacity = interpolate(crossfadeFrame, [0, crossfadeDuration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const resolveUrl = (u) => {
        if (!u)
            return '';
        if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:'))
            return u;
        return staticFile(u);
    };
    const scaleFrom = interpolate(currentSceneFrame + 150, [0, 600], [1.02, 1.12], { extrapolateRight: 'clamp' }) * zoomScale;
    const scaleTo = interpolate(currentSceneFrame, [0, 600], [1.02, 1.12], { extrapolateRight: 'clamp' }) * zoomScale;
    const transXFrom = interpolate(currentSceneFrame + 150, [0, 600], [-6, 6], { extrapolateRight: 'clamp' });
    const transXTo = interpolate(currentSceneFrame, [0, 600], [-6, 6], { extrapolateRight: 'clamp' });
    return (_jsxs(AbsoluteFill, { style: { overflow: 'hidden' }, children: [fromUrl && (_jsx(Img, { src: resolveUrl(fromUrl), style: {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition,
                    filter: imageFilter || 'none',
                    transform: `scale(${scaleFrom}) translateX(${transXFrom}px)`,
                } })), toUrl && toUrl !== fromUrl && (_jsx(Img, { src: resolveUrl(toUrl), style: {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition,
                    opacity: toOpacity,
                    filter: imageFilter || 'none',
                    transform: `scale(${scaleTo}) translateX(${transXTo}px)`,
                } }))] }));
};
const groupWordsIntoLines = (words, startFromSec) => {
    const lines = [];
    if (!words || words.length === 0)
        return lines;
    const answerWords = words.filter(w => w.start >= startFromSec);
    if (answerWords.length === 0)
        return lines;
    let currentLineWords = [];
    const maxLineChars = 18;
    const maxGapSec = 0.5;
    for (let i = 0; i < answerWords.length; i++) {
        const word = answerWords[i];
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
// Color interpolator for smooth karaoke fade
const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
};
const getInterpolatedColor = (progress, fromColor, targetHex) => {
    const rgbTarget = hexToRgb(targetHex);
    const r = Math.round(255 + (rgbTarget.r - 255) * progress);
    const g = Math.round(255 + (rgbTarget.g - 255) * progress);
    const b = Math.round(255 + (rgbTarget.b - 255) * progress);
    if (fromColor === 'white') {
        return `rgb(${r}, ${g}, ${b})`;
    }
    else {
        const a = 0.35 + (1.0 - 0.35) * progress;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
};
const isEmphasisWord = (word) => {
    const cleanWord = word.toUpperCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (word === word.toUpperCase() && cleanWord.length > 1)
        return true;
    const buzzwords = new Set([
        'MYTH', 'FACT', 'DANGER', 'SECRET', 'MISTAKE', 'WARNING', 'FATAL', 'EASY', 'PERMANENT', 'NEVER',
        'ALWAYS', 'CURE', 'STOP', 'BEST', 'WORST', 'TRUTH', 'CRITICAL', 'SHOCKING', 'IMPORTANT'
    ]);
    return buzzwords.has(cleanWord);
};
const renderHookAnimation = (style, props) => {
    switch (style) {
        case 'ehr-file':
            return _jsx(EHRFileHook, { ...props });
        case 'parallax-data':
            return _jsx(ParallaxHook, { ...props });
        case 'redacted':
            return _jsx(RedactedHook, { ...props });
        case 'typewriter-terminal':
            return _jsx(TypewriterTerminalHook, { ...props });
        case 'typewriter-pop':
            return _jsx(TypewriterWordPopHook, { ...props });
        case 'typewriter-slide':
            return _jsx(TypewriterStaggeredSlideHook, { ...props });
        case '3d-stack':
            return _jsx(CardStackFractureHook, { ...props });
        case 'blur-in':
            return _jsx(BlurInDiagnosticHook, { ...props });
        case 'parallax-waveform':
            return _jsx(ParallaxWaveformHook, { ...props });
        case 'glitch-cycle':
            return _jsx(GlitchCycleAlertHook, { ...props });
        case 'mosaic-reframe':
            return _jsx(MosaicReframeHook, { ...props });
        case 'variable-typewriter':
            return _jsx(EhrVariableTypewriterHook, { ...props });
        case '3d-carousel':
            return _jsx(DiagnosticCarousel3DHook, { ...props });
        case 'matrix-flyby':
            return _jsx(SymptomMatrixFlybyHook, { ...props });
        case 'list-countdown':
            return _jsx(ListRevealCountdownHook, { ...props });
        case '3d-showcase':
            return _jsx(Transform3DShowcaseHook, { ...props });
        default:
            return null;
    }
};
const StaggeredTakeawayItem = ({ bullet, idx, frameWithinScene, fps, resolvedAccent, fonts, startFrame, }) => {
    const relativeFrame = frameWithinScene - startFrame;
    const itemSpring = spring({
        frame: Math.max(0, relativeFrame),
        fps,
        config: { damping: 14, stiffness: 120 },
    });
    const yOffset = interpolate(itemSpring, [0, 1], [30, 0]);
    const opacity = relativeFrame >= 0 ? interpolate(itemSpring, [0, 1], [0, 1]) : 0;
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
            transform: `translateY(${yOffset}px)`,
            opacity,
        }, children: [_jsx("div", { style: {
                    fontFamily: 'Courier New, Courier, monospace',
                    fontSize: '26px',
                    fontWeight: 900,
                    backgroundColor: resolvedAccent,
                    color: '#050505',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 15px ${resolvedAccent}40`,
                    border: '1px solid rgba(255,255,255,0.1)',
                }, children: String(idx + 1).padStart(2, '0') }), _jsx("div", { style: {
                    fontFamily: fonts.sans,
                    fontSize: '34px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    textAlign: 'left',
                    lineHeight: 1.25,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }, children: bullet })] }));
};
export const TalkingHeadQnaTemplate = ({ audioUrl, expertName, expertSpecialty, domain, hookText, hookStyle = 'zoom-face', scenes, ctaText, ctaType, ctaTitle, ctaSubtitle, ctaLink, ctaHandle, accentColor: customAccent, bgGradientStart: customStart, bgGradientEnd: customEnd, bgSolid: customSolid, themeId = 'hero-gold', bgVideoUrl: customBgVideo, language = 'en', expertAvatar, expertLogo, expertImages, expertImageSet, overlayStyle: customOverlayStyle, wordTimestamps, takeaways, clientId, designId, fontPairingIndex: customFontPairingIndex, layoutVariant: customLayoutVariant, decorationStyle: customDecorationStyle, imageTreatment: customImageTreatment, audioHasQuestion, patientQuestionAudioUrl = 'audio/question-1.mp3', // Loud default patient voice
bgMusicUrl, }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    // ── 1. Resolve theme & profiles ─────────────────────────────────────────
    const theme = getThemeById(themeId);
    const resolvedAccent = customAccent || theme.accentColor;
    const resolvedBgStart = customStart || theme.bgGradientStart;
    const resolvedBgEnd = customEnd || theme.bgGradientEnd;
    const resolvedBgSolid = customSolid || theme.bgSolid;
    const resolvedBgVideo = customBgVideo || theme.bgVideoUrl;
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
    const resolvedImageFilter = React.useMemo(() => getImageFilter(pProfile.imageTreatment, resolvedAccent), [pProfile.imageTreatment, resolvedAccent]);
    const fonts = getFontFamilies(language, pProfile.fontPairingIndex);
    const resolvedAudioUrl = React.useMemo(() => {
        if (!audioUrl)
            return '';
        if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:'))
            return audioUrl;
        return staticFile(audioUrl);
    }, [audioUrl]);
    // ── 2. Smart Audio Q&A Sync Mode Detection ──────────────────────────────
    const first15Words = React.useMemo(() => wordTimestamps?.slice(0, 15) || [], [wordTimestamps]);
    const isQuestionInAudio = React.useMemo(() => {
        if (typeof audioHasQuestion === 'boolean')
            return audioHasQuestion;
        return first15Words.some((w) => w.word.includes('?'));
    }, [audioHasQuestion, first15Words]);
    const questionEndSec = React.useMemo(() => {
        const questionMarkIdx = first15Words.findIndex((w) => w.word.includes('?'));
        if (questionMarkIdx >= 0)
            return first15Words[questionMarkIdx].end;
        return 3.0;
    }, [first15Words]);
    const questionEndFrame = Math.round(questionEndSec * fps);
    const ANSWER_START_FRAME = isQuestionInAudio ? questionEndFrame : 90;
    const AUDIO_START_FRAME = isQuestionInAudio ? 0 : 90;
    const OUTRO_DURATION = 120;
    const ctaStartFrame = durationInFrames - OUTRO_DURATION;
    const isCtaActive = frame >= ctaStartFrame;
    // ── 3. Typewriter character count & audio clicks triggers ────────────────
    const typingStartFrame = 10;
    const typingEndFrame = ANSWER_START_FRAME - 15; // Complete typing slightly before transition
    const typedCharCount = React.useMemo(() => {
        if (isQuestionInAudio)
            return hookText.length;
        return Math.floor(interpolate(frame, [typingStartFrame, typingEndFrame], [0, hookText.length], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }));
    }, [frame, isQuestionInAudio, hookText, typingEndFrame]);
    // Pre-calculate trigger frames for typing click sounds (Mode B)
    const typewriterClickFrames = React.useMemo(() => {
        const frames = [];
        if (isQuestionInAudio)
            return frames;
        const textLen = hookText.length;
        // Play sound every 2 characters to sound natural
        for (let i = 0; i < textLen; i++) {
            if (i % 2 === 0) {
                const f = Math.round(interpolate(i, [0, textLen - 1], [typingStartFrame, typingEndFrame], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }));
                frames.push(f);
            }
        }
        return frames;
    }, [isQuestionInAudio, hookText, typingEndFrame]);
    // ── 4. Sound Effects triggers ───────────────────────────────────────────
    const sfxBoomFrames = [0];
    const sfxWhooshFrames = [10, ANSWER_START_FRAME];
    const sfxDingFrames = [ctaStartFrame];
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
    const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
    const activeSceneIndex = (scenes || []).findIndex((s) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec);
    const prevSceneIndex = Math.max(0, activeSceneIndex - 1);
    const currentBgImage = React.useMemo(() => {
        if (sceneImages.length === 0)
            return undefined;
        if (isCtaActive)
            return ctaImage;
        if (frame < ANSWER_START_FRAME)
            return hookImage;
        const idx = activeSceneIndex >= 0 ? activeSceneIndex % sceneImages.length : 0;
        return sceneImages[idx];
    }, [sceneImages, frame, activeSceneIndex, isCtaActive, hookImage, ctaImage, ANSWER_START_FRAME]);
    const prevBgImage = React.useMemo(() => {
        if (sceneImages.length === 0)
            return undefined;
        const idx = prevSceneIndex % sceneImages.length;
        return sceneImages[idx];
    }, [sceneImages, prevSceneIndex]);
    const activeSceneStartFrame = React.useMemo(() => {
        if (!scenes || activeSceneIndex < 0)
            return ANSWER_START_FRAME;
        return Math.round(scenes[activeSceneIndex].startSec * fps) + AUDIO_START_FRAME;
    }, [scenes, activeSceneIndex, fps, ANSWER_START_FRAME, AUDIO_START_FRAME]);
    const frameWithinScene = Math.max(0, frame - activeSceneStartFrame);
    const CROSSFADE_DURATION = 15;
    const isCrossfading = frameWithinScene < CROSSFADE_DURATION && activeSceneIndex > 0;
    // ── 6. Auto-Zoom Pattern Interrupt Cuts ──────────────────────────────────
    const zoomScale = React.useMemo(() => {
        if (frame < ANSWER_START_FRAME || isCtaActive)
            return 1.0;
        const zoomCycleIndex = Math.floor((frame - ANSWER_START_FRAME) / 75);
        const targetScales = [1.05, 1.14, 1.0, 1.10];
        const targetScale = targetScales[zoomCycleIndex % targetScales.length];
        const frameInCycle = (frame - ANSWER_START_FRAME) % 75;
        const zoomSpring = spring({
            frame: frameInCycle,
            fps,
            config: { damping: 13, stiffness: 180 },
        });
        const previousScale = targetScales[(zoomCycleIndex - 1 + targetScales.length) % targetScales.length];
        return interpolate(zoomSpring, [0, 1], [previousScale || 1.0, targetScale]);
    }, [frame, ANSWER_START_FRAME, isCtaActive, fps]);
    const zoomCutWhooshFrames = React.useMemo(() => {
        const frames = [];
        if (durationInFrames <= ANSWER_START_FRAME)
            return frames;
        const totalCycles = Math.floor((ctaStartFrame - ANSWER_START_FRAME) / 75);
        for (let c = 1; c <= totalCycles; c++) {
            frames.push(ANSWER_START_FRAME + c * 75);
        }
        return frames;
    }, [ANSWER_START_FRAME, ctaStartFrame, durationInFrames]);
    // ── 7. Visual Color Flash Transition Frames ──────────────────────────────
    const flashTriggerFrames = React.useMemo(() => {
        const list = [ANSWER_START_FRAME];
        zoomCutWhooshFrames.forEach(f => list.push(f));
        (scenes || []).forEach((s) => {
            const sf = Math.round(s.startSec * fps) + AUDIO_START_FRAME;
            if (sf > ANSWER_START_FRAME) {
                list.push(sf);
            }
        });
        return list;
    }, [ANSWER_START_FRAME, zoomCutWhooshFrames, scenes, fps, AUDIO_START_FRAME]);
    const recentFlashTrigger = React.useMemo(() => {
        return flashTriggerFrames.reduce((acc, tf) => {
            if (frame >= tf && tf > acc)
                return tf;
            return acc;
        }, -1);
    }, [flashTriggerFrames, frame]);
    const flashOpacity = React.useMemo(() => {
        if (recentFlashTrigger === -1)
            return 0;
        const diff = frame - recentFlashTrigger;
        if (diff < 0 || diff >= 5)
            return 0;
        return interpolate(diff, [0, 5], [0.15, 0.0], { extrapolateRight: 'clamp' });
    }, [frame, recentFlashTrigger]);
    // ── 8. Group words into lines and track active ──────────────────────────
    const answerStartSec = isQuestionInAudio ? questionEndSec : 0;
    const captionLines = React.useMemo(() => {
        return groupWordsIntoLines(wordTimestamps || [], answerStartSec);
    }, [wordTimestamps, answerStartSec]);
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
    // SFX pop on subtitle line transitions
    const popSfxFrames = React.useMemo(() => {
        return captionLines.map(line => Math.round(line.start * fps) + AUDIO_START_FRAME);
    }, [captionLines, fps, AUDIO_START_FRAME]);
    // ── 9. Key Takeaways overlays ──────────────────────────────────────────
    const currentSceneWithTakeaway = React.useMemo(() => {
        if (activeSceneIndex < 0 || !scenes)
            return null;
        const s = scenes[activeSceneIndex];
        return s.keyQuote ? s : null;
    }, [scenes, activeSceneIndex]);
    const takeawayBullets = React.useMemo(() => {
        if (!currentSceneWithTakeaway || !currentSceneWithTakeaway.keyQuote)
            return [];
        // Clean trailing/leading whitespace and any trailing commas
        const cleanQuote = currentSceneWithTakeaway.keyQuote.trim().replace(/,\s*$/, '');
        // Split by newlines, bullets (•), dashes (-), or asterisks (*)
        if (cleanQuote.includes('\n') || cleanQuote.includes('•') || cleanQuote.includes('- ')) {
            return cleanQuote
                .split(/[\n•\-*]+/g)
                .map(b => b.trim().replace(/,\s*$/, ''))
                .filter(Boolean);
        }
        // Fallback: split by sentence boundaries (e.g. ". ") if there are multiple sentences
        const sentences = cleanQuote
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim().replace(/,\s*$/, ''))
            .filter(Boolean);
        if (sentences.length > 1) {
            return sentences;
        }
        // Fallback: split by comma if the parts are moderately short (clause list style)
        if (cleanQuote.includes(',')) {
            const parts = cleanQuote.split(',').map(p => p.trim()).filter(Boolean);
            if (parts.length >= 2 && parts.every(p => p.split(' ').length <= 5)) {
                return parts;
            }
        }
        return [cleanQuote];
    }, [currentSceneWithTakeaway]);
    const bulletStartFrames = React.useMemo(() => {
        if (takeawayBullets.length === 0 || !currentSceneWithTakeaway)
            return [];
        const sceneStartSec = currentSceneWithTakeaway.startSec;
        const sceneEndSec = currentSceneWithTakeaway.endSec;
        // Filter words that belong to this scene
        const sceneWords = (wordTimestamps || []).filter((w) => w.start >= sceneStartSec && w.start <= sceneEndSec);
        const stopwords = new Set([
            'the', 'and', 'for', 'you', 'with', 'this', 'that', 'your', 'from', 'have',
            'are', 'was', 'were', 'has', 'had', 'been', 'can', 'could', 'should', 'would',
            'will', 'shall', 'may', 'might', 'must', 'but', 'not', 'our', 'out', 'what'
        ]);
        const startTimes = [];
        let lastFoundIdx = -1;
        takeawayBullets.forEach((bullet) => {
            const bulletWords = bullet
                .toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopwords.has(w));
            let foundTime = null;
            for (let i = lastFoundIdx + 1; i < sceneWords.length; i++) {
                const sw = sceneWords[i].word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
                if (bulletWords.includes(sw) || bulletWords.some(bw => sw.includes(bw) || bw.includes(sw))) {
                    foundTime = sceneWords[i].start;
                    lastFoundIdx = i;
                    break;
                }
            }
            startTimes.push(foundTime ?? -1);
        });
        const finalStartSecs = [];
        for (let i = 0; i < takeawayBullets.length; i++) {
            const prevTime = i > 0 ? finalStartSecs[i - 1] : sceneStartSec;
            let time = startTimes[i];
            if (time === -1 || time < prevTime) {
                const remainingBullets = takeawayBullets.length - i;
                const step = (sceneEndSec - prevTime) / (remainingBullets + 1);
                time = prevTime + step;
            }
            time = Math.min(time, sceneEndSec - 0.2);
            finalStartSecs.push(time);
        }
        return finalStartSecs.map(sec => {
            const relSec = sec - sceneStartSec;
            return Math.max(0, Math.round(relSec * fps));
        });
    }, [takeawayBullets, currentSceneWithTakeaway, wordTimestamps, fps]);
    const activeTakeaways = React.useMemo(() => {
        // If global takeaways exist, use them
        if (takeaways && takeaways.length > 0) {
            return takeaways.map((t, idx) => {
                const cleanedText = t.text.trim().replace(/,\s*$/, '');
                const startFrame = AUDIO_START_FRAME + Math.round(t.timeSec * fps);
                return {
                    text: cleanedText,
                    startFrame,
                    idx,
                };
            });
        }
        // Fallback: use scene-based keyQuote split into bullets
        if (currentSceneWithTakeaway) {
            return takeawayBullets.map((bullet, idx) => {
                const startFrame = bulletStartFrames[idx] || 0;
                // Since scene-based starts relative to the scene, convert it to global frame
                const globalStartFrame = activeSceneStartFrame + startFrame;
                return {
                    text: bullet,
                    startFrame: globalStartFrame,
                    idx,
                };
            });
        }
        return [];
    }, [takeaways, takeawayBullets, bulletStartFrames, currentSceneWithTakeaway, activeSceneStartFrame, AUDIO_START_FRAME, fps]);
    const firstTakeawayStartFrame = React.useMemo(() => {
        if (activeTakeaways.length === 0)
            return 0;
        return Math.min(...activeTakeaways.map(t => t.startFrame));
    }, [activeTakeaways]);
    const keyTakeawayDingFrames = React.useMemo(() => {
        return activeTakeaways.map(t => t.startFrame);
    }, [activeTakeaways]);
    // Logo resolver
    const resolvedLogoUrl = React.useMemo(() => {
        if (!expertLogo)
            return null;
        if (expertLogo.startsWith('http') || expertLogo.startsWith('/') || expertLogo.startsWith('data:'))
            return expertLogo;
        return staticFile(expertLogo);
    }, [expertLogo]);
    // ── 10. Styling and Animations ─────────────────────────────────────────
    const textShadowValue = '0 4px 25px rgba(0,0,0,0.85)';
    const displayTextColor = '#FFFFFF';
    const displayTextSecondary = 'rgba(255,255,255,0.78)';
    const cardBg = 'rgba(10, 10, 10, 0.45)';
    const cardBorder = 'rgba(255,255,255,0.15)';
    const mainContentOpacity = interpolate(frame, [ctaStartFrame, ctaStartFrame + 15], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const audioVolume = interpolate(frame, [durationInFrames - OUTRO_DURATION, durationInFrames - 15], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    // ── 11. Q&A Sticker Positioning and Spring Transition ────────────────────
    const pipSpring = spring({
        frame: frame - (ANSWER_START_FRAME - 20),
        fps,
        config: { damping: 15, stiffness: 100 },
    });
    const stickerScale = interpolate(pipSpring, [0, 1], [1.0, 0.55]);
    const stickerX = interpolate(pipSpring, [0, 1], [0, -220]);
    const stickerY = interpolate(pipSpring, [0, 1], [0, -420]);
    const stickerOpacity = interpolate(frame, [0, 8], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    return (_jsxs(AbsoluteFill, { style: { backgroundColor: '#050505', fontFamily: fonts.sans }, children: [currentBgImage ? (_jsx(AbsoluteFill, { style: { overflow: 'hidden' }, children: isCrossfading ? (_jsx(CrossfadeImage, { fromUrl: prevBgImage, toUrl: currentBgImage, crossfadeFrame: frameWithinScene, crossfadeDuration: CROSSFADE_DURATION, imageFilter: resolvedImageFilter, currentSceneFrame: frameWithinScene, zoomScale: zoomScale })) : (_jsxs(AbsoluteFill, { style: { backgroundColor: '#050505', overflow: 'hidden' }, children: [_jsx(Img, { src: currentBgImage.startsWith('http') || currentBgImage.startsWith('data:') || currentBgImage.startsWith('/') || currentBgImage.startsWith('file:') ? currentBgImage : staticFile(currentBgImage), style: {
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center top',
                                transform: `scale(${interpolate(frameWithinScene, [0, 600], [1.02, 1.10], { extrapolateRight: 'clamp' }) * zoomScale})`,
                                transformOrigin: 'center 25%',
                                filter: resolvedImageFilter || 'none',
                            } }), resolvedOverlayStyle === 'scrim-bottom' && (_jsx(AbsoluteFill, { style: { background: 'linear-gradient(to bottom, transparent 0%, transparent 22%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.85) 100%)', zIndex: 1 } })), resolvedOverlayStyle === 'scrim-full' && (_jsx(AbsoluteFill, { style: { background: 'rgba(0,0,0,0.42)', zIndex: 1 } })), resolvedOverlayStyle === 'vignette' && (_jsx(AbsoluteFill, { style: { background: 'radial-gradient(ellipse at 50% 35%, transparent 25%, rgba(0,0,0,0.7) 100%)', zIndex: 1 } })), _jsx(AbsoluteFill, { style: { background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 18%)', zIndex: 2 } })] })) })) : (_jsx(AnimatedBackground, { bgType: "hero-portrait", bgGradientStart: resolvedBgStart, bgGradientEnd: resolvedBgEnd, bgSolid: resolvedBgSolid, bgVideoUrl: resolvedBgVideo, overlayStyle: resolvedOverlayStyle, accentColor: resolvedAccent, imageFilter: resolvedImageFilter })), _jsx(SafeZone, { show: false }), flashOpacity > 0 && (_jsx(AbsoluteFill, { style: { backgroundColor: '#FFFFFF', opacity: flashOpacity, zIndex: 100, pointerEvents: 'none' } })), resolvedLogoUrl && frame >= ANSWER_START_FRAME && !isCtaActive && (_jsx("div", { style: {
                    position: 'absolute',
                    top: '75px', right: '80px',
                    opacity: 0.85,
                    zIndex: 15,
                    transform: 'scale(0.9)',
                    transformOrigin: 'right top'
                }, children: _jsx("img", { src: resolvedLogoUrl, alt: "Brand Logo", style: { maxHeight: '52px', maxWidth: '170px', objectFit: 'contain' } }) })), !isCtaActive && (_jsxs(AbsoluteFill, { style: { zIndex: 20, opacity: mainContentOpacity }, children: [hookStyle === 'zoom-face' && (_jsxs("div", { style: {
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '920px',
                            transform: `translate(-50%, -50%) translate(${stickerX}px, ${stickerY}px) scale(${stickerScale})`,
                            transformOrigin: 'center center',
                            opacity: stickerOpacity,
                            zIndex: 40,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            padding: '36px 44px',
                            backgroundColor: cardBg,
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            borderRadius: '32px',
                            border: `1.5px solid ${cardBorder}`,
                            boxShadow: '0 30px 65px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            backgroundColor: `${resolvedAccent}22`,
                                            padding: '10px 18px',
                                            borderRadius: '16px',
                                            border: `1px solid ${resolvedAccent}40`,
                                        }, children: [_jsx("span", { style: { fontSize: '26px' }, children: isQuestionInAudio ? '❓' : '💡' }), _jsx("span", { style: {
                                                    fontFamily: fonts.sans,
                                                    fontSize: '22px',
                                                    fontWeight: 900,
                                                    color: resolvedAccent,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1.5px',
                                                    textShadow: `0 0 10px ${resolvedAccent}30`,
                                                }, children: isQuestionInAudio ? 'PATIENT QUESTION' : 'ASK AN EXPERT' })] }), frame < ANSWER_START_FRAME && (_jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '22px',
                                            fontWeight: 800,
                                            color: resolvedAccent,
                                        }, children: [_jsxs("span", { children: ["ANSWER IN ", Math.ceil((ANSWER_START_FRAME - frame) / fps), "s"] }), _jsx("div", { style: {
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    border: `3px solid ${resolvedAccent}20`,
                                                    borderTop: `3px solid ${resolvedAccent}`,
                                                    transform: `rotate(${frame * 8}deg)`,
                                                } })] }))] }), _jsx("div", { style: {
                                    fontFamily: fonts.serif,
                                    fontSize: '56px',
                                    fontWeight: 800,
                                    color: '#FFFFFF',
                                    lineHeight: 1.25,
                                    textShadow: '0 4px 15px rgba(0,0,0,0.6)',
                                    margin: '12px 0 6px 0',
                                }, children: isQuestionInAudio ? (
                                // Mode A: Spoken question (Highlight active words)
                                _jsx("div", { children: wordTimestamps
                                        ?.filter((w) => w.start < questionEndSec)
                                        .map((w, idx) => {
                                        const isActive = audioCurrentSec >= w.start && audioCurrentSec <= w.end;
                                        return (_jsx("span", { style: {
                                                color: isActive ? resolvedAccent : '#FFFFFF',
                                                textShadow: isActive ? `0 0 15px ${resolvedAccent}80` : 'none',
                                                fontWeight: isActive ? 900 : 800,
                                                marginRight: '10px',
                                                display: 'inline-block',
                                                transition: 'color 0.1s ease',
                                            }, children: w.word }, idx));
                                    }) })) : (
                                // Mode B: Typewriter typing animation
                                _jsxs("div", { children: [hookText.substring(0, typedCharCount), frame >= typingStartFrame && frame < typingEndFrame && (_jsx("span", { style: { color: resolvedAccent, fontWeight: 300, marginLeft: '2px' }, children: "|" }))] })) }), _jsxs("div", { style: {
                                    fontFamily: fonts.sans,
                                    fontSize: '20px',
                                    fontWeight: 600,
                                    color: displayTextSecondary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '4px',
                                }, children: [_jsx("span", { style: { opacity: 0.6 }, children: "Asked by" }), _jsx("span", { style: { color: resolvedAccent, fontWeight: 700 }, children: "@healthy_living" })] })] })), hookStyle !== 'zoom-face' && frame < ANSWER_START_FRAME && (_jsx("div", { style: {
                            position: 'absolute',
                            inset: 0,
                            zIndex: 50,
                            opacity: interpolate(frame, [ANSWER_START_FRAME - 8, ANSWER_START_FRAME], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                        }, children: renderHookAnimation(hookStyle, {
                            doctorPhoto: hookImage,
                            doctorAvatar: expertAvatar,
                            doctorName: expertName,
                            doctorTitle: expertSpecialty,
                            hookText,
                            accentColor: resolvedAccent,
                            fonts,
                        }) })), frame >= ANSWER_START_FRAME && (_jsxs(AbsoluteFill, { style: { zIndex: 10 }, children: [activeLine && (_jsx("div", { style: {
                                    position: 'absolute',
                                    left: '60px',
                                    right: '60px',
                                    bottom: '330px',
                                    textAlign: 'center',
                                    padding: '28px 36px',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    borderRadius: '26px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
                                }, children: _jsx("div", { style: {
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '16px 20px',
                                        width: '100%',
                                    }, children: activeLine.words.map((w, idx) => {
                                        const timeSinceStart = audioCurrentSec - w.start;
                                        const isActive = timeSinceStart >= 0 && audioCurrentSec <= w.end;
                                        const isPast = audioCurrentSec > w.end;
                                        const isFuture = audioCurrentSec < w.start;
                                        let currentProgress = 0;
                                        if (!isFuture) {
                                            const wordActiveFrame = timeSinceStart * fps;
                                            const springValue = spring({
                                                frame: wordActiveFrame,
                                                fps,
                                                config: { damping: 14, stiffness: 130 },
                                            });
                                            if (isPast) {
                                                const timeSinceEnd = audioCurrentSec - w.end;
                                                const exitProgress = Math.max(0, 1 - (timeSinceEnd / 0.1));
                                                currentProgress = springValue * exitProgress;
                                            }
                                            else {
                                                currentProgress = springValue;
                                            }
                                        }
                                        // High-engagement pop animation with 64px Mobile optimized text
                                        const scale = interpolate(currentProgress, [0, 1], [1.0, 1.14]);
                                        const rotate = interpolate(currentProgress, [0, 1], [0, isEmphasisWord(w.word) ? 2 : 0]);
                                        let color = 'rgba(255, 255, 255, 0.4)';
                                        if (isPast) {
                                            color = getInterpolatedColor(currentProgress, 'white', resolvedAccent);
                                        }
                                        else if (isActive) {
                                            color = getInterpolatedColor(currentProgress, 'rgba', isEmphasisWord(w.word) ? '#FFDF00' : resolvedAccent);
                                        }
                                        return (_jsx("span", { style: {
                                                fontFamily: fonts.sans,
                                                fontSize: '64px', // NAS-style giant mobile captions
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                color,
                                                transform: `scale(${scale}) rotate(${rotate}deg)`,
                                                textShadow: isActive
                                                    ? `0 4px 15px ${isEmphasisWord(w.word) ? 'rgba(255,223,0,0.4)' : resolvedAccent + '44'}, 0 2px 5px rgba(0,0,0,0.6)`
                                                    : '0 2px 4px rgba(0,0,0,0.4)',
                                                letterSpacing: '-0.5px',
                                                margin: '0 4px',
                                                display: 'inline-block',
                                                transition: 'color 0.1s ease',
                                            }, children: w.word }, idx));
                                    }) }) })), activeTakeaways.length > 0 && frame >= firstTakeawayStartFrame && (_jsxs("div", { style: {
                                    position: 'absolute',
                                    top: '185px',
                                    left: '60px',
                                    right: '60px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                    padding: '30px 40px',
                                    backgroundColor: 'rgba(15, 15, 15, 0.85)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    borderRadius: '32px',
                                    borderLeft: `8px solid ${resolvedAccent}`,
                                    border: '1.5px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                    zIndex: 25,
                                    transform: `translateY(${interpolate(spring({
                                        frame: Math.max(0, frame - firstTakeawayStartFrame),
                                        fps,
                                        config: { damping: 16, stiffness: 120 }
                                    }), [0, 1], [-40, 0])}px)`,
                                    opacity: interpolate(Math.max(0, frame - firstTakeawayStartFrame), [0, 12], [0, 1]),
                                }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                        }, children: [_jsx("span", { style: { fontSize: '42px' }, children: "\uD83D\uDCA1" }), _jsx("span", { style: {
                                                    fontFamily: fonts.sans,
                                                    fontSize: '28px',
                                                    fontWeight: 900,
                                                    color: resolvedAccent,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '2.5px',
                                                    textShadow: `0 0 12px ${resolvedAccent}40`,
                                                }, children: "Key Takeaways" })] }), _jsx("div", { style: {
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '20px',
                                            width: '100%',
                                        }, children: activeTakeaways.map((item, idx) => {
                                            const isVisible = frame >= item.startFrame;
                                            if (!isVisible)
                                                return null;
                                            return (_jsx(StaggeredTakeawayItem, { bullet: item.text, idx: idx, frameWithinScene: frame, fps: fps, resolvedAccent: resolvedAccent, fonts: fonts, startFrame: item.startFrame }, item.idx));
                                        }) })] })), _jsxs("div", { style: {
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
                                            border: `2.5px solid ${resolvedAccent}`,
                                            boxShadow: `0 0 15px ${resolvedAccent}40`,
                                        } })), _jsxs("div", { children: [_jsx("div", { style: {
                                                    fontFamily: fonts.sans,
                                                    fontSize: '26px',
                                                    fontWeight: 800,
                                                    color: displayTextColor,
                                                    textShadow: textShadowValue,
                                                }, children: expertName }), _jsx("div", { style: {
                                                    fontFamily: fonts.sans,
                                                    fontSize: '18px',
                                                    fontWeight: 700,
                                                    color: resolvedAccent,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1.2px',
                                                    textShadow: `0 0 8px ${resolvedAccent}40`,
                                                }, children: expertSpecialty })] })] })] }))] })), isCtaActive && (_jsx(Sequence, { from: ctaStartFrame, children: _jsx(AbsoluteFill, { style: {
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center',
                        padding: '0 80px', textAlign: 'center', zIndex: 30,
                    }, children: _jsx(EndingBlock, { ctaType: ctaType, ctaText: ctaText, ctaTitle: ctaTitle, ctaSubtitle: ctaSubtitle, ctaLink: ctaLink, ctaHandle: ctaHandle, expertName: expertName, expertSpecialty: expertSpecialty, domain: domain, accentColor: resolvedAccent, textColor: displayTextColor, textSecondaryColor: displayTextSecondary, cardBg: cardBg, cardBorder: cardBorder, textShadow: textShadowValue, fonts: fonts, expertAvatar: expertAvatar, isLightTheme: false }) }) })), _jsx(ProgressBar, { accentColor: resolvedAccent }), _jsx(SoundEffect, { src: "audio/sfx/boom.wav", triggerFrames: sfxBoomFrames, volume: 0.8 }), _jsx(SoundEffect, { src: "audio/sfx/whoosh.wav", triggerFrames: sfxWhooshFrames, volume: 0.6 }), _jsx(SoundEffect, { src: "audio/sfx/ding.wav", triggerFrames: sfxDingFrames, volume: 0.6 }), _jsx(SoundEffect, { src: "audio/sfx/pop.wav", triggerFrames: keyTakeawayDingFrames, volume: 0.5 }), bgMusicUrl && (_jsx(Audio, { src: staticFile(bgMusicUrl), volume: interpolate(frame, [ctaStartFrame, durationInFrames], [0.06, 0.0], { extrapolateLeft: 'clamp' }), loop: true })), resolvedAudioUrl && (_jsx(Sequence, { from: AUDIO_START_FRAME, children: _jsx(Audio, { src: resolvedAudioUrl, volume: audioVolume }) })), !isQuestionInAudio && patientQuestionAudioUrl && (_jsx(Sequence, { from: 0, durationInFrames: ANSWER_START_FRAME, children: _jsx(Audio, { src: patientQuestionAudioUrl.startsWith('http') || patientQuestionAudioUrl.startsWith('/') || patientQuestionAudioUrl.startsWith('data:') ? patientQuestionAudioUrl : staticFile(patientQuestionAudioUrl), volume: 0.8 }) }))] }));
};

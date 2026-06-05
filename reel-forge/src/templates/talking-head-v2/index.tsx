/**
 * talking-head-v2/index.tsx
 * -------------------------
 * Enhanced talking-head template featuring high-impact, professional
 * Instagram-style spring captions (sticker outlines) and scene-level
 * Ken Burns background panning/zooming.
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
  interpolateColor,
} from 'remotion';
import { GlobalProps, WordTimestamp } from '../../global-schema';
import { getFontFamilies } from '../_shared/fonts';
import { getThemeById } from '../_shared/themes';
import { AnimatedBackground } from '../_shared/AnimatedBackground';
import { HookIntro } from '../_shared/HookIntro';
import { SafeZone } from '../_shared/SafeZone';
import { ProgressBar } from '../_shared/ProgressBar';
import { EndingBlock } from '../_shared/EndingBlock';
import { getPersonalizationProfile, getImageFilter } from '../../lib/personalization';

// ── Crossfade between two images with Ken Burns zoom ────────────────────
interface CrossfadeImageProps {
  fromUrl: string | undefined;
  toUrl: string | undefined;
  crossfadeFrame: number;
  crossfadeDuration: number;
  objectPosition?: string;
  imageFilter?: string;
  currentSceneFrame: number;
}

const CrossfadeImage: React.FC<CrossfadeImageProps> = ({
  fromUrl,
  toUrl,
  crossfadeFrame,
  crossfadeDuration,
  objectPosition = 'center top',
  imageFilter,
  currentSceneFrame,
}) => {
  const toOpacity = interpolate(crossfadeFrame, [0, crossfadeDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const resolveUrl = (u?: string) => {
    if (!u) return '';
    if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:')) return u;
    return staticFile(u);
  };

  // Scene-level Ken Burns for outgoing and incoming images
  const scaleFrom = interpolate(currentSceneFrame + 150, [0, 600], [1.02, 1.14], { extrapolateRight: 'clamp' });
  const scaleTo = interpolate(currentSceneFrame, [0, 600], [1.02, 1.14], { extrapolateRight: 'clamp' });

  const transXFrom = interpolate(currentSceneFrame + 150, [0, 600], [-8, 8], { extrapolateRight: 'clamp' });
  const transXTo = interpolate(currentSceneFrame, [0, 600], [-8, 8], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {fromUrl && (
        <Img
          src={resolveUrl(fromUrl)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            filter: imageFilter || 'none',
            transform: `scale(${scaleFrom}) translateX(${transXFrom}px)`,
          }}
        />
      )}
      {toUrl && toUrl !== fromUrl && (
        <Img
          src={resolveUrl(toUrl)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            opacity: toOpacity,
            filter: imageFilter || 'none',
            transform: `scale(${scaleTo}) translateX(${transXTo}px)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ── Helper: group word timestamps into neat lines ──────────────────────
interface CaptionLine {
  words: WordTimestamp[];
  start: number;
  end: number;
}
const groupWordsIntoLines = (words: WordTimestamp[]): CaptionLine[] => {
  const lines: CaptionLine[] = [];
  if (!words || words.length === 0) return lines;

  let currentLineWords: WordTimestamp[] = [];
  const maxLineChars = 20; // Slightly shorter line length for faster reading
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
    } else {
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

// ── Custom color interpolation helpers ──────────────────────────────────
const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

const getInterpolatedColor = (progress: number, fromColor: 'white' | 'rgba', targetHex: string): string => {
  const rgbTarget = hexToRgb(targetHex);
  if (fromColor === 'white') {
    const r = Math.round(255 + (rgbTarget.r - 255) * progress);
    const g = Math.round(255 + (rgbTarget.g - 255) * progress);
    const b = Math.round(255 + (rgbTarget.b - 255) * progress);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const r = Math.round(255 + (rgbTarget.r - 255) * progress);
    const g = Math.round(255 + (rgbTarget.g - 255) * progress);
    const b = Math.round(255 + (rgbTarget.b - 255) * progress);
    const a = 0.4 + (1.0 - 0.4) * progress;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
};

export const TalkingHeadV2Template: React.FC<GlobalProps> = ({
  audioUrl,
  expertName,
  expertSpecialty,
  domain,
  hookText,
  hookStyle = 'zoom-face',
  hookStat,
  hookEmoji,
  toneTag,
  scenes,
  ctaText,
  ctaType,
  ctaTitle,
  ctaSubtitle,
  ctaLink,
  ctaHandle,
  accentColor: customAccent,
  bgGradientStart: customStart,
  bgGradientEnd: customEnd,
  bgSolid: customSolid,
  themeId = 'gold-clinical',
  bgVideoUrl: customBgVideo,
  language = 'en',
  expertAvatar,
  expertLogo,
  expertImages,
  expertImageSet,
  overlayStyle: customOverlayStyle,
  wordTimestamps,
  clientId,
  designId,
  fontPairingIndex: customFontPairingIndex,
  layoutVariant: customLayoutVariant,
  decorationStyle: customDecorationStyle,
  imageTreatment: customImageTreatment,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── 1. Resolve theme ────────────────────────────────────────────────────
  const theme = getThemeById(themeId);
  const resolvedAccent = customAccent || theme.accentColor;
  const resolvedBgStart = customStart || theme.bgGradientStart;
  const resolvedBgEnd = customEnd || theme.bgGradientEnd;
  const resolvedBgSolid = customSolid || theme.bgSolid;
  const resolvedBgVideo = customBgVideo || theme.bgVideoUrl;

  // ── 1b. Resolve personalization ──────────────────────────────────────────
  const pProfile = React.useMemo(() => {
    return getPersonalizationProfile(
      clientId || 'default-client',
      designId || 'default-design',
      {
        fontPairingIndex: customFontPairingIndex,
        layoutVariant: customLayoutVariant as any,
        overlayStyle: customOverlayStyle as any,
        decorationStyle: customDecorationStyle as any,
        imageTreatment: customImageTreatment as any,
      }
    );
  }, [clientId, designId, customFontPairingIndex, customLayoutVariant, customOverlayStyle, customDecorationStyle, customImageTreatment]);

  const resolvedOverlayStyle = pProfile.overlayStyle || theme.overlayStyle || 'scrim-bottom';
  const resolvedImageFilter = React.useMemo(() => {
    return getImageFilter(pProfile.imageTreatment, resolvedAccent);
  }, [pProfile.imageTreatment, resolvedAccent]);

  // ── 2. Fonts ────────────────────────────────────────────────────────────
  const fonts = getFontFamilies(language, pProfile.fontPairingIndex);

  // ── 3. Audio path ────────────────────────────────────────────────────────
  const resolvedAudioUrl = React.useMemo(() => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:')) return audioUrl;
    return staticFile(audioUrl);
  }, [audioUrl]);

  // ── 4. Timing ────────────────────────────────────────────────────────────
  const INTRO_DURATION = 90;
  const OUTRO_DURATION = 120;
  const CROSSFADE_DURATION = 18;
  const AUDIO_START_FRAME = INTRO_DURATION;
  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  // ── 5. Resolve images ────────────────────────────────────────────────────
  type ImageSetEntry = { file: string; role: string; alt?: string | undefined };
  const allImages = React.useMemo(() => {
    if (expertImageSet && expertImageSet.length > 0) return expertImageSet.map((e: ImageSetEntry) => e.file);
    return expertImages || [];
  }, [expertImages, expertImageSet]);

  const hookImage = React.useMemo(() => {
    if (expertImageSet) {
      const hi = expertImageSet.find((e: ImageSetEntry) => e.role === 'hook' || e.role === 'portrait');
      if (hi) return hi.file;
    }
    return allImages[0] || expertAvatar;
  }, [expertImageSet, allImages, expertAvatar]);

  const ctaImage = React.useMemo(() => {
    if (expertImageSet) {
      const ci = expertImageSet.find((e: ImageSetEntry) => e.role === 'cta');
      if (ci) return ci.file;
    }
    return allImages[2] || allImages[0];
  }, [expertImageSet, allImages]);

  const sceneImages = React.useMemo(() => {
    if (expertImageSet) {
      const si = expertImageSet.filter((e: ImageSetEntry) => e.role === 'scene' || e.role === 'portrait');
      if (si.length > 0) return si.map((e: ImageSetEntry) => e.file);
    }
    return allImages;
  }, [expertImageSet, allImages]);

  // ── 6. Scene tracking ────────────────────────────────────────────────────
  const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
  const activeSceneIndex = (scenes || []).findIndex(
    (s: {startSec: number; endSec: number}) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec
  );

  const prevSceneIndex = Math.max(0, activeSceneIndex - 1);
  const currentBgImage = React.useMemo(() => {
    if (sceneImages.length === 0) return undefined;
    if (isCtaActive) return ctaImage;
    if (frame < AUDIO_START_FRAME) return hookImage;
    const idx = activeSceneIndex >= 0 ? activeSceneIndex % sceneImages.length : 0;
    return sceneImages[idx];
  }, [sceneImages, frame, activeSceneIndex, isCtaActive, hookImage, ctaImage]);

  const prevBgImage = React.useMemo(() => {
    if (sceneImages.length === 0) return undefined;
    const idx = prevSceneIndex % sceneImages.length;
    return sceneImages[idx];
  }, [sceneImages, prevSceneIndex]);

  const activeSceneStartFrame = React.useMemo(() => {
    if (!scenes || activeSceneIndex < 0) return AUDIO_START_FRAME;
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
  const mainContentOpacity = interpolate(
    frame,
    [ctaStartFrame, ctaStartFrame + 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const audioVolume = interpolate(
    frame,
    [durationInFrames - OUTRO_DURATION, durationInFrames - 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── 9. Caption assembly & highlighting ──────────────────────────────────
  const captionLines = React.useMemo(() => {
    return groupWordsIntoLines(wordTimestamps || []);
  }, [wordTimestamps]);

  // Find active line
  const activeLine = React.useMemo(() => {
    if (captionLines.length === 0) return null;
    let found = captionLines.find(l => audioCurrentSec >= l.start && audioCurrentSec <= l.end);
    if (!found) {
      const past = captionLines.filter(l => audioCurrentSec >= l.end);
      if (past.length > 0) {
        found = past[past.length - 1];
      } else {
        found = captionLines[0];
      }
    }
    return found;
  }, [captionLines, audioCurrentSec]);

  // Logo resolver
  const resolvedLogoUrl = React.useMemo(() => {
    if (!expertLogo) return null;
    if (expertLogo.startsWith('http') || expertLogo.startsWith('/') || expertLogo.startsWith('data:')) return expertLogo;
    return staticFile(expertLogo);
  }, [expertLogo]);

  // Position captions dynamically based on layoutVariant
  const captionStyle = React.useMemo((): React.CSSProperties => {
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
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    };
  }, [pProfile.layoutVariant]);

  return (
    <AbsoluteFill>
      {/* ── Background Layer with Scene-Level Ken Burns ─────────────────── */}
      {currentBgImage ? (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          {isCrossfading ? (
            <CrossfadeImage
              fromUrl={prevBgImage}
              toUrl={currentBgImage}
              crossfadeFrame={frameWithinScene}
              crossfadeDuration={CROSSFADE_DURATION}
              imageFilter={resolvedImageFilter}
              currentSceneFrame={frameWithinScene}
            />
          ) : (
            <AbsoluteFill style={{ backgroundColor: '#0A0A0A', overflow: 'hidden' }}>
              <Img
                src={currentBgImage.startsWith('http') || currentBgImage.startsWith('data:') || currentBgImage.startsWith('/') || currentBgImage.startsWith('file:') ? currentBgImage : staticFile(currentBgImage)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  transform: `scale(${interpolate(frameWithinScene, [0, 600], [1.02, 1.14], { extrapolateRight: 'clamp' })}) translateX(${interpolate(frameWithinScene, [0, 600], [-8, 8], { extrapolateRight: 'clamp' })}px)`,
                  transformOrigin: 'center 25%',
                  filter: resolvedImageFilter || 'none',
                }}
              />
              {/* Overlays */}
              {resolvedOverlayStyle === 'scrim-bottom' && (
                <AbsoluteFill style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)', zIndex: 1 }} />
              )}
              {resolvedOverlayStyle === 'scrim-full' && (
                <AbsoluteFill style={{ background: 'rgba(0,0,0,0.38)', zIndex: 1 }} />
              )}
              {resolvedOverlayStyle === 'vignette' && (
                <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(0,0,0,0.65) 100%)', zIndex: 1 }} />
              )}
              <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 20%)', zIndex: 2 }} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      ) : (
        <AnimatedBackground
          bgType="hero-portrait"
          bgGradientStart={resolvedBgStart}
          bgGradientEnd={resolvedBgEnd}
          bgSolid={resolvedBgSolid}
          bgVideoUrl={resolvedBgVideo}
          overlayStyle={resolvedOverlayStyle as any}
          accentColor={resolvedAccent}
          imageFilter={resolvedImageFilter}
        />
      )}

      <SafeZone show={false} />

      {/* ── Logo Watermark ───────────────────────────────────────────────── */}
      {resolvedLogoUrl && frame >= AUDIO_START_FRAME && (
        <div style={{
          position: 'absolute',
          top: '80px', right: '80px',
          opacity: 0.8,
          zIndex: 20,
        }}>
          <img
            src={resolvedLogoUrl}
            alt="Brand Logo"
            style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* ── 3-Second Hook ───────────────────────────────────────────────── */}
      {frame < INTRO_DURATION && (
        <AbsoluteFill style={{ zIndex: 30 }}>
          <HookIntro
            hookText={hookText || ''}
            hookStyle={hookStyle}
            hookStat={hookStat}
            hookEmoji={hookEmoji}
            toneTag={toneTag}
            expertName={expertName}
            expertSpecialty={expertSpecialty}
            heroImageUrl={hookImage}
            accentColor={resolvedAccent}
            textColor={displayTextColor}
            fonts={fonts}
            durationFrames={INTRO_DURATION}
          />
        </AbsoluteFill>
      )}

      {/* ── Main content (captions + simple tag) ─────────────────────────── */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity, zIndex: 10 }}>
          
          {/* Karaoke Captions */}
          {activeLine && (
            <div style={captionStyle}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: pProfile.layoutVariant === 'quote-bottom-left' || pProfile.layoutVariant === 'quote-split' ? 'flex-start' : 'center',
                alignItems: 'center',
                gap: '16px 24px', // Increased gap to prevent any overlap
                width: '100%',
              }}>
                {activeLine.words.map((w, idx) => {
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
                      config: {
                        damping: 15,
                        stiffness: 120,
                      },
                    });

                    if (isPast) {
                      // Smooth exit decay over 0.12 seconds
                      const timeSinceEnd = audioCurrentSec - w.end;
                      const exitProgress = Math.max(0, 1 - (timeSinceEnd / 0.12));
                      currentProgress = springValue * exitProgress;
                    } else {
                      currentProgress = springValue;
                    }
                  }

                  // Modest 1.1x zoom max, combined with horizontal margins prevents word overlaps
                  const scale = interpolate(currentProgress, [0, 1], [1.0, 1.10]);
                  
                  let color = 'rgba(255, 255, 255, 0.4)';
                  if (isPast) {
                    // Smooth transition from active (resolvedAccent) to past (solid white #FFFFFF)
                    color = getInterpolatedColor(currentProgress, 'white', resolvedAccent);
                  } else if (isActive) {
                    // Smooth transition from future (rgba(255,255,255,0.4)) to active (resolvedAccent)
                    color = getInterpolatedColor(currentProgress, 'rgba', resolvedAccent);
                  }

                  return (
                    <span
                      key={idx}
                      style={{
                        fontFamily: fonts.sans, // Modern premium sans-serif
                        fontSize: '56px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color,
                        transform: `scale(${scale})`,
                        textShadow: isActive 
                          ? `0 4px 12px ${resolvedAccent}33, 0 2px 6px rgba(0,0,0,0.5)` 
                          : '0 2px 4px rgba(0, 0, 0, 0.4)',
                        letterSpacing: '-0.5px',
                        margin: '0 6px', // Extra buffer margin to prevent overlapping
                        display: 'inline-block',
                      }}
                    >
                      {w.word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Minimal identity watermark at the bottom */}
          <div style={{
            position: 'absolute',
            bottom: '120px',
            left: '60px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            {expertAvatar && (
              <img
                src={expertAvatar.startsWith('http') || expertAvatar.startsWith('/') || expertAvatar.startsWith('data:')
                  ? expertAvatar
                  : staticFile(expertAvatar)}
                alt={expertName}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${resolvedAccent}`,
                  boxShadow: `0 0 10px ${resolvedAccent}40`,
                }}
              />
            )}
            <div>
              <div style={{
                fontFamily: fonts.sans,
                fontSize: '26px',
                fontWeight: 800,
                color: displayTextColor,
                textShadow: textShadowValue,
                letterSpacing: '-0.2px',
              }}>
                {expertName}
              </div>
              <div style={{
                fontFamily: fonts.sans,
                fontSize: '18px',
                fontWeight: 600,
                color: resolvedAccent,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textShadow: `0 0 8px ${resolvedAccent}60`,
              }}>
                {expertSpecialty}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Outro CTA */}
      {isCtaActive && (
        <Sequence from={ctaStartFrame}>
          <AbsoluteFill style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '0 80px', textAlign: 'center', zIndex: 20,
          }}>
            <EndingBlock
              ctaType={ctaType}
              ctaText={ctaText}
              ctaTitle={ctaTitle}
              ctaSubtitle={ctaSubtitle}
              ctaLink={ctaLink}
              ctaHandle={ctaHandle}
              expertName={expertName}
              expertSpecialty={expertSpecialty}
              domain={domain}
              accentColor={resolvedAccent}
              textColor={displayTextColor}
              textSecondaryColor={displayTextSecondary}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textShadow={textShadowValue}
              fonts={fonts}
              expertAvatar={expertAvatar}
              isLightTheme={false}
            />
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Progress Bar */}
      <ProgressBar accentColor={resolvedAccent} />

      {/* Audio Playback */}
      {frame >= AUDIO_START_FRAME && resolvedAudioUrl && (
        <Sequence from={AUDIO_START_FRAME}>
          <Audio src={resolvedAudioUrl} volume={audioVolume} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

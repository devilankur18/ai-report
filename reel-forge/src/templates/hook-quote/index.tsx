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
} from 'remotion';
import { GlobalProps } from '../../global-schema';
import { getFontFamilies } from '../_shared/fonts';
import { getThemeById } from '../_shared/themes';
import { AnimatedBackground } from '../_shared/AnimatedBackground';
import { HookIntro } from '../_shared/HookIntro';
import { SafeZone } from '../_shared/SafeZone';
import { ProgressBar } from '../_shared/ProgressBar';
import { EndingBlock } from '../_shared/EndingBlock';
import { getPersonalizationProfile, getImageFilter } from '../../lib/personalization';
import { PersonalizedQuoteCard, PersonalizedIdentity } from '../_shared/LayoutVariants';

// ── Crossfade between two images ─────────────────────────────────────────
interface CrossfadeImageProps {
  fromUrl: string | undefined;
  toUrl: string | undefined;
  crossfadeFrame: number; // local frame within the crossfade window
  crossfadeDuration: number;
  objectPosition?: string;
  imageFilter?: string;
}
const CrossfadeImage: React.FC<CrossfadeImageProps> = ({
  fromUrl, toUrl, crossfadeFrame, crossfadeDuration, objectPosition = 'center top', imageFilter,
}) => {
  const toOpacity = interpolate(crossfadeFrame, [0, crossfadeDuration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const resolveUrl = (u?: string) => {
    if (!u) return '';
    if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:')) return u;
    return staticFile(u);
  };
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {fromUrl && (
        <Img src={resolveUrl(fromUrl)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition, filter: imageFilter || 'none' }} />
      )}
      {toUrl && toUrl !== fromUrl && (
        <Img src={resolveUrl(toUrl)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition, opacity: toOpacity, filter: imageFilter || 'none' }} />
      )}
    </AbsoluteFill>
  );
};

// ── Helper: thin audio visualiser bar ────────────────────────────────────
// A simpler, less dominant waveform — a row of thin bars behind the quote card
const ThinWaveBar: React.FC<{ accentColor: string; frame: number }> = ({ accentColor, frame }) => {
  const BAR_COUNT = 40;
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    // Pseudo-random oscillation per bar (no actual audio data needed for background decoration)
    const phase = (i / BAR_COUNT) * Math.PI * 4 + frame * 0.08;
    const h = Math.abs(Math.sin(phase) * 0.5 + Math.sin(phase * 1.7) * 0.3) * 28 + 4;
    return h;
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '5px', width: '100%', height: '40px',
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: '5px',
          height: `${h}px`,
          backgroundColor: accentColor,
          borderRadius: '3px',
          opacity: 0.55,
          boxShadow: h > 20 ? `0 0 6px ${accentColor}70` : 'none',
        }} />
      ))}
    </div>
  );
};

// ── Main template ─────────────────────────────────────────────────────────
export const HookQuoteTemplate: React.FC<GlobalProps> = ({
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
  themeId,
  bgVideoUrl: customBgVideo,
  language = 'en',
  expertAvatar,
  expertLogo,
  expertImages,
  expertImageSet,
  overlayStyle: customOverlayStyle,
  // Personalization fields
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
  const resolvedTextColor = theme.textColor;
  const resolvedTextSecondary = theme.textSecondaryColor;
  const resolvedBgStart = customStart || theme.bgGradientStart;
  const resolvedBgEnd = customEnd || theme.bgGradientEnd;
  const resolvedBgSolid = customSolid || theme.bgSolid;
  const resolvedBgVideo = customBgVideo || theme.bgVideoUrl;
  const resolvedBgType = theme.bgType;

  // ── 1b. Resolve personalization profile ─────────────────────────────────
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
  const INTRO_DURATION = 90;   // 3 seconds
  const OUTRO_DURATION = 120;  // 4 seconds
  const CROSSFADE_DURATION = 18; // 0.6s crossfade between scenes
  const AUDIO_START_FRAME = INTRO_DURATION;
  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  // ── 5. Resolve image sets ─────────────────────────────────────────────
  // Support both legacy expertImages[] and new expertImageSet[]
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
  const activeScene = activeSceneIndex >= 0 ? scenes[activeSceneIndex] : null;

  // ── 7. Scene-based background image with crossfade ───────────────────────
  const prevSceneIndex = Math.max(0, activeSceneIndex - 1);
  const currentBgImage = React.useMemo(() => {
    if (sceneImages.length === 0) return undefined;
    if (isCtaActive) return ctaImage;
    if (frame < AUDIO_START_FRAME) return hookImage;
    const idx = activeSceneIndex >= 0
      ? activeSceneIndex % sceneImages.length
      : 0;
    return sceneImages[idx];
  }, [sceneImages, frame, activeSceneIndex, isCtaActive, hookImage, ctaImage]);

  const prevBgImage = React.useMemo(() => {
    if (sceneImages.length === 0) return undefined;
    const idx = prevSceneIndex % sceneImages.length;
    return sceneImages[idx];
  }, [sceneImages, prevSceneIndex]);

  // Detect scene boundary to drive crossfade
  const activeSceneStartFrame = React.useMemo(() => {
    if (!scenes || activeSceneIndex < 0) return AUDIO_START_FRAME;
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
  const mainContentOpacity = interpolate(
    frame,
    [ctaStartFrame, ctaStartFrame + 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Quote card: slide up from bottom when scene changes
  const quoteEnterSpr = spring({
    frame: frameWithinScene,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const quoteTranslateY = interpolate(quoteEnterSpr, [0, 1], [60, 0]);
  const quoteOpacity = interpolate(quoteEnterSpr, [0, 1], [0, 1]);

  const audioVolume = interpolate(
    frame,
    [durationInFrames - OUTRO_DURATION, durationInFrames - 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── Resolve logo URL ──────────────────────────────────────────────────────
  const resolvedLogoUrl = React.useMemo(() => {
    if (!expertLogo) return null;
    if (expertLogo.startsWith('http') || expertLogo.startsWith('/') || expertLogo.startsWith('data:')) return expertLogo;
    return staticFile(expertLogo);
  }, [expertLogo]);

  return (
    <AbsoluteFill>
      {/* ── Background Layer ────────────────────────────────────────────── */}
      {isHeroMode && currentBgImage ? (
        // Hero mode: full-screen doctor photo with crossfade transitions
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          {isCrossfading ? (
            <CrossfadeImage
              fromUrl={prevBgImage}
              toUrl={currentBgImage}
              crossfadeFrame={frameWithinScene}
              crossfadeDuration={CROSSFADE_DURATION}
              imageFilter={resolvedImageFilter}
            />
          ) : (
            <AnimatedBackground
              bgType={resolvedBgType as any}
              bgImageUrl={currentBgImage}
              bgGradientStart={resolvedBgStart}
              bgGradientEnd={resolvedBgEnd}
              bgSolid={resolvedBgSolid}
              bgVideoUrl={resolvedBgVideo}
              overlayStyle={resolvedOverlayStyle as any}
              accentColor={resolvedAccent}
              imageFilter={resolvedImageFilter}
            />
          )}
        </AbsoluteFill>
      ) : (
        // Gradient / particles / video fallback
        <AnimatedBackground
          bgType={resolvedBgType as any}
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

      {/* ── Logo Watermark (top-right) ───────────────────────────────────── */}
      {resolvedLogoUrl && frame >= AUDIO_START_FRAME && (
        <div style={{
          position: 'absolute',
          top: '80px', right: '80px',
          opacity: 0.75,
          zIndex: 20,
        }}>
          <img
            src={resolvedLogoUrl}
            alt="Brand Logo"
            style={{ maxHeight: '56px', maxWidth: '170px', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* ── 3-Second Hook Intro ──────────────────────────────────────────── */}
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

      {/* ── Main Content (after intro, before outro) ─────────────────────── */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity, zIndex: 10 }}>

          {/* ── Key Quote Card ────────────────────────────────────────────── */}
          {activeScene?.keyQuote && (
            <PersonalizedQuoteCard
              variant={pProfile.layoutVariant}
              decoration={pProfile.decorationStyle}
              accentColor={resolvedAccent}
              textColor={displayTextColor}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textShadow={textShadowValue}
              fontFamily={fonts.serif}
              opacity={quoteOpacity}
              translateY={quoteTranslateY}
            >
              {/* Thin audio accent bar inside quote card at the top */}
              <ThinWaveBar accentColor={resolvedAccent} frame={frame} />
              <div style={{ marginTop: '12px' }}>
                {activeScene.keyQuote}
              </div>
            </PersonalizedQuoteCard>
          )}

          {/* ── Doctor Identity Pill ──────────────────────────────────────── */}
          <PersonalizedIdentity
            variant={pProfile.layoutVariant}
            expertName={expertName}
            expertSpecialty={expertSpecialty}
            expertAvatar={expertAvatar}
            accentColor={resolvedAccent}
            textColor={displayTextColor}
            textShadow={textShadowValue}
            fontFamily={fonts.sans}
            avatarResolver={(u?: string | null) => {
              if (!u) return '';
              if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:')) return u;
              return staticFile(u);
            }}
          />
        </AbsoluteFill>
      )}

      {/* ── Outro CTA Screen ─────────────────────────────────────────────── */}
      {isCtaActive && (
        <Sequence from={ctaStartFrame}>
          <AbsoluteFill
            style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              padding: '0 100px', textAlign: 'center', zIndex: 20,
            }}
          >
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

      {/* ── Progress Bar ──────────────────────────────────────────────────── */}
      <ProgressBar accentColor={resolvedAccent} />

      {/* ── Audio Playback ────────────────────────────────────────────────── */}
      {frame >= AUDIO_START_FRAME && resolvedAudioUrl && (
        <Sequence from={AUDIO_START_FRAME}>
          <Audio src={resolvedAudioUrl} volume={audioVolume} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/**
 * minimal-podcast/index.tsx
 * --------------------------
 * Podcast-style template with Phase 1+2 upgrades:
 *
 * Phase 1:
 *  - Doctor fills 60% of background in portrait fill mode
 *  - Radial waveform overlays ON TOP of the doctor image (not replacing it)
 *  - Quote moves to bottom-third Instagram caption zone
 *
 * Phase 2:
 *  - 3-second hook uses HookIntro component
 *  - Default hook for podcast: typewriter-bold (authoritative, name-first feel)
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
import { AudioWaveform } from '../_shared/AudioWaveform';
import { EndingBlock } from '../_shared/EndingBlock';
import { getPersonalizationProfile, getImageFilter } from '../../lib/personalization';
import { PersonalizedQuoteCard, PersonalizedIdentity } from '../_shared/LayoutVariants';

export const MinimalPodcastTemplate: React.FC<GlobalProps> = ({
  audioUrl,
  expertName,
  expertSpecialty,
  domain,
  hookText,
  hookStyle = 'typewriter-bold',
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
  themeId = 'neon-tech',
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
  const INTRO_DURATION = 90;  // 3 seconds (upgraded from 2)
  const OUTRO_DURATION = 120;
  const AUDIO_START_FRAME = INTRO_DURATION;
  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  // ── 5. Scene tracking ────────────────────────────────────────────────────
  const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
  const activeSceneIndex = (scenes || []).findIndex(
    (s: {startSec: number; endSec: number}) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec
  );
  const activeScene = activeSceneIndex >= 0 ? scenes[activeSceneIndex] : null;

  // ── 6. Image resolution ───────────────────────────────────────────────────
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

  // Active avatar cycles through scene images
  const activeAvatar = React.useMemo(() => {
    if (allImages.length > 0) {
      const idx = Math.max(0, activeSceneIndex) % allImages.length;
      return allImages[idx];
    }
    return expertAvatar;
  }, [allImages, expertAvatar, activeSceneIndex]);

  const resolveUrl = (u?: string | null): string => {
    if (!u) return '';
    if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') || u.startsWith('file:')) return u;
    return staticFile(u);
  };

  const resolvedAvatarUrl = resolveUrl(activeAvatar);
  const resolvedLogoUrl = resolveUrl(expertLogo);

  // ── 7. Theme helpers ────────────────────────────────────────────────────
  const isImageBg = resolvedBgType === 'image' || resolvedBgType === 'hero-portrait';
  const displayTextColor = '#FFFFFF';
  const displayTextSecondary = 'rgba(255,255,255,0.75)';
  const cardBg = 'rgba(0,0,0,0.52)';
  const cardBorder = 'rgba(255,255,255,0.12)';
  const textShadowValue = '0 3px 20px rgba(0,0,0,0.7)';

  // ── 8. Background image for non-hero modes ────────────────────────────
  const resolvedBgImageUrl = React.useMemo(() => {
    if (!isImageBg || allImages.length === 0) return undefined;
    if (isCtaActive) return allImages[2] || allImages[0];
    if (frame < AUDIO_START_FRAME) return hookImage;
    const idx = (activeSceneIndex + 3) % allImages.length;
    return allImages[idx];
  }, [allImages, frame, activeSceneIndex, isCtaActive, isImageBg, hookImage]);

  // ── 9. Animations ─────────────────────────────────────────────────────
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

  // Quote entry per scene
  const activeSceneStartFrame = React.useMemo(() => {
    if (!scenes || activeSceneIndex < 0) return AUDIO_START_FRAME;
    return Math.round(scenes[activeSceneIndex].startSec * fps) + AUDIO_START_FRAME;
  }, [scenes, activeSceneIndex, fps]);
  const frameWithinScene = Math.max(0, frame - activeSceneStartFrame);
  const quoteSpr = spring({ frame: frameWithinScene, fps, config: { damping: 14, stiffness: 110 } });
  const quoteOpacity = interpolate(quoteSpr, [0, 1], [0, 1]);
  const quoteTranslateY = interpolate(quoteSpr, [0, 1], [50, 0]);

  return (
    <AbsoluteFill>
      {/* ── Background ──────────────────────────────────────────────────── */}
      <AnimatedBackground
        bgType={resolvedBgType as any}
        bgGradientStart={resolvedBgStart}
        bgGradientEnd={resolvedBgEnd}
        bgSolid={resolvedBgSolid}
        bgVideoUrl={resolvedBgVideo}
        bgImageUrl={resolvedBgImageUrl}
        overlayStyle={resolvedOverlayStyle as any}
        accentColor={resolvedAccent}
        imageFilter={resolvedImageFilter}
      />

      <SafeZone show={false} />

      {/* ── Logo Watermark ───────────────────────────────────────────────── */}
      {resolvedLogoUrl && frame >= AUDIO_START_FRAME && (
        <div style={{
          position: 'absolute', top: '80px', right: '80px',
          opacity: 0.75, zIndex: 20,
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
            hookText={hookText || expertName}
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

      {/* ── Main Podcast Content ─────────────────────────────────────────── */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity, zIndex: 10 }}>

          {/* ── Centered circular avatar + radial waveform ─────────────── */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '420px',
            height: '420px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Waveform rings behind avatar */}
            <Sequence from={AUDIO_START_FRAME}>
              <AudioWaveform
                audioUrl={resolvedAudioUrl}
                accentColor={resolvedAccent}
                mode="radial"
                numberOfBars={64}
              />
            </Sequence>

            {/* Doctor avatar inside waveform ring */}
            {resolvedAvatarUrl && (
              <img
                src={resolvedAvatarUrl}
                alt={expertName}
                style={{
                  position: 'absolute',
                  width: '320px',
                  height: '320px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  zIndex: 2,
                  border: `4px solid ${resolvedAccent}`,
                  boxShadow: `0 0 30px ${resolvedAccent}50, 0 8px 40px rgba(0,0,0,0.5)`,
                }}
              />
            )}
          </div>

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
              <div style={{ marginTop: '12px' }}>
                "{activeScene.keyQuote}"
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

      {/* ── Outro CTA ──────────────────────────────────────────────────────── */}
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

      {/* ── Progress Bar ──────────────────────────────────────────────────── */}
      <ProgressBar accentColor={resolvedAccent} />

      {/* ── Audio ─────────────────────────────────────────────────────────── */}
      {frame >= AUDIO_START_FRAME && resolvedAudioUrl && (
        <Sequence from={AUDIO_START_FRAME}>
          <Audio src={resolvedAudioUrl} volume={audioVolume} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

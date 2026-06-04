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
} from 'remotion';
import { GlobalProps } from '../../global-schema';
import { getFontFamilies } from '../_shared/fonts';
import { getThemeById } from '../_shared/themes';
import { AnimatedBackground } from '../_shared/AnimatedBackground';
import { SafeZone } from '../_shared/SafeZone';
import { ProgressBar } from '../_shared/ProgressBar';
import { ExpertBadge } from '../_shared/ExpertBadge';
import { AudioWaveform } from '../_shared/AudioWaveform';
import { EndingBlock } from '../_shared/EndingBlock';

export const HookQuoteTemplate: React.FC<GlobalProps> = ({
  audioUrl,
  expertName,
  expertSpecialty,
  domain,
  hookText,
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
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 1. Resolve theme configuration
  const theme = getThemeById(themeId);
  const resolvedAccent = customAccent || theme.accentColor;
  const resolvedTextColor = theme.textColor;
  const resolvedTextSecondary = theme.textSecondaryColor;
  const resolvedBgStart = customStart || theme.bgGradientStart;
  const resolvedBgEnd = customEnd || theme.bgGradientEnd;
  const resolvedBgSolid = customSolid || theme.bgSolid;
  const resolvedBgVideo = customBgVideo || theme.bgVideoUrl;
  const resolvedBgType = theme.bgType;

  // 2. Resolve fonts based on language
  const fonts = getFontFamilies(language);

  // 3. Resolve audio path
  const resolvedAudioUrl = React.useMemo(() => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:')) {
      return audioUrl;
    }
    return staticFile(audioUrl);
  }, [audioUrl]);

  // Timing constants
  const INTRO_DURATION = 90; // 3 seconds at 30fps
  const OUTRO_DURATION = 120; // 4 seconds at 30fps
  const AUDIO_START_FRAME = INTRO_DURATION;

  // 4. Resolve Background Image Slideshow Cycling
  // Determine which background image to show based on the video timeline
  const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
  const activeSceneIndex = (scenes || []).findIndex(
    (s) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec
  );
  const activeScene = activeSceneIndex >= 0 ? scenes[activeSceneIndex] : null;

  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  const resolvedBgImageUrl = React.useMemo(() => {
    if (!expertImages || expertImages.length === 0) return undefined;
    
    // If CTA is active, show the clinic inside (index 2 or last)
    if (isCtaActive) {
      return expertImages[2] || expertImages[0];
    }
    
    // If Intro is active (Hook text), show the clinic outside (index 1 or last)
    if (frame < AUDIO_START_FRAME) {
      return expertImages[1] || expertImages[0];
    }
    
    // During speech, cycle background images across the scenes (offset index to use consultation pics: index 3 or 0)
    // E.g. scene 0 -> images[3], scene 1 -> images[0], etc.
    const imageIdx = (activeSceneIndex + 3) % expertImages.length;
    return expertImages[imageIdx];
  }, [expertImages, frame, activeSceneIndex, isCtaActive]);

  // Glassmorphic properties based on light vs dark theme
  const isLightTheme = resolvedTextColor === '#2D221C';
  
  // Under image background mode, we force dark card styling with high contrast white text overlays for visibility
  const isImageBg = resolvedBgType === 'image';
  const displayTextColor = isImageBg ? '#FFFFFF' : resolvedTextColor;
  const displayTextSecondary = isImageBg ? '#E2E8F0' : resolvedTextSecondary;
  const cardBg = isImageBg 
    ? 'rgba(0, 0, 0, 0.45)' 
    : (isLightTheme ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.25)');
  const cardBorder = isImageBg 
    ? 'rgba(255, 255, 255, 0.08)' 
    : (isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
  const textShadowValue = isImageBg 
    ? '0 4px 20px rgba(0, 0, 0, 0.6)' 
    : (isLightTheme ? '0 2px 10px rgba(0, 0, 0, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.4)');

  // 1. Hook Text Intro Animation (0s to 3s)
  const hookWords = (hookText || '').split(' ');
  const renderHookIntro = () => {
    if (frame >= INTRO_DURATION) return null;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '0 80px',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
          {hookWords.map((word, index) => {
            const delay = index * 4;
            const spr = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12 },
            });
            const opacity = interpolate(spr, [0, 1], [0, 1]);
            const scale = interpolate(spr, [0, 1], [0.5, 1]);
            const translateY = interpolate(spr, [0, 1], [50, 0]);

            return (
              <span
                key={index}
                style={{
                  fontFamily: fonts.serif,
                  fontSize: '84px', // enlarged (was 80px)
                  fontWeight: 'bold',
                  color: displayTextColor,
                  textShadow: textShadowValue,
                  opacity,
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // Fade out main scene content when CTA starts
  const mainContentOpacity = interpolate(
    frame,
    [ctaStartFrame, ctaStartFrame + 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Badge entry spring
  const badgeSpr = spring({
    frame: frame - AUDIO_START_FRAME,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const badgeTranslateY = interpolate(badgeSpr, [0, 1], [150, 0]);
  const badgeOpacity = interpolate(badgeSpr, [0, 1], [0, 1]);

  // Audio volume fade out during the last 4 seconds
  const audioVolume = interpolate(
    frame,
    [durationInFrames - OUTRO_DURATION, durationInFrames - 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      <AnimatedBackground
        bgType={resolvedBgType}
        bgGradientStart={resolvedBgStart}
        bgGradientEnd={resolvedBgEnd}
        bgSolid={resolvedBgSolid}
        bgVideoUrl={resolvedBgVideo}
        bgImageUrl={resolvedBgImageUrl}
      />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <SafeZone show={false} />

      {/* Brand logo watermark (top right) */}
      {expertLogo && (
        <div
          style={{
            position: 'absolute',
            top: '100px',
            right: '90px',
            opacity: 0.65,
            zIndex: 10,
          }}
        >
          <img
            src={expertLogo.startsWith('http') || expertLogo.startsWith('/') || expertLogo.startsWith('data:') ? expertLogo : staticFile(expertLogo)}
            alt="Brand Logo"
            style={{
              maxHeight: '60px',
              maxWidth: '180px',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* Intro Hook Scene */}
      {renderHookIntro()}

      {/* Main Content Area (Waveform, Badge, Interactive Quote) */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity, zIndex: 5 }}>
          {/* Top quote area */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '10%',
              right: '10%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {activeScene?.keyQuote && (
              <div
                key={activeSceneIndex} // Re-render triggers animation
                style={{
                  fontFamily: fonts.sans,
                  fontSize: '48px', // enlarged (was 44px)
                  fontWeight: 600,
                  color: displayTextColor,
                  lineHeight: 1.4,
                  padding: '30px 50px', // enlarged padding
                  borderRadius: '24px',
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                  animation: 'fadeIn 0.5s ease-out',
                  maxWidth: '840px',
                  textShadow: textShadowValue,
                }}
              >
                "{activeScene.keyQuote}"
              </div>
            )}
          </div>

          {/* Animated Waveform */}
          <div
            style={{
              position: 'absolute',
              top: '55%',
              left: '10%',
              right: '10%',
            }}
          >
            <AudioWaveform
              audioUrl={resolvedAudioUrl}
              accentColor={resolvedAccent}
              mode="linear"
              numberOfBars={32}
            />
          </div>

          {/* Expert Badge in bottom-left */}
          <div
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '90px',
              opacity: badgeOpacity,
              transform: `translateY(${badgeTranslateY}px)`,
            }}
          >
            <ExpertBadge
              name={expertName}
              specialty={expertSpecialty}
              accentColor={resolvedAccent}
              textColor={displayTextColor}
              themeId={themeId}
              expertAvatar={expertAvatar}
              expertImages={expertImages}
              imageIndex={activeSceneIndex >= 0 ? activeSceneIndex : 0}
            />
          </div>
        </AbsoluteFill>
      )}

      {/* Outro CTA Scene (Last 4 seconds) */}
      {isCtaActive && (
        <Sequence from={ctaStartFrame}>
          <AbsoluteFill
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0 100px',
              textAlign: 'center',
              zIndex: 10,
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
              isLightTheme={isLightTheme}
            />
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Progress Bar (Visible throughout) */}
      <ProgressBar accentColor={resolvedAccent} />

      {/* Audio Playback starting at frame 90 */}
      {frame >= AUDIO_START_FRAME && resolvedAudioUrl && (
        <Audio src={resolvedAudioUrl} volume={audioVolume} />
      )}
    </AbsoluteFill>
  );
};

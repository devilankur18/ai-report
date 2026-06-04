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
import { AudioWaveform } from '../_shared/AudioWaveform';
import { EndingBlock } from '../_shared/EndingBlock';

export const MinimalPodcastTemplate: React.FC<GlobalProps> = ({
  audioUrl,
  expertName,
  expertSpecialty,
  domain,
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
  const INTRO_DURATION = 60; // 2 seconds
  const OUTRO_DURATION = 120; // 4 seconds
  const AUDIO_START_FRAME = INTRO_DURATION;

  // 4. Resolve Background Image Cycling
  const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
  const activeSceneIndex = (scenes || []).findIndex(
    (s) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec
  );
  const activeScene = activeSceneIndex >= 0 ? scenes[activeSceneIndex] : null;

  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  const resolvedBgImageUrl = React.useMemo(() => {
    if (!expertImages || expertImages.length === 0) return undefined;
    
    // Cycle backgrounds in sync with the scene shifts
    if (isCtaActive) {
      return expertImages[2] || expertImages[0];
    }
    if (frame < AUDIO_START_FRAME) {
      return expertImages[1] || expertImages[0];
    }
    
    const idx = (activeSceneIndex + 3) % expertImages.length;
    return expertImages[idx];
  }, [expertImages, frame, activeSceneIndex, isCtaActive]);

  // Glassmorphic properties based on light vs dark theme
  const isLightTheme = resolvedTextColor === '#2D221C';
  const isImageBg = resolvedBgType === 'image';
  const displayTextColor = isImageBg ? '#FFFFFF' : resolvedTextColor;
  const displayTextSecondary = isImageBg ? '#CBD5E1' : resolvedTextSecondary;
  
  const cardBg = isImageBg 
    ? 'rgba(0, 0, 0, 0.45)' 
    : (isLightTheme ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.25)');
  const cardBorder = isImageBg 
    ? 'rgba(255, 255, 255, 0.08)' 
    : (isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
  const textShadowValue = isImageBg 
    ? '0 4px 20px rgba(0, 0, 0, 0.6)' 
    : (isLightTheme ? '0 2px 10px rgba(0, 0, 0, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.4)');

  // 1. Typewriter Intro Scene (0s to 2s)
  const introText = `${expertName.toUpperCase()}  |  ${expertSpecialty.toUpperCase()}`;
  const visibleCharsCount = Math.floor(
    interpolate(frame, [0, 45], [0, introText.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const typedText = introText.substring(0, visibleCharsCount);

  // Fade out main content during CTA
  const mainContentOpacity = interpolate(
    frame,
    [ctaStartFrame, ctaStartFrame + 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Audio volume fade out during the last 4 seconds
  const audioVolume = interpolate(
    frame,
    [durationInFrames - OUTRO_DURATION, durationInFrames - 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Active avatar image inside the circular waveform visualizer
  const activeAvatar = React.useMemo(() => {
    if (!expertImages || expertImages.length === 0) return expertAvatar;
    const idx = Math.max(0, activeSceneIndex) % expertImages.length;
    return expertImages[idx];
  }, [expertImages, expertAvatar, activeSceneIndex]);

  const resolvedAvatarUrl = activeAvatar
    ? (activeAvatar.startsWith('http') || activeAvatar.startsWith('/') || activeAvatar.startsWith('data:') ? activeAvatar : staticFile(activeAvatar))
    : null;

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
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
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
              maxHeight: '50px',
              maxWidth: '160px',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* Intro Typewriter Scene (0s to 2s) */}
      {frame < INTRO_DURATION && (
        <AbsoluteFill
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 60px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontSize: '38px', // enlarged (was 32px)
              fontWeight: 500,
              color: displayTextColor,
              letterSpacing: '3px',
              borderRight: frame % 15 < 8 ? `3px solid ${displayTextColor}` : '3px solid transparent',
              paddingRight: '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textShadow: textShadowValue,
            }}
          >
            {typedText}
          </div>
        </AbsoluteFill>
      )}

      {/* Main Podcast Player UI (from 2s onwards) */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity, zIndex: 5 }}>
          
          {/* Centered Radial Waveform with Avatar inside */}
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AudioWaveform
              audioUrl={resolvedAudioUrl}
              accentColor={resolvedAccent}
              mode="radial"
              numberOfBars={64}
            />
            
            {resolvedAvatarUrl && (
              <img
                src={resolvedAvatarUrl}
                alt={expertName}
                style={{
                  position: 'absolute',
                  width: '315px',
                  height: '315px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  zIndex: 2,
                  border: `3px solid ${resolvedAccent}30`,
                }}
              />
            )}
          </div>

          {/* Rotating Quote Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '68%',
              left: '80px',
              right: '80px',
              textAlign: 'center',
              minHeight: '160px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {activeScene?.keyQuote && (
              <div
                key={activeSceneIndex} // Re-render triggers animation reset
                style={{
                  fontFamily: fonts.sans,
                  fontSize: '44px', // enlarged (was 38px)
                  fontWeight: 400,
                  color: displayTextColor,
                  lineHeight: 1.5,
                  letterSpacing: '0.5px',
                  animation: 'fadeIn 0.6s ease-out',
                  textShadow: textShadowValue,
                  padding: '24px 36px',
                  borderRadius: '20px',
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                }}
              >
                "{activeScene.keyQuote}"
              </div>
            )}
          </div>

          {/* Static Metadata Info at Bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '100px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: '38px', // enlarged (was 28px)
                fontWeight: 700,
                color: displayTextColor,
                textTransform: 'uppercase',
                letterSpacing: '4px',
                textShadow: textShadowValue,
              }}
            >
              {expertName}
            </div>
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: '24px', // enlarged (was 18px)
                fontWeight: 500,
                color: displayTextSecondary,
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}
            >
              {expertSpecialty}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Outro CTA Overlay */}
      {isCtaActive && (
        <Sequence from={ctaStartFrame}>
          <AbsoluteFill
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0 80px',
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

      {/* Thin minimalist progress bar */}
      <ProgressBar accentColor={resolvedAccent} />

      {/* Audio Playback starting at frame 60 */}
      {frame >= AUDIO_START_FRAME && resolvedAudioUrl && (
        <Audio src={resolvedAudioUrl} volume={audioVolume} />
      )}
    </AbsoluteFill>
  );
};

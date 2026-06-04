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
import { fontFamilies } from '../_shared/fonts';
import { SafeZone } from '../_shared/SafeZone';
import { ProgressBar } from '../_shared/ProgressBar';
import { ExpertBadge } from '../_shared/ExpertBadge';
import { AudioWaveform } from '../_shared/AudioWaveform';

export const HookQuoteTemplate: React.FC<GlobalProps> = ({
  audioUrl,
  expertName,
  expertSpecialty,
  domain,
  hookText,
  scenes,
  ctaText,
  accentColor = '#FF6B35',
  bgGradientStart = '#0F0F23',
  bgGradientEnd = '#1A1A3E',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const resolvedAudioUrl = React.useMemo(() => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:')) {
      return audioUrl;
    }
    return staticFile(audioUrl);
  }, [audioUrl]);

  // Configuration Constants
  const INTRO_DURATION = 90; // 3 seconds at 30fps
  const OUTRO_DURATION = 120; // 4 seconds at 30fps
  const AUDIO_START_FRAME = INTRO_DURATION;

  // Background gradient rotation animation
  const bgAngle = interpolate(frame, [0, durationInFrames], [0, 360]);
  const backgroundStyle: React.CSSProperties = {
    background: `linear-gradient(${bgAngle}deg, ${bgGradientStart}, ${bgGradientEnd})`,
  };

  // 1. Hook Text Intro Animation (0s to 3s)
  const hookWords = hookText.split(' ');
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
                  fontFamily: fontFamilies.serif,
                  fontSize: '80px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
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

  // 2. Active Scene Quotes & Waveform Rendering (from 3s onwards)
  // Calculate current time in seconds relative to the audio start
  const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);

  // Find the active scene based on timing
  const activeScene = scenes.find(
    (s) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec
  );

  // CTA start frame
  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  // Interpolate opacity for main scene content (fades out when CTA starts)
  const mainContentOpacity = interpolate(
    frame,
    [ctaStartFrame, ctaStartFrame + 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Spring animation for Expert Badge entering at frame 90
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
    <AbsoluteFill style={backgroundStyle}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Dev SafeZone guide (toggle this for visual debugging) */}
      <SafeZone show={false} />

      {/* Intro Hook Scene */}
      {renderHookIntro()}

      {/* Main Content Area (Waveform, Badge, Interactive Quote) */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity }}>
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
                key={activeScene.label} // Key change triggers standard DOM re-mount & transition
                style={{
                  fontFamily: fontFamilies.sans,
                  fontSize: '46px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: 1.4,
                  padding: '20px 40px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  animation: 'fadeIn 0.5s ease-out',
                  maxWidth: '800px',
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
              accentColor={accentColor}
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
              accentColor={accentColor}
            />
          </div>
        </AbsoluteFill>
      )}

      {/* Outro CTA Scene (Last 4 seconds) */}
      {isCtaActive && (
        <Sequence from={ctaStartFrame}>
          {(() => {
            const ctaFrame = frame - ctaStartFrame;
            const ctaSpr = spring({
              frame: ctaFrame,
              fps,
              config: { damping: 12 },
            });
            const ctaScale = interpolate(ctaSpr, [0, 1], [0.8, 1]);
            const ctaOpacity = interpolate(ctaSpr, [0, 1], [0, 1]);

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0 100px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    borderRadius: '24px',
                    padding: '60px 40px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    opacity: ctaOpacity,
                    transform: `scale(${ctaScale})`,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: fontFamilies.serif,
                      fontSize: '56px',
                      color: '#FFFFFF',
                      marginBottom: '20px',
                    }}
                  >
                    Want More Answers?
                  </h2>
                  <p
                    style={{
                      fontFamily: fontFamilies.sans,
                      fontSize: '36px',
                      color: accentColor,
                      fontWeight: 600,
                      marginBottom: '40px',
                    }}
                  >
                    {ctaText}
                  </p>
                  <div
                    style={{
                      fontFamily: fontFamilies.sans,
                      fontSize: '28px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}
                  >
                    {domain} Tips
                  </div>
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>
      )}

      {/* Progress Bar (Visible throughout) */}
      <ProgressBar accentColor={accentColor} />

      {/* Audio Playback starting at frame 90 */}
      {frame >= AUDIO_START_FRAME && (
        <Audio src={resolvedAudioUrl} volume={audioVolume} />
      )}
    </AbsoluteFill>
  );
};

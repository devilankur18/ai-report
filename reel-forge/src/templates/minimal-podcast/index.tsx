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
import { AudioWaveform } from '../_shared/AudioWaveform';

export const MinimalPodcastTemplate: React.FC<GlobalProps> = ({
  audioUrl,
  expertName,
  expertSpecialty,
  domain,
  scenes,
  ctaText,
  accentColor = '#00F5D4', // Neon teal
  bgSolid = '#0A0A0A',
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

  const INTRO_DURATION = 60; // 2 seconds
  const OUTRO_DURATION = 120; // 4 seconds
  const AUDIO_START_FRAME = INTRO_DURATION;

  // 1. Typewriter Intro Scene (0s to 2s)
  const introText = `${expertName.toUpperCase()}  |  ${expertSpecialty.toUpperCase()}`;
  const visibleCharsCount = Math.floor(
    interpolate(frame, [0, 45], [0, introText.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const typedText = introText.substring(0, visibleCharsCount);

  // 2. Active Scene & Quotes Timing (from 2s onwards)
  const audioCurrentSec = Math.max(0, (frame - AUDIO_START_FRAME) / fps);
  const activeScene = scenes.find(
    (s) => audioCurrentSec >= s.startSec && audioCurrentSec < s.endSec
  );

  const ctaStartFrame = durationInFrames - OUTRO_DURATION;
  const isCtaActive = frame >= ctaStartFrame;

  // Interpolate opacity to fade out the waveform and quotes during CTA
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

  return (
    <AbsoluteFill style={{ backgroundColor: bgSolid }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <SafeZone show={false} />

      {/* Intro Typewriter Scene (0s to 2s) */}
      {frame < INTRO_DURATION && (
        <AbsoluteFill
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 60px',
          }}
        >
          <div
            style={{
              fontFamily: fontFamilies.sans,
              fontSize: '32px',
              fontWeight: 500,
              color: '#FFFFFF',
              letterSpacing: '3px',
              borderRight: frame % 15 < 8 ? '3px solid #FFFFFF' : '3px solid transparent',
              paddingRight: '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {typedText}
          </div>
        </AbsoluteFill>
      )}

      {/* Main Podcast Player UI (from 2s onwards) */}
      {frame >= AUDIO_START_FRAME && (
        <AbsoluteFill style={{ opacity: mainContentOpacity }}>
          {/* Centered Radial Waveform */}
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <AudioWaveform
              audioUrl={resolvedAudioUrl}
              accentColor={accentColor}
              mode="radial"
              numberOfBars={64}
            />
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
                key={activeScene.label} // Re-renders component triggers animation reset
                style={{
                  fontFamily: fontFamilies.sans,
                  fontSize: '38px',
                  fontWeight: 400,
                  color: '#E0E0E0',
                  lineHeight: 1.5,
                  letterSpacing: '0.5px',
                  animation: 'fadeIn 0.6s ease-out',
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
                fontFamily: fontFamilies.sans,
                fontSize: '28px',
                fontWeight: 700,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '4px',
              }}
            >
              {expertName}
            </div>
            <div
              style={{
                fontFamily: fontFamilies.sans,
                fontSize: '18px',
                fontWeight: 500,
                color: '#888888',
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
          {(() => {
            const ctaFrame = frame - ctaStartFrame;
            const spr = spring({
              frame: ctaFrame,
              fps,
              config: { damping: 15 },
            });
            const ctaOpacity = interpolate(spr, [0, 1], [0, 1]);
            const ctaScale = interpolate(spr, [0, 1], [0.9, 1]);

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0 80px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    opacity: ctaOpacity,
                    transform: `scale(${ctaScale})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {/* Glowing neon headphones icon */}
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      border: `3px solid ${accentColor}`,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: '40px',
                      boxShadow: `0 0 20px ${accentColor}`,
                    }}
                  >
                    <span style={{ fontSize: '48px' }}>🎧</span>
                  </div>
                  
                  <h3
                    style={{
                      fontFamily: fontFamilies.sans,
                      fontSize: '52px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '2px',
                      marginBottom: '20px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Listen to Full Clip
                  </h3>
                  <p
                    style={{
                      fontFamily: fontFamilies.sans,
                      fontSize: '32px',
                      color: '#AAAAAA',
                      lineHeight: 1.4,
                      maxWidth: '600px',
                      marginBottom: '50px',
                    }}
                  >
                    {ctaText}
                  </p>
                  
                  <div
                    style={{
                      fontFamily: fontFamilies.sans,
                      fontSize: '22px',
                      color: accentColor,
                      letterSpacing: '5px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {domain}
                  </div>
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>
      )}

      {/* Thin minimalist progress bar */}
      <ProgressBar accentColor={accentColor} />

      {/* Audio Playback starting at frame 60 */}
      {frame >= AUDIO_START_FRAME && (
        <Audio src={resolvedAudioUrl} volume={audioVolume} />
      )}
    </AbsoluteFill>
  );
};

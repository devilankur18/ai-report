import React from 'react';
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// Helper to resolve static/web assets
const resolveUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/') || url.startsWith('file:')) {
    return url;
  }
  return staticFile(url);
};

// ── Custom ReactBits / RemotionBits Inspired Animation Components ───────

// 1. TextScramble / DecryptedText Effect
const TextScramble: React.FC<{
  text: string;
  triggerFrame: number;
  durationFrames?: number;
}> = ({ text, triggerFrame, durationFrames = 15 }) => {
  const frame = useCurrentFrame();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*!?';
  
  const currentText = React.useMemo(() => {
    if (frame < triggerFrame) return '';
    const progress = Math.min(1, (frame - triggerFrame) / durationFrames);
    if (progress === 1) return text;
    
    const revealCount = Math.floor(text.length * progress);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      if (i < revealCount) {
        result += text[i];
      } else {
        const randChar = chars[Math.floor(Math.random() * chars.length)];
        result += randChar;
      }
    }
    return result;
  }, [frame, text, triggerFrame, durationFrames]);

  return <span>{currentText}</span>;
};

// 2. ShinyText Sweep Effect
const ShinyText: React.FC<{
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string | number;
  letterSpacing?: string;
  style?: React.CSSProperties;
}> = ({ text, fontFamily, fontSize, fontWeight, letterSpacing, style }) => {
  const frame = useCurrentFrame();
  const shimmerPos = interpolate(frame % 75, [0, 75], [-150, 350]);
  
  return (
    <span style={{
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0.4) 25%, #FFFFFF 50%, rgba(255,255,255,0.4) 75%)`,
      backgroundSize: '250px 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `${shimmerPos}px 0`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      ...style,
    }}>
      {text}
    </span>
  );
};

// 3. SplitWordReveal (inspired by SplitText reveal)
const SplitWordReveal: React.FC<{
  word: string;
  delayFrames: number;
  accentColor: string;
  isActive: boolean;
  fonts: { sans: string };
  totalWords: number;
  idx: number;
}> = ({ word, delayFrames, accentColor, isActive, fonts, totalWords, idx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const wordSpr = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  
  const translateY = interpolate(wordSpr, [0, 1], [110, 0]);
  const opacity = interpolate(wordSpr, [0, 1], [0, 1]);
  
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', padding: '0 4px', verticalAlign: 'bottom' }}>
      <span style={{
        display: 'inline-block',
        transform: `translateY(${translateY}px)`,
        opacity,
        fontFamily: fonts.sans,
        fontSize: '76px',
        fontWeight: 900,
        textTransform: 'uppercase',
        color: isActive ? accentColor : '#FFFFFF',
        textShadow: isActive 
          ? `0 0 25px ${accentColor}, 0 4px 10px rgba(0,0,0,0.6)` 
          : '0 4px 20px rgba(0,0,0,0.8)',
        letterSpacing: '-1.5px',
        transition: 'color 0.15s ease',
      }}>
        {word}
      </span>
    </span>
  );
};

// ── EHR Case File Reveal Style ──────────────────────────────────────────
export const EHRFileHook: React.FC<{
  doctorPhoto?: string;
  doctorName: string;
  doctorTitle: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, doctorName, doctorTitle, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow Ken Burns zoom & Y translation on desaturated background
  const scale = interpolate(frame, [0, 150], [1.02, 1.10], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -20], { extrapolateRight: 'clamp' });

  // Photo fade in entry
  const photoSpr = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const photoOpacity = interpolate(photoSpr, [0, 1], [0, 1]);

  // Alert flashing (frames 10 to 45, 3 times)
  const isAlertVisible = frame >= 10 && frame <= 45 ? Math.floor((frame - 10) / 6) % 2 === 0 : false;

  // Split words for text slam
  const hookWords = hookText.split(' ');
  const chunkLength = Math.ceil(hookWords.length / 3);
  const line1 = hookWords.slice(0, chunkLength).join(' ');
  const line2 = hookWords.slice(chunkLength, chunkLength * 2).join(' ');
  const line3 = hookWords.slice(chunkLength * 2).join(' ');

  const spr1 = spring({ frame: frame - 20, fps, config: { damping: 11, stiffness: 140 } });
  const spr2 = spring({ frame: frame - 32, fps, config: { damping: 11, stiffness: 140 } });
  const spr3 = spring({ frame: frame - 44, fps, config: { damping: 11, stiffness: 140 } });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#07080f' }}>
      {/* Background desaturated photo */}
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(1) brightness(0.25) contrast(1.1)',
          opacity: photoOpacity,
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Cyber grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(0, 229, 255, 0.05) 1.5px, transparent 1.5px)',
        backgroundSize: '50px 50px',
        zIndex: 1,
      }} />

      {/* Top clean dashboard bar */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '80px',
        right: '80px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1.5px solid rgba(255, 255, 255, 0.15)',
        paddingBottom: '16px',
        zIndex: 5,
      }}>
        <ShinyText 
          text="CLINICAL ANALYTICS // DIAGNOSTIC BRIEF" 
          fontFamily={fonts.sans} 
          fontSize="20px" 
          fontWeight={800} 
          letterSpacing="3px" 
        />
        {isAlertVisible && (
          <div style={{
            backgroundColor: '#FF3B30',
            color: '#FFF',
            padding: '6px 14px',
            borderRadius: '6px',
            fontFamily: fonts.sans,
            fontSize: '16px',
            fontWeight: 900,
            boxShadow: '0 0 15px rgba(255, 59, 48, 0.5)',
          }}>
            ⚠️ STATUS CRITICAL
          </div>
        )}
      </div>

      {/* Sidebar telemetry */}
      <div style={{
        position: 'absolute',
        top: '180px',
        left: '80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'Courier New, Courier, monospace',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#00FF66',
        zIndex: 5,
        textShadow: '0 0 5px rgba(0,255,102,0.3)',
      }}>
        <div>
          <TextScramble text="PATIENT ID: #9842" triggerFrame={8} />
        </div>
        <div style={{ color: frame >= 18 ? '#FF3B30' : '#00FF66', textShadow: frame >= 18 ? '0 0 8px rgba(255,59,48,0.4)' : 'none' }}>
          <TextScramble text="STATUS: UNSTABLE" triggerFrame={18} />
        </div>
        <div>
          <TextScramble text="DIAGNOSIS: CRITICAL" triggerFrame={28} />
        </div>
      </div>

      {/* Main Big Hook Text Slam */}
      <div style={{
        position: 'absolute',
        left: '80px',
        right: '80px',
        bottom: '220px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'left',
        zIndex: 5,
      }}>
        {line1 && (
          <div style={{
            fontFamily: fonts.serif,
            fontSize: '70px',
            fontWeight: 900,
            color: '#FFFFFF',
            opacity: interpolate(spr1, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(spr1, [0, 1], [40, 0])}px)`,
            lineHeight: 1.15,
            textShadow: '0 4px 20px rgba(0,0,0,0.85)',
          }}>
            {line1}
          </div>
        )}
        {line2 && (
          <div style={{
            fontFamily: fonts.serif,
            fontSize: '70px',
            fontWeight: 900,
            color: '#FFFFFF',
            opacity: interpolate(spr2, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(spr2, [0, 1], [40, 0])}px)`,
            lineHeight: 1.15,
            textShadow: '0 4px 20px rgba(0,0,0,0.85)',
          }}>
            {line2}
          </div>
        )}
        {line3 && (
          <div style={{
            fontFamily: fonts.serif,
            fontSize: '70px',
            fontWeight: 900,
            color: accentColor,
            opacity: interpolate(spr3, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(spr3, [0, 1], [40, 0])}px)`,
            lineHeight: 1.15,
            textShadow: `0 0 20px ${accentColor}40, 0 4px 20px rgba(0,0,0,0.85)`,
          }}>
            {line3}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Cinematic Parallax with Vector Overlays Style ─────────────────────
export const ParallaxHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns zoom & slow pan
  const scale = interpolate(frame, [0, 150], [1.02, 1.10], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -30], { extrapolateRight: 'clamp' });

  // Heartbeat wave animation (moving SVG stroke)
  const dashoffset = interpolate(frame, [0, 150], [1200, 0], { extrapolateRight: 'clamp' });

  const words = hookText.split(' ');

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#050508' }}>
      {/* Background Parallax Doctor Photo */}
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Subtle vignette/scrim to make text legible */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, transparent 20%, rgba(0,0,0,0.85) 100%)',
          }} />
        </div>
      )}

      {/* SVG Cardiac Waveform in the lower third */}
      <svg
        style={{
          position: 'absolute',
          bottom: '340px',
          left: 0,
          width: '1080px',
          height: '240px',
          opacity: 0.75,
        }}
        viewBox="0 0 1080 240"
      >
        <path
          d="M 0,120 L 320,120 L 340,120 L 350,40 L 365,200 L 380,120 L 400,120 L 410,140 L 420,120 L 720,120 L 740,40 L 755,200 L 770,120 L 1080,120"
          fill="none"
          stroke={accentColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1200"
          strokeDashoffset={dashoffset}
          style={{
            filter: `drop-shadow(0 0 12px ${accentColor})`,
          }}
        />
      </svg>

      {/* Giant bold typography centered */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px 24px',
          width: '100%',
        }}>
          {words.map((w, idx) => {
            // Pseudo-timing for word active status
            const activeWordIndex = Math.floor(interpolate(frame, [10, 110], [0, words.length], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }));
            const isActive = activeWordIndex === idx;
            const delayFrames = idx * (80 / words.length);

            return (
              <SplitWordReveal
                key={idx}
                word={w}
                delayFrames={delayFrames}
                accentColor={accentColor}
                isActive={isActive}
                fonts={fonts}
                totalWords={words.length}
                idx={idx}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 4. RedactBox sliding reveal animation
const RedactBox: React.FC<{
  revealFrame: number;
}> = ({ revealFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - revealFrame,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const scaleX = interpolate(spr, [0, 1], [1.05, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = interpolate(spr, [0, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const translateX = interpolate(spr, [0, 1], [0, 60], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (frame >= revealFrame + 30) return null;

  return (
    <span style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: '#111',
      borderRadius: '4px',
      transform: `scaleY(1.15) scaleX(${scaleX}) translateX(${translateX}px)`,
      transformOrigin: 'left center',
      opacity,
      pointerEvents: 'none',
    }} />
  );
};

// ── Redacted Document Override Style ────────────────────────────────────
export const RedactedHook: React.FC<{
  doctorPhoto?: string;
  doctorAvatar?: string;
  doctorName: string;
  doctorTitle: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, doctorAvatar, doctorName, doctorTitle, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screen shake calculation on frame redaction reveals
  const getShakeOffset = () => {
    if (frame >= 15 && frame <= 19) {
      const offsets = [8, -8, 4, -4, 0];
      return offsets[(frame - 15) % offsets.length];
    }
    if (frame >= 35 && frame <= 39) {
      const offsets = [-8, 8, -4, 4, 0];
      return offsets[(frame - 35) % offsets.length];
    }
    return 0;
  };
  const shakeX = getShakeOffset();

  const scale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const photoY = interpolate(frame, [0, 150], [0, -15], { extrapolateRight: 'clamp' });

  // Live status green dot pulse
  const dotOpacity = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.3, 1.0]);

  const words = hookText.split(' ');
  const redactIndices = [3, 6];

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0a0a0c',
      transform: `translateX(${shakeX}px)`,
      overflow: 'hidden',
    }}>
      {/* Background desaturated photo */}
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${photoY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(1) brightness(0.65) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Semi-translucent paper overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(245, 244, 239, 0.84)',
        backgroundImage: 'radial-gradient(#d3d2cb 1.5px, transparent 1.5px)',
        backgroundSize: '30px 30px',
        backdropFilter: 'blur(8px)',
        zIndex: 1,
      }} />

      {/* Sheet Content container */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* Document Header stamp */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '80px',
          right: '80px',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '2.5px solid #111',
          paddingBottom: '16px',
          fontFamily: 'Courier New, Courier, monospace',
          color: '#111',
          fontSize: '22px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}>
          <span>INTERNAL USE ONLY // DO NOT DISTRIBUTE</span>
          <span>CODE: #794-QNA</span>
        </div>

        {/* Verified Expert Badge */}
        <div style={{
          position: 'absolute',
          top: '160px',
          left: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '40px',
          border: '2px solid #111',
          boxShadow: '0 8px 0 #111',
        }}>
          {doctorAvatar && (
            <img
              src={resolveUrl(doctorAvatar)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #111' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: fonts.sans, fontSize: '20px', fontWeight: 900, color: '#111' }}>{doctorName}</span>
            <span style={{ fontFamily: fonts.sans, fontSize: '15px', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {doctorTitle}
            </span>
          </div>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#00FF66',
            border: '1.5px solid #111',
            marginLeft: '8px',
            opacity: dotOpacity,
          }} />
        </div>

        {/* Redacted Journal Text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 100px',
          marginTop: '120px',
        }}>
          <div style={{
            fontFamily: fonts.serif,
            fontSize: '60px',
            fontWeight: 800,
            color: '#111',
            lineHeight: 1.45,
            textAlign: 'left',
          }}>
            {words.map((w, idx) => {
              const isRedacted = redactIndices.includes(idx);
              const revealFrame = idx === redactIndices[0] ? 15 : 35;
              const isRevealed = frame >= revealFrame;

              if (isRedacted) {
                return (
                  <span key={idx} style={{ position: 'relative', marginRight: '16px', display: 'inline-block' }}>
                    <span style={{ opacity: isRevealed ? 1 : 0, color: '#FF3B30', textTransform: 'uppercase', fontWeight: 900 }}>
                      {w}
                    </span>
                    <RedactBox revealFrame={revealFrame} />
                  </span>
                );
              }

              return (
                <span key={idx} style={{ marginRight: '16px', display: 'inline-block' }}>
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Typewriter Terminal Style ───────────────────────────────────────────
export const TypewriterTerminalHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -20], { extrapolateRight: 'clamp' });

  // Typewriter parameters: 0.6 characters per frame
  const charsPerFrame = 0.6;
  const currentLen = Math.min(hookText.length, Math.floor(frame * charsPerFrame));
  const visibleText = hookText.slice(0, currentLen);
  const isDone = currentLen >= hookText.length;
  const cursorBlink = Math.floor(frame / 6) % 2 === 0;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#030408' }}>
      {/* Background desaturated photo */}
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(1) brightness(0.2) contrast(1.2)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Cyber scanline/grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(0, 229, 255, 0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 1,
      }} />

      {/* Terminal Interface Stamp */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '80px',
        right: '80px',
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 255, 102, 0.3)',
        paddingBottom: '16px',
        fontFamily: 'Courier New, Courier, monospace',
        color: '#00FF66',
        fontSize: '20px',
        letterSpacing: '2px',
        zIndex: 2,
        opacity: 0.8,
      }}>
        <span>SYS_LOG // INTERRUPT_SEQ</span>
        <span>SECURE_CONN_ESTABLISHED</span>
      </div>

      {/* Terminal typing text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 100px',
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '56px',
          fontWeight: 'bold',
          color: '#00FF66',
          lineHeight: 1.4,
          textAlign: 'left',
          textShadow: '0 0 10px rgba(0,255,102,0.5), 0 0 20px rgba(0,255,102,0.2)',
          width: '100%',
        }}>
          {visibleText}
          {(!isDone || cursorBlink) && (
            <span style={{
              display: 'inline-block',
              width: '30px',
              height: '56px',
              backgroundColor: '#00FF66',
              verticalAlign: 'middle',
              marginLeft: '8px',
              boxShadow: '0 0 8px #00FF66',
            }} />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Typewriter Word Pop Style ───────────────────────────────────────────
export const TypewriterWordPopHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -20], { extrapolateRight: 'clamp' });

  const words = hookText.split(' ');
  const wordDelay = 8;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#050508' }}>
      {/* Background desaturated photo */}
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(1) brightness(0.25) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `${accentColor}10`,
          }} />
        </div>
      )}

      {/* Main typography container */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px 24px',
          width: '100%',
        }}>
          {words.map((w, idx) => {
            const startFrame = idx * wordDelay;
            
            const wordSpr = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 10, stiffness: 130 },
            });

            if (frame < startFrame) return null;

            const scaleVal = interpolate(wordSpr, [0, 1], [0.4, 1.0]);
            const opacityVal = interpolate(wordSpr, [0, 1], [0, 1]);
            const yOffset = interpolate(wordSpr, [0, 1], [40, 0]);

            const isLatest = frame >= startFrame && frame < startFrame + wordDelay;
            const wordColor = isLatest ? accentColor : '#FFFFFF';
            const wordShadow = isLatest 
              ? `0 0 25px ${accentColor}, 0 4px 10px rgba(0,0,0,0.6)` 
              : '0 4px 20px rgba(0,0,0,0.8)';

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  transform: `scale(${scaleVal}) translateY(${yOffset}px)`,
                  opacity: opacityVal,
                  fontFamily: fonts.sans,
                  fontSize: '70px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: wordColor,
                  textShadow: wordShadow,
                  letterSpacing: '-1.5px',
                  transition: 'color 0.15s ease',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Typewriter Staggered Slide Style ────────────────────────────────────
export const TypewriterStaggeredSlideHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -20], { extrapolateRight: 'clamp' });

  const words = hookText.split(' ');
  const wordDelay = 4;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#040508' }}>
      {/* Background desaturated photo */}
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(1) brightness(0.24) contrast(1.15)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        zIndex: 1,
      }} />

      {/* Sleek top category badge */}
      <div style={{
        position: 'absolute',
        top: '90px',
        left: '90px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 2,
      }}>
        <div style={{
          width: '8px',
          height: '24px',
          backgroundColor: accentColor,
          borderRadius: '2px',
          boxShadow: `0 0 10px ${accentColor}`,
        }} />
        <span style={{
          fontFamily: fonts.sans,
          fontSize: '20px',
          fontWeight: 800,
          color: '#FFF',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>
          DIAGNOSTIC REVELATION
        </span>
      </div>

      {/* Main text box */}
      <div style={{
        position: 'absolute',
        left: '90px',
        right: '90px',
        bottom: '240px',
        zIndex: 2,
        textAlign: 'left',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 18px',
        }}>
          {words.map((w, idx) => {
            const startFrame = idx * wordDelay;
            const spr = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 14, stiffness: 150 },
            });

            const y = interpolate(spr, [0, 1], [80, 0]);
            const opacity = interpolate(spr, [0, 1], [0, 1]);

            const isHighlight = idx >= words.length - 3;

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  height: '90px',
                  lineHeight: '90px',
                  verticalAlign: 'bottom',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${y}px)`,
                    opacity,
                    fontFamily: fonts.sans,
                    fontSize: '68px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: isHighlight ? accentColor : '#FFFFFF',
                    textShadow: isHighlight 
                      ? `0 0 20px ${accentColor}30, 0 4px 15px rgba(0,0,0,0.6)`
                      : '0 4px 15px rgba(0,0,0,0.7)',
                    letterSpacing: '-1px',
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── The Preview Gallery Compositions ───────────────────────────────────
export const EhrFileHookPreview: React.FC = () => {
  return (
    <EHRFileHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      doctorName="Dr. Priya Sharma"
      doctorTitle="Dermatologist"
      hookText="This ECG pattern looks normal. It isn't. And missing it will cost a malpractice claim."
      accentColor="#FFDF00"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const ParallaxHookPreview: React.FC = () => {
  return (
    <ParallaxHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Why the newest guidelines are causing massive friction in private practice."
      accentColor="#00E5FF"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const RedactedHookPreview: React.FC = () => {
  return (
    <RedactedHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      doctorAvatar="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      doctorName="Dr. Priya Sharma"
      doctorTitle="Dermatologist"
      hookText="What private clinics [REDACTED] don’t want you to know about insurance payouts."
      accentColor="#FF3B30"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const TypewriterTerminalHookPreview: React.FC = () => {
  return (
    <TypewriterTerminalHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="SYS_ERR: Missing this ECG indicator will cost you a malpractice claim."
      accentColor="#00FF66"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const TypewriterWordPopHookPreview: React.FC = () => {
  return (
    <TypewriterWordPopHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="YOUR SKIN REGENERATES EVERY 28 DAYS. HERE IS WHY THAT MATTERS."
      accentColor="#FFDF00"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const TypewriterStaggeredSlideHookPreview: React.FC = () => {
  return (
    <TypewriterStaggeredSlideHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="The hidden guideline change causing massive friction in private practice."
      accentColor="#00E5FF"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

// ── 1. Card Stack Fracture Hook ──────────────────────────────────────────
export const CardStackFractureHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const scale = interpolate(frame, [0, 150], [1.02, 1.10], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -20], { extrapolateRight: 'clamp' });

  const dX = interpolate(spr, [0, 1], [0, 400]);
  const dY = interpolate(spr, [0, 1], [0, 450]);
  const opacity = interpolate(spr, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#05060a' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(0.6) brightness(0.4) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 1,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute',
          width: '450px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #000',
          borderRadius: '12px 0 0 0',
          top: 'calc(50% - 300px)',
          left: 'calc(50% - 450px)',
          transform: `translateX(${-dX}px) translateY(${-dY}px) rotate(${-spr * 15}deg)`,
          opacity,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '40px', fontFamily: fonts.sans, fontSize: '32px', fontWeight: 'bold', color: '#111' }}>
            CASE NOTE // #941
          </div>
        </div>

        <div style={{
          position: 'absolute',
          width: '450px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #000',
          borderRadius: '0 12px 0 0',
          top: 'calc(50% - 300px)',
          left: '50%',
          transform: `translateX(${dX}px) translateY(${-dY}px) rotate(${spr * 15}deg)`,
          opacity,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '40px', fontFamily: fonts.sans, fontSize: '32px', fontWeight: 'bold', color: '#111', textAlign: 'right' }}>
            CLASSIFIED
          </div>
        </div>

        <div style={{
          position: 'absolute',
          width: '450px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #000',
          borderRadius: '0 0 0 12px',
          top: '50%',
          left: 'calc(50% - 450px)',
          transform: `translateX(${-dX}px) translateY(${dY}px) rotate(${-spr * 10}deg)`,
          opacity,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '40px', fontFamily: fonts.serif, fontSize: '28px', color: '#555', fontStyle: 'italic' }}>
            "Patient report shows abnormal readings..."
          </div>
        </div>

        <div style={{
          position: 'absolute',
          width: '450px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #000',
          borderRadius: '0 0 12px 0',
          top: '50%',
          left: '50%',
          transform: `translateX(${dX}px) translateY(${dY}px) rotate(${spr * 10}deg)`,
          opacity,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '40px', fontFamily: fonts.sans, fontSize: '30px', fontWeight: 'bold', color: '#FF3B30' }}>
            WARNING: READ IMMEDIATELY
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
        zIndex: 3,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: fonts.sans,
          fontSize: '72px',
          fontWeight: 900,
          color: '#FFF',
          lineHeight: 1.25,
          opacity: spr,
          transform: `scale(${interpolate(spr, [0, 1], [0.85, 1])})`,
          textShadow: '0 4px 30px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
        }}>
          {hookText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 2. Blur In Diagnostic Hook ───────────────────────────────────────────
export const BlurInDiagnosticHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const photoSpr = spring({
    frame: frame - 15,
    fps,
    config: { damping: 16, stiffness: 100 },
  });
  const photoBlur = interpolate(photoSpr, [0, 1], [25, 0]);
  const photoScale = interpolate(frame, [0, 150], [1.02, 1.10], { extrapolateRight: 'clamp' });
  const photoY = interpolate(frame, [0, 150], [0, -15], { extrapolateRight: 'clamp' });

  const words = hookText.split(' ');
  const wordDelay = 6;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#020306' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${photoScale}) translateY(${photoY}px)`,
          transformOrigin: 'center 20%',
          filter: `grayscale(0.5) brightness(0.35) blur(${photoBlur}px)`,
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px)',
        backgroundSize: '100% 100px',
        zIndex: 1,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        textAlign: 'center',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px 18px',
          width: '100%',
        }}>
          {words.map((w, idx) => {
            const startFrame = idx * wordDelay;
            const wordSpr = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 12, stiffness: 120 },
            });

            if (frame < startFrame) return null;

            const blurVal = interpolate(wordSpr, [0, 1], [20, 0]);
            const yVal = interpolate(wordSpr, [0, 1], [40, 0]);
            const opacityVal = interpolate(wordSpr, [0, 1], [0, 1]);

            const isLastThree = idx >= words.length - 3;
            const color = isLastThree ? accentColor : '#FFFFFF';

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  transform: `translateY(${yVal}px)`,
                  opacity: opacityVal,
                  filter: `blur(${blurVal}px)`,
                  fontFamily: fonts.sans,
                  fontSize: '70px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  letterSpacing: '-1.5px',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 3. Parallax Waveform Hook ───────────────────────────────────────────
export const ParallaxWaveformHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 150], [1.02, 1.12], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -25], { extrapolateRight: 'clamp' });

  const generateSimulatedWave = (f: number) => {
    let path = 'M 0,80 ';
    const pointsCount = 40;
    const width = 1080;
    const step = width / pointsCount;
    
    for (let i = 0; i <= pointsCount; i++) {
      const x = i * step;
      const wave = Math.sin(i * 0.4 + f * 0.15) * Math.cos(i * 0.1 - f * 0.08);
      const edgeFactor = Math.sin((i / pointsCount) * Math.PI);
      const amplitude = 60 * wave * edgeFactor;
      const y = 80 + amplitude;
      path += `L ${x},${y} `;
    }
    return path;
  };

  const wavePath = generateSimulatedWave(frame);
  const words = hookText.split(' ');

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#020204' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(0.4) brightness(0.32) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '260px',
        left: 0,
        width: '1080px',
        height: '160px',
        zIndex: 2,
      }}>
        <svg viewBox="0 0 1080 160" style={{ width: '100%', height: '100%' }}>
          <path
            d={wavePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="5"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${accentColor}80)`,
              opacity: 0.85,
            }}
          />
        </svg>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        textAlign: 'center',
        zIndex: 3,
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '14px 20px',
          width: '100%',
        }}>
          {words.map((w, idx) => {
            const delay = idx * (60 / words.length);
            const spr = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 120 },
            });

            if (frame < delay) return null;

            const yVal = interpolate(spr, [0, 1], [30, 0]);
            const opacityVal = interpolate(spr, [0, 1], [0, 1]);

            const activeIdx = Math.floor(interpolate(frame, [10, 120], [0, words.length], { extrapolateRight: 'clamp' }));
            const isActive = idx === activeIdx;

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  transform: `translateY(${yVal}px)`,
                  opacity: opacityVal,
                  fontFamily: fonts.sans,
                  fontSize: '72px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: isActive ? accentColor : '#FFFFFF',
                  textShadow: isActive 
                    ? `0 0 25px ${accentColor}, 0 4px 10px rgba(0,0,0,0.6)` 
                    : '0 4px 15px rgba(0,0,0,0.8)',
                  transition: 'color 0.15s ease',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 4. Glitch Cycle Alert Hook ───────────────────────────────────────────
export const GlitchCycleAlertHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 150], [1.02, 1.10], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -15], { extrapolateRight: 'clamp' });

  const glitchCycles = [
    'PATIENT RECORD STABLE',
    'DIAGNOSTIC CRITICAL_ERR',
    'MISDIAGNOSIS EXPOSURE',
    'CRITICAL SYSTEM RISK',
  ];
  
  const isGlitching = frame < 30;
  const currentGlitchText = isGlitching 
    ? glitchCycles[Math.floor(frame / 6) % glitchCycles.length]
    : hookText.toUpperCase();

  const getGlitchStyle = (): React.CSSProperties => {
    if (!isGlitching) return { color: '#FF3B30', textShadow: '0 0 20px rgba(255,59,48,0.4), 0 4px 15px rgba(0,0,0,0.8)' };
    
    const shakeX = Math.floor(Math.sin(frame) * 12);
    const skewX = Math.floor(Math.cos(frame * 1.5) * 8);
    const color = frame % 3 === 0 ? accentColor : '#FF3B30';
    
    return {
      transform: `translateX(${shakeX}px) skewX(${skewX}deg)`,
      color,
      textShadow: `2px -1px 0 #00FF66, -2px 2px 0 #FF3B30`,
    };
  };

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#050204' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: isGlitching && frame % 4 === 0 
            ? 'grayscale(1) brightness(0.4) contrast(1.5)' 
            : 'grayscale(0.7) brightness(0.28) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {isGlitching && frame % 8 < 3 && (
        <div style={{
          position: 'absolute',
          top: `${Math.random() * 80}%`,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(255, 59, 48, 0.25)',
          backdropFilter: 'invert(1)',
          zIndex: 1,
        }} />
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        textAlign: 'center',
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          color: '#FFF',
          marginBottom: '30px',
          border: '1.5px solid #FF3B30',
          padding: '8px 20px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,59,48,0.1)',
          opacity: frame % 6 < 4 ? 1 : 0.4,
        }}>
          ⚠️ SYSTEM INTERRUPT ⚠️
        </div>

        <div style={{
          fontFamily: fonts.sans,
          fontSize: '70px',
          fontWeight: 900,
          lineHeight: 1.25,
          width: '100%',
          ...getGlitchStyle(),
        }}>
          {currentGlitchText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 5. Mosaic Reframe Hook ──────────────────────────────────────────────
export const MosaicReframeHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gridSpr = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const overlayOpacity = interpolate(gridSpr, [0, 1], [0.8, 0.45]);

  const tiles = [
    { id: 1, clipPath: 'inset(0% 50% 66.6% 0%)', dx: -200, dy: -250 },
    { id: 2, clipPath: 'inset(0% 0% 66.6% 50%)', dx: 200, dy: -250 },
    { id: 3, clipPath: 'inset(33.3% 50% 33.3% 0%)', dx: -300, dy: 0 },
    { id: 4, clipPath: 'inset(33.3% 0% 33.3% 50%)', dx: 300, dy: 0 },
    { id: 5, clipPath: 'inset(66.6% 50% 0% 0%)', dx: -200, dy: 250 },
    { id: 6, clipPath: 'inset(66.6% 0% 0% 50%)', dx: 200, dy: 250 },
  ];

  const scale = interpolate(frame, [0, 150], [1.02, 1.10], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -10], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#020205' }}>
      {doctorPhoto && tiles.map((t, idx) => {
        const tileSpr = spring({
          frame: frame - (idx * 2),
          fps,
          config: { damping: 14, stiffness: 110 },
        });

        const curX = interpolate(tileSpr, [0, 1], [t.dx, 0]);
        const curY = interpolate(tileSpr, [0, 1], [t.dy, 0]);

        return (
          <div
            key={t.id}
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${scale}) translateY(${translateY}px) translate(${curX}px, ${curY}px)`,
              transformOrigin: 'center 20%',
              clipPath: t.clipPath,
              opacity,
              filter: 'grayscale(0.4) brightness(0.35) contrast(1.15)',
            }}
          >
            <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        );
      })}

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: `rgba(10, 15, 30, ${overlayOpacity})`,
        backgroundImage: 'radial-gradient(circle, rgba(0, 229, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        zIndex: 1,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: fonts.sans,
          fontSize: '72px',
          fontWeight: 900,
          color: '#FFF',
          lineHeight: 1.25,
          opacity: gridSpr,
          transform: `scale(${interpolate(gridSpr, [0, 1], [0.88, 1])})`,
          textShadow: '0 4px 25px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
        }}>
          {hookText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 6. EHR Variable Typewriter Hook ──────────────────────────────────────
export const EhrVariableTypewriterHook: React.FC<{
  doctorPhoto?: string;
  doctorAvatar?: string;
  doctorName: string;
  doctorTitle: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, doctorAvatar, doctorName, doctorTitle, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const getTypingProgress = (f: number, txt: string) => {
    let charsTyped = 0;
    let currentFrame = 0;
    while (currentFrame <= f && charsTyped < txt.length) {
      const char = txt[charsTyped];
      let delay = 1.2;
      if (char === ' ' || char === ',' || char === '.') {
        delay = 4.5;
      }
      currentFrame += delay;
      if (currentFrame <= f) {
        charsTyped++;
      }
    }
    return charsTyped;
  };

  const currentLen = getTypingProgress(frame - 15, hookText);
  const visibleText = hookText.slice(0, currentLen);
  const isDone = currentLen >= hookText.length;
  const cursorBlink = Math.floor(frame / 6) % 2 === 0;

  const bgScale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const bgY = interpolate(frame, [0, 150], [0, -15], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#05070d' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${bgScale}) translateY(${bgY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(1) brightness(0.18) contrast(1.2)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(0, 255, 102, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.01) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        zIndex: 1,
      }} />

      <div style={{
        position: 'absolute',
        top: '80px',
        right: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 2,
      }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: fonts.sans, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>{doctorName}</div>
          <div style={{ fontFamily: fonts.sans, fontSize: '15px', fontWeight: 700, color: accentColor, textTransform: 'uppercase' }}>{doctorTitle}</div>
        </div>
        {doctorAvatar && (
          <img
            src={resolveUrl(doctorAvatar)}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${accentColor}`,
              boxShadow: `0 0 15px ${accentColor}50`,
            }}
          />
        )}
      </div>

      <div style={{
        position: 'absolute',
        left: '80px',
        right: '80px',
        top: '200px',
        bottom: '220px',
        backgroundColor: 'rgba(10, 16, 26, 0.85)',
        border: '1.5px solid rgba(0, 255, 102, 0.25)',
        borderRadius: '16px',
        padding: '50px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2,
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '18px',
          color: accentColor,
          marginBottom: '30px',
          borderBottom: '1px solid rgba(0,255,102,0.15)',
          paddingBottom: '12px',
          letterSpacing: '1px',
        }}>
          ENTRY_NOTE // CL_SECURE_VAULT // ID: {Math.floor(frame * 0.1) + 9823}
        </div>

        <div style={{
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#00FF66',
          lineHeight: 1.4,
          textAlign: 'left',
          flexGrow: 1,
          wordBreak: 'break-word',
          textShadow: '0 0 8px rgba(0,255,102,0.3)',
        }}>
          {visibleText}
          {(!isDone || cursorBlink) && (
            <span style={{
              display: 'inline-block',
              width: '26px',
              height: '46px',
              backgroundColor: '#00FF66',
              verticalAlign: 'middle',
              marginLeft: '6px',
              boxShadow: '0 0 8px #00FF66',
            }} />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 7. Diagnostic Carousel 3D Hook ───────────────────────────────────────
export const DiagnosticCarousel3DHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rotSpr = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const rotY = interpolate(rotSpr, [0, 1], [-240, 0]);
  const scale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -15], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#020306' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(0.6) brightness(0.24) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        zIndex: 2,
      }}>
        <div style={{
          position: 'relative',
          width: '700px',
          height: '600px',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotY}deg)`,
          transition: 'transform 0.1s ease-out',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(20, 25, 40, 0.95)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '50px',
            transform: 'rotateY(0deg) translateZ(400px)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          }}>
            <div style={{ fontFamily: fonts.sans, fontSize: '32px', fontWeight: 900, color: accentColor, marginBottom: '20px' }}>
              OPTION A: PROTOCOL 91
            </div>
            <div style={{ fontFamily: fonts.serif, fontSize: '44px', fontWeight: 'bold', color: '#FFF' }}>
              Follow standardized outpatient drug limits.
            </div>
          </div>

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(20, 25, 40, 0.95)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '50px',
            transform: 'rotateY(120deg) translateZ(400px)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          }}>
            <div style={{ fontFamily: fonts.sans, fontSize: '32px', fontWeight: 900, color: '#FF3B30', marginBottom: '20px' }}>
              OPTION B: COMPROMISE
            </div>
            <div style={{ fontFamily: fonts.serif, fontSize: '44px', fontWeight: 'bold', color: '#FFF' }}>
              Decline patient coverage claims.
            </div>
          </div>

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 15, 30, 0.98)',
            border: `3px solid ${accentColor}`,
            borderRadius: '24px',
            padding: '50px',
            transform: 'rotateY(240deg) translateZ(400px)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: `0 0 40px ${accentColor}30, 0 20px 50px rgba(0,0,0,0.9)`,
          }}>
            <div style={{ fontFamily: fonts.sans, fontSize: '30px', fontWeight: 900, color: accentColor, marginBottom: '20px', letterSpacing: '2px' }}>
              ⚠️ REVEALED TRUTH
            </div>
            <div style={{ fontFamily: fonts.sans, fontSize: '52px', fontWeight: 900, color: '#FFF', lineHeight: 1.3, textTransform: 'uppercase' }}>
              {hookText}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 8. Symptom Matrix Flyby Hook ─────────────────────────────────────────
export const SymptomMatrixFlybyHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const acronyms = [
    { text: 'HIPAA', startX: -250, startY: -300, zStart: 1200 },
    { text: 'ICD-10', startX: 300, startY: -200, zStart: 1000 },
    { text: 'EHR_OUT', startX: -350, startY: 150, zStart: 800 },
    { text: 'FDA_REG', startX: 250, startY: 300, zStart: 600 },
    { text: 'COPAY', startX: -100, startY: -100, zStart: 1400 },
    { text: 'STAT_ERR', startX: 400, startY: 200, zStart: 900 },
  ];

  const scale = interpolate(frame, [0, 150], [1.02, 1.12], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -20], { extrapolateRight: 'clamp' });

  const revealSpr = spring({
    frame: frame - 35,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#030206' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(0.5) brightness(0.28) contrast(1.15)',
          opacity: interpolate(revealSpr, [0, 1], [0.35, 1]),
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {frame < 60 && acronyms.map((acr, idx) => {
        const currentZ = acr.zStart - frame * 18;
        if (currentZ <= 0) return null;

        const depthFactor = 800 / (800 + currentZ);
        const posX = acr.startX * depthFactor + 540;
        const posY = acr.startY * depthFactor + 960;
        const scaleVal = depthFactor * 3.5;
        const opacity = interpolate(currentZ, [0, 200, 600], [0, 0.9, 0.9], { extrapolateLeft: 'clamp' });

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${posX}px`,
              top: `${posY}px`,
              transform: `translate(-50%, -50%) scale(${scaleVal})`,
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '36px',
              fontWeight: 900,
              color: accentColor,
              opacity,
              zIndex: Math.floor(currentZ),
              textShadow: `0 0 10px ${accentColor}80`,
              pointerEvents: 'none',
            }}
          >
            {acr.text}
          </div>
        );
      })}

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%)',
        zIndex: 10,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
        zIndex: 11,
      }}>
        <div style={{
          fontFamily: fonts.sans,
          fontSize: '72px',
          fontWeight: 900,
          color: '#FFF',
          lineHeight: 1.25,
          opacity: revealSpr,
          transform: `scale(${interpolate(revealSpr, [0, 1], [0.85, 1])})`,
          textShadow: '0 4px 25px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
        }}>
          {hookText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 9. List Reveal Countdown Hook ───────────────────────────────────────
export const ListRevealCountdownHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 150], [1.02, 1.08], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 150], [0, -15], { extrapolateRight: 'clamp' });

  const steps = [
    { num: '01', title: 'IMPROPER BILLING CODES' },
    { num: '02', title: 'HIPAA DATA DISCLOSURE' },
    { num: '03', title: 'MALPRACTICE COMPLIANCE' },
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#050508' }}>
      {doctorPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center 20%',
          filter: 'grayscale(0.8) brightness(0.25) contrast(1.1)',
        }}>
          <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 80px',
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: fonts.sans,
          fontSize: '44px',
          fontWeight: 900,
          color: accentColor,
          letterSpacing: '2px',
          marginBottom: '20px',
          borderBottom: `2px solid ${accentColor}`,
          paddingBottom: '12px',
        }}>
          THE 3 DEADLIEST WARD MISTAKES
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {steps.map((st, idx) => {
            const startFrame = idx * 25;
            const spr = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 12, stiffness: 120 },
            });

            if (frame < startFrame) return null;

            const xOffset = interpolate(spr, [0, 1], [-80, 0]);
            const opacity = interpolate(spr, [0, 1], [0, 1]);

            return (
              <div
                key={st.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  transform: `translateX(${xOffset}px)`,
                  opacity,
                }}
              >
                <div style={{
                  fontFamily: 'Courier New, Courier, monospace',
                  fontSize: '48px',
                  fontWeight: 900,
                  backgroundColor: accentColor,
                  color: '#000',
                  width: '90px',
                  height: '90px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${accentColor}60`,
                }}>
                  {st.num}
                </div>

                <div style={{
                  fontFamily: fonts.sans,
                  fontSize: '40px',
                  fontWeight: 900,
                  color: '#FFF',
                  textAlign: 'left',
                  lineHeight: 1.2,
                  textShadow: '0 4px 10px rgba(0,0,0,0.8)',
                }}>
                  {st.title}
                </div>
              </div>
            );
          })}
        </div>

        {frame >= 75 && (
          <div style={{
            fontFamily: fonts.serif,
            fontSize: '38px',
            color: '#FFF',
            fontStyle: 'italic',
            marginTop: '50px',
            textAlign: 'center',
            opacity: interpolate(frame - 75, [0, 15], [0, 1]),
            textShadow: '0 4px 10px rgba(0,0,0,0.8)',
          }}>
            "And missing these will cost a malpractice claim."
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── 10. Transform 3D Showcase Hook ──────────────────────────────────────
export const Transform3DShowcaseHook: React.FC<{
  doctorPhoto?: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorPhoto, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flipSpr = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  const rotY = interpolate(flipSpr, [0, 1], [-20, 160]);
  const scale = interpolate(flipSpr, [0, 1], [0.9, 1.05]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#06060c' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
      }}>
        <div style={{
          position: 'relative',
          width: '780px',
          height: '1100px',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotY}deg) rotateX(10deg) scale(${scale})`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
          borderRadius: '24px',
          transition: 'transform 0.1s ease-out',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#f5f4ef',
            border: '3px solid #111',
            borderRadius: '24px',
            padding: '60px',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 2,
          }}>
            <div>
              <div style={{
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#FF3B30',
                borderBottom: '2px solid #111',
                paddingBottom: '12px',
                marginBottom: '40px',
              }}>
                INTERNAL REPORT // DEPT_OF_REG
              </div>
              <div style={{ fontFamily: fonts.serif, fontSize: '48px', fontWeight: 900, color: '#111', lineHeight: 1.3 }}>
                ANNUAL LIABILITY AUDIT DETAILS
              </div>
              <div style={{ fontFamily: fonts.sans, fontSize: '28px', color: '#555', marginTop: '30px', lineHeight: 1.4 }}>
                Subheading: Detailed analysis on clinic audit failures and billing compliance...
              </div>
            </div>
            <div style={{
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '18px',
              color: '#999',
            }}>
              CONFIDENTIAL // DO NOT REPRODUCE
            </div>
          </div>

          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#0a0d16',
            border: `3px solid ${accentColor}`,
            borderRadius: '24px',
            overflow: 'hidden',
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '50px',
          }}>
            {doctorPhoto && (
              <div style={{
                position: 'absolute',
                inset: 0,
                filter: 'grayscale(0.4) brightness(0.35) contrast(1.15)',
              }}>
                <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{
              fontFamily: fonts.sans,
              fontSize: '22px',
              fontWeight: 800,
              color: accentColor,
              letterSpacing: '2px',
              marginBottom: '16px',
              textShadow: `0 0 8px ${accentColor}`,
              zIndex: 3,
            }}>
              EXPERT SOLUTION
            </div>

            <div style={{
              fontFamily: fonts.sans,
              fontSize: '48px',
              fontWeight: 900,
              color: '#FFF',
              lineHeight: 1.25,
              textShadow: '0 4px 15px rgba(0,0,0,0.9)',
              textTransform: 'uppercase',
              zIndex: 3,
            }}>
              {hookText}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Nas Daily Gallery Preview Wrappers ──────────────────────────────────
export const CardStackFractureHookPreview: React.FC = () => {
  return (
    <CardStackFractureHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="They told you to do X, but it’s a systemic lie."
      accentColor="#FF3B30"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const BlurInDiagnosticHookPreview: React.FC = () => {
  return (
    <BlurInDiagnosticHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="70% of Clinics Fail This Liability Audit."
      accentColor="#FFDF00"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const ParallaxWaveformHookPreview: React.FC = () => {
  return (
    <ParallaxWaveformHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Why the newest guidelines are causing massive friction in private practice."
      accentColor="#00E5FF"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const GlitchCycleAlertHookPreview: React.FC = () => {
  return (
    <GlitchCycleAlertHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Critical liability risk in patient billing logs."
      accentColor="#FFDF00"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const MosaicReframeHookPreview: React.FC = () => {
  return (
    <MosaicReframeHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Aggregating 6 pieces of patient evidence into a single result."
      accentColor="#FFDF00"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const EhrVariableTypewriterHookPreview: React.FC = () => {
  return (
    <EhrVariableTypewriterHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      doctorAvatar="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      doctorName="Dr. Priya Sharma"
      doctorTitle="Dermatologist"
      hookText="This private entry note changes everything for inpatient care limits."
      accentColor="#00E5FF"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const DiagnosticCarousel3DHookPreview: React.FC = () => {
  return (
    <DiagnosticCarousel3DHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Stop choosing between option A and B. There is option C."
      accentColor="#00E5FF"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const SymptomMatrixFlybyHookPreview: React.FC = () => {
  return (
    <SymptomMatrixFlybyHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Overwhelming data solved by a single clinical decision."
      accentColor="#00E5FF"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const ListRevealCountdownHookPreview: React.FC = () => {
  return (
    <ListRevealCountdownHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="These are the 3 precise errors costing your ward time."
      accentColor="#FFDF00"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};

export const Transform3DShowcaseHookPreview: React.FC = () => {
  return (
    <Transform3DShowcaseHook
      doctorPhoto="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      hookText="Flipping this regulatory document exposes a major malpractice loophole."
      accentColor="#00FF66"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};




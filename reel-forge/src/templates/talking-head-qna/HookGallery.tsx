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

  // Photo entry (scale + blur)
  const photoSpr = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const photoScale = interpolate(photoSpr, [0, 1], [0.8, 1.0]);
  const photoBlur = interpolate(photoSpr, [0, 1], [12, 0]);

  // Alert flashing (frames 10 to 45, 3 times)
  const isAlertVisible = frame >= 10 && frame <= 45 ? Math.floor((frame - 10) / 6) % 2 === 0 : false;

  // Typewriter for metadata fields
  const t1 = Math.floor(interpolate(frame, [8, 20], [0, 18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const t2 = Math.floor(interpolate(frame, [18, 30], [0, 16], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const t3 = Math.floor(interpolate(frame, [28, 40], [0, 18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  const patientIdText = "PATIENT ID: #9842".substring(0, t1);
  const statusText = "STATUS: CRITICAL".substring(0, t2);
  const diagnosisText = "DIAGNOSIS: UNKNOWN".substring(0, t3);

  // Hook Text slamming line-by-line (frames 20-65)
  const hookWords = hookText.split(' ');
  const chunkLength = Math.ceil(hookWords.length / 3);
  const line1 = hookWords.slice(0, chunkLength).join(' ');
  const line2 = hookWords.slice(chunkLength, chunkLength * 2).join(' ');
  const line3 = hookWords.slice(chunkLength * 2).join(' ');

  const spr1 = spring({ frame: frame - 20, fps, config: { damping: 11, stiffness: 140 } });
  const spr2 = spring({ frame: frame - 32, fps, config: { damping: 11, stiffness: 140 } });
  const spr3 = spring({ frame: frame - 44, fps, config: { damping: 11, stiffness: 140 } });

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0a0d16',
      backgroundImage: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 1.5px, transparent 1.5px)',
      backgroundSize: '40px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '920px',
        backgroundColor: 'rgba(10, 14, 24, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '32px',
        border: `1.5px solid rgba(255, 255, 255, 0.15)`,
        boxShadow: '0 30px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        padding: '44px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '20px',
        }}>
          <div style={{
            fontFamily: fonts.sans,
            fontSize: '22px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '3px',
          }}>
            EHR DIAGNOSTIC CASE FILE
          </div>
          {isAlertVisible && (
            <div style={{
              backgroundColor: '#FF3B30',
              color: '#FFF',
              padding: '6px 14px',
              borderRadius: '8px',
              fontFamily: fonts.sans,
              fontSize: '18px',
              fontWeight: 900,
              boxShadow: '0 0 15px rgba(255, 59, 48, 0.6)',
            }}>
              ⚠️ ALERT: CRITICAL RISK
            </div>
          )}
        </div>

        {/* Doctor Photo & Medical Metadata */}
        <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
          <div style={{
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            border: `3px solid ${accentColor}`,
            boxShadow: `0 0 25px ${accentColor}40`,
            overflow: 'hidden',
            transform: `scale(${photoScale})`,
            filter: `blur(${photoBlur}px)`,
          }}>
            {doctorPhoto ? (
              <Img src={resolveUrl(doctorPhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: `${accentColor}22` }} />
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#00FF66',
            textShadow: '0 0 5px rgba(0,255,102,0.3)',
          }}>
            <div>{patientIdText}</div>
            <div style={{ color: statusText.includes('CRITICAL') ? '#FF3B30' : '#00FF66', textShadow: statusText.includes('CRITICAL') ? '0 0 8px rgba(255,59,48,0.4)' : 'none' }}>
              {statusText}
            </div>
            <div>{diagnosisText}</div>
          </div>
        </div>

        {/* Kinetic Text Slam Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', textAlign: 'left' }}>
          {line1 && (
            <div style={{
              fontFamily: fonts.serif,
              fontSize: '48px',
              fontWeight: 900,
              color: '#FFFFFF',
              opacity: interpolate(spr1, [0, 1], [0, 1]),
              transform: `scale(${interpolate(spr1, [0, 1], [1.2, 1.0])})`,
              transformOrigin: 'left center',
              lineHeight: 1.2,
            }}>
              {line1}
            </div>
          )}
          {line2 && (
            <div style={{
              fontFamily: fonts.serif,
              fontSize: '48px',
              fontWeight: 900,
              color: '#FFFFFF',
              opacity: interpolate(spr2, [0, 1], [0, 1]),
              transform: `scale(${interpolate(spr2, [0, 1], [1.2, 1.0])})`,
              transformOrigin: 'left center',
              lineHeight: 1.2,
            }}>
              {line2}
            </div>
          )}
          {line3 && (
            <div style={{
              fontFamily: fonts.serif,
              fontSize: '48px',
              fontWeight: 900,
              color: accentColor,
              opacity: interpolate(spr3, [0, 1], [0, 1]),
              transform: `scale(${interpolate(spr3, [0, 1], [1.2, 1.0])})`,
              transformOrigin: 'left center',
              lineHeight: 1.2,
              textShadow: `0 0 15px ${accentColor}40`,
            }}>
              {line3}
            </div>
          )}
        </div>
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
            // Pseudo-timing for word pop (approx 12 frames per word)
            const activeWordIndex = Math.floor(interpolate(frame, [10, 110], [0, words.length], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }));
            const isActive = activeWordIndex === idx;

            const wordSpr = spring({
              frame: frame - (idx * (80 / words.length)),
              fps,
              config: { damping: 11, stiffness: 130 },
            });
            const wordScale = interpolate(wordSpr, [0, 1], [0.6, 1]);
            const wordOpacity = interpolate(wordSpr, [0, 1], [0, 1]);

            return (
              <span
                key={idx}
                style={{
                  fontFamily: fonts.sans,
                  fontSize: '80px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: isActive ? accentColor : '#FFFFFF',
                  opacity: wordOpacity,
                  transform: `scale(${wordScale})`,
                  textShadow: isActive
                    ? `0 0 30px ${accentColor}, 0 4px 10px rgba(0,0,0,0.6)`
                    : '0 4px 20px rgba(0,0,0,0.85)',
                  letterSpacing: '-1.5px',
                  display: 'inline-block',
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

// ── Redacted Document Override Style ────────────────────────────────────
export const RedactedHook: React.FC<{
  doctorAvatar?: string;
  doctorName: string;
  doctorTitle: string;
  hookText: string;
  accentColor: string;
  fonts: { sans: string; serif: string };
}> = ({ doctorAvatar, doctorName, doctorTitle, hookText, accentColor, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screen shake calculation on frame redaction reveals
  const getShakeOffset = () => {
    // Shake 1: frame 15-19
    if (frame >= 15 && frame <= 19) {
      const offsets = [8, -8, 4, -4, 0];
      return offsets[(frame - 15) % offsets.length];
    }
    // Shake 2: frame 35-39
    if (frame >= 35 && frame <= 39) {
      const offsets = [-8, 8, -4, 4, 0];
      return offsets[(frame - 35) % offsets.length];
    }
    return 0;
  };
  const shakeX = getShakeOffset();

  // Live status green dot pulse
  const dotOpacity = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.3, 1.0]);

  const words = hookText.split(' ');
  // Redact indices 2 ("regenerates") and 5 ("28") to hook curiosity
  const redactIndices = [3, 6];

  return (
    <AbsoluteFill style={{
      backgroundColor: '#f5f4ef',
      backgroundImage: 'radial-gradient(#d3d2cb 1.5px, transparent 1.5px)',
      backgroundSize: '30px 30px',
      transform: `translateX(${shakeX}px)`,
    }}>
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
            // Word 3 unredacts at frame 15, word 6 at frame 35
            const revealFrame = idx === redactIndices[0] ? 15 : 35;
            const isRevealed = frame >= revealFrame;

            if (isRedacted) {
              return (
                <span key={idx} style={{ position: 'relative', marginRight: '16px', display: 'inline-block' }}>
                  <span style={{ opacity: isRevealed ? 1 : 0, color: '#FF3B30', textTransform: 'uppercase', fontWeight: 900 }}>
                    {w}
                  </span>
                  {!isRevealed && (
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#111',
                      borderRadius: '4px',
                      transform: 'scaleY(1.15) scaleX(1.05)',
                    }} />
                  )}
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
      doctorAvatar="clients/dr-priya-sharma/1780601853812-avatar-avatar.png"
      doctorName="Dr. Priya Sharma"
      doctorTitle="Dermatologist"
      hookText="What private clinics [REDACTED] don’t want you to know about insurance payouts."
      accentColor="#FF3B30"
      fonts={{ sans: 'Outfit', serif: 'Playfair Display' }}
    />
  );
};


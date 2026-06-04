import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Video,
  Img,
  staticFile,
} from 'remotion';

interface AnimatedBackgroundProps {
  bgType: 'gradient' | 'solid' | 'video' | 'particles' | 'image';
  bgGradientStart?: string;
  bgGradientEnd?: string;
  bgSolid?: string;
  bgVideoUrl?: string;
  bgImageUrl?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  bgType,
  bgGradientStart = '#0F0F23',
  bgGradientEnd = '#1A1A3E',
  bgSolid = '#0A0A0A',
  bgVideoUrl,
  bgImageUrl,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Shifting angle for gradient rotation (slow 360-deg rotation)
  const bgAngle = interpolate(frame, [0, durationInFrames], [0, 360]);

  // Resolve video path if provided
  const resolvedVideoUrl = React.useMemo(() => {
    if (!bgVideoUrl) return '';
    if (bgVideoUrl.startsWith('http') || bgVideoUrl.startsWith('data:') || bgVideoUrl.startsWith('/') || bgVideoUrl.startsWith('file:')) {
      return bgVideoUrl;
    }
    return staticFile(bgVideoUrl);
  }, [bgVideoUrl]);

  // Resolve image path if provided
  const resolvedImageUrl = React.useMemo(() => {
    if (!bgImageUrl) return '';
    if (bgImageUrl.startsWith('http') || bgImageUrl.startsWith('data:') || bgImageUrl.startsWith('/') || bgImageUrl.startsWith('file:')) {
      return bgImageUrl;
    }
    return staticFile(bgImageUrl);
  }, [bgImageUrl]);

  // Ken Burns scale effect (zoom from 1.0 to 1.15 over 10-second cycles)
  const kbScale = interpolate(
    frame % 300,
    [0, 300],
    [1, 1.15],
    { extrapolateRight: 'clamp' }
  );

  if (bgType === 'solid') {
    return <AbsoluteFill style={{ backgroundColor: bgSolid }} />;
  }

  if (bgType === 'video' && resolvedVideoUrl) {
    return (
      <AbsoluteFill style={{ backgroundColor: bgSolid }}>
        <Video
          src={resolvedVideoUrl}
          loop
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
          }}
        />
        {/* Vignette overlay */}
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle, transparent 20%, rgba(0, 0, 0, 0.6) 90%)',
          }}
        />
      </AbsoluteFill>
    );
  }

  if (bgType === 'image' && resolvedImageUrl) {
    return (
      <AbsoluteFill style={{ backgroundColor: bgSolid, overflow: 'hidden' }}>
        <Img
          src={resolvedImageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${kbScale})`,
          }}
        />
        {/* Dark contrast screen & glass blur to keep text perfectly legible */}
        <AbsoluteFill
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1,
          }}
        />
        {/* Vignette shading */}
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle, transparent 30%, rgba(0, 0, 0, 0.7) 100%)',
            zIndex: 2,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (bgType === 'particles') {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${bgGradientStart}, ${bgGradientEnd})`,
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes float-bubble-1 {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(100px, 150px) scale(1.1); }
            66% { transform: translate(-80px, 80px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes float-bubble-2 {
            0% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(-120px, -180px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes float-bubble-3 {
            0% { transform: translate(0px, 0px) scale(1); }
            40% { transform: translate(150px, -100px) scale(1.15); }
            70% { transform: translate(-50px, 120px) scale(0.85); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
        `}</style>
        
        {/* Bubble 1 */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0) 70%)',
            filter: 'blur(50px)',
            animation: 'float-bubble-1 25s infinite ease-in-out',
          }}
        />

        {/* Bubble 2 */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '-15%',
            width: '550px',
            height: '550px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 245, 212, 0.12) 0%, rgba(0, 245, 212, 0) 70%)',
            filter: 'blur(60px)',
            animation: 'float-bubble-2 30s infinite ease-in-out',
          }}
        />

        {/* Bubble 3 */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '30%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)',
            filter: 'blur(55px)',
            animation: 'float-bubble-3 20s infinite ease-in-out',
          }}
        />
        
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.03,
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
      </AbsoluteFill>
    );
  }

  // Default: Dynamic Gradient
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${bgAngle}deg, ${bgGradientStart}, ${bgGradientEnd})`,
      }}
    />
  );
};

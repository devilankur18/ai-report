import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';

interface AudioWaveformProps {
  audioUrl: string;
  accentColor: string;
  mode: 'linear' | 'radial';
  numberOfBars?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioUrl,
  accentColor,
  mode,
  numberOfBars = 32,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const resolvedAudioUrl = React.useMemo(() => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:')) {
      return audioUrl;
    }
    return staticFile(audioUrl);
  }, [audioUrl]);

  // Load and decode the audio data
  const audioData = useAudioData(resolvedAudioUrl);

  if (!audioData) {
    // Return a dummy static waveform during loading
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 100,
          color: 'rgba(255, 255, 255, 0.3)',
          fontFamily: 'sans-serif',
          fontSize: 16,
        }}
      >
        Loading audio waveform...
      </div>
    );
  }

  // Get frequency/amplitude values for the current frame
  const visualization = visualizeAudio({
    audioData,
    frame,
    fps,
    numberOfSamples: numberOfBars,
  });

  if (mode === 'radial') {
    // Radial circular waveform layout
    const radius = 180;
    const center = 200;
    return (
      <div
        style={{
          position: 'relative',
          width: center * 2,
          height: center * 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Inner circle center */}
        <div
          style={{
            position: 'absolute',
            width: radius * 2 - 20,
            height: radius * 2 - 20,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `0 0 40px rgba(255, 255, 255, 0.02)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
        
        {/* Radial bars radiating outwards */}
        {visualization.map((val, i) => {
          const angle = (i / numberOfBars) * 2 * Math.PI;
          const barHeight = Math.max(8, val * 120); // Scale multiplier
          const rotateDeg = (angle * 180) / Math.PI;
          
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: center - 4,
                top: center - radius - barHeight,
                width: 8,
                height: barHeight,
                backgroundColor: accentColor,
                borderRadius: 4,
                transformOrigin: `4px ${radius + barHeight}px`,
                transform: `rotate(${rotateDeg}deg)`,
                boxShadow: `0 0 12px ${accentColor}`,
                opacity: 0.85 + val * 0.15,
              }}
            />
          );
        })}
      </div>
    );
  }

  // Default: Linear waveform layout
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        height: '160px',
      }}
    >
      {visualization.map((val, i) => {
        // Height between 10px and 140px based on volume amplitude
        const barHeight = Math.max(10, val * 140);
        return (
          <div
            key={i}
            style={{
              width: '10px',
              height: `${barHeight}px`,
              backgroundColor: accentColor,
              borderRadius: '5px',
              boxShadow: `0 0 8px ${accentColor}80`,
              opacity: 0.7 + val * 0.3,
              transition: 'height 0.05s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

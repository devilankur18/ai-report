import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';

interface AudioWaveformProps {
  audioUrl: string;
  accentColor: string;
  mode: 'linear' | 'radial';
  numberOfBars?: number;
}

const AudioWaveformInner: React.FC<AudioWaveformProps & { resolvedAudioUrl: string }> = ({
  resolvedAudioUrl,
  accentColor,
  mode,
  numberOfBars = 32,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // Multi-frame moving average smoothing to make the waveform feel "liquid" and fluid
  const getSmoothedVisualization = (currentFrame: number) => {
    const windowSize = 3; // Number of frames to average (past, current, future)
    const samples: number[][] = [];
    
    // Collect frequency visualisations for frames in the window
    for (let offset = -1; offset <= 1; offset++) {
      const targetFrame = Math.max(0, currentFrame + offset);
      const viz = visualizeAudio({
        audioData,
        frame: targetFrame,
        fps,
        numberOfSamples: numberOfBars,
      });
      samples.push(viz);
    }
    
    // Average the frequencies across the window size
    const averaged = new Array(numberOfBars).fill(0);
    for (let sampleIdx = 0; sampleIdx < numberOfBars; sampleIdx++) {
      let sum = 0;
      for (let windowIdx = 0; windowIdx < samples.length; windowIdx++) {
        sum += samples[windowIdx][sampleIdx];
      }
      averaged[sampleIdx] = sum / samples.length;
    }
    return averaged;
  };

  const visualization = getSmoothedVisualization(frame);

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
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
          }}
        />
        
        {/* Radial bars radiating outwards */}
        {visualization.map((val, i) => {
          const angle = (i / numberOfBars) * 2 * Math.PI;
          const barHeight = Math.max(8, val * 130); // Scale multiplier
          const rotateDeg = (angle * 180) / Math.PI;
          
          // Glow intensity scales with volume amplitude
          const glowIntensity = Math.min(20, val * 25);
          
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
                boxShadow: glowIntensity > 2 ? `0 0 ${glowIntensity}px ${accentColor}` : 'none',
                opacity: 0.8 + val * 0.2,
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
        const barHeight = Math.max(10, val * 150);
        
        // Glow intensity scales with volume amplitude
        const glowIntensity = Math.min(16, val * 20);

        return (
          <div
            key={i}
            style={{
              width: '10px',
              height: `${barHeight}px`,
              backgroundColor: accentColor,
              borderRadius: '5px',
              boxShadow: glowIntensity > 2 ? `0 0 ${glowIntensity}px ${accentColor}cc` : 'none',
              opacity: 0.75 + val * 0.25,
            }}
          />
        );
      })}
    </div>
  );
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioUrl,
  ...props
}) => {
  const resolvedAudioUrl = React.useMemo(() => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:')) {
      return audioUrl;
    }
    return staticFile(audioUrl);
  }, [audioUrl]);

  if (!resolvedAudioUrl) {
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
        No audio file provided
      </div>
    );
  }

  return <AudioWaveformInner resolvedAudioUrl={resolvedAudioUrl} {...props} />;
};

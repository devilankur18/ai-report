import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
const AudioWaveformInner = ({ resolvedAudioUrl, accentColor, mode, numberOfBars = 32, }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Load and decode the audio data
    const audioData = useAudioData(resolvedAudioUrl);
    if (!audioData) {
        // Return a dummy static waveform during loading
        return (_jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 100,
                color: 'rgba(255, 255, 255, 0.3)',
                fontFamily: 'sans-serif',
                fontSize: 16,
            }, children: "Loading audio waveform..." }));
    }
    // Multi-frame moving average smoothing to make the waveform feel "liquid" and fluid
    const getSmoothedVisualization = (currentFrame) => {
        const windowSize = 3; // Number of frames to average (past, current, future)
        const samples = [];
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
        return (_jsxs("div", { style: {
                position: 'relative',
                width: center * 2,
                height: center * 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }, children: [_jsx("div", { style: {
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
                    } }), visualization.map((val, i) => {
                    const angle = (i / numberOfBars) * 2 * Math.PI;
                    const barHeight = Math.max(8, val * 130); // Scale multiplier
                    const rotateDeg = (angle * 180) / Math.PI;
                    // Glow intensity scales with volume amplitude
                    const glowIntensity = Math.min(20, val * 25);
                    return (_jsx("div", { style: {
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
                        } }, i));
                })] }));
    }
    // Default: Linear waveform layout
    return (_jsx("div", { style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            height: '160px',
        }, children: visualization.map((val, i) => {
            // Height between 10px and 140px based on volume amplitude
            const barHeight = Math.max(10, val * 150);
            // Glow intensity scales with volume amplitude
            const glowIntensity = Math.min(16, val * 20);
            return (_jsx("div", { style: {
                    width: '10px',
                    height: `${barHeight}px`,
                    backgroundColor: accentColor,
                    borderRadius: '5px',
                    boxShadow: glowIntensity > 2 ? `0 0 ${glowIntensity}px ${accentColor}cc` : 'none',
                    opacity: 0.75 + val * 0.25,
                } }, i));
        }) }));
};
export const AudioWaveform = ({ audioUrl, ...props }) => {
    const resolvedAudioUrl = React.useMemo(() => {
        if (!audioUrl)
            return '';
        if (audioUrl.startsWith('http') || audioUrl.startsWith('data:') || audioUrl.startsWith('/') || audioUrl.startsWith('file:')) {
            return audioUrl;
        }
        return staticFile(audioUrl);
    }, [audioUrl]);
    if (!resolvedAudioUrl) {
        return (_jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 100,
                color: 'rgba(255, 255, 255, 0.3)',
                fontFamily: 'sans-serif',
                fontSize: 16,
            }, children: "No audio file provided" }));
    }
    return _jsx(AudioWaveformInner, { resolvedAudioUrl: resolvedAudioUrl, audioUrl: audioUrl, ...props });
};

import { jsx as _jsx } from "react/jsx-runtime";
import { useCurrentFrame, useVideoConfig } from 'remotion';
export const ProgressBar = ({ accentColor }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    // Calculate percentage progress through the composition
    const progress = Math.min(frame / (durationInFrames - 1), 1);
    return (_jsx("div", { style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 100,
        }, children: _jsx("div", { style: {
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: accentColor,
                boxShadow: `0 0 10px ${accentColor}`,
            } }) }));
};

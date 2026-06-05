import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Composition } from 'remotion';
import { HookQuoteTemplate } from './templates/hook-quote';
import { MinimalPodcastTemplate } from './templates/minimal-podcast';
import { TalkingHeadTemplate } from './templates/talking-head';
import { TalkingHeadV2Template } from './templates/talking-head-v2';
import { TalkingHeadQnaTemplate } from './templates/talking-head-qna';
import { GlobalPropsSchema } from './global-schema';
import { EhrFileHookPreview, ParallaxHookPreview, RedactedHookPreview, TypewriterTerminalHookPreview, TypewriterWordPopHookPreview, TypewriterStaggeredSlideHookPreview, CardStackFractureHookPreview, BlurInDiagnosticHookPreview, ParallaxWaveformHookPreview, GlitchCycleAlertHookPreview, MosaicReframeHookPreview, EhrVariableTypewriterHookPreview, DiagnosticCarousel3DHookPreview, SymptomMatrixFlybyHookPreview, ListRevealCountdownHookPreview, Transform3DShowcaseHookPreview, } from './templates/talking-head-qna/HookGallery.js';
export const Root = () => {
    const defaultSampleProps = {
        audioUrl: '', // This will be dynamic in CLI renders
        transcript: 'This is a sample expert audio recording. It helps us validate the transcription pipeline and ensure the templates render beautifully.',
        expertName: 'Dr. Priya Sharma',
        expertSpecialty: 'Dermatologist',
        domain: 'Skincare',
        hookText: 'Did you know your skin regenerates every 28 days?',
        scenes: [
            {
                startSec: 0,
                endSec: 5,
                label: 'Intro',
                keyQuote: 'This is a sample expert audio recording.',
            },
            {
                startSec: 5,
                endSec: 15,
                label: 'Body',
                keyQuote: 'validate the transcription pipeline and render beautifully.',
            },
        ],
        ctaText: 'Follow for more skincare tips!',
        durationInFrames: 600, // 20 seconds default
        fps: 30,
        wordTimestamps: [
            { word: "This", start: 0, end: 0.5 },
            { word: "is", start: 0.5, end: 0.8 },
            { word: "a", start: 0.8, end: 1.0 },
            { word: "sample", start: 1.0, end: 1.5 },
            { word: "expert", start: 1.5, end: 2.0 },
            { word: "audio", start: 2.0, end: 2.5 },
            { word: "recording.", start: 2.5, end: 3.2 },
            { word: "It", start: 3.2, end: 3.5 },
            { word: "helps", start: 3.5, end: 3.8 },
            { word: "us", start: 3.8, end: 4.1 },
            { word: "validate", start: 4.1, end: 4.6 },
            { word: "the", start: 4.6, end: 4.8 },
            { word: "transcription", start: 4.8, end: 5.5 },
            { word: "pipeline", start: 5.5, end: 6.2 },
            { word: "and", start: 6.2, end: 6.5 },
            { word: "ensure", start: 6.5, end: 7.0 },
            { word: "the", start: 7.0, end: 7.2 },
            { word: "templates", start: 7.2, end: 7.8 },
            { word: "render", start: 7.8, end: 8.3 },
            { word: "beautifully.", start: 8.3, end: 9.2 }
        ]
    };
    return (_jsxs(_Fragment, { children: [_jsx(Composition, { id: "hook-quote", component: HookQuoteTemplate, calculateMetadata: ({ props }) => {
                    return {
                        durationInFrames: props.durationInFrames || 600,
                    };
                }, fps: 30, width: 1080, height: 1920, schema: GlobalPropsSchema, defaultProps: defaultSampleProps }), _jsx(Composition, { id: "minimal-podcast", component: MinimalPodcastTemplate, calculateMetadata: ({ props }) => {
                    return {
                        durationInFrames: props.durationInFrames || 600,
                    };
                }, fps: 30, width: 1080, height: 1920, schema: GlobalPropsSchema, defaultProps: {
                    ...defaultSampleProps,
                    ctaText: 'Full conversation on Spotify & Apple Podcasts',
                } }), _jsx(Composition, { id: "talking-head", component: TalkingHeadTemplate, calculateMetadata: ({ props }) => {
                    return {
                        durationInFrames: props.durationInFrames || 600,
                    };
                }, fps: 30, width: 1080, height: 1920, schema: GlobalPropsSchema, defaultProps: {
                    ...defaultSampleProps,
                    ctaText: 'Follow for more skincare tips!',
                } }), _jsx(Composition, { id: "talking-head-v2", component: TalkingHeadV2Template, calculateMetadata: ({ props }) => {
                    return {
                        durationInFrames: props.durationInFrames || 600,
                    };
                }, fps: 30, width: 1080, height: 1920, schema: GlobalPropsSchema, defaultProps: {
                    ...defaultSampleProps,
                    ctaText: 'Follow for more skincare tips!',
                } }), _jsx(Composition, { id: "talking-head-qna", component: TalkingHeadQnaTemplate, calculateMetadata: ({ props }) => {
                    return {
                        durationInFrames: props.durationInFrames || 600,
                    };
                }, fps: 30, width: 1080, height: 1920, schema: GlobalPropsSchema, defaultProps: {
                    ...defaultSampleProps,
                    ctaText: 'Follow for more skincare tips!',
                } }), _jsx(Composition, { id: "hook-ehr-file", component: EhrFileHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-parallax-data", component: ParallaxHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-redacted", component: RedactedHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-typewriter-terminal", component: TypewriterTerminalHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-typewriter-pop", component: TypewriterWordPopHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-typewriter-slide", component: TypewriterStaggeredSlideHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-3d-stack", component: CardStackFractureHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-blur-in", component: BlurInDiagnosticHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-parallax-waveform", component: ParallaxWaveformHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-glitch-cycle", component: GlitchCycleAlertHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-mosaic-reframe", component: MosaicReframeHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-variable-typewriter", component: EhrVariableTypewriterHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-3d-carousel", component: DiagnosticCarousel3DHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-matrix-flyby", component: SymptomMatrixFlybyHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-list-countdown", component: ListRevealCountdownHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 }), _jsx(Composition, { id: "hook-3d-showcase", component: Transform3DShowcaseHookPreview, fps: 30, width: 1080, height: 1920, durationInFrames: 150 })] }));
};

import React from 'react';
import { Composition } from 'remotion';
import { HookQuoteTemplate } from './templates/hook-quote';
import { MinimalPodcastTemplate } from './templates/minimal-podcast';
import { GlobalPropsSchema } from './global-schema';

export const Root: React.FC = () => {
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
  };

  return (
    <>
      <Composition
        id="hook-quote"
        component={HookQuoteTemplate}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        schema={GlobalPropsSchema}
        defaultProps={defaultSampleProps}
      />
      <Composition
        id="minimal-podcast"
        component={MinimalPodcastTemplate}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        schema={GlobalPropsSchema}
        defaultProps={{
          ...defaultSampleProps,
          ctaText: 'Full conversation on Spotify & Apple Podcasts',
        }}
      />
    </>
  );
};

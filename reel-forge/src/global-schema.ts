import { z } from 'zod';

export const SceneSchema = z.object({
  startSec: z.number(),
  endSec: z.number(),
  label: z.string(),
  keyQuote: z.string().nullable().optional(),
});

export const GlobalPropsSchema = z.object({
  audioUrl: z.string(),
  transcript: z.string(),
  expertName: z.string(),
  expertSpecialty: z.string(),
  domain: z.string(),
  hookText: z.string(),
  scenes: z.array(SceneSchema),
  ctaText: z.string(),
  hashtags: z.array(z.string()).optional(),
  title: z.string().optional(),
  durationInFrames: z.number(),
  fps: z.number().default(30),
  
  // Custom styling (optional overrides)
  accentColor: z.string().optional(),
  bgGradientStart: z.string().optional(),
  bgGradientEnd: z.string().optional(),
  bgSolid: z.string().optional(),
  textColor: z.string().optional(),
});

export type Scene = z.infer<typeof SceneSchema>;
export type GlobalProps = z.infer<typeof GlobalPropsSchema>;

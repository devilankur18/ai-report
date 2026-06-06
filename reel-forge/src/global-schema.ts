import { z } from 'zod';

export const SceneSchema = z.object({
  startSec: z.number(),
  endSec: z.number(),
  label: z.string(),
  keyQuote: z.string().nullable().optional(),
});

/** Word-level timestamp from Whisper — used by talking-head karaoke captions */
export const WordTimestampSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export const TakeawaySchema = z.object({
  timeSec: z.number(),
  text: z.string(),
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
  ctaType: z.enum(['follow', 'subscribe', 'appointment', 'listen']).default('follow'),
  ctaTitle: z.string().optional(),
  ctaSubtitle: z.string().optional(),
  ctaLink: z.string().optional(),
  ctaHandle: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  title: z.string().optional(),
  durationInFrames: z.number(),
  fps: z.number().default(30),

  // ── Custom styling (optional overrides) ────────────────────────────────
  accentColor: z.string().optional(),
  bgGradientStart: z.string().optional(),
  bgGradientEnd: z.string().optional(),
  bgSolid: z.string().optional(),
  textColor: z.string().optional(),
  themeId: z.string().optional(),
  bgVideoUrl: z.string().optional(),
  language: z.string().optional(),

  // ── Doctor visual assets ────────────────────────────────────────────────
  expertAvatar: z.string().optional(),
  expertLogo: z.string().optional(),
  /** Array of image paths for background slideshow cycling */
  expertImages: z.array(z.string()).optional(),
  /**
   * Tagged image set for intelligent scene-based assignment.
   * role: 'hook' = shown during 3-sec intro, 'scene' = cycled during speech,
   *       'cta' = shown on CTA outro, 'portrait' = hero-portrait mode primary
   */
  expertImageSet: z.array(z.object({
    file: z.string(),
    role: z.enum(['hook', 'scene', 'cta', 'portrait']),
    alt: z.string().optional(),
  })).optional(),

  // ── Phase 2: Hook personalization ──────────────────────────────────────
  /**
   * Which hook animation style to use for the first 3 seconds.
   * LLM picks based on transcript tone; design config can lock it.
   */
  hookStyle: z.enum([
    'zoom-face',       // Doctor face fills screen → zooms out with text
    'stat-counter',    // Large number counts up + tagline  
    'text-slam',       // Words slam in with impact
    'typewriter-bold', // Large typewriter effect (bold/authoritative)
    'split-reveal',    // Screen splits, doctor slides up from bottom
    'word-cascade',    // Original word-by-word spring (legacy fallback)
    'ehr-file',
    'parallax-data',
    'redacted',
    'typewriter-terminal',
    'typewriter-pop',
    'typewriter-slide',
    '3d-stack',
    'blur-in',
    'parallax-waveform',
    'glitch-cycle',
    'mosaic-reframe',
    'variable-typewriter',
    '3d-carousel',
    'matrix-flyby',
    'list-countdown',
    '3d-showcase',
  ]).optional().default('zoom-face'),
  /** The key statistic for stat-counter hook style (e.g. "90%", "1 in 4") */
  hookStat: z.string().optional(),
  /** Emoji accent for the hook (e.g. "🔥", "⚠️", "💡") */
  hookEmoji: z.string().optional(),
  /**
   * Content tone — used to tune color emphasis and animation intensity.
   * LLM outputs this; templates use it to adjust visual weight.
   */
  toneTag: z.enum(['educational', 'motivational', 'warning', 'myth-bust', 'storytelling']).optional(),

  // ── Phase 3: Layout personalization ────────────────────────────────────
  /** Which layout variant controls quote/badge/waveform positioning */
  layoutVariant: z.enum(['quote-bottom', 'quote-bottom-left', 'quote-bottom-center', 'quote-top', 'quote-center', 'quote-split']).optional(),
  /** How the text-legibility overlay is applied over image backgrounds */
  overlayStyle: z.enum(['scrim-bottom', 'scrim-full', 'vignette', 'none']).optional(),
  /** 0-4 index into font pairings (classic-serif, modern-sans, strong-display, warm-round, tech-clean) */
  fontPairingIndex: z.number().int().min(0).max(4).optional(),
  /** Decoration embellishment on quote card borders */
  decorationStyle: z.enum(['accent-bar', 'accent-line', 'quote-marks', 'numbered']).optional(),
  /** CSS treatment applied to doctor photo backgrounds */
  imageTreatment: z.enum(['full-color', 'duotone-warm', 'duotone-cool']).optional(),
  /** Client ID — passed through for deterministic personalization hashing */
  clientId: z.string().optional(),
  /** Design ID — passed through for deterministic personalization hashing */
  designId: z.string().optional(),

  // ── Phase 5: Talking-head karaoke captions ─────────────────────────────
  /** Word-level timestamps from Whisper for karaoke-style caption highlighting */
  wordTimestamps: z.array(WordTimestampSchema).optional(),

  // ── Takeaways ──────────────────────────────────────────────────────────
  /** List of takeaway bullet points distributed across full video length */
  takeaways: z.array(TakeawaySchema).optional(),
});

export type Scene = z.infer<typeof SceneSchema>;
export type WordTimestamp = z.infer<typeof WordTimestampSchema>;
export type Takeaway = z.infer<typeof TakeawaySchema>;
export type GlobalProps = z.infer<typeof GlobalPropsSchema>;

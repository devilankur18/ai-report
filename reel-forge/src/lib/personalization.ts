/**
 * personalization.ts
 * ------------------
 * Deterministic personalization engine for ReelForge.
 *
 * Problem it solves: Two doctors using the same template look identical.
 *
 * Solution: Hash(clientId + designId) → unique combination of:
 *   - Font pairing (5 options)
 *   - Layout variant (4 options)
 *   - Overlay style (3 options)
 *   - Decoration style (4 options)
 *   - Image treatment (3 options)
 *   - Quote position (3 options)
 *
 * This gives 5 × 4 × 3 × 4 × 3 × 3 = 2,160 unique visual combos.
 * Same doctor always gets consistent styling; different doctors look different.
 *
 * Design configs can override any dimension explicitly.
 */

// ── Type definitions ──────────────────────────────────────────────────────

export type LayoutVariant    = 'quote-bottom-left' | 'quote-bottom-center' | 'quote-top' | 'quote-split';
export type OverlayStyle     = 'scrim-bottom' | 'scrim-full' | 'vignette';
export type DecorationStyle  = 'accent-bar' | 'accent-line' | 'quote-marks' | 'numbered';
export type ImageTreatment   = 'full-color' | 'duotone-warm' | 'duotone-cool';
export type QuotePosition    = 'bottom' | 'center' | 'top';

export interface PersonalizationProfile {
  /** 0-4 index into englishPairings / hindiPairings */
  fontPairingIndex:  number;
  /** Controls where the quote card sits on screen */
  layoutVariant:     LayoutVariant;
  /** How the background image is darkened for legibility */
  overlayStyle:      OverlayStyle;
  /** Visual embellishment on quote/badge elements */
  decorationStyle:   DecorationStyle;
  /** CSS filter treatment for doctor photos */
  imageTreatment:    ImageTreatment;
  /** Vertical zone of the quote card */
  quotePosition:     QuotePosition;
}

// ── Available options per dimension ──────────────────────────────────────

const FONT_PAIRINGS     = [0, 1, 2, 3, 4];
const LAYOUT_VARIANTS:    LayoutVariant[]   = ['quote-bottom-center', 'quote-bottom-left', 'quote-top', 'quote-split'];
const OVERLAY_STYLES:     OverlayStyle[]    = ['scrim-bottom', 'scrim-full', 'vignette'];
const DECORATION_STYLES:  DecorationStyle[] = ['accent-bar', 'accent-line', 'quote-marks', 'numbered'];
const IMAGE_TREATMENTS:   ImageTreatment[]  = ['full-color', 'duotone-warm', 'duotone-cool'];
const QUOTE_POSITIONS:    QuotePosition[]   = ['bottom', 'center', 'top'];

// ── Hash function (djb2) ──────────────────────────────────────────────────

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // Keep as unsigned 32-bit integer
  }
  return hash;
}

/**
 * Get a deterministic value from an array using hash + salt.
 * Different salt values pick different "channels" from the same hash seed.
 */
function pickFromHash<T>(arr: T[], hashSeed: number, salt: number): T {
  const mixed = djb2Hash(`${hashSeed}-${salt}`);
  return arr[mixed % arr.length];
}

// ── Main personalization function ─────────────────────────────────────────

/**
 * Generate a deterministic personalization profile for a client+design pair.
 *
 * @param clientId - e.g. "dr-priya-sharma"
 * @param designId - e.g. "classic-reels"
 * @param overrides - Optional explicit overrides from design config
 */
export function getPersonalizationProfile(
  clientId: string,
  designId: string,
  overrides?: Partial<PersonalizationProfile>
): PersonalizationProfile {
  const seed = djb2Hash(`${clientId}::${designId}`);

  const profile: PersonalizationProfile = {
    fontPairingIndex:  pickFromHash(FONT_PAIRINGS,    seed, 0),
    layoutVariant:     pickFromHash(LAYOUT_VARIANTS,  seed, 1),
    overlayStyle:      pickFromHash(OVERLAY_STYLES,   seed, 2),
    decorationStyle:   pickFromHash(DECORATION_STYLES,seed, 3),
    imageTreatment:    pickFromHash(IMAGE_TREATMENTS, seed, 4),
    quotePosition:     pickFromHash(QUOTE_POSITIONS,  seed, 5),
  };

  // Apply any explicit overrides from design config
  return { ...profile, ...overrides };
}

// ── CSS helpers ───────────────────────────────────────────────────────────

/**
 * Get CSS filter for an image treatment variant.
 * Applied on doctor background/portrait photos.
 */
export function getImageFilter(treatment: ImageTreatment, accentColor: string): string {
  switch (treatment) {
    case 'duotone-warm':
      // Warm sepia tint — terracotta feel
      return 'sepia(0.35) saturate(1.1) hue-rotate(-10deg)';
    case 'duotone-cool':
      // Cool clinical blue shift
      return 'sepia(0.2) saturate(0.85) hue-rotate(200deg) brightness(0.95)';
    case 'full-color':
    default:
      return 'none';
  }
}

/**
 * Get CSS position overrides for quote card based on layout variant.
 */
export function getQuoteCardPosition(variant: LayoutVariant): {
  bottom?: string; top?: string; left: string; right: string; textAlign: 'left' | 'center' | 'right';
} {
  switch (variant) {
    case 'quote-bottom-left':
      return { bottom: '280px', left: '60px', right: '220px', textAlign: 'left' };
    case 'quote-top':
      return { top: '180px', left: '60px', right: '60px', textAlign: 'center' };
    case 'quote-split':
      // Left half only — doctor photo visible on the right
      return { bottom: '280px', left: '60px', right: '50%', textAlign: 'left' };
    case 'quote-bottom-center':
    default:
      return { bottom: '280px', left: '60px', right: '60px', textAlign: 'center' };
  }
}

/**
 * Get decoration element(s) for the quote card border style.
 * Returns a style object applied to the quote card.
 */
export function getQuoteCardDecoration(
  style: DecorationStyle,
  accentColor: string
): React.CSSProperties {
  switch (style) {
    case 'accent-bar':
      // Thick left accent bar
      return { borderLeft: `6px solid ${accentColor}`, borderRadius: '4px 20px 20px 4px' };
    case 'accent-line':
      // Top accent line only
      return { borderTop: `4px solid ${accentColor}`, borderLeft: 'none', borderRadius: '0 0 20px 20px' };
    case 'quote-marks':
      // No border — quote marks are handled in the text itself
      return { borderLeft: 'none', borderTop: 'none', borderRadius: '20px' };
    case 'numbered':
      // Right-side accent — scene number indicator
      return { borderRight: `6px solid ${accentColor}`, borderRadius: '20px 4px 4px 20px' };
    default:
      return { borderLeft: `5px solid ${accentColor}` };
  }
}

// React import needed for CSSProperties type
import React from 'react';

// ── Profile → readable summary ────────────────────────────────────────────

export function describeProfile(profile: PersonalizationProfile, clientId: string): string {
  return [
    `Client: ${clientId}`,
    `Font: pairing-${profile.fontPairingIndex}`,
    `Layout: ${profile.layoutVariant}`,
    `Overlay: ${profile.overlayStyle}`,
    `Decoration: ${profile.decorationStyle}`,
    `Image: ${profile.imageTreatment}`,
  ].join(' | ');
}

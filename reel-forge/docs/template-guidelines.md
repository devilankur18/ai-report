# ReelForge Template Design Guidelines

This document establishes the visual, technical, and structural guidelines for building templates inside ReelForge. Follow these rules to ensure all templates render perfectly, read clearly on social media, and are highly customizable.

---

## 1. Grid & Safe Zones (1080 × 1920)

Since social media platforms (Instagram, TikTok, YouTube Shorts) place UI overlays on the outer bounds of the screen, all critical content **MUST** reside within the safe zone.

*   **Total Composition Dimension**: 1080px width by 1920px height (9:16 portrait).
*   **Safe Zone Boundaries**: Centred **900px × 1400px** box.
    *   **Left/Right margins**: At least 90px on each side.
    *   **Top margin**: At least 260px (avoids header, profile indicators).
    *   **Bottom margin**: At least 260px (avoids comments, platform descriptions, share icons).
*   **Overlay Avoidance**:
    *   Avoid placing text in the rightmost 120px to prevent conflict with platform interaction buttons (Like, Comment, Share, Audio Disc).
    *   Keep the bottom-left area clear of heavy graphics to avoid overlapping with platform descriptions.

---

## 2. Typography & Fonts

Readability is the single most important factor for video engagement. 

### Font Configurations
*   **English/Latin Fonts**: Use distinct sans-serif and serif choices for headers/body:
    *   *Serif*: `Playfair Display` (elegant, authoritative).
    *   *Sans-Serif*: `Inter` (neutral, crisp, readable).
*   **Non-Latin Fonts (e.g. Hindi/Devanagari)**: Use Unicode-compatible Google Fonts to prevent default fallback issues:
    *   *Serif/Display*: `Rozha One` or `Federo`.
    *   *Sans-Serif*: `Mukta` or `Poppins`.

### Type Scale Hierarchy
1.  **Hook (Intro Title)**: `64px` to `86px`, font-weight `bold` or `black`. Max 3 lines.
2.  **Key Quotes (Captions)**: `36px` to `48px`, line-height `1.4` to `1.5`. Max 4 lines.
3.  **Expert Details (Badge)**: `24px` to `32px` for name, `16px` to `20px` for specialty.
4.  **CTA Texts**: `40px` to `56px`, bold uppercase, or highlighted color.

---

## 3. Contrast, Readability & Glassmorphism

Text can render over unpredictable background gradients, images, or looping videos. Always implement contrast safety nets:

*   **Frosted Glass Backdrops**: Wrap key quote text or badges in card wrappers using:
    *   `background-color: rgba(0, 0, 0, 0.25)` or `rgba(255, 255, 255, 0.08)`
    *   `backdrop-filter: blur(20px)`
    *   `border: 1px solid rgba(255, 255, 255, 0.08)`
*   **Drop Shadows**: Apply text shadow to overlays:
    *   `text-shadow: 0 4px 16px rgba(0, 0, 0, 0.35)`
*   **Color Contrast Ratio**: Maintain at least a `4.5:1` contrast ratio between text and underlying background elements.

---

## 4. Motion Design & Animation

Organic feeling animations create a premium experience. Avoid linear ease-in-out curves for key elements.

*   **Spring Physics (`spring()`)**:
    *   Use Remotion's `spring()` for entry animations (text pops, badges sliding up, CTA box scaling).
    *   Recommended spring settings:
        *   `damping: 12-15` (prevents excessive jitter while feeling snappy).
        *   `stiffness: 100` (energetic but controlled).
*   **Micro-Animations**:
    *   Rotate background gradients slowly (e.g. `linear-gradient(${angle}deg, ...)` over the entire duration of the composition).
    *   Add slow-moving floating particles or scale-grid movements to backgrounds.
*   **Transitions**:
    *   Use a `15-frame` overlap fade-out (`interpolate()`) when transitioning between scenes.

---

## 5. Audio Waveforms & Audio Settings

Visualizers represent the raw energy of the audio track.

*   **Damping & Smoothing**: Waveform bar heights should use a spring or moving average helper to prevent "jittery/twitchy" single-frame spikes.
*   **Boundaries**: 
    *   Set a minimum height (e.g. `8px` or `10px`) so the visualizer does not disappear in silent pauses.
    *   Clamp the maximum visualizer height to avoid overlapping with text containers.
*   **Audio Fade**:
    *   Always apply a volume fade-out using `interpolate` over the final `120 frames` (4 seconds) of the video during the CTA screen to smoothly taper the output audio.

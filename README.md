# open-slide workspace

Slides as React components. Each slide lives under `slides/<id>/index.tsx` and default-exports an array of page components. The `@open-slide/core` runtime handles layout, scaling, navigation, thumbnails, and fullscreen play mode — you just write the pages.

## Getting started

```bash
pnpm install
pnpm dev
```

Then open the dev server and edit `slides/getting-started/index.tsx`, or create a new slide at `slides/<your-slide>/index.tsx`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server with hot reload. |
| `pnpm build` | Build a static bundle you can deploy. |
| `pnpm preview` | Preview the built bundle locally. |
## Running GEO Engines

The repository includes a GEO multi‑engine pipeline for searching doctor listings across various platforms. Each engine resides under `browser-use-demo/geo_engine/<engine>/` and provides a `capture.js` script and a `parser.py` for post‑processing.

To run a specific engine, use the provided CLI `geo_cli.py`:

```bash
python3 geo_cli.py --engine <engine> --city "<city>" --specialty "<specialty>"
```

Replace `<engine>` with one of:
- `google_maps`
- `bing_maps`
- `practo`
- `justdial`
- `google_business_profile` (new)
- `ms_business_profile` (new)
- `chatgpt`
- `gemini`
- `google`
- `bing`
- `perplexity`

You can also specify multiple engines as a comma‑separated list:

```bash
python3 geo_cli.py --engine google_maps,bing_maps --city "Lucknow" --specialty "orthopedicians"
```

### Region‑aware ordering (India)

Use the `--region india` flag to prioritize India‑specific directories (Practo → Justdial) before falling back to the global business profile engines:

```bash
python3 geo_cli.py --region india --city "Lucknow" --specialty "orthopedicians"
```

## Authoring a slide

```tsx
// slides/my-slide/index.tsx
import type { Page, SlideMeta } from '@open-slide/core';

const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%' }}>Hello</div>
);

export const meta: SlideMeta = { title: 'My slide' };
export default [Cover] satisfies Page[];
```

Every page renders into a fixed **1920 × 1080** canvas — design with absolute pixel values. Put images, videos, and fonts under `slides/<id>/assets/` and import them directly.

See [`CLAUDE.md`](./CLAUDE.md) for the full authoring guide.

## Navigation

- Arrow keys / PageUp / PageDown move between pages.
- `F` enters fullscreen play mode; Esc exits.
- In play mode: Space / → next, ← prev.

## Claude Code integration

This workspace ships with Claude Code skills preconfigured under `.claude/skills/` and `.agents/skills/`. Ask Claude Code to "make slides about X" and the `create-slide` skill takes over. Use `apply-comments` to iterate via inspector-style markers inside your source.

## Config

Optional `open-slide.config.ts` at the workspace root:

```ts
import type { OpenSlideConfig } from '@open-slide/core';

const openSlideConfig: OpenSlideConfig = {
  port: 5173,
};

export default openSlideConfig;
```

Supported fields: `slidesDir`, `port`.

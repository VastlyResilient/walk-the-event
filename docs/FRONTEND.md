
# Walk the Event — Front-End

Vite + TypeScript single-page app. No runtime dependencies (vanilla TS, CSS2D); build
output is ~35 kB JS + 15 kB CSS. Media is the real footage and photos, unmodified.

## Commands
- `npm install` — install dev deps (vite, typescript, playwright for QA)
- `npm run dev` — dev server
- `npm run build` — type-check + production build to `dist/` (verified green)
- `npm run preview` — serve the production build (SPA fallback works for `/map`, `/stations`)
- `node qa/verify.mjs` — end-to-end check against a running preview on :4173
  (screenshots into `qa/runs/`, asserts hotspots, overlay, deep links, Ask Hermes, console errors)

## Routes
| Route | What |
|---|---|
| `/` | Cinematic rail walk: scroll/swipe/arrow-keys/W-S scrub the video; drag = limited parallax look-around; glowing station hotspots; chapter rail; floor switch; guide companion |
| `/map` | Illustrated vector route with chapter + station pins and a mini guide walking it; pins deep-link into the footage |
| `/stations` | Swipeable gallery of all six stations with "Walk there" / "Quick view" |

## Deep links (hash, works from any route)
`#station-<id>` (e.g. `#station-tvs`) · `#floor-up` / `#floor-down` · `#chapter-<id>` (e.g. `#chapter-afterglow`)

## Data flow
- `src/data-gen.ts` is **generated** from `data/stations.json` + `data/beats_*.json` —
  station body text is verbatim from the artists' printed cards. To change facts, edit
  `data/stations.json` and regenerate; do not hand-edit facts in `data-gen.ts`.
- `public/data/` mirrors the same JSON for external consumers.
- Station hotspots: each station has `visibility: [t0, t1]` (seconds, downstairs video)
  and a `track` of normalized keyframes `{t, x, y, w, h}`; the runtime smoothstep-interpolates
  between keyframes and feathers opacity at the window edges. These are manual tracks —
  replace with real tracked polygons if a tracking pass lands later.

## Features
- **Guide companion** (`/guide.png`): state machine (intro / walking / idle after 6 s /
  station teaser / station open), typewriter speech bubbles, tap to dismiss.
  Three personality presets (Hype Host / Curator / Hacker Cool) in Settings, persisted.
- **Settings drawer**: venue audio toggle (muted by default), captions toggle
  (chapter descriptions), personality picker.
- **Ask Hermes**: local, grounded Q&A — keyword matching over the station cards and
  beats only. No network calls, no invented answers.
- **Station overlay**: cinematic dissolve to the hero photo + verbatim card text,
  highlights, photo strip (click to swap hero), copy-link, Ask-Hermes, back-to-walk
  (returns to the exact same video time).
- `prefers-reduced-motion`: faster scrub easing, no typewriter/bob animations.
- Floors auto-advance (scrolling past the end of downstairs moves upstairs); floor
  switch bottom-left.

## QA status (real Chrome via Playwright, `qa/verify.mjs`)
- ✅ Zero console/page errors across all routes
- ✅ Scroll scrub lands in station window; exactly one hotspot visible with sane geometry
- ✅ Hotspot click opens overlay; back returns to walk
- ✅ Deep link `/#station-tvs` seeks to 00:39 and opens the overlay
- ✅ Ask Hermes answers grounded (Mandala query → card-faithful answer)
- ✅ Mobile 390×844 layout verified; caption/floor-switch overlap fixed
- Screenshots: `qa/runs/*.png`

## Known limitations / next steps
- Hotspot tracks are manual keyframes (per parent scope), not SAM-2 tracked polygons.
- Parallax is CSS perspective pan (±26 px / ±3°), not depth-map driven; no depth claims made.
- Videos are the HLG source files; Safari/Chrome render acceptably, but a tone-mapped
  SDR encode (media pipeline's job) would improve color on non-HDR screens.
- "AI camera transitions" are the deterministic fallback (dissolve + hero push), as scoped.

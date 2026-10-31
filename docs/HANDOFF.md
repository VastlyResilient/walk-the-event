# Walk the Event — handoff

## Live deliverables
- https://vastlyresilient.github.io/walk-the-event/ — cinematic rail
- https://vastlyresilient.github.io/walk-the-event/map/ — illustrated route
- https://vastlyresilient.github.io/walk-the-event/stations/ — six-station gallery
- Source: https://github.com/VastlyResilient/walk-the-event
- Real screen-captured portrait and landscape promos in the project root.

## Verified
Production TypeScript/Vite build passes. Live Chrome checks: all six station deep links render the correct station and photographs; no JS page errors; map resolves; six gallery cards resolve; both MP4s return HTTP 206 to range requests; desktop/mobile local suite verifies exact station return times and no horizontal overflow. Vision-reviewed intro, walk, map, gallery, station panel and mobile screens; corrected over-cropped desktop footage, wrong installation image, stale hotspots and router races.

## Source facts
Six breakdowns map to the real footage at 16.5, 39.5, 48, 64.5, 83 and 91 seconds. Artist card text is preserved. Projection artist is Jteve Sobs (confirmed from oriented card). The footage is 8-bit H.264 HLG BT.2020, not HEVC Dolby Vision. Encodes preserve source color metadata and use short GOPs. Audio transcription retained only "Here we go!"; unreliable upstairs output discarded.

## Scope decisions / limitations
- Guide is an original 2D illustrated companion with reactive dialogue, not a rigged 3D character. No mascot reference was supplied.
- Photo pods and deterministic push transitions, not trained Gaussian splats or paid AI-generated transitions. No paid video jobs submitted.
- Station regions are hand-authored interpolated tracks, not SAM masks or metric camera solves. They are not claimed to meet the requested overlay-IoU gate.
- CSS parallax is intentionally limited, not metric depth reconstruction.
- Ask Hermes is grounded local retrieval, not a server LLM proxy.
- `/lab` is cut: monocular footage does not support honest free-roam.
- No physical-device Safari/Android testing or certified 60fps/4G budget result. Full 60-second continuous walk capture not produced; two ~20-second real promo captures are included.
- This delivery does not meet every ≥9 art-director gate in the aspirational master prompt. It is a working footage-first web release with documented fallbacks.

Final deployed CPU card: Persistence 2, 2026 by Morry Kolman. Outro displays and official Hermes Desktop link verified.

## Maintain
`npm install && npm run dev`; `npm run build -- --base=/walk-the-event/` for deployment. `src/data-gen.ts` holds grounded content and tracks. Public media is in `public/`; original source inputs are gitignored. Add a station by adding card/photo evidence to `data/stations.json`, then updating/regenerating `src/data-gen.ts` and its breakdown timestamp/track. Do not invent facts.

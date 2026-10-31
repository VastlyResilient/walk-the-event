
import { STATIONS, CHAPTERS } from "./data-gen";
import type { WalkCtx } from "./walk";
import { stationBody } from "./stationshapes";

// The map is a plan of the show floor. Each station is drawn in the silhouette
// of the actual installation (three LED panels, a 2x3 TV wall, a projection
// wall, a portrait space screen, a merch table, two CPU plinths).
type P = { x: number; y: number; s: number; rot?: number };

const PLACE: Record<string, P> = {
  "led-camera":    { x: 104, y: 650, s: .96, rot: -6 },
  "tvs":           { x: 395, y: 655, s: .92, rot: 8 },
  "projector":     { x: 374, y: 478, s: 1.02, rot: -4 },
  "space-screen":  { x: 170, y: 398, s: .82, rot: 3 },
  "merch":         { x: 134, y: 275, s: .96, rot: 7 },
  "cpu-terminals": { x: 358, y: 168, s: .88, rot: -5 }
};

const ROUTE = "M238 792 C180 770 126 724 118 686 C108 645 150 618 188 600 C240 574 300 585 340 556 C390 520 408 490 380 456 C345 414 270 428 230 400 C185 370 150 340 144 306 C138 270 178 247 216 232 C262 213 312 206 350 182 C390 157 420 140 452 122";

export function mountMap(root: HTMLElement, ctx: WalkCtx): () => void {
  const marks = STATIONS.map(st => {
    const p = PLACE[st.id] || { x: 200, y: 450, s: .8 };
    const scale = 76 * p.s;
    const off = st.id === "tvs";
    const title = st.title || st.label;
    return `<g class="map-station${off ? " off-camera" : ""}" data-go="/#station-${st.id}" transform="translate(${p.x} ${p.y}) rotate(${p.rot || 0})">
      <g class="ms-shape" transform="translate(${-scale/2} ${-scale/2}) scale(${scale/100})">
        <g class="hs-glow">${stationBody(st.id)}</g>
        <g class="hs-line">${stationBody(st.id)}</g>
      </g>
      <circle class="ms-hit" r="46" fill="transparent"/>
      <g class="ms-label" transform="rotate(${-(p.rot || 0)})">
        <text y="${scale/2 + 17}" text-anchor="middle">${title.toUpperCase()}</text>
        <text class="ms-art" y="${scale/2 + 30}" text-anchor="middle">${off ? "off camera · gallery only" : (st.artist || "installation")}</text>
      </g>
    </g>`;
  }).join("");

  const chapters = CHAPTERS.filter(c => c.floor === "down").map(c => {
    const f = c.t / 119;
    return `<circle class="ms-chapter" cx="${120 + 250 * Math.sin(f * Math.PI * 1.2)}" cy="${760 - f * 520}" r="2.2"><title>${c.title}</title></circle>`;
  }).join("");

  root.innerHTML = `
  <div class="map-wrap">
    <div class="map-head">
      <div><p class="eyebrow">The show floor</p><h1 class="map-title">Six works, one walk.</h1></div>
      <p class="map-sub">Downstairs plan, drawn to each work's actual footprint. Tap an outline to stand in front of it.</p>
    </div>
    <div class="map-svg-box">
      <svg viewBox="0 0 560 840" role="img" aria-label="Floor plan with six station silhouettes">
        <defs>
          <linearGradient id="routeg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4fa3"/><stop offset="1" stop-color="#8b5cff"/></linearGradient>
          <radialGradient id="roomg"><stop offset="0" stop-color="#ff4fa3" stop-opacity=".07"/><stop offset="1" stop-color="#8b5cff" stop-opacity="0"/></radialGradient>
          <filter id="soft"><feGaussianBlur stdDeviation="9"/></filter>
        </defs>
        <ellipse cx="280" cy="430" rx="270" ry="400" fill="url(#roomg)"/>
        <path d="M62 806 L34 680 L62 560 L38 440 L76 334 L62 214 L118 112 L242 72 L348 54 L472 86 L510 190 L486 306 L522 444 L486 566 L512 692 L470 806 Z" class="room-wall"/>
        <path d="${ROUTE}" class="route-ghost"/><path d="${ROUTE}" class="route-line"/>
        ${chapters}
        <g class="entry"><circle cx="238" cy="792" r="5"/><text x="252" y="797">ENTRY</text></g>
        <g class="stairs" data-go="/#floor-up"><path d="M440 108 h48 v10 h-48z M452 108 v10 M464 108 v10 M476 108 v10"/><text x="464" y="96" text-anchor="middle">UPSTAIRS</text></g>
        ${marks}
      </svg>
    </div>
    <div class="map-foot"><span><i class="key-shape"></i> station footprint</span><span><i class="key-route"></i> walked route</span><span><i class="key-off"></i> off-camera work</span></div>
  </div>`;

  root.querySelectorAll<SVGGElement>(".map-station,.stairs").forEach(el => {
    el.addEventListener("click", () => {
      const go = (el as SVGGElement).dataset.go!;
      const [path, hash] = go.split("#");
      history.pushState(null, "", import.meta.env.BASE_URL.replace(/\/$/, "") + path + (hash ? `#${hash}` : ""));
      dispatchEvent(new PopStateEvent("popstate"));
    });
  });

  return () => {};
}

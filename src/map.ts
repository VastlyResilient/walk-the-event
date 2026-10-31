
import { STATIONS, CHAPTERS, FLOORS } from "./data-gen";
import type { WalkCtx } from "./walk";

// Illustrated route: a stylized serpentine path (vector, not a scan) with pins.
export function mountMap(root: HTMLElement, ctx: WalkCtx): () => void {
  const dur = FLOORS.down.duration;
  // path waypoints (viewBox 0 0 400 760), serpentine walk
  const pts: [number, number][] = [
    [200, 720],[120, 690],[90, 630],[110, 560],[190, 520],[280, 500],[310, 430],
    [280, 360],[200, 330],[130, 300],[100, 230],[130, 160],[210, 130],[290, 110],[300, 50],
  ];
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");

  function pointAt(f: number): [number, number] {
    // sample along polyline
    const segs: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
      segs.push(d); total += d;
    }
    let want = f * total;
    for (let i = 1; i < pts.length; i++) {
      if (want <= segs[i-1]) {
        const t = want / segs[i-1];
        return [pts[i-1][0] + (pts[i][0]-pts[i-1][0]) * t, pts[i-1][1] + (pts[i][1]-pts[i-1][1]) * t];
      }
      want -= segs[i-1];
    }
    return pts[pts.length-1];
  }

  const chPins = CHAPTERS.filter(c => c.floor === "down").map(c => {
    const [x, y] = pointAt(c.t / dur);
    return `<g class="pin chapter" data-go="/#chapter-${c.id}">
      <circle class="core" cx="${x}" cy="${y}" r="4.5"/>
      <text x="${x + 11}" y="${y + 3.5}">${c.title}</text></g>`;
  }).join("");

  const stPins = STATIONS.map(st => {
    const [x, y] = pointAt(st.timestamp / dur);
    return `<g class="pin" data-go="/#station-${st.id}">
      <circle class="halo" cx="${x}" cy="${y}" r="7"/>
      <circle class="core" cx="${x}" cy="${y}" r="5.5"/>
      <text x="${x - 11}" y="${y + 3.5}" text-anchor="end" fill="#ff4fa3">${st.title || st.label}</text></g>`;
  }).join("");

  root.innerHTML = `
    <div class="map-wrap">
      <h1 class="map-title">The Route</h1>
      <p class="map-sub">Downstairs, as walked. Tap a pin to fly there in the footage.</p>
      <div class="map-svg-box">
        <svg viewBox="0 0 400 760" role="img" aria-label="Illustrated venue route map">
          <defs>
            <linearGradient id="rg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stop-color="#ff4fa3"/><stop offset="1" stop-color="#8b5cff"/>
            </linearGradient>
          </defs>
          <rect x="30" y="20" width="340" height="720" rx="28" fill="none" stroke="rgba(255,255,255,0.08)"/>
          <path d="${path}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${path}" fill="none" stroke="url(#rg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 7"/>
          ${chPins}${stPins}
          <g class="pin" data-go="/#floor-up">
            <circle class="core" cx="300" cy="36" r="5.5" style="fill:#8b5cff"/>
            <text x="288" y="40" text-anchor="end">Upstairs →</text>
          </g>
          <image class="map-guide" id="mapguide" href="/guide.png" x="188" y="700" width="26" height="40"/>
        </svg>
      </div>
      <p class="map-sub" style="margin-top:22px">Pins in pink are stations · violet dots are chapters</p>
    </div>`;

  // mini guide walking the map
  const guide = root.querySelector<SVGImageElement>("#mapguide")!;
  let t = 0, raf = 0, destroyed = false;
  const step = () => {
    if (destroyed) return;
    t = (t + 0.00035) % 1;
    const [x, y] = pointAt(t);
    guide.setAttribute("x", String(x - 13));
    guide.setAttribute("y", String(y - 38));
    raf = requestAnimationFrame(step);
  };
  if (!ctx.reducedMotion()) raf = requestAnimationFrame(step);
  else { const [x, y] = pointAt(0.02); guide.setAttribute("x", String(x - 13)); guide.setAttribute("y", String(y - 38)); }

  root.querySelectorAll<SVGGElement>(".pin").forEach(p =>
    p.addEventListener("click", () => {
      const go = p.dataset.go!;
      const [path, hash] = go.split("#");
      history.pushState(null, "", path + (hash ? `#${hash}` : ""));
      // trigger route through popstate-style navigation in main
      dispatchEvent(new PopStateEvent("popstate"));
      if (hash) history.replaceState(null, "", go);
    }));

  return () => { destroyed = true; cancelAnimationFrame(raf); };
}

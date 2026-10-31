
import { STATIONS, CHAPTERS, FLOORS, type Floor, type Station, type Chapter } from "./data-gen";
import { LINES, type Personality } from "./guide";
import type { CharacterRig } from "./character";
import { stationShape } from "./stationshapes";

export interface WalkCtx {
  openStation(st: Station, returnTime: number): void;
  say(text: string, hacker?: boolean): void;
  setPersonality(p: Personality): void;
  getPersonality(): Personality;
  captionsOn(): boolean;
  setCaption(text: string): void;
  audioOn(): boolean;
  applyAudio(video: HTMLVideoElement): void;
  reducedMotion(): boolean;
  go(path: string, hash?: string): void;
  char: CharacterRig;
}

const VIDEO_AR = 1080 / 1920;

export function mountWalk(root: HTMLElement, ctx: WalkCtx): () => void {
  root.innerHTML = `
    <div class="stage" id="stage">
      <div class="video-frame" id="vframe"><video id="vid" playsinline muted preload="auto"></video></div>
      <div class="vignette"></div>
      <div id="hotspots"></div>
      <div class="timecode" id="timecode">00:00</div>
      <div class="chapter-name" id="chname"></div>
    </div>
    <div class="rail"><div class="rail-inner" id="rail">
      <div class="line" style="position:absolute;inset:0 auto 0 50%;width:2px;margin-left:-1px;background:rgba(255,255,255,0.12)">
        <div class="fill" id="railfill" style="height:0%"></div>
      </div>
    </div></div>
    <div class="floor-switch" id="floorsw">
      <button data-floor="down" class="on">Downstairs</button>
      <button data-floor="up">Upstairs</button>
    </div>
    <div class="hint" id="hint"><div class="wheel"></div><span>Scroll to walk · drag to look</span></div>
  `;

  const stage = root.querySelector<HTMLDivElement>("#stage")!;
  const vframe = root.querySelector<HTMLDivElement>("#vframe")!;
  const video = root.querySelector<HTMLVideoElement>("#vid")!;
  const hsBox = root.querySelector<HTMLDivElement>("#hotspots")!;
  const timecode = root.querySelector<HTMLDivElement>("#timecode")!;
  const chname = root.querySelector<HTMLDivElement>("#chname")!;
  const railInner = root.querySelector<HTMLDivElement>("#rail")!;
  const railFill = root.querySelector<HTMLDivElement>("#railfill")!;
  const hint = root.querySelector<HTMLDivElement>("#hint")!;
  const floorSw = root.querySelector<HTMLDivElement>("#floorsw")!;
  const guideEl = document.getElementById("guide") as HTMLDivElement | null;

  // ---- venue-matched character lighting ----
  const lightCanvas = document.createElement("canvas");
  lightCanvas.width = 24; lightCanvas.height = 36;
  const lctx = lightCanvas.getContext("2d", { willReadFrequently: true });
  let lastLightSample = 0;
  function sampleVenueLight(now: number) {
    if (!lctx || now - lastLightSample < 420 || video.readyState < 2) return;
    lastLightSample = now;
    try {
      lctx.drawImage(video, 0, 0, lightCanvas.width, lightCanvas.height);
      const W = lightCanvas.width, H = lightCanvas.height;
      const d = lctx.getImageData(0, 0, W, H).data;
      const avg = (x0: number, x1: number, y0: number, y1: number) => {
        let r = 0, g = 0, b = 0, w = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          const rr = d[i], gg = d[i + 1], bb = d[i + 2];
          const luma = .2126 * rr + .7152 * gg + .0722 * bb;
          if (luma < 14) continue;
          const wt = Math.min(1, luma / 120);
          r += rr * wt; g += gg * wt; b += bb * wt; w += wt;
        }
        return w > 2 ? { r: Math.min(1, (r / w) / 150), g: Math.min(1, (g / w) / 150), b: Math.min(1, (b / w) / 150), w } : null;
      };
      // key light from the wall/screen field in front of her
      const k = avg(0, W, Math.floor(H * .40), Math.floor(H * .76));
      if (k) {
        const luma = (.2126 * k.r + .7152 * k.g + .0722 * k.b);
        ctx.char.setLight([k.r, k.g, k.b], Math.min(1, .35 + luma));
      }
      // actual floor under her left-side footprint, bottom of frame
      const f = avg(0, Math.floor(W * .42), Math.floor(H * .84), H);
      if (f) {
        const fl = (.2126 * f.r + .7152 * f.g + .0722 * f.b);
        ctx.char.setGround([f.r, f.g, f.b], Math.min(1, fl));
      }
    } catch { /* same-origin video; ignore transient taint */ }
  }

  function placeGuide(r: {x:number;y:number;w:number;h:number}) {
    if (!guideEl) return;
    const landscape = vframe.classList.contains("landscape");
    const gw = Math.max(104, Math.min(198, r.h * (landscape ? .205 : .31)));
    const gh = gw * 1.92;
    const floorY = r.y + r.h * (landscape ? .885 : .935);
    guideEl.style.position = "fixed";
    guideEl.style.left = `${Math.max(4, r.x + r.w * (landscape ? .085 : .04))}px`;
    guideEl.style.top = `${floorY - gh}px`;
    guideEl.style.bottom = "auto";
    guideEl.style.width = `${gw}px`;
    guideEl.style.height = `${gh}px`;
  }

  const state = {
    floor: "down" as Floor,
    target: 0, cur: 0, panX: 0, panY: 0, panTX: 0, panTY: 0,
    chapter: "" as string, lastMove: performance.now(), moved: false,
    stationTeaser: "" as string, raf: 0, destroyed: false, idleFired: false,
  };

  video.src = FLOORS.down.src;
  video.pause();
  ctx.applyAudio(video);
  if (innerWidth / innerHeight > 1.1) vframe.classList.add("landscape");

  // ---- hotspots ----
  const hsEls = new Map<string, HTMLDivElement>();
  for (const st of STATIONS) {
    const el = document.createElement("div");
    el.className = "hotspot off";
    el.innerHTML = `${stationShape(st.id, st.label)}<span class="tag">${st.label} · tap the outline</span>`;
    el.addEventListener("click", () => ctx.openStation(st, state.cur));
    hsBox.appendChild(el);
    hsEls.set(st.id, el);
  }

  function pick(l: Record<Personality, string>) { return l[ctx.getPersonality()]; }

  function trackAt(st: Station, t: number) {
    const k = st.track;
    if (t <= k[0].t) return k[0];
    if (t >= k[k.length - 1].t) return k[k.length - 1];
    for (let i = 0; i < k.length - 1; i++) {
      if (t >= k[i].t && t <= k[i + 1].t) {
        const f = (t - k[i].t) / (k[i + 1].t - k[i].t);
        const e = f * f * (3 - 2 * f); // smoothstep
        return {
          t, x: k[i].x + (k[i + 1].x - k[i].x) * e, y: k[i].y + (k[i + 1].y - k[i].y) * e,
          w: k[i].w + (k[i + 1].w - k[i].w) * e, h: k[i].h + (k[i + 1].h - k[i].h) * e,
        };
      }
    }
    return k[0];
  }

  // Map normalized video coords → container px, matching object-fit + 6% overscan
  function contentRect() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const landscape = vframe.classList.contains("landscape");
    let cw: number, ch: number;
    if (landscape) { // contain
      ch = H; cw = ch * VIDEO_AR;
      if (cw > W) { cw = W; ch = cw / VIDEO_AR; }
    } else { // cover
      cw = W; ch = cw / VIDEO_AR;
      if (ch < H) { ch = H; cw = ch * VIDEO_AR; }
    }
    const s = 1.06;
    const w2 = cw * s, h2 = ch * s;
    return { x: (W - w2) / 2, y: (H - h2) / 2, w: w2, h: h2 };
  }

  // ---- rail ticks ----
  function buildRail() {
    railInner.querySelectorAll(".tick").forEach(e => e.remove());
    const dur = FLOORS[state.floor].duration;
    const items: { t: number; cls: string; label: string; go: () => void }[] = [];
    for (const c of CHAPTERS.filter(c => c.floor === state.floor))
      items.push({ t: c.t, cls: "chapter", label: c.title, go: () => seekTo(c.t) });
    if (state.floor === "down")
      for (const st of STATIONS)
        items.push({ t: st.timestamp, cls: "station", label: st.title || st.label, go: () => seekTo(st.timestamp) });
    items.sort((a, b) => a.t - b.t);
    for (const it of items) {
      const el = document.createElement("button");
      el.className = `tick ${it.cls}`;
      el.style.position = "absolute";
      el.style.top = `calc(${(it.t / dur) * 100}% - 10px)`;
      el.innerHTML = `<span class="lbl">${it.label}</span>`;
      el.addEventListener("click", it.go);
      el.dataset.t = String(it.t);
      railInner.appendChild(el);
    }
  }

  function seekTo(t: number) {
    state.target = Math.max(0, Math.min(FLOORS[state.floor].duration - 0.1, t));
    state.cur = state.target; // jump cut for explicit navigation
    // A deep link can arrive before the video has metadata. Applying currentTime
    // too early is silently discarded, leaving the walk at 0:00.
    if (video.readyState >= 1) video.currentTime = state.cur;
    else video.addEventListener("loadedmetadata", () => { video.currentTime = state.cur; }, { once: true });
    state.lastMove = performance.now();
  }

  function setFloor(f: Floor, t = 0) {
    if (f === state.floor && t === 0) return;
    state.floor = f;
    video.src = FLOORS[f].src;
    video.load();
    state.cur = state.target = t;
    video.addEventListener("loadeddata", () => { video.currentTime = t; }, { once: true });
    floorSw.querySelectorAll("button").forEach(b =>
      b.classList.toggle("on", (b as HTMLButtonElement).dataset.floor === f));
    buildRail();
    hsEls.forEach(el => el.classList.add("off"));
    ctx.say(f === "up" ? pick(LINES.upstairs) : pick(LINES.intro));
  }

  floorSw.querySelectorAll("button").forEach(b =>
    b.addEventListener("click", () => {
      const f = (b as HTMLButtonElement).dataset.floor as Floor;
      if (f !== state.floor) setFloor(f);
    }));

  // ---- input: wheel / keys / touch ----
  const SPEED = 0.0028; // seconds per wheel deltaY unit
  function nudge(d: number) {
    state.target = Math.max(0, Math.min(FLOORS[state.floor].duration - 0.1, state.target + d));
    state.lastMove = performance.now();
    if (!state.moved) { state.moved = true; hint.style.opacity = "0"; }
    if (state.idleFired) state.idleFired = false;
    // floor edge: rolling past the end of downstairs suggests upstairs
    if (state.floor === "down" && state.target >= FLOORS.down.duration - 0.2) setFloor("up");
  }
  const onWheel = (e: WheelEvent) => { e.preventDefault(); nudge(e.deltaY * SPEED * 3); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key.toLowerCase() === "s" || e.key.toLowerCase() === "d") { e.preventDefault(); nudge(0.9); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key.toLowerCase() === "w" || e.key.toLowerCase() === "a") { e.preventDefault(); nudge(-0.9); }
    if (e.key === " ") { e.preventDefault(); nudge(3); }
  };
  let touchY: number | null = null, panSX = 0, panSY = 0;
  const onTS = (e: TouchEvent) => {
    if (e.touches.length === 1) { touchY = e.touches[0].clientY; panSX = e.touches[0].clientX; panSY = e.touches[0].clientY; }
  };
  const onTM = (e: TouchEvent) => {
    if (e.touches.length !== 1 || touchY === null) return;
    e.preventDefault();
    const y = e.touches[0].clientY, dy = touchY - y; touchY = y;
    nudge(dy * 0.012);
    state.panTX = clamp((e.touches[0].clientX - panSX) * -0.15, -26, 26);
    state.panTY = clamp((e.touches[0].clientY - panSY) * -0.15, -20, 20);
  };
  const onTE = () => { touchY = null; state.panTX = 0; state.panTY = 0; };
  // mouse drag parallax (desktop look-around)
  let mdown = false, mSX = 0, mSY = 0, mMoved = 0;
  const onMD = (e: MouseEvent) => { if ((e.target as HTMLElement).closest(".hotspot")) return; mdown = true; mSX = e.clientX; mSY = e.clientY; mMoved = 0; };
  const onMM = (e: MouseEvent) => {
    if (!mdown) return;
    mMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
    state.panTX = clamp((e.clientX - mSX) * -0.12, -26, 26);
    state.panTY = clamp((e.clientY - mSY) * -0.12, -20, 20);
  };
  const onMU = () => { mdown = false; state.panTX = 0; state.panTY = 0; };
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  stage.addEventListener("wheel", onWheel, { passive: false });
  addEventListener("keydown", onKey);
  stage.addEventListener("touchstart", onTS, { passive: true });
  stage.addEventListener("touchmove", onTM, { passive: false });
  stage.addEventListener("touchend", onTE);
  stage.addEventListener("mousedown", onMD);
  addEventListener("mousemove", onMM);
  addEventListener("mouseup", onMU);

  // ---- main loop ----
  let lastFwdLine = 0, outroShown = false;
  function loop() {
    if (state.destroyed) return;
    const diff = state.target - state.cur;
    if (Math.abs(diff) > 0.005) {
      state.cur += diff * (ctx.reducedMotion() ? 0.3 : 0.09);
      if (Math.abs(video.currentTime - state.cur) > 1 / 30) video.currentTime = state.cur;
      state.lastMove = performance.now();
    }
    // parallax easing
    state.panX += (state.panTX - state.panX) * 0.1;
    state.panY += (state.panTY - state.panY) * 0.1;
    vframe.style.transform = "none"; // keep video geometry fixed: overlays are positioned from contentRect and must not drift

    // timecode + progress
    const dur = FLOORS[state.floor].duration;
    const mm = String(Math.floor(state.cur / 60)).padStart(2, "0");
    const ss = String(Math.floor(state.cur % 60)).padStart(2, "0");
    timecode.textContent = `${FLOORS[state.floor].name} · ${mm}:${ss}`;
    railFill.style.height = `${(state.cur / dur) * 100}%`;
    railInner.querySelectorAll<HTMLElement>(".tick").forEach(t =>
      t.classList.toggle("on", Math.abs(Number(t.dataset.t) - state.cur) < dur * 0.03));

    // chapter detection
    const chs = CHAPTERS.filter(c => c.floor === state.floor);
    let cur: Chapter | null = null;
    for (const c of chs) if (state.cur >= c.t) cur = c;
    if (cur && cur.id !== state.chapter) {
      state.chapter = cur.id;
      chname.textContent = cur.title;
      chname.classList.add("show");
      setTimeout(() => chname.classList.remove("show"), 3200);
      if (ctx.captionsOn()) ctx.setCaption(`${cur.title} — ${cur.desc}`);
    }

    // hotspots
    const r = contentRect();
    for (const st of STATIONS) {
      const el = hsEls.get(st.id)!;
      const [a, b] = st.visibility;
      const visible = st.id !== "tvs" && state.floor === "down" && state.cur >= a - 0.5 && state.cur <= b + 0.5;
      if (!visible) { el.classList.add("off"); el.style.opacity = "0"; continue; }
      const k = trackAt(st, state.cur);
      el.style.left = `${r.x + k.x * r.w - (k.w * r.w) / 2}px`;
      el.style.top = `${r.y + k.y * r.h - (k.h * r.h) / 2}px`;
      el.style.width = `${k.w * r.w}px`;
      el.style.height = `${k.h * r.h}px`;
      const feather = Math.min(1, (state.cur - (a - 0.5)) / 1.5, ((b + 0.5) - state.cur) / 1.5);
      el.style.opacity = String(Math.max(0, feather));
      el.classList.remove("off");
      if (state.cur >= a && state.cur <= b && state.stationTeaser !== st.id) {
        state.stationTeaser = st.id;
        ctx.say(pick(LINES.station[st.id].teaser));
      }
    }

    // idle / forward chatter
    const idleFor = performance.now() - state.lastMove;
    if (idleFor > 6000 && !state.idleFired) {
      state.idleFired = true;
      ctx.say(pick(LINES.idle[Math.floor(Math.random() * LINES.idle.length)]));
    } else if (Math.abs(diff) > 0.5 && performance.now() - lastFwdLine > 14000 && Math.random() < 0.01) {
      lastFwdLine = performance.now();
      ctx.say(pick(LINES.forward[Math.floor(Math.random() * LINES.forward.length)]));
    }
    // grounded character: walks with the scroll, stands on the venue floor
    placeGuide(r);
    ctx.char.setMoving(Math.min(1, Math.abs(diff) * 2.6));
    sampleVenueLight(performance.now());

    // outro at very end of upstairs
    if (state.floor === "up" && state.cur >= dur - 0.3) {
      ctx.say(pick(LINES.outro));
      state.target = dur - 1.5;
      if (!outroShown) { outroShown = true; setTimeout(() => { if (!state.destroyed) dispatchEvent(new Event("wte:outro")); }, 1600); }
    }

    state.raf = requestAnimationFrame(loop);
  }
  state.raf = requestAnimationFrame(loop);
  buildRail();

  // ---- deep links: also handle hash-only changes on the same document ----
  let deepLinkTimer = 0;
  function applyHash() {
    clearTimeout(deepLinkTimer);
    removeEventListener("hashchange", applyHash);
    const hash = location.hash;
    if (hash.startsWith("#station-")) {
      const st = STATIONS.find(s => s.id === hash.slice(9));
      if (st) {
        if (state.floor !== "down") setFloor("down", st.timestamp); else seekTo(st.timestamp);
        deepLinkTimer = window.setTimeout(() => { if (!state.destroyed) ctx.openStation(st, st.timestamp); }, 900);
      }
    } else if (hash === "#floor-up") setFloor("up");
    else if (hash === "#floor-down") setFloor("down");
    else if (hash.startsWith("#chapter-")) {
      const c = CHAPTERS.find(c => c.id === hash.slice(9));
      if (c) { if (c.floor !== state.floor) setFloor(c.floor, c.t); else seekTo(c.t); }
    }
  }
  applyHash();
  addEventListener("hashchange", applyHash);

  return () => {
    state.destroyed = true;
    clearTimeout(deepLinkTimer);
    removeEventListener("hashchange", applyHash);
    cancelAnimationFrame(state.raf);
    stage.removeEventListener("wheel", onWheel);
    removeEventListener("keydown", onKey);
    stage.removeEventListener("touchstart", onTS);
    stage.removeEventListener("touchmove", onTM);
    stage.removeEventListener("touchend", onTE);
    stage.removeEventListener("mousedown", onMD);
    removeEventListener("mousemove", onMM);
    removeEventListener("mouseup", onMU);
    video.pause(); video.removeAttribute("src"); video.load();
  };
}

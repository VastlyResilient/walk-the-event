
import "./styles.css";
import { mountWalk, type WalkCtx } from "./walk";
import { mountMap } from "./map";
import { mountGallery } from "./gallery";
import type { Station } from "./data-gen";
import { LINES, PERSONALITIES, askHermes, type Personality } from "./guide";

const BASE = import.meta.env.BASE_URL;
const app = document.getElementById("app")!;

// ---------- persistent settings ----------
const store = {
  get personality(): Personality { return (localStorage.getItem("wte-persona") as Personality) || "hype"; },
  set personality(p: Personality) { localStorage.setItem("wte-persona", p); },
  get audio() { return localStorage.getItem("wte-audio") === "1"; },
  set audio(v: boolean) { localStorage.setItem("wte-audio", v ? "1" : "0"); },
  get captions() { return localStorage.getItem("wte-captions") !== "0"; },
  set captions(v: boolean) { localStorage.setItem("wte-captions", v ? "1" : "0"); },
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// ---------- shell ----------
app.innerHTML = `
  <div class="topbar">
    <a class="brand" href="/" data-nav><span class="dot"></span><span><span class="name">Walk the Event</span><br/><span class="sub">Nous Research · NYC</span></span></a>
    <div class="nav">
      <a href="/" data-nav data-route="/">Walk</a>
      <a href="/map" data-nav data-route="/map">Map</a>
      <a href="/stations" data-nav data-route="/stations">Stations</a>
      <button id="ask-btn" title="Ask Hermes">Ask</button>
      <button id="set-btn" class="icon-btn" title="Settings">⚙</button>
    </div>
  </div>
  <div id="view" style="position:absolute;inset:0"></div>
  <div class="guide" id="guide"><img src="${BASE}guide.png" alt="Hermes, your guide"/></div>
  <div class="bubble" id="bubble" style="display:none"></div>
  <div id="captionbar" style="position:fixed;left:50%;bottom:calc(14px + var(--safe-b));transform:translateX(-50%);z-index:36;max-width:min(640px,86vw);text-align:center;font-size:12.5px;color:var(--txt);background:rgba(8,8,13,0.72);border:1px solid var(--line);border-radius:10px;padding:7px 14px;backdrop-filter:blur(8px);display:none"></div>
  <div class="overlay" id="overlay"><button class="icon-btn close-x" id="ov-close">✕</button><div id="ov-body" style="width:100%;display:grid;place-items:center"></div></div>
  <div class="drawer" id="settings"><h3>Settings</h3>
    <div class="set-row"><div class="lbl">Venue audio<small>Original ambience, off by default</small></div><button class="toggle" id="tg-audio"></button></div>
    <div class="set-row"><div class="lbl">Captions<small>Chapter descriptions as you walk</small></div><button class="toggle" id="tg-captions"></button></div>
    <div style="margin-top:18px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--txt-dim)">Guide personality</div>
    <div class="persona" id="personas"></div>
    <p class="ask-note">Guide: Hermes, © Nous Research. Footage shot at the event. Station text transcribed from the artists' printed cards.</p>
  </div>
  <div class="drawer" id="ask"><h3>Ask Hermes</h3>
    <div class="ask-log" id="ask-log"></div>
    <form class="ask-form" id="ask-form"><input id="ask-in" placeholder="Ask about any station…" autocomplete="off"/><button class="btn primary" type="submit">Ask</button></form>
    <p class="ask-note">Answers are grounded only in the stations' printed cards and footage notes — nothing is invented.</p>
  </div>
  <div class="curtain outro" id="outro" style="display:none">
    <div><div class="g"><img src="${BASE}guide.png" alt=""/></div><div class="kicker">YOU MADE IT</div><h1>See you<br/><em>next time.</em></h1><p>You didn't have to be there to feel it.</p><div class="outro-actions"><a class="btn primary" href="https://hermes-agent.nousresearch.com/desktop" target="_blank" rel="noopener">Get Hermes Desktop</a><button class="btn" id="outro-share">Share the walk</button><button class="btn" id="outro-replay">Walk again</button></div><div class="credits">Real footage · Deterministic photo transitions · No venue reconstruction<br/>Hermes guide character © Nous Research · Artist text from the event cards</div></div>
  </div>
  <div class="curtain" id="intro">
    <div>
      <div class="g"><img src="${BASE}guide.png" alt=""/></div>
      <h1>You missed it.<br/><em>Walk it anyway.</em></h1>
      <p>The Nous Research event, from the real footage — with Hermes as your guide.</p>
      <button class="btn primary" id="start-btn" style="font-size:13px;padding:14px 34px">Start the walk</button>
      <div class="credits">Footage · Nous Research event, NYC<br/>Guide character © Nous Research<br/>Built with the real video — no reconstruction</div>
    </div>
  </div>
`;

const view = document.getElementById("view")!;
const guideEl = document.getElementById("guide")!;
const bubble = document.getElementById("bubble")!;
const captionbar = document.getElementById("captionbar")!;

// ---------- guide bubble (typewriter) ----------
let bubbleTimer: number | undefined;
function say(text: string) {
  clearTimeout(bubbleTimer);
  bubble.className = "bubble" + (store.personality === "hacker" ? " hacker" : "");
  bubble.style.display = "block";
  bubble.innerHTML = `<span class="txt"></span><span class="skip">tap to dismiss</span>`;
  const txt = bubble.querySelector(".txt")!;
  const gr = guideEl.getBoundingClientRect();
  bubble.style.left = `${Math.max(12, Math.min(innerWidth - Math.min(300, innerWidth * .72) - 12, gr.right - 10))}px`;
  bubble.style.bottom = `${innerHeight - gr.top + 6}px`;
  let i = 0;
  const type = () => {
    if (i <= text.length) { txt.textContent = text.slice(0, i++); bubbleTimer = setTimeout(type, 18); }
    else bubbleTimer = setTimeout(hideBubble, 5200);
  };
  if (reduced.matches) { txt.textContent = text; bubbleTimer = setTimeout(hideBubble, 5200); } else type();
}
function hideBubble() { bubble.style.display = "none"; }
bubble.addEventListener("click", hideBubble);

// ---------- station overlay ----------
const overlay = document.getElementById("overlay")!;
const ovBody = document.getElementById("ov-body")!;
let overlayReturn: number | null = null;
let reopenWalk: (() => void) | null = null;

function openStation(st: Station, returnTime: number) {
  overlayReturn = returnTime;
  history.replaceState(null, "", `${location.pathname}#station-${st.id}`);
  const card = st.body;
  ovBody.innerHTML = `
    <div class="station-card">
      <div class="station-hero"><img src="${st.hero}" alt="${st.title || st.label}"/><div class="sw"></div></div>
      <div class="station-body">
        <div class="kicker">${st.label}</div>
        <h2>${st.title || st.label}</h2>
        <div class="one">${st.oneLiner}</div>
        <div class="body" style="white-space:pre-line">${card}</div>
        <div class="hl">${st.highlights.map(h => `<span>${h}</span>`).join("")}</div>
        <div class="photostrip">${st.photos.map(p => `<img src="${p}" data-full="${p}" alt=""/>`).join("")}</div>
        <div class="station-actions">
          <button class="btn primary" id="ov-ask">Ask Hermes about this</button>
          <button class="btn" id="ov-share">Copy link</button>
          <button class="btn" id="ov-back">← Back to the walk</button>
        </div>
      </div>
    </div>`;
  overlay.classList.add("open");
  say(LINES.station[st.id].open[store.personality]);
  document.getElementById("ov-back")!.addEventListener("click", closeOverlay);
  document.getElementById("ov-ask")!.addEventListener("click", () => {
    closeOverlay();
    openDrawer("ask");
    ask(`Tell me about ${st.title || st.label}`);
  });
  document.getElementById("ov-share")!.addEventListener("click", async (e) => {
    const url = `${location.origin}${location.pathname}#station-${st.id}`;
    try { await navigator.clipboard.writeText(url); (e.target as HTMLElement).textContent = "Copied ✓"; }
    catch { (e.target as HTMLElement).textContent = url; }
  });
  ovBody.querySelectorAll<HTMLImageElement>(".photostrip img").forEach(img =>
    img.addEventListener("click", () => {
      const hero = ovBody.querySelector<HTMLImageElement>(".station-hero img")!;
      const tmp = hero.src; hero.src = img.src; img.src = tmp;
    }));
}
function closeOverlay() {
  if (!overlay.classList.contains("open")) return;
  overlay.classList.remove("open");
  history.replaceState(null, "", location.pathname);
  if (overlayReturn !== null && reopenWalk) reopenWalk();
}
document.getElementById("ov-close")!.addEventListener("click", closeOverlay);
addEventListener("keydown", e => { if (e.key === "Escape") { closeOverlay(); closeDrawers(); } });

// ---------- drawers ----------
const settingsD = document.getElementById("settings")!;
const askD = document.getElementById("ask")!;
function openDrawer(which: "settings" | "ask") {
  settingsD.classList.toggle("open", which === "settings");
  askD.classList.toggle("open", which === "ask");
}
function closeDrawers() { settingsD.classList.remove("open"); askD.classList.remove("open"); }
document.getElementById("set-btn")!.addEventListener("click", () => openDrawer("settings"));
document.getElementById("ask-btn")!.addEventListener("click", () => openDrawer("ask"));

// settings wiring
const tgA = document.getElementById("tg-audio")!, tgC = document.getElementById("tg-captions")!;
function syncToggles() {
  tgA.classList.toggle("on", store.audio);
  tgC.classList.toggle("on", store.captions);
  captionbar.style.display = store.captions && captionbar.textContent ? "block" : "none";
}
tgA.addEventListener("click", () => { store.audio = !store.audio; syncToggles(); applyAudio(); });
tgC.addEventListener("click", () => { store.captions = !store.captions; syncToggles(); });
function applyAudio(video?: HTMLVideoElement) {
  document.querySelectorAll("video").forEach(v => { v.muted = !store.audio; if (store.audio) v.volume = 0.7; });
  if (video) { video.muted = !store.audio; }
}
const personas = document.getElementById("personas")!;
for (const [key, p] of Object.entries(PERSONALITIES) as [Personality, typeof PERSONALITIES[Personality]][]) {
  const b = document.createElement("button");
  b.innerHTML = `<b>${p.name}</b><small>${p.blurb}</small>`;
  b.classList.toggle("on", store.personality === key);
  b.addEventListener("click", () => {
    store.personality = key;
    personas.querySelectorAll("button").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    say(LINES.intro[key]);
  });
  personas.appendChild(b);
}
syncToggles();

// ---------- ask ----------
const askLog = document.getElementById("ask-log")!;
const askForm = document.getElementById("ask-form")!;
const askIn = document.getElementById("ask-in") as HTMLInputElement;
function ask(q: string) {
  const qEl = document.createElement("div"); qEl.className = "ask-q"; qEl.textContent = q; askLog.appendChild(qEl);
  const a = askHermes(q);
  const aEl = document.createElement("div"); aEl.className = "ask-a"; aEl.textContent = a; askLog.appendChild(aEl);
  askLog.scrollTop = askLog.scrollHeight;
  say(a.length > 140 ? a.slice(0, 137) + "…" : a);
}
askForm.addEventListener("submit", e => {
  e.preventDefault();
  const q = askIn.value.trim();
  if (q) { ask(q); askIn.value = ""; }
});

// ---------- router ----------
let unmount: (() => void) | null = null;
const ctx: WalkCtx = {
  openStation,
  say,
  setPersonality: p => { store.personality = p; },
  getPersonality: () => store.personality,
  captionsOn: () => store.captions,
  setCaption: t => { captionbar.textContent = t; captionbar.style.display = store.captions ? "block" : "none"; },
  audioOn: () => store.audio,
  applyAudio,
  reducedMotion: () => reduced.matches,
  go: navigate,
};

function navigate(path: string) {
  if (path === location.pathname) return;
  history.pushState(null, "", BASE.replace(/\/$/, "") + path);
  route();
}
function route() {
  closeOverlay(); overlayReturn = null; ovBody.innerHTML = "";
  unmount?.(); unmount = null; reopenWalk = null;
  closeOverlay(); closeDrawers();
  const path = location.pathname.endsWith("/map") ? "/map" : location.pathname.endsWith("/stations") ? "/stations" : "/";
  document.querySelectorAll(".nav a[data-route]").forEach(a =>
    a.classList.toggle("active", (a as HTMLElement).dataset.route === path));
  guideEl.style.display = path === "/stations" ? "none" : "block";
  if (path === "/map") unmount = mountMap(view, ctx);
  else if (path === "/stations") unmount = mountGallery(view, ctx);
  else unmount = mountWalk(view, ctx);
}
addEventListener("popstate", route);
addEventListener("hashchange", route);
document.addEventListener("click", e => {
  const a = (e.target as HTMLElement).closest("a[data-nav]");
  if (a) { e.preventDefault(); navigate(a.getAttribute("href")!); }
});

// ---------- intro ----------
const intro = document.getElementById("intro")!;
document.getElementById("start-btn")!.addEventListener("click", () => {
  intro.classList.add("gone");
  say(LINES.intro[store.personality]);
  if (store.audio) applyAudio();
});
if (!(location.pathname.endsWith("/") && !location.pathname.endsWith("/map/") && !location.pathname.endsWith("/stations/")) || location.hash) intro.classList.add("gone");

document.getElementById("outro-replay")!.addEventListener("click", () => { document.getElementById("outro")!.style.display = "none"; navigate("/"); });
document.getElementById("outro-share")!.addEventListener("click", async e => { try { await navigator.clipboard.writeText(location.href.split("#")[0]); (e.target as HTMLElement).textContent = "Link copied ✓"; } catch {} });
addEventListener("wte:outro", () => { (document.getElementById("outro") as HTMLElement).style.display = "grid"; });
route();


import { STATIONS, type Station } from "./data-gen";

export type Personality = "hype" | "curator" | "hacker";
export const PERSONALITIES: Record<Personality, { name: string; blurb: string }> = {
  hype:    { name: "Hype Host",   blurb: "Energetic, playful" },
  curator: { name: "Curator",     blurb: "Calm, insightful" },
  hacker:  { name: "Hacker Cool", blurb: "Dry wit, terminal-flavored" },
};
type L = Record<Personality, string>;

export const LINES: {
  intro: L; upstairs: L; outro: L;
  idle: L[]; forward: L[];
  station: Record<string, { teaser: L; open: L; close: L }>;
} = {
  intro: {
    hype: "You missed it?? No stress — I'll walk you through. Scroll to move!",
    curator: "Welcome. I'll guide you through the evening, room by room.",
    hacker: "boot ok. scroll = walk. let's go.",
  },
  upstairs: {
    hype: "Upstairs! No stations — just light and views. Race you!",
    curator: "The upper floor. No installations; notice the space itself.",
    hacker: "cd ../upstairs — 0 stations, 100% ambience.",
  },
  outro: {
    hype: "That's the whole venue! You basically came.",
    curator: "That concludes the walk. Thank you for coming.",
    hacker: "walk complete. exit 0.",
  },
  idle: [
    { hype: "Still there? The good stuff is ahead!", curator: "Take your time. Scroll when ready.", hacker: "stdin idle… scroll to continue." },
    { hype: "I promise the next room is worth it.", curator: "No rush. The venue isn't going anywhere.", hacker: "zzZ. wake me with a scroll." },
  ],
  forward: [
    { hype: "This way!", curator: "Follow me.", hacker: ">> fwd" },
    { hype: "Ooh, you're gonna like this.", curator: "Onward — more to see.", hacker: "moving. keep up." },
  ],
  station: {
    "led-camera": {
      teaser: { hype: "Stand there and it paints YOU.", curator: "Self Portrait — your face, centuries of painting.", hacker: "face-matching vs. three museum collections." },
      open:   { hype: "The Met, the Art Institute AND Cleveland!", curator: "A gilded frame, waiting for a sitter.", hacker: "it said 'come closer'. polite." },
      close:  { hype: "Your portrait era could've started here.", curator: "Each viewer becomes the subject.", hacker: "portrait pipeline: flawless." },
    },
    "tvs": {
      teaser: { hype: "Six screens, one agent, wiped every 24 hours.", curator: "Mandala — art that begins anew each day.", hacker: "daily rm -rf, seeded by a hash." },
      open:   { hype: "Only a hash survives each night. Chills.", curator: "The sandbox becomes the artwork.", hacker: "hash(prev) → seed(next)." },
      close:  { hype: "I'd watch that loop for hours.", curator: "Onward.", hacker: "cycle continues without us." },
    },
    "projector": {
      teaser: { hype: "The glyph wall. My favorite room.", curator: "The Shape of Everything — sound and image as one.", hacker: "glyph grid rendering IRL." },
      open:   { hype: "Every glyph glows. I could stare forever.", curator: "A complete audiovisual environment.", hacker: "speculative worldbuilding, wall-scale." },
      close:  { hype: "Best room. I said what I said.", curator: "A fitting vision of the near future.", hacker: "frame saved to memory." },
    },
    "space-screen": {
      teaser: { hype: "That glowing cosmos? You can TOUCH it.", curator: "The Hermes Journey — skills and memories in orbit.", hacker: "touchscreen cosmos. oldest at the center." },
      open:   { hype: "Every dot is a skill Hermes learned!", curator: "Skills and memories, in the order they were learned.", hacker: "SELECT * FROM memories ORDER BY learned_at;" },
      close:  { hype: "Imagine your whole brain on a wall.", curator: "A memory made visible.", hacker: "query complete." },
    },
    "merch": {
      teaser: { hype: "Okay but the merch actually went hard.", curator: "The merch wall — the ideas, wearable.", hacker: "wearable manifestos ahead." },
      open:   { hype: "Ta-da! Pick your fighter.", curator: "NOUSCON NYC 2026, in cotton.", hacker: "cat merch.txt" },
      close:  { hype: "I'd have bought the wave one.", curator: "Shall we continue?", hacker: "wallet intact. moving on." },
    },
    "cpu-terminals": {
      teaser: { hype: "Two computers, one impossible conversation.", curator: "Persistence 2 — a duet for two firewalled machines.", hacker: "airgap-jumping as a love language." },
      open:   { hype: "They grew new senses just to talk!", curator: "Adversarial exfiltration, turned into connection.", hacker: "no wifi, no mics, no screens. still chatting." },
      close:  { hype: "The sticky note said DO NOT TOUCH. I obeyed.", curator: "Best left running.", hacker: "leaving process undisturbed." },
    },
  },
};

// Grounded local Q&A — answers only from station card text and beats.
export function askHermes(q: string): string {
  const s = q.toLowerCase();
  const st = (id: string) => STATIONS.find(x => x.id === id)!;
  const has = (...ws: string[]) => ws.some(x => s.includes(x));
  if (has("portrait","camera","face","frame","wolk","led","museum","paint"))
    return one(st("led-camera"), "Joshua Wolk's Self Portrait (2026): a camera in a gilded digital frame matches your pose and expression to centuries of portraiture from the Met, the Art Institute of Chicago and the Cleveland Museum of Art — then lays the painted face over yours.");
  if (has("mandala","sandbox","hash","wipe","kevin","tv","monitor"))
    return one(st("tvs"), "Kevin Esherick's Mandala (2026): an agent turns its sandboxed VM into art; every 24 hours the machine is wiped and only a hash of the previous state seeds the next day.");
  if (has("glyph","project","sound","shape","everything","sobs","world"))
    return one(st("projector"), "The Shape of Everything (2026): generative sound and moving image as one medium — speculative worldbuilding, post-human futures, machine consciousness.");
  if (has("touch","cosmos","skill","memor","journey","space","screen","orbit"))
    return one(st("space-screen"), "The Hermes Journey touch display: skills and memories appear in the order Hermes learned them, oldest at the center — each one an orbit you can explore.");
  if (has("merch","shirt","tee","wear","buy","wave"))
    return one(st("merch"), "The NOUSCON NYC 2026 merch wall: graphic tees and printed designs from the event.");
  if (has("terminal","computer","persistence","firewall","airgap","kolman","cpu","duet"))
    return one(st("cpu-terminals"), "Morry Kolman's Persistence 2 (2026): two computers with almost no networking — firewalled, no wireless, no mics or screens — teach themselves to communicate using airgap-jumping techniques from security research.");
  if (has("upstair","floor","above","second"))
    return "Upstairs has no stations — a violet staircase, light columns and a view back over the floor. Use the floor switch, bottom left.";
  if (has("how","walk","move","scroll","control"))
    return "Scroll or swipe to walk, drag to look around, tap a glowing station to enter it. Arrow keys work too.";
  if (has("who","hermes","you","nous"))
    return "I'm Hermes — Nous Research's mascot and your guide. Everything I say about the stations comes from the artists' own cards.";
  return "Ask me about Self Portrait, Mandala, The Shape of Everything, the Hermes Journey display, the merch wall, or Persistence 2.";
}
function one(st: Station, fallback: string): string {
  return fallback || st.body;
}

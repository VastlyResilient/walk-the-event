
/** True station silhouettes, drawn in a 0–100 box. Outline only. */
const R = (x:number,y:number,w:number,h:number,rx=2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const L = (x1:number,y1:number,x2:number,y2:number) => `<path d="M${x1} ${y1}L${x2} ${y2}"/>`;

const SHAPES: Record<string,string> = {
  "led-camera": [
    R(2,10,22,66,2), R(26,13,22,63,2), R(50,16,22,60,2), R(74,19,22,57,2),
    L(13,10,13,7), L(37,13,37,10), L(61,16,61,13), L(85,19,85,16),
    L(13,76,13,91), L(37,76,37,91), L(61,76,61,91), L(85,76,85,91),
    `<path d="M5 91 Q13 86 21 91"/><path d="M29 91 Q37 86 45 91"/><path d="M53 91 Q61 86 69 91"/><path d="M77 91 Q85 86 93 91"/>`
  ].join(""),
  "tvs": [
    R(3,8,28,36,1.5), R(36,8,28,36,1.5), R(69,8,28,36,1.5),
    R(3,50,28,36,1.5), R(36,50,28,36,1.5), R(69,50,28,36,1.5),
    L(17,17,17,35), L(50,17,50,35), L(83,17,83,35),
    L(17,59,17,77), L(50,59,50,77), L(83,59,83,77)
  ].join(""),
  "projector": [
    `<path d="M4 16 Q4 8 12 8 H88 Q96 8 96 16 V74 H4 Z"/>`,
    L(27,14,27,74), L(50,11,50,74), L(73,14,73,74),
    `<path d="M2 82 H98"/>`, `<path d="M8 88 H92"/>`
  ].join(""),
  "space-screen": [
    R(28,3,44,59,4), R(35,12,30,41,1),
    `<path d="M44 62 L38 82 H62 L56 62"/>`, `<path d="M22 84 Q50 74 78 84 L78 91 H22 Z"/>`,
    L(32,88,68,88)
  ].join(""),
  "merch": [
    R(8,5,84,30,2), R(5,52,90,24,2),
    `<path d="M22 10 L28 5 H36 L32 12 Z"/>`, `<path d="M44 10 L50 5 H58 L54 12 Z"/>`, `<path d="M66 10 L72 5 H80 L76 12 Z"/>`,
    `<path d="M14 60 H86 M14 68 H86"/>`, `<path d="M28 57 V71 M50 57 V71 M72 57 V71"/>`
  ].join(""),
  "cpu-terminals": [
    R(5,24,38,68,2), R(57,24,38,68,2),
    R(10,34,28,17,1), R(62,34,28,17,1),
    L(12,62,36,62), L(64,62,88,62), L(12,70,36,70), L(64,70,88,70),
    `<path d="M8 92 H40 M60 92 H92"/>`
  ].join("")
};

export function stationBody(id: string): string {
  return SHAPES[id] || R(6,8,88,84,3);
}

export function stationShape(id: string, label: string): string {
  const body = stationBody(id);
  return `<svg class="hs-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="${label} outline" role="img">
    <g class="hs-glow">${body}</g><g class="hs-line">${body}</g>
  </svg>`;
}

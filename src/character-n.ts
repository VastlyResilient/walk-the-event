
import * as THREE from "three";

/**
 * "N" — the Walk the Event guide, 3D.
 *
 * A three-dimensional build of the supplied character sheet: black-and-white manga
 * girl, waist-length straight hair with a blunt fringe, over-ear headphones with a
 * white headband, and a white choker carrying a bold black "N".
 *
 * The look is deliberately ink-on-paper, not plastic doll: toon banding, inverted-hull
 * outlines, matte paper skin, lacquer-black hair with drawn highlight streaks.
 * Same rig surface as ./character.ts so it drops into the existing guide slot.
 */
export type CharacterRig = {
  setMoving(speed: number): void;
  setLight(rgb: [number, number, number], brightness: number): void;
  setGround(rgb: [number, number, number], strength: number): void;
  resize(): void;
  dispose(): void;
};

const INK = 0x0d0b10;
const INK_SOFT = 0x1a161f;
const PAPER = 0xf6f1e7;
const PAPER_SHADE = 0xded5c6;
const WHITE = 0xfcfaf4;
const LIP = 0x2a2028;

/* ---------- materials ---------- */

function gradientMap(steps = 3) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) data[i] = Math.round(255 * Math.pow(i / (steps - 1), 0.9));
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const BAND = gradientMap(3);

const matSkin = () => new THREE.MeshToonMaterial({ color: PAPER, gradientMap: BAND });
const matSkinShade = () => new THREE.MeshToonMaterial({ color: PAPER_SHADE, gradientMap: BAND });
const matWhite = () => new THREE.MeshToonMaterial({ color: WHITE, gradientMap: BAND });
const matInk = () => new THREE.MeshToonMaterial({ color: INK_SOFT, gradientMap: BAND });
const matHair = () =>
  new THREE.MeshStandardMaterial({ color: INK, roughness: 0.28, metalness: 0.34 });
const matLacquer = () =>
  new THREE.MeshStandardMaterial({ color: 0x14111a, roughness: 0.36, metalness: 0.22 });
const matOutline = () => new THREE.MeshBasicMaterial({ color: 0x08060b, side: THREE.BackSide });

/** scale-aware inverted hull outline */
function outlined<K extends THREE.Object3D>(mesh: K, thickness = 1.028): K {
  const geo = (mesh as unknown as THREE.Mesh).geometry;
  if (!geo) return mesh;
  const hull = new THREE.Mesh(geo, matOutline());
  hull.scale.setScalar(thickness);
  hull.renderOrder = -1;
  (mesh as unknown as THREE.Object3D).add(hull);
  return mesh;
}

function roundedBox(w: number, h: number, d: number, r: number, mat: THREE.Material) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true, bevelSize: r * 0.35, bevelThickness: r * 0.35,
    bevelSegments: 3, curveSegments: 10,
  });
  g.center();
  return new THREE.Mesh(g, mat);
}

/* ---------- garment forms ---------- */

/** slim sleeveless shell: narrow waist, shaped bust, off-shoulder opening */
function shell(mat: THREE.Material) {
  const prof: [number, number][] = [
    [0, -0.04], [0.094, -0.04], [0.112, -0.015], [0.116, 0.030], [0.126, 0.110],
    [0.138, 0.208], [0.144, 0.300], [0.139, 0.386], [0.126, 0.442], [0.104, 0.482],
    [0.070, 0.500], [0, 0.508],
  ];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 56);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.scale.z = 0.74;
  m.castShadow = true;
  return m;
}

/** straight-cut hair mass behind the head and shoulders */
function hairCurtain(mat: THREE.Material) {
  const g = new THREE.CylinderGeometry(0.150, 0.196, 0.62, 40, 16, true, Math.PI * 0.20, Math.PI * 1.60);
  const pa = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pa.count; i++) {
    const y = pa.getY(i);
    const t = (0.31 - y) / 0.62;           // 0 at crown, 1 at the cut
    const z = pa.getZ(i);
    // flatten the sheet against the back and give the tips a slight outward flick
    pa.setZ(i, z * (0.82 + t * 0.05) - t * 0.010);
    pa.setX(i, pa.getX(i) * (0.90 + t * 0.10));
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  return m;
}

export function mountCharacter(host: HTMLElement): CharacterRig {
  const canvas = document.createElement("canvas");
  canvas.className = "char-canvas";
  host.innerHTML = "";
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 0.52, 0.1, 40);
  camera.position.set(0.62, 1.42, 4.35);
  camera.lookAt(0, 0.92, 0);

  const hemi = new THREE.HemisphereLight(0xf3ecff, 0x1a1620, 0.85);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(2.6, 3.6, 3.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfc6ff, 2.1);
  rim.position.set(-3.0, 2.0, -1.6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-1.4, 1.1, 3.2);
  scene.add(fill);

  const root = new THREE.Group();
  root.rotation.y = -0.16;
  scene.add(root);

  const skin = matSkin();
  const skinShade = matSkinShade();
  const white = matWhite();
  const ink = matInk();
  const hair = matHair();
  const lacquer = matLacquer();

  /* ---------- hips, torso, top ---------- */
  const hips = new THREE.Group();
  root.add(hips);
  hips.position.y = 0.845;

  const pelvis = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.138, 24, 18), ink));
  pelvis.scale.set(1, 0.62, 0.82);
  pelvis.position.y = -0.004;
  hips.add(pelvis);

  const torso = new THREE.Group();
  torso.position.y = 0.02;
  hips.add(torso);

  const body = outlined(shell(ink));
  torso.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.108, 28, 18), ink);
  chest.scale.set(1.0, 0.56, 0.6);
  chest.position.set(0, 0.386, 0.034);
  torso.add(chest);

  // white piping along the off-shoulder neckline (the sheet's keyline)
  const neckline = new THREE.Mesh(new THREE.TorusGeometry(0.101, 0.0062, 8, 40), white);
  neckline.rotation.x = Math.PI / 2;
  neckline.position.set(0, 0.494, 0);
  neckline.scale.z = 0.74;
  torso.add(neckline);
  // hem piping
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.0055, 8, 40), white);
  hem.rotation.x = Math.PI / 2;
  hem.position.set(0, 0.026, 0);
  hem.scale.z = 0.74;
  torso.add(hem);

  /* ---------- neck + the "N" choker ---------- */
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.054, 0.150, 24), skin);
  neck.position.y = 0.596;
  torso.add(neck);

  const choker = new THREE.Mesh(new THREE.CylinderGeometry(0.0495, 0.0495, 0.040, 40, 1, true), white);
  choker.position.y = 0.612;
  choker.scale.z = 0.94;
  torso.add(choker);
  const chokerEdgeTop = new THREE.Mesh(new THREE.TorusGeometry(0.0495, 0.0022, 6, 40), new THREE.MeshBasicMaterial({ color: 0x17131b }));
  chokerEdgeTop.rotation.x = Math.PI / 2;
  chokerEdgeTop.position.y = 0.632;
  chokerEdgeTop.scale.z = 0.94;
  torso.add(chokerEdgeTop);
  const chokerEdgeBot = chokerEdgeTop.clone();
  chokerEdgeBot.position.y = 0.592;
  torso.add(chokerEdgeBot);

  // bold sans "N", built from two stems and a diagonal so it stays crisp at any size
  const nGroup = new THREE.Group();
  nGroup.position.set(0, 0.612, 0.050);
  torso.add(nGroup);
  {
    const gly = new THREE.MeshToonMaterial({ color: 0x0b090e, gradientMap: BAND });
    const stemGeo = new THREE.BoxGeometry(0.0062, 0.0245, 0.0035);
    for (const sx of [-0.0072, 0.0072]) {
      const stem = new THREE.Mesh(stemGeo, gly);
      stem.position.x = sx;
      nGroup.add(stem);
    }
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.0052, 0.0295, 0.0035), gly);
    diag.rotation.z = -0.46;
    diag.position.set(0, 0.0005, 0.0006);
    nGroup.add(diag);
  }

  /* ---------- head ---------- */
  const head = new THREE.Group();
  head.position.y = 0.716;
  torso.add(head);

  const skullGeo = new THREE.SphereGeometry(0.126, 48, 40);
  {
    const pa = skullGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i);
      const t = Math.max(0, -y / 0.126);
      const narrow = 1 - 0.29 * Math.pow(t, 1.5);
      pa.setX(i, pa.getX(i) * narrow);
      pa.setZ(i, pa.getZ(i) * (1 - 0.07 * t));
    }
    skullGeo.computeVertexNormals();
  }
  const skull = new THREE.Mesh(skullGeo, skin);
  skull.scale.set(1, 1.07, 0.95);
  outlinedTint(skull);
  head.add(skull);

  function outlinedTint(mesh: THREE.Mesh) {
    const hull = new THREE.Mesh(mesh.geometry, matOutline());
    hull.scale.set(1.035, 1.035, 1.035);
    hull.renderOrder = -1;
    mesh.add(hull);
  }

  // ears (mostly covered by cups, keep the silhouette honest)
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 12), skin);
    ear.scale.set(0.5, 1, 0.78);
    ear.position.set(s * 0.122, -0.004, 0.002);
    head.add(ear);
  }

  /* ---------- hair ---------- */
  // crown cap
  const cap = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.140, 44, 32, 0, Math.PI * 2, 0, Math.PI * 0.32), hair));
  cap.position.y = 0.004;
  cap.scale.set(1.02, 1.04, 1.03);
  head.add(cap);

  // long straight mass down the back
  const curtain = hairCurtain(hair);
  curtain.position.set(0, -0.20, -0.012);
  head.add(curtain);

  // blunt fringe: a dome wedge + a row of strand tips at the brow line
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.1425, 48, 24, Math.PI * 0.5 - 1.02, 2.04, 0, Math.PI * 0.376), hair);
  fringe.scale.set(1.01, 1.02, 1.03);
  fringe.position.set(0, 0.002, 0.003);
  head.add(fringe);
  for (let i = 0; i < 13; i++) {
    const a = (i / 12 - 0.5) * 1.96;            // across the front, +-56 degrees
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0125, 0.030 + (i % 2) * 0.007, 8), hair);
    tip.rotation.x = Math.PI;
    tip.position.set(Math.sin(a) * 0.122, 0.052 - Math.abs(a) * 0.004, Math.cos(a) * 0.122);
    tip.rotation.z = -a * 0.16;
    head.add(tip);
  }

  // face-framing strands falling past the jaw
  for (const s of [-1, 1]) {
    const side = outlined(roundedBox(0.046, 0.235, 0.062, 0.020, hair));
    side.position.set(s * 0.118, -0.075, 0.014);
    side.rotation.z = s * 0.045;
    head.add(side);
    const tipSide = new THREE.Mesh(new THREE.ConeGeometry(0.0235, 0.05, 8), hair);
    tipSide.rotation.x = Math.PI;
    tipSide.position.set(s * 0.120, -0.204, 0.016);
    tipSide.rotation.z = s * 0.06;
    head.add(tipSide);
  }

  // drawn shine streaks, the flat white marks from the sheet
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 5; i++) {
    const st = new THREE.Mesh(new THREE.SphereGeometry(0.019 - i * 0.0018, 8, 6), shineMat);
    st.scale.set(1.7 - i * 0.16, 0.34, 0.16);
    st.position.set(-0.048 + i * 0.026, 0.104 - Math.abs(i - 2) * 0.008, 0.108 - Math.abs(i - 2) * 0.004);
    st.rotation.z = -0.22 + i * 0.10;
    head.add(st);
  }

  /* ---------- headphones ---------- */
  const hp = new THREE.Group();
  head.add(hp);
  // band: white on the outside, ink underneath
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.163, 0.0125, 12, 60, Math.PI * 0.94), white);
  band.rotation.z = Math.PI * 0.03;
  band.position.set(0, 0.010, -0.004);
  band.scale.set(1, 1.02, 1.06);
  hp.add(band);
  const bandInk = new THREE.Mesh(new THREE.TorusGeometry(0.163, 0.0062, 8, 60, Math.PI * 0.94), matLacquer());
  bandInk.rotation.z = Math.PI * 0.03;
  bandInk.position.set(0, 0.010, 0.002);
  bandInk.scale.set(1.0, 1.02, 1.04);
  hp.add(bandInk);

  const cups: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(s * 0.136, -0.004, 0.004);
    cup.rotation.z = s * (Math.PI / 2);
    head.add(cup);
    const shellCup = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.062, 0.030, 32), matLacquer()));
    cup.add(shellCup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0052, 8, 32), white);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.017;
    cup.add(ring);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.026, 28), new THREE.MeshToonMaterial({ color: 0x24202b, gradientMap: BAND }));
    pad.position.y = -0.020;
    cup.add(pad);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), white);
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = -0.0345;
    cup.add(dot);
    cups.push(cup);
  }
  // cable
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.150, -0.030, 0.010),
    new THREE.Vector3(-0.165, -0.130, 0.020),
    new THREE.Vector3(-0.140, -0.230, 0.040),
    new THREE.Vector3(-0.110, -0.320, 0.030),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 24, 0.0035, 6), matLacquer());
  head.add(cable);

  /* ---------- face ---------- */
  const eyes: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group();
    eg.position.set(s * 0.049, 0.006, 0.108);
    head.add(eg);
    // sclera
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0265, 22, 16), white);
    eye.scale.set(1.02, 1.18, 0.34);
    eg.add(eye);
    // iris
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 18, 14), new THREE.MeshBasicMaterial({ color: 0x141017 }));
    iris.scale.set(0.92, 1.12, 0.30);
    iris.position.set(s * 0.0012, -0.0015, 0.0085);
    eg.add(iris);
    // pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 10), new THREE.MeshBasicMaterial({ color: 0x050407 }));
    pupil.scale.set(0.95, 1.15, 0.3);
    pupil.position.set(s * 0.0012, -0.0015, 0.0125);
    eg.add(pupil);
    // specular highlight
    const gloss = new THREE.Mesh(new THREE.CircleGeometry(0.0048, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    gloss.position.set(s * 0.0055, 0.0068, 0.0148);
    eg.add(gloss);
    // heavy upper lash line
    const lash = new THREE.Mesh(new THREE.TorusGeometry(0.0285, 0.0043, 8, 26, Math.PI * 0.98), new THREE.MeshBasicMaterial({ color: 0x0a080d }));
    lash.rotation.z = Math.PI * 0.01;
    lash.scale.set(1.0, 1.12, 1);
    lash.position.z = 0.010;
    eg.add(lash);
    // lower lid
    const lid = new THREE.Mesh(new THREE.TorusGeometry(0.0268, 0.0016, 6, 22, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: 0x2a222c }));
    lid.rotation.z = -Math.PI * 0.9;
    lid.position.z = 0.011;
    eg.add(lid);
    // lashes at the outer corner
    for (let k = 0; k < 3; k++) {
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.0022, 0.017, 6), new THREE.MeshBasicMaterial({ color: 0x0a080d }));
      l.position.set(s * (0.0295 + k * 0.002), 0.0125 - k * 0.0075, 0.0115);
      l.rotation.z = s * (-0.9 - k * 0.22);
      eg.add(l);
    }
    eyes.push(eg);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.0048, 0.006), new THREE.MeshBasicMaterial({ color: 0x14101a }));
    brow.position.set(s * 0.050, 0.049, 0.108);
    brow.rotation.z = -s * 0.15;
    head.add(brow);
  }
  // nose: paper crease, no geometry mass
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.0088, 12, 10), skinShade);
  nose.scale.set(0.85, 0.9, 0.7);
  nose.position.set(0, -0.022, 0.122);
  head.add(nose);
  // mouth
  const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.0056, 0.019, 4, 10), new THREE.MeshBasicMaterial({ color: LIP }));
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.062, 0.111);
  head.add(mouth);
  const lipGloss = new THREE.Mesh(new THREE.CircleGeometry(0.0032, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  lipGloss.position.set(0.004, -0.0645, 0.1165);
  head.add(lipGloss);
  // blush marks, drawn not shaded
  for (const s of [-1, 1]) {
    const bl = new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), new THREE.MeshBasicMaterial({ color: 0xd9b9b9, transparent: true, opacity: 0.22 }));
    bl.position.set(s * 0.070, -0.036, 0.104);
    bl.rotation.y = s * 0.34;
    head.add(bl);
  }

  /* ---------- arms ---------- */
  type Arm = { upper: THREE.Group; fore: THREE.Group; hand: THREE.Group };
  const arms: Record<string, Arm> = {} as Record<string, Arm>;
  for (const side of ["l", "r"] as const) {
    const s = side === "l" ? -1 : 1;
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.148, 0.462, 0);
    torso.add(shoulder);
    // bare shoulder: off-shoulder top leaves the deltoid in skin
    const delt = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.050, 20, 16), skin));
    delt.scale.set(1, 0.98, 0.9);
    shoulder.add(delt);
    const upper = new THREE.Group();
    shoulder.add(upper);
    // short cap sleeve carrying the top's white edge
    const capSleeve = new THREE.Mesh(new THREE.SphereGeometry(0.053, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.46), ink);
    capSleeve.position.y = 0.006;
    capSleeve.scale.set(1.02, 0.92, 0.96);
    upper.add(capSleeve);
    const cuffEdge = new THREE.Mesh(new THREE.TorusGeometry(0.0505, 0.0032, 6, 24), white);
    cuffEdge.rotation.x = Math.PI / 2;
    cuffEdge.position.y = -0.020;
    upper.add(cuffEdge);
    const ua = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.0295, 0.128, 8, 16), skin));
    ua.position.y = -0.112;
    upper.add(ua);
    const fore = new THREE.Group();
    fore.position.y = -0.222;
    upper.add(fore);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.0295, 14, 12), skin);
    fore.add(elbow);
    const fa = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.0265, 0.150, 8, 16), skin));
    fa.position.y = -0.090;
    fore.add(fa);
    const hand = new THREE.Group();
    hand.position.y = -0.182;
    fore.add(hand);
    const palm = roundedBox(0.038, 0.056, 0.021, 0.009, skin);
    palm.position.y = -0.026;
    hand.add(palm);
    for (let f = 0; f < 4; f++) {
      const fin = new THREE.Mesh(new THREE.CapsuleGeometry(0.0060, 0.022 + (f === 1 ? 0.004 : 0), 4, 8), skin);
      fin.position.set((f - 1.5) * 0.0096, -0.058 - (f === 1 ? 0.002 : 0), 0.001);
      fin.rotation.z = (f - 1.5) * 0.035;
      hand.add(fin);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0070, 0.021, 4, 8), skin);
    thumb.position.set(s * 0.025, -0.030, 0.007);
    thumb.rotation.z = s * 0.6;
    hand.add(thumb);
    arms[side] = { upper, fore, hand };
    shoulder.rotation.z = s * 0.09;
  }

  /* ---------- legs ---------- */
  type Leg = { hip: THREE.Group; knee: THREE.Group };
  const legs: Record<string, Leg> = {} as Record<string, Leg>;
  for (const side of ["l", "r"] as const) {
    const s = side === "l" ? -1 : 1;
    const hipJ = new THREE.Group();
    hipJ.position.set(s * 0.064, -0.018, 0);
    hips.add(hipJ);
    const thigh = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.330, 8, 16), ink));
    thigh.position.y = -0.192;
    hipJ.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.368;
    hipJ.add(knee);
    const calf = outlined(new THREE.Mesh(new THREE.CapsuleGeometry(0.0355, 0.342, 10, 18), ink));
    calf.position.y = -0.196;
    knee.add(calf);
    // boot
    const boot = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.098, 0.115), lacquer));
    boot.position.set(0, -0.392, 0.012);
    knee.add(boot);
    const toe = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), lacquer));
    toe.scale.set(0.95, 0.62, 1.34);
    toe.position.set(0, -0.432, 0.088);
    knee.add(toe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.008, 0.20), white);
    sole.position.set(0, -0.442, 0.050);
    knee.add(sole);
    legs[side] = { hip: hipJ, knee };
  }

  /* ---------- contact shadow ---------- */
  function shadowTex(strength: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    grd.addColorStop(0, `rgba(0,0,0,${strength})`);
    grd.addColorStop(0.5, `rgba(0,0,0,${strength * 0.5})`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex(0.55), transparent: true, depthWrite: false, color: 0x100c16 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  root.add(shadow);

  /* ---------- animation ---------- */
  let speed = 0, moving = 0, phase = 0, last = performance.now(), raf = 0, dead = false;
  const keyColor = new THREE.Color(0xfff2f6);
  const rimColor = new THREE.Color(0xc9b6ff);
  const groundColor = new THREE.Color(0x241d2c);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2.25));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // frame the full figure no matter how narrow the slot gets
    const halfH = 0.99;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfH / camera.position.distanceTo(new THREE.Vector3(0, 0.92, 0))));
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  function frame(now: number) {
    if (dead) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    moving += ((speed > 0.02 ? 1 : 0) - moving) * Math.min(1, dt * 7);
    phase += dt * (2.1 + speed * 8.0);

    const sw = Math.sin(phase), cw = Math.cos(phase);
    const amp = 0.07 + 0.38 * moving;

    legs.l.hip.rotation.x = sw * amp;
    legs.r.hip.rotation.x = -sw * amp;
    legs.l.knee.rotation.x = Math.max(0, -sw) * 0.58 * moving;
    legs.r.knee.rotation.x = Math.max(0, sw) * 0.58 * moving;

    arms.l.upper.rotation.x = -sw * amp * 0.78;
    arms.r.upper.rotation.x = sw * amp * 0.78;
    arms.l.fore.rotation.x = -0.14 - Math.max(0, sw) * 0.16 * moving;
    arms.r.fore.rotation.x = -0.14 - Math.max(0, -sw) * 0.16 * moving;

    hips.rotation.y = sw * 0.05 * moving;
    torso.rotation.y = -sw * 0.038 * moving;
    torso.rotation.z = cw * 0.011 * moving;
    torso.rotation.x = 0.03 + 0.018 * moving;

    head.rotation.y = -sw * 0.022 * moving + Math.sin(now * 0.00055) * 0.022;
    head.rotation.z = -cw * 0.008 * moving;
    head.rotation.x = Math.sin(now * 0.0009) * 0.012;

    // hair drags behind the step
    curtain.rotation.z = -cw * 0.035 * moving;
    curtain.rotation.x = 0.03 + Math.abs(sw) * 0.02 * moving;
    fringe.rotation.z = -cw * 0.008 * moving;
    // cups bounce a touch with the step
    for (let i = 0; i < cups.length; i++) cups[i].rotation.z = (i === 0 ? -1 : 1) * (Math.PI / 2) + Math.sin(phase + i) * 0.03 * moving;

    root.position.y = Math.abs(Math.sin(phase)) * 0.016 * moving + Math.sin(now * 0.0011) * 0.003;

    const bp = (now * 0.001 + 2.1) % 5.6;
    const closed = bp < 0.12 ? 1 - Math.abs(bp - 0.06) / 0.06 : 0;
    for (const e of eyes) e.scale.y = 1 - closed * 0.92;

    chest.scale.y = 0.56 + Math.sin(now * 0.0015) * 0.006;
    shadow.scale.setScalar(1 + Math.abs(sw) * 0.05 * moving);

    key.color.lerp(keyColor, Math.min(1, dt * 2));
    rim.color.lerp(rimColor, Math.min(1, dt * 1.5));
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  (window as any).__charDebug = { scene, camera, root, renderer, THREE };

  return {
    setMoving(s: number) {
      speed = Math.max(0, Math.min(1, s));
    },
    setGround(rgb, strength) {
      groundColor.setRGB(rgb[0], rgb[1], rgb[2]);
      shadowMat.color.copy(groundColor).multiplyScalar(0.1);
      shadowMat.opacity = 0.5 + strength * 0.3;
    },
    setLight(rgb, brightness) {
      const c = new THREE.Color(rgb[0], rgb[1], rgb[2]);
      keyColor.copy(c).lerp(new THREE.Color(0xffffff), 0.4);
      key.intensity = 1.6 + brightness * 1.5;
      rimColor.copy(c).lerp(new THREE.Color(0x8b5cff), 0.4);
      rim.intensity = 0.8 + brightness * 1.1;
      hemi.intensity = 0.5 + brightness * 0.8;
    },
    resize,
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    },
  };
}

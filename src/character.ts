
import * as THREE from "three";

export type CharacterRig = {
  setMoving(speed: number): void;
  setLight(rgb: [number, number, number], brightness: number): void;
  setGround(rgb: [number, number, number], strength: number): void;
  resize(): void;
  dispose(): void;
};

const SKIN = 0xf2c9ae;
const SKIN_SHADE = 0xdfa88d;
const INK = 0x121016;
const HAIR = 0x16121a;
const WHITE = 0xf7f4ee;
const WHITE_SHADE = 0xd9d2c6;
const LIP = 0xa4525a;

function roundedBox(w: number, h: number, d: number, r: number, mat: THREE.Material) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: r * .35, bevelThickness: r * .35, bevelSegments: 3, curveSegments: 10 });
  g.center(); return new THREE.Mesh(g, mat);
}

function pleatedSkirt(mat: THREE.Material) {
  const SEG = 72, RINGS = 18;
  const pos: number[] = [], idx: number[] = [];
  for (let j = 0; j <= RINGS; j++) {
    const t = j / RINGS;
    const y = 0.825 - t * 0.500;
    const flare = 0.142 + Math.pow(t, 1.22) * 0.132;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const pleat = Math.cos(a * 14) * (0.006 + t * 0.020) + Math.cos(a * 28 + .6) * 0.004 * t;
      const r = flare + pleat;
      pos.push(Math.sin(a) * r, y, Math.cos(a) * r * .86);
    }
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + SEG + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
}

function tailoredShell(mat: THREE.Material) {
  // tailored jacket: narrow waist, shaped bust, soft shoulder — lathed then flattened front-to-back
  const prof: [number, number][] = [
    [0, -.035], [.096, -.035], [.116, -.014], [.120, .028], [.131, .105],
    [.143, .205], [.149, .300], [.144, .392], [.132, .452], [.112, .497],
    [.088, .533], [0, .548],
  ];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 56);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.scale.z = .76; m.castShadow = true; return m;
}

export function mountCharacter(host: HTMLElement): CharacterRig {
  const canvas = document.createElement("canvas");
  canvas.className = "char-canvas";
  host.innerHTML = ""; host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-.52, .52, .985, -.985, .1, 30);
  camera.position.set(1.02, 1.44, 4.3);
  camera.lookAt(0, .925, 0);

  const hemi = new THREE.HemisphereLight(0xffe6f1, 0x241d2c, 1.25); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffd9ea, 2.2); key.position.set(2.4, 3.4, 3.2); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb59bff, 2.3); rim.position.set(-3.2, 2.2, -1.2); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff2e6, .55); fill.position.set(-1, 1.2, 3.5); scene.add(fill);

  const root = new THREE.Group(); root.rotation.y = -0.30; scene.add(root);

  const matSkin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: .72, metalness: 0 });
  const matFace = new THREE.MeshStandardMaterial({ color: SKIN, roughness: .66 });
  const matSkinShade = new THREE.MeshStandardMaterial({ color: SKIN_SHADE, roughness: .7 });
  const matHair = new THREE.MeshStandardMaterial({ color: HAIR, roughness: .42, metalness: .12 });
  const matWhite = new THREE.MeshStandardMaterial({ color: WHITE, roughness: .78 });
  const matWhiteShade = new THREE.MeshStandardMaterial({ color: WHITE_SHADE, roughness: .8 });
  const matSkirt = new THREE.MeshPhysicalMaterial({ color: 0x141217, roughness: .46, metalness: .10, clearcoat: .22, clearcoatRoughness: .5, sheen: .85, sheenColor: new THREE.Color(0x5b5368), sheenRoughness: .42, side: THREE.DoubleSide });
  const matShoe = new THREE.MeshStandardMaterial({ color: 0x110f14, roughness: .28, metalness: .16 });
  const matInk = new THREE.MeshStandardMaterial({ color: INK, roughness: .55 });
  const matButton = new THREE.MeshStandardMaterial({ color: 0x2b2630, roughness: .35, metalness: .3 });

  // hips + torso
  const hips = new THREE.Group(); root.add(hips); hips.position.y = .845;
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(.142, 24, 18), matWhite); pelvis.scale.set(1, .62, .82); pelvis.position.y = -.005; hips.add(pelvis);

  const torso = new THREE.Group(); torso.position.y = .02; hips.add(torso);
  const jacket = tailoredShell(matWhite); torso.add(jacket);
  // a single soft chest volume stays inside the tailored shell
  const chest = new THREE.Mesh(new THREE.SphereGeometry(.112, 28, 18), matWhite); chest.scale.set(1.02, .58, .62); chest.position.set(0, .392, .035); torso.add(chest);

  // jacket placket + double breasted buttons
  const seam = new THREE.Mesh(new THREE.BoxGeometry(.008, .39, .006), matWhiteShade); seam.position.set(0, .30, .109); torso.add(seam);
  for (const sx of [-.050, .050]) for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.011, 10, 8), matButton); b.position.set(sx, .488 - i * .096, [.078, .101, .106, .100][i]); torso.add(b);
  }
  // collar: black standing band + white lapels
  // mandarin collar: a clean standing band, no scarf/lapels
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.057, .060, .042, 28, 1, true), matWhite);
  collar.position.y = .556; collar.scale.z = .9; torso.add(collar);

  // cuffs
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.047, .056, .125, 22), matSkin); neck.position.y = .622; torso.add(neck);

  // head group
  const head = new THREE.Group(); head.position.y = .718; torso.add(head);
  const skullGeo = new THREE.SphereGeometry(.128, 48, 40);
  {
    const pa = skullGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i), t = Math.max(0, -y / .128);
      const narrow = 1 - .27 * Math.pow(t, 1.45);
      pa.setX(i, pa.getX(i) * narrow);
      pa.setZ(i, pa.getZ(i) * (1 - .08 * t));
    }
    skullGeo.computeVertexNormals();
  }
  const skull = new THREE.Mesh(skullGeo, matFace); skull.scale.set(1, 1.08, .94); head.add(skull);
  // ears
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.024, 12, 12), matSkin); e.scale.set(.55, 1, .8); e.position.set(s * .126, -.005, 0); head.add(e); }

  // hair: cap, bangs, side bob, flipped ends
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.145, 40, 30, 0, Math.PI * 2, 0, Math.PI * .40), matHair);
  cap.position.y = .010; cap.scale.set(1.02, 1.05, 1.02); head.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(.141, 36, 30, Math.PI * .95, Math.PI * 1.1, 0, Math.PI * .84), matHair);
  back.position.set(0, -.012, -.012); back.scale.set(1.04, 1.04, 1.10); head.add(back);
  // bangs: soft wedge over forehead
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - .5) * 1.9;
    const bang = new THREE.Mesh(new THREE.SphereGeometry(.041, 16, 12), matHair);
    bang.scale.set(.66, .88 + (i % 2) * .08, .30);
    bang.position.set(Math.sin(a) * .104, .106 - Math.abs(a) * .010, .099 - Math.abs(a) * .028);
    bang.rotation.z = -a * .55; head.add(bang);
  }
  // side curtains to jaw, flipped at ends
  for (const s of [-1, 1]) {
    const side = roundedBox(.052, .190, .070, .023, matHair);
    side.position.set(s * .122, -.058, .002); side.rotation.z = s * .035; head.add(side);
    const flip = new THREE.Mesh(new THREE.SphereGeometry(.041, 16, 12), matHair);
    flip.scale.set(1.08, .55, .72); flip.position.set(s * .128, -.158, .024); flip.rotation.z = s * .48; head.add(flip);
  }
  // white headband across crown
  const band = new THREE.Mesh(new THREE.TorusGeometry(.150, .0105, 10, 48, Math.PI * .96), matWhite);
  band.rotation.set(0, 0, Math.PI * .02); band.position.set(0, .006, .006); band.scale.set(1, 1.04, 1); head.add(band);

  // face — inset eyes with lash line and a real blink
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfffaf4, roughness: .28 });
  const eyes: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(s * .048, .007, .117); head.add(eg);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.0225, 20, 14), eyeWhiteMat);
    eye.scale.set(1.06, 1.16, .30); eg.add(eye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(.0122, 16, 12), matInk);
    iris.scale.set(.90, 1.14, .28); iris.position.set(s * .0015, -.001, .008); eg.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.0052, 10, 8), new THREE.MeshBasicMaterial({ color: 0x050407 }));
    pupil.scale.set(1, 1.2, .4); pupil.position.set(s * .0015, -.001, .0115); eg.add(pupil);
    const gloss = new THREE.Mesh(new THREE.SphereGeometry(.0034, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    gloss.position.set(s * .005, .008, .0125); eg.add(gloss);
    // upper lash line
    const lip: THREE.Vector3[] = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (0.04 + .92 * k / 12);
      lip.push(new THREE.Vector3(Math.cos(a) * .0245, Math.sin(a) * .016 + .001, .0105));
    }
    const lash = new THREE.Line(new THREE.BufferGeometry().setFromPoints(lip),
      new THREE.LineBasicMaterial({ color: 0x0b0810, transparent: true, opacity: .9 }));
    eg.add(lash);
    eyes.push(eg);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.041, .0055, .006), matHair);
    brow.position.set(s * .049, .046, .114); brow.rotation.z = -s * .13; head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.011, .031, 8), matSkinShade); nose.rotation.x = Math.PI * .5; nose.position.set(0, -.020, .129); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(.0058, .026, 4, 8), new THREE.MeshStandardMaterial({ color: LIP, roughness: .5 }));
  mouth.rotation.z = Math.PI / 2; mouth.position.set(0, -.068, .118); head.add(mouth);
  // blush
  for (const s of [-1, 1]) {
    const bl = new THREE.Mesh(new THREE.CircleGeometry(.021, 12), new THREE.MeshBasicMaterial({ color: 0xe99b94, transparent: true, opacity: .26 }));
    bl.position.set(s * .074, -.038, .112); bl.rotation.y = s * .32; head.add(bl);
  }

  // arms
  type Arm = { upper: THREE.Group; fore: THREE.Group; hand: THREE.Group };
  const arms: Record<string, Arm> = {};
  for (const side of ["l", "r"] as const) {
    const s = side === "l" ? -1 : 1;
    const shoulder = new THREE.Group(); shoulder.position.set(s * .153, .470, 0); torso.add(shoulder);
    const capm = new THREE.Mesh(new THREE.SphereGeometry(.052, 20, 16), matWhite); capm.scale.set(1, 1.03, .92); shoulder.add(capm);
    const upper = new THREE.Group(); shoulder.add(upper);
    // chef coat: sleeve ends mid-bicep, rest of the arm is bare
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.047, .075, 8, 18), matWhite); sleeve.position.y = -.068; upper.add(sleeve);
    const sleeveHem = new THREE.Mesh(new THREE.CylinderGeometry(.046, .043, .016, 18), matWhiteShade); sleeveHem.position.y = -.120; upper.add(sleeveHem);
    const ua = new THREE.Mesh(new THREE.CapsuleGeometry(.030, .095, 8, 16), matSkin); ua.position.y = -.180; upper.add(ua);
    const fore = new THREE.Group(); fore.position.y = -.242; upper.add(fore);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(.030, 14, 12), matSkin); fore.add(elbow);
    const fa = new THREE.Mesh(new THREE.CapsuleGeometry(.027, .155, 8, 16), matSkin); fa.position.y = -.095; fore.add(fa);
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(.024, .022, .016, 14), matSkin); wrist.position.y = -.178; fore.add(wrist);
    const hand = new THREE.Group(); hand.position.y = -.185; fore.add(hand);
    const palm = roundedBox(.040, .058, .023, .009, matSkin); palm.position.y = -.026; hand.add(palm);
    for (let f = 0; f < 4; f++) {
      const fin = new THREE.Mesh(new THREE.CapsuleGeometry(.0062, .024 + (f === 1 ? .004 : 0), 4, 8), matSkin);
      fin.position.set((f - 1.5) * .0102, -.060 - (f === 1 ? .002 : 0), .001); fin.rotation.z = (f - 1.5) * .035; hand.add(fin);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(.0072, .023, 4, 8), matSkin);
    thumb.position.set(s * .026, -.031, .007); thumb.rotation.z = s * .62; hand.add(thumb);
    arms[side] = { upper, fore, hand };
    shoulder.rotation.z = s * .10;
  }

  // legs
  type Leg = { hip: THREE.Group; knee: THREE.Group; foot: THREE.Mesh };
  const legs: Record<string, Leg> = {};
  for (const side of ["l", "r"] as const) {
    const s = side === "l" ? -1 : 1;
    const hipJ = new THREE.Group(); hipJ.position.set(s * .066, -.020, 0); hips.add(hipJ);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.054, .335, 8, 16), new THREE.MeshStandardMaterial({ color: 0x1b1720, roughness: .75 }));
    thigh.position.y = -.195; hipJ.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -.372; hipJ.add(knee);
    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(.037, .350, 10, 18), matSkin);
    calf.position.y = -.200; knee.add(calf);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.068, .050, .145), matShoe);
    foot.position.set(0, -.430, .042); knee.add(foot);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(.036, 14, 10), matShoe); toe.scale.set(.95, .50, 1.18); toe.position.set(0, -.432, .106); knee.add(toe);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.070, .014, .050), matShoe); strap.position.set(0, -.408, .038); knee.add(strap);
    legs[side] = { hip: hipJ, knee, foot };
  }
  

  // skirt (over legs)
  const skirt = pleatedSkirt(matSkirt); root.add(skirt);
  // waistband
  const waistband = new THREE.Mesh(new THREE.CylinderGeometry(.142, .145, .034, 40, 1, true), matInk); waistband.position.y = .820; root.add(waistband);

  // soft contact shadow: two radial planes
  function shadowTex(strength: number) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    grd.addColorStop(0, `rgba(0,0,0,${strength})`); grd.addColorStop(.45, `rgba(0,0,0,${strength * .55})`); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex(.55), transparent: true, depthWrite: false, color: 0x1b1424, blending: THREE.NormalBlending });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.56, .31), shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .006; root.add(shadow);
  const glowMat = new THREE.MeshBasicMaterial({ map: shadowTex(.24), transparent: true, depthWrite: false, color: 0xffb7d5, blending: THREE.AdditiveBlending });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(.90, .48), glowMat);
  glow.rotation.x = -Math.PI / 2; glow.position.y = .004; root.add(glow);

  let moving = 0, speed = 0, phase = 0, last = performance.now(), raf = 0, dead = false;
  let keyColor = new THREE.Color(0xffd9ea), rimColor = new THREE.Color(0x9d7bff);
  const groundColor = new THREE.Color(0x2a1e33);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2.25));
    renderer.setSize(w, h, false);
    const viewH = 1.97, viewW = viewH * (w / h);
    camera.left = -viewW / 2; camera.right = viewW / 2;
    camera.top = viewH / 2; camera.bottom = -viewH / 2;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  function frame(now: number) {
    if (dead) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    moving += ((speed > .02 ? 1 : 0) - moving) * Math.min(1, dt * 7);
    phase += dt * (2.2 + speed * 8.5);

    const sw = Math.sin(phase), cw = Math.cos(phase);
    const amp = .08 + .40 * moving;
    // legs walk; knees bend on back swing
    legs.l.hip.rotation.x = sw * amp;
    legs.r.hip.rotation.x = -sw * amp;
    legs.l.knee.rotation.x = Math.max(0, -sw) * .55 * moving;
    legs.r.knee.rotation.x = Math.max(0, sw) * .55 * moving;
    // arms counter-swing
    arms.l.upper.rotation.x = -sw * (amp * .8);
    arms.r.upper.rotation.x = sw * (amp * .8);
    arms.l.fore.rotation.x = -.12 - Math.max(0, sw) * .18 * moving;
    arms.r.fore.rotation.x = -.12 - Math.max(0, -sw) * .18 * moving;
    // hips / torso counter rotation
    hips.rotation.y = sw * .055 * moving;
    torso.rotation.y = -sw * .040 * moving;
    torso.rotation.z = cw * .012 * moving;
    torso.rotation.x = .035 + .02 * moving;
    head.rotation.y = -sw * .025 * moving + Math.sin(now * .0006) * .02;
    head.rotation.z = -cw * .009 * moving;
    // skirt sway + flare
    skirt.rotation.z = cw * .018 * moving;
    skirt.rotation.y = -sw * .035 * moving;
    skirt.scale.x = 1 + Math.abs(cw) * .012 * moving;
    // grounded bob: never below floor
    root.position.y = Math.abs(Math.sin(phase)) * .018 * moving + Math.sin(now * .0011) * .003;
    // blink
    const bp = (now * .001 + 2.1) % 5.4;
    const closed = bp < .13 ? 1 - Math.abs(bp - .065) / .065 : 0;
    for (const e of eyes) e.scale.y = 1 - closed * .90;
    // idle breathing
    chest.scale.y = .58 + Math.sin(now * .0016) * .006;
    // shadow reacts to step
    shadow.scale.setScalar(1 + Math.abs(sw) * .06 * moving);
    shadowMat.opacity = .74 - Math.abs(sw) * .06 * moving;
    glowMat.opacity = .34 + Math.abs(sw) * .07 * moving;
    // dynamic venue light
    key.color.lerp(keyColor, Math.min(1, dt * 2));
    rim.color.lerp(rimColor, Math.min(1, dt * 1.5));
    glowMat.color.copy(groundColor).lerp(keyColor, .22);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  (window as any).__charDebug = { scene, camera, root, renderer };

  return {
    setMoving(s: number) { speed = Math.max(0, Math.min(1, s)); },
    setGround(rgb, strength) {
      groundColor.setRGB(rgb[0], rgb[1], rgb[2]);
      shadowMat.color.copy(groundColor).multiplyScalar(.12);
      shadowMat.opacity = .48 + strength * .28;
      glowMat.color.copy(groundColor).lerp(keyColor, .22);
    },
    setLight(rgb, brightness) {
      const c = new THREE.Color(rgb[0], rgb[1], rgb[2]);
      keyColor.copy(c).lerp(new THREE.Color(0xffffff), .35);
      key.intensity = 1.35 + brightness * 1.6;
      rimColor.copy(c).lerp(new THREE.Color(0x8b5cff), .45);
      rim.intensity = .7 + brightness * 1.2;
      hemi.intensity = .55 + brightness * .9;
      glowMat.color.copy(c);
    },
    resize,
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); },
  };
}

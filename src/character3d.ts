
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type CharacterRig = {
  setMoving(speed: number): void;
  setLight(rgb: [number, number, number], brightness: number): void;
  setGround(rgb: [number, number, number], strength: number): void;
  setFacing(amount: number): void;
  resize(): void;
  dispose(): void;
};

function shadowTexture(strength: number) {
  const s = 256, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  grd.addColorStop(0, `rgba(255,255,255,${strength})`);
  grd.addColorStop(.34, `rgba(255,255,255,${strength * .62})`);
  grd.addColorStop(.7, `rgba(255,255,255,${strength * .16})`);
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function mountCharacter(host: HTMLElement): CharacterRig {
  const canvas = document.createElement("canvas");
  canvas.className = "char-canvas";
  host.innerHTML = ""; host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-.52, .52, 1, -1, .1, 30);
  camera.position.set(.16, 1.28, 4.1);
  camera.lookAt(0, .83, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .42;

  const hemi = new THREE.HemisphereLight(0xffe9f0, 0x17121e, 1.05);
  const key = new THREE.DirectionalLight(0xffe4d2, 2.1);
  key.position.set(-1.9, 3.2, 3.0);
  const fill = new THREE.DirectionalLight(0xa8b6ff, .85);
  fill.position.set(2.4, 1.4, 2.0);
  const rim = new THREE.DirectionalLight(0x7b4dff, 1.4);
  rim.position.set(1.8, 2.3, -2.4);
  scene.add(hemi, key, fill, rim);

  const root = new THREE.Group();
  scene.add(root);

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(.92), transparent: true, depthWrite: false, color: 0x1c1424 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .004;
  shadow.scale.set(.74, .43, 1);
  scene.add(shadow);

  const glowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(.32), transparent: true, depthWrite: false, color: 0xffb7d5, blending: THREE.AdditiveBlending });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = .002;
  glow.scale.set(1.02, .58, 1);
  scene.add(glow);

  let mixer: THREE.AnimationMixer | null = null;
  let action: THREE.AnimationAction | null = null;
  let model: THREE.Object3D | null = null;
  let loaded = false;
  let dead = false;
  let raf = 0;
  let speed = 0, targetSpeed = 0, face = 0, targetFace = 0;
  let idlePhase = Math.random() * 6;
  const flowUniforms: { value: number }[] = [];
  const modelMats: THREE.MeshStandardMaterial[] = [];
  const timeUniforms: { value: number }[] = [];
  const keyColor = new THREE.Color(0xffd9c7);
  const groundColor = new THREE.Color(0x3b2f4a);
  const clock = new THREE.Clock();

  const url = `${import.meta.env.BASE_URL}models/hermes.glb`;
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    if (dead) return;
    model = gltf.scene;
    const box0 = new THREE.Box3().setFromObject(model);
    const h0 = Math.max(.001, box0.max.y - box0.min.y);
    const scale = 1.7 / h0;
    model.scale.setScalar(scale);
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    const c = new THREE.Vector3(); box.getCenter(c);
    model.position.x -= c.x;
    model.position.z -= c.z;

    model.traverse((o: any) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.frustumCulled = false;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          m.envMapIntensity = .62;
          if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) modelMats.push(m as THREE.MeshStandardMaterial);
          if (m.map) m.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          if (m.normalMap) m.normalScale = new THREE.Vector2(.85, .85);
          // Secondary motion: Meshy's humanoid rig has no hair or skirt bones, so
          // the back hair and the free hem of the skirt get a small skinned-space
          // wind wave. The masks are radial and height based, which keeps the face,
          // hands and lower legs rigid while the cloth and hair move.
          const uTime = { value: 0 }, uFlow = { value: .32 };
          timeUniforms.push(uTime); flowUniforms.push(uFlow);
          m.onBeforeCompile = (shader: any) => {
            shader.uniforms.uTime = uTime;
            shader.uniforms.uFlow = uFlow;
            shader.vertexShader = "uniform float uTime;\nuniform float uFlow;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <skinning_vertex>",
              `#include <skinning_vertex>
              float radial = length(transformed.xz);
              float skirtMask = smoothstep(.84, .56, transformed.y) * smoothstep(.16, .30, transformed.y) * smoothstep(.105, .175, radial);
              float hairMask = smoothstep(1.18, 1.42, transformed.y) * (1.0 - smoothstep(-.035, .055, transformed.z));
              float sideMask = smoothstep(.025, .12, abs(transformed.x));
              float flow = uFlow;
              transformed.x += sin(uTime * 2.7 + transformed.y * 7.4 + transformed.x * 2.2) * .023 * skirtMask * flow;
              transformed.z += cos(uTime * 2.1 + transformed.y * 5.1) * .016 * skirtMask * flow;
              transformed.x += sin(uTime * 2.2 + transformed.y * 9.0) * .016 * hairMask * (0.35 + sideMask) * flow;
              transformed.z -= cos(uTime * 1.8 + transformed.y * 7.0) * .011 * hairMask * flow;`
            );
          };
          m.customProgramCacheKey = () => "hermes-flow-v1";
          m.needsUpdate = true;
        }
      }
    });
    root.add(model);
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      action = mixer.clipAction(gltf.animations[0]);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      action.time = Math.min(.3, gltf.animations[0].duration * .2);
    }
    loaded = true;
    host.classList.add("char-ready");
  }, undefined, (err) => {
    console.error("Hermes model failed", err);
    host.classList.add("char-failed");
  });

  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    const dpr = Math.min(2, devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    const vh = 1.9, aspect = w / h, vw = vh * aspect;
    camera.left = -vw / 2; camera.right = vw / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  function frame() {
    if (dead) return;
    const dt = Math.min(.05, clock.getDelta());
    speed += (targetSpeed - speed) * Math.min(1, dt * 6.5);
    face += (targetFace - face) * Math.min(1, dt * 5.2);
    idlePhase += dt;

    if (loaded && model) {
      if (mixer && action) {
        action.timeScale = .055 + speed * 1.18;
        mixer.update(dt);
      }
      for (const u of timeUniforms) u.value = idlePhase;
      for (const u of flowUniforms) u.value = .28 + speed * 1.05;
      const breath = Math.sin(idlePhase * 1.7) * (.004 + speed * .002);
      const sway = Math.sin(idlePhase * .9) * (.004 + speed * .006);
      root.position.y = breath;
      root.rotation.y = face * .32;
      root.rotation.z = -face * .045 + sway;
      root.rotation.x = -speed * .015;
      shadow.scale.x = .66 + Math.abs(face) * .04;
      shadowMat.opacity = .94 + Math.sin(idlePhase * .8) * .012;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  (window as any).__charDebug = { scene, camera, root, renderer, get model() { return model; }, get mixer() { return mixer; }, get action() { return action; } };

  return {
    setMoving(s: number) { targetSpeed = Math.max(0, Math.min(1, s)); },
    setFacing(amount: number) { targetFace = Math.max(-1, Math.min(1, amount)); },
    setGround(rgb, strength) {
      groundColor.setRGB(rgb[0], rgb[1], rgb[2]);
      shadowMat.color.copy(groundColor).multiplyScalar(.15);
      shadowMat.opacity = Math.min(.96, .80 + strength * .18);
      glowMat.color.copy(groundColor).lerp(keyColor, .28);
      glowMat.opacity = .18 + strength * .12;
    },
    setLight(rgb, brightness) {
      const c = new THREE.Color(rgb[0], rgb[1], rgb[2]);
      keyColor.copy(c).lerp(new THREE.Color(0xfff4ec), .38);
      key.color.copy(keyColor); key.intensity = 1.25 + brightness * 1.05;
      fill.color.copy(c).lerp(new THREE.Color(0xb7c4ff), .48); fill.intensity = .72 + brightness * .48;
      rim.color.copy(c).lerp(new THREE.Color(0x9b6cff), .55); rim.intensity = .9 + brightness * 1.25;
      hemi.intensity = .72 + brightness * .72;
      glowMat.color.copy(c);
      for (const m of modelMats) m.color.copy(new THREE.Color(0xffffff)).lerp(c, .30);
      renderer.toneMappingExposure = .94 + brightness * .16;
    },
    resize,
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); }
  };
}

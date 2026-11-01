
import { mountCharacter } from "./character-n";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const q = new URLSearchParams(location.search);
const view = q.get("view") || "three-quarter";
const pose = q.get("pose") || "idle";
const bg = q.get("bg") || "dark";
const spin = q.get("spin");

const host = document.getElementById("lab")!;
host.className = bg === "paper" ? "paperbg" : bg === "flat" ? "flatbg" : "darkbg";
document.body.classList.toggle("paper", bg === "paper");

const rig = mountCharacter(host);
rig.setMoving(pose === "walk" ? 0.85 : 0);
rig.setLight(bg === "paper" ? [0.10, 0.09, 0.12] : [0.62, 0.30, 0.52], bg === "paper" ? 0.85 : 0.42);
rig.setGround(bg === "paper" ? [0.86, 0.84, 0.80] : [0.16, 0.13, 0.19], 0.5);

const dbg = (window as any).__charDebug;
const cam = dbg.camera;
const root = dbg.root;

const VIEWS: Record<string, [number, number, number, number]> = {
  // [cameraX, cameraY, cameraZ, fov]
  front: [0.0, 1.02, 4.55, 26],
  "three-quarter": [1.85, 1.08, 3.85, 26],
  side: [4.45, 1.00, 0.30, 26],
  back: [-0.60, 1.08, -4.20, 26],
  bust: [0.95, 1.55, 2.05, 26],
  head: [0.30, 1.62, 1.05, 24],
  face: [0.12, 1.60, 0.66, 18],
  choker: [0.10, 1.50, 0.80, 20],
};
const v = VIEWS[view] || VIEWS["three-quarter"];
const ty = view === "face" ? 1.60 : view === "choker" ? 1.50 : view === "head" ? 1.62 : view === "bust" ? 1.48 : 0.88;

function applyView() {
  cam.fov = v[3];
  cam.position.set(v[0], v[1], v[2]);
  cam.lookAt(0, ty, 0);
  cam.updateProjectionMatrix();
}
applyView();
// the mount's ResizeObserver lands a frame later and would re-fit the lens; re-assert the framing
requestAnimationFrame(applyView);
setTimeout(applyView, 120);
setTimeout(applyView, 420);

if (spin) {
  let a = 0;
  setInterval(() => {
    a += 0.012;
    const r = Math.hypot(v[0], v[2]);
    cam.position.set(Math.sin(a) * r, v[1], Math.cos(a) * r);
    cam.lookAt(0, 0.92, 0);
  }, 16);
}

(window as any).__labRig = rig;
(window as any).__exportGLB = async (name = "n-guide") => {
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root, { binary: true });
  const bytes = new Uint8Array(glb as ArrayBuffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { name, base64: btoa(bin), bytes: bytes.length };
};


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
  front: [0.0, 1.16, 3.55, 30],
  "three-quarter": [1.55, 1.24, 3.05, 32],
  side: [3.30, 1.12, 0.35, 30],
  back: [-0.55, 1.22, -3.40, 30],
  bust: [0.95, 1.62, 1.55, 26],
  head: [0.30, 1.66, 0.95, 24],
};
const v = VIEWS[view] || VIEWS["three-quarter"];
cam.fov = v[3];
cam.position.set(v[0], v[1], v[2]);
cam.lookAt(0, view === "head" ? 1.60 : view === "bust" ? 1.45 : 0.90, 0);
cam.updateProjectionMatrix();

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

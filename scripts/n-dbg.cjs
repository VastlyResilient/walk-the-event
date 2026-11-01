
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:5311/char-lab.html?view=choker&pose=idle&bg=flat', { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const info = await p.evaluate(() => {
    const { scene, camera, THREE, root } = window.__charDebug;
    const found = [];
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.geometry.parameters) return;
      const pr = o.geometry.parameters;
      if (o.geometry.type === 'CylinderGeometry' && Math.abs((pr.radiusTop ?? -9) - 0.0505) < 1e-4) {
        const w = new THREE.Vector3(); o.getWorldPosition(w);
        o.material = new THREE.MeshBasicMaterial({ color: 0xff0044 });
        found.push({ pos: w.toArray().map(n => +n.toFixed(3)), scaleZ: o.scale.z, geo: pr });
        // raycast from camera through the mesh centre
        const dir = w.clone().sub(camera.position).normalize();
        const rc = new THREE.Raycaster(camera.position, dir, 0.01, 10);
        const hits = rc.intersectObject(root, true).slice(0, 4).map(h => ({ d: +h.distance.toFixed(3), name: h.object.geometry.type, col: h.object.material.color ? h.object.material.color.getHexString() : '-' }));
        found[found.length-1].hits = hits;
      }
    });
    return found;
  });
  console.log(JSON.stringify(info, null, 1));
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'qa/dbg-choker.png' });
  await b.close();
})();

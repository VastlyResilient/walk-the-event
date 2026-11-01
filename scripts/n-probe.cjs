
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 3 });
  await p.goto('http://localhost:5311/char-lab.html?view=choker&pose=idle&bg=flat', { waitUntil: 'load' });
  await p.waitForTimeout(700);
  const info = await p.evaluate(() => {
    const { root, camera, THREE } = window.__charDebug;
    const out = [];
    root.traverse(o => {
      if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0x0b090e) {
        const v = new THREE.Vector3();
        o.getWorldPosition(v);
        const proj = v.clone().project(camera);
        out.push({ pos: [v.x.toFixed(3), v.y.toFixed(3), v.z.toFixed(3)],
                   screen: [Math.round((proj.x+1)/2*900), Math.round((1-proj.y)/2*900)],
                   visible: o.visible });
      }
    });
    return { count: out.length, out, cam: camera.position.toArray(), fov: camera.fov };
  });
  console.log(JSON.stringify(info, null, 1));
  await b.close();
})();

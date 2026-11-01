
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:5311/char-lab.html?view=three-quarter&pose=walk&bg=flat', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  for (let i=0;i<5;i++) { await p.screenshot({ path: `qa/walk-${i}.png` }); await p.waitForTimeout(140); }
  await p.goto('http://localhost:5311/char-lab.html?view=three-quarter&pose=idle&bg=flat', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: 'qa/idle-0.png' });
  await p.waitForTimeout(140);
  await p.screenshot({ path: 'qa/idle-1.png' });
  await b.close();
})();

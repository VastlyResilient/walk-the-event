
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 3 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  for (const view of ['face','choker']) {
    await p.goto(`http://localhost:5311/char-lab.html?view=${view}&pose=idle&bg=flat`, { waitUntil: 'load' });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `qa/z-${view}.png` });
  }
  console.log('ERR', JSON.stringify(errs));
  await b.close();
})();

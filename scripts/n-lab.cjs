
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const views = [
    ['front','idle','dark'], ['three-quarter','idle','dark'], ['side','idle','dark'],
    ['back','idle','dark'], ['bust','idle','paper'], ['head','idle','paper'],
    ['three-quarter','walk','paper'],
  ];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 760, height: 1040 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGE ' + e.message));
  for (const [view, pose, bg] of views) {
    await p.goto(`http://localhost:5311/char-lab.html?view=${view}&pose=${pose}&bg=${bg}`, { waitUntil: 'load' });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `qa/n-${view}-${pose}.png` });
  }
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();

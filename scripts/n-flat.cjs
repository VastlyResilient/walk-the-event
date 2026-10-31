
const { chromium } = require('playwright');
(async () => {
  const views = [['front'],['three-quarter'],['side'],['back'],['bust'],['head'],['three-quarter','walk']];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGE ' + e.message));
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  for (const [view, pose='idle'] of views) {
    await p.goto(`http://localhost:5311/char-lab.html?view=${view}&pose=${pose}&bg=flat`, { waitUntil: 'load' });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `qa/f-${view}-${pose}.png` });
  }
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();

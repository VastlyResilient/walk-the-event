
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);await p.click('#start-btn');await p.waitForTimeout(2500);
 for(let i=0;i<5;i++){await p.mouse.wheel(0,900);await p.waitForTimeout(180);}
 const s=await p.evaluate(()=>{const d=window.__charDebug;return {t:d.action?.time,ts:d.action?.timeScale,vt:document.querySelector('video')?.currentTime}});
 console.log(JSON.stringify(s));
 await p.screenshot({path:'qa/char-walking.png'});await p.locator('.guide').screenshot({path:'qa/char-walking-crop.png'});
 await b.close();
})();

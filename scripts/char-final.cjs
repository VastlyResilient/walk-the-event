
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);await p.click('#start-btn');await p.waitForTimeout(2200);
 await p.evaluate(()=>{location.hash='#station-space-screen'});await p.waitForTimeout(2200);
 const x=await p.$('#ov-close'); if(x) await x.click(); await p.waitForTimeout(1000);
 await p.screenshot({path:'qa/char-final-64.png'});await p.locator('.guide').screenshot({path:'qa/char-final-crop-64.png'});
 await b.close();
})();

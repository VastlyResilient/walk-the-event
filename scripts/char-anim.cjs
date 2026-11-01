
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);await p.click('#start-btn');await p.waitForTimeout(3000);
 const get=()=>p.evaluate(()=>{const d=window.__charDebug;let f=null;d.model.traverse(o=>{if(o.name==='LeftFoot')f=o});const e=f?.matrixWorld.elements;return {t:d.action?.time,ts:d.action?.timeScale,foot:e?[e[12],e[13],e[14]]:null}});
 const s1=await get(); await p.locator('.guide').screenshot({path:'qa/char-crop-a.png'});
 await p.waitForTimeout(700); const s2=await get(); await p.locator('.guide').screenshot({path:'qa/char-crop-b.png'});
 console.log(JSON.stringify({s1,s2}));
 await p.evaluate(()=>{location.hash='#station-projector'});await p.waitForTimeout(2200);
 const x=await p.$('#ov-close'); if(x) await x.click(); await p.waitForTimeout(1200);
 await p.screenshot({path:'qa/char-big-48.png'}); await p.locator('.guide').screenshot({path:'qa/char-big-crop-48.png'});
 await b.close();
})();

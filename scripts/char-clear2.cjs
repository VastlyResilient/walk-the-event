
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);await p.click('#start-btn');await p.waitForTimeout(2500);
 for (const [id,name] of [['led-camera','16'],['space-screen','64'],['cpu-terminals','91']]) {
   await p.evaluate(id=>{location.hash='#station-'+id},id); await p.waitForTimeout(2200);
   const x=await p.$('#ov-close'); if(x) await x.click(); await p.waitForTimeout(1200);
   const info=await p.evaluate(()=>({t:document.querySelector('video')?.currentTime,guide:document.querySelector('.guide')?.getBoundingClientRect().toJSON()}));
   console.log(name,JSON.stringify(info)); await p.screenshot({path:'qa/char-clear-'+name+'.png'});
 }
 await b.close();
})();

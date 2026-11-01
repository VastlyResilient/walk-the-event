
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
 const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);await p.click('#start-btn');await p.waitForTimeout(2500);
 await p.evaluate(()=>{location.hash='#station-space-screen'});await p.waitForTimeout(2200);
 const x=await p.$('#ov-close'); if(x) await x.click(); await p.waitForTimeout(900);
 console.log('at64',await p.evaluate(()=>document.querySelector('video').currentTime));
 await p.screenshot({path:'qa/char-tint-64.png'});
 for(let i=0;i<4;i++){await p.mouse.wheel(0,260);await p.waitForTimeout(250);}
 console.log('after',await p.evaluate(()=>({t:document.querySelector('video').currentTime,ts:window.__charDebug.action.timeScale,g:document.querySelector('.guide').getBoundingClientRect().left})));
 await p.screenshot({path:'qa/char-tint-66.png'});
 console.log('errs',errs.join(' | '));
 await b.close();
})();

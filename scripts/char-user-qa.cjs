
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
 const logs=[];p.on('console',m=>logs.push(m.type()+': '+m.text()));p.on('pageerror',e=>logs.push('PAGEERROR '+e.message));
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(1200);
 await p.click('#start-btn');
 await p.waitForTimeout(4500);
 const info=await p.evaluate(()=>({model:!!window.__charDebug?.model, guide:document.querySelector('.guide')?.getBoundingClientRect().toJSON(), cls:document.querySelector('.guide')?.className, canvas:document.querySelector('.char-canvas')?.toDataURL().length}));
 console.log(JSON.stringify(info));
 await p.screenshot({path:'qa/char-user-start.png'});
 console.log(logs.join('\n'));
 await b.close();
})();

const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:3});
 const errs=[];p.on('pageerror',e=>errs.push('PAGE '+e.message));
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'load'});await p.waitForTimeout(1000);
 await p.click('#start-btn');await p.waitForTimeout(2200);
 await p.evaluate(()=>{
   document.documentElement.style.background='#77736f';
   for (const sel of ['.curtain','#stage','.topbar','.rail','#hint','#hotspots','.vignette']) {
     document.querySelectorAll(sel).forEach(e=>e.style.visibility='hidden');
   }
   const g=document.getElementById('guide'); if(g){g.style.filter='none';}
 });
 await p.waitForTimeout(300);
 const box=await p.locator('#guide').boundingBox();
 console.log('GUIDE',JSON.stringify(box));
 await p.screenshot({path:'qa/char-iso.png',clip:{x:box.x-30,y:box.y-30,width:box.width+60,height:box.height+60}});
 console.log('ERRORS',JSON.stringify(errs));await b.close();
})();
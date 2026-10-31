
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
 const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGE '+e.message));
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'load'});await p.waitForTimeout(1200);
 await p.screenshot({path:'qa/char-intro.png'});
 await p.click('#start-btn');await p.waitForTimeout(2500);
 await p.screenshot({path:'qa/char-walk.png'});
 await p.evaluate(()=>{document.getElementById('stage').dispatchEvent(new WheelEvent('wheel',{deltaY:700,bubbles:true,cancelable:true}))});
 await p.waitForTimeout(900);await p.screenshot({path:'qa/char-walking.png'});
 const box=await p.locator('#guide').boundingBox();console.log('GUIDE',JSON.stringify(box));
 await p.screenshot({path:'qa/char-crop.png',clip:{x:Math.max(0,box.x-20),y:Math.max(0,box.y-20),width:box.width+40,height:Math.min(900-box.y+20,box.height+40)}});
 console.log('ERRORS',JSON.stringify(errs));await b.close();
})();
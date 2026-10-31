const {chromium}=require('playwright');
const B=process.env.B||'http://127.0.0.1:4181/';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
for(const id of ['led-camera','projector','space-screen','merch','cpu-terminals']){
 await p.goto('about:blank');await p.goto(B+'?v=live#station-'+id,{waitUntil:'domcontentloaded'});await p.waitForTimeout(2600);
 await p.keyboard.press('Escape');await p.waitForTimeout(500);
 const m=await p.evaluate(()=>{const h=[...document.querySelectorAll('.hotspot')].find(x=>!x.classList.contains('off'));const r=h&&h.getBoundingClientRect();const v=document.querySelector('video');return {t:v&&v.currentTime,op:h&&getComputedStyle(h).opacity,box:r?{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}:null,tag:h&&h.querySelector('.tag')?.textContent}});
 console.log(id,JSON.stringify(m));await p.screenshot({path:'qa/live-st-'+id+'.png'});}
await b.close()})();

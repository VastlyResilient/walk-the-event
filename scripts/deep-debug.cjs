const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
p.on('console',m=>console.log('CON',m.type(),m.text()));
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto('http://127.0.0.1:4180/walk-the-event/?v=dbg#station-led-camera',{waitUntil:'domcontentloaded'});
for(let i=0;i<8;i++){await p.waitForTimeout(400);console.log(i,JSON.stringify(await p.evaluate(()=>{const v=document.querySelector('video');return {hash:location.hash,t:v&&v.currentTime,rs:v&&v.readyState,dur:v&&v.duration,overlay:document.getElementById('overlay')?.className,card:!!document.querySelector('.station-card')}})))}
await b.close()})();

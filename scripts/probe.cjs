const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
await p.goto('http://127.0.0.1:4173/#station-led-camera',{waitUntil:'networkidle'});await p.waitForTimeout(3000);await p.keyboard.press('Escape');await p.waitForTimeout(700);
console.log(JSON.stringify(await p.evaluate(()=>({
 guide:document.querySelector('.guide')?.getBoundingClientRect().toJSON(),
 bubble:document.querySelector('#bubble')?.getBoundingClientRect().toJSON(),
 vids:[...document.querySelectorAll('video')].map(v=>({r:v.getBoundingClientRect().toJSON(),t:v.currentTime,paused:v.paused,src:v.currentSrc})),
 hotspots:[...document.querySelectorAll('.hotspot')].map(d=>({id:d.dataset.station||d.className,r:d.getBoundingClientRect().toJSON(),op:getComputedStyle(d).opacity})),
 hint:document.querySelector('.hint')?.getBoundingClientRect().toJSON()
})),null,1));await p.screenshot({path:'qa/probe.png'});await b.close();})();
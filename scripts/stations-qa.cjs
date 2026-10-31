const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
const ids=['led-camera','projector','space-screen','merch','cpu-terminals'];
for(const id of ids){
  await p.goto('about:blank');
  await p.goto('http://127.0.0.1:4173/?v='+Date.now()+'#station-'+id,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2200);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(900);
  const info=await p.evaluate(()=>{const v=document.querySelector('video');const hs=[...document.querySelectorAll('.hotspot')].map(h=>({txt:h.textContent.trim().slice(0,40),rect:h.getBoundingClientRect().toJSON(),op:getComputedStyle(h).opacity})).filter(h=>h.rect.width>1);const fr=document.querySelector('.video-frame')?.getBoundingClientRect().toJSON();return {t:v?.currentTime,d:v?.duration,hs,fr};});
  console.log(id,JSON.stringify(info));
  await p.screenshot({path:'qa/st-'+id+'.png'});
}
await b.close();})();
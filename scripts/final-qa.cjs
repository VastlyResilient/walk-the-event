const {chromium}=require('playwright');
const B='http://127.0.0.1:4182/walk-the-event/';
(async()=>{
 const b=await chromium.launch();
 const errors=[];
 async function page(w,h){const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();
  p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  p.on('pageerror',e=>errors.push('pageerror: '+e.message));
  p.on('requestfailed',r=>errors.push('reqfail: '+r.url()+' '+r.failure().errorText));
  await p.goto(B+'?v=final',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);return p;}
 let p=await page(1440,960);
 await p.screenshot({path:'qa/final-home.png'});
 const intro=await p.locator('#start-btn').count();
 if(intro){await p.click('#start-btn');await p.waitForTimeout(2800);}
 await p.screenshot({path:'qa/final-walk.png'});
 console.log('AFTERSTART',JSON.stringify(await p.evaluate(()=>{const i=document.getElementById('intro');return {cls:i.className,disp:getComputedStyle(i).display,op:getComputedStyle(i).opacity}})) );
 const home=await p.evaluate(()=>{const v=document.querySelector('video');return {title:document.title,src:v&&v.currentSrc,dur:v&&v.duration,ready:v&&v.readyState,txt:document.body.innerText.slice(0,180)}});
 console.log('HOME',JSON.stringify(home));
 await p.goto(B+'map/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(700);await p.screenshot({path:'qa/final-map.png'});
 console.log('MAP',JSON.stringify(await p.evaluate(()=>{const i=document.getElementById('intro');const b=document.querySelector('.map-svg-box');const r=b&&b.getBoundingClientRect();return {h1:document.querySelector('.map-head h1')?.textContent,shapes:document.querySelectorAll('.map-station').length,path:location.pathname,intro:i.className,disp:getComputedStyle(i).display,box:r?{w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom),vh:innerHeight}:null}})) );
 await p.goto(B+'stations/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(700);await p.screenshot({path:'qa/final-stations.png'});
 console.log('STATIONS',JSON.stringify(await p.evaluate(()=>({cards:document.querySelectorAll('.station-card').length,text:document.body.innerText.slice(0,160)}))) );
 for(const id of ['led-camera','projector','space-screen','merch','cpu-terminals']){
  await p.goto('about:blank');await p.goto(B+'?v=final#station-'+id,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1200);
  await p.keyboard.press('Escape');await p.waitForTimeout(700);
  const r=await p.evaluate(()=>({t:document.querySelector('video')?.currentTime,vis:[...document.querySelectorAll('.hotspot')].filter(h=>parseFloat(getComputedStyle(h).opacity)>.1).map(h=>({t:h.textContent.trim().slice(0,24),w:h.getBoundingClientRect().width}))}));
  console.log('DEEP',id,JSON.stringify(r));
 }
 let m=await page(390,844);await m.screenshot({path:'qa/final-mobile.png'});
 const mob=await m.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,text:document.body.innerText.slice(0,120)}));
 console.log('MOBILE',JSON.stringify(mob));
 await m.goto(B+'map/',{waitUntil:'domcontentloaded'});await m.waitForTimeout(600);await m.screenshot({path:'qa/final-mobile-map.png',fullPage:true});
 console.log('ERRORS',JSON.stringify(errors.slice(0,20)));
 await b.close();
})();
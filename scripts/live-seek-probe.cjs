
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();
 for(let i=0;i<3;i++){
  const p=await b.newPage({viewport:{width:1440,height:960}});
  await p.goto('https://vastlyresilient.github.io/walk-the-event/#station-projector',{waitUntil:'domcontentloaded'});
  for(const ms of [500,1000,2000,4000]){
   await p.waitForTimeout(ms);
   const s=await p.evaluate(()=>{const v=document.querySelector('video');return {t:+v.currentTime.toFixed(2),r:v.readyState,n:v.networkState,seek:v.seeking,err:v.error&&v.error.code,hash:location.hash,ov:document.querySelector('#overlay')?.className}});
   console.log(i,ms,JSON.stringify(s));
  }
  await p.close();
 }
 await b.close();
})();

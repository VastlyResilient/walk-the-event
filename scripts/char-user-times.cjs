
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
 const logs=[];p.on('console',m=>{if(m.type()==='error')logs.push(m.text())});p.on('pageerror',e=>logs.push('PAGEERROR '+e.message));
 await p.goto('http://127.0.0.1:4185/walk-the-event/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(900);await p.click('#start-btn');await p.waitForTimeout(3000);
 for (const [id,name] of [['projector','48'],['space-screen','64'],['merch','83'],['cpu-terminals','91']]) {
   await p.evaluate(id=>{location.hash='#station-'+id},id);
   await p.waitForTimeout(2600);
   const info=await p.evaluate(()=>({hash:location.hash,time:document.querySelector('.time')?.textContent,guide:document.querySelector('.guide')?.getBoundingClientRect().toJSON(),cls:document.querySelector('.guide')?.className}));
   console.log(name,JSON.stringify(info));
   await p.screenshot({path:'qa/char-user-'+name+'.png'});
 }
 console.log('errors',logs.join(' | '));
 await b.close();
})();


const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
await p.goto('http://127.0.0.1:4173/map/',{waitUntil:'networkidle'});await p.waitForTimeout(800);await p.screenshot({path:'qa/map-v2.png',fullPage:true});
await p.goto('http://127.0.0.1:4173/#station-led-camera',{waitUntil:'networkidle'});await p.waitForTimeout(2500);await p.keyboard.press('Escape');await p.waitForTimeout(700);await p.screenshot({path:'qa/station-outline.png'});
await b.close();})();

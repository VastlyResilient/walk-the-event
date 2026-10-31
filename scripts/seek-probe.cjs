const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto(process.argv[2],{waitUntil:'domcontentloaded'});await p.waitForTimeout(3500);
console.log(await p.evaluate(async()=>{const v=document.querySelector('video');const before={t:v.currentTime,rs:v.readyState,seek:v.seekable.length?[v.seekable.start(0),v.seekable.end(0)]:[]};v.currentTime=16.5;await new Promise(r=>setTimeout(r,1200));return {before,after:v.currentTime,seek2:v.seekable.length?[v.seekable.start(0),v.seekable.end(0)]:[]}}));
await b.close()})();

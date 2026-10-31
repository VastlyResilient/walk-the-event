
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:4173";
const OUT = new URL("./runs/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });

const shot = (n) => page.screenshot({ path: OUT + n });

// 1. intro
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await shot("01-intro.png");
// 2. start walk
await page.click("#start-btn");
await page.waitForTimeout(1500);
await shot("02-walk-start.png");
// 3. scroll forward into first station window (led-camera 13.5-19.5)
for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(60); }
await page.waitForTimeout(2500);
await shot("03-walk-scrolled.png");
const t1 = await page.evaluate(() => document.getElementById("timecode")?.textContent);
// 4. hotspot visible?
const hs = await page.evaluate(() => [...document.querySelectorAll(".hotspot")].filter(e => !e.classList.contains("off")).map(e => ({ w: e.style.width, h: e.style.height, tag: e.textContent })));
// 5. click hotspot if present
if (hs.length) { await page.click(".hotspot:not(.off)"); await page.waitForTimeout(1200); await shot("04-station-open.png"); await page.click("#ov-back"); await page.waitForTimeout(800); }
// 6. floor switch
await page.click('[data-floor="up"]');
await page.waitForTimeout(1800);
await shot("05-upstairs.png");
// 7. map
await page.goto(BASE + "/map", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
await shot("06-map.png");
// 8. stations gallery
await page.goto(BASE + "/stations", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
await shot("07-stations.png");
// 9. deep link
await page.goto(BASE + "/#station-tvs", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await shot("08-deeplink-tvs.png");
const overlayOpen = await page.evaluate(() => document.getElementById("overlay")?.classList.contains("open"));
// 10. ask drawer
await page.goto(BASE + "/map", { waitUntil: "domcontentloaded" });
await page.click("#ask-btn");
await page.fill("#ask-in", "what is mandala?");
await page.click('.ask-form button[type="submit"]');
await page.waitForTimeout(400);
await shot("09-ask.png");
const askAnswer = await page.evaluate(() => document.querySelector(".ask-a")?.textContent);
// 11. mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.click("#start-btn");
await page.waitForTimeout(1200);
await shot("10-mobile.png");

console.log(JSON.stringify({ t1, hotspots: hs, overlayOpen, askAnswer, errors }, null, 1));
await browser.close();

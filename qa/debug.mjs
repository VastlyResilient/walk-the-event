
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
page.on("pageerror", e => console.log("PAGEERROR:", e.message));
page.on("console", m => console.log("CONSOLE:", m.type(), m.text()));
await page.goto("http://localhost:4173/#station-tvs", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
console.log(await page.evaluate(() => ({
  hash: location.hash,
  overlay: document.getElementById("overlay")?.className,
  timecode: document.getElementById("timecode")?.textContent,
  intro: document.getElementById("intro")?.className,
  vidTime: document.querySelector("video")?.currentTime,
  readyState: document.querySelector("video")?.readyState,
})));
await browser.close();

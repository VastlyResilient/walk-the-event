
import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:4173/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(800);
await p.click("#start-btn");
await p.waitForTimeout(1500);
await p.screenshot({ path: "qa/runs/11-mobile-fixed.png" });
await b.close();

/**
 * End-to-end checks of the real app in a real browser (Chrome), run in CI.
 * Starts `vite preview` on the built site and walks through the main flows
 * a singer uses. Any page error fails the run.
 *
 *   npm run build:site && npm run e2e
 * CHROME_PATH can point at a Chrome binary; otherwise the usual paths are tried.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const chrome = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(p => p && existsSync(p));
if (!chrome) { console.error("No Chrome found; set CHROME_PATH."); process.exit(1); }

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
const wait = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await wait(500); }

const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const errors = [];
let passed = 0, failed = 0;

async function page(viewport) {
  const p = await browser.newPage();
  await p.setViewport(viewport);
  p.on("pageerror", e => errors.push(e.message));
  await p.evaluateOnNewDocument(() => { if (!sessionStorage.getItem("e2e")) { localStorage.clear(); localStorage.setItem("naad.lang", "en"); sessionStorage.setItem("e2e", "1"); } });
  await p.goto(BASE, { waitUntil: "networkidle0" });
  return p;
}
async function enter(p, name = "Test singer") {
  await (await p.waitForSelector(".ln-open")).click();
  await p.waitForSelector(".pp-field input");
  await p.type(".pp-field input", name);
  await (await p.$("button[type=submit]")).click();
  await p.waitForSelector(".app-main h1", { timeout: 15000 });
}
const text = (p, sel) => p.$eval(sel, e => e.textContent.trim());
async function flow(name, fn) {
  const before = errors.length;
  try {
    await fn();
    if (errors.length > before) throw new Error(`page error: ${errors.slice(before).join("; ")}`);
    passed++; console.log(`  ok  ${name}`);
  } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const desktop = { width: 1366, height: 860 };
const phone = { width: 390, height: 844, isMobile: true, hasTouch: true };

await flow("welcome page shows the product and opens the app", async () => {
  const p = await page(desktop);
  const h1 = await text(p, "#ln-title");
  if (!/Riyaz/.test(h1)) throw new Error(`unexpected title ${h1}`);
  if ((await p.$$(".ln-feat")).length !== 4) throw new Error("expected four feature rows");
  await enter(p);
  if (!/Pranam/.test(await text(p, ".app-main h1"))) throw new Error("Today screen did not open");
  await p.close();
});

await flow("quick find opens a raag by name", async () => {
  const p = await page(desktop);
  await enter(p);
  await p.keyboard.down("Control"); await p.keyboard.press("k"); await p.keyboard.up("Control");
  await p.waitForSelector(".cb input");
  await p.type(".cb input", "marwa");
  await p.keyboard.press("Enter");
  await p.waitForFunction(() => document.querySelector(".app-main h1")?.textContent?.includes("Marwa"), { timeout: 8000 });
  await p.close();
});

await flow("raag comparison shows shared and differing swaras", async () => {
  const p = await page(desktop);
  await enter(p);
  await p.$$eval(".nv-link", bs => bs.find(b => b.textContent.includes("Raag library")).click());
  await p.waitForSelector(".lib-head");
  await p.$$eval(".lib-filters .btn", bs => bs[0].click());
  await p.waitForSelector(".rc-strip");
  await p.$$eval(".rc-pairs button", bs => bs[1].click()); // Bhupali and Shuddha Kalyan
  await wait(300);
  const states = await p.$$eval(".rc-sw", els => els.map(e => e.dataset.state));
  if (!states.includes("both") || !(states.includes("a") || states.includes("b"))) throw new Error(`unexpected swara states ${states}`);
  await p.close();
});

await flow("demo analysis produces a take summary", async () => {
  const p = await page(desktop);
  await enter(p);
  await p.$$eval(".nv-link", bs => bs.find(b => b.textContent.includes("Analysis")).click());
  await p.waitForSelector(".az-studio");
  await p.$$eval(".az-rec-alt button", bs => bs[1].click());
  await p.waitForSelector(".tr-summary", { timeout: 60000 });
  const pct = await text(p, ".tr-gauge-n");
  if (!/^\d+%$/.test(pct)) throw new Error(`gauge shows ${pct}`);
  await p.$$eval(".tr-tabs button", bs => bs[1].click());
  await p.waitForSelector(".tr-table");
  await p.close();
});

await flow("journal entry is saved", async () => {
  const p = await page(desktop);
  await enter(p);
  await p.$$eval(".nv-link", bs => bs.find(b => b.textContent.includes("Journal")).click());
  await (await p.waitForSelector(".empty-state .btn")).click();
  await p.waitForSelector("form");
  const area = await p.$("form textarea");
  if (area) await area.type("Worked on Ga in Yaman.");
  await p.$eval("form", f => f.requestSubmit());
  await p.waitForSelector(".ts", { timeout: 5000 });
  await p.close();
});

await flow("phone layout: tab bar, account sheet and Hindi", async () => {
  const p = await page(phone);
  await enter(p);
  const tabs = await p.$$eval(".nv-tabbar button", bs => bs.length);
  if (tabs !== 5) throw new Error(`tab bar has ${tabs} items`);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth);
  if (wide > 392) throw new Error(`page is ${wide}px wide on a 390px phone`);
  await (await p.$(".nv-me-btn")).click();
  await p.waitForSelector(".nv-sheet");
  await p.$$eval(".nv-sheet .nv-lang button", bs => bs[1].click());
  await p.waitForFunction(() => document.querySelector(".nv-sheet-list button span")?.textContent === "प्रगति");
  await p.close();
});

await flow("every screen opens on a phone without overflowing", async () => {
  const p = await page(phone);
  await enter(p);
  for (let i = 0; i < 5; i++) {
    await p.$$eval(".nv-tabbar button", (bs, i) => bs[i].click(), i);
    await wait(900);
    const wide = await p.evaluate(() => document.documentElement.scrollWidth);
    if (wide > 392) throw new Error(`tab ${i} is ${wide}px wide`);
  }
  await p.close();
});

await browser.close();
server.kill();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
// Record the assembly cell's live page running, in real time, driven as a person drives it
// (the author, 2026-11-27: record the running demo, rotate and zoom with mouse gestures): a
// visible pointer, the speed menu set to 4x, Play pressed; while it plays, the pointer clicks
// Close up (a joint at the vise) or Whole cell (an arm fetching a part: work/SLUG/track.json),
// drags to turn the view and scrolls to zoom. Each scene with a cell.join starts its join's
// span when the scene starts (cell.play(from, to), at the menu's 4x); a scene longer than its
// span at 4x (its narration is) holds its last moment. The screen is captured by Chrome's
// screencast (each frame with its time), resampled to the lesson's frame rate.
//   scripts/cell-live.mjs SLUG [SECONDS]   # SECONDS: only the first so many (a test)
// Writes remotion/public/captures/SLUG-landscape.mp4 (and work/SLUG/live/ frames).
import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, limit] = process.argv.slice(2);
if (!slug) { console.error("usage: cell-live.mjs SLUG [SECONDS]"); process.exit(2); }
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
const timing = JSON.parse(readFileSync(join(root, "lessons", slug, "timing.json"), "utf8"));
const joins = JSON.parse(readFileSync(join(root, "lessons", slug, "joins.json"), "utf8"));
const track = JSON.parse(readFileSync(join(root, "work", slug, "track.json"), "utf8"));
const fps = timing.fps;
const idx = lesson.scenes.map((s, i) => (s.cell ? i : -1)).filter((i) => i >= 0);
const first = idx[0], last = idx[idx.length - 1];
const at = (f) => (timing.starts[f] - timing.starts[first]) / fps;            // a scene's start, s from the recording's
const total = Math.min((timing.ends[last] - timing.starts[first]) / fps, limit ? Number(limit) : Infinity);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// how far the action is from the vise at simulated time t (the track: the cell's frame, mm)
const away = (t) => { const p = track.points[Math.max(0, Math.min(track.points.length - 1, Math.round(t / track.dt)))]; return Math.hypot(p[0], p[1], p[2] - 15); };

const { chromium } = createRequire(join(root, "remotion", "package.json"))("playwright");
const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
// a pointer to see (a headless page draws none)
await context.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.id = "rec-pointer";
    c.style.cssText = "position:fixed;left:0;top:0;width:26px;height:26px;z-index:99999;pointer-events:none;transform:translate(-3px,-2px)";
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2 L3 21 L8 16 L12 24 L15 23 L11 15 L18 15 Z" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>';
    document.body.appendChild(c);
    const move = (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; };
    addEventListener("pointermove", move, true); addEventListener("pointerdown", move, true); addEventListener("mousemove", move, true);
  });
});
const page = await context.newPage();
await page.goto(joins.source, { waitUntil: "commit", timeout: 0 });
await page.waitForFunction(() => /: (ready|error)$/.test(document.title), null, { timeout: 0 });
if (/error$/.test(await page.title())) { console.error("cell-live: the page reports an error"); process.exit(1); }
await page.evaluate(() => cell.stop());
// the page's program must be the one the joins were read from (the published page changes)
const live = await page.evaluate(() => ({ duration: cell.state.duration, steps: document.querySelectorAll("#cellsteps li").length }));
if (Math.abs(live.duration - joins.duration) > 0.01 || live.steps !== joins.steps) {
  console.error(`cell-live: the page's program changed (${live.steps} steps, ${live.duration.toFixed(2)} s; joins.json has ${joins.steps}, ${joins.duration}): read the joins again`);
  process.exit(1);
}

// the pointer moves as a hand does: eased, in steps
let pointer = [960, 600];
const glide = async (x, y, secs = 0.6) => {
  const [x0, y0] = pointer, n = Math.max(2, Math.round(secs * 30));
  for (let k = 1; k <= n; k++) { const e = k / n, s = e * e * (3 - 2 * e); await page.mouse.move(x0 + (x - x0) * s, y0 + (y - y0) * s); await sleep((secs * 1000) / n); }
  pointer = [x, y];
};
const button = async (text) => { const b = page.locator(`button:has-text("${text}")`).first(); const r = await b.boundingBox(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; };
const press = async (text) => { const p = await button(text); if (!p) return false; await glide(p[0], p[1], 0.5); await page.mouse.down(); await sleep(80); await page.mouse.up(); await sleep(150); return true; };
const drag = async (dx, dy, secs = 1.4) => {
  const [x, y] = [1100 + (Math.random() - 0.5) * 80, 560 + (Math.random() - 0.5) * 60];
  await glide(x, y, 0.4); await page.mouse.down();
  const n = Math.round(secs * 30);
  for (let k = 1; k <= n; k++) { const e = k / n, s = e * e * (3 - 2 * e); await page.mouse.move(x + dx * s, y + dy * s); await sleep((secs * 1000) / n); }
  await page.mouse.up(); pointer = [x + dx, y + dy];
};
const scroll = async (dy, steps = 6) => { for (let k = 0; k < steps; k++) { await page.mouse.wheel(0, dy / steps); await sleep(60); } };

// the screencast: every frame Chrome paints, written as it comes (only its time kept)
const raw = join(root, "work", slug, "live-raw");
rmSync(raw, { recursive: true, force: true }); mkdirSync(raw, { recursive: true });
const frames = [];
const cdp = await context.newCDPSession(page);
cdp.on("Page.screencastFrame", async (e) => { const file = join(raw, `${frames.length}.jpg`); writeFileSync(file, Buffer.from(e.data, "base64")); frames.push({ t: e.metadata.timestamp, file }); try { await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }); } catch {} });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
await sleep(300);
const t0 = Date.now() / 1000;
const now = () => Date.now() / 1000 - t0;

// the intro (the first scene): the whole cell; the pointer picks 4x and presses Play as it ends
await page.mouse.move(...pointer);
const introEnd = at(first + 1);
await sleep(1500);
await scroll(-500); await sleep(800);
await drag(-220, 30, 2.0); await sleep(600);
const menu = page.locator("select").filter({ has: page.locator("option", { hasText: "4x" }) }).first();
const mb = await menu.boundingBox();
if (mb) { await glide(mb.x + mb.width / 2, mb.y + mb.height / 2, 0.8); await sleep(300); }
await menu.selectOption({ label: "4x" }); await page.evaluate(() => { cell.speed = 4; });
await sleep(500);
await glide(...(await button("Play")), 0.8);
while (now() < introEnd - 0.2) await sleep(30);
await page.mouse.down(); await sleep(60); await page.mouse.up();
await page.evaluate(() => cell.stop());

// the joins, each from its scene's start; the director moves the camera meanwhile
let mode = "whole", lastMove = 0, lastScroll = 0;
const director = async () => {
  while (now() < total) {
    const t = await page.evaluate(() => cell.state.t);
    const want = away(t) > 60 ? "whole" : "close";
    if (want !== mode && now() - lastMove > 2.5) {
      mode = want; lastMove = now();
      await press(mode === "close" ? "Close up" : "Whole cell");
      if (mode === "whole") await scroll(-450);      // the whole cell, a little nearer
      await sleep(400);
    } else if (now() - lastMove > 5.5) {
      lastMove = now();
      await drag((Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 80), (Math.random() - 0.5) * 50, 1.6);
    } else if (mode === "close" && now() - lastScroll > 9) {
      lastScroll = now(); await scroll(Math.random() < 0.5 ? -140 : 120);
    }
    await sleep(150);
  }
};
const run = async () => {
  for (const i of idx.slice(1)) {
    const s = lesson.scenes[i];
    while (now() < at(i)) await sleep(10);
    if (now() >= total) break;
    if (s.cell.join) { const j = joins.joins.find((x) => x.id === s.cell.join); page.evaluate(({ a, b }) => { cell.play(a, b); }, { a: j.from, b: j.to }); }
    else page.evaluate((h) => { cell.stop(); cell.seek(h); }, s.cell.hold);
    console.log(`cell-live: ${now().toFixed(1)} s, ${s.id}`);
  }
  while (now() < total) await sleep(50);
};
// the step list follows the current step (the live page leaves it where it is)
const follow = async () => {
  while (now() < total) {
    await page.evaluate(() => { const list = document.getElementById("cellsteps"), li = list && list.children[cell.state.step - 1]; if (li) { const r = li.offsetTop - list.clientHeight / 2; list.scrollTop += (r - list.scrollTop) * 0.5; } });
    await sleep(100);
  }
};
await Promise.all([run(), director(), follow()]);
await cdp.send("Page.stopScreencast");
await browser.close();

// resampled to a constant frame rate: for each tick, the newest frame painted by then
const dir = join(root, "work", slug, "live");
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
frames.sort((a, b) => a.t - b.t);
const n = Math.round(total * fps); let k = 0;
for (let f = 0; f < n; f++) {
  const tick = t0 + f / fps;
  while (k + 1 < frames.length && frames[k + 1].t <= tick) k++;
  copyFileSync(frames[k].file, join(dir, `${String(f).padStart(5, "0")}.jpg`));
}
mkdirSync(join(root, "remotion", "public", "captures"), { recursive: true });
const out = limit ? join(root, "out", `${slug}-sample`, "live-test.mp4") : join(root, "remotion", "public", "captures", `${slug}-landscape.mp4`);
mkdirSync(dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(fps), "-i", join(dir, "%05d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out], { stdio: "inherit" });
console.log(`cell-live: ${out} (${n} frames from ${frames.length} painted, ${total.toFixed(1)} s)`);

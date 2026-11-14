#!/usr/bin/env node
// Record a lesson's live demo page (docs/plan.md V8): the published
// page of the lesson's "demo", in headless Chromium (Playwright, from
// remotion/node_modules), at the size each format's capture area has,
// so a recorded pixel is a pixel of the video. The lesson's scenes
// with a "capture" are one continuous recording: each scene's actions
// (click, select, scroll, wait) run when the scene starts, and the
// recording lasts as long as those scenes do, so it lines up with the
// schedule X_eTaL computes.
//   scripts/capture.mjs SLUG [landscape|portrait]...
// Writes remotion/public/captures/SLUG-FORMAT.mp4 (not tracked).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(join(root, "remotion", "package.json"))("playwright");

// The capture area of each format (remotion/src/Lesson.tsx draws the
// recording at exactly this size).
export const AREAS = { landscape: [1720, 700], portrait: [940, 1480] };

const [slug, ...formats] = process.argv.slice(2);
if (!slug || formats.some((f) => !AREAS[f])) {
  console.error("usage: capture.mjs SLUG [landscape|portrait]...");
  process.exit(2);
}
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
if (!lesson.demo) { console.error(`capture: ${slug} names no demo`); process.exit(1); }
const url = `https://softwarewrighter.github.io/${lesson.demo.repo}/${lesson.demo.slug}/`;
const scenes = lesson.scenes.filter((s) => s.capture);
if (!scenes.length) { console.error(`capture: ${slug} has no scene with a capture`); process.exit(1); }
const first = lesson.scenes.findIndex((s) => s.capture);
if (lesson.scenes.slice(first, first + scenes.length).some((s) => !s.capture)) {
  console.error(`capture: ${slug}: scenes with a capture must follow one another (one recording)`); process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

async function act(page, action) {
  if (action.wait !== undefined) await sleep(action.wait * 1000);
  else if (action.click) await page.locator(action.click).first().click();
  else if (action.select) await page.locator(action.select[0]).first().selectOption({ label: action.select[1] });
  else if (action.scroll === "top") await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  else if (action.scroll) await page.locator(action.scroll).first().evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "start" }));
}

for (const format of formats.length ? formats : Object.keys(AREAS)) {
  const [width, height] = AREAS[format];
  const dir = join(root, "work", slug, "capture", format);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir, size: { width, height } } });
  const began = Date.now();              // the recording starts with the context
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await sleep(1500);                     // the page's X_eTaL has run
  const lead = (Date.now() - began) / 1000;   // cut from the front afterwards
  const t0 = Date.now();
  let due = 0;
  for (const scene of scenes) {
    for (const action of scene.capture.actions || []) await act(page, action);
    due += scene.seconds * 1000;
    const late = Date.now() - t0 - due;
    if (late > 0) console.error(`capture: scene ${scene.id}: its actions ran ${(late / 1000).toFixed(1)} s past its ${scene.seconds} s`);
    await sleep(due - (Date.now() - t0));
  }
  await sleep(300);
  await context.close();                 // the recording is written on close
  await browser.close();
  const webm = join(dir, readdirSync(dir).find((f) => f.endsWith(".webm")));
  const out = join(root, "remotion", "public", "captures", `${slug}-${format}.mp4`);
  mkdirSync(dirname(out), { recursive: true });
  // The page-load lead cut off, a constant frame rate, the length the scenes have.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", lead.toFixed(3), "-i", webm, "-t", String(due / 1000), "-r", String(lesson.fps), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", out]);
  console.log(`capture: remotion/public/captures/${slug}-${format}.mp4 (${width}x${height}, ${(due / 1000).toFixed(1)} s, ${lead.toFixed(1)} s of loading cut)`);
}

#!/usr/bin/env node
// Record a lesson's live demo page (docs/plan.md V8) in headless
// Chromium (Playwright, from remotion/node_modules), at the size each
// format's capture area has, so a recorded pixel is a pixel of the
// video. The page is the lesson's "demo": one of this family's
// published pages, or any page by its URL (demo.url, or a scene's
// capture.url). Scenes with a capture that follow one another on the
// same page are one recording (a "run"); a lesson may have several.
// Each scene's actions (click, select, scroll, type, press, drag, wait)
// run when the scene starts, and a recording lasts as long as its
// scenes do, so it lines up with the schedule X_eTaL computes.
//
// What the page plays through Web Audio (a sample started on an
// AudioBufferSourceNode: a terminal's key strikes) is logged with the
// samples themselves, the rate and the gain each was played at, and
// mixed into a WAV of the recording's length: the page's own sound,
// since a headless recording has none.
//   scripts/capture.mjs SLUG [landscape|portrait]...   # default: the lesson's format (scripts/format.sh)
// Writes remotion/public/captures/SLUG-FORMAT.mp4 for the first run,
// SLUG-FORMAT-2.mp4 and on for the others, each with a .wav beside it
// when the page played sound (not tracked).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { captureName, runsOf } from "./capture-runs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(join(root, "remotion", "package.json"))("playwright");

// The capture area of each format (remotion/src/Lesson.tsx draws the
// recording at exactly this size; a story, remotion/src/Story.tsx, at
// full frame).
export const AREAS = { landscape: [1720, 700], portrait: [940, 1480] };
const FULL = { landscape: [1920, 1080], portrait: [1080, 1920] };

const [slug, ...asked] = process.argv.slice(2);
const formats = asked.length || !slug ? asked : (() => {
  const t = JSON.parse(readFileSync(join(root, "lessons", slug, "timing.json"), "utf8"));
  return [t.total / t.fps > 150 ? "landscape" : "portrait"];
})();
if (!slug || formats.some((f) => !AREAS[f])) {
  console.error("usage: capture.mjs SLUG [landscape|portrait]...");
  process.exit(2);
}
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
const story = lesson.kind === "story";
const pageOf = (s) => s.capture.url || lesson.demo?.url || (lesson.demo ? `https://softwarewrighter.github.io/${lesson.demo.repo}/${lesson.demo.slug}/` : null);

const runs = runsOf(lesson);
if (!runs.length) { console.error(`capture: ${slug} has no scene with a capture`); process.exit(1); }
if (!story && runs.length > 1) { console.error(`capture: ${slug}: scenes with a capture must follow one another (one recording)`); process.exit(1); }
for (const r of runs) if (!pageOf(r.scenes[0])) { console.error(`capture: ${slug}: scene ${r.scenes[0].id}: no page to record (demo or capture.url)`); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

// Logs every sample the page starts through Web Audio, with the sample
// itself (once), its rate and the gain node it plays into.
const LISTEN = () => {
  const log = (window.__sound = { buffers: [], played: [] });
  const ids = new WeakMap();
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (to, ...rest) {
    if (this instanceof AudioBufferSourceNode) this.__to = to;
    return connect.call(this, to, ...rest);
  };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...args) {
    try {
      const b = this.buffer;
      if (b) {
        let id = ids.get(b);
        if (id === undefined) { id = log.buffers.length; ids.set(b, id); log.buffers.push({ rate: b.sampleRate, data: Array.from(b.getChannelData(0)) }); }
        const gain = this.__to && this.__to.gain ? this.__to.gain.value : 1;
        log.played.push({ t: performance.timeOrigin + performance.now(), id, rate: this.playbackRate.value, gain });
      }
    } catch { /* never break the page */ }
    return start.apply(this, args);
  };
};

// A line typed a character at a time, as a typist would (an uneven but
// repeatable pace), each character pasted so any glyph can be typed,
// then Return. With the demo's "ready", waits for the page to take input.
async function type(page, text) {
  if (lesson.demo?.ready) await page.locator(lesson.demo.ready).first().waitFor({ timeout: 120000 });
  let k = 0;
  for (const ch of text) {
    await page.evaluate((c) => {
      const d = new DataTransfer();
      d.setData("text", c);
      dispatchEvent(new ClipboardEvent("paste", { clipboardData: d, bubbles: true }));
    }, ch);
    k++;
    await sleep(1000 * (0.14 + 0.08 * Math.abs(Math.sin(k * 12.9898))));
  }
  await sleep(250);
  await page.keyboard.press("Enter");
}

async function act(page, action) {
  if (action.wait !== undefined) await sleep(action.wait * 1000);
  else if (action.click) await page.locator(action.click).first().click();
  else if (action.select) await page.locator(action.select[0]).first().selectOption({ label: action.select[1] });
  else if (action.scroll === "top") await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  else if (action.scroll) await page.locator(action.scroll).first().evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "start" }));
  else if (action.type !== undefined) await type(page, action.type);
  else if (action.press) await page.keyboard.press(action.press);
  else if (action.drag) {
    const [dx, dy, secs] = action.drag;
    const { width, height } = page.viewportSize();
    const [x, y] = [width / 2, height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    const n = Math.max(1, Math.round(secs * 30));
    for (let i = 1; i <= n; i++) {
      const e = (1 - Math.cos((Math.PI * i) / n)) / 2; // eased, so the turn starts and stops gently
      await page.mouse.move(x + dx * e, y + dy * e);
      await sleep((secs * 1000) / n);
    }
    await page.mouse.up();
  }
}

// The logged sounds, as one mono 48 kHz WAV from t0 for `seconds`.
function mix(sound, t0, seconds, file) {
  const RATE = 48000;
  const out = new Float32Array(Math.ceil(seconds * RATE));
  for (const p of sound.played) {
    const b = sound.buffers[p.id];
    const at = ((p.t - t0) / 1000) * RATE;
    const step = (p.rate * b.rate) / RATE;
    for (let i = 0; ; i++) {
      const src = i * step;
      const j = Math.floor(src);
      if (j + 1 >= b.data.length) break;
      const k = Math.round(at) + i;
      if (k < 0) continue;
      if (k >= out.length) break;
      out[k] += p.gain * (b.data[j] + (b.data[j + 1] - b.data[j]) * (src - j));
    }
  }
  const pcm = Buffer.alloc(44 + out.length * 2);
  pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + out.length * 2, 4); pcm.write("WAVE", 8);
  pcm.write("fmt ", 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(RATE, 24); pcm.writeUInt32LE(RATE * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36); pcm.writeUInt32LE(out.length * 2, 40);
  out.forEach((v, i) => pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + 2 * i));
  writeFileSync(file, pcm);
}

for (const format of formats.length ? formats : Object.keys(AREAS)) {
  const [width, height] = (story ? FULL : AREAS)[format];
  for (const [k, run] of runs.entries()) {
    const dir = join(root, "work", slug, "capture", `${format}${k ? `-${k + 1}` : ""}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    // A GPU, for pages that draw with WebGL (a 3D model).
    const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
    const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir, size: { width, height } } });
    await context.addInitScript(LISTEN);
    const began = Date.now();              // the recording starts with the context
    const page = await context.newPage();
    await page.goto(pageOf(run.scenes[0]));
    await page.waitForLoadState("networkidle");
    await sleep(1500);                     // the page has run
    if (lesson.demo?.start) { await page.locator(lesson.demo.start).first().click(); await sleep(1500); }
    const lead = (Date.now() - began) / 1000;   // cut from the front afterwards
    const t0 = Date.now();
    let due = 0;
    for (const scene of run.scenes) {
      for (const action of scene.capture.actions || []) await act(page, action);
      due += scene.seconds * 1000;
      const late = Date.now() - t0 - due;
      if (late > 0) console.error(`capture: scene ${scene.id}: its actions ran ${(late / 1000).toFixed(1)} s past its ${scene.seconds} s`);
      await sleep(due - (Date.now() - t0));
    }
    const sound = await page.evaluate(() => window.__sound).catch(() => null);
    await sleep(300);
    await context.close();                 // the recording is written on close
    await browser.close();
    const webm = join(dir, readdirSync(dir).find((f) => f.endsWith(".webm")));
    const name = captureName(slug, format, k);
    const out = join(root, "remotion", "public", `${name}.mp4`);
    mkdirSync(dirname(out), { recursive: true });
    // The page-load lead cut off, a constant frame rate, the length the scenes have.
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", lead.toFixed(3), "-i", webm, "-t", String(due / 1000), "-r", String(lesson.fps), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", out]);
    rmSync(join(root, "remotion", "public", `${name}.wav`), { force: true });
    if (sound?.played.length) {
      writeFileSync(join(dir, "sound.json"), JSON.stringify({ t0, played: sound.played }));
      mix(sound, t0, due / 1000, join(root, "remotion", "public", `${name}.wav`));
    }
    console.log(`capture: remotion/public/${name}.mp4 (${width}x${height}, ${(due / 1000).toFixed(1)} s, ${lead.toFixed(1)} s of loading cut${sound?.played.length ? `, ${sound.played.length} sounds mixed into ${name}.wav` : ""})`);
  }
}

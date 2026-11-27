#!/usr/bin/env node
// Record the assembly cell's live page (X_eTaL-extensions, extensions/cell) for a lesson,
// frame by frame: for each video frame, window.cell.seek to the simulated time its scene
// maps to, set the camera, scroll the step list to the current step, screenshot. The whole
// UI shows (the panel, the step list, the timeline with the speed menu at 4x). Each scene
// from the first with a "cell" field to the last is one recording: a scene's cell.join
// (lessons/SLUG/joins.json) is played over its scene's length (about four times real
// speed), cell.hold holds one simulated time. The camera is a pure function of the video
// time (aimed at the work on the vise; wider as a join starts, closer for its soldering;
// a slow orbit throughout), so the frames of several workers join without a seam.
//   scripts/cell-record.mjs SLUG K N     # worker K of N: its share of the frames, into work/SLUG/frames/
//   scripts/cell-record.mjs SLUG encode  # the frames into remotion/public/captures/SLUG-landscape.mp4
//   scripts/cell-record.mjs SLUG track   # first: where the action is, every 0.2 simulated s (work/SLUG/track.json)
// Headless Chromium (Playwright, from remotion/node_modules), a fresh profile, the GPU (ANGLE Metal).
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, a, b] = process.argv.slice(2);
if (!slug || !a) { console.error("usage: cell-record.mjs SLUG K N | SLUG encode"); process.exit(2); }
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
const timing = JSON.parse(readFileSync(join(root, "lessons", slug, "timing.json"), "utf8"));
const joins = JSON.parse(readFileSync(join(root, "lessons", slug, "joins.json"), "utf8"));
const fps = timing.fps;
const idx = lesson.scenes.map((s, i) => (s.cell ? i : -1)).filter((i) => i >= 0);
const first = idx[0], last = idx[idx.length - 1];
const from = timing.starts[first], to = timing.ends[last];
const frames = join(root, "work", slug, "frames");

const trackFile = join(root, "work", slug, "track.json");
const launch = async () => {
  const { chromium } = createRequire(join(root, "remotion", "package.json"))("playwright");
  const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(joins.source, { waitUntil: "commit", timeout: 0 });
  await page.waitForFunction(() => /: (ready|error)$/.test(document.title), null, { timeout: 0 });
  if (/error$/.test(await page.title())) { console.error("cell-record: the page reports an error"); process.exit(1); }
  return { browser, page };
};

// The action, for the camera to follow: every 0.2 simulated s, each arm's flange (the cell's
// frame, mm, Z up); the arm moving most over the 2 s around it is where the action is, else the
// work on the vise (soldering, trimming: the stations come to the work). Then smoothed over 3 s,
// a centered average, so the camera glides; the distance follows how far the action is from
// the vise (close for the joint, wider while a part is carried).
if (a === "track") {
  const { browser, page } = await launch();
  const dt = 0.2, samples = await page.evaluate(({ dur, dt }) => {
    const out = [];
    for (let t = 0; t <= dur + 1e-9; t += dt) { cell.seek(Math.min(t, dur)); const s = cell.state; out.push(Object.fromEntries(Object.entries(s.arms).map(([id, a]) => [id, a.flange]))); }
    return out;
  }, { dur: joins.duration, dt });
  await browser.close();
  const vise = [0, 0, 15];                                     // the work, in the cell's frame (Z up)
  const W = Math.round(1 / dt), raw = samples.map((_, i) => {
    let best = null, most = 0;
    for (const id of Object.keys(samples[i])) {
      const p0 = samples[Math.max(0, i - W)][id], p1 = samples[Math.min(samples.length - 1, i + W)][id];
      const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
      if (d > most) { most = d; best = samples[i][id]; }
    }
    return most > 15 ? best : vise;                            // still: the work at the vise
  });
  const S = Math.round(1.5 / dt), smooth = raw.map((_, i) => {
    const w = raw.slice(Math.max(0, i - S), i + S + 1); return [0, 1, 2].map((k) => w.reduce((s, p) => s + p[k], 0) / w.length);
  });
  writeFileSync(trackFile, JSON.stringify({ dt, points: smooth.map((p) => p.map((v) => +v.toFixed(1))) }) + "\n");
  console.log(`cell-record: ${trackFile} (${smooth.length} points)`);
  process.exit(0);
}

if (a === "encode") {
  const n = to - from, have = existsSync(frames) ? readdirSync(frames).filter((f) => f.endsWith(".jpg")).length : 0;
  if (have !== n) { console.error(`cell-record: ${have} of ${n} frames`); process.exit(1); }
  mkdirSync(join(root, "remotion", "public", "captures"), { recursive: true });
  const out = join(root, "remotion", "public", "captures", `${slug}-landscape.mp4`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(fps), "-i", join(frames, "%05d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out], { stdio: "inherit" });
  console.log(`cell-record: ${out} (${n} frames, ${(n / fps).toFixed(1)} s)`);
  process.exit(0);
}

const K = Number(a), N = Number(b);
const D = Math.PI / 180;
const ease = (u) => u * u * (3 - 2 * u);
// what frame f (from the recording's start) shows: the simulated time and the camera
const shot = (f) => {
  const g = from + f;
  const i = timing.starts.findLastIndex((s, k) => k <= last && s <= g);
  const s = lesson.scenes[i], u = (g - timing.starts[i]) / (timing.ends[i] - timing.starts[i]);
  const secs = f / fps;
  const yaw = (35 + 4 * secs) * D;                          // a slow orbit, 4 degrees a second
  const pitch = (26 + 6 * Math.sin(secs / 7)) * D;
  let t, dist, target = [0, 0, -15];                        // the work on the vise (Three's world)
  if (s.cell.hold !== undefined) {
    t = s.cell.hold;
    dist = s.cell.hold === 0 ? Math.exp(Math.log(1300) + (Math.log(520) - Math.log(1300)) * ease(u)) : 260;
    if (s.cell.hold === 0) target = [0, 60 - 60 * ease(u), -15 * ease(u)];
  } else {
    const j = joins.joins.find((x) => x.id === s.cell.join);
    t = j.from + u * (j.to - j.from);
    // the action (the track), in Three's world (x, z, -y); closer the nearer it is to the vise
    const k = Math.min(track.points.length - 1, t / track.dt), i0 = Math.floor(k), f = k - i0, i1 = Math.min(track.points.length - 1, i0 + 1);
    const c = [0, 1, 2].map((m) => track.points[i0][m] * (1 - f) + track.points[i1][m] * f);
    target = [c[0], c[2], -c[1]];
    const away = Math.hypot(c[0], c[1], c[2] - 15);
    dist = 230 + 1.6 * Math.min(away, 300);
  }
  return { t, view: { yaw, pitch, dist, target } };
};

if (!existsSync(trackFile)) { console.error("cell-record: run SLUG track first"); process.exit(1); }
const track = JSON.parse(readFileSync(trackFile, "utf8"));
const n = to - from;
const mine = [];
for (let f = 0; f < n; f++) if (f % N === K) mine.push(f);
mkdirSync(frames, { recursive: true });
const todo = mine.filter((f) => !existsSync(join(frames, `${String(f).padStart(5, "0")}.jpg`)));
console.log(`cell-record: worker ${K} of ${N}: ${todo.length} of ${mine.length} frames to make`);
if (!todo.length) process.exit(0);
const { browser, page } = await launch();
await page.evaluate(() => { cell.stop(); cell.speed = 4; const r = [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.text === "4x")); if (r) r.value = "4"; });
let done = 0;
for (const f of todo) {
  const { t, view } = shot(f);
  await page.evaluate(({ t, view }) => new Promise((ok) => {
    cell.seek(t);
    const v = cell.view; v.yaw = view.yaw; v.pitch = view.pitch; v.dist = view.dist; v.target.set(...view.target);
    document.querySelector("#view canvas").dispatchEvent(new WheelEvent("wheel", { deltaY: 0, cancelable: true }));
    const list = document.getElementById("cellsteps"), li = list && list.children[cell.state.step - 1];
    if (li) li.scrollIntoView({ block: "center" });
    requestAnimationFrame(() => requestAnimationFrame(ok));
  }), { t, view });
  await page.screenshot({ path: join(frames, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 });
  if (++done % 300 === 0) console.log(`cell-record: worker ${K}: ${done} of ${todo.length}`);
}
await browser.close();
console.log(`cell-record: worker ${K}: done`);

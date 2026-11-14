#!/usr/bin/env node
// Draw a lesson's frames from the numbers X_eTaL computed: a draft
// renderer with nothing to install (Node's standard library and
// ImageMagick), until Remotion takes this step over (docs/plan.md V4).
// It decides where things go; when, and how far along, every
// animation is comes from scripts/schedule.sh (libs/Timeline, libs/Ease).
//   scripts/frames.mjs SLUG landscape|portrait [--frame N]
// Reads lessons/SLUG/lesson.json and work/SLUG/schedule.txt; writes
// work/SLUG/FORMAT/frames/NNNNN.png (with --frame N, only that one).
// Fonts: VIDEO_FONT, VIDEO_FONT_BOLD, VIDEO_FONT_MONO (font files).
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, format, ...rest] = process.argv.slice(2);
const sizes = { landscape: [1920, 1080], portrait: [1080, 1920] };
if (!slug || !sizes[format]) {
  console.error("usage: frames.mjs SLUG landscape|portrait [--frame N]");
  process.exit(2);
}
const only = rest[0] === "--frame" ? Number(rest[1]) : null;
const [W, H] = sizes[format];
const tall = H > W;

const fonts = {
  text: process.env.VIDEO_FONT || "/System/Library/Fonts/Supplemental/Arial.ttf",
  bold: process.env.VIDEO_FONT_BOLD || "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  mono: process.env.VIDEO_FONT_MONO || "/System/Library/Fonts/Menlo.ttc",
};
const colors = { bg: "#0d1117", panel: [28, 35, 46], ink: [230, 237, 243], dim: [139, 148, 158], accent: [88, 166, 255], rule: [48, 54, 61], code: [165, 214, 255], hot: [255, 255, 255] };
const rgba = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

// The lesson, and what X_eTaL printed (scripts/schedule.xtl.in's order).
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
const rows = readFileSync(join(root, "work", slug, "schedule.txt"), "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
const [durs, starts, ends, [total], scene, local, progress, fade, linear, inOut, out] = rows;
const stagger = rows.slice(11);
if (stagger.length !== total || scene.length !== total || durs.length !== lesson.scenes.length) {
  console.error(`frames: the schedule does not fit the lesson (${stagger.length} rows, ${total} frames, ${durs.length} scenes)`);
  process.exit(1);
}

// ImageMagick reads % and \ in annotated text as escapes.
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/%/g, "%%");
const wrap = (s, max) => {
  const lines = [];
  let line = "";
  for (const word of s.split(" ")) {
    if (line && (line + " " + word).length > max) { lines.push(line); line = word; } else line = line ? line + " " + word : word;
  }
  if (line) lines.push(line);
  return lines;
};

function draw(f) {
  const s = scene[f] - 1;
  const sc = lesson.scenes[s];
  const a = [];
  const text = (x, y, str, font, size, color) => a.push("-font", font, "-pointsize", String(size), "-fill", color, "-annotate", `+${Math.round(x)}+${Math.round(y)}`, esc(str));
  const rect = (x, y, w, h, color, r = 0) => a.push("-fill", color, "-draw", `${r ? "roundrectangle" : "rectangle"} ${Math.round(x)},${Math.round(y)} ${Math.round(x + w)},${Math.round(y + h)}${r ? ` ${r},${r}` : ""}`);
  const dot = (x, y, r, color) => a.push("-fill", color, "-draw", `circle ${Math.round(x)},${Math.round(y)} ${Math.round(x + r)},${Math.round(y)}`);
  const fill = (s, pad = 0) => s
    .replaceAll("{{secs}}", lesson.scenes.map((x) => x.seconds).join(" "))
    .replaceAll("{{durs}}", durs.join(" "))
    .replaceAll("{{starts}}", starts.join(" "))
    .replaceAll("{{total}}", String(total))
    .replaceAll("{{f}}", String(f).padStart(pad ? 4 : 0))
    .replaceAll("{{scene}}", String(scene[f]))
    .replaceAll("{{local}}", String(local[f]).padStart(pad ? 3 : 0))
    .replaceAll("{{progress}}", progress[f].toFixed(3));

  const M = tall ? 70 : 100;           // the margin
  const wide = W - 2 * M;
  const show = fade[f];                // this scene's fade, in and out

  // The top line.
  text(M, tall ? 110 : 80, "X_eTaL-video", fonts.bold, 30, rgba(colors.accent));
  text(M + 230, tall ? 110 : 80, lesson.title, fonts.text, 30, rgba(colors.dim));

  // The heading, sliding in as it fades in.
  let size = Math.min(tall ? 64 : 72, wide / (0.56 * sc.heading.length));
  let y = tall ? 330 : 230;
  text(M - 40 * (1 - show), y, sc.heading, fonts.bold, size, rgba(colors.ink, show));
  rect(M, y + 28, 120 * show, 6, rgba(colors.accent, show), 3);
  y += tall ? 150 : 120;

  // The lines, each with its own column of the stagger table.
  let last = null;
  sc.lines.forEach((line, j) => {
    const t = stagger[f][j];
    const alpha = t * show;
    const x = M + 30 * (1 - t);
    if (typeof line === "string") {
      if (last === "code") y += 28;
      const size = tall ? 40 : 42;
      for (const piece of wrap(fill(line), Math.floor(wide / (0.5 * size)))) {
        if (alpha > 0.004) text(x, y, piece, fonts.text, size, rgba(colors.ink, alpha));
        y += size * 1.5;
      }
      last = "text";
    } else {
      if (last === "text") y += 10;
      const str = fill(line.code, 1);
      const size = Math.min(tall ? 34 : 38, (wide - 56) / (0.605 * str.length));
      const high = 66;
      if (alpha > 0.004) {
        rect(x, y - 44, wide, high, rgba(colors.panel, alpha));
        rect(x, y - 44, 6, high, rgba(colors.accent, alpha));
        text(x + 30, y, str, fonts.mono, size, rgba(str.startsWith("#") ? colors.dim : colors.code, alpha));
      }
      y += high;
      last = "code";
    }
  });

  // Three curves over the scene: a dot each, placed by X_eTaL's numbers.
  if (sc.curves) {
    y += 50;
    const names = ["linear", "in-out cubic", "out cubic"];
    [linear, inOut, out].forEach((curve, k) => {
      const x0 = M + (tall ? 0 : 260), w = wide - (tall ? 0 : 260) - 20;
      if (tall) { text(M, y, names[k], fonts.mono, 26, rgba(colors.dim, show)); y += 34; }
      else text(M, y + 9, names[k], fonts.mono, 26, rgba(colors.dim, show));
      rect(x0, y - 2, w, 4, rgba(colors.rule, show), 2);
      dot(x0 + curve[f] * w, y, 16, rgba(colors.accent, show));
      y += tall ? 70 : 64;
    });
  }

  // The schedule, drawn: a segment a scene, and where this frame is.
  const by = H - (tall ? 190 : 130), bw = wide;
  text(M, by - 28, `frame ${String(f).padStart(4, "0")} / ${total}   scene ${scene[f]} of ${durs.length}   progress ${progress[f].toFixed(3)}`, fonts.mono, tall ? 24 : 26, rgba(colors.dim));
  durs.forEach((d, k) => {
    const x = M + (starts[k] / total) * bw, w = (d / total) * bw - 6;
    rect(x, by, w, 18, k === s ? rgba(colors.accent) : k < s ? rgba(colors.accent, 0.35) : rgba(colors.rule), 4);
    const id = lesson.scenes[k].id;
    if (id.length * 11 < w) text(x, by + 48, id, fonts.mono, 18, rgba(k === s ? colors.ink : colors.dim));
  });
  rect(M + (f / total) * bw - 2, by - 10, 4, 38, rgba(colors.hot), 2);
  return a;
}

const dir = join(root, "work", slug, format, "frames");
mkdirSync(dir, { recursive: true });
const todo = only === null ? Array.from({ length: total }, (_, i) => i) : [only];
let next = 0, failed = false;
const worker = () => new Promise((done) => {
  const step = () => {
    if (failed || next >= todo.length) return done();
    const f = todo[next++];
    const file = join(dir, String(f).padStart(5, "0") + ".png");
    execFile("magick", ["-size", `${W}x${H}`, `xc:${colors.bg}`, ...draw(f), "-depth", "8", `PNG24:${file}`], (err, _out, stderr) => {
      if (err) { failed = true; console.error(`frames: frame ${f}: ${stderr || err.message}`); }
      step();
    });
  };
  step();
});
await Promise.all(Array.from({ length: Math.max(1, Math.min(cpus().length - 2, 8)) }, worker));
if (failed) process.exit(1);
console.log(`frames: ${todo.length} ${format} frame(s) in ${dir.slice(root.length + 1)}`);

#!/usr/bin/env node
// Build a lesson's props for the Remotion composition (called by
// scripts/props.sh, which has run the schedule and the lesson's
// data.xtl): the lesson, its schedule and every frame's numbers, its
// arrays, its recordings, and its X_eTaL lines as the pinned xetal
// renders them (decorated, in HTML spans). The composition computes no
// timing and renders no X_eTaL of its own.
//   scripts/props.mjs SLUG      # writes work/SLUG/props.json
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
const work = join(root, "work", slug);
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
const fail = (m) => { console.error(`props: ${m}`); process.exit(1); };

// What scripts/schedule.xtl.in printed, in its order.
const r = readFileSync(join(work, "schedule.txt"), "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
const total = r[3][0];
const props = {
  lesson,
  timing: { fps: lesson.fps, durations: r[0], starts: r[1], ends: r[2], total },
  frames: { scene: r[4], local: r[5], progress: r[6], fade: r[7], linear: r[8], inOut: r[9], out: r[10], step: r[11], stepT: r[12], capture: r[13], stagger: r.slice(14) },
  data: {},
  rendered: {},
  captures: lesson.scenes.some((s) => s.capture) ? { landscape: `captures/${slug}-landscape.mp4`, portrait: `captures/${slug}-portrait.mp4` } : null,
};
if (props.frames.stagger.length !== total || props.frames.scene.length !== total) fail("the schedule does not fit the lesson");

// The lesson's own arrays: each printed after a "== name" line, a
// rank-3 array as boards with a blank line between.
let name = null;
for (const line of readFileSync(join(work, "data.txt"), "utf8").split("\n")) {
  const m = /^== (\w+)$/.exec(line.trim());
  if (m) { name = m[1]; props.data[name] = [[]]; continue; }
  if (name === null) continue;
  const planes = props.data[name];
  if (line.trim() === "") { if (planes[planes.length - 1].length) planes.push([]); continue; }
  planes[planes.length - 1].push(line.trim().split(/\s+/).map(Number));
}
for (const k of Object.keys(props.data)) props.data[k] = props.data[k].filter((p) => p.length);
for (const s of lesson.scenes) for (const b of s.boards || []) {
  if (!props.data[b.data]) fail(`scene ${s.id}: no array "${b.data}" in data.xtl`);
}

// The X_eTaL lines, as rendered: xetal render --html decorates and
// classes each token. A {{name}} is not X_eTaL, so each goes through
// as a number no lesson would write and comes back as itself, to be
// filled in frame by frame.
const sources = [...new Set(lesson.scenes.flatMap((s) => s.lines).filter((l) => typeof l === "object" && l.xtl !== undefined).map((l) => l.xtl))];
if (sources.length) {
  const names = [...new Set(sources.flatMap((s) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])))];
  const stand = (k) => String(900000001 + k);
  const input = sources.map((s) => names.reduce((t, n, k) => t.split(`{{${n}}}`).join(stand(k)), s));
  if (input.some((s) => s.includes("\n"))) fail("an xtl line holds a line break");
  const file = join(work, "xtl-lines.xtl");
  writeFileSync(file, input.join("\n") + "\n");
  const html = execFileSync(join(root, "bin", "xetal"), ["render", "--html", file], { encoding: "utf8" }).replace(/\n+$/, "").split("\n");
  if (html.length !== sources.length) fail(`xetal render gave ${html.length} lines for ${sources.length}`);
  sources.forEach((s, i) => {
    if (html[i].includes("c-error")) fail(`this xtl line does not lex as X_eTaL: ${s}`);
    props.rendered[s] = names.reduce((t, n, k) => t.split(stand(k)).join(`{{${n}}}`), html[i]);
  });
}

writeFileSync(join(work, "props.json"), JSON.stringify(props));

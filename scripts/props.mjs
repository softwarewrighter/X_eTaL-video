#!/usr/bin/env node
// Build a lesson's props for the Remotion composition (called by
// scripts/props.sh, which has run the schedule and the lesson's
// data.xtl): the lesson, its schedule and every frame's numbers, its
// arrays, its recordings, and its X_eTaL lines as the pinned xetal
// renders them (decorated, in HTML spans). The composition computes no
// timing and renders no X_eTaL of its own.
//   scripts/props.mjs SLUG      # writes work/SLUG/props.json
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join } from "node:path";
import { captureName, runsOf } from "./capture-runs.mjs";
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
  frames: { scene: r[4], local: r[5], progress: r[6], fade: r[7], linear: r[8], inOut: r[9], out: r[10], step: r[11], stepT: r[12], capture: r[13], stagger: r.slice(14, 14 + total), sweep: r.slice(14 + total) },
  data: {},
  rendered: {},
  captures: lesson.scenes.some((s) => s.capture) ? { landscape: `captures/${slug}-landscape.mp4`, portrait: `captures/${slug}-portrait.mp4` } : null,
};
if (props.frames.stagger.length !== total || props.frames.sweep.length !== total || props.frames.scene.length !== total) fail("the schedule does not fit the lesson");

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
const sources = [...new Set(lesson.scenes.flatMap((s) => [...s.lines, ...(s.slide ? s.slide.items : []), ...(s.panel && s.panel.lines ? s.panel.lines : [])]).filter((l) => typeof l === "object" && l.xtl !== undefined).map((l) => l.xtl))];
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

// The narration (scripts/voice.sh): each narrated scene's audio, copied
// where Remotion serves it from. A lesson with a voice.json is never
// rendered silent or with stale audio.
props.voice = {};
const voiceFile = join(root, "lessons", slug, "voice.json");
if (existsSync(voiceFile)) {
  const voice = JSON.parse(readFileSync(voiceFile, "utf8"));
  const pub = join(root, "remotion", "public", "voice", slug);
  mkdirSync(pub, { recursive: true });
  for (const s of lesson.scenes) {
    const v = voice.scenes.find((x) => x.id === s.id);
    if (!s.narration) continue;
    // XETAL_PARTIAL=1 (the review page's clips while narration is still
    // being made): a scene not spoken yet is silent, at its estimate.
    if (process.env.XETAL_PARTIAL === "1" && (!v || v.narration !== s.narration)) continue;
    if (!v || v.narration !== s.narration) fail(`scene ${s.id}: its narration changed since it was spoken (just voice ${slug})`);
    if (v.seconds !== s.seconds) fail(`scene ${s.id}: its seconds are not its audio's (just voice ${slug})`);
    const wav = join(work, "voice", `${s.id}.wav`);
    if (!existsSync(wav)) fail(`no narration audio ${wav} (just voice ${slug})`);
    copyFileSync(wav, join(pub, `${s.id}.wav`));
    props.voice[s.id] = `voice/${slug}/${s.id}.wav`;
  }
}

// A story (remotion/src/Story.tsx): its pictures, recordings, reused
// clip and music, copied or cut where Remotion serves them from (none
// tracked), and where each starts, in X_eTaL's frames.
if (lesson.kind === "story") {
  const pub = join(root, "remotion", "public", "media", slug);
  mkdirSync(pub, { recursive: true });
  const abs = (p) => (isAbsolute(p) ? p : join(root, p));
  const fps = lesson.fps;
  const voice = existsSync(voiceFile) ? JSON.parse(readFileSync(voiceFile, "utf8")) : null;
  const scenes = lesson.scenes.map((s) => {
    const out = {};
    if (s.images) {
      out.images = s.images.map((p, k) => {
        if (!existsSync(abs(p))) fail(`scene ${s.id}: no picture ${p}`);
        const name = `${s.id}-${k}-${basename(p)}`;
        copyFileSync(abs(p), join(pub, name));
        return `media/${slug}/${name}`;
      });
      // One picture a sentence: each after the first starts with its
      // sentence (voice.json, seconds into the scene's audio).
      const v = voice?.scenes.find((x) => x.id === s.id);
      out.cuts = v ? v.sentences.slice(1, out.images.length).map((x) => Math.round(x.start * fps)) : [];
    }
    if (s.panel) {
      // A cells panel's arrays are what the pinned xetal gives for its
      // expressions; the lines in focus change with each sentence.
      if (s.panel.type === "cells") {
        const ev = (e) => execFileSync(join(root, "bin", "xetal"), ["eval", "-e", e], { encoding: "utf8" }).trim().split(/\s+/);
        out.from = ev(s.panel.from);
        out.to = ev(s.panel.to);
        if (out.from.length !== out.to.length) fail(`scene ${s.id}: from has ${out.from.length} values, to ${out.to.length}`);
      }
      if (s.panel.focus) {
        const v = voice?.scenes.find((x) => x.id === s.id);
        out.focusCuts = v ? v.sentences.slice(1, s.panel.focus.length).map((x) => Math.round(x.start * fps)) : [];
      }
    }
    if (s.clip) {
      if (existsSync(abs(s.clip))) {
        copyFileSync(abs(s.clip), join(pub, `${s.id}.mp4`));
        out.clip = `media/${slug}/${s.id}.mp4`;
      } else console.error(`props: scene ${s.id}: the clip ${s.clip} is not here yet; a placeholder stands in for it`);
    }
    return out;
  });
  const runs = runsOf(lesson).map((r, k) => {
    const name = captureName(slug, "landscape", k);
    return {
      first: r.first, end: r.end, from: props.timing.starts[r.first],
      frames: props.timing.ends[r.end] - props.timing.starts[r.first],
      video: `${name}.mp4`,
      sound: existsSync(join(root, "remotion", "public", `${name}.wav`)) ? `${name}.wav` : null,
    };
  });
  let music = null;
  if (lesson.music) {
    const m = lesson.music;
    if (!existsSync(abs(m.file))) fail(`no music ${m.file}`);
    execFileSync("sox", [abs(m.file), join(pub, "intro.wav"), "trim", "0", String(m.intro.seconds), "fade", "t", "0", String(m.intro.seconds), String(m.intro.fadeOut)]);
    execFileSync("sox", [abs(m.file), join(pub, "outro.wav"), "trim", `-${m.outro.seconds}`, "fade", "t", String(m.outro.fadeIn)]);
    // Under each silent explainer: the track's middle, as long as the scene.
    const slides = [];
    if (m.slides) {
      const length = Number(execFileSync("soxi", ["-D", abs(m.file)], { encoding: "utf8" }));
      // Each starts at its own offset from the middle (music.slides.offsets,
      // repeating; else half a second apart), so no two sound the same (the user).
      const silent = lesson.scenes.map((s, i) => i).filter((i) => lesson.scenes[i].slide && !lesson.scenes[i].narration);
      silent.forEach((i, k) => {
        const s = lesson.scenes[i];
        const secs = props.timing.durations[i] / fps;
        const file = join(pub, `slide-${s.id}.wav`);
        const shift = m.slides.offsets ? m.slides.offsets[k % m.slides.offsets.length] : 0.5 * (k - (silent.length - 1) / 2);
        const at = Math.min(Math.max(0, (length - secs) / 2 + shift), Math.max(0, length - secs));
        execFileSync("sox", [abs(m.file), file, "trim", at.toFixed(2), String(secs), "vol", String(m.slides.volume), "fade", "t", String(m.slides.fade), String(secs), String(m.slides.fade)]);
        slides.push({ src: `media/${slug}/slide-${s.id}.wav`, from: props.timing.starts[i], frames: props.timing.durations[i] });
      });
    }
    music = {
      slides,
      intro: { src: `media/${slug}/intro.wav`, from: 0, frames: Math.round(m.intro.seconds * fps) },
      outro: { src: `media/${slug}/outro.wav`, from: total - Math.round(m.outro.seconds * fps), frames: Math.round(m.outro.seconds * fps) },
    };
  }
  props.story = { scenes, runs, music };
}

writeFileSync(join(work, "props.json"), JSON.stringify(props));

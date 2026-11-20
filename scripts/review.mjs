#!/usr/bin/env node
// A lesson's review page, as video-publishing's preview pages were: a
// card a scene with its still, where it starts and how long it is, its
// stretch of the video, its narration as written, its audio, and what
// whisper heard of each sentence, so each scene can be reviewed on its
// own. Built from what exists so far (a scene not yet rendered shows no
// still or video), so it can be looked at while later scenes are made.
// Written to out/review/SLUG/ (not tracked, never published: it holds
// audio and video); served by scripts/serve-pages.mjs at
// http://127.0.0.1:8427/X_eTaL-video/review/SLUG/
//   scripts/review.mjs SLUG
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) { console.error("usage: review.mjs SLUG"); process.exit(2); }
const lesson = JSON.parse(readFileSync(join(root, "lessons", slug, "lesson.json"), "utf8"));
const read = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null);
const voice = read(join(root, "lessons", slug, "voice.json"));
const timing = read(join(root, "lessons", slug, "timing.json"));
const out = join(root, "out", "review", slug);
mkdirSync(join(out, "audio"), { recursive: true });
const link = (target, name) => {
  const at = join(out, name);
  rmSync(at, { force: true });
  if (existsSync(target)) { symlinkSync(target, at); return true; }
  return false;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const written = (t) => t.replace(/\{([^{}|]+)\|[^{}|]*\}/g, "$1");
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

const videoFile = ["landscape", "portrait"].map((f) => join(root, "out", `${slug}-${f}-remotion.mp4`)).find(existsSync);
// A video older than the schedule plays the wrong stretches: left out
// until it is rendered again.
const current = videoFile && statSync(videoFile).mtime >= statSync(join(root, "lessons", slug, "timing.json")).mtime;
const video = current ? link(videoFile, "video.mp4") : false;
const videoAge = video ? statSync(videoFile).mtime : null;
mkdirSync(join(out, "stills"), { recursive: true });

let at = 0;
const cards = lesson.scenes.map((s, i) => {
  const start = timing ? timing.starts[i] / timing.fps : at;
  const secs = timing ? timing.durations[i] / timing.fps : s.seconds;
  at += s.seconds;
  const v = voice?.scenes.find((x) => x.id === s.id);
  const audio = s.narration ? link(join(root, "work", slug, "voice", `${s.id}.wav`), `audio/${s.id}.wav`) : false;
  // A scene with no still yet gets one from the rendered video (60% in).
  const stillFile = join(out, "stills", `${s.id}.png`);
  if (video && (!existsSync(stillFile) || statSync(stillFile).mtime < videoAge)) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", (start + 0.6 * secs).toFixed(2), "-i", videoFile, "-frames:v", "1", "-vf", "scale=960:-1", stillFile]);
  }
  const still = existsSync(stillFile);
  // A scene rendered on its own (scripts/review-clips.sh: the title, a
  // silent slide with its music, a narrated scene once spoken) plays
  // that clip; other scenes moving does not change it, a newer still of
  // its own (the lesson changed) does.
  const clipFile = join(out, "clips", `${s.id}.mp4`);
  const clip = existsSync(clipFile);
  const clipAge = clip ? statSync(clipFile).mtime.getTime() : 0;
  const stale = v && s.narration && v.narration !== s.narration;
  const media = s.images ? `<p class="dim">pictures: ${s.images.map((p) => esc(p.split("/").pop())).join(", ")}</p>` : s.capture ? `<p class="dim">recording of the page: ${esc((s.capture.actions || []).map((a) => Object.entries(a)[0].join(" ")).join(" / ") || "(continues)")}</p>` : s.clip ? `<p class="dim">clip: ${esc(s.clip)}</p>` : "";
  return `<section id="${esc(s.id)}">
  <h2>${i + 1}. ${esc(s.heading)} <span class="dim">${esc(s.id)} | starts ${fmt(start)} | ${secs.toFixed(1)} s</span></h2>
  <div class="row">
    <div class="pic">${clip ? `<video controls preload="none"${still ? ` poster="stills/${esc(s.id)}.png?${Date.now()}"` : ""} src="clips/${esc(s.id)}.mp4?${clipAge}"></video><div class="dim">this scene alone, with its sound (scripts/review-clips.sh)</div>` : video ? `<video controls preload="none"${still ? ` poster="stills/${esc(s.id)}.png?${Date.now()}"` : ""} src="video.mp4#t=${start.toFixed(2)},${(start + secs).toFixed(2)}"></video><div class="dim">plays this scene: ${fmt(start)} to ${fmt(start + secs)}</div>` : still ? `<img src="stills/${esc(s.id)}.png?${Date.now()}" alt="">` : `<div class="none">no still yet</div>`}</div>
    <div class="txt">
      ${media}
      ${s.narration ? `<div class="part"><b>1. Script</b> <span class="dim">as written, and the captions</span><p class="narr">${esc(written(s.narration))}</p></div>
      <div class="part"><b>2. Sent to the voice</b> <span class="dim">phonetic, commas and periods only: all the voice is given</span><p class="sent">${v ? esc(v.sentences.map((x) => x.sent ?? x.spoken ?? x.text).join(" ")) : "(not spoken yet)"}</p></div>
      <div class="part"><b>3. Audio</b> <span class="dim">what the voice returned</span><br>${audio ? `<audio controls preload="none" src="audio/${esc(s.id)}.wav"></audio>` : `<span class="dim">(not made yet)</span>`}</div>
      <div class="part"><b>4. Whisper</b> <span class="dim">what it heard (orange: never matched, listen)</span><p class="heard">${v ? v.sentences.map((x) => x.unverified ? `<span class="warn">${esc(x.heard)}</span>` : esc(x.heard)).join(" ") : "(not spoken yet)"}</p>${clip && existsSync(clipFile.replace(/\.mp4$/, ".heard")) ? `<p class="clipheard"><span class="dim">the whole clip, as it plays:</span> ${esc(readFileSync(clipFile.replace(/\.mp4$/, ".heard"), "utf8").trim() || "(nothing heard)")}</p>` : ""}</div>
      ${v ? `<details><summary class="dim">sentence by sentence</summary><table><tr class="dim"><td>s</td><td>1. script</td><td>2. sent to the voice</td><td>4. whisper</td></tr>${v.sentences.map((x) => `<tr${x.unverified ? ' class="warn"' : ""}><td>${x.start.toFixed(1)}</td><td>${esc(x.text)}</td><td class="sent">${esc(x.sent ?? x.spoken ?? x.text)}</td><td class="heard">${esc(x.heard)}</td></tr>`).join("")}</table></details>` : ""}` : `<p class="dim">(no narration${s.id === "title" ? ": the title, with music" : s.clip ? ": the reused clip, its own audio" : s.id === "close" ? ": the close, with music" : ""})</p>${clip && existsSync(clipFile.replace(/\.mp4$/, ".heard")) ? `<p class="clipheard"><span class="dim">whisper, the clip as it plays:</span> ${esc(readFileSync(clipFile.replace(/\.mp4$/, ".heard"), "utf8").trim() || "(nothing heard)")}</p>` : ""}`}
      ${stale ? `<p class="warn">the narration changed since it was spoken</p>` : ""}
    </div>
  </div>
</section>`;
});

writeFileSync(join(out, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Review: ${esc(lesson.title)}</title>
<style>
body { background: #0d1117; color: #e6edf3; font: 16px/1.45 Arial, Helvetica, sans-serif; margin: 24px auto; max-width: 1400px; padding: 0 20px; }
h1 { margin: 0 0 4px; } h2 { font-size: 1.15rem; margin: 0 0 10px; }
section { border-top: 1px solid #30363d; padding: 18px 0; }
.dim { color: #8b949e; font-weight: normal; font-size: .9rem; }
.row { display: flex; gap: 20px; align-items: flex-start; }
.pic { flex: 0 0 640px; } .pic img, .pic video { width: 640px; border-radius: 6px; display: block; margin: 0; max-width: none; }
.none { width: 480px; height: 270px; border: 1px dashed #30363d; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #8b949e; }
.txt { flex: 1; min-width: 0; } .narr { font-size: 1.05rem; margin-top: 0; }
audio { width: 100%; } video { width: 100%; max-width: 640px; margin-top: 10px; border-radius: 6px; }
table { border-collapse: collapse; font-size: .85rem; margin: 8px 0; } td { border-top: 1px solid #30363d; padding: 3px 8px; vertical-align: top; }
.heard, .clipheard { color: #a5d6ff; } .sent { color: #d2a8ff; } .part { margin: 0 0 10px; } .part p { margin: 4px 0 0; } td { vertical-align: top; padding: 2px 8px 2px 0; } .warn { color: #ffa657; }
</style></head><body>
<h1>${esc(lesson.title)}</h1>
<p class="dim">${esc(slug)} | ${lesson.scenes.length} scenes | ${timing ? fmt(timing.total / timing.fps) + " long" : "not yet scheduled"} | page built ${new Date().toLocaleString("en-US")}${video ? ` | video rendered ${videoAge.toLocaleString("en-US")}` : videoFile ? " | the video is being rendered again for the new schedule: players return when it is done" : " | no video yet"}</p>
${video ? `<p><a href="video.mp4">The whole video</a></p>` : ""}
<p class="dim">Each narrated scene in four parts: 1, the script as written (the captions); 2, the text sent to the voice (phonetic, commas and periods only; the voice is given nothing else); 3, the audio it returned; 4, what whisper heard. Sentence by sentence below each.</p>
${cards.join("\n")}
</body></html>
`);
console.log(`review: http://127.0.0.1:8427/X_eTaL-video/review/${slug}/`);

#!/usr/bin/env node
// What a YouTube upload of a narrated lesson needs, in one folder,
// out/SLUG-youtube/: both videos (rendered by just render), the title
// and description (lessons/SLUG/title.txt, description.txt, written
// for the lesson), the closed captions (SLUG.srt: the exact sentences
// of voice.json, each at its time in the video: its scene's start from
// the schedule X_eTaL computed, timing.json, plus its offset in the
// scene's audio), and the narration as plain text (narration.txt).
//   scripts/youtube.mjs SLUG
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
const fail = (m) => { console.error(`youtube: ${m}`); process.exit(1); };
if (!slug) fail("usage: youtube.mjs SLUG");
const dir = join(root, "lessons", slug);
const read = (f) => { if (!existsSync(join(dir, f))) fail(`no lessons/${slug}/${f}`); return readFileSync(join(dir, f), "utf8"); };
const lesson = JSON.parse(read("lesson.json"));
const timing = JSON.parse(read("timing.json"));
const voice = JSON.parse(read("voice.json"));
const title = read("title.txt").trim();
const description = read("description.txt");
if (title.length > 100) fail(`title.txt is ${title.length} characters (YouTube allows 100)`);
if (description.length > 5000) fail("description.txt is over 5000 characters");

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)},${p(ms % 1000, 3)}`;
};
const cues = [];
lesson.scenes.forEach((s, i) => {
  if (!s.narration) return;
  const v = voice.scenes.find((x) => x.id === s.id);
  if (!v || v.narration !== s.narration) fail(`scene ${s.id}: its narration changed since it was spoken (just voice ${slug})`);
  const start = timing.starts[i] / timing.fps;
  for (const t of v.sentences) {
    if (t.start === undefined) fail(`voice.json has no sentence times (just voice ${slug})`);
    cues.push({ from: start + t.start, to: start + t.end, text: t.text });
  }
});
const srt = cues.map((c, k) => `${k + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`).join("\n");

const out = join(root, "out", `${slug}-youtube`);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, `${slug}.srt`), srt);
writeFileSync(join(out, "narration.txt"), lesson.scenes.filter((s) => s.narration).map((s) => s.narration).join("\n") + "\n");
writeFileSync(join(out, "title.txt"), title + "\n");
writeFileSync(join(out, "description.txt"), description);
for (const f of ["portrait", "landscape"]) {
  const v = join(root, "out", `${slug}-${f}-remotion.mp4`);
  if (existsSync(v)) copyFileSync(v, join(out, `${slug}-${f}.mp4`));
  else console.error(`youtube: no ${f} video yet (just render ${slug} ${f})`);
}
console.log(`youtube: out/${slug}-youtube/ (${cues.length} captions, ${(timing.total / timing.fps).toFixed(1)} s)`);

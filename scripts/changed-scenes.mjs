// The scenes of a lesson whose definition (its lesson.json entry: picture,
// slide, lines, narration) changed since their review clip was made, so a
// picture-only change gets a new clip too (episode 01: a slide fixed, its
// audio unchanged, kept its old clip). Each clip's definition hash is
// out/review/SLUG/clips/ID.scene.
//   node scripts/changed-scenes.mjs SLUG          print the changed ids
//   node scripts/changed-scenes.mjs SLUG --mark   record every scene as current
// A scene with a clip but no hash yet is recorded, not reported.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [slug, flag] = process.argv.slice(2);
if (!slug) { console.error("usage: changed-scenes.mjs SLUG [--mark]"); process.exit(2); }
const lesson = JSON.parse(readFileSync(`lessons/${slug}/lesson.json`, "utf8"));
const dir = `out/review/${slug}/clips`;
const changed = [];
for (const scene of lesson.scenes) {
  const { seconds, ...rest } = scene; // seconds follow the audio, handled elsewhere
  const hash = createHash("sha256").update(JSON.stringify(rest)).digest("hex").slice(0, 16);
  const file = `${dir}/${scene.id}.scene`;
  if (!existsSync(`${dir}/${scene.id}.mp4`)) continue;
  const was = existsSync(file) ? readFileSync(file, "utf8").trim() : null;
  if (flag === "--mark" || was === null) writeFileSync(file, hash + "\n");
  else if (was !== hash) changed.push(scene.id);
}
if (changed.length) console.log(changed.join(" "));

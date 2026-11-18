#!/usr/bin/env node
// Record where a lesson's video lives on YouTube: its 11-character
// video id, as "youtube" in lessons/SLUG/lesson.json (after "poster").
// Videos are uploaded by hand from out/SLUG-youtube/ and hosted by
// YouTube only, never in git; the site embeds the YouTube player.
//   scripts/link.mjs SLUG URL     # youtu.be/ID, watch?v=ID, shorts/ID, embed/ID, or the bare ID
//   scripts/link.mjs SLUG --remove
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, url] = process.argv.slice(2);
const fail = (m) => { console.error(`link: ${m}`); process.exit(1); };
if (!slug || !url) fail("usage: link.mjs SLUG URL|--remove");
const file = join(root, "lessons", slug, "lesson.json");
if (!existsSync(file)) fail(`no lesson lessons/${slug}`);
let src = readFileSync(file, "utf8");
// Any earlier link goes first; the file keeps its layout.
src = src.replace(/\n {2}"youtube": "[^"]*",/, "");
if (url !== "--remove") {
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/.exec(url) || /^([A-Za-z0-9_-]{11})$/.exec(url);
  if (!m) fail(`not a YouTube video URL or id: ${url}`);
  if (!/\n {2}"poster": \d+,/.test(src)) fail("lesson.json has no \"poster\" line to put the link after");
  src = src.replace(/(\n {2}"poster": \d+,)/, `$1\n  "youtube": "${m[1]}",`);
  console.log(`link: ${slug} -> https://youtu.be/${m[1]}`);
} else console.log(`link: ${slug}: no YouTube link`);
JSON.parse(src);
writeFileSync(file, src);

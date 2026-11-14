#!/usr/bin/env node
// Write the live site's landing page, pages/index.html: a card for
// every lesson (lessons/*/lesson.json, in the order of "order"), its
// thumbnail, what it is, and its video in both formats. The videos
// and thumbnails are put beside it by scripts/build-pages.sh.
//   scripts/build-catalog.mjs OUT.html COMMIT XETAL
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [out, commit = "", xetal = ""] = process.argv.slice(2);
if (!out) { console.error("usage: build-catalog.mjs OUT.html [COMMIT] [XETAL]"); process.exit(2); }
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const repo = "https://github.com/softwarewrighter/X_eTaL-video";

const lessons = readdirSync(join(root, "lessons"))
  .filter((d) => existsSync(join(root, "lessons", d, "lesson.json")))
  .map((d) => ({ ...JSON.parse(readFileSync(join(root, "lessons", d, "lesson.json"), "utf8")), timing: JSON.parse(readFileSync(join(root, "lessons", d, "timing.json"), "utf8")) }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.slug.localeCompare(b.slug));

const card = (l) => {
  const seconds = Math.round(l.timing.total / l.timing.fps);
  const demo = l.demo ? `https://softwarewrighter.github.io/${l.demo.repo}/${l.demo.slug}/` : null;
  return `<article class="card" id="${esc(l.slug)}">
  <button class="thumb" data-video="${esc(l.slug)}/landscape.mp4" aria-label="Play ${esc(l.title)}">
    <img src="${esc(l.slug)}/poster.jpg" alt="${esc(l.title)}: a frame of the video" width="960" height="540" loading="lazy">
    <span class="play" aria-hidden="true"></span><span class="length">${seconds} s</span>
  </button>
  <div class="about">
    <h2>${esc(l.title)}</h2>
    <p>${esc(l.summary ?? "")}</p>
    <p class="links">
      <a href="${esc(l.slug)}/landscape.mp4">Landscape (1920x1080)</a>
      <a href="${esc(l.slug)}/portrait.mp4">Portrait, for shorts (1080x1920)</a>
      ${demo ? `<a href="${esc(demo)}">The live demo</a>` : ""}
      <a href="${repo}/tree/main/lessons/${esc(l.slug)}">The lesson, as data</a>
    </p>
  </div>
</article>`;
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>X_eTaL Video</title>
<meta name="description" content="Short videos about X_eTaL, the eXperimental Extensible Typed Array Language, built from its live demos: scheduled by X_eTaL, rendered with Remotion.">
<link rel="icon" href="favicon.ico">
<style>
:root { --bg: #0d1117; --panel: #161b22; --rule: #30363d; --ink: #e6edf3; --dim: #8b949e; --accent: #e9ecef; --link: #58a6ff; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 1120px; margin: 0 auto; padding: 28px 20px 56px; }
a { color: var(--link); }
.brand { display: flex; align-items: center; gap: 16px; }
.logo { height: 56px; width: auto; border-radius: 8px; }
h1 { margin: 0; font-size: 1.9rem; color: var(--accent); }
.lede { color: var(--ink); max-width: 46rem; margin: 14px 0 6px; }
.how { color: var(--dim); max-width: 46rem; margin: 0 0 26px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px; }
.card { background: var(--panel); border: 1px solid var(--rule); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
.thumb { all: unset; display: block; position: relative; cursor: pointer; aspect-ratio: 16 / 9; background: #000; }
.thumb:focus-visible { outline: 3px solid var(--link); outline-offset: -3px; }
.thumb img, .card video { display: block; width: 100%; height: 100%; object-fit: cover; }
.card video { aspect-ratio: 16 / 9; background: #000; }
.play { position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%; background: rgba(13, 17, 23, .78); border: 2px solid var(--accent); }
.play::after { content: ""; position: absolute; left: 25px; top: 18px; border-left: 20px solid var(--accent); border-top: 13px solid transparent; border-bottom: 13px solid transparent; }
.thumb:hover .play { background: rgba(13, 17, 23, .95); }
.length { position: absolute; right: 10px; bottom: 10px; background: rgba(13, 17, 23, .85); color: var(--ink); padding: 1px 8px; border-radius: 6px; font-size: .85rem; }
.about { padding: 14px 16px 16px; }
.about h2 { margin: 0 0 6px; font-size: 1.15rem; }
.about p { margin: 0 0 10px; color: var(--dim); }
.links { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: .92rem; margin: 0 !important; }
h3 { margin: 40px 0 10px; font-size: 1.1rem; }
table { border-collapse: collapse; width: 100%; font-size: .95rem; }
td, th { text-align: left; padding: 6px 10px 6px 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
th { color: var(--dim); font-weight: 600; }
footer { margin-top: 40px; color: var(--dim); font-size: .88rem; }
</style>
</head>
<body>
<main>
<div class="brand"><img class="logo" src="xetal-logo-gray.png" alt="X_eTaL"><h1>X_eTaL Video</h1></div>
<p class="lede">Short videos about <a href="https://github.com/softwarewrighter/X_eTaL">X_eTaL</a>, the eXperimental Extensible Typed Array Language, built from its live demos. Pick one; each is about a minute.</p>
<p class="how">Every video here is data: a lesson file, a schedule and animation computed by X_eTaL itself for every frame at once, drawn by one Remotion composition in landscape and in portrait. They are silent for now; narration is coming.</p>
<div class="grid">
${lessons.map(card).join("\n")}
</div>

<h3>The X_eTaL ecosystem</h3>
<table>
<tr><th>Repository</th><th>What it holds</th><th>Live</th></tr>
<tr><td><a href="https://github.com/softwarewrighter/X_eTaL">X_eTaL</a></td><td>the language: interpreter, REPL, editor, notebook, browser playground</td><td><a href="https://softwarewrighter.github.io/X_eTaL/">playground</a></td></tr>
<tr><td><a href="https://github.com/softwarewrighter/X_eTaL-demos">X_eTaL-demos</a></td><td>visual array and scientific programs</td><td><a href="https://softwarewrighter.github.io/X_eTaL-demos/">catalog</a></td></tr>
<tr><td><a href="https://github.com/softwarewrighter/X_eTaL-ML">X_eTaL-ML</a></td><td>machine learning demos</td><td><a href="https://softwarewrighter.github.io/X_eTaL-ML/">catalog</a></td></tr>
<tr><td><a href="https://github.com/softwarewrighter/X_eTaL-games">X_eTaL-games</a></td><td>games and puzzles</td><td><a href="https://softwarewrighter.github.io/X_eTaL-games/">games</a></td></tr>
<tr><td><a href="https://github.com/softwarewrighter/X_eTaL-libraries">X_eTaL-libraries</a></td><td>reusable libraries and macro libraries</td><td><a href="https://softwarewrighter.github.io/X_eTaL-libraries/">libraries</a></td></tr>
<tr><td><a href="${repo}">X_eTaL-video</a> (here)</td><td>these videos, and how they are made</td><td>this page</td></tr>
</table>

<footer>
Copyright (c) 2026 Michael A Wright &middot; MIT License &middot; <a href="${repo}">Repository</a>${commit ? ` &middot; built from ${esc(commit)}` : ""}${xetal ? ` &middot; X_eTaL ${esc(xetal)}` : ""}
</footer>
</main>
<script>
// A thumbnail becomes its video when chosen.
for (const b of document.querySelectorAll(".thumb")) b.addEventListener("click", () => {
  const v = document.createElement("video");
  v.src = b.dataset.video; v.controls = true; v.autoplay = true; v.playsInline = true;
  v.poster = b.querySelector("img").src;
  b.replaceWith(v);
});
</script>
</body>
</html>
`;
writeFileSync(out, html);
console.log(`build-catalog: ${lessons.length} lessons`);

#!/usr/bin/env node
// Serve the built pages/ locally as GitHub Pages will, under
// /X_eTaL-video/: http://127.0.0.1:8427/X_eTaL-video/ (8427 is this
// repository's port). Answers byte ranges, so the videos can be
// scrubbed. Nothing to install. Also serves the review pages
// (scripts/review.mjs) from out/review/ under /X_eTaL-video/review/:
// they hold videos, so they are never part of pages/ or published.
//   scripts/serve-pages.mjs [PORT]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const pages = join(dirname(fileURLToPath(import.meta.url)), "..", "pages");
const reviews = join(dirname(fileURLToPath(import.meta.url)), "..", "out", "review");
const port = Number(process.argv[2] || 8427);
const base = "/X_eTaL-video/";
const types = { ".html": "text/html; charset=utf-8", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon", ".wav": "audio/wav", ".webp": "image/webp", ".json": "application/json" };

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!path.startsWith(base)) { res.writeHead(302, { Location: base }).end(); return; }
  const review = path.startsWith(base + "review/");
  const from = review ? reviews : pages;
  let file = normalize(join(from, path.slice(base.length + (review ? "review/".length : 0))));
  if (!file.startsWith(from)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) { res.writeHead(404).end("not found"); return; }
  const size = statSync(file).size;
  const head = { "Content-Type": types[extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes" };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range) {
    const start = range[1] ? Number(range[1]) : size - Number(range[2]);
    const end = range[1] && range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { ...head, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...head, "Content-Length": size });
    createReadStream(file).pipe(res);
  }
}).listen(port, "127.0.0.1", () => console.log(`serving http://127.0.0.1:${port}${base} (Ctrl-C stops)`));

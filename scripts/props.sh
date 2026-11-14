#!/usr/bin/env bash
# A lesson's props for the Remotion composition: the lesson, its
# schedule and every frame's animation numbers, all as X_eTaL computed
# them (scripts/schedule.sh), as one JSON file. The composition
# computes no timing of its own.
#   scripts/props.sh SLUG        # writes work/SLUG/props.json, prints its path
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: props.sh SLUG}"
cd "$root"
mkdir -p "work/$slug"
scripts/schedule.sh "$slug" > "work/$slug/schedule.txt"
# The lesson's own arrays, if it has a data.xtl: each printed after a
# "== name" line, a rank-3 array as boards with a blank line between.
: > "work/$slug/data.txt"
[ ! -f "lessons/$slug/data.xtl" ] || scripts/xt run "lessons/$slug/data.xtl" > "work/$slug/data.txt"
node -e '
  const fs = require("fs");
  const [lessonFile, scheduleFile, dataFile, out] = process.argv.slice(1);
  const lesson = JSON.parse(fs.readFileSync(lessonFile, "utf8"));
  const r = fs.readFileSync(scheduleFile, "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
  const total = r[3][0];
  const props = {
    lesson,
    timing: { fps: lesson.fps, durations: r[0], starts: r[1], ends: r[2], total },
    frames: { scene: r[4], local: r[5], progress: r[6], fade: r[7], linear: r[8], inOut: r[9], out: r[10], step: r[11], stepT: r[12], stagger: r.slice(13) },
    data: {},
  };
  let name = null;
  for (const line of fs.readFileSync(dataFile, "utf8").split("\n")) {
    const m = /^== (\w+)$/.exec(line.trim());
    if (m) { name = m[1]; props.data[name] = [[]]; continue; }
    if (name === null) continue;
    const planes = props.data[name];
    if (line.trim() === "") { if (planes[planes.length - 1].length) planes.push([]); continue; }
    planes[planes.length - 1].push(line.trim().split(/\s+/).map(Number));
  }
  for (const k of Object.keys(props.data)) props.data[k] = props.data[k].filter((p) => p.length);
  for (const s of lesson.scenes) for (const b of s.boards || []) {
    if (!props.data[b.data]) { console.error(`props: scene ${s.id}: no array "${b.data}" in data.xtl`); process.exit(1); }
  }
  if (props.frames.stagger.length !== total || props.frames.scene.length !== total) {
    console.error("props: the schedule does not fit the lesson"); process.exit(1);
  }
  fs.writeFileSync(out, JSON.stringify(props));
' "lessons/$slug/lesson.json" "work/$slug/schedule.txt" "work/$slug/data.txt" "work/$slug/props.json"
echo "work/$slug/props.json"

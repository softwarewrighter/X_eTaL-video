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
node -e '
  const fs = require("fs");
  const [lessonFile, scheduleFile, out] = process.argv.slice(1);
  const lesson = JSON.parse(fs.readFileSync(lessonFile, "utf8"));
  const r = fs.readFileSync(scheduleFile, "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
  const total = r[3][0];
  const props = {
    lesson,
    timing: { fps: lesson.fps, durations: r[0], starts: r[1], ends: r[2], total },
    frames: { scene: r[4], local: r[5], progress: r[6], fade: r[7], linear: r[8], inOut: r[9], out: r[10], stagger: r.slice(11) },
  };
  if (props.frames.stagger.length !== total || props.frames.scene.length !== total) {
    console.error("props: the schedule does not fit the lesson"); process.exit(1);
  }
  fs.writeFileSync(out, JSON.stringify(props));
' "lessons/$slug/lesson.json" "work/$slug/schedule.txt" "work/$slug/props.json"
echo "work/$slug/props.json"

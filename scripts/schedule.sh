#!/usr/bin/env bash
# A lesson's schedule, computed by X_eTaL: fills scripts/schedule.xtl.in
# from lessons/SLUG/lesson.json (fps, each scene's seconds, the most
# lines in a scene, the frames a board holds each step), runs it with the pinned xetal, and prints what it
# prints (scripts/frames.mjs reads that). With --timing, prints only
# lessons/SLUG/timing.json's content (the schedule, as JSON).
#   scripts/schedule.sh SLUG [--timing]
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: schedule.sh SLUG [--timing]}"
lesson="$root/lessons/$slug/lesson.json"
[ -f "$lesson" ] || { echo "schedule: no lesson $lesson" >&2; exit 1; }
read -r fps lines step secs < <(node -e '
  const l = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  console.log(l.fps, Math.max(1, ...l.scenes.map(s => s.lines.length)), l.stepFrames || 15, l.scenes.map(s => s.seconds).join(" "));
' "$lesson")
prog="$(sed -e "s/__FPS__/$fps/" -e "s/__SECS__/$secs/" -e "s/__LINES__/$lines/" -e "s/__STEP__/$step/g" "$root/scripts/schedule.xtl.in")"
cd "$root"
if [ "${2:-}" = --timing ]; then
  scripts/xt eval -e "$prog" | node -e '
    const r = require("fs").readFileSync(0, "utf8").trim().split("\n").map(l => l.trim().split(/\s+/).map(Number));
    const a = v => "[" + v.join(", ") + "]";
    console.log(`{\n  "fps": ${Number(process.argv[1])},\n  "durations": ${a(r[0])},\n  "starts": ${a(r[1])},\n  "ends": ${a(r[2])},\n  "total": ${r[3][0]}\n}`);
  ' "$fps"
else
  scripts/xt eval -e "$prog"
fi

#!/usr/bin/env bash
# Stills for a lesson's review page (scripts/review.mjs): a frame of
# each scene (60% of the way through it), from the rendered props,
# into out/review/SLUG/stills/ID.png. With scene ids, only those.
#   scripts/review-stills.sh SLUG [ID...]
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: review-stills.sh SLUG [ID...]}"; shift
cd "$root"
format="$(scripts/format.sh "$slug")"
kind="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).kind === "story" ? "Story" : "Lesson")' "lessons/$slug/lesson.json")"
comp="$kind$( [ "$format" = portrait ] && echo Portrait || echo Landscape)"
props="$root/work/$slug/props.json"
# Props made again when missing or older than the lesson or its timing.
if [ ! -f "$props" ] || [ "lessons/$slug/lesson.json" -nt "$props" ] || [ "lessons/$slug/timing.json" -nt "$props" ]; then
  scripts/props.sh "$slug" >/dev/null
fi
mkdir -p "out/review/$slug/stills"
node -e '
  const l = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const t = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
  const only = process.argv.slice(3);
  l.scenes.forEach((s, i) => { if (!only.length || only.includes(s.id)) console.log(s.id, Math.round(t.starts[i] + 0.6 * t.durations[i])); });
' "lessons/$slug/lesson.json" "lessons/$slug/timing.json" "$@" | while read -r id frame; do
  (cd remotion && npx remotion still src/index.ts "$comp" "$root/out/review/$slug/stills/$id.png" --frame="$frame" --props="$props" --log=error --scale=0.5)
  echo "review-stills: $id (frame $frame)"
done

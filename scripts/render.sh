#!/usr/bin/env bash
# Render a lesson with Remotion: out/SLUG-FORMAT-remotion.mp4, from the
# lesson and the numbers X_eTaL computes for it (scripts/props.sh).
#   scripts/render.sh SLUG [landscape|portrait]
#   scripts/render.sh SLUG FORMAT --still N    # frame N as out/SLUG-FORMAT-N.png
# Needs remotion/node_modules (cd remotion && npm install).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: render.sh SLUG [landscape|portrait] [--still N]}"; format="${2:-landscape}"
case "$format" in
  landscape) comp=LessonLandscape ;;
  portrait) comp=LessonPortrait ;;
  *) echo "render: the format is landscape or portrait" >&2; exit 2 ;;
esac
[ -d "$root/remotion/node_modules" ] || { echo "render: Remotion is not installed (cd remotion && npm install)" >&2; exit 127; }
props="$root/$("$root/scripts/props.sh" "$slug")"
mkdir -p "$root/out"
cd "$root/remotion"
if [ "${3:-}" = --still ]; then
  npx remotion still src/index.ts "$comp" "$root/out/$slug-$format-$4.png" --frame="$4" --props="$props" --log=error
  echo "render: out/$slug-$format-$4.png"
else
  npx remotion render src/index.ts "$comp" "$root/out/$slug-$format-remotion.mp4" --props="$props" --log=error
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -of csv=p=0 "$root/out/$slug-$format-remotion.mp4" \
    | awk -F, -v f="out/$slug-$format-remotion.mp4" '{ printf "render: %s (%sx%s, %s frames, %.1f s)\n", f, $1, $2, $4, $3 }'
fi

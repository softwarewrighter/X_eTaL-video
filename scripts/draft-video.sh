#!/usr/bin/env bash
# A lesson as a silent draft video, with nothing to install: the
# schedule and every frame's numbers from X_eTaL (scripts/schedule.sh),
# a PNG per frame (scripts/frames.mjs, ImageMagick), encoded by ffmpeg.
# Until Remotion renders lessons (docs/plan.md, saga 2).
#   scripts/draft-video.sh SLUG [landscape|portrait]
# Writes out/SLUG-FORMAT.mp4; frames are kept in work/SLUG/FORMAT/frames.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: draft-video.sh SLUG [landscape|portrait]}"; format="${2:-landscape}"
cd "$root"
for t in node magick ffmpeg ffprobe; do command -v "$t" >/dev/null || { echo "draft-video: $t not found on PATH" >&2; exit 127; }; done
mkdir -p "work/$slug" out
rm -rf "work/$slug/$format/frames"
scripts/schedule.sh "$slug" > "work/$slug/schedule.txt"
fps="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).fps)' "lessons/$slug/lesson.json")"
scripts/frames.mjs "$slug" "$format"
# Numbered frames to H.264 (docs/plan.md V7: ffmpeg directly only to
# encode frames and to probe).
ffmpeg -y -loglevel error -framerate "$fps" -i "work/$slug/$format/frames/%05d.png" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "out/$slug-$format.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -of csv=p=0 "out/$slug-$format.mp4" \
  | awk -F, -v f="out/$slug-$format.mp4" '{ printf "draft-video: %s (%sx%s, %s frames, %.1f s)\n", f, $1, $2, $4, $3 }'

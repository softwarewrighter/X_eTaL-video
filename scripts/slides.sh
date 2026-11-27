#!/usr/bin/env bash
# The fast path for a picture-only change (a slide's heading or items,
# a panel, an image; the narration unchanged): the review page's still
# and clip of just the changed scenes, without rendering the whole
# video (the author, 2026-11-26: "changing a slide should take
# seconds"). The scenes are the ones given, or by default every scene
# whose lesson.json entry changed since its clip was made
# (scripts/changed-scenes.mjs). The full video in out/ is then stale:
# `just produce SLUG` (or `just render SLUG`) before an upload.
#   scripts/slides.sh SLUG [ID...]
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: slides.sh SLUG [ID...]}"; shift
cd "$root"
say() { echo "$(date +%H:%M:%S) $slug: $*"; }
# The fitted seconds from the narration cache (a regenerated lesson.json resets them).
scripts/voice.sh "$slug" --ready > /dev/null
scripts/props.sh "$slug" > /dev/null
ids=("$@"); given=${#ids[@]}
if [ "${#ids[@]}" -eq 0 ]; then
  read -r -a ids < <(node scripts/changed-scenes.mjs "$slug"; echo)
fi
if [ "${#ids[@]}" -eq 0 ]; then say "no changed scenes"; exit 0; fi
say "scenes: ${ids[*]}"
scripts/review-stills.sh "$slug" "${ids[@]}"
scripts/review-clips.sh "$slug" "${ids[@]}"
# Mark the clips current only when every changed scene was remade.
[ "$given" -eq 0 ] && node scripts/changed-scenes.mjs "$slug" --mark
node scripts/review.mjs "$slug" > /dev/null
say "done: http://127.0.0.1:8427/X_eTaL-video/review/$slug/ (the full video in out/ is stale until just produce)"

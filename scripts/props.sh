#!/usr/bin/env bash
# A lesson's props for the Remotion composition: the lesson, its
# schedule and every frame's animation numbers (scripts/schedule.sh),
# its own arrays (its data.xtl, if it has one) and its X_eTaL lines as
# rendered, all from the pinned X_eTaL, as one JSON file
# (scripts/props.mjs puts it together). The composition computes no
# timing of its own.
#   scripts/props.sh SLUG        # writes work/SLUG/props.json, prints its path
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: props.sh SLUG}"
cd "$root"
[ -f "lessons/$slug/lesson.json" ] || { echo "props: no lesson lessons/$slug" >&2; exit 1; }
mkdir -p "work/$slug"
scripts/schedule.sh "$slug" > "work/$slug/schedule.txt"
: > "work/$slug/data.txt"
[ ! -f "lessons/$slug/data.xtl" ] || scripts/xt run "lessons/$slug/data.xtl" > "work/$slug/data.txt"
node scripts/props.mjs "$slug"
echo "work/$slug/props.json"

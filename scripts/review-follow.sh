#!/usr/bin/env bash
# Keep a lesson's review page current while its narration is made:
# every 30 s, a clip (scripts/review-clips.sh) for each scene that is
# ready (no narration, or its audio made) and has no clip newer than
# its audio, then the page again. Ends when the narration does (no
# voice.py for the lesson running) and one last pass is made.
#   scripts/review-follow.sh SLUG
set -uo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: review-follow.sh SLUG}"
cd "$root"
clips="out/review/$slug/clips"
pass() {
  local ids
  ids=$(node -e '
    const fs = require("fs"), [l, v, voice, clips] = process.argv.slice(1);
    const lesson = JSON.parse(fs.readFileSync(l, "utf8"));
    const spoken = fs.existsSync(v) ? JSON.parse(fs.readFileSync(v, "utf8")).scenes : [];
    // A clip is current while the narration of its scene (voice.json: its
    // sentences, their times, its seconds) is as when it was made
    // (clips/ID.sum): the audio files are made again every pass, with new
    // dither, so neither their times nor their bytes say anything.
    const sum = (id) => { const v = spoken.find((x) => x.id === id); return v ? require("crypto").createHash("md5").update(JSON.stringify([v.narration, v.seconds, v.sentences.map((x) => [x.text, x.start, x.end])])).digest("hex") : ""; };
    console.log(lesson.scenes.filter((s) => {
      if (!fs.existsSync(`${clips}/${s.id}.mp4`)) return !s.narration || spoken.some((x) => x.id === s.id && x.narration === s.narration);
      if (!s.narration) return false;
      return sum(s.id) !== (fs.existsSync(`${clips}/${s.id}.sum`) ? fs.readFileSync(`${clips}/${s.id}.sum`, "utf8").trim() : "");
    }).map((s) => s.id).join(" "));
  ' "lessons/$slug/lesson.json" "lessons/$slug/voice.json" "work/$slug/voice" "$clips")
  [ -z "$ids" ] && return
  # shellcheck disable=SC2086
  scripts/review-clips.sh "$slug" $ids | tee -a "work/$slug/review-follow.log"
  node scripts/review.mjs "$slug" >/dev/null 2>&1
  echo "$(date +%H:%M:%S) $slug: review clips: $ids"
}
while pgrep -f "scripts/voice[.]py $slug " >/dev/null; do pass; sleep 30; done
pass

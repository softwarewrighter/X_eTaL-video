#!/usr/bin/env bash
# Video clips for a lesson's review page (scripts/review.mjs), one a
# scene, rendered on their own with their sound at half size, into
# out/review/SLUG/clips/ID.mp4: by default the scenes with no
# narration (the title, the silent slides with their music, reused
# clips), which can be reviewed before the voice is made. With scene
# ids, only those.
#
# The narration may be changing the lesson meanwhile, so each clip is
# made from props made for it (XETAL_PARTIAL: scenes not spoken yet are
# silent), its frames read from those props; a narrated scene not in
# them is skipped. Each clip is checked: an audio track that is not
# silent, a picture that is not black. One that fails is made again
# once, then removed (the page shows the still, never a wrong clip).
#   scripts/review-clips.sh SLUG [ID...]
set -uo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: review-clips.sh SLUG [ID...]}"; shift
cd "$root"
format="$(scripts/format.sh "$slug")"
kind="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).kind === "story" ? "Story" : "Lesson")' "lessons/$slug/lesson.json")"
comp="$kind$( [ "$format" = portrait ] && echo Portrait || echo Landscape)"
props="$root/work/$slug/props.json"
mkdir -p "out/review/$slug/clips"
ids=("$@")
if [ "${#ids[@]}" -eq 0 ]; then
  read -r -a ids < <(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).scenes.filter((s) => !s.narration).map((s) => s.id).join(" "))' "lessons/$slug/lesson.json")
fi

# What a clip must be: its frames, and whether it has sound of its own.
frames() {
  node -e '
    const p = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const i = p.lesson.scenes.findIndex((s) => s.id === process.argv[2]);
    if (i < 0) process.exit(1);
    const s = p.lesson.scenes[i];
    if (s.narration && !(p.voice || {})[s.id]) process.exit(2);
    console.log(p.timing.starts[i], p.timing.ends[i] - 1);
  ' "$props" "$1"
}
good() {
  local f="$1" vol yavg
  [ -s "$f" ] || return 1
  ffprobe -v error -show_entries stream=codec_type -of csv=p=0 "$f" | grep -q audio || { echo "no audio"; return 1; }
  vol=$(ffmpeg -v info -i "$f" -af volumedetect -vn -f null - 2>&1 | sed -n 's/.*mean_volume: \(-*[0-9.]*\) dB.*/\1/p')
  awk -v v="${vol:--99}" 'BEGIN { exit !(v > -55) }' || { echo "silent ($vol dB)"; return 1; }
  yavg=$(ffmpeg -v info -ss 1 -i "$f" -frames:v 1 -vf signalstats,metadata=print:key=lavfi.signalstats.YAVG -f null - 2>&1 | sed -n 's/.*YAVG=\([0-9.]*\).*/\1/p' | head -1)
  awk -v y="${yavg:-0}" 'BEGIN { exit !(y > 4) }' || { echo "black (Y $yavg)"; return 1; }
}

# What whisper hears in the clip (the narration, the call to action, or
# music only): ID.heard beside it, shown on the review page.
model="${XETAL_WHISPER_MODEL:-$HOME/.local/share/whisper-cpp/models/ggml-medium.en.bin}"
whisper_clip() {
  local wav="${1%.mp4}.16k.wav"
  ffmpeg -v error -y -i "$1" -vn -ar 16000 -ac 1 "$wav" &&
    whisper-cli -m "$model" -f "$wav" --no-timestamps -np 2>/dev/null | tr -s ' \n' ' ' | sed 's/^ //; s/ $//' > "${1%.mp4}.heard"
  rm -f "$wav"
}

for id in "${ids[@]}"; do
  out="$root/out/review/$slug/clips/$id.mp4"
  for try in 1 2; do
    XETAL_PARTIAL=1 scripts/props.sh "$slug" >/dev/null 2>&1 || { echo "review-clips: $id: props failed"; break; }
    range=$(frames "$id"); rc=$?
    if [ "$rc" -eq 2 ]; then echo "review-clips: $id: not spoken yet, skipped"; break; fi
    [ "$rc" -eq 0 ] || { echo "review-clips: $id: no such scene"; break; }
    read -r from to <<< "$range"
    tmp="${out%.mp4}.tmp.mp4"
    (cd remotion && npx remotion render src/index.ts "$comp" "$tmp" --frames="$from-$to" --props="$props" --log=error --scale=0.5 < /dev/null) >/dev/null 2>&1
    if why=$(good "$tmp"); then mv "$tmp" "$out"; [ -f "lessons/$slug/voice.json" ] && node -e 'const v = (JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).voice_scenes || []); const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).scenes.find((x) => x.id === process.argv[2]); if (s) console.log(require("crypto").createHash("md5").update(JSON.stringify([s.narration, s.seconds, s.sentences.map((x) => [x.text, x.start, x.end])])).digest("hex"))' "lessons/$slug/voice.json" "$id" > "${out%.mp4}.sum"; whisper_clip "$out"; echo "review-clips: $id (frames $from to $to)"; break; fi
    rm -f "$tmp"
    if [ "$try" -eq 2 ]; then rm -f "$out"; echo "review-clips: $id: FAILED twice ($why), removed"; else echo "review-clips: $id: bad ($why), again"; fi
  done
done

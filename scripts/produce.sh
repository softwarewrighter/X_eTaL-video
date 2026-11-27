#!/usr/bin/env bash
# Make a lesson's video with nobody watching: narrate it, record its
# pages, render it, and keep its review page current, recovering on
# its own. One line on standard output per event (a scene ready, a
# stall, a restart, a step done, a failure), so a watcher can follow it;
# everything else goes to work/SLUG/produce/*.log.
#   scripts/produce.sh SLUG [WORKERS]       # WORKERS shards (default 3)
#
# Narration: first the unmade sentences in batches, many to a VoxCPM
# request, cut apart at their pauses (scripts/voice-batch.py: a request
# costs about 90 s whatever its length); then WORKERS shards of what is
# left (voice.py --shard); VoxCPM still gets one request at a time (the shared lock),
# but while one shard waits on whisper or retries a sentence the others
# keep it busy. Every 30 s the scenes whose sentences are all made are
# assembled for the review page (voice.py --ready). When no new audio
# has appeared for STALL seconds (default 480) the shards are stopped
# and started again (what is made is cached, so nothing is lost); a
# shard that dies is started again; after RESTARTS restarts (default 8)
# it gives up. Then one plain run assembles the whole narration from the
# cache; exit 3 there (sentences kept unverified) is reported, not fatal.
set -uo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: produce.sh SLUG [WORKERS]}"
workers="${2:-3}"
stall="${STALL:-480}"
restarts="${RESTARTS:-8}"
cd "$root"
logs="work/$slug/produce"
mkdir -p "$logs"
say() { echo "$(date +%H:%M:%S) $slug: $*"; }
newest() { find work/voice-cache -name '*.wav' ! -name '*.rejected.wav' -exec stat -f %m {} + 2>/dev/null | sort -n | tail -1; }
ready() { ls "work/$slug/voice/"*.wav 2>/dev/null | grep -vc '/pad-'; }
narrated=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).scenes.filter((s) => s.narration).length)' "lessons/$slug/lesson.json")

# Another narration of this lesson (one started by hand) finishes first.
# Says what it waits on, and waits at most 5 minutes (it once sat 34
# minutes on a process it took for a narration).
waited=0
# Narrations only: a word clip or spelling search (--word, --spell) is not one.
narrations() { for p in $(pgrep -f "scripts/voice[.]py $slug "); do ps -o command= -p "$p" | grep -qE -- "--(word|spell)" || echo "$p"; done; }
while others=$(narrations | tr '\n' ' ') && [ -n "${others// /}" ]; do
  [ "$waited" -eq 0 ] && say "waiting for another narration of $slug to finish: $(ps -o pid=,command= -p ${others// /,} 2>/dev/null | cut -c1-80 | tr '\n' ';')"
  [ "$waited" -ge 300 ] && { say "FAILED: still waiting after 5 minutes on: $others"; exit 1; }
  sleep 15; waited=$((waited + 15))
done

pids=()
start() {
  pids=()
  for k in $(seq 0 $((workers - 1))); do
    scripts/voice.sh "$slug" --shard "$k/$workers" > "$logs/shard-$k.log" 2>&1 &
    pids+=($!)
  done
}
# Its own workers only (their pids and their children), never another
# supervisor's.
stop() { for p in "${pids[@]}"; do pkill -P "$p" 2>/dev/null; kill "$p" 2>/dev/null; done; }
trap 'stop; [ -n "${follow:-}" ] && kill "$follow" 2>/dev/null; exit 130' INT TERM
# Sleep so a stop signal is taken at once (bash runs a trap only after
# a foreground command ends).
nap() { sleep "$1" & wait $!; }

# The batches first (their output in $logs/batch.log); a batch run that
# fails is reported, not fatal: the shards make whatever it did not.
[ -x .venv/bin/python ] || uv venv -q
.venv/bin/python -c 'import gradio_client' 2>/dev/null || uv pip install -q gradio_client
# voxq (tools/voxq) is the one client of the voice server: every request
# goes through its queue, one at a time, about 6 s each. Started here if
# it is not serving.
.venv/bin/python -c 'import sys; sys.path.insert(0, "scripts"); import voice; voice.ensure_voxq()' || { say "FAILED: voxq did not start (work/voxq/serve.out)"; exit 1; }
say "narration: voxq serving ($(.venv/bin/python -c 'import json; s = json.load(open("work/voxq/status.json")); print(s["state"], "pid", s["pid"])'))"
# Batches (many sentences a request) only when asked (BATCH=1): at about
# 6 s a request through voxq they save little, and a batch cannot place
# the short pieces around a splice.
if [ "${BATCH:-0}" = 1 ]; then
  say "narration: batches of sentences, many to a request"
  .venv/bin/python scripts/voice-batch.py "$slug" > "$logs/batch.log" 2>&1 &
  pids=($!)
  if wait $!; then say "narration: $(grep '^batch: .* request(s)' "$logs/batch.log" | tail -1 | sed 's/^batch: //')"
  else say "narration: the batch run failed (see $logs/batch.log); the shards make the rest"; fi
  pids=()
fi

say "narration: $workers shards, $narrated scenes"
start
# The review page follows: each scene's clip once it is ready.
scripts/review-follow.sh "$slug" >> "$logs/follow.log" 2>&1 &
follow=$!
tries=0
shown=$(ready)
# The stall clock starts now, not at the newest audio already on disk
# (from an earlier run, it set off a restart at once).
last=$(date +%s)
while :; do
  nap 30
  alive=0; for p in "${pids[@]}"; do kill -0 "$p" 2>/dev/null && alive=$((alive + 1)); done
  n=$(newest); [ -n "$n" ] && [ "$n" -gt "$last" ] && last=$n
  scripts/voice.sh "$slug" --ready >> "$logs/ready.log" 2>&1; node scripts/review.mjs "$slug" >/dev/null 2>&1
  r=$(ready); [ "$r" != "$shown" ] && { say "narration: $r of $narrated scenes ready"; shown=$r; }
  # Every shard done: a shard that failed (not the clean end) is run again.
  if [ "$alive" -eq 0 ]; then
    done_=0; for k in $(seq 0 $((workers - 1))); do grep -q "shard $k/$workers done" "$logs/shard-$k.log" && done_=$((done_ + 1)); done
    [ "$done_" -eq "$workers" ] && break
    tries=$((tries + 1)); [ "$tries" -gt "$restarts" ] && { say "FAILED: narration, $restarts restarts (see $logs)"; exit 1; }
    say "narration: a shard ended without finishing; restart $tries"
    start; last=$(date +%s); continue
  fi
  if [ $(( $(date +%s) - last )) -gt "$stall" ]; then
    tries=$((tries + 1)); [ "$tries" -gt "$restarts" ] && { stop; say "FAILED: narration stalled $restarts times (see $logs)"; exit 1; }
    say "narration: no new audio for $stall s; restart $tries"
    stop; start; last=$(date +%s)
  fi
done
scripts/voice.sh "$slug" > "$logs/assemble.log" 2>&1; rc=$?
if [ "$rc" -eq 3 ]; then say "narration: done; some sentences kept unverified, for a listen: $(grep -A50 'kept for a listen' "$logs/assemble.log" | tail -n +2 | tr '\n' ' ')"
elif [ "$rc" -ne 0 ]; then say "FAILED: assembling the narration (see $logs/assemble.log)"; exit 1
else say "narration: done, $(grep -o '[0-9.]* s in all' "$logs/assemble.log")"; fi
node scripts/review.mjs "$slug" >/dev/null 2>&1
# One more pass of the review follower now the narration is assembled (its
# own last pass can come before the final assembly; a scene was left with
# its old clip that way).
scripts/review-follow.sh "$slug" >> "$logs/follow.log" 2>&1

# The pages, recorded again for the narration's lengths (twice if need be).
if node -e 'process.exit(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).scenes.some((s) => s.capture && !s.cell) ? 0 : 1)' "lessons/$slug/lesson.json"; then
  for t in 1 2; do
    if scripts/capture.mjs "$slug" > "$logs/capture.log" 2>&1; then say "recording: done"; break; fi
    [ "$t" -eq 2 ] && { say "FAILED: recording (see $logs/capture.log)"; exit 1; }
    say "recording: failed, again"
  done
fi

# The video, then the review page's stills and players.
format="$(scripts/format.sh "$slug")"
for t in 1 2; do
  if scripts/render.sh "$slug" "$format" > "$logs/render.log" 2>&1; then say "render: done, out/$slug-$format-remotion.mp4"; node scripts/review.mjs "$slug" >/dev/null 2>&1; break; fi
  [ "$t" -eq 2 ] && { say "FAILED: render (see $logs/render.log)"; exit 1; }
  say "render: failed, again"
done
scripts/review-stills.sh "$slug" > "$logs/stills.log" 2>&1
# A scene whose picture changed but not its audio gets a new clip too.
changed="$(node scripts/changed-scenes.mjs "$slug")"
if [ -n "$changed" ]; then
  say "review: new clips for changed scenes: $changed"
  scripts/review-clips.sh "$slug" $changed > "$logs/clips.log" 2>&1 || say "review: clips failed (see $logs/clips.log)"
fi
node scripts/changed-scenes.mjs "$slug" --mark
node scripts/review.mjs "$slug" >/dev/null 2>&1
say "DONE: review page http://127.0.0.1:8427/X_eTaL-video/review/$slug/"

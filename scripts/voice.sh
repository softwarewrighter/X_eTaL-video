#!/usr/bin/env bash
# Narrate a lesson in the author's cloned voice: VoxCPM (Gradio) on
# queenbee, the voice sample and transcript of this year's narrated
# shorts, every clip checked by a local whisper (scripts/voice.py).
# Writes work/SLUG/voice/*.wav, the scenes' seconds in lesson.json,
# lessons/SLUG/voice.json, and the lesson's timing.json.
#   scripts/voice.sh SLUG            # narrate
#   scripts/voice.sh SLUG --check    # only check the narration is fit to speak
# Settings (environment): XETAL_TTS (default http://queenbee.local:7860),
# XETAL_VOICE (the sample; its transcript is prompt-text.txt beside it),
# XETAL_WHISPER_MODEL.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: voice.sh SLUG [--check]}"; shift
server="${XETAL_TTS:-http://queenbee.local:7860}"
sample="${XETAL_VOICE:-$root/../video-publishing/reference/voice/mike-medium-ref-1.wav}"
model="${XETAL_WHISPER_MODEL:-$HOME/.local/share/whisper-cpp/models/ggml-medium.en.bin}"
cd "$root"
[ -f "lessons/$slug/lesson.json" ] || { echo "voice: no lesson lessons/$slug" >&2; exit 1; }
for t in sox soxi whisper-cli uv; do
  command -v "$t" >/dev/null || { echo "voice: needs $t (brew install sox whisper-cpp uv)" >&2; exit 127; }
done
# The uv venv (never the system python), with the Gradio client.
[ -x .venv/bin/python ] || uv venv -q
.venv/bin/python -c 'import gradio_client' 2>/dev/null || uv pip install -q gradio_client
# Exit 3 (sentences kept unverified) still updated the lesson: the
# schedule is written for it too, then the 3 is passed on.
rc=0
.venv/bin/python scripts/voice.py "$slug" --server "$server" --reference "$sample" \
  --prompt-text "$(dirname "$sample")/prompt-text.txt" --whisper-model "$model" "$@" || rc=$?
[ "$rc" -eq 0 ] || [ "$rc" -eq 3 ] || exit "$rc"
# The schedule again, written only when it changed (the review page's
# clips and stills are current while timing.json is unchanged).
if [ "${1:-}" != --check ]; then
  t="$(mktemp)"; scripts/schedule.sh "$slug" --timing > "$t"
  cmp -s "$t" "lessons/$slug/timing.json" && rm -f "$t" || mv "$t" "lessons/$slug/timing.json"
fi
exit "$rc"

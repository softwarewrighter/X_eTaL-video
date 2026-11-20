#!/usr/bin/env bash
# A lesson's video format, from its length (the author, 2026-11-18): 150
# seconds or less is a short, portrait only (1080x1920); longer is
# long-form, landscape only (1920x1080). Reads lessons/SLUG/timing.json
# (the schedule X_eTaL computed).
#   scripts/format.sh SLUG      # prints portrait or landscape
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
slug="${1:?usage: format.sh SLUG}"
node -e '
  const t = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  console.log(t.total / t.fps > 150 ? "landscape" : "portrait");
' "$root/lessons/$slug/timing.json"

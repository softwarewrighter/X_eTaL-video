#!/usr/bin/env bash
# The pre-commit gate: the pinned X_eTaL (scripts/check-xetal.sh),
# every library's lint and baselines (scripts/test-libs.sh, reg-rs),
# every lesson and its timing (scripts/check-lessons.sh),
# American spellings, then ASCII-only markdown for the docs we own.
#   scripts/gate.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
scripts/check-xetal.sh
scripts/test-libs.sh
scripts/check-lessons.sh
scripts/check-spelling.py --self-test
scripts/check-spelling.py
md=(README.md CHANGES.md docs/plan.md docs/xetal-asks.md docs/remotion-scripts.md)
for f in libs/*/README.md lessons/*/README.md; do [ -e "$f" ] && md+=("$f"); done
for f in "${md[@]}"; do sw-markdown-checker -f "$f" >/dev/null || { sw-markdown-checker -f "$f"; exit 1; }; done
echo "markdown: ok (${#md[@]} files)"
# Nothing generated or unexpected left untracked.
left="$(git status --porcelain --untracked-files=all -- out work bin 2>/dev/null | grep -v '^!!' || true)"
[ -z "$left" ] || { echo "FAIL: generated files are not ignored:"; echo "$left"; exit 1; }
echo "gate: ok"

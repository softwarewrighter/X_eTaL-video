#!/usr/bin/env bash
# Test the libraries (every libs/<Name>/), or the named ones, with
# reg-rs: each library's tests/ is its reg-rs data directory
# (REG_RS_DATA_DIR), and its baselines run from there:
#   - types.rgt: scripts/xt type ../src/<Name>.xtl (the exports' types);
#   - NAME.rgt for each tests/NAME.xtl: scripts/xt run NAME.xtl.
# A baseline missing, or left over from a program that is gone, fails.
# Each library is also linted (xetal lint). XETAL_BLESS=1 creates
# missing baselines and rebases the rest (review the diff!).
#   scripts/test-libs.sh [Name...]
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
command -v reg-rs >/dev/null || { echo "test-libs: reg-rs not found on PATH" >&2; exit 127; }
[ -x "$root/bin/xetal" ] || "$root/scripts/xetal.sh" >/dev/null
bless="${XETAL_BLESS:-}"
if [ $# -gt 0 ]; then names=("$@"); else
  names=(); for d in "$root"/libs/*/src; do [ -d "$d" ] && names+=("$(basename "$(dirname "$d")")"); done
fi
xt="../../../scripts/xt"
fail=0; n=0
for name in ${names[@]+"${names[@]}"}; do
  d="$root/libs/$name"
  [ -f "$d/src/$name.xtl" ] || { echo "FAIL: no library libs/$name/src/$name.xtl" >&2; exit 1; }
  [ -f "$d/README.md" ] || { echo "FAIL: $name: no README.md"; fail=1; }
  n=$((n + 1))
  wanted=("types|$xt type ../src/$name.xtl")
  for p in "$d"/tests/*.xtl; do
    [ -e "$p" ] || continue; b="$(basename "$p" .xtl)"
    wanted+=("$b|$xt run $b.xtl")
  done
  [ ${#wanted[@]} -gt 1 ] || { echo "FAIL: $name: no test programs in tests/"; fail=1; }
  mkdir -p "$d/tests"
  export REG_RS_DATA_DIR="$d/tests"
  cd "$d/tests"
  "$xt" lint "../src/$name.xtl" || { echo "FAIL: $name: lint"; fail=1; }
  for w in "${wanted[@]}"; do
    IFS='|' read -r t cmd <<<"$w"
    if [ ! -f "$t.rgt" ]; then
      if [ "$bless" = 1 ]; then rm -f "$t".tdb*; reg-rs create -t "$t" -c "$cmd" >/dev/null; echo "created: $name/$t"
      else echo "FAIL: $name/$t: no baseline $t.rgt (XETAL_BLESS=1 to create)"; fail=1; fi
    elif ! grep -qF "command = \"$cmd\"" "$t.rgt"; then
      echo "FAIL: $name/$t: $t.rgt does not run '$cmd'"; fail=1
    fi
  done
  for r in *.rgt; do
    [ -e "$r" ] || continue
    t="${r%.rgt}"
    printf '%s\n' "${wanted[@]}" | grep "^$t|" >/dev/null || { echo "FAIL: $name/$t: $r has no program (remove it)"; fail=1; }
  done
  if [ "$bless" = 1 ]; then
    reg-rs run -q -p .rgt >/dev/null 2>&1 || true
    reg-rs rebase -p .rgt >/dev/null 2>&1
    echo "blessed: $name"
  elif reg-rs run -q -p .rgt >/dev/null 2>&1; then
    echo "ok: $name ($(ls *.rgt | wc -l | tr -d ' ') baselines)"
  else
    echo "FAIL: $name"; reg-rs run -vv -p .rgt || true; fail=1
  fi
  # A baseline of a failed run is a mistake unless its name says so.
  for r in *.rgt; do
    [ -e "$r" ] || continue
    case "$r" in reject-*) continue ;; esac
    grep -q '^exit_code = 0$' "$r" || { echo "FAIL: $name/${r%.rgt}: its baseline is a failed run (name it reject-* if meant)"; fail=1; }
  done
  cd "$root"
done
[ "$fail" = 0 ] || exit 1
echo "test-libs: ok ($n libraries)"

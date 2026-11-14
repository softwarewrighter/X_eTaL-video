#!/usr/bin/env bash
# Fetch JuliaMono, the monospace font the X_eTaL sites draw decorated
# source in (the one font with every character it uses: the combining
# underline, raised letters, APL glyphs), into remotion/public/fonts/
# (not tracked: a third-party file; this script is its record).
#   Source:  https://github.com/cormullion/juliamono, release v0.63.2
#            (the release X_eTaL's own pages load, from jsDelivr)
#   License: SIL Open Font License 1.1
# Safe to run again: a file already there with the right checksum is kept.
#   scripts/fetch-fonts.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
dir="$root/remotion/public/fonts"; mkdir -p "$dir"
base="https://cdn.jsdelivr.net/gh/cormullion/juliamono@v0.63.2/webfonts"
fetch() {  # fetch NAME SHA256
  local f="$dir/$1"
  if [ ! -f "$f" ] || [ "$(shasum -a 256 "$f" | cut -d' ' -f1)" != "$2" ]; then
    curl -fsSL "$base/$1" -o "$f.part"
    got="$(shasum -a 256 "$f.part" | cut -d' ' -f1)"
    [ "$got" = "$2" ] || { echo "fetch-fonts: $1: checksum $got, expected $2" >&2; rm -f "$f.part"; exit 1; }
    mv "$f.part" "$f"
  fi
}
fetch JuliaMono-Regular.woff2 "cd371c92e94978a6888b71e89a4b57f443604ad63595150511ceb7d5c354b857"
fetch JuliaMono-Bold.woff2 "9ffd596514e31ba6317fffbf367c51c4ff93f2a68a1499c3e80ac9309dcd68fa"
echo "fetch-fonts: ok (remotion/public/fonts)"

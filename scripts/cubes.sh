#!/usr/bin/env bash
# The arrays-as-cubes stills (episode 04): the pinned X_eTaL works out
# every cube and number and writes Blender scripts through Bpy.xtl (the
# blender extension of ../X_eTaL-extensions, read, never changed);
# Blender renders them in the background.
#   scripts/cubes.sh [ladder|broadcast ...]   (default: both)
# Writes work/cubes/ladder.png and work/cubes/broadcast.png (1920x1080).
# BLENDER names the Blender to run (default: blender on the PATH);
# XETAL_EXTENSIONS the X_eTaL-extensions checkout (default: ../X_eTaL-extensions).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
ext="${XETAL_EXTENSIONS:-$root/../X_eTaL-extensions}/extensions/blender/lib"
[ -f "$ext/Bpy.xtl" ] || { echo "cubes: no Bpy.xtl in $ext (set XETAL_EXTENSIONS)" >&2; exit 1; }
blender="${BLENDER:-$(command -v blender || true)}"
[ -x "$blender" ] || { echo "cubes: Blender not found (set BLENDER)" >&2; exit 127; }
[ -x bin/xetal ] || scripts/xetal.sh >&2
mkdir -p work/cubes
XETAL_PATH="$ext:scripts/cubes" bin/xetal run scripts/cubes/stills.xtl
stills=("$@"); [ ${#stills[@]} -gt 0 ] || stills=(ladder broadcast)
for s in "${stills[@]}"; do
  start=$(date +%s)
  log="work/cubes/$s.log"
  if ! "$blender" --background --factory-startup -noaudio --python-exit-code 1 \
      --python "work/cubes/$s.py" -- work/cubes scripts/cubes/look.py > "$log" 2>&1; then
    tail -20 "$log" >&2; echo "cubes: Blender failed on $s (log: $log)" >&2; exit 1
  fi
  echo "work/cubes/$s.png ($(( $(date +%s) - start )) s, log $log)"
done

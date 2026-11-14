#!/usr/bin/env bash
# Check every lesson (lessons/<slug>/): lesson.json fits
# schemas/lesson.schema.json (scripts/check-schema.mjs, which checks
# itself first), its slug is its directory, no scene id is used twice,
# and its tracked timing.json is
# what X_eTaL computes from it now (scripts/schedule.sh --timing): the
# schedule is never typed, and never stale. XETAL_BLESS=1 rewrites
# timing.json.
#   scripts/check-lessons.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
scripts/check-schema.mjs --self-test
n=0
for d in lessons/*/; do
  d="${d%/}"
  [ -f "$d/lesson.json" ] || continue
  slug="$(basename "$d")"; n=$((n + 1))
  scripts/check-schema.mjs schemas/lesson.schema.json "$d/lesson.json"
  # What a schema cannot say: the slug is the directory's name, and a
  # scene's id is used once.
  node -e '
    const [file, slug] = process.argv.slice(1);
    const l = JSON.parse(require("fs").readFileSync(file, "utf8"));
    const bad = (m) => { console.error(`FAIL: ${file}: ${m}`); process.exit(1); };
    if (l.slug !== slug) bad(`slug is "${l.slug}", its directory is "${slug}"`);
    const ids = l.scenes.map((s) => s.id);
    ids.forEach((id, k) => { if (ids.indexOf(id) !== k) bad(`scene id "${id}" is used twice`); });
  ' "$d/lesson.json" "$slug"
  if [ "${XETAL_BLESS:-}" = 1 ]; then
    scripts/schedule.sh "$slug" --timing > "$d/timing.json"; echo "blessed: $slug"
  elif ! diff <(scripts/schedule.sh "$slug" --timing) "$d/timing.json" >/dev/null 2>&1; then
    echo "FAIL: $slug: timing.json is not what X_eTaL computes from lesson.json (XETAL_BLESS=1 scripts/check-lessons.sh)"
    diff <(scripts/schedule.sh "$slug" --timing) "$d/timing.json" || true
    exit 1
  fi
done
node --check scripts/frames.mjs
echo "check-lessons: ok ($n lessons)"

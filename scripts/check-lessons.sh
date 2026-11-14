#!/usr/bin/env bash
# Check every lesson (lessons/<slug>/): lesson.json parses and has what
# a renderer needs (slug matching its directory, fps, scenes each with
# an id, seconds, a heading and lines), and its tracked timing.json is
# what X_eTaL computes from it now (scripts/schedule.sh --timing): the
# schedule is never typed, and never stale. XETAL_BLESS=1 rewrites
# timing.json.
#   scripts/check-lessons.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
n=0
for d in lessons/*/; do
  [ -f "$d/lesson.json" ] || continue
  slug="$(basename "$d")"; n=$((n + 1))
  node -e '
    const [file, slug] = process.argv.slice(1);
    const l = JSON.parse(require("fs").readFileSync(file, "utf8"));
    const bad = (m) => { console.error(`FAIL: ${file}: ${m}`); process.exit(1); };
    if (l.slug !== slug) bad(`slug is "${l.slug}", its directory is "${slug}"`);
    if (typeof l.title !== "string" || !l.title) bad("no title");
    if (!Number.isInteger(l.fps) || l.fps < 1) bad("fps is not a positive whole number");
    if (!Array.isArray(l.scenes) || !l.scenes.length) bad("no scenes");
    const ids = new Set();
    l.scenes.forEach((s, i) => {
      const at = `scene ${i + 1}`;
      if (typeof s.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(s.id)) bad(`${at}: id must be lowercase letters, digits and -`);
      if (ids.has(s.id)) bad(`${at}: id "${s.id}" is used twice`);
      ids.add(s.id);
      if (typeof s.seconds !== "number" || !(s.seconds > 0)) bad(`${at} (${s.id}): seconds must be a positive number`);
      if (typeof s.heading !== "string" || !s.heading) bad(`${at} (${s.id}): no heading`);
      if (!Array.isArray(s.lines)) bad(`${at} (${s.id}): no lines`);
      s.lines.forEach((x, j) => {
        if (!(typeof x === "string" || (x && typeof x.code === "string"))) bad(`${at} (${s.id}): line ${j + 1} is neither text nor {"code": ...}`);
      });
    });
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

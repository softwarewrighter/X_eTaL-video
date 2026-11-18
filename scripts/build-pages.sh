#!/usr/bin/env bash
# Build the live site into pages/ (not tracked; scripts/publish-pages.sh
# publishes it): the landing page (scripts/build-catalog.mjs), the logo
# and favicon, and for every lesson its video in its one format (portrait
# for 150 s or less, landscape for longer: scripts/format.sh) and a
# thumbnail (the lesson's "poster" frame, or its middle). A video is
# rendered again only when it is missing or older than what it is made
# from (the lesson, the libraries, the scripts, the composition); a
# lesson that shows a recorded page is recorded first when it has no
# recording yet (that needs the network).
#   scripts/build-pages.sh [--fresh]     # --fresh renders everything again
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
fresh="${1:-}"
rm -rf pages; mkdir -p pages out
for d in lessons/*/; do
  slug="$(basename "$d")"
  [ -f "$d/lesson.json" ] || continue
  mkdir -p "pages/$slug"
  read -r poster captures < <(node -e '
    const l = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const t = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
    console.log(l.poster ?? Math.floor(t.total / 2), l.scenes.some((s) => s.capture) ? 1 : 0);
  ' "$d/lesson.json" "$d/timing.json")
  format="$(scripts/format.sh "$slug")"
  if [ "$captures" = 1 ] && [ ! -f "remotion/public/captures/$slug-$format.mp4" ]; then
    scripts/capture.mjs "$slug" "$format"
  fi
  video="out/$slug-$format-remotion.mp4"
  if [ "$fresh" = --fresh ] || [ ! -f "$video" ] || [ -n "$(find "$d" libs scripts remotion/src schemas XETAL_COMMIT -type f -newer "$video" -print -quit)" ]; then
    scripts/render.sh "$slug" "$format"
  fi
  cp "$video" "pages/$slug/$format.mp4"
  # The thumbnail: the poster frame, fitted into 960x540 (a portrait
  # frame centered on the page's background).
  scripts/render.sh "$slug" "$format" --still "$poster" >/dev/null
  magick "out/$slug-$format-$poster.png" -resize 960x540 -background "#0d1117" -gravity center -extent 960x540 -quality 86 "pages/$slug/poster.jpg"
done
cp images/favicon.ico images/xetal-logo-gray.png pages/
touch pages/.nojekyll
scripts/build-catalog.mjs pages/index.html "$(git rev-parse --short HEAD)" "$(cut -c1-7 XETAL_COMMIT)"
echo "build-pages: pages/ ($(du -sh pages | cut -f1))"

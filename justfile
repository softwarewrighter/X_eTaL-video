# X_eTaL-video tasks. Recipes call scripts/*.sh, which hold the logic
# and work without just too. `just` alone lists the recipes.

set positional-arguments

# List the recipes
default:
    @just --list

# Get and build xetal at the known-good commit in XETAL_COMMIT (clone in work/xetal, binary bin/xetal)
xetal:
    @scripts/xetal.sh

# The pinned X_eTaL: XETAL_COMMIT and the binary's version
xetal-version:
    @cat XETAL_COMMIT
    @bin/xetal --version

# Check the pinned X_eTaL: it builds, answers and reports its commit
check-xetal:
    scripts/check-xetal.sh

# Evaluate an expression with the pinned xetal, the libraries on the path: just eval "'+ r_/ 1 2 3"
eval expr:
    @scripts/xt eval -e "$1"

# The libraries
libs:
    @ls libs

# XETAL_PATH with every library on it (for your own shell)
path:
    @for d in "$PWD"/libs/*/src; do printf '%s:' "$d"; done | sed 's/:$//'; echo

# Run a library's test programs (or one): just run Timeline basics
run name test="":
    @cd "libs/$1/tests" && for f in ${2:+"$2.xtl"} $([ -n "${2:-}" ] || ls *.xtl); do echo "== $f"; ../../../scripts/xt run "$f"; done

# The inferred type of every export of a library: just types Timeline
types name:
    @cd "libs/$1/tests" && ../../../scripts/xt type "../src/$1.xtl"

# Test every library: lint, reg-rs baselines
test:
    scripts/test-libs.sh

# Test one library: just test-lib Timeline
test-lib name:
    scripts/test-libs.sh "$1"

# Accept a library's current output as its baselines, creating missing ones (review the diff!)
bless name:
    XETAL_BLESS=1 scripts/test-libs.sh "$1"

# The lessons
lessons:
    @ls lessons

# Check every lesson and that its timing.json is what X_eTaL computes
check-lessons:
    scripts/check-lessons.sh

# A lesson's schedule as X_eTaL computes it (the JSON a renderer reads): just timing making-of
timing slug:
    @scripts/schedule.sh "$1" --timing

# A silent draft video of a lesson with nothing to install (ImageMagick, ffmpeg): out/SLUG-FORMAT.mp4
draft slug format="landscape":
    scripts/draft-video.sh "$1" "$2"

# One frame of a lesson's draft as a PNG: just frame making-of 850 portrait
frame slug n format="landscape":
    @mkdir -p "work/$1" && scripts/schedule.sh "$1" > "work/$1/schedule.txt" && scripts/frames.mjs "$1" "$3" --frame "$2"

# Arrays as cubes, rendered by Blender from scripts X_eTaL writes (Bpy.xtl of ../X_eTaL-extensions): just cubes [ladder] [broadcast] -> work/cubes/*.png
cubes *stills:
    scripts/cubes.sh "$@"

# Render a lesson with Remotion: out/SLUG-FORMAT-remotion.mp4 (needs: cd remotion && npm install)
render slug format="":
    scripts/render.sh "$1" "$2"

# One frame of a lesson through Remotion as a PNG: just still making-of 850 portrait
# A picture-only change, in seconds: the review still and clip of just the changed scenes (default: those whose lesson entry changed), no full render: just slides al-05-idioms [break-3]
slides slug *ids:
    scripts/slides.sh "$1" {{ids}}

still slug n format="":
    scripts/render.sh "$1" "$3" --still "$2"

# Narrate a lesson in the author's cloned voice (VoxCPM on queenbee, checked by local whisper): just voice nbody [--check]
voice slug *args:
    scripts/voice.sh "$@"

# A lesson's unmade sentences, many to a VoxCPM request (about 90 s whatever its length), cut at the pauses and checked by whisper into the cache: just voice-batch al-01-why [--size 12] [--list]
voice-batch slug *args:
    @[ -x .venv/bin/python ] || uv venv -q
    .venv/bin/python scripts/voice-batch.py "$@"

# A lesson's problem words before any narration (no voice server): risky words, whether each is handled (a clip, a known spelling in docs/voice-words.json, heard right before), commands for the rest; fails if any is unhandled: just voice-preflight al-01-why
voice-preflight slug:
    @[ -x .venv/bin/python ] || uv venv -q
    .venv/bin/python scripts/voice-preflight.py "$1"

# A narrated lesson's YouTube upload in out/SLUG-youtube/: both videos, title, description, captions (.srt): just youtube nbody
youtube slug:
    scripts/youtube.mjs "$1"

# Record a lesson's YouTube video (uploaded by hand from out/SLUG-youtube/) so the site embeds it: just link nbody https://youtube.com/shorts/ID
link slug url:
    scripts/link.mjs "$1" "$2"

# A lesson's review page (a card a scene: still, its stretch of the video, narration, audio, what whisper heard), served by just serve-pages
review slug:
    scripts/review.mjs "$1"

# Stills for the review page from Remotion, one a scene (or the scenes named)
review-stills slug *ids:
    scripts/review-stills.sh "$@"

# Record a lesson's live demo page in headless Chromium, both formats (needs the network): just capture life-capture
capture slug *formats:
    scripts/capture.mjs "$@"

# Remotion Studio on a lesson, at http://localhost:8427 (this repository's port)
studio slug="making-of":
    cd remotion && npx remotion studio src/index.ts --port 8427 --props="../$(../scripts/props.sh "$1")"

# Build the live site into pages/ (not tracked): the landing page and every lesson's thumbnail (videos play from YouTube)
pages *args:
    scripts/build-pages.sh "$@"

# Serve the built pages/ as GitHub Pages will: http://127.0.0.1:8427/X_eTaL-video/
serve-pages port="8427":
    scripts/serve-pages.mjs "$1"

# Publish the site: build pages/ from this commit and make it the gh-pages branch's only commit (needs a clean work tree)
publish:
    scripts/publish-pages.sh

# Retake images/screencapture.png (the README's picture) from the published page
screencapture *url:
    scripts/screencapture.sh "$@"

# Render images/favicon.ico from images/favicon.svg
favicon:
    scripts/favicon.sh

# The full pre-commit gate: pinned X_eTaL, libraries, lessons, spelling, ASCII-only markdown
gate:
    scripts/gate.sh

# Show the agentrail saga state and the current step
status:
    agentrail status

# Open the plan
plan:
    @cat docs/plan.md

# Make a lesson's video unattended: narration in shards (one VoxCPM request at a time), recordings, render, review page; restarts itself on a stall
produce slug workers="3":
    scripts/produce.sh "$1" "$2"

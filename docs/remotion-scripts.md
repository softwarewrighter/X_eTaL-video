# Proposed scripts: Remotion videos from the live demos

Status: sections 0 and 5 are **done** and differ from the proposal
below where the real thing taught better: see `scripts/props.sh`,
`scripts/render.sh`, `remotion/README.md` (the composition takes one
props file holding the lesson and every frame's numbers from X_eTaL;
`just render`, `just still`, `just studio`). The other sections are
still **proposals, not run**; their flags are from documentation as
recalled and must be checked when each is built. Each script becomes a real `scripts/*.sh` with a
`just` recipe in the saga named beside it (`docs/plan.md`).

The pipeline, one lesson (`SLUG`) at a time:

```
lessons/SLUG/lesson.json           the lesson, as data (written by hand or by an agent)
  -> just voice SLUG               one WAV per scene            (vid-tts)
  -> just timing SLUG              timing.json                  (ffprobe + X_eTaL Timeline)
  -> just capture SLUG             the live demo, recorded      (Playwright)
  -> just render SLUG landscape    out/SLUG-landscape.mp4       (Remotion)
  -> just render SLUG portrait     out/SLUG-portrait.mp4        (Remotion)
  -> just assemble SLUG            intro, outro, music, loudness (vid-* tools)
```

The Life lesson (`lessons/life`) settled one more thing the
proposals left open: a demo's stages are drawn from arrays the
lesson's own `data.xtl` prints, with no trace library yet.

## 0. Install (saga 2, step 1; the user's go-ahead)

`scripts/remotion-install.sh`:

```bash
#!/usr/bin/env bash
# Create remotion/ (once) and install its packages.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
if [ ! -f remotion/package.json ]; then
  npx create-video@latest --yes --blank remotion
fi
cd remotion
npm install
npx remotion skills add          # the agent skills (see docs/research.txt)
npx remotion versions            # every @remotion/* package at one version
```

Then `just studio` is `cd remotion && npx remotion studio --port 8427`
(8427 is this repository's port).

Packages a later step adds, each when first needed: `zod` (the lesson
schema as types), `@remotion/captions` (saga 3), `@remotion/three`
(3D, if a lesson needs it), `playwright` (capture, below).

## 1. A lesson, as data

`lessons/life/lesson.json` (the form `schemas/lesson.schema.json`
will check; saga 1, step 5):

```json
{
  "slug": "life",
  "title": "Life in one line",
  "demo": { "repo": "X_eTaL-demos", "slug": "life-microscope" },
  "fps": 30,
  "scenes": [
    { "id": "hook",   "kind": "title",   "narration": "The Game of Life, in one line of X_eTaL." },
    { "id": "code",   "kind": "code",    "narration": "Nine rotations of the board, summed.",
      "code": "u:l_ife := { ('+ r_/_12 -1 0 1 o_-_12 _r) { (_l = 3) + _r * _l = 4 } _r }" },
    { "id": "run",    "kind": "capture", "narration": "Each chip is one stage of that line.",
      "capture": "life-microscope" },
    { "id": "cta",    "kind": "title",   "narration": "Try it in your browser. Link below." }
  ]
}
```

A scene has no length here: its length is its narration's (step 3).
A silent draft gives each scene `"seconds": N` instead.

## 2. Voice: one WAV per scene (saga 3)

`scripts/voice.sh SLUG`, after `../shorts` (`work/scripts/*.txt`,
then `vid-tts`):

```bash
#!/usr/bin/env bash
# Narration for every scene of a lesson: work/SLUG/audio/NN-ID.wav.
set -euo pipefail
slug="$1"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tools="${VID_TOOLS:-$root/../video-publishing/tools/target/release}"
out="$root/work/$slug/audio"; mkdir -p "$out"
# id<TAB>narration, a line a scene (node: nothing to install).
node -e '
  const l = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  l.scenes.forEach((s, i) => console.log(String(i + 1).padStart(2, "0") + "-" + s.id + "\t" + s.narration));
' "$root/lessons/$slug/lesson.json" |
while IFS=$'\t' read -r name text; do
  [ -f "$out/$name.wav" ] && continue          # keep what is already spoken
  "$tools/vid-tts" --text "$text" --output "$out/$name.wav" \
    --host "${TTS_HOST:-curiosity}" --port "${TTS_PORT:-7860}"
done
```

Open: `vid-tts` defaults to port 7861 (VibeVoice) and the shorts'
rule is VoxCPM on 7860 through `tts/client.py` (a Gradio client,
which needs a uv venv with `gradio_client`). Which of the two this
script calls is the user's choice (`docs/plan.md`, question 2).

## 3. Timing: the audio's lengths, scheduled in X_eTaL (saga 2 and 3)

`scripts/timing.sh SLUG` measures each WAV and has the Timeline
library lay the scenes out. The schedule is computed by X_eTaL, not
by the script:

```bash
#!/usr/bin/env bash
# lessons/SLUG/timing.json: each scene's length, start and end in frames.
set -euo pipefail
slug="$1"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
secs=""
for w in "$root/work/$slug/audio"/*.wav; do
  secs="$secs $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$w")"
done
"$root/scripts/xt" eval -e "\"tl:\" u_se< \"Timeline\"
d := 30 tl:f_rames $secs
d
tl:s_tarts d
tl:e_nds d
tl:t_otal d" | node "$root/scripts/timing-json.mjs" > "$root/lessons/$slug/timing.json"
```

`scripts/timing-json.mjs` only reshapes the four printed lines into
`{"fps":30,"durations":[...],"starts":[...],"ends":[...],"total":N}`.
When `libs/Lesson` exists (saga 2, step 3) it prints that JSON itself
and the reshaping goes away.

## 4. Capture: the live demo, recorded (saga 4)

`scripts/capture-demo.mjs SLUG REPO PAGE SECONDS`, after the shorts'
`capture-slides.py` (Playwright), but recording video and in Node so
it shares `remotion/node_modules`:

```js
// Record a published demo page: work/SLUG/capture/PAGE-WxH.webm
import { chromium } from "playwright";
const [slug, repo, page, seconds] = process.argv.slice(2);
const url = `https://softwarewrighter.github.io/${repo}/${page}/`;
for (const [w, h] of [[1920, 1080], [1080, 1920]]) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    recordVideo: { dir: `work/${slug}/capture/${w}x${h}`, size: { width: w, height: h } },
  });
  const p = await context.newPage();
  await p.goto(url);
  await p.waitForLoadState("networkidle");
  // A lesson's scripted clicks go here, read from lesson.json:
  // scenes[].actions = [{ "click": "text=Step" }, { "wait": 1.0 }, ...]
  await p.waitForTimeout(Number(seconds) * 1000);
  await context.close();           // the video is written on close
  await browser.close();
}
```

Alternatives, per demo: a Remotion `<IFrame>` of the page (simple,
but a WebAssembly page is not frame-deterministic), or drawing the
demo's own printed stages (`just show SLUG` in X_eTaL-demos) with an
`ArrayView` component (deterministic, crisp at any size; the plan's
`libs/Trace`). Recording is the fastest way to a first video; drawing
the stages is the better lesson.

## 5. Render (saga 2)

`scripts/render.sh SLUG [landscape|portrait]`:

```bash
#!/usr/bin/env bash
# out/SLUG-FORMAT.mp4 from lessons/SLUG/lesson.json and timing.json.
set -euo pipefail
slug="$1"; format="${2:-landscape}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
case "$format" in
  landscape) comp=LessonLandscape ;;
  portrait)  comp=LessonPortrait ;;
  *) echo "usage: render.sh SLUG [landscape|portrait]" >&2; exit 2 ;;
esac
props="$root/work/$slug/props.json"; mkdir -p "$root/work/$slug" "$root/out"
# One props file: the lesson and its timing.
node -e '
  const fs = require("fs"), [l, t] = process.argv.slice(1).map(f => JSON.parse(fs.readFileSync(f, "utf8")));
  console.log(JSON.stringify({ lesson: l, timing: t }));
' "$root/lessons/$slug/lesson.json" "$root/lessons/$slug/timing.json" > "$props"
cd "$root/remotion"
npx remotion render "$comp" "$root/out/$slug-$format.mp4" --props="$props"
```

The composition side (`remotion/src/Root.tsx`), the only place sizes
are named; the lesson's length comes from the timing X_eTaL computed:

```tsx
const sizes = { LessonLandscape: [1920, 1080], LessonPortrait: [1080, 1920] } as const;
export const RemotionRoot = () => (
  <>
    {Object.entries(sizes).map(([id, [width, height]]) => (
      <Composition
        key={id} id={id} component={Lesson} width={width} height={height}
        fps={30} durationInFrames={1} defaultProps={sample}
        calculateMetadata={({ props }) => ({
          fps: props.timing.fps,
          durationInFrames: props.timing.total,
        })}
      />
    ))}
  </>
);
// Lesson.tsx: one <Sequence from={timing.starts[i]}
// durationInFrames={timing.durations[i]}> per scene, the scene's
// component chosen by its "kind".
```

A still per scene, for review and as a gate baseline
(`scripts/still.sh SLUG N`): `npx remotion still LessonLandscape
out/SLUG-N.png --frame=F --props=...`, with F the middle of scene N
(`starts[N] + durations[N] / 2`, from `timing.json`).

A transparent overlay for a screen recording (saga 5): the same
render with `--codec=prores --prores-profile=4444
--pixel-format=yuva444p10le --image-format=png`, written as `.mov`.

## 6. Assemble (saga 5)

`scripts/assemble.sh SLUG FORMAT`, the shorts' `build-video.sh`
reduced to what Remotion does not already do:

```bash
#!/usr/bin/env bash
# out/SLUG-FORMAT-final.mp4: intro, the lesson, outro; loudness normalized.
set -euo pipefail
slug="$1"; format="${2:-landscape}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tools="${VID_TOOLS:-$root/../video-publishing/tools/target/release}"
work="$root/work/$slug"; list="$work/concat-$format.txt"
# Absolute paths, no "file" prefix (the shorts' rule).
{ [ -f "$root/work/assets/intro-$format.mp4" ] && echo "$root/work/assets/intro-$format.mp4"
  echo "$root/out/$slug-$format.mp4"
  [ -f "$root/work/assets/outro-$format.mp4" ] && echo "$root/work/assets/outro-$format.mp4"
} > "$list" || true
"$tools/vid-concat" --list "$list" --output "$work/combined-$format.mp4" --reencode
"$tools/vid-volume" --input "$work/combined-$format.mp4" \
  --output "$root/out/$slug-$format-final.mp4" --normalize
```

Never `ffmpeg -f concat ... -c copy` (silent audio mid-video; the
video repositories' rule).

## 7. Everything (saga 5)

`just video SLUG` = voice, timing, capture, render both formats,
assemble both; `just videos` = every `lessons/*/`. Each stage skips
what is already built and newer than its inputs.

## What a coding agent is asked to do

With the Remotion skills installed, the prompts are about data and
components, never about one video's keyframes:

- "Write `lessons/nbody/lesson.json` from
  `../X_eTaL-demos/demos/nbody/README.md` and `nbody.xtl`: six scenes,
  narration under 320 characters each (`vid-tts`'s limit)."
- "Add a scene kind `array`: an `ArrayView` that shows a matrix
  filling in row by row, its progress from `libs/Ease`."
- "Render scene 3 of `life` as a still in both formats and check
  nothing is clipped in portrait."

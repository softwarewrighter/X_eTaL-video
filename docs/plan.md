# X_eTaL-video -- Implementation Plan

Educational videos about X_eTaL, built from the live demos of the
sibling repositories (`../X_eTaL`, `../X_eTaL-demos`, `../X_eTaL-ML`,
`../X_eTaL-games`, `../X_eTaL-libraries`). The source of the idea is
`docs/research.txt` (archival, not normative); this plan turns it into
sagas and steps.

Development is driven by agentrail sagas (one active saga in
`.agentrail/`, finished sagas archived to `.agentrail-archive/`), as in
`../X_eTaL` and `../X_eTaL-demos`. Every step ends with the gate
(`just gate`), docs updated, `CHANGES.md` updated, a detailed commit to
`main` (with the `.agentrail/` changes), `agentrail complete`, and a
push.

## Guiding principle

X_eTaL is the content engine and the renderer is deterministic:

> a lesson is data -> X_eTaL computes its timing and its numbers ->
> a renderer draws every frame from that data -> the existing video
> tools assemble and publish.

Nothing about a lesson's timing is typed by hand twice. A scene's
length comes from its narration's audio; where each scene starts, and
how far along an animation is at a frame, are array computations, and
they are written in X_eTaL (the libraries in `libs/`), tested as
X_eTaL, and shown in the videos as X_eTaL. A video about an array
language whose own schedule is one scan (`'+ s_\ durations`) makes
the language's argument by existing.

## Architecture decisions

| # | Decision | Why |
| - | -------- | --- |
| V1 | X_eTaL is **pinned**: `XETAL_COMMIT` holds the full SHA of a committed X_eTaL ref. `scripts/xetal.sh` clones X_eTaL into `work/xetal/` (gitignored), checks that commit out, builds the CLI and links `bin/xetal` (X_eTaL's `docs/vendoring.md`). Every recipe runs that binary, never one on the PATH. | As in every sibling: goldens are tied to one interpreter, moved deliberately, never under a step. |
| V2 | The reusable X_eTaL lives in `libs/<Name>/` (`src/<Name>.xtl`, `tests/*.xtl` with reg-rs baselines, `README.md`), the layout of `../X_eTaL-libraries`. Exports are `l:`, private helpers `h:`. | The video libraries are ordinary X_eTaL libraries; a library that proves generally useful can move to X_eTaL-libraries unchanged. |
| V3 | A lesson is **data**: `lessons/<slug>/lesson.json` (scenes, narration text, the demo each scene shows, code to display), checked against `schemas/lesson.schema.json`. A renderer never contains a lesson's content. | One master composition renders every lesson; an agent writes a lesson by writing data, not animation math. |
| V4 | The renderer is Remotion (React, TypeScript) in `remotion/`, its own Node project (installed 2026-11-13, 4.0.543, `package-lock.json` tracked). A composition computes no timing: `scripts/props.sh` hands it the lesson and every frame's numbers as X_eTaL computed them. The gate checks the project (eslint, tsc) when its packages are installed and renders nothing. `scripts/frames.mjs` is a second, draft renderer of the same numbers with nothing to install. | The Node and React toolchain stays in one directory of one repository, away from the Rust and X_eTaL repositories. |
| V5 | Every component reads its size from the composition (`useVideoConfig()`), and every lesson renders in two formats: landscape 1920x1080 at 30 fps for long-form (`../video-publishing`) and portrait 1080x1920 for shorts (`../shorts`). | One lesson, two channels' formats; the shorts and long-form repositories stay the assemblers. |
| V6 | Narration is generated before rendering: text to speech (the VoxCPM server the shorts use, through `vid-tts`), one WAV per scene, its measured length (`ffprobe`) written into the lesson's timing. Scene lengths follow the audio, never the reverse. | The shorts' rule (stretch the picture to the narration); a deterministic renderer needs the lengths as input. |
| V7 | Assembly uses the Rust `vid-*` tools of `../video-publishing/tools` (`vid-concat --reencode`, `vid-volume --normalize`, `vid-music`, `vid-scale`), never a bare `ffmpeg` concat. Bare `ffmpeg` and `ffprobe` are for probing and for encoding numbered frames only. | The video repositories' hard rule: a raw ffmpeg concat goes silent mid-video. |
| V8 | Pictures of the live demos come from the demos themselves: the published pages recorded in headless Chrome (Playwright, as the shorts capture slides), or the demo's own X_eTaL output drawn by a Remotion component. Never a redrawn imitation of what a page shows. | The demos' rule (a page shows only what X_eTaL computes) carries over: a video shows the real program and its real output. |
| V9 | A feature X_eTaL lacks, or a bug this work uncovers, is not worked around silently and not fixed here: it is recorded in `docs/xetal-asks.md`, and the library or lesson uses a documented workaround or waits. | X_eTaL owns its language decisions; this repository is a consumer. |
| V10 | `just` is the entry point; recipes call `scripts/*.sh`. Python, where a script needs it, runs in a uv-managed venv, never the system python. Tools with no dependencies to install are preferred in the gate. | One way to do things, as in the siblings. |
| V11 | Generated media is never tracked: audio, frames, clips and rendered video go to `work/` and `out/` (gitignored). Tracked: lessons, schemas, libraries, scripts, docs. | A video is megabytes per version; the lesson and the pinned tools reproduce it. |
| V12 | Third-party services need the user's say: a hosted text-to-speech or image model is used only when the user names it; the default is the user's own servers. Remotion's license (free for individuals and companies of three or fewer; a company license beyond that) is stated in the README. | No surprise costs or data leaving the machine. |

This repository's local port is 8427 (Remotion Studio and any preview
server), so it can run beside a demo from each sibling.

## Prior art: the local video repositories

Surveyed 2026-11-12 with `lspj` (133 projects) and a search for
`ffmpeg`. Two repositories build videos with ffmpeg and API calls;
the others only mention ffmpeg in documents or tests.

| Repository | What it does | What this repository takes from it |
| ---------- | ------------ | ---------------------------------- |
| `../video-publishing` | Long-form, landscape. `obs2yt.sh` turns an OBS recording into a narrated video; `tools/` is a Rust workspace of 21 `vid-*` CLIs wrapping ffmpeg and ImageMagick (`vid-tts`, `vid-concat`, `vid-volume`, `vid-speedup`, `vid-scale`, `vid-music`, `vid-slide`, `vid-image`, `vid-frames`, `vid-composite`, `vid-lipsync`, `vid-whisper`, ...). API calls: a TTS server on host `curiosity`, a MuseTalk lip-sync server on `hive`, a Whisper server on `hive`. | The assembly tools (V7), the TTS interface (V6), the rule against bare ffmpeg. |
| `../shorts` | Portrait shorts, one directory per project (`projects/<name>/`): HTML slides in `showcase/`, narration in `work/scripts/*.txt`, `tts/client.py` (a Gradio client for VoxCPM on `curiosity:7860`), `work/capture-slides.py` (Playwright screenshots at 1080x1920), `work/build-video.sh` (ffprobe each WAV, still image plus audio to a clip, `vid-concat --reencode`, `vid-volume --normalize`). 16 projects have a `build-video.sh`. | The per-lesson layout, narration as one text file per scene, audio-first timing, Playwright capture (V8). |
| `../text-to-sfx-gen` | Python generators for sound effects (WAV). | A source of sound effects, later. |
| `../X_eTaL`, `../X_eTaL-ML`, `../X_eTaL-extensions` | Mention ffmpeg in docs and screenshot scripts only. | Nothing to reuse for video. |

What the existing pipelines do by hand, and Remotion replaces: a still
image per scene (a slide screenshot) under its narration. What they
do well, and this repository keeps: narration, loudness, concatenation
and publishing.

## Layout

```
X_eTaL-video/
  XETAL_COMMIT          the pinned X_eTaL (V1)
  libs/<Name>/          X_eTaL libraries: src/, tests/, README.md (V2)
  schemas/              lesson.schema.json (V3)
  lessons/<slug>/       lesson.json, narration, generated timing (V3)
  remotion/             the Remotion project (V4; saga 2)
  scripts/              the logic behind every just recipe
  docs/                 plan, asks, proposed scripts, research
  work/, out/           clones, audio, frames, video (not tracked)
```

## The libraries

Small, typed, whole-array X_eTaL, each a port of what a video
renderer computes per frame, so the numbers can be computed once, as
arrays, tested, and handed to any renderer.

| Library | What | Ported from | Saga |
| ------- | ---- | ----------- | ---- |
| Timeline | frames and seconds; where each scene starts and ends from the scenes' lengths; which scene a frame is in; progress within it | Remotion's `<Sequence>` and `<Series>` arithmetic | 1 |
| Ease | clamp, a ramp and a lerp over a range, easing curves (quad, cubic, sine, smoothstep; in, out, in-out), a stagger table; to come: many-point interpolation, bezier | Remotion's `interpolate` and `Easing` | 1 |
| Spring | a damped spring's position at any time, in closed form, and how many frames it takes to settle; as in Remotion, damping past critical moves as critical does | Remotion's `spring` and `measureSpring` | 1 |
| Captions | words and their times grouped into caption pages; the word being spoken at a frame | `@remotion/captions` | 3 |
| Lesson | a lesson's scenes as arrays: lengths in, a timing table out, printed as the JSON the renderer reads | (new) | 2 |
| Trace | a demo's stages (name, shape, value) as a table a `TracePlayer` component steps through | the demos' microscope | 4 |

## The lessons

Each lesson is one live demo explained: the program, the result, the
array transformation that makes it, one thing worth knowing. First
lessons, chosen because their demos already run at the command line
and print stages:

| Lesson (slug) | Demo | The one idea |
| ------------- | ---- | ------------ |
| life | X_eTaL-demos life-microscope | a neighborhood count is nine rotations summed |
| mandelbrot | X_eTaL-demos mandelbrot | broadcasting: every pixel iterated at once |
| nbody | X_eTaL-demos nbody | all pairs is one table, forces are one reduce |
| attention | X_eTaL-ML attention | rows meet columns: Q, K, V and a softmax |
| sudoku | X_eTaL-games sudoku | constraints as arrays, a move as a mask |
| making-of (built, as a draft) | this repository | this video's own schedule is one scan |

## Saga 1 -- foundation  [DONE 2026-11-13]

Goal: the process, the pinned interpreter, the gate, and the first
libraries, tested.

1. scaffold [DONE] -- CLAUDE.md and AGENTS.md, COPYRIGHT, LICENSE, README,
   CHANGES.md, .gitignore, justfile, `scripts/xetal.sh`,
   `scripts/gate.sh`, this plan, `docs/xetal-asks.md`,
   `docs/remotion-scripts.md` (the proposed scripts).
2. timeline-lib [DONE] -- `libs/Timeline` with tests and baselines;
   `scripts/test-libs.sh` in the gate.
3. ease-lib [DONE] -- `libs/Ease`.
4. making-of [DONE] -- the user asked for a demo video that describes
   how it was created: `lessons/making-of/` (lesson.json, timing.json),
   `scripts/schedule.sh` (X_eTaL computes the schedule and every
   frame's numbers), `scripts/frames.mjs` (a PNG per frame,
   ImageMagick), `scripts/draft-video.sh` (ffmpeg), both formats;
   `scripts/check-lessons.sh` in the gate. A draft renderer with
   nothing to install; Remotion replaces `frames.mjs`, not the rest.
5. remotion-making-of [DONE] -- the user installed Remotion
   (`npx create-video@latest --yes --blank remotion`, 4.0.543):
   `remotion/src` (Root: LessonLandscape and LessonPortrait, length
   from the timing; Lesson: layout only, every number looked up),
   `scripts/props.sh` (the lesson and X_eTaL's numbers as one props
   file), `scripts/render.sh`, `just render`, `still`, `studio`; the
   making-of lesson rendered in both formats. This is saga 2's steps
   1 and 4, done early. The agent skills are not installed yet.
6. spring-lib [DONE] -- `libs/Spring`, checked against Remotion
   4.0.543's own `spring` and `measureSpring`.
7. lesson-schema [DONE] -- `schemas/lesson.schema.json`;
   `scripts/check-schema.mjs`, a validator with nothing to install
   (it checks itself first, and an unknown keyword is an error);
   `scripts/check-lessons.sh` uses it. The first lesson is
   `lessons/making-of` (step 4).

## Saga 2 -- life  [ACTIVE]

Goal: the first lesson about a live demo, Life, made both ways V8
names so the user can pick (the user, 2026-11-13: "both? so I can
pick the better one"; Life first).

1. housekeeping -- `docs/research.txt` trimmed to the conversation
   and tracked; Remotion's agent skills installed (`skills-lock.json`
   tracked, the skills ignored); saga 1 archived.
2. life-drawn -- `lessons/life`: X_eTaL runs Life and prints every
   generation; a `board` scene kind draws them.
3. life-capture -- Playwright records the published page; a
   `capture` scene kind plays it.
4. compare -- both rendered, both formats, for the user to choose.

## Later -- remotion  [PLANNED; steps 1 and 4 done in saga 1]

Goal: one lesson rendered to MP4 in both formats, silent.

1. install -- `remotion/` created (`npx create-video --yes --blank`),
   the agent skills added (`npx remotion skills add`), versions
   locked, Studio on port 8427, `node_modules` ignored.
2. theme -- one theme file (the X_eTaL colors and fonts of the live
   sites), `CodeBlock` (X_eTaL drawn as the sites draw it),
   `TitleCard`, `LowerThird`.
3. lesson-lib -- `libs/Lesson`: lengths in, the timing JSON out.
4. master -- one composition that renders any `lesson.json`
   (`calculateMetadata` reads the timing); landscape and portrait.
5. array-views -- `ArrayView` (a vector, a matrix, a shape), animated
   with `libs/Ease` and `libs/Spring` numbers.
6. render -- `just render SLUG [landscape|portrait]`, a rendered
   still per scene as a baseline in the gate.

## Saga 3 -- voice  [BLOCKED: the TTS host is down (the user, 2026-11-13); VoxCPM is to be installed on another system]

Goal: narrated lessons whose scene lengths follow the audio.

1. tts -- `just voice SLUG`: one WAV per scene through `vid-tts`.
2. durations -- `ffprobe` each WAV into the lesson's timing.
3. captions -- `libs/Captions`; word times from `vid-whisper`.
4. audio -- narration in the composition; loudness by `vid-volume`.

## Saga 4 -- lessons from the live demos  [PLANNED]

Goal: the first six lessons (the table above).

1. capture -- record a published demo page in headless Chrome
   (Playwright) at both sizes; `just capture SLUG`.
2. trace -- `libs/Trace` and a `TracePlayer` component.
3. One step per lesson: life, mandelbrot, nbody, attention, sudoku,
   timeline.

## Saga 5 -- assembly and publishing  [PLANNED]

Goal: finished files for both channels.

1. handoff -- `just assemble SLUG`: intro, lesson, outro, music
   through the `vid-*` tools; a project directory written in the
   form `../shorts` and `../video-publishing` expect.
2. overlays -- transparent ProRes 4444 callouts for screen
   recordings.
3. batch -- every lesson, both formats, one command.

## Open questions for the user

1. Remotion: answered, installed (2026-11-13), its agent skills too.
2. Voice: `curiosity` is down for repairs and VoxCPM is to be
   installed on another system (the user, 2026-11-13). Which host
   and port then? Silent videos until it is up.
3. Demo pictures: both, to compare (the user, 2026-11-13); to be
   decided after saga 2.
4. Which lesson first: Life (the user). Still open: a 60 second
   short or a 3 to 5 minute explainer?
5. Should the libraries here that prove general (Ease, Spring) move
   to X_eTaL-libraries later?

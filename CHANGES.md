# Changes

Every commit, newest first, grouped by day. Times are Pacific
(UTC-08:00), as committed.

Categories: `feat` new capability, `fix` a bug or wrong behavior,
`refactor` structure without behavior change, `test` tests only,
`build` build and tooling, `lib` a library or a change to one,
`lesson` a lesson or a change to one, `docs` documentation,
`plan` saga planning and reordering, `release` milestone release,
`chore` agentrail bookkeeping (step complete, saga archive),
`vendor` a move of the pinned X_eTaL.

## 2026-11-18

- 16:40 `docs` The site published with Life and Mandelbrot narrated (gh-pages from main f398415); images/screencapture.png retaken; out/SLUG-youtube/ built for life, mandelbrot, nbody. voice.py pads a clip in the lesson's own folder, so lessons narrated at once never share a temporary file.
- 16:10 `lesson` Life and Mandelbrot narrated (saga voice, step narrate-life-mandelbrot; the user: narrate life and mandelbrot too, never more than one request to queenbee at a time): every narration now queues its VoxCPM request on one machine-wide lock (~/.cache/voxcpm-tts.lock, XETAL_TTS_LOCK), so lessons narrate in parallel safely; the whisper comparison accepts contractions and "-1" for "minus one". Narration reworded where VoxCPM or whisper stumbled. Life 48.4 s (stepFrames 5, poster 1260), Mandelbrot 47.2 s (stepFrames 9, the live page re-recorded with its clicks retimed); title.txt and description.txt for both.
- 15:00 `docs` The site published with the narrated N-body short.
- 14:55 `chore` Saga step youtube-files completed.
- 14:50 `feat` YouTube upload files (saga voice, step youtube-files; the user: where are the captions, the title and description): `just youtube SLUG` (scripts/youtube.mjs) gathers out/SLUG-youtube/: both videos, title.txt and description.txt (tracked in lessons/SLUG/, as the shorts projects have them), SLUG.srt closed captions from the exact sentences at their times (just voice now records each sentence's offset in voice.json), narration.txt. The N-body title and description written.
- 14:35 `chore` Saga step narrate-nbody completed.
- 14:30 `feat` Narration in the author's cloned voice (saga voice, step narrate-nbody; the user: curiosity is down, queenbee runs VoxCPM with Gradio, use the voice sample of this year's videos, verify with a local whisper, reword to avoid VoxCPM artifacts): `just voice SLUG` (scripts/voice.sh, voice.py) speaks each scene's narration a sentence a call with mike-medium-ref-1.wav and its exact transcript, checks every clip with whisper-cli (ggml-medium.en) and remakes mismatches, sets each scene's seconds to its audio, recomputes timing.json, records lessons/SLUG/voice.json; props.mjs refuses stale or missing audio; Lesson.tsx plays each scene's audio at its start (@remotion/media 4.0.543). The N-body narration reworded and spoken: 50.2 s, its page re-recorded, poster at frame 1300, both formats rendered.
- 13:41 `chore` Saga nbody archived; saga voice started.

## 2026-11-14

- 11:30 `docs` The site published with the N-body short (gh-pages from main 5df611d) and images/screencapture.png retaken from it.
- 10:01 `chore` Saga step nbody-short completed.
- 10:01 `lesson` The N-body short (saga nbody; the user: N-body next): lessons/nbody, seven scenes in 60 seconds: the figure-eight, every pair's displacement as tables stacked into a cube, every pair's pull, one reduce to the accelerations, the step repeated (data.xtl: the demo's own program, 420 steps of positions), then the published page recorded with fifty bodies, and the link. Boards gain `points` (bodies with trails, a step a frame) and number cells that fit any numbers. out/nbody-portrait-remotion.mp4 and out/nbody-landscape-remotion.mp4, 60.0 s.
- 08:55 `chore` Saga step readme-screenshot completed.
- 08:55 `docs` README: a picture of the live page under the link at the top (images/screencapture.png, taken from the published site; the user asked for it), both linking to https://softwarewrighter.github.io/X_eTaL-video/; just screencapture retakes it. The site is published and checked live (gh-pages from main 2c64dbb): the page and its videos load, a thumbnail plays.
- 08:50 `chore` Saga step landing-page completed.
- 08:50 `feat` The live page (saga site; the user: a landing page with thumbnails to the videos, its URL at the top of the README, the favicon the peers' logo in a very light gray): scripts/build-catalog.mjs and build-pages.sh build pages/ (a card a lesson: thumbnail, length, summary, both formats, the live demo, the lesson; videos rendered when missing or stale), publish-pages.sh publishes it as gh-pages, serve-pages.mjs previews it on port 8427; images/ has the gray logo and the favicon (X_eTaL's design on #f1f3f5, scripts/favicon.sh); lessons gain summary, order and poster; README links https://softwarewrighter.github.io/X_eTaL-video/ at the top.
- 08:40 `chore` Saga step mandelbrot-short completed.
- 08:40 `lesson` The Mandelbrot short (saga mandelbrot, step 2; the user: Mandelbrot, 60 seconds, mixed): lessons/mandelbrot, six scenes: the set, a number for every pixel by broadcasting, one step with a mask, the step repeated while the set appears (data.xtl: the demo's own program, the counts after each of 24 steps), then the published page recorded, and the link. Boards gain `heat` (ramp, escape). out/mandelbrot-portrait-remotion.mp4 and out/mandelbrot-landscape-remotion.mp4, 60.0 s.

## 2026-11-13

- 20:04 `chore` Saga step code-pan completed.
- 20:04 `fix` Long code lines pan, they are not shrunk (saga mandelbrot, step 1; the user: "fix size of '1 line' to be readable, pan from left to right, it doesn't have to fit in portrait mode"): a code or X_eTaL line keeps its full size and, when wider than its panel, pans from its start to its end over the scene by X_eTaL's in-out row; board labels sized by the picture. Life and making-of re-rendered. CLAUDE.md rule 4b.
- 19:27 `chore` Saga step xtl-lines completed.
- 19:27 `feat` X_eTaL shown as rendered, never as typed (saga rendered-code; the user: "I prefer to see as-rendered (and color syntax highlighted)"): a lesson line {"xtl": ...} is rendered by the pinned `xetal render --html` (scripts/props.mjs) and drawn in JuliaMono with X_eTaL's syntax colors (remotion theme; scripts/fetch-fonts.sh fetches the font, checksummed, not tracked); {"code": ...} stays for what is not X_eTaL. making-of and life converted; all six videos re-rendered. CLAUDE.md rule 4a, plan V13.
- 18:57 `chore` Saga step compare completed.
- 18:57 `plan` The two Life lessons compared (saga life, step 4, its last): docs/plan.md has the table (drawn from X_eTaL's arrays: reproducible, laid out for each format; recorded from the page: the real demo, not reproducible, the page's own layout); the user chooses, and a lesson can mix both. Saga life done.
- 18:47 `chore` Saga step life-capture completed.
- 18:47 `lesson` The Life lesson, recorded (saga life, step 3): lessons/life-capture shows the published life-microscope page itself: scripts/capture.mjs records it in headless Chromium (Playwright, a dev dependency of remotion/) at each format's capture area while the scenes' actions run (click, select, scroll, wait), one recording as long as its scenes; a scene's `capture` plays it, the recording's frame for every frame one more row of X_eTaL's schedule. just capture. out/life-capture-landscape-remotion.mp4 and out/life-capture-portrait-remotion.mp4, 64 s. Recordings are not tracked.
- 17:45 `chore` Saga step life-drawn completed.
- 17:44 `lesson` The Life lesson, drawn (saga life, step 2): lessons/life (lesson.json with narration for later, data.xtl, timing.json): the one-line rule, the nine shifted copies, their sum, the comparison and 47 generations of an R-pentomino, every board an array X_eTaL printed (data.xtl, after "== name" lines). scripts/props.sh carries a lesson's arrays; the schedule gains each frame's step and the fade into it; the schema gains stepFrames and a scene's boards; remotion/src/Boards.tsx draws them fitted to the room left. out/life-landscape-remotion.mp4 and out/life-portrait-remotion.mp4, 64 s. The draft renderer refuses lessons with boards.
- 16:36 `chore` Saga step housekeeping completed.
- 16:36 `docs` Housekeeping (saga life, step 1; the user's answers): docs/research.txt tracked, trimmed to the conversation (the chat application's sidebar and footer removed); Remotion's agent skills installed (`npx remotion skills add`, 13 skills; remotion/skills-lock.json tracked, the skills ignored); the foundation saga archived and saga life started (the Life lesson both ways: drawn from X_eTaL's output, and recorded from the published page); plan updated.
- 16:27 `chore` Saga step lesson-schema completed.
- 16:27 `build` The lesson schema (saga foundation, step 7, its last): schemas/lesson.schema.json (a lesson's form, nothing else allowed) and scripts/check-schema.mjs, a JSON Schema validator with nothing to install for the keywords it uses (an unknown keyword is an error; --self-test: two good lessons, twelve wrong ones); scripts/check-lessons.sh validates every lesson with it, then the slug and unique scene ids, then the timing.
- 16:24 `chore` Saga step spring-lib completed.
- 16:24 `lib` libs/Spring (saga foundation, step 6): Remotion's spring and measureSpring in closed form on whole arrays: `l:s_pring` (position at any time, a spring is (mass, damping, stiffness)), `l:s_ettle` (frames to settle), `l:r_atio`, `l:d_efault`, `l:s_mooth`. Checked against Remotion 4.0.543's own numbers (four places at nine frames; settle times 28, 23, 23, 56); as in Remotion, damping past critical moves as critical does. Tests basics.xtl and types.rgt.
- 16:15 `chore` Saga step remotion-making-of completed.
- 16:15 `feat` Remotion renders the making-of lesson (saga foundation, step 5; the user installed Remotion 4.0.543 and asked to try it): remotion/ (Root: LessonLandscape 1920x1080 and LessonPortrait 1080x1920, length from X_eTaL's timing; Lesson: layout only, no interpolate or spring, every number looked up), scripts/props.sh (the lesson and every frame's numbers from X_eTaL as one props file), scripts/render.sh, just render, still and studio (port 8427): out/making-of-landscape-remotion.mp4 and out/making-of-portrait-remotion.mp4, 58 s, about 20 s a render. The gate lints and type-checks remotion/ when its packages are installed. The lesson's last two scenes reworded to be true of both renderers. Voice is blocked: the TTS host is down.
- 16:01 `chore` Saga step making-of completed.
- 16:01 `lesson` The making-of video (saga foundation, step 4; the user: "create a demo video that describes how it was created"): lessons/making-of/lesson.json (seven scenes as data), scripts/schedule.sh and schedule.xtl.in (X_eTaL computes the schedule and every frame's scene, progress, fade, easing curves and line stagger, 1740 frames at once, with Timeline and Ease), scripts/frames.mjs (a PNG per frame with ImageMagick, layout only), scripts/draft-video.sh (ffmpeg encodes them): out/making-of-landscape.mp4 and out/making-of-portrait.mp4, 58 s, silent, not tracked. timing.json tracked and checked against X_eTaL by scripts/check-lessons.sh in the gate. just draft, frame, timing, lessons, check-lessons. A draft renderer with nothing to install; Remotion comes next.
- 13:39 `chore` Saga step ease-lib completed.
- 13:39 `lib` libs/Ease (saga foundation, step 3): ramps, lerps and easing curves ported from Remotion's interpolate and Easing: `l:c_lamp`, `l:r_amp`, `l:l_erp`, the quad and cubic curves in, out and in-out, `l:i_nOutSine`, `l:s_mooth`, and `l:s_tagger` (things animated in turn, a table of progress). Tests basics.xtl and types.rgt.
- 13:00 `chore` Saga step timeline-lib completed.
- 13:00 `lib` libs/Timeline (saga foundation, step 2): a video's schedule as arrays, ported from Remotion's Series and Sequence arithmetic: `l:f_rames`, `l:s_econds`, `l:s_tarts`, `l:e_nds`, `l:t_otal`, `l:s_cene`, `l:l_ocal`, `l:p_rogress`, `l:a_ctive`; one frame or a vector of frames. Tests basics.xtl and types.rgt (reg-rs), lint. The first ask in docs/xetal-asks.md: a reduce along the last axis whatever the rank (`l:s_cene` uses `e_ach` meanwhile).

## 2026-11-12

- 19:00 `chore` Saga step scaffold completed.
- 18:43 `build` The scaffold (saga foundation, step 1), after X_eTaL-demos and X_eTaL-libraries: CLAUDE.md with the agentrail briefing and this repository's rules (AGENTS.md a symlink to it), COPYRIGHT and LICENSE (MIT, the siblings'), README, .gitignore (the X_eTaL clone, generated media, node_modules, reg-rs caches), X_eTaL pinned at abdd371d in XETAL_COMMIT (scripts/xetal.sh builds bin/xetal), a justfile over scripts/ (xt: the pinned xetal with libs/ on its path; test-libs.sh: lint and reg-rs baselines per library; check-xetal.sh; check-spelling.py; gate.sh). docs/plan.md: decisions V1 to V12, the survey of the local projects that build videos with ffmpeg and API calls (video-publishing's vid-* tools, the shorts' build-video.sh and TTS client), the libraries and lessons to come, five sagas, open questions. docs/remotion-scripts.md: the proposed scripts for Remotion (install, voice, timing, capture, render, assemble), not yet run. docs/xetal-asks.md started. docs/research.txt (the user's) is kept local, not tracked, until the user confirms it should be public.
- 10:54 `docs` The repository created with an empty README (the user).

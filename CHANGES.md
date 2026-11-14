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

## 2026-11-13

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

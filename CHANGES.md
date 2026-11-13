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

## 2026-11-12

- 18:43 `build` The scaffold (saga foundation, step 1), after X_eTaL-demos and X_eTaL-libraries: CLAUDE.md with the agentrail briefing and this repository's rules (AGENTS.md a symlink to it), COPYRIGHT and LICENSE (MIT, the siblings'), README, .gitignore (the X_eTaL clone, generated media, node_modules, reg-rs caches), X_eTaL pinned at abdd371d in XETAL_COMMIT (scripts/xetal.sh builds bin/xetal), a justfile over scripts/ (xt: the pinned xetal with libs/ on its path; test-libs.sh: lint and reg-rs baselines per library; check-xetal.sh; check-spelling.py; gate.sh). docs/plan.md: decisions V1 to V12, the survey of the local projects that build videos with ffmpeg and API calls (video-publishing's vid-* tools, the shorts' build-video.sh and TTS client), the libraries and lessons to come, five sagas, open questions. docs/remotion-scripts.md: the proposed scripts for Remotion (install, voice, timing, capture, render, assemble), not yet run. docs/xetal-asks.md started. docs/research.txt (the user's) is kept local, not tracked, until the user confirms it should be public.
- 10:54 `docs` The repository created with an empty README (the user).

# X_eTaL video

Educational videos about
[X_eTaL](https://github.com/softwarewrighter/X_eTaL), the
eXperimental Extensible Typed Array Language, built from its live
demos: a lesson is data, X_eTaL computes its timing and animation as
arrays, a deterministic renderer draws every frame, and the existing
video tools assemble the result.

Status: early. The X_eTaL libraries for timing are being written and
tested; the renderer (Remotion) is not installed yet, and no video
has been rendered. `docs/plan.md` has the roadmap.

## How it fits

| Layer | Where | Responsibility |
| ----- | ----- | -------------- |
| The language and its demos | [X_eTaL](https://github.com/softwarewrighter/X_eTaL), [X_eTaL-demos](https://github.com/softwarewrighter/X_eTaL-demos), [X_eTaL-ML](https://github.com/softwarewrighter/X_eTaL-ML), [X_eTaL-games](https://github.com/softwarewrighter/X_eTaL-games), [X_eTaL-libraries](https://github.com/softwarewrighter/X_eTaL-libraries) | what a video is about: programs, their output, the live pages |
| This repository | `libs/`, `lessons/`, `remotion/` | lessons as data; timing and animation computed in X_eTaL; scenes rendered in landscape (1920x1080) and portrait (1080x1920) |
| Assembly and publishing | the author's video repositories (long-form and shorts) | narration, loudness, intro and outro, concatenation, upload |

## What is here

| Path | What |
| ---- | ---- |
| `libs/` | X_eTaL libraries for video timing and animation (the first are in progress; `docs/plan.md` lists them) |
| `docs/plan.md` | the plan: decisions, the survey of the existing video pipelines, libraries, lessons, roadmap, open questions |
| `docs/remotion-scripts.md` | the proposed scripts: voice, timing, capture, render, assemble (proposals, not yet run) |
| `docs/xetal-asks.md` | what this work needs from X_eTaL |

## Build

Needs: Rust (to build X_eTaL), [just](https://github.com/casey/just),
`reg-rs` and `sw-markdown-checker` (Software Wrighter's tools), and
`uv` (the spelling check runs through it).

```bash
just xetal        # clone X_eTaL at the commit in XETAL_COMMIT into work/xetal, build bin/xetal
just eval "'+ s_\\ 90 150 60"     # evaluate with the pinned xetal: 90 240 300
just gate         # everything checked before a commit
just              # every recipe
```

X_eTaL is pinned: `XETAL_COMMIT` names the commit every script uses,
so results do not change under a lesson.

## Rendering (not yet)

The renderer will be [Remotion](https://www.remotion.dev/) (React and
TypeScript), in `remotion/`. Remotion has its own license: free for
individuals and for companies of three or fewer people, a company
license beyond that. If you build videos with this repository, check
that its terms fit you.

## Development

Development is tracked with agentrail sagas, as in X_eTaL: `agentrail
status` shows the current step, `agentrail next` its instructions.
Every step ends with the gate passing, docs updated, a commit to
`main` and a push. `CHANGES.md` lists every commit.

## Related Projects

- [X_eTaL](https://github.com/softwarewrighter/X_eTaL) -- the language
  ([try it live](https://softwarewrighter.github.io/X_eTaL/))
- [X_eTaL-demos](https://github.com/softwarewrighter/X_eTaL-demos) --
  visual array and scientific programs
  ([live](https://softwarewrighter.github.io/X_eTaL-demos/))
- [X_eTaL-ML](https://github.com/softwarewrighter/X_eTaL-ML) -- the
  machine-learning demos
  ([live](https://softwarewrighter.github.io/X_eTaL-ML/))
- [X_eTaL-games](https://github.com/softwarewrighter/X_eTaL-games) --
  games and puzzles
  ([live](https://softwarewrighter.github.io/X_eTaL-games/))
- [X_eTaL-libraries](https://github.com/softwarewrighter/X_eTaL-libraries)
  -- reusable libraries
  ([live](https://softwarewrighter.github.io/X_eTaL-libraries/))

## Links

- Blog: [Software Wrighter Lab](https://software-wrighter-lab.github.io/)
- Discord: [Join the community](https://discord.com/invite/Ctzk5uHggZ)
- YouTube: [Software Wrighter](https://www.youtube.com/@SoftwareWrighter)

## Copyright

Copyright (c) 2026 Michael A Wright

## License

MIT. See [`LICENSE`](LICENSE) and [`COPYRIGHT`](COPYRIGHT).

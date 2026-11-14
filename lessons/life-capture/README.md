# life-capture

Life in one line, the **recorded** version: the same lesson as
[`lessons/life`](../life/), but its five middle scenes show the
published
[life-microscope](https://softwarewrighter.github.io/X_eTaL-demos/life-microscope/)
page itself, recorded in headless Chromium while a script clicks
through it. 64 seconds, silent for now.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes; five have a `capture` with the actions to run on the page when the scene starts (`click`, `select`, `scroll`, `wait`) |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |

```bash
just capture life-capture             # record the page, both formats (about 2 minutes; needs the network)
just render life-capture              # out/life-capture-landscape-remotion.mp4
just render life-capture portrait     # out/life-capture-portrait-remotion.mp4
```

The scenes with a capture are one continuous recording, as long as
those scenes are, so it lines up with the schedule: which frame of
the recording a frame of the video shows is one more row X_eTaL
computes. The page is recorded at exactly the size of the area it is
shown in (1720x700 in landscape, 940x1480 in portrait), so nothing is
scaled.

The recordings are not tracked (`remotion/public/captures/`); record
before rendering. A recording shows the page as published that day:
if the page changes, a selector in `lesson.json` may stop matching
and the capture fails, saying which.

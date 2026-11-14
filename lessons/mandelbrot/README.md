# mandelbrot

Mandelbrot without a loop: a 60 second short about X_eTaL-demos'
[mandelbrot](https://softwarewrighter.github.io/X_eTaL-demos/mandelbrot/),
made portrait first (it renders in landscape too). Silent for now;
each scene's narration is written.

It mixes the two kinds of scene: four drawn from arrays X_eTaL
printed, then one of the published page itself, recorded.

| File | What |
| ---- | ---- |
| `lesson.json` | six scenes: the set; a number for every pixel; one step; the step repeated, the set appearing; the live page; the link |
| `data.xtl` | the demo's own program (its view, its broadcasting, its step) on a 48 by 60 grid of square cells, printing `cr`, `ci`, the counts after each of 24 steps (25 boards) and the last of them, `set` |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |

```bash
just capture mandelbrot             # record the page (network), both formats
just render mandelbrot portrait     # out/mandelbrot-portrait-remotion.mp4
just render mandelbrot              # out/mandelbrot-landscape-remotion.mp4
```

A board with `"heat"` is colored by its numbers, cells touching:
`"ramp"` from the least to the most (the real and imaginary parts),
`"escape"` for counts of steps, where a cell that has never left (as
many steps as there have been) is black, so the black region shrinks
to the set as the steps go by.

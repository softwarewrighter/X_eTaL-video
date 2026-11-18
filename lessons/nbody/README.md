# nbody

Gravity without a loop: a 50 second short about X_eTaL-demos'
[nbody](https://softwarewrighter.github.io/X_eTaL-demos/nbody/),
made portrait first (it renders in landscape too), narrated in the
author's cloned voice; each scene is as long as its narration.

Five scenes are drawn from arrays X_eTaL printed; one is the
published page itself, recorded with its fifty-body cluster.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes: the figure-eight; every pair's displacement as tables; the pull; the reduce; the step repeated; the live page; the link |
| `data.xtl` | the demo's own program (its cube, its pull, its reduce, its leapfrog step) on its figure-eight, printing the cube's x and y planes, each pair's pull along x, the accelerations, and 420 steps of positions |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `voice.json` | the narration as spoken (`just voice nbody`): each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice nbody               # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture nbody             # record the page (network), both formats
just render nbody portrait     # out/nbody-portrait-remotion.mp4
just render nbody              # out/nbody-landscape-remotion.mp4
```

A board with `"points"` takes positions (each board 2 by N, the x row
above the y row) and draws the bodies; with `"animate"` it shows a
step a frame (`stepFrames` is 1 here) with a trail behind each body.
`{{step}}` in the line above it is the number of steps taken.

One thing differs from the demo: the time step is 0.02, twice the
demo's, so that a step a frame takes the bodies round the
figure-eight in about ten seconds. The numbers on screen are rounded
to two places.

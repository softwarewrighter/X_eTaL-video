# life

Life in one line: Conway's Game of Life as X_eTaL-demos'
[life-microscope](https://softwarewrighter.github.io/X_eTaL-demos/life-microscope/)
writes it, one array at a time. 64 seconds, silent for now (each
scene's narration is written, for when there is a voice).

This is the **drawn** version: every board on screen is an array
X_eTaL printed, drawn by a Remotion component. `lessons/life-capture`
is the same lesson with the published page recorded instead.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes: the rule, the nine shifted copies, their sum, the comparison, 47 generations of an R-pentomino |
| `data.xtl` | the lesson's arrays, computed by X_eTaL: the glider `b`, its nine rotations, the sum `s`, the next board, and 48 boards of a 16 by 16 world. Each is printed after a `== name` line; a scene's `boards` name them |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |

```bash
just render life             # out/life-landscape-remotion.mp4
just render life portrait    # out/life-portrait-remotion.mp4
just still life 1500         # one frame (the run, generation 24)
just studio life             # scrub it at http://localhost:8427
scripts/xt run lessons/life/data.xtl    # the arrays themselves
```

A board with `"animate": true` shows one board of its list at a time,
a generation every `stepFrames` frames (10 here); which one, and how
far the fade into it has gone, come from the schedule X_eTaL computes
for every frame, as everything timed does. `{{step}}` in a line is
that generation's number. A list without `animate` is shown all at
once (the nine copies).

The draft renderer (`just draft`) does not draw boards; this lesson
needs Remotion.

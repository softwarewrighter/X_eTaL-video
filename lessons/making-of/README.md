# making-of

How this video was made: a 58 second video that describes its own
construction, and whose on-screen numbers are its own schedule.

| File | What |
| ---- | ---- |
| `lesson.json` | the lesson: seven scenes, each a heading, lines (text or code) and a length in seconds; its form is `schemas/lesson.schema.json` |
| `timing.json` | the schedule X_eTaL computes from it (frames per scene, starts, ends, the total); checked by the gate, never typed |

```bash
just render making-of            # out/making-of-landscape-remotion.mp4 (Remotion)
just render making-of portrait   # out/making-of-portrait-remotion.mp4
just still making-of 850         # one frame through Remotion, as a PNG
just timing making-of            # the schedule, computed by libs/Timeline
just frame making-of 850         # one frame as a PNG (work/making-of/landscape/frames/00850.png)
just draft making-of             # out/making-of-landscape.mp4
just draft making-of portrait    # out/making-of-portrait.mp4
```

How it is made, which is also what it says:

1. `lesson.json` is the whole content.
2. `scripts/schedule.sh` fills `scripts/schedule.xtl.in` with the
   scenes' seconds and runs it: `libs/Timeline` turns seconds into
   frames and lays the scenes end to end; for every frame at once it
   gives the scene, the frame within the scene and the progress, and
   `libs/Ease` gives each scene's fade, each line's staggered
   appearance and three easing curves.
3. A renderer draws every frame from those numbers. It decides where
   things go; it computes no timing. There are two: Remotion
   (`remotion/src/Lesson.tsx`, given the numbers by
   `scripts/props.sh`), and the draft renderer, `scripts/frames.mjs`
   (a PNG per frame with ImageMagick, encoded by `ffmpeg`), which
   needs nothing installed.

A line `{"xtl": ...}` is X_eTaL and is shown as rendered (decorated,
colored); `{"code": ...}` is other code. In any line, `{{f}}`, `{{scene}}`, `{{local}}`, `{{progress}}`,
`{{total}}`, `{{secs}}`, `{{durs}}` and `{{starts}}` are replaced by
the frame's own numbers. A scene with `"curves": true` shows the
three curves as moving dots.

Both are silent. The video files
are not tracked (`out/`); the lesson and the pinned tools reproduce
them. Fonts are macOS system fonts (Arial, Menlo); set `VIDEO_FONT`,
`VIDEO_FONT_BOLD` and `VIDEO_FONT_MONO` to font files elsewhere.

# The Remotion renderer

One [Remotion](https://www.remotion.dev/) project that renders any
lesson of this repository. It holds no lesson: a lesson is
`../lessons/<slug>/lesson.json`, and its schedule and every frame's
animation numbers are computed by X_eTaL (`../libs/Timeline`,
`../libs/Ease`) and handed in as props (`../scripts/props.sh`).

| File | What |
| ---- | ---- |
| `src/Root.tsx` | two compositions of one component, `LessonLandscape` (1920x1080) and `LessonPortrait` (1080x1920); length and frame rate from the props |
| `src/Lesson.tsx` | the lesson: heading, lines (text and code), three easing curves, the schedule as a bar. Layout only: a frame looks its numbers up, there is no `interpolate()` or `spring()` here |
| `src/types.ts` | the props' shape |
| `src/theme.ts` | colors and fonts |
| `src/sample.ts` | what Studio shows with no props |

From the repository's root:

```bash
cd remotion && npm ci && cd ..    # once: the packages in package-lock.json
just still making-of 850          # one frame: out/making-of-landscape-850.png
just render making-of             # out/making-of-landscape-remotion.mp4
just render making-of portrait    # out/making-of-portrait-remotion.mp4
just studio making-of             # Remotion Studio at http://localhost:8427
```

The first render downloads Remotion's headless browser. Fonts are
system fonts (Arial, Menlo).

Remotion has its own license: free for individuals and for companies
of three or fewer people, a company license beyond that
(remotion.dev/docs/license).

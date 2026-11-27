# cell-555

The assembly cell of X_eTaL-extensions (extensions/cell) building the
whole 555 LED blinker (programs/blinker.cell: 366 commands, 1080
simulated seconds), recorded from the live page with the whole UI
showing, about four times real speed, narrated join by join with the
actions each shows. Music: Soldiers Reel (music-pipe-rs video beds).

| File | What |
| ---- | ---- |
| `joins.json` | each join's first step and simulated span, read from the live page's step list |
| `lesson.mjs` | writes `lesson.json`: one scene a join, its length its span at 4x (the narration then fits it) |
| `timing.json` | the schedule X_eTaL computes from the lesson |

The recording (just cell-live cell-555, scripts/cell-live.mjs) is the live page running
in real time, driven as a person drives it: the speed menu set to 4x,
Play pressed, then Close up while a joint is made at the vise and Whole
cell while the arm fetches a part (work/cell-555/track.json, from just
cell-track), drags to turn the view, scrolls to zoom, the step list
kept on the current step. Each join starts with its scene; a scene
longer than its span at 4x holds its last moment. The recorder refuses
a page whose program differs from joins.json (the published page
changes).

## Sources

| Claim | Source |
| ----- | ------ |
| the parts (NE555P, R1 1k, R2 47k, R3 470, C1 10 uF electrolytic, C2 10 nF disc, a red LED, a battery snap), seven nets | extensions/cell/circuits/blinker.toml |
| the order of the joins and what each does (bent in the rig, sheared, lapped, trimmed; R3 bent up for the LED; jumpers brought in from the side) | extensions/cell/docs/README.md (The 555 blinker); the step list |
| check: 7 of 7 nets made, nothing damaged | extensions/cell/docs/README.md |

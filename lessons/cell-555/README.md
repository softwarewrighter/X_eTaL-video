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

The draft shows a still of each join (work/cell-555/stills/, from the
page). The recording is made after the narration: frame by frame
(window.cell.seek), each join's span played over its scene, the camera
on the work, the step list scrolled to the current step.

## Sources

| Claim | Source |
| ----- | ------ |
| the parts (NE555P, R1 1k, R2 47k, R3 470, C1 10 uF electrolytic, C2 10 nF disc, a red LED, a battery snap), seven nets | extensions/cell/circuits/blinker.toml |
| the order of the joins and what each does (bent in the rig, sheared, lapped, trimmed; R3 bent up for the LED; jumpers brought in from the side) | extensions/cell/docs/README.md (The 555 blinker); the step list |
| check: 7 of 7 nets made, nothing damaged | extensions/cell/docs/README.md |

# Spring

A damped spring pulled from 0.0 to 1.0, as arithmetic on whole
arrays: its position at any time, and how long it takes to settle.

```
"sp:" u_se< "Spring"
```

Ported from Remotion's `spring` and `measureSpring`. Remotion steps
the spring frame by frame; each step is the exact solution of the
spring's equation, so here that solution is written once, from rest,
for every time asked at once. Remotion's

```
spring({frame, fps: 30, config: {damping: 200}})
```

is here

```
(1.0, 200.0, 100.0) sp:s_pring frame / 30
```

and `frame` may be every frame of the video.

| Function | What |
| -------- | ---- |
| `spring sp:s_pring t` | the position `t` seconds after release; `spring` is `(mass, damping, stiffness)` |
| `spring sp:s_ettle fps` | frames until it stays within 0.005 of 1.0 (`measureSpring`) |
| `sp:r_atio spring` | the damping ratio: below 1 it overshoots |
| `sp:d_efault @` | Remotion's default, `(1.0, 10.0, 100.0)`: overshoots to about 1.16, settles in 28 frames at 30 a second |
| `sp:s_mooth @` | no overshoot, `(1.0, 200.0, 100.0)`: settles in 23 frames |

Checked against Remotion 4.0.543 itself: the default spring, a
critically damped one and `{damping: 200}` agree to the four places
compared at frames 0 to 5, 10, 20 and 30, and the settle times (28,
23, 23, and 56 at 60 frames a second) are `measureSpring`'s.

As in Remotion, a damping ratio of 1 or more moves as the critically
damped spring does: `{damping: 200}` and `{damping: 20}` are the same
motion. A real overdamped spring would creep; this library follows
Remotion, since its numbers are what a video's motion is tuned by.

Not ported: a spring that starts moving or away from 0
(`from`, `to`, an initial velocity), `overshootClamping`, `delay`,
`durationInFrames`, `reverse`. Scale and shift with `Ease`'s
`l_erp`; delay by subtracting from the time.

| Directory | What |
| --------- | ---- |
| [`src/`](src/) | the library, `Spring.xtl` |
| [`tests/`](tests/) | reg-rs baselines: `basics.xtl` and the exports' types (`types.rgt`) |

```bash
just run Spring        # run its test programs
just types Spring      # its exports' types
just test-lib Spring   # check every baseline
```

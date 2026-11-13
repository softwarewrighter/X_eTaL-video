# Timeline

A video's schedule as arrays: frames and seconds, where each scene
starts and ends given the scenes' lengths, which scene a frame is in,
and how far through it the frame is.

```
"tl:" u_se< "Timeline"
```

Ported from the arithmetic of Remotion's `<Series>` and `<Sequence>`:
scenes play one after another, and a scene of d frames starting at
frame s covers frames s to s + d - 1. Frames count from 0 (as a
renderer counts them); scenes are numbered from 1 (as X_eTaL numbers
items).

| Function | What |
| -------- | ---- |
| `fps tl:f_rames secs` | seconds to frames, to the nearest frame, at least 1 |
| `fps tl:s_econds frames` | frames to seconds |
| `tl:s_tarts durs` | the frame each scene starts at |
| `tl:e_nds durs` | the frame after each scene's last |
| `tl:t_otal durs` | the video's length in frames |
| `durs tl:s_cene f` | the scene frame `f` is in |
| `durs tl:l_ocal f` | `f` counted from its scene's start |
| `durs tl:p_rogress f` | how far `f` is through its scene, 0.0 up to 1.0 |
| `durs tl:a_ctive f` | a Bool table, frames by scenes: which scene is on screen |

Every function of a frame takes one frame or a vector of frames.

```
durs := 30 tl:f_rames 3 5 2      # 90 150 60
tl:s_tarts durs                  # 0 90 240
durs tl:s_cene 0 89 90 299       # 1 1 2 3
durs tl:p_rogress 165            # 0.5
```

| Directory | What |
| --------- | ---- |
| [`src/`](src/) | the library, `Timeline.xtl` |
| [`tests/`](tests/) | reg-rs baselines: `basics.xtl` and the exports' types (`types.rgt`) |

```bash
just run Timeline        # run its test programs
just types Timeline      # its exports' types
just test-lib Timeline   # check every baseline
```

A workaround is in use: `tl:s_cene` goes frame by frame with `e_ach`
because a reduce along the last axis fails on a vector
(`docs/xetal-asks.md`).

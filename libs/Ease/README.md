# Ease

Animation as arithmetic on whole arrays: a ramp turns frames into
progress (0.0 to 1.0), an easing curve bends progress, and a lerp
turns progress into a position, a size or an opacity.

```
"ez:" u_se< "Ease"
```

Ported from Remotion's `interpolate` (clamped on both sides) and its
`Easing` curves. Remotion's

```
interpolate(frame, [10, 40], [0, 200], {easing: Easing.out(Easing.cubic)})
```

is here

```
0 200 ez:l_erp ez:o_utCubic 10 40 ez:r_amp frame
```

and `frame` may be every frame of the video at once.

| Function | What |
| -------- | ---- |
| `ez:c_lamp t` | `t` held within 0.0 to 1.0 |
| `range ez:r_amp x` | how far `x` is through `range` (two numbers), clamped |
| `range ez:l_erp t` | the value `t` of the way through `range`, not clamped |
| `ez:i_nQuad`, `ez:o_utQuad`, `ez:i_nOutQuad` | quadratic: slow start, slow end, both |
| `ez:i_nCubic`, `ez:o_utCubic`, `ez:i_nOutCubic` | cubic, the same three |
| `ez:i_nOutSine` | half a cosine wave |
| `ez:s_mooth` | smoothstep, 3t^2 - 2t^3, the usual fade |
| `(gap, length) ez:s_tagger (frame, n)` | `n` things animated one after another: a table of progress, frames by things |

Every curve takes progress and gives progress, keeps 0.0 and 1.0, and
works on a number or a whole array.

| Directory | What |
| --------- | ---- |
| [`src/`](src/) | the library, `Ease.xtl` |
| [`tests/`](tests/) | reg-rs baselines: `basics.xtl` and the exports' types (`types.rgt`) |

```bash
just run Ease        # run its test programs
just types Ease      # its exports' types
just test-lib Ease   # check every baseline
```

Not ported yet: `interpolate` over more than two points, Remotion's
`Easing.bezier`, `elastic`, `bounce` and `back`.

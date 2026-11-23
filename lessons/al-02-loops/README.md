# al-02-loops

Episode 2 of the array languages series
(`docs/array-languages-video-series-plan.md`): from scalar loops to
array operations. A story lesson in the pattern of
[al-01-why](../al-01-why/): a title with music, narrated scenes,
silent slides with music between sections, an exercise, the reused
call to action and close. Music: Sunburst (music-pipe-rs, the author).

| File | What |
| ---- | ---- |
| `lesson.json` | 19 scenes: the title; three kinds of loop; one loop, three jobs; how or what; map; filter with a mask and replicate; reduce (plus, max, min); counting with a mask; Rust iterator chains; three steps composed; next episode; the exercise; call to action; end screen |
| `data.xtl` | every X_eTaL line the video shows, with what the pinned `xetal` prints for it |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt` | the YouTube title |

## Sources

| Scene | Fact | Source |
| ----- | ---- | ------ |
| recap, loop, how-what, map, filter-mask, reduce, rust-chain, compose, exercise | the episode outline, the scalar and array descriptions, the temperature exercise | `docs/research2.txt` (the author's research), Video 02 |
| loop, rust-chain | the Rust loop and the iterator chain both print 60 | compiled with `rustc --edition 2021`, 2026-11-22 |
| map-code, filter-mask, filter-code, reduce, count, compose | `3 * values` is `6 12 18 24`; `values > 5` is `0 0 1 1`; replicate gives `6 8`; plus, max, min reduce to 20, 8, 2; the count is 2; and-reduce of `values > 1` is 1; the composed sum is 60 | `data.xtl`, run at the pin (49c00785) |

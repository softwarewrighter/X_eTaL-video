# al-05-idioms

Episode 5 of the array languages series
(`docs/array-languages-video-series-plan.md`): array idioms, thinking
without loops. A story lesson in the pattern of
[al-04-broadcast](../al-04-broadcast/): a title with music, narrated
scenes, silent slides with music between sections, the next episode,
an exercise, the reused call to action and close. Music: Prelude Pulse
(music-pipe-rs video beds: Bach, the C major Prelude, as downtempo):
the opening cell under the title, one middle phrase (cells at 5, 10,
15 s) under each break, the ending cell under the close.

| File | What |
| ---- | ---- |
| `lesson.json` | the scenes: the title; the recap; the pattern (problem, loop, idiom, trade off); the idioms already met (sum, count matches, reverse, rotate); running totals (scan, max scan); adjacent changes (drop, then subtract or compare); normalize values (an aggregate, then each item; float for the types); count occurrences (unique, an equality table, a reduce, and its cost); four more (positions with where and index of, membership, moving windows with n_wise, sorting by a key with grade and select); the conclusion; the next episode; the exercise; call to action; end screen. Every example notebook style, with the Rust loop it replaces |
| `data.xtl` | every X_eTaL line the video shows, run at the pin; the panels show what `xetal --box` prints for each, made by `lesson.mjs` from the pinned binary, never typed |
| `lesson.mjs` | writes `lesson.json`: the scenes, and each result from `bin/xetal --box` |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |

## Sources

| Scene | Fact | Source |
| ----- | ---- | ------ |
| all | the pattern for each idiom (problem, conventional solution, idiom, picture, trade off); the problems (sum, running totals, count matching, reverse, rotate, adjacent changes, normalize, count occurrences) | `docs/research2.txt` (the author's research), Video 06 |
| conclusion | an idiom captures a recurring pattern; reason about, reuse, test and optimize it apart from the program; express the problem at the most useful level | `docs/research2.txt`, Video 06, the concluding narration (shortened into short sentences) |
| exercise | sum, maximum, running totals, count above three, adjacent differences of 3 1 4 1 5 9 | `docs/research2.txt`, Video 06 |
| break-1 | the four new idioms, as teased at the end of episode 04 | `lessons/al-04-broadcast/` (scene next-idioms) |
| known-sum to count-table | every X_eTaL output shown | `data.xtl`, run at the pin (49c00785) |
| running-scan, running-max | `s_\` is scan: every running reduce, the last the whole reduce | X_eTaL `docs/reference.md` (Reduce, scan, each and table) |
| normalize-types | Int and Float do not mix; `f_loat` makes a Float of an Int | the pinned xetal's own error (`data.xtl`) |
| count-table | `t_able` and `u_nique` | X_eTaL `docs/reference.md` |
| positions-where to sort-grade | `w_here`, `i_ndexOf` (positions from 1), `m_ember?`, `n_wise`, `g_rade` with `s_elect`; four idioms beyond research2, the author asked for more (2026-11-26) | X_eTaL `docs/reference.md` (Search and order; `n_wise`), every output from the pinned xetal |

## Image prompt

For the episode's picture (the blog post, or a thumbnail background),
in a text-to-image tool of the author's choosing:

> A clean, minimal technical illustration on a dark navy background
> (#0d1117). On the left, a tangled loop of thin gray wire, knotted
> like an old for-loop. On the right, the same wire straightened into
> four neat rows of small glowing light-blue cubes, each row a
> different pattern: a staircase that rises step by step, a row of
> short up and down arrows between neighbors, a row of cubes leveled
> around a center line, and a short bar chart of three columns. Soft
> studio lighting, slight isometric angle, crisp edges, flat matte
> materials, generous empty space at the top for a title. No text, no
> letters, no logos, no people. 16:9.

The four rows stand for the four idioms: running totals (the
staircase), adjacent changes (the arrows), normalize (leveled around a
center), count occurrences (the bars). The title goes on top in the
video's own type, not in the generated picture.

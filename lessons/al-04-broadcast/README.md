# al-04-broadcast

Episode 4 of the array languages series
(`docs/array-languages-video-series-plan.md`): broadcasting, what
happens when arrays of different shapes meet. A story lesson in the
pattern of [al-03-shape](../al-03-shape/): a title with music, narrated
scenes, silent slides with music between sections, the next episode,
an exercise, the reused call to action and close. Music: Ode Arcade
(music-pipe-rs video beds: Beethoven, Ode to Joy, as synth-pop): the
opening cell under the title, one middle phrase (cells at 5, 10, 15 s)
under each break, the ending cell under the close.

| File | What |
| ---- | ---- |
| `lesson.json` | the scenes: the title; the recap; scalar extension; the same shape; different shapes, an error; why; saying how (reshape for rows, reshape and transpose for columns, the rank form, table); the languages in one table, then APL, J, BQN, K and NumPy one by one (each default, and how each says the other case; NumPy: a length one axis stretches); the trade off; the next episode; the exercise; call to action; end screen. Every example notebook style: each argument and the result as a box, side by side (a scalar is a bare number) |
| `data.xtl` | every X_eTaL line the video shows, run at the pin; the panels show what `xetal --box` prints for each, made by `lesson.mjs` from the pinned binary, never typed |
| `lesson.mjs` | writes `lesson.json`: the scenes, and each result from `bin/xetal --box` |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |

## Sources

| Scene | Fact | Source |
| ----- | ---- | ------ |
| all | the episode: scalar extension distinguished from NumPy-style broadcasting; scalar plus vector, equal shapes, incompatible shapes; X_eTaL behavior from executable examples; why the simpler policy is more predictable | `docs/research2.txt` (the author's research), Video 05 |
| languages, apl to numpy-stretch | compare with other APL dialects, not only NumPy; notebook style boxes for every argument and result | the author, 2026-11-23 and 2026-11-25 |
| languages, apl to numpy-stretch | each language: the expressions, expected results with sources, local runs, and what the author observed in each REPL | `docs/comparing-languages.md` |
| scalar-vector to table | every X_eTaL output shown | `data.xtl`, run at the pin (49c00785) |
| mismatch | other shapes are an error (`shapes differ: 2 3 and 3`) | X_eTaL `docs/reference.md` (Arithmetic) and `data.xtl` |
| rank-form | `k 'f r_ank x` applies f to each rank-k cell | X_eTaL `docs/reference.md` (`r_ank`) |
| table | `v '+ t_able w`: every pair | X_eTaL `docs/reference.md` (Reduce, scan, each and table) |

# al-01-why

Episode 1 of the array languages series
(`docs/array-languages-video-series-plan.md`): why another
programming language. A story lesson in the pattern of
[tbt-2741](../tbt-2741/): a title with music, narrated scenes,
silent explainer slides with music between sections, an exercise,
the reused call to action and close. Landscape, narrated in the
author's cloned voice (`just voice al-01-why`).

| File | What |
| ---- | ---- |
| `lesson.json` | twenty scenes: the title; one step at a time; the whole computation; a points slide; the Rust loop; mostly mechanism; whole-array operations; two times values; a timeline slide; where array languages came from; one idea, many spellings; why this language; typed and drawn; static types, inferred; the browser editor; a flow slide; what you will learn; the exercise; the call to action; the close |
| `data.xtl` | every X_eTaL line the video shows, with what the pinned `xetal` prints for it |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description |

## Sources

Every fact the narration states, and where it comes from.

| Scene | Fact | Source |
| ----- | ---- | ------ |
| steps, whole, loop, mechanism, transform, learn, exercise | the scalar and array models, the Rust example, the course order, the exercise | `docs/research2.txt` (the user's research), episode 01 |
| loop | the Rust program prints `[2, 4, 6, 8]` | compiled with `rustc --edition 2021`, 2026-11-19 |
| double, spellings, typed-drawn | `2 * values` is `2 4 6 8`; `'+ r_/ 1 2 3 4` is `10` | `data.xtl`, run at the pin |
| spellings | APL `2×1 2 3 4`, J `2*1 2 3 4`, K `2*1 2 3 4` give `2 4 6 8` | GNU APL, jconsole, and the Homebrew `k`, 2026-11-19 |
| spellings | BQN `2×1‿2‿3‿4` | not checked (no BQN installed) |
| history, family | 1962 the notation (Iverson); APL\360 from IBM, 1968, the first you could type at; APL2 (IBM, 1984) added nesting; J (Iverson and Roger Hui, 1990) kept the semantics, moved to ASCII; K (Arthur Whitney) stripped it down; BQN redesigned the glyphs in 2020 | the blog, TBT "APL\360 revisited" (2026-09-17) |
| family | K in 1993 | not in the blog: to confirm |
| family | X_eTaL in 2026 | its first commit, 2026-09-27 (`docs/history.md` at the pin) |
| why | "what would APL look like if it were designed today for composition, readability, tooling, and machine learning?"; "The goal isn't to replace existing languages" | X_eTaL's README at the pin |
| typed-drawn | plain ASCII on a US keyboard; an underlined letter makes a function, a leading superscript names the namespace, a subscript gives the axes, a superscript on a value is an exponent | X_eTaL's README at the pin |
| types | infers every type, no annotation required, refuses a program whose types do not fit before it starts; errors at the line with a fix | the blog, Array Languages #17 (2026-10-23), and its type-error picture |
| types, editor | implemented in Rust; the browser editor (WebAssembly): ASCII on the left, drawn on the right, Run, Notebook, Step | X_eTaL's README at the pin |

The name is shown, never said: the narration says "the language in
this series" or "this language".

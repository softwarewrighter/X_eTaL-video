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
| `lesson.json` | 33 scenes: Why another programming language?; One step at a time; The whole computation; Array programming; The scalar model; Mostly mechanism; Whole-array operations; Two times values; Four values, or a hundred; Reduce, given plus; The array family; Where array languages came from; One idea, many spellings; A special keyboard; Why this language; The name; LaTeX reversed; Typed in ASCII, drawn as notation; Static types, inferred; Borrowed on purpose; A small core, grown on evidence; The browser editor; From keyboard to result; What you will learn; Coming up in the series; Pipelines and equations; Circuits, written as Verilog; On GPUs; 3D models and ray tracing; Fine-tuning; Before the next episode; Call to action; End screen. Code scenes and arrays are panels (code lines with the spoken sentence's in focus; cells taken one at a time or all at once, their values from the pinned xetal). Music: hammond-glide.wav (the author) |
| `data.xtl` | every X_eTaL line the video shows, with what the pinned `xetal` prints for it |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description |

## Sources

Every fact the narration states, and where it comes from.

| Scene | Fact | Source |
| ----- | ---- | ------ |
| steps, whole, loop, mechanism, transform, learn, exercise | the scalar and array models, the Rust example, the course order, the exercise | `docs/research2.txt` (the author's research), episode 01 |
| loop | the Rust program prints `[2, 4, 6, 8]` | compiled with `rustc --edition 2021`, 2026-11-19 |
| double, spellings, typed-drawn | `2 * values` is `2 4 6 8`; `'+ r_/ 1 2 3 4` is `10` | `data.xtl`, run at the pin |
| spellings | APL `2 times 1 2 3 4` (the times sign), J `2*1 2 3 4`, K `2*1 2 3 4` give `2 4 6 8` | GNU APL, jconsole, and the Homebrew `k`, 2026-11-19 |
| spellings | BQN `2 times 1 2 3 4` (the times sign, the strand ligature between numbers; in lesson.json) | not checked (no BQN installed) |
| history, family | 1962 the notation (Iverson); APL\360 from IBM, 1968, the first you could type at; APL2 (IBM, 1984) added nesting; J (Iverson and Roger Hui, 1990) kept the semantics, moved to ASCII; K (Arthur Whitney) stripped it down; BQN redesigned the glyphs in 2020 | the blog, TBT "APL\360 revisited" (2026-09-17) |
| family | K in 1993 | not in the blog: to confirm |
| family | X_eTaL in 2026 | its first commit, 2026-09-27 (`docs/history.md` at the pin) |
| why | "This may be the dawn of Personal Programming Languages, and this is not the first one I've started creating" | the author, 2026-11-19 |
| hundred, reduce | `2 * r_ange 100` is `2 4 ... 200`; `'* r_/ 1 2 3 4` is `24` | `data.xtl`, run at the pin |
| keyboard | APL's symbols on a type element and a marked keyboard; EBCDIC and ASCII had no codes for most of them; J moved to ASCII | the blog, TBT "APL\360 revisited" (2026-09-17); the 2741 picture from TBT #15 |
| the-name, name | eXperimental Extensible Typed Array Language, LaTeX reversed; "LaTeX uses text to produce typography. X_eTaL uses typography to express computation." | X_eTaL's README at the pin |
| borrowed | arrays and right-to-left from APL, the leading axis and the atop from BQN and J, types from Haskell, macros, lints and diagnostics from Rust; each with a refusal (Haskell's types, not its laziness) | the blog, Array Languages #17, and its picture |
| core | changes only when a real program needs it; growth into libraries, macro libraries, extensions; equations, pipelines and integrals are macro libraries | the blog, Array Languages #17, and its picture |
| why | "what would APL look like if it were designed today for composition, readability, tooling, and machine learning?"; "The goal isn't to replace existing languages" | X_eTaL's README at the pin |
| typed-drawn | plain ASCII on a US keyboard; an underlined letter makes a function, a leading superscript names the namespace, a subscript gives the axes, a superscript on a value is an exponent | X_eTaL's README at the pin |
| types | infers every type, no annotation required, refuses a program whose types do not fit before it starts; errors at the line with a fix | the blog, Array Languages #17 (2026-10-23), and its type-error picture |
| types, editor | implemented in Rust; the browser editor (WebAssembly): ASCII on the left, drawn on the right, Run, Notebook, Step | X_eTaL's README at the pin |

| coming-up, tease-ml | a pipeline macro writes a model's data flow left to right, stages with checked shapes; equation macros take a formula as a paper prints it, giving the array computation, its LaTeX, or both | the blog, Array Languages #12 (pipelines) and #11 (equations), and their pictures |
| tease-fpga | programs as circuits written as Verilog; HEX1000, a 4-bit calculator machine specified in X_eTaL, on a Tang Nano 9K, calculating over its USB serial port | the blog, Array Languages #8 (FPGA), and its pictures |
| tease-gpu | a function marked for the GPU with a macro, lowered from its own source; Metal on an M1 Max, an RTX 5060 Ti; the Adreno 702 in an Arduino UNO Q | the blog, Array Languages #7 (GPU), #10 (Mojo and Metal), Rabbit-hole #9 (Adreno 702), and their pictures |
| tease-3d | X_eTaL drives Blender, a scene worked out as arrays; console-3D's models made that way; a ray tracer in ordinary array code on CPU and GPU | the blog, Array Languages #9 (Blender) and #20 (ray tracer); tbt-2741's how-made slide (make-ibm2741.xtl) |
| tease-tune | browser lessons on LoRA, built number by number then trained; a tiny mixture of experts trained in X_eTaL and fine-tuned by six methods | X_eTaL-fine-tuning's README (LoRA lab, LoRA training), X_eTaL-ML's README (MoE fine-tuning), their screenshots |

The name is shown, never said: the narration says "the language in
this series" or "this language".

Two choices the author made, 2026-11-20:

- The spellings scene shows X_eTaL twice, as typed (`2 * 1 2 3 4`,
  an asterisk as in J or K) and as read (drawn with a times sign, as
  in APL): the one place a video shows X_eTaL as typed (CLAUDE.md
  rule 4a), because the difference is the point.
- Pronunciation: BQN and GPU are spelled for the voice ("bee, queue,
  en", "gee, pee, you"); APL, CPU and IBM are said as letters.

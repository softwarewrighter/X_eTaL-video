# Curriculum: showcasing and teaching X_eTaL

Superseded (the author, 2026-11-19): the array languages series,
`docs/array-languages-video-series-plan.md`, replaces this plan. It
is kept as the record of the videos already made and of the ideas
the new series may draw on.

The author (2026-11-18): demos can be short, but X_eTaL needs
tutorials: an overview, flow control, immutability, recursion;
separate videos on macros with many examples; libraries, demos,
games, ML, GPU, FPGA; comparisons with other languages, showing its
strengths and its simplicity and elegance.

Where they go (the author, 2026-11-18): the **softwarewrighter**
channel takes the shorts and the long-form videos about software, so
everything in this repository; **hardwarewrighter** (its own shorts
and long-form, about hardware) takes the FPGA work and becomes the
priority in a couple of weeks (from about 2026-12-02). Until then,
softwarewrighter first. No trailers: a tutorial is not cut into a
short.

This is the plan for that: what the series are, what each video
teaches, the order to make them, and what the renderer needs first.
`docs/plan.md` keeps the sagas that build it.

## Two kinds of video

| Kind | Length, format | Job | Made from |
| ---- | -------------- | --- | --------- |
| Tutorial | 3 to 8 minutes, landscape | teach one part of the language well enough to use it | the pinned `docs/learn-xetal.xtl`, `docs/reference.md`, `docs/literate/`, the idioms |
| Short | 2.5 minutes or less, portrait | show one thing it does beautifully, and send people to the tutorial or the live page | a demo, a game, an ML program, one idiom |

Every tutorial ends by pointing at the live playground and the next
tutorial; every short ends by pointing at its live page and the
tutorial that explains it. One idea a video. Everything on screen is
X_eTaL rendered by the pinned `xetal` (rule 4a), every result is what
the program printed, and every video is narrated in the author's voice.

## The through-line: what makes X_eTaL worth learning

Each video should land one of these, and the series as a whole all of
them:

1. **Syntax you can see.** The decoration says what a name is
   (function or value, yours or a library's), so code reads at a
   glance. Typed in ASCII, drawn decorated.
2. **Whole arrays, no loops.** A neighborhood is nine rotations
   summed; all pairs is one table; a step for every pixel is one
   expression.
3. **Small and regular.** Curried one-argument functions; operators
   are ordinary functions you pass with a quote; right to left, no
   precedence.
4. **Safe by default.** Static types inferred (Hindley-Milner);
   ambiguous code rejected with an explanation; a variable is bound
   once, and a name that changes says so with `!`.
5. **Extensible.** Libraries, macros that write source, notations,
   native extensions, and the same programs on a GPU or as a circuit.

## Series 1: the language (tutorials, landscape)

The core course, in order. Each is one lesson in `lessons/`, made the
same way as the shorts (a lesson is data, scenes follow the
narration).

| # | Slug | Title | Teaches |
| - | ---- | ----- | ------- |
| 1 | `intro-xetal` | X_eTaL: syntax you can see | the overview: the poster, panel by panel (being made) |
| 2 | `t-reading` | Reading X_eTaL | right to left, no precedence, strands, whole arrays at once, decorations in practice |
| 3 | `t-arrays` | Arrays, shapes and axes | shape, range, reshape, indexing, take and drop, axes as subscripts |
| 4 | `t-functions` | Functions and definitions | lambdas, the two arguments, definitions, apply versus pass, the quote |
| 5 | `t-immutability` | Bound once | a variable is bound once in its scope, why, what `!` names are for, `_ :=` for effects, shadowing |
| 6 | `t-operators` | Operators are functions | reduce, scan, each, table, inner product, power, compose, swap |
| 7 | `t-flow` | Flow control without loops | guards with `?`, masks instead of if, power as repetition, `i_f<` and `u_nless<` as macros |
| 8 | `t-recursion` | Recursion | factorial and sign from the tour, tuples and patterns, recursion versus power versus a whole-array form of the same problem |
| 9 | `t-trains` | Trains | atop, fork, hook, tacit style, when a train reads better than a lambda |
| 10 | `t-types` | Types you do not write | inference, what an error says, `Box` and nested arrays, `xetal type` |
| 11 | `t-strings` | Strings, search and order | strings as vectors, split, search, grade and sort |
| 12 | `t-effects` | Effects and the outside world | names ending in `!`, reading and printing, system names, drawing with `[]GRID` and `[]SHOW` |
| 13 | `t-libraries` | Using and writing libraries | `use<`, `l:` and `h:` names, `xetal doc`, `xetal lint`, a small library end to end |

## Series 2: macros (tutorials, landscape, many examples)

Macros are what make X_eTaL extensible; they get their own series,
each video example-heavy, every expansion shown with `xetal expand`.

| # | Slug | Title | Examples |
| - | ---- | ----- | -------- |
| 1 | `m-what` | Source that writes source | the system macros (`i_f<`, `u_nless<`, `w_hen<`), what a macro receives and returns, seeing the expansion |
| 2 | `m-library` | Your own macro library | an `.xtlm` file, `m:` names, a macro from scratch, its test |
| 3 | `m-code` | Code strings and pipelines | `c"..."` code strings, pipeline stages, `x_etal-pipes` |
| 4 | `m-notation` | Notations | a notation a library draws (math boxes), `e_q<` |
| 5 | `m-gallery` | A macro gallery | ten short macros, one idea each (from `Macros.xtlm`, the demos' stencil macros, the idioms) |

## Series 3: X_eTaL versus (comparisons)

Fair, side by side, the same problem in each language, from the pinned
`docs/rosetta.md` and the idioms. Other languages' code is shown as
`code` lines, X_eTaL rendered. The two that matter (the author,
2026-11-18): **APL**, its ancestor, and **Rust**, the systems language
it is written in and the one its audience knows.

| Slug | Kind | Compares |
| ---- | ---- | -------- |
| `vs-apl` | tutorial | APL and X_eTaL: the README's table, glyphs versus decorations, dynamic versus static types, ambiguity rejected |
| `vs-rust` | tutorial | Rust and X_eTaL: the same programs (Life, a histogram, n-body) as loops and as whole arrays; static types in both, inferred in one |
| `vs-loops` | short | a Rust loop next to its whole-array form |
| `vs-idioms` | shorts, a series | one Rosetta idiom each, X_eTaL beside APL and Rust: reverse, mean, histogram, transpose, Life |
| `why-xetal` | tutorial | "why another language": the language checklist, answered |

## Series 4: what people build (shorts, portrait)

| Area | Source | Made | Next candidates |
| ---- | ------ | ---- | --------------- |
| Demos | X_eTaL-demos | life, life-capture, mandelbrot, nbody | julia, langtons-ant, sandpile, reaction-diffusion, wave-tank, fourier-epicycles, image-pipeline, eigencube, ca-lab, stencil-macros, xetal-pipes |
| Games | X_eTaL-games | sudoku (being made) | 2048, minesweeper, lights-out, maze, raycaster, tic-tac-toe, asteroids |
| Machine learning | X_eTaL-ML | attention | micro-gpt, backprop, cnn-digits, k-means, diffusion, lora-explorer, micro-bert |
| Inside models | X_eTaL-circuits, X_eTaL-manifolds, X_eTaL-fine-tuning | none | one each: a circuit found, a manifold drawn, a fine-tune compared |
| Libraries | X_eTaL-libraries, the pinned `lib/` | none | Svg, Turtle, Geometry3D, Stats: a picture each |

## Series 5: beyond the CPU (tutorials, landscape)

| Slug | Source | Shows |
| ---- | ------ | ----- |
| `gpu` | X_eTaL-gpu | the same whole-array program on GPUs, old ones included, with its measured results |
| `extensions` | X_eTaL-extensions | native extensions: what one is, one built and called |

FPGA (X_eTaL-fpga, X_eTaL programs as circuits) belongs to the
hardwarewrighter channel: postponed, the priority from about
2026-12-02.

## The order to make them

1. **Now:** the intro (`intro-xetal`), finishing in the current batch,
   then the core four the author named: `t-immutability`, `t-flow`,
   `t-recursion`, with `t-reading` first so they have a base.
2. **Then:** `m-what` and `m-gallery` (macros, the most distinctive
   thing), and `vs-apl` and `vs-rust` (the two comparisons that
   matter).
3. **Alongside, always:** shorts from Series 4, two or three at a
   time, by parallel agents through the shared VoxCPM lock, so the
   GPU on queenbee always has narration to speak.
4. **Later:** the rest of Series 1 and 2, Series 5, the `vs-idioms`
   shorts. Hardwarewrighter (FPGA) from about 2026-12-02, planned
   then.

## What the renderer needs first

Each is a shared change (remotion/src, the schema), made in its own
step before the videos that use it:

1. **Row and column labels on a board** (asked for by the attention
   lesson): words or indices on the edges.
2. **Side by side code panels** for the comparisons: X_eTaL rendered
   on one side, the other language as code on the other, lines that
   correspond highlighted together.
3. **Annotated code**: callouts anchored to tokens, as `xetal
   diagram` draws the Life line (the pinned `docs/diagrams/`).
4. **A result panel**: an expression, then its printed value appearing
   under it, for the tutorials' many small examples (most tutorial
   scenes are "type this, see that").
5. **Chapters**: a tutorial's scenes grouped into chapters, the
   YouTube description's timestamps written by `just youtube`.
6. **Channel**: `just youtube` notes the channel (softwarewrighter
   for everything here).

## Answered (the author, 2026-11-18)

1. Channels: softwarewrighter (shorts and long-form about software:
   all of this repository) and hardwarewrighter (hardware, FPGA).
2. No trailers.
3. Comparisons: APL and Rust, mainly.
4. Hardwarewrighter has content ready, but postpone it: softwarewrighter
   first; hardwarewrighter the priority from about 2026-12-02.

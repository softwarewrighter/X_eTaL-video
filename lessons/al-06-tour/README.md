# al-06-tour

Episode 6 of the array languages series
(`docs/array-languages-video-series-plan.md`, research2 Video 07): the
array language family, APL, J, K, BQN and X_eTaL, side by side on the
same small problems. A story lesson in the pattern of
[al-05-idioms](../al-05-idioms/). Music: Maple Strut (music-pipe-rs
video beds).

| File | What |
| ---- | ---- |
| `lesson.json` | the scenes: title; recap; the family (research2's narration); not a replacement; running totals, reverse, right to left, and a mean as a train in all five; an explicit and a tacit spread; types (inferred, checked before it runs); the family at a glance; counting from one or zero; one symbol, two meanings; how many built-ins; what each does best; where X_eTaL fits; ASCII as typed and as drawn; next (episode 7: its syntax poster, panel by panel); exercise; call to action; end screen |
| `lesson.mjs` | writes `lesson.json`; every X_eTaL result from the pinned `bin/xetal` |
| `poster.mjs` | the preview pictures: the syntax poster and its panels, into `work/al-06-tour/poster/` |
| `timing.json` | the schedule X_eTaL computes from the lesson |

## Sources and checks

| Scene | Claim or result | Checked with |
| ----- | --------------- | ------------ |
| family | APL: arrays and math as the basic vocabulary; J: ASCII notation and function composition; K: a compact vocabulary; BQN: a modern notation and combinators; X_eTaL: checked types, ASCII with typographic rendering, composition | `docs/research2.txt`, Video 07 (the author's research) |
| not-replacement | X_eTaL is not a direct replacement for any one member | `docs/research2.txt`, Video 07 |
| scan | `+\` (APL, K), `+/\` (J): 3 4 8 9 14 23 | GNU APL 2.0, J 9.7.1, Kona |
| reverse | APL rotate-reverse, J `|.`, K `|`: 9 5 1 4 1 3 | GNU APL 2.0, J 9.7.1, Kona |
| order | `2*3+4` is 14 (right to left, no precedence) | GNU APL 2.0, J 9.7.1, Kona, X_eTaL |
| train | J `(+/ % #)` gives 3.83333 | J 9.7.1 |
| train | the APL train (sum, divide, tally as a fork) gives 3.833333333; GNU APL 2.0 has no trains (SYNTAX ERROR), a Dyalog feature | TryAPL 3.8.1 (Dyalog), run by the author, 2026-11-27 |
| scan, reverse, order, train | BQN lines | CBQN 2bf102f (the blog lab, 2026-11-27), all matching |
| train | K has no trains: a small function instead; ngn/k gives 3.8333, Kona gives 3 (integer `%`) | Kona; ngn/k b9eeb91 (the blog lab) |
| tacit | spread (max minus min) explicit and as a train: J `3 : '(>./y) - <./y'` and `(>./ - <./)` give 8; X_eTaL's lambda and train give 8, both typed `Num a => a -> a` | J 9.7.1, the pinned xetal |
| origin | the first five numbers: APL iota and X_eTaL `r_ange 5` give 1 2 3 4 5; J `i.5`, K `!5`, BQN range give 0 1 2 3 4 | GNU APL 2.0, J 9.7.1, Kona, local CBQN (2026-11-27), the pinned xetal |
| overload | APL rho and J `# al-06-tour

Episode 6 of the array languages series
(`docs/array-languages-video-series-plan.md`, research2 Video 07): the
array language family, APL, J, K, BQN and X_eTaL, side by side on the
same small problems. A story lesson in the pattern of
[al-05-idioms](../al-05-idioms/). Music: Maple Strut (music-pipe-rs
video beds).

| File | What |
| ---- | ---- |
| `lesson.json` | the scenes: title; recap; the family (research2's narration); not a replacement; running totals, reverse, right to left, and a mean as a train in all five; types (inferred, checked before it runs); the family at a glance; ASCII as typed and as drawn; next (episode 7, reading and writing X_eTaL); exercise; call to action; end screen |
| `lesson.mjs` | writes `lesson.json`; every X_eTaL result from the pinned `bin/xetal` |
| `timing.json` | the schedule X_eTaL computes from the lesson |

## Sources and checks

| Scene | Claim or result | Checked with |
| ----- | --------------- | ------------ |
| family | APL: arrays and math as the basic vocabulary; J: ASCII notation and function composition; K: a compact vocabulary; BQN: a modern notation and combinators; X_eTaL: checked types, ASCII with typographic rendering, composition | `docs/research2.txt`, Video 07 (the author's research) |
| not-replacement | X_eTaL is not a direct replacement for any one member | `docs/research2.txt`, Video 07 |
| scan | `+\` (APL, K), `+/\` (J): 3 4 8 9 14 23 | GNU APL 2.0, J 9.7.1, Kona |
| reverse | APL rotate-reverse, J `|.`, K `|`: 9 5 1 4 1 3 | GNU APL 2.0, J 9.7.1, Kona |
| order | `2*3+4` is 14 (right to left, no precedence) | GNU APL 2.0, J 9.7.1, Kona, X_eTaL |
| train | J `(+/ % #)` gives 3.83333 | J 9.7.1 |
| train | the APL train (sum, divide, tally as a fork) gives 3.833333333; GNU APL 2.0 has no trains (SYNTAX ERROR), a Dyalog feature | TryAPL 3.8.1 (Dyalog), run by the author, 2026-11-27 |
| scan, reverse, order, train | BQN lines | CBQN 2bf102f (the blog lab, 2026-11-27), all matching |
| train | K has no trains: a small function instead; ngn/k gives 3.8333, Kona gives 3 (integer `%`) | Kona; ngn/k b9eeb91 (the blog lab) |
: shape with one argument, reshape with two; K `#`: count (3) or take (3 1); BQN shape and reshape are two glyphs (`m` lowercase: a capital is a function in BQN, caught by the blog lab) | GNU APL 2.0, J 9.7.1, Kona, local CBQN (2026-11-27) |
| counts | Dyalog 20: 56 function glyphs, 22 operators; J: 118 spellings in the J Dictionary vocabulary; ngn/k: 22 verbs, 6 adverbs; BQN: 44 functions, 9 one-modifiers and 11 two-modifiers; X_eTaL: 86 built-in functions less 11 higher-order = 75 (13 symbols, 73 words), plus 53 system names | docs.dyalog.com/20.0 (primitive functions by category; primitive operators table); jsoftware.com/help/dictionary/vocabul.htm; codeberg.org/ngn/k repl.k; mlochbaum.github.io/BQN/doc/primitive.html; the pinned work/xetal/docs/reference.md |
| strengths | APL: "Notation as a Tool of Thought" (Iverson, Turing Award lecture, 1979); J: tacit programming (J Dictionary introduction); K: small and fast, kdb+ and q built on k4 (Kona README, ngn/k readme); BQN: fewer and less overloaded primitives than APL and J | jsoftware.com/papers/tot.htm; jsoftware.com/help/dictionary/intro.htm; github.com/kevinlawler/kona; mlochbaum.github.io/BQN/commentary/why.html |
| xetal-fit | typed ASCII, drawn decorated; built-ins mostly words; higher-order functions in place of operators; static types | the pinned reference and lang-choices (TR1-TR4, B9) |
| next | the preview of episode 7: the panels of X_eTaL's syntax poster, named, not explained | ../X_eTaL/pages/poster (lessons/al-06-tour/poster.mjs) |
| types, rendered | `xetal type` prints `u:m_ean : Int -> Float`; a Float argument is a type error; `xetal render` draws `/` as a division sign and `*` as a times sign | the pinned xetal |
| table | static, inferred (Hindley-Milner) typing; trains as `[F G H]` | X_eTaL `README.md`, versus classic APL |

## Confirmed by the author (2026-11-27)

- research2's one-line summary of each language (the family scene).
- "Trains in three of them" (APL in Dyalog, J, BQN; not K, not GNU APL).
- "The four older languages check types as the program runs."

Every other-language line has now been run.

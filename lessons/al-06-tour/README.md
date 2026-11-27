# al-06-tour

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
| train | the APL train: GNU APL 2.0 has no trains (SYNTAX ERROR); a Dyalog feature | to check on tryapl.org |
| scan, reverse, order, train | BQN lines | to check in CBQN (being built) or the online REPL |
| train | K has no trains: a small function instead; Kona's `%` on two integers gives 3, not 3.833 | Kona; ngn/k to check |
| types, rendered | `xetal type` prints `u:m_ean : Int -> Float`; a Float argument is a type error; `xetal render` draws `/` as a division sign and `*` as a times sign | the pinned xetal |
| table | static, inferred (Hindley-Milner) typing; trains as `[F G H]` | X_eTaL `README.md`, versus classic APL |

## For the author to confirm before narration

- research2's one-line summary of each language (the family scene).
- "Trains in three of them" (APL in Dyalog, J, BQN; not K, not GNU APL).
- "The four older languages check types as the program runs."

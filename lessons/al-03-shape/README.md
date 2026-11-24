# al-03-shape

Episode 3 of the array languages series
(`docs/array-languages-video-series-plan.md`): shape, rank, axes and
dimensions. A story lesson in the pattern of
[al-02-loops](../al-02-loops/): a title with music, narrated scenes,
silent slides with music between sections, a preview of the next
episode, an exercise, the reused call to action and close. Music:
Sonata Sprint (music-pipe-rs video beds: Mozart, K. 545, as chamber pop): the opening cell under the title, one middle phrase (cells at 5, 10, 15 s) under each break, the ending cell under the close.

| File | What |
| ---- | ---- |
| `lesson.json` | 35 scenes: the title; the recap; scalar, vector, rank as a function (`u:r_ankOf`), matrix, rank 3; axes; reduce, rotate, reverse and transpose along an axis, the subscript written out; the same on rank 3; ravel back to rank 1; two LeetCode challenges (1672, the richest customer; 1351, count the negatives); tensors in machine learning and on the GPU; the next episode (broadcasting) and its preview; the exercise; call to action; end screen |
| `data.xtl` | every X_eTaL line the video shows, run at the pin; the panels show what `xetal --box` prints for each (APL2 DISPLAY frames), made by `lesson.mjs` from the pinned binary, never typed |
| `lesson.mjs` | writes `lesson.json`: the scenes, and each result from `bin/xetal --box` |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |

## Sources

| Scene | Fact | Source |
| ----- | ---- | ------ |
| scalar, vector, matrix, rank-3, tensors, exercise | the episode outline; the image of shape 480 by 640 by 3 and a batch of 32; video frames as an exercise | `docs/research2.txt` (the author's research), Video 03 |
| reduce-axis, rotate, transpose, rank-3-*, ravel | explicit axis subscripts; rotate and transpose; a rank 3 array; ravel to rank 1; tensors in ML and on GPUs, detail later | the author, 2026-11-23 |
| scalar to ravel, tensors | every output shown | `data.xtl`, run at the pin (49c00785) |
| axes, reduce-axis, rotate, transpose, rank-3-transpose, ravel | a subscript after the name picks the axis; the first axis is the default; `o_\_jk` swaps two axes; `t_ranspose` permutes them | X_eTaL `docs/reference.md` at the pin |
| next, preview-extension | episode 04 is broadcasting (the plan's 05, moved up) | the author, 2026-11-23 |
| preview-extension | a single number extends to every item; other shapes are an error (`shapes differ: 2 3 and 3`) | X_eTaL `docs/reference.md` (Arithmetic) and `data.xtl` |
| preview-dialects | APL: scalar extension and an axis on a scalar function; J and BQN: leading-axis agreement; K: a matrix is a list of rows; NumPy: trailing-axis broadcasting | the languages' documentation; to be checked by the author |
| challenge-wealth | LeetCode 1672, Richest Customer Wealth: the largest row sum, 10 for the example | https://leetcode.com/problems/richest-customer-wealth/ and `data.xtl` |
| challenge-negatives | LeetCode 1351, Count Negative Numbers in a Sorted Matrix: 7 for a 3 by 4 example; solved on code_report (https://youtu.be/pDbDtGn1PXk) | https://leetcode.com/problems/count-negative-numbers-in-a-sorted-matrix/ and `data.xtl` |
| rank-of | `u:r_ankOf := { t_ally s_hape _r }`; 42 has rank 0, `r_avel 42` rank 1; a built-in is planned after this episode | the author, 2026-11-24 (the live editor) and `data.xtl` |

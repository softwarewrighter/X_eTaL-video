# Comparing languages: a vector meets a matrix

Expressions for episode 04 (Broadcasting, `lessons/al-04-broadcast/`),
to try in each language's online REPL. The video narrates only what is
confirmed here. Fill in **Observed** with what the REPL printed (or
"as expected"); the video's panels are updated from this file.

This working doc holds APL and BQN glyphs, so it is not in the gate's
ASCII markdown list (`scripts/gate.sh`; that check keeps README.md
rendering on GitHub). Where glyphs must show in the README, they go in
a `docs/<name>.pdf` or an `images/<diagram>.{png,svg}` shown inline.

## The setup

The same data in every language:

- **M**: a matrix, 2 rows and 3 columns: `1 2 3` / `4 5 6` (shape 2 3)
- a vector of 3 values: `10 20 30` (shape 3), the length of M's last axis
- a vector of 2 values: `100 200` (shape 2), the length of M's first axis

The questions: does the vector of 3 meet each row? Does the vector of
2 meet each row (one value per row, so down the columns)? Which is an
error, and how do you say the other one explicitly?

## Where to try them

| Language | REPL | Notes |
| -------- | ---- | ----- |
| X_eTaL | https://softwarewrighter.github.io/X_eTaL/ | the pinned X_eTaL (49c00785) gives the results below |
| APL | https://tryapl.org | Dyalog APL; index origin `⎕IO` 1 (the default) |
| J | https://jsoftware.github.io/j-playground/bin/html2/ | J playground |
| BQN | https://mlochbaum.github.io/BQN/try.html | the reference implementation |
| K | https://ngn.codeberg.page/k/ | ngn/k; q (kdb+) needs an install |
| NumPy | https://numpy.org (the shell on the front page), or https://jupyter.org/try-jupyter/lab/ | |

**Expected** comes from each language's documentation (sources at the
end). **Local** is what a local interpreter printed on 2026-11-25:
GNU APL, J (jconsole), Kona (a K) and NumPy 2.5.5. Local runs are not
the dialects the video names (Dyalog APL, ngn/k or q), so the
REPLs decide.

## X_eTaL

```
M := 2 3 r_eshape r_ange 6
M + 10 20 30
M + 100 200
M + 2 3 r_eshape 10 20 30
M + o_\ 3 2 r_eshape 100 200
1 '{ _r + 10 20 30 } r_ank M
```

| Expression | Expected | Observed |
| ---------- | -------- | -------- |
| `M + 10 20 30` | error: shapes differ: 2 3 and 3 | (pinned xetal: as expected) |
| `M + 100 200` | error: shapes differ: 2 3 and 2 | (pinned xetal: as expected) |
| `M + 2 3 r_eshape 10 20 30` | 11 22 33 / 14 25 36 (each row) | (pinned xetal: as expected) |
| `M + o_\ 3 2 r_eshape 100 200` | 101 102 103 / 204 205 206 (down the columns) | (pinned xetal: as expected) |
| `1 '{ _r + 10 20 30 } r_ank M` | 11 22 33 / 14 25 36 (rank: each row) | (pinned xetal: as expected) |

## APL (Dyalog, tryapl.org)

```
M←2 3⍴⍳6
M+10 20 30
M+100 200
M+[2]10 20 30
M+[1]100 200
10 20 30(+⍤1)M
100 200(+⍤0 1)M
```

| Expression | Expected | Local (GNU APL) | Observed |
| ---------- | -------- | --------------- | -------- |
| `M+10 20 30` | RANK ERROR | RANK ERROR | |
| `M+100 200` | RANK ERROR | RANK ERROR | |
| `M+[2]10 20 30` | 11 22 33 / 14 25 36 (each row) | 11 22 33 / 14 25 36 | |
| `M+[1]100 200` | 101 102 103 / 204 205 206 (down the columns) | 101 102 103 / 204 205 206 | |
| `10 20 30(+⍤1)M` | 11 22 33 / 14 25 36 (rank: each row) | not run | |
| `100 200(+⍤0 1)M` | 101 102 103 / 204 205 206 (rank: one value per row) | not run | |

Notes: Dyalog says RANK ERROR when the ranks differ (LENGTH ERROR only
for the same rank, different lengths). The axis numbers in `[1]` and
`[2]` assume `⎕IO` 1. APL also extends a one-element array of any rank
(singleton extension); APL2 is stricter.

## J

```
M =: 2 3 $ 1 + i. 6
M + 10 20 30
100 200 + M
10 20 30 +"1 M
```

| Expression | Expected | Local (jconsole) | Observed |
| ---------- | -------- | ---------------- | -------- |
| `M + 10 20 30` | length error | length error (shapes 2 3 and 3 do not conform) | |
| `100 200 + M` | 101 102 103 / 204 205 206 (one value per row) | 101 102 103 / 204 205 206 | |
| `10 20 30 +"1 M` | 11 22 33 / 14 25 36 (rank 1: each row) | 11 22 33 / 14 25 36 | |

## BQN

```
M ← 2‿3⥊1+↕6
M + 10‿20‿30
100‿200 + M
10‿20‿30 +⎉1 M
```

| Expression | Expected | Observed |
| ---------- | -------- | -------- |
| `M + 10‿20‿30` | an error (3 is not a prefix of 2‿3) | |
| `100‿200 + M` | 101 102 103 / 204 205 206 (one value per row) | |
| `10‿20‿30 +⎉1 M` | 11 22 33 / 14 25 36 (rank 1: each row; derived from the docs, no exact example there) | |

No local BQN.

## K (ngn/k)

```
M:(1 2 3;4 5 6)
M+10 20 30
100 200+M
10 20 30+/:M
```

| Expression | Expected | Local (Kona) | Observed |
| ---------- | -------- | ------------ | -------- |
| `M+10 20 30` | length error | length error | |
| `100 200+M` | (101 102 103;204 205 206) (one value per row) | (101 102 103;204 205 206) | |
| `10 20 30+/:M` | (11 22 33;14 25 36) (each right: each row) | (11 22 33;14 25 36) | |

Note: only each right (`/:`) puts a vector on every row; each left
(`\:`) adds each value to the whole matrix (a 2 by 2 by 3 result).

## NumPy

```python
import numpy as np
M = np.array([[1, 2, 3], [4, 5, 6]])
M + np.array([10, 20, 30])
M + np.array([100, 200])
M + np.array([100, 200])[:, np.newaxis]
a = np.array([1, 2, 3])
a[:, np.newaxis] + a
```

| Expression | Expected | Local (NumPy 2.5.5) | Observed |
| ---------- | -------- | ------------------- | -------- |
| `M + np.array([10, 20, 30])` | [[11 22 33] [14 25 36]] (each row) | as expected | |
| `M + np.array([100, 200])` | ValueError: operands could not be broadcast together with shapes (2,3) (2,) | as expected | |
| `M + np.array([100, 200])[:, np.newaxis]` | [[101 102 103] [204 205 206]] (down the columns) | as expected | |
| `a[:, np.newaxis] + a` | a 3 by 3 table, no error | [[2 3 4] [3 4 5] [4 5 6]] | |

The last line is the trade off: a length-one axis stretches, so a
shape that was a mistake can still give an answer.

## Summary

| Language | Rule | M + 10 20 30 | M + 100 200 | Each row, explicitly | One value per row, explicitly |
| -------- | ---- | ------------ | ----------- | -------------------- | ----------------------------- |
| X_eTaL | one value, or the same shape | error | error | `M + 2 3 r_eshape v`, or `r_ank` | `M + o_\ 3 2 r_eshape w` |
| APL | scalar (singleton) extension, else the same shape | RANK ERROR | RANK ERROR | `M+[2]v`, `v(+⍤1)M` | `M+[1]w`, `w(+⍤0 1)M` |
| J | leading axis (prefix) agreement | length error | each row gets one value | `v +"1 M` | the default |
| BQN | leading axis agreement | error | each row gets one value | `v +⎉1 M` | the default |
| K | a matrix is a list of rows | length error | each row gets one value | `v+/:M` (each right) | the default |
| NumPy | broadcasting from the trailing axis; length one stretches | each row | ValueError | the default | `w[:, np.newaxis]` |

## Sources

- APL: https://aplwiki.com/wiki/Scalar_extension ;
  https://docs.dyalog.com/21.0/programming-reference-guide/error-messages/rank-error/ ;
  https://docs.dyalog.com/21.0/language-reference-guide/other-syntax/axis/axis-with-dyadic-operand/ ;
  https://docs.dyalog.com/21.0/language-reference-guide/primitive-operators/rank/
- J and BQN: https://aplwiki.com/wiki/Leading_axis_agreement ;
  https://code.jsoftware.com/wiki/Vocabulary/Agreement ;
  https://mlochbaum.github.io/BQN/doc/arithmetic.html ;
  https://mlochbaum.github.io/BQN/doc/leading.html ;
  https://mlochbaum.github.io/BQN/doc/rank.html
- K: https://code.kx.com/q/basics/conformable/ ;
  https://code.kx.com/q/basics/atomic/ ; https://code.kx.com/q/ref/maps/
- NumPy: https://numpy.org/doc/stable/user/basics.broadcasting.html
- X_eTaL: `work/xetal/docs/reference.md` at the pin (Arithmetic, `r_ank`, `t_able`)

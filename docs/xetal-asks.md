# Asks for X_eTaL

Features this repository needs that X_eTaL does not have yet, and
bugs it uncovered. This repository does not change X_eTaL: each ask
is filed here (and taken to `../X_eTaL`), the library or lesson uses
the workaround noted below or waits, and the workaround is removed
when the ask lands in the pinned release (`XETAL_COMMIT`, now X_eTaL
abdd371, pinned 2026-11-12, the commit X_eTaL-libraries pins).

Each entry: status (open, filed, landed, dropped), kind (feature, bug
or speed), where it is needed, why, a minimal repro or example, and
the workaround in use. The last section lists language properties
this work lives with that are not asks.

| Status | Kind | Ask | Needed by | Workaround |
| ------ | ---- | --- | --------- | ---------- |
| open | feature | A reduce along the last axis whatever the rank: `'+ r_/_2 x` is `error[axis]` when `x` is a vector, so a function written for a vector of frames (a matrix of comparisons, reduced along axis 2) fails for one frame (`'+ r_/_2 5 '>= t_able 90 240 300`: axis 2 does not exist in an argument of rank 1) | Timeline (`l:s_cene`: one frame or many) | `e_ach` over the frames, each reduced as a vector |

## Not asks

Properties of the language this work lives with:

- Int and Float do not mix (`error[type-mismatch]`): a function that
  takes seconds or a frame rate as either converts with `f_loat`.
- There is no rounding built-in; to the nearest, a half up, is
  `f_loor 0.5 + x`.

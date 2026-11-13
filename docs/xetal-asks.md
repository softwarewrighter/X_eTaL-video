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
| (none yet) | | | | |

## Not asks

Properties of the language this work lives with:

- Int and Float do not mix (`error[type-mismatch]`): a function that
  takes seconds or a frame rate as either converts with `f_loat`.
- There is no rounding built-in; to the nearest, a half up, is
  `f_loor 0.5 + x`.

# X_eTaL-video tasks. Recipes call scripts/*.sh, which hold the logic
# and work without just too. `just` alone lists the recipes.

set positional-arguments

# List the recipes
default:
    @just --list

# Get and build xetal at the known-good commit in XETAL_COMMIT (clone in work/xetal, binary bin/xetal)
xetal:
    @scripts/xetal.sh

# The pinned X_eTaL: XETAL_COMMIT and the binary's version
xetal-version:
    @cat XETAL_COMMIT
    @bin/xetal --version

# Check the pinned X_eTaL: it builds, answers and reports its commit
check-xetal:
    scripts/check-xetal.sh

# Evaluate an expression with the pinned xetal, the libraries on the path: just eval "'+ r_/ 1 2 3"
eval expr:
    @scripts/xt eval -e "$1"

# The libraries
libs:
    @ls libs

# XETAL_PATH with every library on it (for your own shell)
path:
    @for d in "$PWD"/libs/*/src; do printf '%s:' "$d"; done | sed 's/:$//'; echo

# Run a library's test programs (or one): just run Timeline basics
run name test="":
    @cd "libs/$1/tests" && for f in ${2:+"$2.xtl"} $([ -n "${2:-}" ] || ls *.xtl); do echo "== $f"; ../../../scripts/xt run "$f"; done

# The inferred type of every export of a library: just types Timeline
types name:
    @cd "libs/$1/tests" && ../../../scripts/xt type "../src/$1.xtl"

# Test every library: lint, reg-rs baselines
test:
    scripts/test-libs.sh

# Test one library: just test-lib Timeline
test-lib name:
    scripts/test-libs.sh "$1"

# Accept a library's current output as its baselines, creating missing ones (review the diff!)
bless name:
    XETAL_BLESS=1 scripts/test-libs.sh "$1"

# The full pre-commit gate: pinned X_eTaL, libraries, spelling, ASCII-only markdown
gate:
    scripts/gate.sh

# Show the agentrail saga state and the current step
status:
    agentrail status

# Open the plan
plan:
    @cat docs/plan.md

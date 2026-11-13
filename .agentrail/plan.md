# foundation

Saga 1 of X_eTaL-video (docs/plan.md): the process, the pinned
X_eTaL, the gate, and the first X_eTaL libraries for video timing and
animation, tested. Remotion is not installed in this saga.

Every step: `just gate`, docs and CHANGES.md updated, a detailed
commit to main including .agentrail/, `agentrail complete`, push.

## Steps

1. scaffold -- CLAUDE.md and AGENTS.md, COPYRIGHT, LICENSE, README,
   CHANGES.md, .gitignore, justfile, scripts/xetal.sh, scripts/gate.sh,
   docs/plan.md, docs/xetal-asks.md, docs/remotion-scripts.md.
2. timeline-lib -- libs/Timeline (frames, seconds, scene starts, the
   scene at a frame, progress) with reg-rs baselines;
   scripts/test-libs.sh in the gate.
3. ease-lib -- libs/Ease (clamp, interpolate, easing curves).
4. spring-lib -- libs/Spring (a damped spring per frame, its settle
   time).
5. lesson-schema -- schemas/lesson.schema.json, a checker with no
   dependencies to install, lessons/timeline/lesson.json.

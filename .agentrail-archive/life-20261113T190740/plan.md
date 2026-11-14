# life

Saga 2 of X_eTaL-video (docs/plan.md, "lessons from the live
demos"): the first lesson about a live demo, Conway's Life
(X_eTaL-demos life-microscope), made both ways the plan's V8 names so
the user can pick: drawn from X_eTaL's own output by a Remotion
component, and recorded from the published page.

Every step: `just gate`, docs and CHANGES.md updated, a detailed
commit to main including .agentrail/, `agentrail complete`, push.

## Steps

1. housekeeping -- docs/research.txt trimmed and tracked (the user:
   trim), Remotion's agent skills installed (lock tracked, the skills
   themselves ignored), the foundation saga archived.
2. life-drawn -- lessons/life: X_eTaL runs Life and prints every
   generation and its neighbor counts; a `board` scene kind draws
   them in Remotion (and in the draft renderer), stepping by the
   schedule X_eTaL computed.
3. life-capture -- Playwright records the published life-microscope
   page at both sizes; a `capture` scene kind plays the recording in
   the same lesson.
4. compare -- both versions rendered in both formats; what each costs
   and shows, for the user to choose.

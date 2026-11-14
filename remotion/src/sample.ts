import { LessonProps } from "./types";

// What Studio shows when no --props are given: one scene of one
// second. A real lesson comes from scripts/props.sh (just studio SLUG).
const n = 30;
const ramp = Array.from({ length: n }, (_, i) => i / n);
export const sample: LessonProps = {
  lesson: {
    slug: "sample",
    title: "No lesson given",
    fps: 30,
    scenes: [
      {
        id: "sample",
        seconds: 1,
        heading: "Give a lesson with --props",
        lines: ["just studio making-of", { code: "scripts/props.sh making-of" }],
      },
    ],
  },
  timing: { fps: 30, durations: [n], starts: [0], ends: [n], total: n },
  frames: {
    scene: ramp.map(() => 1),
    local: ramp.map((_, i) => i),
    progress: ramp,
    fade: ramp.map(() => 1),
    linear: ramp,
    inOut: ramp,
    out: ramp,
    step: ramp.map(() => 0),
    stepT: ramp.map(() => 1),
    capture: ramp.map((_, i) => i),
    stagger: ramp.map(() => [1, 1]),
  },
  data: {},
  captures: null,
};

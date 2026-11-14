// What scripts/props.sh writes: a lesson (lessons/SLUG/lesson.json),
// its schedule, and every frame's animation numbers, all computed by
// X_eTaL (libs/Timeline, libs/Ease). Arrays under `frames` have one
// entry per frame of the video.
export type Line = string | { code: string };

export type Board = {
  data: string; // an array's name in the lesson's data.xtl
  label?: string;
  numbers?: boolean;
  animate?: boolean;
};

export type Scene = {
  id: string;
  seconds: number;
  heading: string;
  lines: Line[];
  curves?: boolean;
  boards?: Board[];
  narration?: string;
};

export type Lesson = {
  slug: string;
  title: string;
  fps: number;
  stepFrames?: number;
  demo?: { repo: string; slug: string };
  scenes: Scene[];
};

export type Timing = {
  fps: number;
  durations: number[];
  starts: number[];
  ends: number[];
  total: number;
};

export type Frames = {
  scene: number[]; // from 1
  local: number[];
  progress: number[];
  fade: number[];
  linear: number[];
  inOut: number[];
  out: number[];
  step: number[]; // for boards that step: which step, from 0
  stepT: number[]; // and how far the change into it has gone
  stagger: number[][]; // a row a frame, a column a line
};

export type LessonProps = {
  lesson: Lesson;
  timing: Timing;
  frames: Frames;
  data: Record<string, number[][][]>; // the lesson's arrays, each a list of boards
};

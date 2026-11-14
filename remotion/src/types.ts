// What scripts/props.sh writes: a lesson (lessons/SLUG/lesson.json),
// its schedule, and every frame's animation numbers, all computed by
// X_eTaL (libs/Timeline, libs/Ease). Arrays under `frames` have one
// entry per frame of the video.
export type Line = string | { code: string };

export type Scene = {
  id: string;
  seconds: number;
  heading: string;
  lines: Line[];
  curves?: boolean;
};

export type Lesson = {
  slug: string;
  title: string;
  fps: number;
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
  stagger: number[][]; // a row a frame, a column a line
};

export type LessonProps = {
  lesson: Lesson;
  timing: Timing;
  frames: Frames;
};

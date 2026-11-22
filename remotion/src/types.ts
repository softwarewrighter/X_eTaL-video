// What scripts/props.sh writes: a lesson (lessons/SLUG/lesson.json),
// its schedule, and every frame's animation numbers, all computed by
// X_eTaL (libs/Timeline, libs/Ease). Arrays under `frames` have one
// entry per frame of the video.
// Text; X_eTaL (shown as the pinned xetal renders it); other code.
export type Line = string | { xtl: string } | { code: string };

export type Board = {
  data: string; // an array's name in the lesson's data.xtl
  label?: string;
  numbers?: boolean;
  heat?: "ramp" | "escape";
  points?: boolean;
  animate?: boolean;
};

export type Scene = {
  id: string;
  seconds: number;
  heading: string;
  lines: Line[];
  curves?: boolean;
  boards?: Board[];
  capture?: { url?: string; actions?: unknown[] }; // show the recording of the demo's page
  images?: string[];
  clip?: string;
  mute?: boolean;
  slide?: { type: "points" | "timeline" | "flow" | "table"; steps?: number[]; items: { text: string; sub?: string; year?: string; mark?: boolean; xtl?: string; code?: string; not?: string }[] };
  panel?: Panel;
  transcript?: { start: number; end: number; text: string }[];
  narration?: string;
};

// A story's panel (remotion/src/Panel.tsx): code lines, or an array's cells.
export type PanelLine = ({ xtl: string } | { code: string }) & { label?: string };
export type Panel = {
  type: "code" | "cells";
  lines?: PanelLine[];
  focus?: number[][];
  from?: string;
  to?: string;
  op?: string;
  mode?: "loop" | "whole";
};

export type Lesson = {
  slug: string;
  title: string;
  fps: number;
  summary?: string;
  order?: number;
  poster?: number;
  stepFrames?: number;
  demo?: { repo: string; slug: string } | { url: string; start?: string; ready?: string };
  kind?: "lesson" | "story";
  brand?: string;
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
  capture: number[]; // the frame of the page's recording this frame shows
  stagger: number[][]; // a row a frame, a column a line
  sweep: number[][]; // a row a frame, a column a cell of a loop panel
};

export type LessonProps = {
  lesson: Lesson;
  timing: Timing;
  frames: Frames;
  data: Record<string, number[][][]>; // the lesson's arrays, each a list of boards
  captures: { landscape: string; portrait: string } | null; // recordings, under public/
  rendered: Record<string, string>; // each X_eTaL line as `xetal render --html` gives it
  voice?: Record<string, string>; // a narrated scene's audio, under public/, by scene id
};

// A story (lesson.kind "story", remotion/src/Story.tsx): what
// scripts/props.mjs adds, every frame number from X_eTaL's schedule.
export type StoryScene = {
  images?: string[]; // under public/
  cuts?: number[]; // the scene's frames where pictures 2, 3, ... start (their sentences)
  clip?: string; // a reused segment, video and audio, under public/
  from?: string[]; // a cells panel's values, as the pinned xetal printed them
  to?: string[];
  focusCuts?: number[]; // the scene's frames where focus 2, 3, ... start (their sentences)
};
export type StoryRun = {
  first: number; // the run's scenes, by index
  end: number;
  from: number; // the frame its recording starts
  frames: number;
  video: string;
  sound: string | null; // the page's own sound, mixed (scripts/capture.mjs)
};
export type StoryMusic = { src: string; from: number; frames: number };
export type StoryProps = LessonProps & {
  story: { scenes: StoryScene[]; runs: StoryRun[]; music: { intro: StoryMusic; outro: StoryMusic; slides: StoryMusic[] } | null };
};

import { CalculateMetadataFunction, Composition } from "remotion";
import { Lesson } from "./Lesson";
import { Story } from "./Story";
import { LessonProps } from "./types";
import { sample } from "./sample";

// The video's length and frame rate are the lesson's, as X_eTaL
// scheduled it; nothing here knows a lesson.
const calculateMetadata: CalculateMetadataFunction<LessonProps> = ({ props }) => ({
  fps: props.timing.fps,
  durationInFrames: props.timing.total,
});

// The only place sizes are named: every lesson renders in both. A
// lesson draws with Lesson, a story (kind "story") with Story.
const sizes = {
  Landscape: [1920, 1080],
  Portrait: [1080, 1920],
} as const;
const kinds = { Lesson, Story } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {Object.entries(kinds).flatMap(([kind, component]) => Object.entries(sizes).map(([size, [width, height]]) => (
        <Composition
          key={kind + size}
          id={kind + size}
          component={component as unknown as React.FC<LessonProps>}
          width={width}
          height={height}
          fps={30}
          durationInFrames={30}
          defaultProps={sample}
          calculateMetadata={calculateMetadata}
        />
      )))}
    </>
  );
};

import { CalculateMetadataFunction, Composition } from "remotion";
import { Lesson } from "./Lesson";
import { sample } from "./sample";
import { LessonProps } from "./types";

// The video's length and frame rate are the lesson's, as X_eTaL
// scheduled it; nothing here knows a lesson.
const calculateMetadata: CalculateMetadataFunction<LessonProps> = ({ props }) => ({
  fps: props.timing.fps,
  durationInFrames: props.timing.total,
});

// The only place sizes are named: every lesson renders in both.
const sizes = {
  LessonLandscape: [1920, 1080],
  LessonPortrait: [1080, 1920],
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {Object.entries(sizes).map(([id, [width, height]]) => (
        <Composition
          key={id}
          id={id}
          component={Lesson}
          width={width}
          height={height}
          fps={30}
          durationInFrames={30}
          defaultProps={sample}
          calculateMetadata={calculateMetadata}
        />
      ))}
    </>
  );
};

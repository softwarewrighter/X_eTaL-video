import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { Slide } from "./Slide";
import { Panel } from "./Panel";
import { StoryProps } from "./types";

// A story (lesson.kind "story"): a video that is not a lesson on
// X_eTaL, made the way the author's earlier videos were (video-publishing:
// a title with music, narrated segments over pictures and screen
// recordings, the reused closing call to action, a close with music),
// with Remotion in place of hand-made slides. As in Lesson.tsx, nothing
// here computes timing: every number a frame uses is X_eTaL's schedule
// (props.frames, props.timing) or placed by it (props.story, from
// scripts/props.mjs).

// How loud the page's own sound (key strikes, recorded with it) plays
// under the narration, against the page's own level (its returns peak
// near half of full scale): quieter than the voice, never clipping.
const PAGE_SOUND = 0.6;

export const Story: React.FC<StoryProps> = ({ lesson, timing, frames, voice, story, rendered }) => {
  const frame = Math.min(useCurrentFrame(), timing.total - 1);
  const { width, height } = useVideoConfig();
  const tall = height > width;
  const s = frames.scene[frame] - 1;
  const scene = lesson.scenes[s];
  const media = story.scenes[s];
  const show = frames.fade[frame];
  const local = frames.local[frame];
  const run = story.runs.find((r) => s >= r.first && s <= r.end);
  const title = s === 0;
  const blank = !media.images && !scene.capture && !scene.clip && !scene.slide && !scene.panel && !scene.narration && scene.lines.length === 0;

  // The picture showing: one a sentence (cuts), the last staying.
  const picture = media.images ? media.images[(media.cuts ?? []).filter((c) => local >= c).length] ?? media.images[media.images.length - 1] : null;

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* Sound: the narration over its scene, the page's own sound under its recording,
          the music at the start and the end. */}
      {lesson.scenes.map((sc, i) =>
        voice?.[sc.id] ? (
          <Sequence key={sc.id} from={timing.starts[i]} durationInFrames={timing.durations[i]} layout="none">
            <Audio src={staticFile(voice[sc.id])} />
          </Sequence>
        ) : null,
      )}
      {story.runs.map((r, k) =>
        r.sound ? (
          <Sequence key={`sound-${k}`} from={r.from} durationInFrames={r.frames} layout="none">
            <Audio src={staticFile(r.sound)} volume={PAGE_SOUND} />
          </Sequence>
        ) : null,
      )}
      {story.music
        ? [story.music.intro, ...story.music.slides, story.music.outro].map((m) => (
            <Sequence key={m.src} from={m.from} durationInFrames={m.frames} layout="none">
              <Audio src={staticFile(m.src)} />
            </Sequence>
          ))
        : null}

      {/* A picture, contained, over a blurred, darkened copy of itself that fills the
          frame; it drifts closer over the scene by X_eTaL's linear progress. */}
      {picture ? (
        <AbsoluteFill>
          <Img src={staticFile(picture)} style={{ position: "absolute", inset: -80, width: width + 160, height: height + 160, objectFit: "cover", filter: "blur(40px) brightness(0.35)" }} />
          <Img
            src={staticFile(picture)}
            style={{
              position: "absolute",
              inset: title ? 0 : tall ? "120px 40px 420px 40px" : "40px 120px 200px 120px",
              width: title ? width : tall ? width - 80 : width - 240,
              height: title ? height : tall ? height - 540 : height - 240,
              objectFit: "contain",
              opacity: title ? 0.28 : 1,
              transform: `scale(${1 + 0.05 * frames.linear[frame]})`,
            }}
          />
        </AbsoluteFill>
      ) : null}

      {/* The page's recording, full frame, for the scenes of its run. Which frame of it
          shows: the recording starts where its first scene does. */}
      {run ? (
        <Sequence from={run.from} durationInFrames={run.frames} layout="none">
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(run.video)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
        </Sequence>
      ) : null}

      {/* The reused closing segment, its own video and audio as they are. */}
      {scene.clip ? (
        media.clip ? (
          <Sequence from={timing.starts[s]} durationInFrames={timing.durations[s]} layout="none">
            <AbsoluteFill>
              <OffthreadVideo src={staticFile(media.clip)} muted={scene.mute} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </AbsoluteFill>
          </Sequence>
        ) : (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: theme.text, color: theme.dim, fontSize: 44 }}>
            <div>The reused closing segment goes here</div>
            <div style={{ fontFamily: theme.mono, fontSize: 30, marginTop: 20 }}>{scene.clip}</div>
          </AbsoluteFill>
        )
      ) : null}

      {/* The title card. */}
      {title ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: show, fontFamily: theme.text, textAlign: "center" }}>
          {lesson.brand ? <div style={{ color: theme.accent, fontSize: tall ? 44 : 40, fontWeight: 700, letterSpacing: 2, marginBottom: 26 }}>{lesson.brand}</div> : null}
          <div style={{ color: theme.ink, fontSize: tall ? 84 : 104, fontWeight: 700, lineHeight: 1.1, maxWidth: width - 160 }}>{scene.heading}</div>
          <div style={{ width: 160 * show, height: 6, borderRadius: 3, background: theme.accent, margin: "34px 0" }} />
          {scene.lines.map((l, j) => (
            <div key={j} style={{ color: theme.dim, fontSize: tall ? 40 : 42, lineHeight: 1.5 }}>
              {typeof l === "string" ? l : "code" in l ? l.code : l.xtl}
            </div>
          ))}
        </AbsoluteFill>
      ) : null}

      {/* An explainer slide: its items revealed by X_eTaL's stagger, the line
          (timeline) drawn by its out-cubic progress over the scene. */}
      {scene.slide ? (
        <Slide
          slide={scene.slide}
          heading={scene.heading}
          brand={lesson.brand}
          show={show}
          reveal={
            scene.slide.steps
              ? // A slide shown a sentence at a time: the items its sentence has reached.
                scene.slide.items.map((_, j) => (j < scene.slide!.steps![Math.min((media.focusCuts ?? []).filter((c) => local >= c).length, scene.slide!.steps!.length - 1)] ? 1 : 0))
              : frames.stagger[frame]
          }
          progress={frames.out[frame]}
          rendered={rendered}
        />
      ) : null}

      {/* A panel: code lines with the spoken sentence's in focus, or an array's
          cells transformed one at a time or all at once (remotion/src/Panel.tsx). */}
      {scene.panel ? (
        <Panel
          panel={scene.panel}
          media={media}
          heading={scene.heading}
          brand={lesson.brand}
          show={show}
          local={local}
          reveal={frames.stagger[frame]}
          sweep={frames.sweep[frame]}
          progress={frames.out[frame]}
          rendered={rendered}
        />
      ) : null}

      {/* The heading, in the lower third, with the scene's lines (links) under it. */}
      {!title && !blank && !scene.clip && !scene.slide && !scene.panel ? (
        <div
          style={{
            position: "absolute",
            left: tall ? 40 : 80,
            right: tall ? 40 : undefined,
            bottom: tall ? 140 : 56,
            maxWidth: tall ? undefined : width - 160,
            background: "rgba(13, 17, 23, 0.86)",
            borderLeft: `8px solid ${theme.accent}`,
            borderRadius: 6,
            padding: "18px 34px 20px 28px",
            opacity: show,
            transform: `translateX(${-40 * (1 - show)}px)`,
            fontFamily: theme.text,
          }}
        >
          {lesson.brand ? <div style={{ color: theme.accent, fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>{lesson.brand}</div> : null}
          <div style={{ color: theme.ink, fontSize: tall ? 50 : 54, fontWeight: 700, whiteSpace: tall ? "normal" : "nowrap" }}>{scene.heading}</div>
          {scene.lines.map((l, j) => (
            <div key={j} style={{ color: theme.code, fontFamily: theme.mono, fontSize: tall ? 28 : 32, marginTop: 8 }}>
              {typeof l === "string" ? l : "code" in l ? l.code : l.xtl}
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

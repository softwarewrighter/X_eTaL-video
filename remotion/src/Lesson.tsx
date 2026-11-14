import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Boards } from "./Boards";
import { theme } from "./theme";
import { LessonProps, Line } from "./types";

// One lesson, any size. This component decides where things go; when,
// and how far along, every animation is was computed by X_eTaL for
// every frame at once (props.frames), so there is no interpolate() or
// spring() here: a frame looks its numbers up.
export const Lesson: React.FC<LessonProps> = ({ lesson, timing, frames, data }) => {
  const frame = Math.min(useCurrentFrame(), timing.total - 1);
  const { width, height } = useVideoConfig();
  const tall = height > width;
  const margin = tall ? 70 : 100;
  const wide = width - 2 * margin;

  const s = frames.scene[frame] - 1;
  const scene = lesson.scenes[s];
  const show = frames.fade[frame];
  const progress = frames.progress[frame];

  // A line's {{name}}s are the frame's own numbers.
  const fill = (text: string, pad: boolean) =>
    text
      .split("{{secs}}").join(lesson.scenes.map((x) => x.seconds).join(" "))
      .split("{{durs}}").join(timing.durations.join(" "))
      .split("{{starts}}").join(timing.starts.join(" "))
      .split("{{total}}").join(String(timing.total))
      .split("{{f}}").join(String(frame).padStart(pad ? 4 : 0))
      .split("{{step}}").join(String(frames.step[frame]).padStart(pad ? 2 : 0))
      .split("{{scene}}").join(String(frames.scene[frame]))
      .split("{{local}}").join(String(frames.local[frame]).padStart(pad ? 3 : 0))
      .split("{{progress}}").join(progress.toFixed(3));

  const headingSize = Math.min(tall ? 64 : 72, wide / (0.56 * scene.heading.length));

  const renderLine = (line: Line, j: number) => {
    const t = frames.stagger[frame][j] ?? 1;
    const style = { opacity: t * show, transform: `translateX(${30 * (1 - t)}px)` };
    const before = j > 0 ? scene.lines[j - 1] : null;
    if (typeof line === "string") {
      return (
        <div
          key={j}
          style={{
            ...style,
            fontFamily: theme.text,
            fontSize: tall ? 40 : 42,
            lineHeight: 1.5,
            color: theme.ink,
            marginTop: before !== null && typeof before !== "string" ? 22 : 0,
          }}
        >
          {fill(line, false)}
        </div>
      );
    }
    const code = fill(line.code, true);
    return (
      <div
        key={j}
        style={{
          ...style,
          fontFamily: theme.mono,
          fontSize: Math.min(tall ? 34 : 38, (wide - 56) / (0.605 * code.length)),
          height: 66,
          lineHeight: "66px",
          whiteSpace: "pre",
          color: code.startsWith("#") ? theme.dim : theme.code,
          background: theme.panel,
          borderLeft: `6px solid ${theme.accent}`,
          paddingLeft: 24,
          marginTop: typeof before === "string" ? 14 : 0,
        }}
      >
        {code}
      </div>
    );
  };

  const curves: [string, number][] = [
    ["linear", frames.linear[frame]],
    ["in-out cubic", frames.inOut[frame]],
    ["out cubic", frames.out[frame]],
  ];

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* The top line. */}
      <div
        style={{
          position: "absolute",
          left: margin,
          top: tall ? 78 : 48,
          fontSize: 30,
          fontFamily: theme.text,
          display: "flex",
          gap: 36,
        }}
      >
        <span style={{ color: theme.accent, fontWeight: 700 }}>X_eTaL-video</span>
        <span style={{ color: theme.dim }}>{lesson.title}</span>
      </div>

      {/* The scene: heading, then its lines, each with its own column of the stagger table. */}
      <div
        style={{
          position: "absolute",
          left: margin,
          width: wide,
          top: tall ? 260 : 150,
          height: height - (tall ? 190 : 130) - 52 - 36 - (tall ? 260 : 150),
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: theme.text,
            fontWeight: 700,
            fontSize: headingSize,
            color: theme.ink,
            opacity: show,
            transform: `translateX(${-40 * (1 - show)}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.heading}
        </div>
        <div
          style={{
            width: 120 * show,
            height: 6,
            borderRadius: 3,
            background: theme.accent,
            opacity: show,
            marginTop: 14,
            marginBottom: tall ? 70 : 44,
          }}
        />
        {scene.lines.map(renderLine)}

        {/* The scene's arrays, drawn in the room the lines leave. */}
        {scene.boards ? (
          <div style={{ flex: 1, minHeight: 0, marginTop: 36 }}>
            <Boards boards={scene.boards} data={data} step={frames.step[frame]} stepT={frames.stepT[frame]} opacity={show} />
          </div>
        ) : null}

        {/* Three curves over the scene: a dot each, placed by X_eTaL's numbers. */}
        {scene.curves ? (
          <div style={{ marginTop: 50, opacity: show }}>
            {curves.map(([name, value]) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  flexDirection: tall ? "column" : "row",
                  alignItems: tall ? "stretch" : "center",
                  marginBottom: tall ? 34 : 30,
                }}
              >
                <div
                  style={{
                    width: tall ? undefined : 260,
                    fontFamily: theme.mono,
                    fontSize: 26,
                    color: theme.dim,
                    marginBottom: tall ? 22 : 0,
                  }}
                >
                  {name}
                </div>
                <div style={{ position: "relative", flex: 1, height: 4, borderRadius: 2, background: theme.rule, marginRight: 20 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${value * 100}%`,
                      top: -14,
                      width: 32,
                      height: 32,
                      marginLeft: -16,
                      borderRadius: 16,
                      background: theme.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* The schedule, drawn: a segment a scene, and where this frame is. */}
      <div style={{ position: "absolute", left: margin, width: wide, top: height - (tall ? 190 : 130) - 52 }}>
        <div style={{ fontFamily: theme.mono, fontSize: tall ? 24 : 26, color: theme.dim, whiteSpace: "pre", height: 52 }}>
          {`frame ${String(frame).padStart(4, "0")} / ${timing.total}   scene ${s + 1} of ${timing.durations.length}   progress ${progress.toFixed(3)}`}
        </div>
        <div style={{ position: "relative", height: 60 }}>
          {timing.durations.map((d, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: (timing.starts[k] / timing.total) * wide,
                width: (d / timing.total) * wide - 6,
              }}
            >
              <div
                style={{
                  height: 18,
                  borderRadius: 4,
                  background: k === s ? theme.accent : k < s ? theme.accentDim : theme.rule,
                }}
              />
              <div
                style={{
                  fontFamily: theme.mono,
                  fontSize: 18,
                  marginTop: 14,
                  color: k === s ? theme.ink : theme.dim,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {lesson.scenes[k].id}
              </div>
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: (frame / timing.total) * wide - 2,
              top: -10,
              width: 4,
              height: 38,
              borderRadius: 2,
              background: theme.hot,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

import { AbsoluteFill } from "remotion";
import { theme } from "./theme";
import { Scene } from "./types";

// An explainer slide in a story (remotion/src/Story.tsx): a heading and
// its items as cards, as a timeline, or as a flow of boxes. How far each
// item has come in is X_eTaL's stagger for this frame (reveal[j], 0 to
// 1); nothing here computes timing.
type SlideData = NonNullable<Scene["slide"]>;
type Props = {
  slide: SlideData;
  heading: string;
  brand?: string;
  show: number;
  reveal: number[];
  progress: number;
  rendered: Record<string, string>;
};

const glow = "rgba(88, 166, 255, 0.18)";
// X_eTaL's colors for rendered source (as Lesson.tsx).
const syntaxCss = Object.entries(theme.syntax).map(([c, color]) => `.xtl .${c} { color: ${color}; }`).join("\n");

export const Slide: React.FC<Props> = ({ slide, heading, brand, show, reveal, progress, rendered }) => {
  const r = (j: number) => reveal[j] ?? 1;
  const enter = (j: number) => ({ opacity: r(j) * show, transform: `translateY(${36 * (1 - r(j))}px)` });
  const code = (it: SlideData["items"][number]) =>
    it.xtl !== undefined ? (
      <div className="xtl" style={{ fontFamily: theme.mono, fontSize: 26, color: theme.xtl, background: theme.bg, borderRadius: 8, padding: "10px 14px", marginTop: 14, whiteSpace: "pre" }} dangerouslySetInnerHTML={{ __html: rendered[it.xtl] ?? it.xtl }} />
    ) : it.code !== undefined ? (
      <div style={{ fontFamily: theme.mono, fontSize: 30, color: theme.code, marginTop: 10, whiteSpace: "pre" }}>{it.code}</div>
    ) : null;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 20% 0%, #1b2a44 0%, ${theme.bg} 60%)`,
        fontFamily: theme.text,
      }}
    >
      <style>{syntaxCss}</style>
      {/* A faint grid, as on drafting paper. */}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(139,148,158,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,148,158,0.07) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: show,
        }}
      />
      <div style={{ position: "absolute", left: 120, top: 90, right: 120, opacity: show }}>
        {brand ? <div style={{ color: theme.accent, fontSize: 28, fontWeight: 700, letterSpacing: 1.5 }}>{brand}</div> : null}
        <div style={{ color: theme.ink, fontSize: 76, fontWeight: 700, marginTop: 6, transform: `translateX(${-40 * (1 - show)}px)` }}>{heading}</div>
        <div style={{ width: 160 * show, height: 6, borderRadius: 3, background: theme.accent, marginTop: 18 }} />
      </div>

      {slide.type === "points" ? (
        <div style={{ position: "absolute", left: 120, right: 120, top: 330, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {slide.items.map((it, j) => (
            <div
              key={j}
              style={{
                ...enter(j),
                background: theme.panel,
                borderLeft: `6px solid ${it.mark ? theme.hot : theme.accent}`,
                borderRadius: 10,
                padding: "22px 28px",
                boxShadow: `0 0 40px ${glow}`,
                gridColumn: slide.items.length % 2 === 1 && j === slide.items.length - 1 ? "1 / span 2" : undefined,
              }}
            >
              <div style={{ color: theme.ink, fontSize: 40, fontWeight: 700 }}>{it.text}</div>
              {it.sub ? <div style={{ color: theme.dim, fontSize: 28, marginTop: 8 }}>{it.sub}</div> : null}
              {code(it)}
            </div>
          ))}
        </div>
      ) : null}

      {slide.type === "timeline" ? (
        <div style={{ position: "absolute", left: 120, right: 120, top: 380, height: 520 }}>
          {/* The line, drawn across over the scene. */}
          <div style={{ position: "absolute", left: 0, top: 150, height: 6, borderRadius: 3, width: `${100 * progress}%`, background: theme.accent, opacity: show }} />
          {slide.items.map((it, j) => {
            const x = (j + 0.5) / slide.items.length;
            return (
              <div key={j} style={{ ...enter(j), position: "absolute", left: `${100 * x}%`, top: 0, width: 230, marginLeft: -115, textAlign: "center" }}>
                <div style={{ color: it.mark ? theme.hot : theme.accent, fontSize: it.mark ? 52 : 44, fontWeight: 700, height: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{it.year}</div>
                <div style={{ margin: "30px auto 0", width: it.mark ? 36 : 26, height: it.mark ? 36 : 26, borderRadius: 18, background: it.mark ? theme.hot : theme.accent, boxShadow: `0 0 24px ${it.mark ? "rgba(255,255,255,0.6)" : glow}`, transform: `translateY(${it.mark ? -5 : 0}px)` }} />
                <div style={{ color: theme.ink, fontSize: 30, fontWeight: 700, marginTop: 34, lineHeight: 1.2 }}>{it.text}</div>
                {it.sub ? <div style={{ color: theme.dim, fontSize: 24, marginTop: 10, lineHeight: 1.3 }}>{it.sub}</div> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {slide.type === "flow" ? (
        <div style={{ position: "absolute", left: 100, right: 100, top: 360, display: "flex", alignItems: "stretch", gap: 0 }}>
          {slide.items.map((it, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", flex: `${it.xtl ? 1.5 : 1} 1 0` }}>
              {j > 0 ? <div style={{ ...enter(j), color: theme.accent, fontSize: 64, fontWeight: 700, padding: "0 18px" }}>{"→"}</div> : null}
              <div style={{ ...enter(j), flex: 1, alignSelf: "stretch", background: theme.panel, border: `2px solid ${it.mark ? theme.hot : theme.rule}`, borderTop: `6px solid ${theme.accent}`, borderRadius: 12, padding: "24px 26px", boxShadow: `0 0 40px ${glow}` }}>
                <div style={{ color: theme.ink, fontSize: 38, fontWeight: 700 }}>{it.text}</div>
                {it.sub ? <div style={{ color: theme.dim, fontSize: 26, marginTop: 10, lineHeight: 1.35 }}>{it.sub}</div> : null}
                {code(it)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

import { AbsoluteFill } from "remotion";
import { theme } from "./theme";
import { Panel as PanelData, StoryScene } from "./types";

// A panel in a story (remotion/src/Story.tsx), under the scene's
// heading, on the explainer slides' background:
//   code: lines of X_eTaL (as the pinned xetal rendered them) and other
//     code (as it is), each with an optional label; the lines in focus
//     for the current sentence stand out, the rest dim.
//   cells: an array's values in a row of cells, and under them what the
//     operation makes of them: in a loop, one cell at a time; whole,
//     all at once.
// Nothing here computes timing: how far each line has come in is
// X_eTaL's stagger (reveal), each loop cell's progress its sweep, the
// whole array's its out-cubic progress, and which sentence is being
// spoken the voice's sentence starts (media.focusCuts, scripts/props.mjs).
type Props = {
  panel: PanelData;
  media: StoryScene;
  heading: string;
  brand?: string;
  show: number;
  local: number;
  reveal: number[];
  sweep: number[];
  progress: number;
  rendered: Record<string, string>;
};

const glow = "rgba(88, 166, 255, 0.18)";
const syntaxCss = Object.entries(theme.syntax).map(([c, color]) => `.xtl .${c} { color: ${color}; }`).join("\n");
const LEFT = 120;
const WIDTH = 1920 - 2 * LEFT;

export const Panel: React.FC<Props> = ({ panel, media, heading, brand, show, local, reveal, sweep, progress, rendered }) => {
  const r = (j: number) => reveal[j] ?? 1;

  // The lines in focus: the entry for the sentence being spoken.
  const k = (media.focusCuts ?? []).filter((c) => local >= c).length;
  const focus = panel.focus ? panel.focus[Math.min(k, panel.focus.length - 1)] : [];
  const inFocus = (j: number) => focus.length === 0 || focus.includes(j);

  const lines = panel.lines ?? [];
  const labeled = lines.some((l) => l.label);

  // Cells: as many to a row as fit, at most 20.
  const from = media.from ?? [];
  const to = media.to ?? [];
  const perRow = Math.min(from.length, 20);
  const gap = 12;
  const cell = Math.min(150, (WIDTH - gap * (perRow - 1)) / Math.max(1, perRow));
  // Both grids and the op between them fit the 600 px under the heading.
  const rows = 2 * Math.ceil(from.length / Math.max(1, perRow));
  const tall = Math.min(cell, 110, (600 - 90) / Math.max(1, rows) - gap);
  const cellFont = Math.min(56, cell * 0.42, tall * 0.6);
  const loop = panel.mode === "loop";
  const done = (j: number) => (loop ? sweep[j] ?? 1 : progress);
  const current = (j: number) => loop && (sweep[j] ?? 1) > 0 && (sweep[j] ?? 1) < 1;

  const grid = (values: string[], made: boolean) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${perRow}, ${cell}px)`, gap, justifyContent: "center" }}>
      {values.map((v, j) => {
        const t = made ? done(j) : 1;
        const hot = current(j);
        return (
          <div
            key={j}
            style={{
              height: tall,
              borderRadius: 10,
              background: made ? `rgba(88, 166, 255, ${0.2 * t})` : theme.panel,
              border: `2px solid ${hot ? theme.hot : made ? theme.accent : theme.rule}`,
              boxShadow: hot ? "0 0 30px rgba(255,255,255,0.45)" : `0 0 24px ${glow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.mono,
              fontSize: cellFont,
              color: made ? theme.ink : theme.code,
              opacity: (made ? 0.25 + 0.75 * t : 1) * show,
              transform: made ? `translateY(${-24 * (1 - t)}px)` : undefined,
            }}
          >
            {made ? (t > 0 ? v : "") : v}
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 20% 0%, #1b2a44 0%, ${theme.bg} 60%)`, fontFamily: theme.text }}>
      <style>{syntaxCss}</style>
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(139,148,158,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,148,158,0.07) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: show,
        }}
      />
      <div style={{ position: "absolute", left: LEFT, top: 90, right: LEFT, opacity: show }}>
        {brand ? <div style={{ color: theme.accent, fontSize: 28, fontWeight: 700, letterSpacing: 1.5 }}>{brand}</div> : null}
        <div style={{ color: theme.ink, fontSize: 76, fontWeight: 700, marginTop: 6, transform: `translateX(${-40 * (1 - show)}px)` }}>{heading}</div>
        <div style={{ width: 160 * show, height: 6, borderRadius: 3, background: theme.accent, marginTop: 18 }} />
      </div>

      {panel.type === "code" ? (
        <div style={{ position: "absolute", left: LEFT, right: LEFT, top: 330, background: theme.panel, borderRadius: 14, padding: "30px 0", boxShadow: `0 0 50px ${glow}`, opacity: show }}>
          {lines.map((l, j) => {
            const on = inFocus(j);
            const xtl = "xtl" in l;
            return (
              <div
                key={j}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 84,
                  paddingLeft: 34,
                  borderLeft: `8px solid ${on && focus.length ? theme.hot : on ? theme.accent : "transparent"}`,
                  background: on && focus.length ? "rgba(88, 166, 255, 0.10)" : undefined,
                  opacity: r(j) * (on ? 1 : 0.3),
                  transform: `translateX(${30 * (1 - r(j))}px)`,
                }}
              >
                {labeled ? <div style={{ width: 200, flexShrink: 0, color: theme.accent, fontSize: 38, fontWeight: 700 }}>{l.label ?? ""}</div> : null}
                <div
                  className={xtl ? "xtl" : undefined}
                  style={{ fontFamily: theme.mono, fontSize: 50, whiteSpace: "pre", color: xtl ? theme.xtl : theme.code }}
                  {...(xtl ? { dangerouslySetInnerHTML: { __html: rendered[l.xtl] ?? l.xtl } } : { children: l.code })}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {panel.type === "cells" ? (
        <div style={{ position: "absolute", left: LEFT, right: LEFT, top: 340, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          {grid(from, false)}
          <div style={{ color: theme.accent, fontSize: 46, fontWeight: 700, fontFamily: theme.mono, opacity: show }}>
            {"↓"} {panel.op ?? ""}
          </div>
          {grid(to, true)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

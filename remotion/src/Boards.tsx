import { theme } from "./theme";
import { Board } from "./types";

// A scene's arrays drawn as grids, in one SVG that fits whatever room
// it is given. Every number drawn was printed by the lesson's
// data.xtl; which board of a stepping list is showing, and how far the
// change into it has gone, are the frame's `step` and `stepT`, from
// X_eTaL too.
const CELL = 10; // a cell, in the SVG's own units
const GAP = 14; // between blocks

type Plane = number[][];
// A grid shows the board `now` over the board `before`, `t` of the way
// in. For counts of steps, `steps` is how many there have been at
// each: a cell with that many has never left, and is black.
type Grid = { x: number; y: number; now: Plane; before: Plane; t: number; steps: [number, number] };
type Block = { label?: string; numbers: boolean; heat?: "ramp" | "escape"; low: number; high: number; width: number; height: number; grids: Grid[] };

// From deep blue through the accent to white, for 0 to 1.
const stops = [[8, 16, 56], [88, 166, 255], [255, 255, 255]];
const ramp = (u: number) => {
  const v = Math.max(0, Math.min(1, u)) * (stops.length - 1);
  const i = Math.min(Math.floor(v), stops.length - 2);
  const c = stops[i].map((a, n) => Math.round(a + (stops[i + 1][n] - a) * (v - i)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const Boards: React.FC<{
  boards: Board[];
  data: Record<string, Plane[]>;
  step: number;
  stepT: number;
  opacity: number;
}> = ({ boards, data, step, stepT, opacity }) => {
  const blocks: Block[] = boards.map((board) => {
    const planes = data[board.data];
    const rows = planes[0].length, cols = planes[0][0].length;
    const w = cols * CELL, h = rows * CELL;
    const all = planes.flat(2);
    const low = Math.min(...all), high = Math.max(...all);
    const base = { label: board.label, numbers: !!board.numbers, heat: board.heat, low, high };
    if (board.animate) {
      // One board at a time: this step's, fading in over the last one.
      const k = Math.min(step, planes.length - 1);
      const t = step > planes.length - 1 ? 1 : stepT;
      return { ...base, width: w, height: h, grids: [{ x: 0, y: 0, now: planes[k], before: planes[Math.max(k - 1, 0)], t, steps: [k, Math.max(k - 1, 0)] }] };
    }
    // Every board of the list at once, in a square arrangement.
    const across = Math.ceil(Math.sqrt(planes.length));
    const down = Math.ceil(planes.length / across);
    const between = planes.length > 1 ? 5 : 0;
    return {
      ...base,
      width: across * w + (across - 1) * between,
      height: down * h + (down - 1) * between,
      grids: planes.map((p, i) => ({ x: (i % across) * (w + between), y: Math.floor(i / across) * (h + between), now: p, before: p, t: 1, steps: [high, high] as [number, number] })),
    };
  });
  const labeled = blocks.some((b) => b.label);
  const width = blocks.reduce((a, b) => a + b.width, 0) + GAP * (blocks.length - 1);
  const letter = width * 0.034; // a label's size follows the picture's width
  const top = labeled ? letter * 1.9 : 0;
  const height = Math.max(...blocks.map((b) => b.height)) + top;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet" style={{ width: "100%", height: "100%", opacity }}>
      {blocks.map((block, n) => {
        const left = x;
        x += block.width + GAP;
        return (
          <g key={n} transform={`translate(${left}, ${top})`}>
            {block.label ? (
              <text x={0} y={-letter * 0.6} fontFamily={theme.mono} fontSize={letter} fill={theme.dim}>
                {block.label}
              </text>
            ) : null}
            {block.grids.map((grid, g) => (
              <g key={g} transform={`translate(${grid.x}, ${grid.y})`}>
                {block.heat
                  ? grid.now.map((row, i) =>
                      row.map((value, j) => {
                        const span = block.high - block.low || 1;
                        const color = (v: number, steps: number) =>
                          block.heat === "escape" ? (v >= steps && steps > 0 ? "#000" : ramp(Math.sqrt(v / (block.high || 1)))) : ramp((v - block.low) / span);
                        const now = color(value, grid.steps[0]);
                        const before = color(grid.before[i][j], grid.steps[1]);
                        return (
                          <g key={`${i}-${j}`}>
                            <rect x={j * CELL} y={i * CELL} width={CELL + 0.2} height={CELL + 0.2} fill={grid.t < 1 ? before : now} />
                            {grid.t < 1 && now !== before ? <rect x={j * CELL} y={i * CELL} width={CELL + 0.2} height={CELL + 0.2} fill={now} opacity={grid.t} /> : null}
                          </g>
                        );
                      }),
                    )
                  : null}
                {(block.heat ? [] : grid.now).map((row, i) =>
                  row.map((value, j) => {
                    const was = grid.before[i][j];
                    const lit = block.numbers ? Math.min(value, 9) / 9 : was + (value - was) * grid.t;
                    return (
                      <g key={`${i}-${j}`}>
                        <rect x={j * CELL + 0.5} y={i * CELL + 0.5} width={CELL - 1} height={CELL - 1} rx={1.4} fill={theme.panel} />
                        <rect x={j * CELL + 0.5} y={i * CELL + 0.5} width={CELL - 1} height={CELL - 1} rx={1.4} fill={theme.accent} opacity={block.numbers ? lit * 0.75 : lit} />
                        {block.numbers ? (
                          <text x={j * CELL + CELL / 2} y={i * CELL + CELL / 2 + 1.9} textAnchor="middle" fontFamily={theme.mono} fontSize={5.2} fill={value ? theme.hot : theme.dim}>
                            {value}
                          </text>
                        ) : null}
                      </g>
                    );
                  }),
                )}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// lessons/al-04-broadcast/lesson.json from this file: node lessons/al-04-broadcast/lesson.mjs (from the repository root).
// Every array drawn is what the pinned bin/xetal --box prints (APL2 DISPLAY frames), never typed; an
// X_eTaL error is the first line xetal prints for it. Examples are shown notebook style: each argument
// and the result as a box, side by side, so every shape shows (a scalar is a bare number, no frame).
// Other languages' code is { code }, as docs/comparing-languages.md gives it; their arguments and
// results are the same data, drawn the same way. Only what that doc confirms is narrated.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
const prelude = "v := 10 20 30\nw := 100 200\nM := 2 3 r_eshape r_ange 6\n";
const dir = mkdtempSync(tmpdir() + "/al04-");
const run = (expr) => {
  writeFileSync(dir + "/b.xtl", prelude + expr + "\n");
  try { return { box: execFileSync("bin/xetal", ["--box", "run", dir + "/b.xtl"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).replace(/\n+$/, "") }; }
  catch (e) { return { code: String(e.stderr).split("\n")[0] }; }
};
// Notebook style: boxes and operators side by side, each centered on the tallest.
// A part is an X_eTaL expression to draw ("=M"), or text as it is (an operator, an error).
const H = (...parts) => {
  const cols = parts.map((p) => {
    if (!p.startsWith("=") || p === "=") return [p];
    const r = run(p.slice(1));
    if (!r.box) throw new Error(`${p}: ${r.code}`);
    return r.box.split("\n");
  });
  const tall = Math.max(...cols.map((c) => c.length));
  const width = (c) => Math.max(...c.map((s) => [...s].length));
  const pad = (c) => { const top = Math.floor((tall - c.length) / 2); const w = width(c); return Array.from({ length: tall }, (_, i) => { const s = c[i - top] ?? ""; return s + " ".repeat(w - [...s].length); }); };
  const padded = cols.map(pad);
  return { box: Array.from({ length: tall }, (_, i) => padded.map((c) => c[i]).join("  ").replace(/\s+$/, "")).join("\n") };
};
const l = JSON.parse(readFileSync("lessons/al-02-loops/lesson.json", "utf8"));
const S = (id) => l.scenes.find((s) => s.id === id);
const x = (s) => ({ xtl: s }), o = (s) => ({ code: s });
const panel = (lines, focus) => ({ type: "code", lines, focus });
const A = "{axes|@axes}";
const X_ = "{X_eTaL|@xtl}";
const err = (e) => run(e).code;
// The same data in every language (docs/comparing-languages.md).
const rows = "=M + 2 3 r_eshape v", cols = "=M + o_\\ 3 2 r_eshape w";
const scenes = [
  { id: "title", seconds: 8, heading: "Broadcasting", lines: ["When arrays of different shapes meet"] },
  { id: "recap", seconds: 10, heading: "Last time", narration: `Last time, every array had a shape, a rank and ${A}. Today, two arrays meet. This episode asks what happens when their shapes differ.`, lines: [], slide: { type: "flow", steps: [0, 1], items: [{ text: "Shape", sub: "2 3" }, { text: "meets", sub: "+" }, { text: "Shape", sub: "3" }] } },
  // Rendered by Blender from X_eTaL arrays (just cubes, scripts/cubes/): silent, with music.
  { id: "cubes-ladder", seconds: 6, heading: "Arrays as cubes", lines: [], images: ["work/cubes/ladder-tight.png"] },
  // X_eTaL first: its whole rule.
  { id: "scalar-vector", seconds: 12, heading: "A single value", narration: "Start with a single value and a vector. A single value is a scalar. It has no frame, because it has no {axes|@axes}. One plus the vector adds one to every item. This is called scalar extension.", lines: [], panel: panel([x("1 + v"), H("1", "+", "=v", "=", "=1 + v")], [[0, 1], [1], [1], [0, 1], [0, 1]]) },
  { id: "scalar-matrix", seconds: 10, heading: "A single value", narration: "It works with any shape. Ten times a matrix multiplies every item by ten. The result has the shape of the matrix.", lines: [], panel: panel([x("10 * M"), H("10", "*", "=M", "=", "=10 * M")], [[0, 1], [0, 1], [1]]) },
  { id: "same-shape", seconds: 12, heading: "The same shape", narration: "Two arrays of the same shape combine item by item. Each item meets the item in the same place. Two by three plus two by three is two by three.", lines: [], panel: panel([x("1 2 3 + v"), H("=1 2 3", "+", "=v", "=", "=1 2 3 + v"), x("M + M"), H("=M", "+", "=M", "=", "=M + M")], [[0, 1], [0, 1], [2, 3]]) },
  { id: "mismatch", seconds: 12, heading: "Different shapes", narration: `Now try a matrix and a vector. The matrix has a shape of two by three. The vector has a shape of three. In ${X_} this is an error. The message names both shapes.`, lines: [], panel: panel([x("M + v"), H("=M", "+", "=v", "=", "error"), o(err("M + v"))], [[0], [1], [1], [0, 2], [2]]) },
  { id: "break-1", seconds: 5, heading: "The rule in X_eTaL", lines: [], slide: { type: "flow", items: [{ text: "One value", sub: "extends to every item" }, { text: "The same shape", sub: "item by item" }, { text: "Other shapes", sub: "an error" }] } },
  { id: "why", seconds: 14, heading: "Why an error?", narration: "The rule is short, so a result is easy to predict. A mismatch is often a mistake. An error shows it at once. To combine other shapes, you say how.", lines: [], slide: { type: "points", steps: [0, 1, 1, 2], items: [{ text: "Easy to predict", sub: "one value, or the same shape" }, { text: "Mistakes show at once", sub: "the error names both shapes" }, { text: "Anything else", sub: "you say how" }] } },
  { id: "rows", seconds: 12, heading: "A vector on each row", narration: "To add the vector to each row, say so. Reshape repeats the vector to the shape of the matrix. Now the shapes match.", lines: [], panel: panel([x("2 3 r_eshape v"), H("=v", "→", "=2 3 r_eshape v"), x("M + 2 3 r_eshape v"), H("=M", "+", "=2 3 r_eshape v", "=", rows)], [[], [0, 1], [2, 3]]) },
  { id: "columns", seconds: 14, heading: "A vector down the columns", narration: "Columns take one more step. This vector has two values, one for each row. Reshape it to three by two, then transpose. Now each row holds one value.", lines: [], panel: panel([x("o_\\ 3 2 r_eshape w"), H("=w", "→", "=3 2 r_eshape w", "→", "=o_\\ 3 2 r_eshape w")], [[], [0, 1], [0, 1], [0, 1]]) },
  { id: "columns-add", seconds: 8, heading: "A vector down the columns", narration: "The sum adds one value along each row. Each column gets the same two values.", lines: [], panel: panel([x("M + o_\\ 3 2 r_eshape w"), H("=M", "+", "=o_\\ 3 2 r_eshape w", "=", cols)], [[0, 1], [0, 1]]) },
  { id: "rank-form", seconds: 14, heading: "Each row, with rank", narration: "The rank form says it another way. One means each row of the matrix. The small function in braces adds the vector to its argument. A later episode covers functions like this one.", lines: [], panel: panel([x("1 '{ _r + v } r_ank M"), H("=v", "+ each row of", "=M", "=", "=1 '{ _r + v } r_ank M")], [[0, 1], [0], [0], [0, 1]]) },
  { id: "table", seconds: 14, heading: "Every pair", narration: "Sometimes you want every pair. Table combines each item of one vector with each item of the other. With three values and two, the result is three by two.", lines: [], panel: panel([x("v '+ t_able w"), H("=v", "+ table", "=w", "=", "=v '+ t_able w")], [[], [0, 1], [0, 1]]) },
  { id: "break-2", seconds: 5, heading: "Say how", lines: [], slide: { type: "flow", items: [{ text: "Each row", xtl: "M + 2 3 r_eshape v" }, { text: "Each column", xtl: "M + o_\\ 3 2 r_eshape w" }, { text: "Rank", xtl: "1 '{ _r + v } r_ank M" }, { text: "Every pair", xtl: "v '+ t_able w" }] } },
  // The other languages: the table first, then each one, its default and how it says the other case.
  { id: "languages", seconds: 34, heading: "Other array languages", narration: `Other array languages draw this line in different places. Our matrix has two rows and three columns. Three values match its last axis. Two values match its first. ${X_} needs the same shape, so both are errors. {APL|@apl} does the same. {J|Jay} and {BQN|@bqn}{,|/} match ${A} from the front. So two values meet the two rows. The language {K|Kay} works the same way. {NumPy|@numpy} matches ${A} from the back. So three values meet each row. Every one of them extends a single value.`, lines: [], panel: { type: "code", lines: [{ label: "", code: "matches          M + 10 20 30  M + 100 200" }, { label: "X_eTaL", code: "the same shape   error         error" }, { label: "APL", code: "the same shape   error         error" }, { label: "J, BQN", code: "from the front   error         each row" }, { label: "K", code: "from the front   error         each row" }, { label: "NumPy", code: "from the back    each row      error" }], focus: [[], [0], [0], [0], [1], [2], [3], [3], [4], [5], [5], [1, 2, 3, 4, 5]] } },
  { id: "apl", seconds: 14, heading: "APL", narration: "Both lines give a rank error in {APL|@apl}. The ranks differ, so the shapes cannot match. Brackets around an axis number say how. Plus on axis two puts the vector on each row.", lines: [], panel: panel([o("M+10 20 30"), H("=M", "+", "=v", "=", "RANK ERROR"), o("M+[2]10 20 30"), H("=M", "+[2]", "=v", "=", rows)], [[0, 1], [0, 1], [2, 3], [2, 3]]) },
  { id: "apl-more", seconds: 14, heading: "APL", narration: "On axis one, two values go down the columns. The rank operator is another way. Rank one pairs the vector with each row.", lines: [], panel: panel([o("M+[1]100 200"), H("=M", "+[1]", "=w", "=", cols), o("10 20 30(+⍤1)M"), H("=v", "+⍤1", "=M", "=", rows)], [[0, 1], [2, 3], [2, 3]]) },
  { id: "j", seconds: 14, heading: "J", narration: `{J|Jay} matches ${A} from the front. Two values meet the two rows, one value each. Three values are a length error.`, lines: [], panel: panel([o("100 200 + M"), H("=w", "+", "=M", "=", cols), o("M + 10 20 30"), H("=M", "+", "=v", "=", "length error")], [[0, 1], [0, 1], [2, 3]]) },
  { id: "j-rank", seconds: 10, heading: "J", narration: "To put three values on each row, {J|Jay} uses rank. Rank one means each row.", lines: [], panel: panel([o('10 20 30 +"1 M'), H("=v", '+"1', "=M", "=", rows)], [[0, 1], [0, 1]]) },
  { id: "bqn", seconds: 12, heading: "BQN", narration: "{BQN|@bqn} follows the same rule as {J|Jay}. Its rank modifier works the same way too.", lines: [], panel: panel([o("100‿200 + M"), H("=w", "+", "=M", "=", cols), o("10‿20‿30 +⎉1 M"), H("=v", "+⎉1", "=M", "=", rows)], [[0, 1], [2, 3]]) },
  { id: "k", seconds: 14, heading: "K", narration: "In {K|Kay}, a matrix is a list of rows. Two values meet the two rows. Each right puts three values on each row.", lines: [], panel: panel([o("100 200+M"), H("=w", "+", "=M", "=", cols), o("10 20 30+/:M"), H("=v", "+/:", "=M", "=", rows)], [[0, 1], [0, 1], [2, 3]]) },
  { id: "numpy", seconds: 12, heading: "NumPy", narration: `{NumPy|@numpy} matches ${A} from the back. Three values meet each row, with nothing to add. Two values are an error.`, lines: [], panel: panel([o("M + np.array([10, 20, 30])"), H("=M", "+", "=v", "=", rows), o("M + np.array([100, 200])"), H("=M", "+", "=w", "=", "ValueError")], [[0, 1], [0, 1], [2, 3]]) },
  { id: "numpy-columns", seconds: 12, heading: "NumPy", narration: "To go down the columns, add an axis of length one. The two values become a column. That column stretches across the matrix.", lines: [], panel: panel([o("M + np.array([100, 200])[:, np.newaxis]"), H("=M", "+", "=2 1 r_eshape w", "=", cols)], [[0, 1], [1], [0, 1]]) },
  { id: "numpy-stretch", seconds: 16, heading: "NumPy: a length one axis stretches", narration: "That stretching has a cost. A column of three plus a row of three gives a three by three table. If you meant item by item, there is no error. You get an answer of the wrong shape.", lines: [], panel: panel([o("a[:, np.newaxis] + a"), H("=3 1 r_eshape 1 2 3", "+", "=1 2 3", "=", "=1 2 3 '+ t_able 1 2 3")], [[0, 1], [0, 1], [1], [1]]) },
  // The same table in X_eTaL, step by step: what NumPy stretches silently, said out loud (the author, 2026-11-25).
  { id: "xetal-error", seconds: 12, heading: "The same table in X_eTaL", narration: `In ${X_} nothing stretches by itself. A column plus a row is an error, because the shapes differ. So we stretch each one ourselves.`, lines: [], panel: panel([x("(3 1 r_eshape 1 2 3) + 1 3 r_eshape 1 2 3"), H("=3 1 r_eshape 1 2 3", "+", "=1 3 r_eshape 1 2 3", "=", "error"), o(err("(3 1 r_eshape 1 2 3) + 1 3 r_eshape 1 2 3"))], [[0, 1], [0, 1, 2], [1]]) },
  { id: "xetal-stretch", seconds: 14, heading: "Stretch each one", narration: "Reshape repeats the row three times, down the rows. Reshape and transpose repeat the column across. Now both are three by three.", lines: [], panel: panel([x("3 3 r_eshape 1 2 3"), x("o_\\ 3 3 r_eshape 1 2 3"), H("=1 3 r_eshape 1 2 3", "→", "=3 3 r_eshape 1 2 3", "  ", "=3 1 r_eshape 1 2 3", "→", "=o_\\ 3 3 r_eshape 1 2 3")], [[0, 2], [1, 2], [2]]) },
  { id: "xetal-sum", seconds: 14, heading: "Then add", narration: "Now plus adds them item by item. The result is the same table that NumPy gave. The table function does it in one step.", lines: [], panel: panel([x("(o_\\ 3 3 r_eshape 1 2 3) + 3 3 r_eshape 1 2 3"), H("=o_\\ 3 3 r_eshape 1 2 3", "+", "=3 3 r_eshape 1 2 3", "=", "=(o_\\ 3 3 r_eshape 1 2 3) + 3 3 r_eshape 1 2 3"), x("1 2 3 '+ t_able 1 2 3")], [[0, 1], [0, 1], [2]]) },
  { id: "tradeoffs", seconds: 16, heading: "The trade off", narration: "Each choice has a cost. Automatic rules are short to write. But a wrong shape can still give an answer. A strict rule asks for one more step. In return, a mismatch shows itself.", lines: [], slide: { type: "points", steps: [0, 0, 1, 2, 2], items: [{ text: "Automatic", sub: "short to write" }, { text: "But", sub: "a wrong shape may still give an answer" }, { text: "Strict", sub: "one more step; a mismatch shows itself" }] } },
  { id: "break-3", seconds: 5, heading: "When shapes meet", lines: [], slide: { type: "points", items: [{ text: "One value", sub: "extends everywhere" }, { text: "Same shape", sub: "item by item" }, { text: "Otherwise", sub: "the language decides, or you do" }] } },
  { id: "next", seconds: 10, heading: "Next time", narration: "The next episode is about array idioms. That is thinking without loops. We take small problems and solve each one twice. First with a loop, then with whole arrays.", lines: [], slide: { type: "points", steps: [0, 0, 1, 1], items: [{ text: "Episode 5", sub: "Array idioms: thinking without loops" }, { text: "Each problem twice", sub: "a loop, then whole arrays" }] } },
  // A teaser: idioms episode 05 covers (research2, Video 06: the problems not yet in episodes 02 to 04), named only (the author, 2026-11-25).
  { id: "next-idioms", seconds: 7, heading: "Coming up: array idioms", lines: [], slide: { type: "points", items: [{ text: "Running totals" }, { text: "Adjacent changes" }, { text: "Normalize values" }, { text: "Count occurrences" }] } },
  { id: "exercise", seconds: 14, heading: "Before the next episode", narration: "Before the next episode, try this. Make a times table for one to nine, with table. Then add ten, twenty and thirty to each row of a matrix. Then add one hundred and two hundred to each column.", lines: ["A times table for 1 to 9", "10 20 30 added to each row of M", "100 200 added to each column of M"] },
  S("cta"), S("close"),
];
const { scenes: _, youtube, poster, ...h } = l;
h.music = { file: "/Users/mike/github/softwarewrighter/music-pipe-rs/work/video-beds/ode-arcade.wav", intro: { seconds: 5, fadeOut: 0.5 }, outro: { seconds: 5, fadeIn: 0.5 }, slides: { volume: 0.3, fade: 0.4, starts: [5, 10, 15] } };
const out = { ...h, slug: "al-04-broadcast", title: "Broadcasting", summary: "Array languages, episode 4: when arrays of different shapes meet. Scalar extension, the same shape, and the error otherwise in X_eTaL; saying how with reshape, transpose, rank and table; APL, J, BQN, K and NumPy compared.", order: 103, poster: 774, youtube: "-te7ZGCdIkE", brand: "Array Languages: episode 4", scenes };
writeFileSync("lessons/al-04-broadcast/lesson.json", JSON.stringify(out, null, 2) + "\n");

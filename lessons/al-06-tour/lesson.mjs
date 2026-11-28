// lessons/al-06-tour/lesson.json from this file: node lessons/al-06-tour/lesson.mjs (from the repository root).
// Episode 06, the language tour (research2 Video 07): APL, J, K, BQN and X_eTaL side by side on the same
// small problems. X_eTaL results are what the pinned bin/xetal --box prints, never typed; the other
// languages' lines are shown as they are ({ code }), each result checked in an interpreter (GNU APL 2.0,
// J 9.7.1, Kona; BQN and the APL train on the online REPLs, docs/comparing-languages.md) and listed in
// README.md. The claims about each language are research2's own narration, in short sentences.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
const prelude = "x := 3 1 4 1 5 9\n";
const dir = mkdtempSync(tmpdir() + "/al06-");
const run = (expr, cmd = "run") => {
  writeFileSync(dir + "/b.xtl", prelude + expr + "\n");
  try { return { box: execFileSync("bin/xetal", cmd === "run" ? ["--box", "run", dir + "/b.xtl"] : [cmd, dir + "/b.xtl"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).replace(/\n+$/, "") }; }
  catch (e) { return { code: String(e.stderr).split("\n")[0] }; }
};
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
const x = (s, label) => ({ xtl: s, ...(label ? { label } : {}) }), o = (s, label) => ({ code: s, ...(label ? { label } : {}) });
const panel = (lines, focus) => ({ type: "code", lines, focus });
const X_ = "{X_eTaL|@xtl}", APL = "{APL|@apl}", BQN = "{BQN|@bqn}", J = "{J|Jay}", K = "{K|Kay}";
// The X_eTaL lines, once (checked against the pin below, through H and run).
const scan = "'+ s_\\ x", rev = "r_ev x", order = "2 * 3 + 4", mean = "['+ r_/ / t_ally] x";
const meanDef = "u:m_ean := ['+ r_/ / t_ally]";
const spreadE = "u:s_pread := { ('m_ax r_/ _r) - 'm_in r_/ _r }", spreadT = "u:s_pread := ['m_ax r_/ - 'm_in r_/]";
const spreadType = run(spreadT, "type").box.split("\n").find((s) => s.startsWith("u:s_pread"));
const typed = run(meanDef, "type").box.split("\n").find((s) => s.startsWith("u:m_ean"));
const typeErr = run("['+ r_/ / t_ally] f_loat x").code;
const out = (expr) => run(expr).box; // a result, boxed
const scenes = [
  { id: "title", seconds: 8, heading: "The array language family", lines: ["APL, J, K, BQN and X_eTaL"] },
  { id: "recap", seconds: 12, heading: "Last time", narration: `Last time, we met eight array idioms. Today, we meet the family of languages behind them. Five languages, side by side.`, lines: [], slide: { type: "points", steps: [0, 1, 1], items: [{ text: "Last time", sub: "eight idioms" }, { text: "Today", sub: "the array language family" }] } },
  // research2 Video 07: the narration for the family, in short sentences.
  { id: "family", seconds: 30, heading: "Five languages", narration: `${APL} made arrays and math the basic vocabulary of a language. ${J} explored an {ASCII|ass key} notation, and powerful function composition. ${K} kept a compact vocabulary, and short expressions. After them, ${BQN} revisited many of these ideas, with a modern notation and combinators. ${X_} takes ideas from this family, but makes different choices.`, lines: [], slide: { type: "points", steps: [0, 1, 2, 3, 4], items: [{ text: "APL", sub: "arrays and math as the vocabulary" }, { text: "J", sub: "ASCII notation, function composition" }, { text: "K", sub: "a compact vocabulary" }, { text: "BQN", sub: "a modern notation, combinators" }, { text: "X_eTaL", sub: "checked types, ASCII rendered, composition" }] } },
  { id: "not-replacement", seconds: 12, heading: "A family, not a replacement", narration: `${X_} is not a replacement for any one of them. It borrows from the family. Then it makes its own choices.`, lines: [], slide: { type: "points", steps: [0, 1, 1], items: [{ text: "Not a replacement", sub: "for any one of them" }, { text: "Borrowed ideas", sub: "its own choices" }] } },
  { id: "break-1", seconds: 5, heading: "One problem, five languages", lines: [], slide: { type: "points", items: [{ text: "Running totals" }, { text: "Reverse" }, { text: "Right to left" }, { text: "A mean, as a train" }] } },
  { id: "scan", seconds: 16, heading: "Running totals in five languages", narration: "Start with running totals, from the last episode. Every language here has a scan. The spelling differs. The answer is the same.", lines: [], panel: panel([o("+\\3 1 4 1 5 9", "APL"), o("+/\\ 3 1 4 1 5 9", "J"), o("+\\3 1 4 1 5 9", "K"), o("+`3‿1‿4‿1‿5‿9", "BQN"), x(scan, "X_eTaL"), { box: out(scan), label: "" }], [[], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [5]]) },
  { id: "reverse", seconds: 18, heading: "Notation: reverse", narration: `Reverse shows the notation. In ${APL}, reverse is a glyph, a circle with a bar. ${BQN} uses the same glyph. The languages ${J} and ${K} use {ASCII|ass key} symbols. Reverse is a word in ${X_}. Its first letter is underlined.`, lines: [], panel: panel([o("⌽3 1 4 1 5 9", "APL"), o("⌽3‿1‿4‿1‿5‿9", "BQN"), o("|. 3 1 4 1 5 9", "J"), o("|3 1 4 1 5 9", "K"), x(rev, "X_eTaL"), { box: out(rev), label: "" }], [[0, 1, 2, 3, 4], [0], [1], [2, 3], [4, 5], [4, 5]]) },
  { id: "order", seconds: 18, heading: "Right to left", narration: `All five work from right to left. There is no precedence. So three plus four comes first. Then two times seven gives fourteen. In {J|Jay} and {K|Kay}, times is typed as a star.`, lines: [], panel: panel([o("2×3+4", "APL"), o("2*3+4", "J"), o("2*3+4", "K"), o("2×3+4", "BQN"), x(order, "X_eTaL"), { box: out(order), label: "" }], [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [4, 5], [4, 5], [1, 2]]) },
  { id: "break-2", seconds: 5, heading: "Composition", lines: [], slide: { type: "flow", items: [{ text: "sum" }, { text: "divided by" }, { text: "count" }] } },
  { id: "train", seconds: 22, heading: "A mean, as a train", narration: `A train joins functions without naming the argument. Sum, divided by count, is the mean. ${APL}, ${J} and ${BQN} write it as a train. In ${X_}, the same fork goes in square brackets. ${K} writes a small function instead, with a named argument.`, lines: [], panel: panel([o("(+/÷≢)3 1 4 1 5 9", "APL"), o("(+/ % #) 3 1 4 1 5 9", "J"), o("(+´÷≠)3‿1‿4‿1‿5‿9", "BQN"), x(mean, "X_eTaL"), { box: out(mean), label: "" }, o("{(+/x)%#x}3 1 4 1 5 9", "K")], [[], [], [0, 1, 2], [3, 4], [5]]) },
  { id: "tacit", seconds: 24, heading: "Explicit or tacit: both in X_eTaL", narration: `One function, written two ways. The spread of a list is its largest value, minus its smallest. Written explicitly, it names its argument. Written as a train, it never does. Like ${J}, ${X_} supports both styles. Both get the same type, and both give eight.`, lines: [], panel: panel([o("3 : '(>./y) - <./y'", "J"), o("(>./ - <./)", "J"), x(spreadE, "explicit"), x(spreadT, "tacit"), o(spreadType), { box: out(spreadT + "\nu:s_pread x"), label: "" }], [[], [], [0, 2], [1, 3], [0, 1, 2, 3], [4, 5]]) },
  { id: "break-3", seconds: 5, heading: "Types", lines: [], slide: { type: "points", items: [{ text: "Dynamic", sub: "APL, J, K, BQN" }, { text: "Static, inferred", sub: "X_eTaL" }] } },
  { id: "types", seconds: 20, heading: "Types, checked before it runs", narration: `The four older languages check types as the program runs. ${X_} infers a type for every function first. The mean takes integers, and gives a float. A program that gives it floats is rejected before it runs.`, lines: [], panel: panel([x(meanDef), o(typed), x("['+ r_/ / t_ally] f_loat x"), o(typeErr)], [[], [0], [0, 1], [2, 3]]) },
  { id: "table", seconds: 24, heading: "The family at a glance", narration: `Here is the family at a glance. Glyphs, or {ASCII|ass key}. Right to left, in every one. Trains in three of them. Types checked as it runs, or before. ${X_} is the one with static types.`, lines: [], panel: { type: "code", lines: [{ label: "", code: "notation      reading order   trains   types" }, { label: "APL", code: "glyphs        right to left   yes      dynamic" }, { label: "J", code: "ASCII         right to left   yes      dynamic" }, { label: "K", code: "ASCII         right to left   no       dynamic" }, { label: "BQN", code: "glyphs        right to left   yes      dynamic" }, { label: "X_eTaL", code: "ASCII, drawn  right to left   yes      static" }], focus: [[0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], [0, 1, 2, 4, 5], [0, 1, 2, 3, 4, 5], [5]] } },
  { id: "break-5", seconds: 5, heading: "More differences", lines: [], slide: { type: "points", items: [{ text: "Counting from one, or zero" }, { text: "One symbol, two meanings" }, { text: "How many built-ins" }, { text: "What each does best" }, { text: "Where X_eTaL fits" }] } },
  { id: "origin", seconds: 16, heading: "Counting from one, or zero", narration: `Ask each language for the first five numbers. Counting in ${APL} starts at one. ${J}, ${K} and ${BQN} start at zero. Counting in ${X_} starts at one, as in ${APL}.`, lines: [], panel: panel([o("⍳5", "APL"), o("1 2 3 4 5", ""), o("i.5", "J"), o("!5", "K"), o("↕5", "BQN"), o("0 1 2 3 4", ""), x("r_ange 5", "X_eTaL"), { box: out("r_ange 5"), label: "" }], [[0, 1, 2, 3, 4, 5, 6, 7], [0, 1], [2, 3, 4, 5], [6, 7]]) },
  { id: "overload", seconds: 18, heading: "One symbol, two meanings", narration: `In ${APL}, ${J} and ${K}, the same mark often does two jobs. With one argument, it gives a shape in ${APL}. With two, it changes the shape. ${K} counts with one mark, or takes with it. ${BQN} gives shape and reshape their own glyphs. ${X_} gives them two names.`, lines: [], panel: panel([o("⍴M    2 3⍴⍳6", "APL"), o("$M    2 3$i.6", "J"), o("#v    2#v", "K"), o("≢m    2‿3⥊↕6", "BQN"), x("s_hape M", "X_eTaL"), x("2 3 r_eshape r_ange 6", "")], [[0, 1, 2], [0], [0], [2], [3], [4, 5]]) },
  // counts: Dyalog 20 primitive functions by category and operators table; J Dictionary vocabulary; ngn/k repl.k help;
  // BQN doc/primitive.html; X_eTaL the pinned work/xetal/docs/reference.md (README.md: how each was counted)
  { id: "counts", seconds: 30, heading: "How many built-ins", narration: `How many built-ins does each one have. ${APL} has fifty six function glyphs, and twenty two operators. ${J} spells about a hundred and eighteen, all in {ASCII|ass key}. ${K} has just twenty two verbs and six adverbs, but most mean several things. ${BQN} has forty four functions, and twenty modifiers. ${X_} has seventy five functions, mostly words, and eleven higher order functions in place of operators.`, lines: [], panel: { type: "code", lines: [{ label: "", code: "functions         modifiers               written as" }, { label: "APL", code: "56 glyphs         22 operators            glyphs" }, { label: "J", code: "118 spellings, verbs and modifiers       ASCII, 1 or 2 chars" }, { label: "K", code: "22 verbs          6 adverbs               ASCII" }, { label: "BQN", code: "44 functions      20 modifiers            64 glyphs" }, { label: "X_eTaL", code: "75 functions      11 higher order         13 symbols, 73 words" }, { label: "", code: "sources: Dyalog 20, J Dictionary, ngn/k, BQN docs, X_eTaL reference" }], focus: [[0, 1, 2, 3, 4, 5, 6], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] } },
  { id: "strengths", seconds: 26, heading: "What each does best", narration: `Each one has its strength. Its inventor saw ${APL} as a tool of thought. The tacit style is central to ${J}. ${K} is small and fast, and popular in finance. ${BQN} has fewer primitives than ${APL} or ${J}, and less overloading.`, lines: [], slide: { type: "points", steps: [0, 0, 1, 2, 3, 4], items: [{ text: "APL", sub: "notation as a tool of thought (Iverson, 1979)" }, { text: "J", sub: "tacit programming, all in ASCII" }, { text: "K", sub: "small and fast; kdb+ and q are built on it" }, { text: "BQN", sub: "fewer, less overloaded primitives (Why BQN?)" }] } },
  { id: "xetal-fit", seconds: 24, heading: "Where X_eTaL fits", narration: `So where does ${X_} fit. Like ${J} and ${K}, you type {ASCII|ass key}. You {read|reed} it drawn, as in ${APL}, and in ${BQN}. Its built-ins are mostly words, with one meaning each. Functions are passed as values, so it needs no operators. And its types are checked before it runs.`, lines: [], slide: { type: "points", steps: [0, 0, 1, 2, 3, 4], items: [{ text: "Typed in ASCII", sub: "like J and K" }, { text: "Read drawn", sub: "like APL and BQN" }, { text: "Words, one meaning each", sub: "not overloaded symbols" }, { text: "Functions as values", sub: "no separate operators" }, { text: "Types checked first", sub: "none of the others" }] } },
  { id: "break-4", seconds: 5, heading: "Source and rendering", lines: [], slide: { type: "flow", items: [{ text: "You type ASCII" }, { text: "It is drawn decorated" }] } },
  // research2: conclude with an X_eTaL source-to-rendered demonstration, the way into episode 07.
  { id: "rendered", seconds: 20, heading: "ASCII in, decorated out", narration: `Here is the mean as you type it, in plain {ASCII|ass key}. Here it is as drawn by ${X_}. The underlines mark functions. The slash for divide is drawn as a division sign. The small mark before the name says it belongs to this program.`, lines: [], panel: panel([o(meanDef, "typed"), x(meanDef, "drawn")], [[0], [1], [1], [1], [1]]) },
  // the preview of episode 07: the README's syntax guide (lessons/al-06-tour/poster.mjs), each part named, not yet explained
  { id: "next", seconds: 8, atLeast: 6, heading: "Next time: reading and writing X_eTaL", narration: `Next time, we {read|reed} and write ${X_}. Here is the whole language, on one page.`, lines: [], images: ["work/al-06-tour/poster/poster.png"] },
  { id: "next-names", seconds: 5, atLeast: 4, heading: "1. Name decorations", narration: "First, the marks on a name.", lines: [], images: ["work/al-06-tour/poster/names.png"] },
  { id: "next-defs", seconds: 5, atLeast: 4, heading: "2 and 3. Imports and definitions", narration: "Then using a library, and naming things.", lines: [], images: ["work/al-06-tour/poster/defs.png"] },
  { id: "next-apply", seconds: 5, atLeast: 4, heading: "4. Apply or pass", narration: "Using a function, or using it as a value.", lines: [], images: ["work/al-06-tour/poster/apply.png"] },
  { id: "next-axes", seconds: 5, atLeast: 4, heading: "5 to 7. Axes, power, lambdas", narration: "Then the axis of a function, powers, and lambdas.", lines: [], images: ["work/al-06-tour/poster/axes.png"] },
  { id: "next-system", seconds: 5, atLeast: 4, heading: "8 and 9. System names, and the guard", narration: "System names, and the guard.", lines: [], images: ["work/al-06-tour/poster/system.png"] },
  { id: "next-ascii", seconds: 5, atLeast: 4, heading: "10. ASCII input, rendered", narration: "What you type, and what is drawn.", lines: [], images: ["work/al-06-tour/poster/ascii.png"] },
  { id: "next-trains", seconds: 6, atLeast: 5, heading: "11. Trains", narration: "And trains, which we met today.", lines: [], images: ["work/al-06-tour/poster/trains.png"] },
  { id: "exercise", seconds: 14, heading: "Before the next episode", narration: "Before the next episode, try this. Find the mean of three, one, four, one, five, nine in two of these languages. The links are in the description.", lines: ["the mean of 3 1 4 1 5 9", "in two of the five languages", "links in the description"] },
  S("cta"), S("close"),
];
const { scenes: _, youtube, poster, ...h } = l;
h.music = { file: "/Users/mike/github/softwarewrighter/music-pipe-rs/work/video-beds/maple-strut.wav", intro: { seconds: 5, fadeOut: 0.5 }, outro: { seconds: 5, fadeIn: 0.5 }, slides: { volume: 0.3, fade: 0.4, starts: [5, 10, 15] } };
const lesson = { ...h, slug: "al-06-tour", title: "The array language family", summary: "Array languages, episode 6: APL, J, K, BQN and X_eTaL side by side. Running totals, reverse, reading order and a mean as a train in all five; dynamic types against static, inferred ones; and X_eTaL source as typed and as drawn.", order: 105, poster: 7080, youtube: "q1LR7SaIg2g", brand: "Array Languages: episode 6", scenes };
writeFileSync("lessons/al-06-tour/lesson.json", JSON.stringify(lesson, null, 2) + "\n");

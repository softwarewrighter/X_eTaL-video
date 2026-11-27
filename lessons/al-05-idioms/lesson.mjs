// lessons/al-05-idioms/lesson.json from this file: node lessons/al-05-idioms/lesson.mjs (from the repository root).
// Every array drawn is what the pinned bin/xetal --box prints (APL2 DISPLAY frames), never typed; an
// X_eTaL error is the first line xetal prints for it. Examples are notebook style: each argument and
// the result as a box, side by side (a scalar is a bare number). The loops are Rust, as in episode 02,
// shown as they are ({ code }). Each idiom follows research2's pattern (Video 06): the problem, a
// loop, the idiom, its picture, the trade off.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
const prelude = "x := 3 1 4 1 5 9\ns := 2 4 6 8\nvotes := 2 3 2 1 2 3\nids := 101 102 103 104\nages := 40 25 33 19\n";
const dir = mkdtempSync(tmpdir() + "/al05-");
const run = (expr) => {
  writeFileSync(dir + "/b.xtl", prelude + expr + "\n");
  try { return { box: execFileSync("bin/xetal", ["--box", "run", dir + "/b.xtl"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).replace(/\n+$/, "") }; }
  catch (e) { return { code: String(e.stderr).split("\n")[0] }; }
};
// Notebook style: boxes and operators side by side, each centered on the tallest.
// A part is an X_eTaL expression to draw ("=x"), or text as it is (an operator, an error).
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
const X_ = "{X_eTaL|@xtl}";
const err = (e) => run(e).code;
// The expressions, once.
const scan = "'+ s_\\ x", mscan = "'m_ax s_\\ x";
const d1 = "1 d_rop x", d2 = "-1 d_rop x", diff = "(1 d_rop x) - -1 d_rop x", rise = "(1 d_rop x) > -1 d_rop x";
const mean = "('+ r_/ s) / t_ally s", centered = "(f_loat s) - ('+ r_/ s) / t_ally s";
const where = "w_here x > 3", argmax = "x i_ndexOf 'm_ax r_/ x", member = "x m_ember? 1 5", win = "3 '+ n_wise x", grade = "g_rade ages", byAge = "(g_rade ages) s_elect ids";
const tab = "(u_nique votes) '= t_able votes", counts = "'+ r_/_2 (u_nique votes) '= t_able votes";
const scenes = [
  { id: "title", seconds: 8, heading: "Array idioms", lines: ["Thinking without loops"] },
  { id: "recap", seconds: 12, heading: "Last time", narration: "In the last episode, arrays of different shapes met. Today, we look at idioms. An idiom is a short phrase for a pattern that keeps coming back.", lines: [], slide: { type: "points", steps: [0, 0, 1], items: [{ text: "Last time", sub: "when shapes meet" }, { text: "Today: idioms", sub: "short phrases for common patterns" }] } },
  { id: "pattern", seconds: 12, heading: "One pattern for each idiom", narration: "Each idiom today follows one pattern. First the problem. Next comes a loop that solves it. Then the idiom, and what it costs.", lines: [], slide: { type: "flow", steps: [0, 0, 1, 2, 3], items: [{ text: "The problem" }, { text: "A loop" }, { text: "The idiom" }, { text: "The trade off" }] } },
  // The idioms already met (episodes 02 to 04), briefly.
  { id: "known-sum", seconds: 12, heading: "Idioms you have met", narration: "You have met some idioms already. Plus reduce sums a list. A comparison, then a sum, counts the matches.", lines: [], panel: panel([x("'+ r_/ x"), H("=x", "→", "='+ r_/ x"), x("'+ r_/ x > 3"), H("=x > 3", "→", "='+ r_/ x > 3")], [[], [0, 1], [2, 3]]) },
  { id: "known-order", seconds: 10, heading: "Idioms you have met", narration: "Reverse and rotate rearrange the items. No index appears anywhere.", lines: [], panel: panel([x("r_ev x"), H("=x", "→", "=r_ev x"), x("2 o_- x"), H("=x", "→", "=2 o_- x")], [[0, 1, 2, 3], [0, 1, 2, 3]]) },
  { id: "break-1", seconds: 5, heading: "Four new idioms", lines: [], slide: { type: "points", items: [{ text: "Running totals" }, { text: "Adjacent changes" }, { text: "Normalize values" }, { text: "Count occurrences" }] } },
  // Running totals: a scan.
  { id: "running-loop", seconds: 14, heading: "Running totals", narration: "The first new problem is running totals. Each item becomes the sum of everything up to it. A loop keeps a total, and saves it after each step.", lines: [], panel: panel([o("let mut total = 0;"), o("for v in &x {"), o("    total += v;"), o("    out.push(total);"), o("}")], [[], [], [0, 1, 2, 3, 4]]) },
  { id: "running-scan", seconds: 12, heading: "Running totals: scan", narration: `In ${X_}, this is a scan. Plus scan keeps every running sum. The last one is the total.`, lines: [], panel: panel([x(scan), H("=x", "→", "=" + scan)], [[0], [0, 1], [1]]) },
  { id: "running-max", seconds: 12, heading: "Running totals: scan", narration: "Scan works with any function. Max scan keeps the largest value so far. The trade off is that scan keeps every step, not only the last.", lines: [], panel: panel([x(mscan), H("=x", "→", "=" + mscan)], [[0], [0, 1], [1]]) },
  // Adjacent changes: shift by dropping, then subtract.
  { id: "adjacent-loop", seconds: 14, heading: "Adjacent changes", narration: "Next, adjacent changes. We want how much each item differs from the one before it. A loop starts at the second item, and looks back one.", lines: [], panel: panel([o("for i in 1..x.len() {"), o("    out.push(x[i] - x[i - 1]);"), o("}")], [[], [], [0, 1, 2]]) },
  { id: "adjacent-shift", seconds: 14, heading: "Adjacent changes: shift", narration: "The idiom shifts the list instead of looking back. Drop the first item. Then drop the last. The two lists line up, each item beside the one before it.", lines: [], panel: panel([x(d1), H("=x", "→", "=" + d1), x(d2), H("=x", "→", "=" + d2)], [[], [0, 1], [2, 3], [0, 1, 2, 3]]) },
  { id: "adjacent-subtract", seconds: 14, heading: "Adjacent changes: subtract", narration: "Subtract them, item by item. The result has one item fewer than the list. Compare instead, and you find every rise.", lines: [], panel: panel([x(diff), H("=" + d1, "-", "=" + d2, "=", "=" + diff), x(rise), H("=" + d1, ">", "=" + d2, "=", "=" + rise)], [[0, 1], [1], [2, 3]]) },
  { id: "break-2", seconds: 5, heading: "Scan and shift", lines: [], slide: { type: "flow", items: [{ text: "Running totals", xtl: scan }, { text: "Adjacent changes", xtl: diff }] } },
  // Normalize: an aggregate, then an item by item step.
  { id: "normalize-loop", seconds: 16, heading: "Normalize values", narration: "Next, normalize values. Subtract the average from every item. A loop needs two passes. The first finds the average. The second subtracts it.", lines: [], panel: panel([o("let mean = s.iter().sum::<f64>() / n;"), o("for v in &s {"), o("    out.push(v - mean);"), o("}")], [[], [], [], [0], [1, 2, 3]]) },
  { id: "normalize-idiom", seconds: 16, heading: "Normalize: aggregate, then each item", narration: "The idiom is an aggregate, then an item by item step. Reduce and divide give the average, a single value. {Scalar|@scalar} extension, from the last episode, does the rest.", lines: [], panel: panel([x(mean), H("=s", "→", "=" + mean), x(centered), H("=s", "-", "=" + mean, "=", "=" + centered)], [[0, 1], [0, 1], [2, 3]]) },
  { id: "normalize-types", seconds: 14, heading: "Normalize: the types", narration: `One detail. Division gives a float, and these items are integers. In ${X_}, the two do not mix. Float turns the integers into floats first.`, lines: [], panel: panel([x("s - " + mean), o(err("s - " + mean)), x(centered)], [[0], [0, 1], [1], [2]]) },
  // Count occurrences: unique, an equality table, a reduce.
  { id: "count-loop", seconds: 14, heading: "Count occurrences", narration: "Last, count occurrences. We want how many times each value appears. A loop keeps a map from each value to its count.", lines: [], panel: panel([o("let mut counts = HashMap::new();"), o("for v in &votes {"), o("    *counts.entry(v).or_insert(0) += 1;"), o("}")], [[], [], [0, 1, 2, 3]]) },
  { id: "count-unique", seconds: 10, heading: "Count occurrences: unique", narration: "The idiom starts with unique. It gives each value once, in the order they first appear.", lines: [], panel: panel([x("u_nique votes"), H("=votes", "→", "=u_nique votes")], [[0, 1], [0, 1]]) },
  { id: "count-table", seconds: 12, heading: "Count occurrences: a table", narration: "Equals table compares each value with every vote. Each row marks where one value appears.", lines: [], panel: panel([x(tab), H("=u_nique votes", "'= table", "=votes", "=", "=" + tab)], [[0, 1], [1]]) },
  { id: "count-sum", seconds: 10, heading: "Count occurrences: sum each row", narration: "Sum along each row, and you have the counts. Three twos, two threes, and one one.", lines: [], panel: panel([x(counts), H("=" + tab, "→ sum each row", "=" + counts)], [[0, 1], [1]]) },
  { id: "count-tradeoff", seconds: 12, heading: "Count occurrences: the trade off", narration: "The table has a cell for every value and every vote. That is the trade off. For a long list, it is a lot of cells.", lines: [], slide: { type: "points", steps: [0, 1, 1], items: [{ text: "One cell for each value and vote", sub: "3 values, 6 votes: 18 cells" }, { text: "Long lists", sub: "a lot of cells" }] } },
  { id: "break-3", seconds: 5, heading: "Four idioms", lines: [], slide: { type: "points", items: [{ text: "Running totals", sub: "scan" }, { text: "Adjacent changes", sub: "shift and subtract" }, { text: "Normalize values", sub: "aggregate, then each item" }, { text: "Count occurrences", sub: "unique, table, reduce" }] } },
  // Four more idioms (the author, 2026-11-26: more idioms before the next episode), each from the pinned reference (Search and order; n_wise).
  { id: "break-4", seconds: 5, heading: "Four more idioms", lines: [], slide: { type: "points", items: [{ text: "Find positions" }, { text: "Membership" }, { text: "Moving windows" }, { text: "Sort by a key" }] } },
  { id: "positions-loop", seconds: 14, heading: "Find positions", narration: "Four more idioms. First, find the positions of the matches. A loop checks each item, and keeps the index of each match.", lines: [], panel: panel([o("for (i, v) in x.iter().enumerate() {"), o("    if *v > 3 { out.push(i + 1); }"), o("}")], [[], [], [0, 1, 2]]) },
  { id: "positions-where", seconds: 16, heading: "Find positions: where", narration: "The idiom asks the question of every item first. Where turns the ones into positions. Positions count from one. Index of finds where a value first appears. Here, it finds the largest.", lines: [], panel: panel([x(where), H("=x > 3", "→", "=" + where), x(argmax), H("=x", "→", "=" + argmax)], [[0, 1], [0, 1], [1], [2, 3], [2, 3]]) },
  { id: "member-loop", seconds: 14, heading: "Membership", narration: "Next, membership. We want to know if each item is one of a few allowed values. A loop checks each item against the whole set.", lines: [], panel: panel([o("for v in &x {"), o("    out.push(allowed.contains(v));"), o("}")], [[], [], [0, 1, 2]]) },
  { id: "member-idiom", seconds: 14, heading: "Membership: member", narration: "Member asks that of every item at once. The result is a mask of ones and zeros. A mask can count, choose, or find positions.", lines: [], panel: panel([x(member), H("=x", "∈", "=1 5", "=", "=" + member)], [[0, 1], [1], [1]]) },
  { id: "window-loop", seconds: 14, heading: "Moving windows", narration: "Next, moving windows. We want the sum of every three items in a row. A loop slides a window along the list.", lines: [], panel: panel([o("for i in 0..x.len() - 2 {"), o("    out.push(x[i] + x[i + 1] + x[i + 2]);"), o("}")], [[], [], [0, 1, 2]]) },
  { id: "window-idiom", seconds: 14, heading: "Moving windows: n wise", narration: "{N-wise|En wise} reduces every window of a given size. Plus, three at a time, adds each group of neighbors. The result is two items shorter.", lines: [], panel: panel([x(win), H("=x", "→", "=" + win)], [[0], [0, 1], [1]]) },
  { id: "sort-loop", seconds: 14, heading: "Sort by a key", narration: "Last, sort by a key. We have people, and their ages. We want the people in order of age. A loop pairs them, sorts the pairs, and keeps the people.", lines: [], panel: panel([o("let mut p: Vec<_> = ids.iter().zip(&ages).collect();"), o("p.sort_by_key(|(_, age)| **age);"), o("let out: Vec<_> = p.iter().map(|(id, _)| **id).collect();")], [[], [], [0], [0, 1, 2]]) },
  { id: "sort-grade", seconds: 16, heading: "Sort by a key: grade", narration: "Grade gives the positions that would sort the ages. Select takes the people at those positions. The youngest comes first. One grade can order many lists the same way.", lines: [], panel: panel([x(grade), H("=ages", "→", "=" + grade), x(byAge), H("=" + grade, "select", "=ids", "=", "=" + byAge)], [[0, 1], [2, 3], [3], [2, 3]]) },
  { id: "break-5", seconds: 5, heading: "Four more idioms", lines: [], slide: { type: "points", items: [{ text: "Find positions", sub: "where, index of" }, { text: "Membership", sub: "member" }, { text: "Moving windows", sub: "n wise" }, { text: "Sort by a key", sub: "grade, then select" }] } },
  // research2's concluding narration, in short sentences.
  { id: "conclusion", seconds: 24, heading: "More than a shorter loop", narration: "An array idiom is more than a shorter spelling of a loop. It captures a pattern that keeps coming back. Once we see the pattern, we can reason about the whole operation. We can reuse it, and test it. Often we can make it faster, apart from the program that uses it. The goal is not to remove every loop. The goal is to say the problem at the most useful level.", lines: [], slide: { type: "points", steps: [0, 0, 1, 2, 2, 3, 3], items: [{ text: "A pattern", sub: "not just a shorter loop" }, { text: "Reason about the whole", sub: "the operation at once" }, { text: "Reuse, test, speed up", sub: "apart from the program" }, { text: "The most useful level", sub: "not no loops at any cost" }] } },
  // The next episode: research2 Video 07 (series 06, moved up, the author, 2026-11-26); a list only, as al-04 next-idioms.
  { id: "next", seconds: 14, heading: "Next time: the language family", narration: "Next time, we tour the family of array languages. We start with {APL|@apl}. After it come {J|Jay} and {K|Kay}. After that comes {BQN|@bqn}. We end with {X_eTaL|@xtl}. We see what each one chose.", lines: [], slide: { type: "points", steps: [0, 0, 2, 3, 4, 4], items: [{ text: "APL", sub: "arrays as the vocabulary" }, { text: "J", sub: "ASCII notation, composition" }, { text: "K", sub: "a compact vocabulary" }, { text: "BQN", sub: "a modern notation, combinators" }, { text: "X_eTaL", sub: "checked types, rendered ASCII source" }] } },
  // research2's exercise for Video 06.
  { id: "exercise", seconds: 16, heading: "Before the next episode", narration: "Before the next episode, try this. Take three, one, four, one, five, nine. Find its sum and its largest value. Find its running totals. Count the values greater than three. Then find the adjacent differences.", lines: ["3 1 4 1 5 9", "sum, largest, running totals", "how many above 3, adjacent differences"] },
  S("cta"), S("close"),
];
const { scenes: _, youtube, poster, ...h } = l;
h.music = { file: "/Users/mike/github/softwarewrighter/music-pipe-rs/work/video-beds/prelude-pulse.wav", intro: { seconds: 5, fadeOut: 0.5 }, outro: { seconds: 5, fadeIn: 0.5 }, slides: { volume: 0.3, fade: 0.4, starts: [5, 10, 15] } };
const out = { ...h, slug: "al-05-idioms", title: "Array idioms", summary: "Array languages, episode 5: thinking without loops. Running totals with a scan, adjacent changes by shifting, normalizing with an aggregate then each item, counting occurrences with unique and a table; then positions, membership, moving windows and sorting by a key; each beside the loop it replaces, and what it costs.", order: 104, brand: "Array Languages: episode 5", scenes };
writeFileSync("lessons/al-05-idioms/lesson.json", JSON.stringify(out, null, 2) + "\n");

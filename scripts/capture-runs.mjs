// The recordings of a lesson's page (scripts/capture.mjs makes them,
// scripts/props.mjs places them): scenes with a capture, one after
// another, on the same page, are one recording, a "run".
export function runsOf(lesson) {
  const runs = [];
  lesson.scenes.forEach((s, i) => {
    if (!s.capture) return;
    const url = s.capture.url || null;
    const last = runs[runs.length - 1];
    if (last && last.end === i - 1 && last.url === url) { last.scenes.push(s); last.end = i; }
    else runs.push({ url, first: i, end: i, scenes: [s] });
  });
  return runs;
}

// Where run k's recording goes, under remotion/public (no extension).
export const captureName = (slug, format, k) => `captures/${slug}-${format}${k ? `-${k + 1}` : ""}`;

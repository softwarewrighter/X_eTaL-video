// The pictures for episode 06's preview of episode 07: X_eTaL's syntax poster (the README's
// syntax guide, ../X_eTaL/pages/poster/index.html), its panels in groups, at twice the size.
//   node lessons/al-06-tour/poster.mjs   (from the repository root; writes work/al-06-tour/poster/)
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const root = process.cwd(), out = root + "/work/al-06-tour/poster";
mkdirSync(out, { recursive: true });
const { chromium } = createRequire(root + "/remotion/package.json")("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.goto("file://" + root + "/../X_eTaL/pages/poster/index.html");
await page.waitForTimeout(1500);
await page.screenshot({ path: out + "/poster.png", fullPage: true, scale: "css" });
// each picture: the panels it shows (the poster's section.pN), with a margin
const groups = { names: [1], defs: [2, 3], apply: [4], axes: [5, 6, 7], system: [8, 9], ascii: [10], trains: [11] };
for (const [name, ps] of Object.entries(groups)) {
  const r = await page.evaluate((ps) => {
    const bs = ps.map((p) => document.querySelector(`section.p${p}`).getBoundingClientRect());
    const x0 = Math.min(...bs.map((b) => b.left)), y0 = Math.min(...bs.map((b) => b.top + scrollY));
    const x1 = Math.max(...bs.map((b) => b.right)), y1 = Math.max(...bs.map((b) => b.bottom + scrollY));
    return { x: x0 - 12, y: y0 - 12, width: x1 - x0 + 24, height: y1 - y0 + 24 };
  }, ps);
  await page.screenshot({ path: `${out}/${name}.png`, clip: r, fullPage: true });
}
await browser.close();
console.log(`poster: ${out}/ (poster and ${Object.keys(groups).length} groups)`);

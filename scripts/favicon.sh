#!/usr/bin/env bash
# Render images/favicon.ico (16, 32 and 64 pixels) from
# images/favicon.svg, drawn by headless Chromium (Playwright, from
# remotion/node_modules) so the italic X is the browser's own, then
# packed by ImageMagick. Run after changing the SVG; the .ico is tracked.
#   scripts/favicon.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
mkdir -p "$root/work/favicon"
node --input-type=module - "$root" <<'JS'
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[2];
const { chromium } = createRequire(join(root, "remotion", "package.json"))("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.setContent(`<body style="margin:0">${readFileSync(join(root, "images", "favicon.svg"), "utf8")}</body>`);
await page.screenshot({ path: join(root, "work", "favicon", "512.png") });
await browser.close();
JS
magick "$root/work/favicon/512.png" -define icon:auto-resize=64,32,16 "$root/images/favicon.ico"
echo "favicon: images/favicon.ico"

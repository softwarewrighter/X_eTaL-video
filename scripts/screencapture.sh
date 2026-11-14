#!/usr/bin/env bash
# Retake images/screencapture.png, the README's picture of the live
# page: the published site (or URL) in headless Chromium (Playwright,
# from remotion/node_modules) at 1280x760. Run after just publish.
#   scripts/screencapture.sh [URL]
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
url="${1:-https://softwarewrighter.github.io/X_eTaL-video/}"
node --input-type=module - "$root" "$url" <<'JS'
import { createRequire } from "node:module";
import { join } from "node:path";
const [root, url] = process.argv.slice(2);
const { chromium } = createRequire(join(root, "remotion", "package.json"))("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
await page.goto(url);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: join(root, "images", "screencapture.png") });
await browser.close();
JS
echo "screencapture: images/screencapture.png ($url)"

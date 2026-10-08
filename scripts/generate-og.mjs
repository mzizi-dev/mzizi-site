#!/usr/bin/env node
/**
 * Render the share card from scripts/og/card.html at 1200 x 630, the size
 * every major link preview crops to: the dark theme to public/og.png, which
 * every page names as its og:image, and the light theme to
 * public/og-light.png, for posts on a light background.
 *
 * Not a build step, for the same reason as generate-previews.mjs: the build
 * should not depend on a headless browser and a font request succeeding. Run
 * it when the card changes and commit the PNGs.
 *
 * Usage: node scripts/generate-og.mjs
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const card = pathToFileURL(path.join(here, "og", "card.html")).href;
const publicDir = path.join(here, "..", "public");
const themes = [
  ["dark", "og.png"],
  ["light", "og-light.png"],
];

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  for (const [theme, file] of themes) {
    await page.goto(`${card}?theme=${theme}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const missing = await page.evaluate(() =>
      ["Noto Sans", "JetBrains Mono"].filter(
        (f) => !document.fonts.check(`16px "${f}"`),
      ),
    );
    if (missing.length > 0) {
      throw new Error(`fonts did not load: ${missing.join(", ")}`);
    }
    const out = path.join(publicDir, file);
    await page.screenshot({ path: out, type: "png" });
    console.log(`wrote ${path.relative(process.cwd(), out)}`);
  }
} finally {
  await browser.close();
}

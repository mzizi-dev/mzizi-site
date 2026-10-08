#!/usr/bin/env node
/**
 * Render the Mzizi mark's PNGs from the SVGs in public/brand/:
 * public/apple-touch-icon.png (180), public/favicon-32.png (32) and
 * public/brand/mzizi-badge-512.png from the badge, and
 * public/brand/mzizi-mark-512.png from the line mark on a transparent ground.
 * The SVGs are the source; run this when one changes and commit the PNGs.
 *
 * Usage: node scripts/generate-brand.mjs
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");
const jobs = [
  ["brand/mzizi-badge.svg", "apple-touch-icon.png", 180],
  ["brand/mzizi-badge.svg", "favicon-32.png", 32],
  ["brand/mzizi-badge.svg", "brand/mzizi-badge-512.png", 512],
  ["brand/mzizi-mark.svg", "brand/mzizi-mark-512.png", 512],
];

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
try {
  for (const [src, out, size] of jobs) {
    const svg = (await readFile(path.join(pub, src), "utf-8")).replace(
      'width="512" height="512"',
      `width="${size}" height="${size}"`,
    );
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    await page.setContent(
      `<body style="margin:0;background:transparent">${svg}</body>`,
    );
    await page.screenshot({
      path: path.join(pub, out),
      omitBackground: true,
    });
    await page.close();
    console.log(`wrote public/${out}`);
  }
} finally {
  await browser.close();
}

#!/usr/bin/env node
/**
 * Render the Mzizi mark's PNGs from the SVGs in public/brand/:
 * public/apple-touch-icon.png (180), public/favicon-32.png (32) and
 * public/brand/mzizi-badge-512.png from the badge, and
 * public/brand/mzizi-mark-512.png from the line mark on a transparent ground,
 * public/icons/icon-192.png and icon-512.png (the badge, for the web manifest),
 * public/icons/icon-maskable-512.png (full-bleed hematite with the mark inside the
 * 80% safe zone, so a launcher's mask never crops it), and public/favicon.ico
 * (16, 32 and 48 px PNG frames: the file crawlers and many clients request by path).
 * The SVGs are the source; run this when one changes and commit the outputs.
 *
 * Usage: node scripts/generate-brand.mjs
 */
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");
const jobs = [
  ["brand/mzizi-badge.svg", "apple-touch-icon.png", 180],
  ["brand/mzizi-badge.svg", "favicon-32.png", 32],
  ["brand/mzizi-badge.svg", "brand/mzizi-badge-512.png", 512],
  ["brand/mzizi-mark.svg", "brand/mzizi-mark-512.png", 512],
  ["brand/mzizi-badge.svg", "icons/icon-192.png", 192],
  ["brand/mzizi-badge.svg", "icons/icon-512.png", 512],
  ["brand/mzizi-badge-maskable.svg", "icons/icon-maskable-512.png", 512],
];
const icoSizes = [16, 32, 48];

await mkdir(path.join(pub, "icons"), { recursive: true });

/** An ICO container holding one PNG frame per size (valid since Windows Vista and in every browser). */
function ico(frames) {
  const head = Buffer.alloc(6 + 16 * frames.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(frames.length, 4);
  let offset = head.length;
  frames.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i;
    head.writeUInt8(size, at);
    head.writeUInt8(size, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(png.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...frames.map((f) => f.png)]);
}

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
  const frames = [];
  const badge = await readFile(
    path.join(pub, "brand/mzizi-badge.svg"),
    "utf-8",
  );
  for (const size of icoSizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    await page.setContent(
      `<body style="margin:0;background:transparent">${badge.replace(
        'width="512" height="512"',
        `width="${size}" height="${size}"`,
      )}</body>`,
    );
    frames.push({ size, png: await page.screenshot({ omitBackground: true }) });
    await page.close();
  }
  await writeFile(path.join(pub, "favicon.ico"), ico(frames));
  console.log("wrote public/favicon.ico");
} finally {
  await browser.close();
}

#!/usr/bin/env node
/**
 * Render a share card (og:image / twitter:image) for each top-level page from
 * scripts/og/card.html, at 1200 x 630, the size every major link preview crops
 * to. Each card carries the page's own heading and URL.
 *
 * Reads the built site, so run `pnpm build` first. For each `dist/<page>.html`
 * (404 aside) it takes the page's <h1> and writes public/og/<page>.png, dark;
 * the landing page also gets public/og/index-light.png, for posts on a light
 * background. src/data/og-cards.json maps each page with a card to its title,
 * and Site.astro reads it: a component or skill page uses its section's card, and
 * any page without one uses the landing page's.
 *
 * Not a build step, for the same reason as generate-previews.mjs: the build
 * should not depend on a headless browser and a font request succeeding. Run
 * it when a heading or the card changes, then rebuild, and commit the PNGs
 * and the manifest.
 *
 * Usage: pnpm build && node scripts/generate-og.mjs
 */
import { chromium } from "playwright";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const dist = path.join(root, "dist");
const outDir = path.join(root, "public", "og");
const manifest = path.join(root, "src", "data", "og-cards.json");
const card = pathToFileURL(path.join(here, "og", "card.html")).href;

/** The text of a page's first <h1>, tags and entities removed. */
function heading(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const pages = [];
for (const file of (await readdir(dist)).sort()) {
  if (!file.endsWith(".html") || file === "404.html") continue;
  const slug = file.replace(/\.html$/, "");
  const h1 = heading(await readFile(path.join(dist, file), "utf-8"));
  if (!h1) throw new Error(`dist/${file} has no <h1>`);
  // The landing page's heading is a sentence; its card is the name.
  const title = slug === "index" ? "Mzizi" : h1.replace(/\.$/, "");
  pages.push({ slug, title, path: slug === "index" ? "/" : `/${slug}` });
}
// The landing page is figure 1; the rest follow in file order.
pages.sort((a, b) => (a.slug === "index" ? -1 : b.slug === "index" ? 1 : 0));

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
try {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  const shots = pages.map((p, i) => ({
    ...p,
    fig: i + 1,
    theme: "dark",
    file: `${p.slug}.png`,
  }));
  shots.push({ ...shots[0], theme: "light", file: "index-light.png" });
  for (const s of shots) {
    const q = new URLSearchParams({
      theme: s.theme,
      title: s.title,
      path: s.path,
      fig: String(s.fig),
    });
    await page.goto(`${card}?${q}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const missing = await page.evaluate(() =>
      ["Noto Sans", "JetBrains Mono"].filter(
        (f) => !document.fonts.check(`16px "${f}"`),
      ),
    );
    if (missing.length > 0) {
      throw new Error(`fonts did not load: ${missing.join(", ")}`);
    }
    await page.screenshot({ path: path.join(outDir, s.file), type: "png" });
    console.log(`wrote public/og/${s.file}  ${s.title}  (${s.path})`);
  }
  await writeFile(
    manifest,
    `${JSON.stringify(Object.fromEntries(pages.map((p) => [p.slug, p.title])), null, 2)}\n`,
  );
  console.log(`wrote ${path.relative(root, manifest)}`);
} finally {
  await browser.close();
}

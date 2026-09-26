#!/usr/bin/env node
/**
 * Generate a static screenshot of each registry component's live playground
 * preview, for the visual cards on /components.
 *
 * Deliberately NOT a build-time step: hitting a live headless browser against
 * 577 pages on every `astro build` would make the build slow and dependent on
 * a production Worker responding correctly 577 times in a row. Instead this
 * runs on demand (locally, or from a scheduled CI job) and commits the result
 * as ordinary static assets under `public/previews/`, the same way
 * `registry-source.generated.json` and friends are generated-then-committed
 * rather than fetched live.
 *
 * Usage:
 *   node scripts/generate-previews.mjs            # only components missing a screenshot
 *   node scripts/generate-previews.mjs --force     # regenerate everything
 *   node scripts/generate-previews.mjs button badge  # only these components
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "previews");
// In `src/`, not `public/`: `components.astro` reads it via `import.meta.glob`
// so a repo that has never run this script gets an empty match rather than a
// missing-file build error. The images themselves stay in `public/previews/`
// since those ARE meant to be served as-is at `/previews/<name>.jpg`.
const MANIFEST_PATH = path.join(__dirname, "..", "src", "data", "component-previews.json");

// Where the components list comes from, and where the actual rendering
// happens. These are deliberately two different hosts: the registry API is
// the stable data source (`src/lib/registry.ts` reads the same one), but the
// interactive playground that renders a live instance of each component only
// exists on the registry's own Next.js app, not on the API surface.
const API_ORIGIN = process.env.MZIZI_API_ORIGIN ?? "https://api.mzizi.dev";
const PLAYGROUND_ORIGIN =
  process.env.MZIZI_PLAYGROUND_ORIGIN ?? "https://mzizi-registry.nyuchi.workers.dev";

const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const force = process.argv.includes("--force");
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--")));

async function fetchComponentNames() {
  const res = await fetch(`${API_ORIGIN}/v1/ui`);
  if (!res.ok) {
    throw new Error(`fetching ${API_ORIGIN}/v1/ui: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.items.map((item) => item.name);
}

async function existingNames() {
  if (!existsSync(OUT_DIR)) return new Set();
  const files = await readdir(OUT_DIR);
  return new Set(
    files.filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, "")),
  );
}

/**
 * Find the rendered preview panel on a `/playground/<name>` page.
 *
 * There is no stable test id to target, so this locates the "Preview" tab
 * button (unique, visible text) and takes the panel that follows its header
 * row — the structure `ComponentPreview` renders regardless of Tailwind class
 * churn. If that fails (component has no demo, or the page shape changes),
 * falls back to screenshotting the whole `<main>` rather than producing
 * nothing.
 */
async function locatePreviewPanel(page) {
  const tabButton = page.getByRole("button", { name: "Preview", exact: true });
  if (await tabButton.count()) {
    const panel = tabButton.locator(
      "xpath=ancestor::div[contains(@class,'border-b')][1]/following-sibling::div[1]",
    );
    if (await panel.count()) return panel.first();
  }
  return page.locator("main");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });

  let names = await fetchComponentNames();
  if (only.size > 0) names = names.filter((n) => only.has(n));

  const have = force ? new Set() : await existingNames();
  const todo = names.filter((n) => !have.has(n));

  console.log(
    `${names.length} components total, ${have.size} already have a preview, ` +
      `generating ${todo.length}${only.size ? ` (filtered to: ${[...only].join(", ")})` : ""}.`,
  );

  if (todo.length === 0) {
    await writeManifest(names, have);
    return;
  }

  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });

  const succeeded = new Set(have);
  const failed = [];

  for (const name of todo) {
    const url = `${PLAYGROUND_ORIGIN}/playground/${name}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      const panel = await locatePreviewPanel(page);
      await panel.screenshot({
        path: path.join(OUT_DIR, `${name}.jpg`),
        type: "jpeg",
        quality: 82,
      });
      succeeded.add(name);
      console.log(`  ok    ${name}`);
    } catch (error) {
      failed.push(name);
      console.log(`  fail  ${name} — ${error instanceof Error ? error.message : error}`);
    }
  }

  await browser.close();
  await writeManifest(names, succeeded);

  if (failed.length > 0) {
    console.log(`\n${failed.length} component(s) failed and were left without a preview:`);
    for (const name of failed) console.log(`  - ${name}`);
  }
}

async function writeManifest(allNames, haveNames) {
  const manifest = Object.fromEntries(allNames.map((n) => [n, haveNames.has(n)]));
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nwrote ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

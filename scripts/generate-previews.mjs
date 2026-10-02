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
import { mkdir, writeFile, readdir, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "previews");
// In `src/`, not `public/`: `components.astro` reads it via `import.meta.glob`
// so a repo that has never run this script gets an empty match rather than a
// missing-file build error. The images themselves stay in `public/previews/`
// since those ARE meant to be served as-is at `/previews/<name>.jpg`.
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "component-previews.json",
);

// Where the components list comes from, and where the actual rendering
// happens. These are deliberately two different hosts: the registry API is
// the stable data source (`src/lib/registry.ts` reads the same one), and the
// rendering needs a `/playground/<name>` page that draws a live instance of
// each component. The registry's own Next.js app used to be that page, on
// mzizi-registry.nyuchi.workers.dev. mzizi-registry removed the app on
// 2026-10-02, and its Worker is being deleted, so there is no default any
// more: the committed screenshots stay as they are (each manifest is dated),
// and regenerating them needs a renderer named in MZIZI_PLAYGROUND_ORIGIN.
const API_ORIGIN = process.env.MZIZI_API_ORIGIN ?? "https://api.mzizi.dev";
const PLAYGROUND_ORIGIN = process.env.MZIZI_PLAYGROUND_ORIGIN;
if (!PLAYGROUND_ORIGIN) {
  console.error(
    "generate-previews: set MZIZI_PLAYGROUND_ORIGIN to a host that serves\n" +
      "  /playground/<name>. The registry app that used to (mzizi-registry's\n" +
      "  Next.js app) was removed on 2026-10-02, so there is no default.",
  );
  process.exit(1);
}

const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const force = process.argv.includes("--force");
const JOBS = Number(process.env.PREVIEW_JOBS ?? 3);
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
 * churn. If there is no such panel (a `registry:lib` or `registry:hook` item
 * has no demo), it returns null and the component gets no preview. An earlier
 * version fell back to screenshotting the whole `<main>`, which put a picture
 * of the registry app's chrome on a card as if it were the component.
 */
async function locatePreviewPanel(page) {
  const tabButton = page.getByRole("button", { name: "Preview", exact: true });
  if (await tabButton.count()) {
    const panel = tabButton.locator(
      "xpath=ancestor::div[contains(@class,'border-b')][1]/following-sibling::div[1]",
    );
    if (await panel.count()) return panel.first();
  }
  return null;
}

/**
 * Below this many bytes, a JPEG of the 800x500 panel is an empty canvas or a
 * lone unlabelled shape: the playground renders many items with no children
 * and no sample data. Measured on 2026-09-29: a blank panel is 1.8-2.5 KB, a
 * date picker with its sample date is 6.9 KB. A near-blank screenshot on a
 * card says "this component renders nothing", which is false, so it is
 * dropped and the card stays text-only.
 */
const BLANK_BYTES = 3500;

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

  const succeeded = new Set(have);
  const failed = [];
  const skipped = [];

  async function shoot(page, name) {
    const url = `${PLAYGROUND_ORIGIN}/playground/${name}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      const panel = await locatePreviewPanel(page);
      if (!panel) {
        skipped.push(name);
        console.log(
          `  skip  ${name} — no preview panel (no demo for this item)`,
        );
        return;
      }
      // The playground says so when it could not render the component at
      // all ("needs props to render meaningfully"); a screenshot of that
      // sentence is not a preview of anything.
      if (/needs props to render meaningfully/i.test(await panel.innerText())) {
        skipped.push(name);
        console.log(
          `  skip  ${name} — the playground could not render it without props`,
        );
        return;
      }
      // Its "Rendered with sample data…" caption belongs to the playground,
      // not the component, so it is hidden before the shot.
      await panel.evaluate((el) => {
        for (const p of el.querySelectorAll("p")) {
          if (
            (p.textContent ?? "").trim().startsWith("Rendered with sample data")
          ) {
            p.style.display = "none";
          }
        }
      });
      const file = path.join(OUT_DIR, `${name}.jpg`);
      await panel.screenshot({ path: file, type: "jpeg", quality: 82 });
      if ((await stat(file)).size < BLANK_BYTES) {
        await rm(file);
        skipped.push(name);
        console.log(`  skip  ${name} — the panel rendered blank`);
        return;
      }
      succeeded.add(name);
      console.log(`  ok    ${name}`);
    } catch (error) {
      failed.push(name);
      console.log(
        `  fail  ${name} — ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // A few pages at once: each one mostly waits on the network, and one at a
  // time made a full run take well over an hour.
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
      const page = await browser.newPage({
        viewport: { width: 800, height: 500 },
      });
      for (let name = queue.shift(); name; name = queue.shift()) {
        await shoot(page, name);
      }
      await page.close();
    }),
  );
  await browser.close();
  await writeManifest(names, succeeded);

  if (skipped.length > 0) {
    console.log(
      `\n${skipped.length} component(s) have no usable preview (no demo, or blank).`,
    );
  }
  if (failed.length > 0) {
    console.log(
      `\n${failed.length} component(s) failed and were left without a preview:`,
    );
    for (const name of failed) console.log(`  - ${name}`);
  }
}

async function writeManifest(allNames, haveNames) {
  // Dated, so the pages that show a screenshot can say when it was taken.
  const manifest = {
    generatedAt: new Date().toISOString().replace(/:\d\d\.\d+Z$/, "Z"),
    source: `${PLAYGROUND_ORIGIN}/playground/<name>`,
    previews: Object.fromEntries(allNames.map((n) => [n, haveNames.has(n)])),
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nwrote ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

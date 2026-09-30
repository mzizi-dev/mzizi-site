// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The front door. Astro, static output, no framework islands.
 *
 * `output: "static"`, and the registry pages read the API AT BUILD TIME rather
 * than in the browser. An earlier version of this comment argued the opposite —
 * that a build-time snapshot of a live number is a stale copy that still looks
 * authoritative. That worry is real and is answered rather than ignored: every
 * page rendered from the API stamps the minute it was read and links the
 * endpoint beside the number, so a reader can always see how old it is.
 *
 * The alternative was tried in this ecosystem and failed worse. `mzizi-console`
 * fetched on mount: the bundle loaded, the fetch returned 200, nothing threw,
 * CI was green, and the page painted nothing, because the island mounted
 * against an element that was not there. A dated fact beats a blank page, and
 * `scripts/verify-rendered.py` now fails the build if a page renders empty.
 *
 * No islands, and no client-side UI framework. The doctrine is Astro in
 * front, Rust first and TypeScript second underneath, and no third UI
 * framework in the browser (`mzizi-dev/agent-tools#82`; CHARTER.md in
 * `mzizi-dev/mzizi`). The owner's direction of 2026-09-30 is that this site
 * is built from `@bundu/ui` as far as it goes, and some of those primitives
 * (Button, Card, Badge, Tabs, Alert, Separator, Tooltip) are React
 * components. `@astrojs/react` renders them to static HTML AT BUILD TIME;
 * no page uses a `client:*` directive, so no React ships to the browser.
 * `scripts/verify-rendered.py` holds every page to rendering its content
 * with every <script> removed. The scripts that do ship are the bench, the
 * component filter and the header's drawer and search.
 *
 * Styling is Tailwind v4 over `@bundu/ui/styles/theme.css`, with the Mzizi
 * brand overlay (hematite, the owner's decision of 2026-09-30).
 *
 * `site` is mzizi.dev, which this site now serves.
 */
export default defineConfig({
  output: "static",
  site: "https://mzizi.dev",
  build: {
    // The Worker serves `dist/` as Static Assets. `format: "file"` emits
    // `/ecosystem.html` rather than `/ecosystem/index.html`, which the asset
    // server resolves from `/ecosystem` without a redirect hop. Same choice as
    // mzizi-console, for the same reason.
    format: "file",
  },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});

// @ts-check
import { defineConfig } from "astro/config";

/**
 * The front door. Astro, static output, no framework islands.
 *
 * `output: "static"` because every word on this site is prose that a human
 * wrote and a build step can render once. Nothing here reads the registry at
 * runtime — the pages that show live data are the console (`mzizi-console`)
 * and the API (`mzizi-api-gateway`), and duplicating their numbers into a
 * build-time snapshot would produce exactly the defect this ecosystem keeps
 * removing: a stale copy that still looks authoritative.
 *
 * There is no UI framework here and there will not be one. The doctrine is
 * Astro in front, Rust first and TypeScript second underneath, and no third
 * UI framework (`mzizi-dev/agent-tools#82`; see CHARTER.md in `mzizi-dev/mzizi`).
 * A landing page does not need an island, so it does not have one.
 *
 * `site` is the domain this is BUILT for, not the domain it currently serves.
 * mzizi.dev is served today by `mzizi-dev/mzizi-registry` on Vercel; see the
 * cutover section in README.md before changing that.
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
  devToolbar: { enabled: false },
});

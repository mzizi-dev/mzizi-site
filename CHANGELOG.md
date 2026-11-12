# Changelog

All notable changes to `mzizi-site`, the static Astro site at
[mzizi.dev](https://mzizi.dev), are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The site deploys on every merge to `main` and has no versioned releases, so
sections are dated by the day the change merged (UTC), newest first. Within a
section, entries sit under Added, Changed, Deprecated, Removed, Fixed or
Security, and anything that breaks a URL or an agent-facing file
(`llms.txt`, `/.well-known/*`) is marked **Breaking**.

**The rule (owner, 2026-09-30):** every pull request that changes a page, a
stated fact, an agent-facing file, a redirect, a dependency or a default adds
an entry under `## [Unreleased]` in the same pull request, saying what a reader
of the site will see differently. The `changelog / entry required` check fails
a pull request that doesn't. Pull requests that touch only `.github/`,
lockfiles or lint config pass without one, and pure CI, lint or typo pull
requests can carry the `no-changelog` label instead. When a dated section is
cut, the Unreleased entries move under it.

## [Unreleased]

### Added — /legal/privacy and /legal/terms (2026-11-12)

Owner direction (2026-11-12): mzizi.dev needs legal pages, the Claude plugin directory needs a privacy notice, and bundu.org and nyuchi.com already have theirs. No issue: owner-directed addition. **Flagged for the owner's review:** these are written from what the code does, not by a lawyer, and they name the Bundu Foundation's and Nyuchi's notices as the umbrella.

- **Added, `/legal/privacy`.** What mzizi.dev, docs.mzizi.dev, api.mzizi.dev, mcp.mzizi.dev and the Claude plugin collect: the site sets no cookies and runs no analytics (it loads Google Fonts), the API has no database, the MCP server limits requests per IP address and records an issue report sent with `mzizi_report_issue`, docs is hosted by Mintlify. Links the Bundu Foundation's and Nyuchi's privacy notices; requests go to support@bundu.org.
- **Added, `/legal/terms`.** Free to read, Apache-2.0 for public source, rate limits, Phase 0 prototype, no warranty; the Foundation's and Nyuchi's terms apply where it is silent.
- **Changed, every footer.** "The org" lists Privacy and Terms of use. `llms.txt` lists both pages.
- **Changed, `scripts/verify-rendered.py`.** A "legal pages" section checks both pages exist, name the umbrella notices and the surfaces, are linked from every footer and are in `llms.txt`.

### Changed — the language's test count is re-measured at main (2026-11-12, freshness)

No issue: freshness update. `cargo test --workspace` was run on Linux at language `main` (`f9bea2b`, `v0.13.0`): 771 tests in 38 suites (cargo's result blocks; 30 hold tests), 770 passed, none failed, one ignored because it needs `axum` and `tokio` in the cargo cache (the language's `lowering` job runs it). The 767 tests in 35 suites the site carried were measured at `v0.12.0` on a Mac, where one test was killed for memory; it passes with 16 GB on Linux. Lines in `compiler/src` (33,540), the harness definition (197 entries, 49 pending codes, same SHA-256) are unchanged.

- **Changed, `/` and `/language`.** The figure reads 771 tests, 38 suites (770 pass, 1 ignored), with the date, platform and commit stated, and no longer says "not re-measured".
- **Changed, `public/llms.txt`.** The same figures in the status paragraph and the measured-on-main bullet; the earlier Mac run is kept as history.
- **Changed, `src/lib/progress.ts`.** The toolchain item carries the new count.
- **Changed, `scripts/check-facts.py`.** `MEASURED_TESTS, MEASURED_SUITES` are 771 and 38.
- **Changed, `scripts/verify-rendered.py`.** The 767 / 35 figures are refused as stale, as the earlier ones are.

### Fixed — llms.txt says the API and the plugin carry skills 0.19.0 (2026-11-12, freshness)

No issue: freshness update. `api.mzizi.dev/v1/skills/summary` reports 0.19.0 since the registry 4.29.0 pin deployed, and the plugin on registry `main` is 1.8.0 with the 0.19.0 skills.

- **Changed, `public/llms.txt`.** The skills paragraph no longer says the API's pin "still carries 0.18.0" or that plugin 1.7.0 "still carries skills 0.18.0"; it says the API serves 0.19.0 (registry `a64e57f`) and plugin 1.8.0 carries 0.19.0. The `/skills` pages, which are read from the API at build time, show 0.19.0 from the next deploy.

### Fixed — the language's commits, staging and open pull requests, and the package versions (2026-11-11, freshness)

No issue: freshness update. Read on 11 November 2026 from a clone of `mzizi-dev/mzizi`, the GitHub API, npm and `mcp.mzizi.dev`. `python3 scripts/check-facts.py dist` reported that the tag `v0.12.0` no longer points at the commit the figures cite: the language repository's history was rewritten, and `2b36c8f` (`v0.12.0`) and `cf3a44e` (`v0.13.0`) no longer exist. The tags survive: `v0.12.0` is now `9766929`, and `v0.13.0` is `f9bea2b`, which is `main`. (`6f7b096`, `1d5e578` and `4d0cdc3`, named in older history entries, are gone too; `v0.9.0` is now `effe7c7` and `v0.8.0` is `550826a`.)

- **Changed: the landing page, `/language`, `/cli` and `llms.txt`.** The commit links point at `9766929` (`v0.12.0`). The test count (767 in 35 suites), the 197 harness entries and the program outputs say they were measured at `2b36c8f`, a commit no longer in the repository's history, and that they were **not re-measured**: `git diff 9766929 f9bea2b` is empty under `compiler/`, `examples/` and `primitives/`, and for `LANGUAGE-TRACKER.md` and `CHARTER.md`, so they should still hold. The compiler/src line count (33,540) is counted at `main`.
- **Changed: "On main today".** `main` is `f9bea2b`, tagged `v0.13.0`; the release's tree is staging's `d1037ca`.
- **Changed: "Landing on staging".** Staging is `1749471` (`v0.13.11`, 7 November) and differs from `main` in 46 files. It adds an element tree for a component's static view (#156), `render` contract clauses and the `label` and `skeleton` primitives (#158), `int` arithmetic in a view string and the `progress` primitive (#160), three server components written in Mzizi and seven gaps they found (#157), RFC-0018 (a draft, #159), `mz check` and `mz contract` on a directory (#155), and the owner's 4 November note that Dioxus is out of the stack (#154). No tracker row turned ✅; the new rows are ❌, 📝 or 🟡, and nothing on staging is measured or released.
- **Changed: "In progress".** Nine pull requests are open on 11 November, none toward M2. #162 (function values, RFC-0018 wave 1) and #161 (conditional view attributes) are listed with links as work toward the components-in-Mzizi stream, not M2; the others (five incumbent backend arms, #129, #130, #131, and the RFC-0015 and RFC-0016 drafts) are named in the text, and the stale 2 November release pull request is noted.
- **Changed: `llms.txt` versions.** `@nyuchi/mzizi-skills` is 0.19.0 on npm and in the MCP server (was 0.18.0), and `@nyuchi/mzizi-cli` is 0.9.0 (was 0.8.0). The API and the public Claude Code plugin (1.7.0) still carry skills 0.18.0 until the registry release in progress lands, and the file says so. `mzizi-mcp` is 0.17.0, unchanged.
- **Changed, `scripts/verify-rendered.py`.** Messages and a comment name `9766929` for `v0.12.0`.
- A reader of mzizi.dev sees the corrected commits and the "measured at a commit no longer in the history, not re-measured" labels beside every figure, a staging column that matches staging, and the current package versions.

### Fixed — the rendered gate expects the registry's 690 components, N2's 409 (2026-11-11, registry v4.28.0)

No issue: the registry gained fifteen `react-*` items (mzizi-registry#640) and `api.mzizi.dev` serves them since the pin moved to v4.28.0, so the build prints 690 components and N2's 409. The rendered-content gate failed on every branch until its expected numbers moved.

- **Changed, `scripts/verify-rendered.py`.** `EXPECTED_COMPONENTS` is 690 (was 675); the N2 checks expect 409 (was 394).
- **Changed, `AGENTS.md` and `README.md`.** The stated counts follow: 690 components and component pages, N2's 409.
- A reader of mzizi.dev sees 690 components in the browse list, the component pages and the architecture page after the next deploy.

### Changed — `@bundu/ui` 0.13.0, the controls that were under the 14px inline floor (2026-11-05, [mzizi-registry#625](https://github.com/mzizi-dev/mzizi-registry/issues/625))

- **Changed:** `@bundu/ui` is now `>=0.13.0 <1` (lockfile at 0.13.0). The package's synced `ToolbarMenu`, `DataTable` row actions, `QuickSearch`, `SideNav` group labels, `TopBarAction` and `CommandPalette` items now take 14px of side padding (were 8px or 10px). The site renders none of these components, so a reader sees no difference: the built pages still have 1997 badges at 14px and none at 8px, and the rendered-content gate passes. The site now follows the package, so any of these components added later arrives at the floor.

### Fixed — `llms.txt` and the MCP card name the current package versions (2026-11-04, freshness)

No issue: freshness update. Read on 4 November 2026 from npm, the MCP Registry, `api.mzizi.dev/v1/skills/summary` and `mcp.mzizi.dev`; `python3 scripts/check-facts.py dist` reported five drifts and now reports none.

- **Changed: `llms.txt`.** `mzizi-mcp` is 0.17.0 (was 0.14.0) on the server, npm and the MCP Registry; `@nyuchi/mzizi-skills` is 0.18.0 (was 0.16.0) with twelve skills (was nine), the `dev` category now `digital-hygiene`, `progress-report`, `ship-release`, `registry-propagation` and `pr-gates`; the API serves 0.18.0 and the plugin is 1.7.0 carrying skills 0.18.0 (was 1.6.0 and 0.16.0); `@nyuchi/mzizi-cli` is 0.8.0 (was 0.7.0), and the entry says it adds `mzizi check`. The version block is dated 2026-11-04.
- **Changed: `/.well-known/mcp.json`.** The authorisation note cites `mzizi-mcp` 0.17.0, checked 2026-11-04, with the same behaviour: `initialize` and `tools/list` answer without a token, and only the Fundi tools need sign-in.
- **No change needed:** the component count (675 cards and pages), the Roots crates (0.7.0) and the `/skills` pages already followed the live sources; `/skills` lists the twelve skills the API serves. `verify-rendered.py` and `check-facts.py` needed no matcher change.

### Removed — Dioxus is out of the stack (2026-11-04, [mzizi-registry#635](https://github.com/mzizi-dev/mzizi-registry/issues/635))

Owner decisions: "dioxus is out!!!"; components and primitives are Mzizi first, then TypeScript, with native (Swift, Kotlin) where they exist.

- **Changed: component pages.** The Rust badge now reads "Rust" and the Rust section no longer says "Written for dioxus": the page does not read or print the `/v1/rs/<name>` `target` field, so it behaves the same whether the registry keeps, reshapes or drops it. `RustImplementation.target` is optional and typed `unknown`. The rendered gate checks that `button` leads with its Rust source (`button.rs`) instead of looking for `use dioxus::prelude::*;`.
- **Changed: `/`, `/language`, `/components`, `/playground`, `llms.txt`.** Phase 1 no longer says the UI is "rendered by a compatible engine (Dioxus today)", native mobile no longer says "a compatible mobile engine (Dioxus today)" (it now says native Swift and Kotlin components where they exist), and cross-platform rendering is "interop with an existing renderer" with what renders the Rust components marked not decided. Where the published crates still depend on Dioxus, the pages say so and that it is being removed. `llms.txt` no longer describes the Roots RFC as "Dioxus UI components" without saying the RFC as written does.
- **Left as history:** the benchmark's `dioxus` arm and "Rust · Dioxus" rows (`benchmarks/arms/dioxus` still exists upstream, and `check-facts.py` compares the arms), and the pilot narratives that record what ran.

### Changed — the UI audit guard measures label chips and pills on their inline axis (2026-11-04, (repository), [mzizi-registry#625](https://github.com/mzizi-dev/mzizi-registry/issues/625))

`scripts/audit-ui.mjs --guard` no longer exempts a one-line label chip or pill
(a badge, an eyebrow that draws a box, a status pill, a one-line pill or an
inline-flex label) on both axes. The block axis stays exempt (a chip's block
size is its line height or fixed height), but the inline inset from the text to
the chip's edge is now held to the same 14px floor (`floorInset`) as a container,
the rule written down in mzizi-registry#627. A pill with 8px of side padding now
fails the "containers with text under a 14px inset" count. Search-hit `mark`
highlights are not chips and stay exempt. Nothing a reader sees changes: with
`@bundu/ui` 0.12.0 the site's own pills are at 14px, and the guard reports 0 containers
under the inset on the built site.

### Fixed — badges and tooltips meet the 14px inline floor, on `@bundu/ui` 0.12.0 (2026-11-04, [mzizi-registry#625](https://github.com/mzizi-dev/mzizi-registry/issues/625))

- **Fixed:** `@bundu/ui` is now `>=0.12.0 <1` (lockfile at 0.12.0). The package's React `Badge` and `Tooltip` had 8px to 12px of side padding; they now have 14px, so every badge on the site (1997 across the built pages, none left at 8px) holds the Bundu floor's inline inset. A reader sees slightly wider badges.
- Ten registry-synced controls in the package are still under 14px of side padding (toolbar and data-table row-action summaries, quick search, top-bar actions, command palette items, the app shell search and side-nav group labels). The site renders none of them. The fix belongs in the registry and ships as a later `@bundu/ui` minor.

### Added — the site serves its icon mark (2026-11-04, [mzizi-registry#617](https://github.com/mzizi-dev/mzizi-registry/issues/617))

- **Added:** `/favicon.ico` (16, 32 and 48 px frames), the web manifest `/site.webmanifest` with 192 and 512 px icons and a maskable icon, and a light and dark `theme-color`. Crawlers and many clients ask for `/favicon.ico` by path and used to get a 404.
- **Changed:** the header, drawer and footer wordmark now show the Mzizi mark (white roots on the hematite disc) ahead of the name, where a cobalt dot stood. The mark is decorative; the link text "Mzizi" names it.
- **Changed (repository):** `scripts/generate-brand.mjs` also renders the manifest icons and the ICO from `public/brand/` SVGs; the rendered-content gate checks the new files and that every page links them.

### Fixed — the rendered gate counts the spacing floor rows (2026-11-04, [mzizi-registry#617](https://github.com/mzizi-dev/mzizi-registry/issues/617))

- **Fixed:** the rendered-content gate counted every list item with the `step` class on `/tokens` as a spacing step and expected 17. Once `api.mzizi.dev` serves the spacing floor, the page also shows five floor rows in the same list style, so the count became 22 and the gate failed on the release PR. It now accepts 17 (API without the floor) or 22 (17 steps plus the five floor rows). The page itself is unchanged.

### Changed — every release carries notes built from the changelog (2026-11-04, (repository), [mzizi-registry#619](https://github.com/mzizi-dev/mzizi-registry/issues/619))

- **Changed:** `@bundu/ui` is now `>=0.10.0 <1` (lockfile at 0.10.0), so the site's styles are built on the spacing floor tokens (`--inset-floor`, `--gap-floor`, `--leading-floor`) and the base-layer rules that ship with it. A reader sees no visible change beyond the floor changes already listed below.
- The `main-release.yml` minor release builds its notes (the `CHANGELOG.md` entries since the previous release plus a compare link) before it pushes the tag, so a release with no entries fails and tags nothing, and creates the release as a draft that is published once. GitHub's list of merged pull requests is no longer appended, and a manual re-run no longer rewrites a published release's notes (releases are immutable). No page changes.
- Staging patch tags (`v*`) no longer carry GitHub's auto text: `staging-version.yml` tags with the org workflow's `create-release: false` (it has no input for notes) and a new `release` job writes the pre-release with the `CHANGELOG.md` entries the merge added and a compare link. A merge the changelog gate exempts says so.
- The new `release notes` workflow tests the scripts and, on a `release/` pull request into `main`, fails when the release would have no changelog entries and prints the notes in the run summary. `AGENTS.md` gains "Release notes (hard rule)".

### Added — the spacing floor, held and shown (2026-11-04, [mzizi-registry#617](https://github.com/mzizi-dev/mzizi-registry/issues/617))

- `/tokens` has a "Spacing floor" section that reads `accessibility.minInset`, `minControlGap`, `minLabelGap`, `minItemGap` and `minBodyLeading` from `api.mzizi.dev/v1/brand` at build time and prints them with the build date. The live API does not serve them until its registry pin reaches 4.24.0; until then the section says so and shows no number.
- `scripts/audit-ui.mjs --guard` (the CI step "The Bundu floor holds in a browser") now also fails on adjacent controls under a 7px gap (visible edge to visible edge), text under a 14px inset in cards, panels and callouts (all sides) and in buttons and inputs (inline axis), body text under a 1.5 line height, overlapping hit regions, and a WCAG 1.4.12 text-spacing stress pass (line height 1.5, paragraph spacing 2x, letter 0.12em, word 0.16em) that loses or spills text, at 390, 820 and 1440 px. An element can opt out with `data-mzizi-spacing-exempt="<reason>"` (the reason is required); the only use is the drawn component specimens on `/tokens`. One-line pill labels (badges) are not held to the inset, because the shipped components draw them smaller (raised upstream in mzizi-registry).

### Changed — spacing floor applied to the site's own CSS (2026-11-04, [mzizi-registry#617](https://github.com/mzizi-dev/mzizi-registry/issues/617))

- Before: 78 control pairs under 7px, 2,745 container-insets under 14px, and 1,490 pieces of text lost under the stress, measured across the audit's nine pages, its open menu drawer and its search dialog at three widths (the stress pass runs on each page and the open drawer). After: 0 of each. Install commands, colour swatches, ladder tiles, figure tiles, code panes and the bench footer have 14px insets; the component filters, the node jump list and the section links are 7px or more apart.
- `/components` and `/skills` cards show the whole description. It was cut at four lines, which also hid a long unbroken word that widened the page at 320px; long tokens now wrap inside their cards, and the empty-family sentence on `/tokens` wraps instead of spilling.

### Fixed — site search shows page text, not the menu (2026-11-03, [#99](https://github.com/mzizi-dev/mzizi-site/issues/99))

- Search results no longer start with "Close search× Mzizi Close menu× Browse components.": the header, the search dialog, the menu drawer and the footer are left out of the search index (`data-pagefind-ignore`), so a result's excerpt is the page's own text. `/tokens` swatch ink reads a hex value only when it is 3 or 6 digits. The search field shows one "×" (the dialog's), not a second from the browser.

### Changed — dependencies (2026-11-03, (repository), [#99](https://github.com/mzizi-dev/mzizi-site/issues/99))

- Supersedes Dependabot #95 to #98, which could not be rebased after the `@bundu/ui` change. `astro` 7.4.5, `@astrojs/react` 7.1.2, `@astrojs/check` 0.9.12, `react` and `react-dom` 19.3.1, `tailwindcss` and `@tailwindcss/vite` 4.3.4, `pagefind` 1.6.0, `playwright` 1.64.1, `vite-plus` 1.4.0, `wrangler` 4.156.2 (the minor and patch group); `marked` 16.4.2 to 18.1.3 (a major, build-time Markdown for skill pages; the rendered gate passes unchanged); `typescript` 5.9.3 to 6.0.3, held `<7` because TypeScript 7 (7.0.2) is a different compiler that needs its own review; `pnpm/action-setup` 6.1.0 (pinned to its commit).
- The pages are unchanged: `astro check`, `vp check`, the rendered gate and the floor guard pass.

### Added — a dependency audit and review in CI, and editor recommendations (2026-11-03, (repository), [#50](https://github.com/mzizi-dev/mzizi-site/issues/50))

- `ci.yml` has a `dependency audit` job: `pnpm audit --prod --audit-level high` and, on pull requests, the dependency-review action (pinned to a commit SHA). `.vscode/extensions.json` recommends the Astro and Vite+ extensions. No page changes.

### Fixed — contrast, a focus ring and the 404 page, from the UI and UX audit (2026-11-03, [#99](https://github.com/mzizi-dev/mzizi-site/issues/99))

- Body text is held to 7:1: the section descriptions and the page lede were 5.3 to 6.0:1 in the muted ink and are a step darker (light) or lighter (dark). The benchmark's line numbers were faded to 2.5:1 and are now the muted ink at full strength.
- `/tokens`: the swatch labels were faded and shrunk to about 12px on screen (`transform: scale(0.85)`), which hid under the 14px floor; they are full size and ink-coloured. Translucent and mixed swatches (the scrim, the tinted surfaces) take a label that reads on them (3.0:1 became 4.5:1 or more).
- The filter box on `/components` lost its focus ring in the floor change (a search-box rule had been widened to every field); it has its ring again.
- Hit regions no longer overlap: the navigation pills, the filter chips, the header icons and the benchmark steppers sit 49px apart, centre to centre, and the benchmark's rows are 49px tall.
- `/404` no longer says the site is "three pages". It says what may have gone wrong in plain words and lists six places to go, each a 49px link.
- `/skills` has an "All the skills" heading, so the page no longer jumps from the title to the cards' level-three headings.
- `text-align: right` in the benchmark is `end`, so it follows reading direction.

### Added — a CI guard for the floor (2026-11-03)

- The `web` job runs `scripts/audit-ui.mjs dist --guard` on the runner's own Chrome: it fails on text under 14px, a control under a 49px hit region, a contrast pair under 7:1 (body) or 4.5:1, a missing or doubled h1, a skipped heading level, sideways scroll at 320px or a console error, at 390, 820 and 1440px.

### Changed — the language's state follows `mzizi-dev/mzizi` `main` v0.13.0 and `staging` v0.13.3 (2026-11-03, [#80](https://github.com/mzizi-dev/mzizi-site/issues/80))

- The landing page's status panel, `/language` and `llms.txt` say `main` is `cf3a44e`, tagged `v0.13.0` (the 1 November release, #146): benchmarks and tooling only (the runner scores backend episodes with probes, backend tasks B2 to B5, a macOS script fix). `git diff 2b36c8f cf3a44e` touches nothing under `compiler/`, `examples/` or `primitives/` and not the tracker, so the tracker marks, the harness counts, the 33,540-line count and the program outputs are unchanged.
- The test figures (767 tests in 35 suites) stay "measured at `2b36c8f`" and are said to be not re-measured: the release adds tests to the benchmark runner, and this update had no way to run the language's test suite.
- "Landing on staging" lists what `staging` (`792ca07`, tagged v0.13.3) holds beyond `main`: a test case that no longer gets a process killed on macOS (#149), the B4 and B5 reference servers (#147) and the dated changelog. It was read from a git clone, not the API: the "open pull requests" line is still the 29 October reading and says so.

### Changed — the site follows the Bundu floor, on `@bundu/ui` 0.9.0 (2026-11-03, [#90](https://github.com/mzizi-dev/mzizi-site/issues/90), [#99](https://github.com/mzizi-dev/mzizi-site/issues/99))

- Dependency: `@bundu/ui` is `>=0.9.0 <1` (was `^0.7.0`, which for a 0.x package never reaches 0.8 or 0.9). The open lower bound follows this repository's other dependencies; the upper bound keeps a 1.0 major, which needs the owner, out. `styles/density.css` arrives through the package's `globals.css`, which `site.css` already imports.
- Body text is 17px, captions 14px, and nothing readable is under 14px on any page (the `/tokens` "Sizes by screen" table's media-query labels were 11.2px). Measured at 390, 820 and 1440 on the built site, the count of text nodes under 14px went from 137 on the landing page and 3,113 on `/components` to 0.
- Every control keeps a 49px hit region: the header wordmark, navigation pills and icon links, the footer and drawer links, breadcrumbs, the component cards' title links, the Roots list, button-styled links and the search and filter fields. A control may be drawn smaller on a fine pointer; a transparent overlay keeps the hit region (the same one `@bundu/ui` gives a `button`). Links inside running text are exempt, as in WCAG 2.5.8. Controls under the floor on the landing page went from 75 to 0.
- On a phone the header is a row (wordmark, menu, search); the registry and GitHub icons are in the menu and the footer. No page scrolls sideways at 320px (all nine did).

### Added — `scripts/audit-ui.mjs`, a UI and UX audit of the built site (2026-11-03, [#99](https://github.com/mzizi-dev/mzizi-site/issues/99))

- Drives `dist/` with Playwright at 390, 820 and 1440 and reports font size, hit regions, contrast, focus, landmarks, headings, alt text, link names, reduced motion, 320px reflow and 3G weight and LCP. `--guard` exits 1 on text under 14px, a control under a 49px hit region, sideways scroll or a console error.

### Fixed — the rendered gate and `llms.txt` (2026-11-03, [#80](https://github.com/mzizi-dev/mzizi-site/issues/80))

- `verify-rendered.py` no longer applies its stale-figure patterns to `/skills/<name>` bodies, which are the registry's `@nyuchi/mzizi-skills` text (the gate already leaves them out of the language-state patterns). The live skill text quotes the 2026-11-01 figures and made the gate fail on every branch.
- `llms.txt`: `@nyuchi/mzizi-skills` **0.16.0** (npm and `/v1/skills`, which now serves it), the `mzizi` plugin 1.6.0 carrying it; dated 2026-11-03.

### Changed — `AGENTS.md` gains a Merge convention section for the `staging` queue (2026-11-03)

No issue: repository guidance only. Nothing on mzizi.dev changes.

- **Added: Merge convention.** The site's `AGENTS.md` had none. It now matches the other Mzizi repositories: squash through the merge queue, the target `merge-queue-staging` configuration (`SQUASH`, no 5-minute wait, up to 5 entries, `ALLGREEN`) as the owner's to apply in the rulesets, linear branches until the live values read `SQUASH` and `0`, enqueue as soon as the merge gate is met, forward-port `main`-only commits to `staging` before a release, and only a major release needs the owner.

### Fixed — `llms.txt` and `/.well-known/mcp.json` name the current packages (2026-11-02, [#80](https://github.com/mzizi-dev/mzizi-site/issues/80))

The daily `Freshness` run (`scripts/check-facts.py`) failed on these facts only; the language facts already match upstream.

- `llms.txt`'s dated version list (now "Versions on 2026-11-02"):
  - `mzizi-mcp` **0.14.0** on npm and in the MCP Registry (was 0.13.0). An anonymous `initialize` and `tools/list` against `mcp.mzizi.dev/mcp` on 2026-11-02 answered from 0.14.0, so the "free with no sign-in except the Fundi tools" sentence names 0.14.0 and that date, here and in `/.well-known/mcp.json`.
  - `@nyuchi/mzizi-skills` **0.15.0** (was 0.13.0): nine skills, with `mukoko-design` and `mzizi-architecture` added. `/v1/skills` still serves 0.13.0 until the API's registry pin moves, and the page says so.
  - The Mzizi Roots crates at **0.7.0** (was 0.6.0).

### Changed — `/skills` names the plugin and the connection guide; `llms.txt` too (2026-10-20)

- **`/skills`, "Using them"** adds the public `mzizi` plugin (`/plugin marketplace add mzizi-dev/mzizi-registry`, `/plugin install mzizi@mzizi`), which installs the skills and connects the MCP server in one step and carries the same bundle as the API; says `npx skills experimental_sync` links the npm bundle into `.agents/skills/`; and says a client that installs nothing still gets the skills from the MCP server. It links the new docs page, [Connect a client](https://docs.mzizi.dev/toolchain/connect) (mzizi-docs#64).
- **`llms.txt`**, under the skills version: the plugin (1.5.0 since registry v4.20.0) carries skills 0.15.0, and mzizi-registry#520, still open, would make it installable in Codex; `mzizi_get_skills` serves the skills to a client that installs nothing; and the connection guide's URL.

### Added — /tokens shows the sizes by screen: Apple's touch sizes on a phone, a step-down on desktop (2026-11-02, [#90](https://github.com/mzizi-dev/mzizi-site/issues/90))

- Owner, 2026-11-01: "mzizi sizes i think need to lower to apple recommended sizes" and "we need to lower the sizes as the screens increase". `/tokens` gains a "Sizes by screen" table (phone, tablet, desktop) for the touch floor, touch target, controls, input, headings, body, small and caption text. It is read at build time from the `globals.css` the registry serves at `/v1/ui/mzizi-tokens-globals`, so no size is typed on this site; the table appears when the API serves the density layer from registry PR #598 and is absent until then. The touch-target sentences name the desktop numbers beside the phone ones.
- Checks: `scripts/verify-rendered.py` holds the table to itself (the prose touch numbers are its phone column, nothing grows from phone to desktop, desktop targets stay at or above 24px, desktop body at or above 14px, phone body at least 17px). `scripts/check-facts.py` parses the API's CSS a second time and fails when the page and the API differ, or when `/v1/brand`'s touch numbers disagree with the CSS they ship with; it now reads `MZIZI_API_ORIGIN` too.
- `parseSizeLayers` has unit tests (cascade, `px`, legacy alias, density-before-base), and the checks fail loudly, not silently, when the CSS names a fine-pointer block they cannot read.
- Not changed: the landing-page contract bench still says "48px" and `h-12`, because that is `primitives/button.mz` in `mzizi-dev/mzizi`, which the registry change does not touch.

### Fixed — the rendered gate expects the registry at v4.18.0 (2026-11-01)

- api.mzizi.dev serves registry v4.18.0 since mzizi-api v0.11.0 and v0.12.0: 675 components (was 656), N2 394 (was 388), N6 93 (was 90). `scripts/verify-rendered.py`, `AGENTS.md` and `README.md` now expect those counts. The site reads them from the API at build time, so readers see 675 components once the site rebuilds.
- The glued-inline-tag check no longer reads attribute values. Astro escapes `"` in an attribute but not `<`, so app-money's registry description, which mentions `<code>`, reached a `<meta>` tag as `&quot;<code>&quot;` and was reported as a glued tag. Prose is still checked: a `word<code>` in a page still fails the check.

### Fixed — release notes when the previous release has no `CHANGELOG.md` (2026-11-01)

- `release_notes.py` treats a previous release with no `CHANGELOG.md` as the first release, as its docstring says. It matched git's "does not exist" message, but in a checkout where the file exists on disk git says "exists on disk, but not in", so the first `main-release.yml` run that met such a tag stopped before tagging. It now asks git directly (`git cat-file -e`).

### Changed — GitHub releases carry the CHANGELOG entries they ship (2026-11-01)

- Owner, 2026-11-01: a release is not done until its tag and its GitHub release, with notes from `CHANGELOG.md`, exist on the merge commit on `main`. `main-release.yml` now opens each release's notes with every `CHANGELOG.md` entry added since the previous `main` release (`.github/scripts/release_notes.py`, adapted from `mzizi-dev/mzizi`), followed by GitHub's list of merged pull requests. Before, the notes were the pull-request list alone.
- A commit that already carries its minor tag but has no release gets one, and a manual run of the workflow on such a commit rewrites its notes from `CHANGELOG.md`, so an earlier release can be corrected.
- Readers of the site see no difference; only the release pages do.

### Changed

- The stated facts move from mzizi v0.9.0 (6f7b096) to v0.12.0 (2b36c8f, 2026-10-29). The pages now
  show 767 tests in 35 suites (766 pass on a Mac; one range-too-long case is killed by the OS),
  33,540 lines in the compiler, and four pilots with no advantage separated: pilots 3 and 4 are added
  with links to their write-ups. The progress panel lists v0.10.0 to v0.12.0, the open pull requests
  (none toward M2), the P11 build-targets decision and the current package versions. Pilot 3 is
  described from the results table (21 episodes), not the upstream summary line ("26 of 27"), which
  does not match it. `check-facts.py` now expects v0.12.0, treats the README test count as a floor
  (the README lags) and checks the pilot count against `benchmarks/results/`. Refs #80.

- The landing page shows the verdict first and folds the long prose away. The status panel now opens
  with two short statements (Phase 0 is not complete; Mzizi is not yet a working programming language)
  and keeps the full account, the example program and the progress columns behind "The full account"
  and "A program that runs, and where the work stands". The language, toolchain and tab cards show a
  title with the detail one tap away. "Why" and "Contracts" shrink to three one-line cards each, the
  components section to one sentence, and the repository ledger and org list give way to a link to
  `/ecosystem`. Hero, bench, status-then-benchmark order, the arms list and every gated fact are
  unchanged. Not yet reviewed page by page beyond the landing page. Heavy text belongs in the docs;
  moving the folded text there is a follow-up.
- **`@bundu/ui` moves from 0.2.0 to 0.7.0**, and its range in `package.json` is now a floor with no ceiling (`>=0.7.0`). The old caret range could not reach a newer `0.x` minor, which is why the site had fallen five minors behind. The lockfile still pins what a build installs. `astro check`, `astro build` and the rendered-content gate pass on 0.7.0. Not yet reviewed visually page by page: check the preview before merging.

### Security — `zod` at 4.6.6 or later (2026-10-24)

- A new override, `zod@<4.6.6` `>=4.6.6` (a minimum, no maximum), moves `astro`'s copy of `zod` from 4.6.2 to 4.6.7, fixing GHSA-mrhx-c7xc-m3w5 (high), which the org `audit` job reported. `zod` is a build dependency; readers see no difference.

### Changed — every dependency and override is a minimum, and `vite-plus` is at least 1.3.0 (2026-10-21)

- Owner, 2026-10-21: "mark packages with minimum acceptable, latest shouldn't be a blocker on too old of a version." Every entry in `dependencies`, `devDependencies` and `pnpm.overrides` is now `>=x.y.z` with no maximum, at the version `pnpm-lock.yaml` already resolved. `vite-plus` reads `>=1.3.0`, the version the lockfile already held. Readers see no difference.
- The lockfile moves one transitive package: `astro`'s `magic-string` dedupes from 1.3.1 onto the 1.4.3 already in the tree. Nothing else resolves differently.
- `http-cache-semantics` 4.3.0 is now published with the fix for GHSA-ch52-4w7c-c8xp, so a new override, `http-cache-semantics@<4.3.0` `>=4.3.0`, moves `astro`'s copy from 4.2.0 to 4.3.0, and the `pnpm.auditConfig.ignoreGhsas` entry for that advisory is removed. The org `audit` job strips `pnpm.auditConfig` before it runs, so the ignore never applied there. Readers see no difference.

### Added — Dependabot version updates target `staging` (2026-10-21)

- `.github/dependabot.yml` is new: weekly version updates for GitHub Actions and this repository's package manifests, every entry with `target-branch: staging` (owner rule, 2026-10-21: "all dependabot should target staging not main.") and a seven-day cooldown before a new release is proposed.

### Security — build dependencies on patched versions (2026-10-21)

`pnpm audit` reported high advisories in `devalue`, `sharp`, `source-map-js`, `undici`, `vite` and `vite-plus`, and
moderate ones in `fast-uri` and `smol-toml`, all reached through `astro`, `wrangler`, `@tailwindcss/vite` and
`@astrojs/check`. They failed the org's dependency `audit` check on any pull request that touches `pnpm-lock.yaml`.
`vite-plus` is now `^1.1.0`, and `pnpm.overrides` puts the others on their patched versions. `http-cache-semantics`
(GHSA-ch52-4w7c-c8xp, through `astro`) has no patched release, so it is listed in `pnpm.auditConfig.ignoreGhsas` until
one ships; the site is static and serves no cached responses through it. The build, `astro check` and the
rendered-content gate pass, and readers see no difference.

### Changed — `@bundu/ui` is a minimum version, `>=0.2.0`, not `^0.2.0` (2026-10-21)

Owner decision, 2026-10-21: first-party packages are pinned to a minimum acceptable version, with no maximum. On a
`0.x` version a caret stops below the next minor, so `^0.2.0` could not take `@bundu/ui` 0.3.0 without a manifest
edit. `pnpm-lock.yaml` still resolves 0.2.0, so the site renders exactly as before; taking a newer release is now a
lockfile refresh (`pnpm update @bundu/ui`), not a `package.json` edit. Third-party dependencies are unchanged.

### Changed — the earlier console app is named without a UI framework

- **`/ecosystem` and the README name no UI framework they replaced, and no longer present Dioxus as the way forward for the console.** The `app.mzizi.dev` entry on `/ecosystem` now reads "Today it loads live data in the browser; it is being rebuilt so Astro renders it on the server with a Rust backend (mzizi-console#34). Replaces an earlier console app", and the README's "no UI framework runs in the browser" list is now "not React, not Vue". The README console row and `llms.txt` say the same about the console. The doctrine line on the same page is unchanged: one UI framework, Astro, with Rust first. No URL, fact, count or default moved. This follows the owner's decision of 2026-10-20 (mzizi-dev/mzizi-registry#503) to remove one framework's name from every repository.

### Changed — the progress block points at M2's tracking issue (2026-10-09)

- **The progress block points at M2's own tracking issue.** On the landing page, `/language` and in `llms.txt`, "In progress toward M2" now links `mzizi-dev/mzizi#110` (opened 9 October), not #69, which tracked M1 and is met. "Landing on staging" lists mzizi-dev/mzizi#111, RFC-0014 (the Tier 2 design, a draft with 19 open questions, nothing built), merged to the language's `staging` on 9 October, #112 (the C6 review fixes: the `int` minimum literal, `MZ0962` naming spellings as written, 765 tests on `staging`) and #113 (a CI pin); "In progress" names modules (P1) and the standard library (P2) next, by #110's plan. Nothing toward M2 is described as built. `check-facts.py` now requires the column to link #110, and lists every open language pull request that refers to #110 or #69.

### Changed — the 20 October release, the platform names, and the three build targets (2026-10-20)

- **The language's 20 October release is on the status pages.** Read from `mzizi-dev/mzizi` `main` at `6f7b096`, tagged `v0.9.0` (release pull request #120, GitHub release published 11:13 UTC on 20 October). The "On main today" column leads with it: the C6 review follow-ups (#112, for issue #107), RFC-0014 as a draft design (#111, nothing in it implemented), and the CI, README and changelog fixes (#113, #115, #116, #119). The landing page, `/language`, `llms.txt`, and the program and CLI pages name `6f7b096` and `v0.9.0`. Measured there: 765 tests in 29 suites, 634 of them in the compiler crate, 33,518 lines in `compiler/src`, 197 harness entries with 79 distinct diagnostic codes and 49 pending. The 8 October pages said 80 codes. At `6f7b096` the definition gives 79, and the release added and removed no code entry, so the 80 is corrected here. Every example's `mz run` output matches its `.expected` file at `6f7b096`.
- **Nothing is waiting on `staging`.** `staging` (`a0bb6b0`) and `main` (`6f7b096`) hold the same tree. One pull request is open against `staging`, #118 (an RFC-0015 draft), and it is not toward M2, so it is not listed as in progress.
- **The API repository is `mzizi-dev/mzizi-api`, formerly `mzizi-api-gateway`.** The ecosystem page, the landing page's repository cards, `llms.txt`, and the `api.mzizi.dev` description name the new repository and keep the old name once, in brackets. The host, `api.mzizi.dev`, is unchanged. The owner has renamed the repository, so the source links resolve; GitHub redirects the old name.
- **The console is described as it is and as it is decided.** `app.mzizi.dev` is a standalone repository. Today it is Astro with WorkOS sign-in, live data loaded in the browser, and no database of its own (`mzizi-console` has no Supabase client, environment variable or migration). Decided, not built (`mzizi-console#34`): one Rust Worker serves Astro's output, sign-in moves to the server, and any state it keeps goes in Cloudflare D1. The ecosystem page, the landing page and `llms.txt` say so.
- **Build targets: the owner's decision of 2026-10-20 is stated next to the charter, not in place of it.** `/language` has a note after the phase table: three targets (Cloudflare Workers, containers and bare metal), each backend behind a trait with an adapter per side, designed in RFC-0016 (mzizi#123), which the owner approved as design only on 2026-10-21: the charter amendment and every build wave wait for the Phase 0 gate. Containers mean a standard OCI image, built with Docker by default and run by any OCI runtime. The charter's Phase 1 text, which names containers reached from a Worker, is still quoted as written. The pages still say there is no Workers, Containers or WebAssembly target, because none is built.
- **Roots render path.** Pages that name the Roots components now say they are moving to Mzizi's own `render()` (seven components have it; registry #506 and #510 merged), and that Dioxus is still a dependency of some crates until the migration finishes.
- **`/language` lists RFC-0014** (Tier 2, a draft), beside RFC-0013.
- **Fixed on rebase (2026-10-21).** RFC-0014 is mzizi#111 (mzizi#110 is M2's tracking issue, which the in-progress column links, from #68); the C6 review fixes are mzizi#112, for issue #107. `llms.txt` names the Mzizi Roots crates at 0.4.0, the version on crates.io. The `/ecosystem` console entry keeps #69's wording and names no UI framework it replaced.
- **Scripts:** `scripts/check-facts.py` expects the tag `v0.9.0`; `scripts/verify-rendered.py` expects `v0.9.0` and the 765, 634 and 33,518 figures and flags the 8 October figures as stale.

### Changed — the fourth 8 October release reached `main`: every Tier 1 row is ✅, M1 is met (2026-10-08)

Read from `mzizi-dev/mzizi` at `1d5e578`, tagged `v0.8.0` by `main-release.yml` after CI passed. Release pull
request #109 ("chore(release): staging to main") carries #105 (tracker and README prose), #106 (the rest of C6, text
operations) and #108 (release prep). `staging` is at the same commit, so nothing is waiting on `staging`, and no
pull request toward M2 is open (`GET /repos/mzizi-dev/mzizi/pulls?state=open` returns none).

- **Facts that moved, as measured at `1d5e578`:** `cargo test --workspace` gives 760 tests in 27 suites (was 744),
  629 of them in the compiler crate (was 613). `compiler/src` is 33,438 lines (was 33,138). `mz harness definition`
  gives 197 entries (was 191), still 80 diagnostic codes (53 `MZ09xx` and 27 shared) and 49 pending codes. These
  are on the landing page, `/language`, `/cli`, `llms.txt`, and in `scripts/verify-rendered.py` and
  `scripts/check-facts.py`. The `v0.8.0` tag is named in place of `v0.7.0` and checked against `1d5e578`.
- **Tracker, as it reads on `main`:** C6 (text operations) is ✅, so C1–C10 are all ✅ and M1, a language that
  computes, is met. Text operations now include `s[i]`, `s.slice(a, to = b)`, `s.find(t)`, `s.split(sep)`,
  `s.chars()`, `s.parse_int()` and `s.parse_float()`, with the options and lists they return. The owner decided on
  2026-10-08 (RFC-0013 §20 Q20) that built-in methods with tests meet C6. Modules (P1), the standard library (P2)
  and concurrency (P9) are still ❌, so Mzizi still has no modules, standard library or concurrency, and M2 is not
  reached.
- **Progress columns:** "In progress toward M1" is now "In progress toward M2", since M1 is met. The "Landing on
  staging" column says nothing is waiting. `/language`'s table marks Text operations ✅, and its "Progress toward
  M1" heading is "Progress toward M2".
- **Examples:** `examples/text.mz` changed in `v0.8.0`, but no page shows it. The four programs the site shows
  (`errors`, `numbers`, `control`, `records`) are unchanged since `4d0cdc3`; their output was re-checked against
  `examples/*.expected` at `1d5e578`. `mz build examples/registry.mz --out out/registry` prints the line `/language`
  quotes, byte for byte.
- **Not changed:** the two pilots (no advantage shown; the kill-criterion run has not happened), and the rule that
  only a `service` and a `program` lower, with no component lowering.

### Changed — the third 8 October release reached `main`: collections, records and text methods (2026-10-08)

Read from `mzizi-dev/mzizi` on 2026-10-08. Release pull request #104 ("chore(release): staging to main") merged
to `main` as `4d0cdc3`, carrying #97–#103. `staging` (`1743e3c`) holds the same tree, so nothing is waiting on
`staging`. `main-release.yml` tagged `4d0cdc3` as `v0.7.0` after CI passed (18:03Z); the pages name the tag and
`check-facts.py` checks it points at the cited commit. #105 (docs, no mark changes) merged to the language's `staging` while this was open, so it is listed under "Landing on staging", and no pull request toward M1 is open. Earlier, no pull request was open toward
M1 (`GET /repos/mzizi-dev/mzizi/pulls?state=open` returns none). A fresh clone of `4d0cdc3` was built in a private
target directory and tested.

- **Facts that moved, as measured at `4d0cdc3`:** `cargo test --workspace` gives 744 tests in 27 suites (was 644
  in 24 on `dc156c5`), 613 of them in the compiler crate (was 513). `compiler/src` is 33,138 lines (was 26,850; a
  fresh count). `mz harness definition` gives 191 entries, 80 diagnostic codes (53 `MZ09xx` and 27 shared) and 49
  pending codes (was 137 entries, 70 codes and 51 pending). These are on the landing page, `/language`, `/cli`
  and `llms.txt`, and in `scripts/verify-rendered.py` and `scripts/check-facts.py`.
- **Tracker, as it reads on `main`:** C1–C5 and C7–C10 are ✅; C6 (text operations) is 🟡. C6 is partly built:
  length, `contains`, `starts_with`, `ends_with`, `trim`, `to_upper`, `to_lower`, `replace` and `repeat`. Slicing,
  search that returns an option or a list, split and parsing are not built, and wait for the standard library (P2)
  and the owner's answer to RFC-0013 §20 Q20. Modules (P1), the standard library (P2) and concurrency (P9) are ❌.
- **What a program has, and what it lacks, is reworded.** The sentence the site used ("on `main` it has no modules,
  standard library, text operations, maps or sets, methods on records or concurrency yet") is no longer true: maps,
  sets, lists and records with methods are on `main`. The new sentence says the program has collections and
  records with methods, and that Mzizi has no modules, standard library or concurrency yet, and only part of text
  operations. `scripts/check-facts.py` and `scripts/verify-rendered.py` hold the new sentence to the tracker, and
  the old wording is a stale-fact pattern.
- **Release tag:** the site names `v0.7.0` (commit `4d0cdc3`, GitHub release `releases/tag/v0.7.0`) on the landing page,
  `/language` and `llms.txt`, and the progress block's "On main today" leads with it. `verify-rendered.py` checks the
  pages name it; `check-facts.py` checks the tag exists and points at the commit the figures cite.
- **Progress block:** "On main today" lists records with methods (#101, #102), collections (#99), text methods
  (#98, partly, still 🟡), the tracker's C7–C8 rows (#104), the harness `not` precedence fix (#100) and the
  release. "Landing on staging" says there is nothing waiting. "In progress toward M1" lists the tracking issue
  #69 and the rest of C6, with no open pull request.
- **Example program:** `/language` shows `examples/records.mz` (C8), unedited, with the output `mz run` printed
  at `4d0cdc3`; the output is the file's `.expected`, which CI compares with it. The other programs shown are
  unchanged.
- **Re-captured at `4d0cdc3`, output unchanged:** `mz check --agent examples/connectivity_bar.mz`, `mz hash` of it,
  `mz contract examples/registry.mz`, and `mz build examples/registry.mz` on `/language`.
- **Not claimed:** no benchmark result changed. Both pilots still show no advantage for Mzizi, and the
  kill-criterion run has not happened.

### Changed — the language's staging work (#97, #98, #99) is on the progress block, and C6 and C7 are not on main (2026-10-08)

Read from `mzizi-dev/mzizi` on 2026-10-08: `main` is unchanged (`dc156c5`, the 8 October release), and
`staging` is at `6e67658`. A fresh clone of each was built and tested. No pull request is open toward
M1 (`GET /repos/mzizi-dev/mzizi/pulls?state=open` returns none).

- **Progress** (`src/lib/progress.ts`, the landing page, `/language`, `llms.txt`): "Landing on staging"
  now lists #98 (text methods in a program that need no option or list, tracker C6), #99 (lists, maps and
  sets in a program, tracker C7), #97 (a wording fix to tracker row H1) and #95 (the C8 split). Each one is
  on `staging` and not on `main`, so none is ✅. "In progress toward M1" is down to the tracking issue #69
  and methods on records (C8), which no pull request builds yet.
- **Capability wording**: the pages no longer say flatly that Mzizi has no text operations, maps or sets.
  They say that on `main` it has none of those yet, and that text operations (C6) and collections (C7) are on
  `staging`, not yet released. The tracker's marks are unchanged: C6 and C7 read 📝 and 🟡 on `main`, and 🟡
  on `staging`. `check-facts.py` still reads `main`'s tracker.
- **Figures** (measured on `staging` at `6e67658`, labelled as not `main`'s): `cargo test --workspace` gives
  693 tests in 26 suites, 562 of them in the compiler crate; `mz harness definition` gives 181 entries,
  75 diagnostic codes and 50 pending codes. `main`'s figures are unchanged (644 tests in 24 suites, 513 in the
  compiler crate; 137 entries, 70 codes, 51 pending; 26,850 lines in `compiler/src`), and they stay on the
  pages that state `main`.
- **Checks**: `scripts/verify-rendered.py` requires the progress column to link #97, #98 and #99, and refuses
  the old next-step wording ("maps, sets and collection operations (C7), and text operations (C6)") and
  "M1 still needs collections, text operations and methods on records", which were true before those pull
  requests merged. `scripts/check-facts.py` is unchanged and still holds the capability sentence to `main`'s
  tracker.
- **Not shown**: the example programs stay `main`'s (`examples/errors.mz`, `numbers.mz`, `control.mz`); the
  staging examples `text.mz` and `collections.mz` are not on the site yet.

### Added — the Mzizi mark, a favicon, and the mark on the share cards (2026-10-08)

- **The Mzizi mark, drawn flat in hematite**, from the owner's tree-and-roots icon: a trunk whose roots mirror its crown, one colour, no shading. `public/brand/mzizi-mark.svg` is the line mark, `#546e7a` on light and `#90a4ae` on dark (it follows the reader's colour scheme). `public/brand/mzizi-badge.svg` is the same tree with fewer, heavier strokes on a hematite disc, so it holds at 16 px.
- **The master artwork is kept as supplied**, `public/brand/mzizi-logo-master.jpg` (2576 x 1439, the gold and copper tree), as the reference the flat marks are refined from. The roots leave the ground line and the trunk along them, so no stroke end shows at a join.
- **The site has a favicon**: `favicon.svg` (the badge), a 32 px PNG fallback and a 180 px `apple-touch-icon.png`, linked from every page. Before this, no page named an icon.
- **The share cards** carry the badge beside `mzizi-dev`, in place of a placeholder glyph, and are regenerated.
- `scripts/generate-brand.mjs` renders the PNGs (including 512 px copies under `public/brand/` for avatars) from the SVGs, which are the source. `scripts/verify-rendered.py` now fails when a page does not link the favicon or the touch icon, or when either file is missing from `dist/`.

### Added — a share card for link previews (2026-10-08)

- **Every page now has a share card** for link previews: an `og:image` and `twitter:image` with its size, type and alt text, plus `og:site_name` and `twitter:card` `summary_large_image`. Before this, no page set an image, so LinkedIn, X, Slack and WhatsApp showed whatever image they found on the page, or none.
  - **One card per top-level page,** `/og/<page>.png` (1200 x 630), carrying that page's heading and URL (`mzizi.dev/language`, `mzizi.dev/tokens`, …). A component or skill page uses its section's card. `/og/index-light.png` is a light version of the landing page's, for posts on a light background.
  - **The look** is the Bundu Foundation card's blueprint layout (grid, corner marks, a numbered `FIG.` label), so the estate's cards read as one family, in Mzizi's hematite: the surface, grid, rules and mark are hematite, with the site's seven-mineral strip down the left edge. The figure is a root system, since Mzizi is Swahili for "root".
  - **The tagline is "Designed for machine authorship."** (owner, 2026-10-08), the charter's one sharp edge (§1), under the page's heading. The label is the charter's title, "a general-purpose programming language", and the footer reads "Apache-2.0 · Compiler in Rust · Phase 0": the tagline is what Mzizi is designed for, the goal Phase 0 measures, not a result.
- `scripts/og/card.html` is the card. `scripts/generate-og.mjs` reads each built page's `<h1>`, renders its card with Playwright and writes `src/data/og-cards.json`, which `Site.astro` reads; the PNGs are generated, then committed, like the component previews. `scripts/verify-rendered.py` now fails when a top-level page has no card, a card is missing or not 1200 x 630, a page names any card but its own section's, or the landing page drops `summary_large_image`.

### Changed — the 8 October release (#96) is on main: the tracker's C1–C5, C9 and C10 rows read ✅, the harness has 70 codes, and #95 is on staging (2026-10-08)

Read from `mzizi-dev/mzizi` on 2026-10-08: the release pull request #96 merged as `dc156c5`, which
carries `staging` at `8ac7b55` to `main` tree for tree. After it, `staging` moved to `0d25354`
with #95 (a tracker change). No `v0.6` tag existed when this was read (`main-release.yml` tags after CI
passes), so no page names one.

- **Progress** (`src/lib/progress.ts`, the landing page, `/language`, `llms.txt`): #92 (the
  tracker's C1–C5, C9 and C10 rows ✅) and #93 (the language harness registers every code a program
  can raise) are on `main`, so they move to "On main today". #95 is on `staging`, so it moves to
  "Landing on staging". "In progress toward M1" is down to the tracking issue #69 and the next
  wave: no pull request is open toward M1 on 2026-10-08. Every "the tracker still marks those rows
  🟡" sentence reads ✅ on `main`, on the landing page, `/language` and `llms.txt`.
- **Staging**: #95 splits tracker row C8 into "User types: records and methods" (M1) and a new
  Tier 2 row, P12, "Generics and interfaces", after M1. It changes the tracker only; it is not on
  `main` until the next release.
- **Figures**: 644 tests in 24 suites, 513 of them in the compiler crate (`cargo test --workspace`),
  and 26,850 lines in `compiler/src`, from a fresh build at `dc156c5`. `mz harness definition` has
  137 entries, 70 diagnostic codes (45 `MZ09xx` and 25 shared) and 51 pending codes; it had 133,
  66 and 55. Every figure that cites a commit now cites `dc156c5`.
- **Programs**: `examples/errors.mz`, `numbers.mz` and `control.mz` are unchanged since `be88017`,
  and `mz run` at `dc156c5` prints the same bytes as their `.expected` files; `src/lib/programs.ts`
  cites `dc156c5`.
- **Checks**: `scripts/verify-rendered.py` requires the progress column to link #92, #93, #95 and
  #96, and refuses the old counts (643 tests, 512 of them, 26,811 lines, 133 entries, 66 codes,
  55 pending) and "still marks … 🟡" for C1–C5. `scripts/check-facts.py` fails when a page says the
  tracker still marks C1–C5, C9 and C10 🟡 while the upstream tracker reads ✅.

### Changed — progress: numbers, the performance suite and the language harness land on staging; C4 in progress (2026-10-08)

Read from `mzizi-dev/mzizi` on 2026-10-08: `main` is unchanged (`0653903`), and `staging` is at
`faf3003`. The landing page's and `/language`'s progress columns (`src/lib/progress.ts`) and
`llms.txt`'s "Where it stands" say the same thing:

- **Landing on staging** (`faf3003`, was `9254ef4`) gains three merged pull requests, moved out of
  "In progress toward M1":
  - mzizi#83, numbers in a program: `float`, the numeric methods and the rest of the operators
    (C1 and C5 in a program; the tracker rows stay 🟡 until they reach `main`).
  - mzizi#85, the performance suite against hand-written Rust (`benchmarks/perf`). CI checks only
    that the outputs agree; no timing is committed.
  - mzizi#88, the language harness: RFC-0012 amended, as a design, to make it the spine of the
    language, and its first slice built and tested: 105 registered entries, `mz harness version`,
    `definition` and `entry`, and drift tests. Every feature pull request must add its harness
    entry. The `say` and teaching text are written by hand and not compared with the checker. The
    harness is described as designed to be tested by the benchmark; nothing is measured, and
    tracker row H1 stays 🟡.
  - Staging's test counts, labelled as staging's: 534 in the workspace, 403 in the compiler crate.
    The figures cited elsewhere on the site are still `main`'s (437 tests in 19 suites).
- **In progress toward M1** now lists mzizi#89 (control flow, C4, a draft) beside mzizi#87 (errors,
  C9, to be rebased after #89). The "next" line drops loops and a general `match`, which #89 covers,
  and adds text operations.
- `/language` no longer says the performance suite does not exist; the landing page's status text
  names floats and the language harness among what is on `staging`.

### Added — where Mzizi stands: shipped, next, and in progress toward M1 (2026-10-07)

The owner asked on 2026-10-07 for the site to show progress and where the language is.

- **The landing page's status section and `/language` gain three columns**, from one source
  (`src/lib/progress.ts`, rendered by `src/components/Progress.astro`):
  - **On main today**: what Mzizi can do on `mzizi-dev/mzizi` `main` (`0653903`), taken from
    `LANGUAGE-TRACKER.md`, and what the two 7 October releases added, split by release and
    taken from the `[Unreleased]` section of `main`'s `CHANGELOG.md`: mzizi#72 (`9a88e1d`:
    `match` in a view as `MZ0410`, RFC-0012 §8, the React arm's pins, pinned workflows) and
    mzizi#79 (`0653903`: the nesting cap `MZ0411`, escaped file names in `mz build`'s
    comments, robustness tests, no `unsafe` in the compiler).
  - **Landing on staging** (`9254ef4`), not yet released: RFC-0013, the core language, a
    draft (mzizi#76), with its amendments from the language survey (mzizi#81); the foundation slice, with `program`, `fn`, `let`/`var`, `int`/`bool`/
    `text` expressions, `when`/`else`, `print` and `mz run` (mzizi#80), whose tracker rows
    stay 🟡 until it reaches `main`; `design/LANGUAGE-SURVEY.md` (design input); release
    notes from the changelog (mzizi#82); `CLAUDE.md` (mzizi#77); and a pre-commit hook
    (mzizi#86, which superseded the closed mzizi#84) that refuses a commit without a
    `CHANGELOG.md` entry and runs `cargo fmt --check` on staged Rust, installed with
    `scripts/install-hooks.sh`, with a test CI's `compiler` job runs.
  - **In progress toward M1**, labelled "Not available yet": the tracking issue mzizi#69,
    Wave 1's numbers (mzizi#83), the performance suite against hand-written Rust
    (mzizi#85, the benchmark only; no result is committed to the repository, and its pull
    request's description records one informal run on one machine) and Wave 1's errors
    (mzizi#87: enums in a program, `result(T, E)`, `return error(e)`, prefix `try`, a
    `match` on a result, and `main` returning a result, with `MZ0992`), all open and
    unmerged. The "next" line no longer lists a result type, which mzizi#87 now covers.
- **`/language` adds "Progress toward M1"** with the owner's decisions of 2026-10-07 from
  mzizi#69, and the one informal `fib(40)` timing recorded there, stated as one noisy run on
  one machine: slower than Rust's default build, about level with Rust under the same
  overflow checks, and not a benchmark.
- **RFC-0013 is in the RFC lists** on `/language` and in `llms.txt`, linked to its file on
  `staging` and its pull request, not to a file on `main`. `/language` and `llms.txt` link the
  language survey on `staging`. `/`, `/cli` and `/language` say `mz run` is on `staging`, not
  yet on `main`.
- **`llms.txt` gains "Where it stands"**, with the same three lists, the owner's decisions,
  and an instruction never to describe the in-progress work as something Mzizi has.

### Changed — the language figures move from `9a88e1d` to `0653903` (2026-10-07)

- From a fresh `cargo test --workspace` at `0653903`: **437 tests in 19 suites** (was 428 in
  18), 306 of them in the compiler crate, and **12,916 lines** in `compiler/src` (was
  12,706). `mz contract` still gives 29 clauses over the nine primitives, and the captured
  `mz check --agent`, `mz hash`, `mz contract` and `mz build` outputs on `/language` are
  unchanged at the new commit.
- **The kill-criterion run no longer "waits on" the React arm's pins** (`/`, `/language`,
  `llms.txt`): they come from the registry's lockfile since 2026-10-07
  (`benchmarks/READINESS.md`, item 1). The rest of the list is unchanged.
- RFC-0012's row says "draft for review", as the RFC does, and names §8's seven prior-art systems.

### Changed — the rendered-content gate and the freshness check follow the progress block

- **`scripts/verify-rendered.py`** requires the three columns, in order, on `/` (inside the
  status section) and `/language`; the "Not available yet" label; links to mzizi#69, #76,
  #80, #81, #83 and #85; RFC-0013 linked on `staging` with #76, and never on `main`, on
  `/language` and in `llms.txt`; and the survey link. It now refuses "428 tests", "18 suites", "12,706" and a run that still "waits on" the
  React arm's pins.
- **`scripts/check-facts.py`** fails when a pull request listed as in progress has merged or
  closed, when an open pull request that refers to mzizi#69 is not listed, when `llms.txt`'s
  in-progress list differs from the landing page's, once RFC-0013 is in `main`'s `design/`
  when a page still says it is not on `main`, and once the tracker marks C10 ✅ when a page
  still says `mz run` is not on `main`. `AGENTS.md` describes the progress block.

### Changed — versions from the 5–7 October releases, and the language at `9a88e1d` (2026-10-07)

A freshness update. The scheduled Freshness check (`scripts/check-facts.py`) failed on the
versions below. While they were being fixed, `@nyuchi/mzizi-cli` 0.7.0 reached npm and the
language released to `main` (`9a88e1d`).

- **`llms.txt`'s dated version list moves to 2026-10-07:**
  - `mzizi-mcp` 0.13.0, not 0.11.2, on npm and in the MCP Registry.
  - `@nyuchi/mzizi-skills` 0.11.0, not 0.8.5: seven skills in four categories, including the
    `dev` skills `digital-hygiene` and `progress-report`. A note says that
    `api.mzizi.dev/v1/skills` and the `/skills` pages still serve the earlier five-skill bundle.
  - `@nyuchi/mzizi-cli` 0.7.0, not 0.6.3, with its Astro target.
  - Every Mzizi Roots crate at 0.3.0, not 0.1.0.

  Its MCP paragraph adds the `astro` build in `mzizi_get_component`, the `astro` filter and
  `astroFile`, and `mzizi_get_skills`' `category`. The installer lines (the `/cli` entry and
  "Install components from absolute URLs") cover every target, Astro included, and the
  api.mzizi.dev route list adds `/v1/astro` and `/v1/astro/<name>`.

- **`/ecosystem` reads its versions at build time:** the MCP server's from npm, and the Roots
  crates' from crates.io. The registry card said the crates were at 0.1.0; it now shows 0.3.0.
  The MCP paragraph gives the Rust, Astro, React order and both filters. `/.well-known/mcp.json`
  and README's MCP card section name `mzizi-mcp` 0.13.0, checked 2026-10-07.
- **Fixed: `/cli` no longer says `mzizi add` refuses Astro.** From `@nyuchi/mzizi-cli` 0.7.0,
  `--target astro` (inferred in an Astro project) installs a component's pure `.astro` from
  `/v1/astro/<name>` into `src/components/mzizi/`. The heading, the detection sentence and the
  Astro line follow the npm version read at build time. When npm cannot be reached, the page
  says so. A prerelease such as `0.7.0-beta.1` counts as below `0.7.0`. `/components` calls
  `mzizi add` the installer for every target.
- **The language figures move from `62a0f32` to `9a88e1d`** (`/`, `/language`, `llms.txt`), from
  a fresh build at `9a88e1d`. `cargo test --workspace` gives 428 tests in 18 suites (was 425),
  and `compiler/src` is 12,706 lines (was 12,644). `mz contract` gives 29 clauses over the nine
  primitives. The captured `mz check --agent`, `mz hash`, `mz contract` and `mz build` outputs
  on `/language`, and the `button.mz` excerpt, are unchanged. The React arm's pins come from
  the registry's lockfile, no longer provisional.
- **`check-facts.py` checks more, and counts lines in the source.**
  - It counts `compiler/src` in the language's source (anonymous git) instead of reading the
    README, which still says 12,644.
  - It fails when `/ecosystem` names the Roots crates at any version but crates.io's.
  - `/.well-known/mcp.json` is now among the files that may not name an older `mzizi-mcp`.
- **Fixed: the rendered-page check expects 656 components (N2 388), not 655 (N2 387).** The
  registry's v4.6.0 added `markdown-parse` (installed with `markdown-renderer`), and
  api.mzizi.dev now serves it, so `scripts/verify-rendered.py` failed on every build.
  `AGENTS.md`, `README.md`, `scripts/generate-previews.mjs` and a code comment state the same
  count.

### Added — `CLAUDE.md` for Claude Code (2026-10-07)

- **`CLAUDE.md` imports `AGENTS.md`** and adds what it does not spell out: pull requests target `staging`, every `staging` merge is tagged as a patch, `pnpm run lint` needs `astro sync` types first, how `src/lib/registry.ts` feeds the pages at build time, and which files are generated (committed or not) versus hand-written. Docs only: no page, fact or behaviour changes.

### Added — `AGENTS.md` loads the Mzizi dev skills (2026-10-06)

- **`AGENTS.md` gains "Dev skills, progress reports and the merge gate"**, the canonical rule block from nyuchi/.github#87, after "Track big work in GitHub issues": load the Mzizi dev skills (`digital-hygiene` and `progress-report`), clone only into a directory unique to the agent, run dev work on a 10-minute progress-report loop whose ticks never publish, release, merge or deploy without the owner's approval, and merge only through the merge gate. Docs only: no behaviour changes, and CI is unchanged.

### Fixed — the rendered-page check expects the registry's live counts (2026-10-06)

- **`scripts/verify-rendered.py` expects 655 components (N2 387, N6 90), not 577 (N2 371, N6 52).**
  The site builds from api.mzizi.dev, which now serves registry v4.3.0's 655 components, so CI
  failed on every branch. `AGENTS.md`, `README.md` and two code comments state the same count.
  No page changes.

### Added — the published design system is linked (2026-10-04)

- **`llms.txt`, `AGENTS.md` and `README.md` link the Design System artifact**
  (<https://claude.ai/artifact/G8CCtAbZ8w717uQ3R5itCc>), the Mzizi design system published on
  claude.ai. `llms.txt` lists it under "Source of truth". All three name its source, the
  `design-system/` folder in `mzizi-registry` (arriving with mzizi-registry#418), as the copy
  to edit. No page changes.

### Changed — nhimbe leaves the wordmark list (2026-10-04)

- **`/ecosystem`, `llms.txt` and `AGENTS.md` no longer list `nhimbe` as a lowercase wordmark.**
  The owner's decision of 4 October 2026 retires the brand. The events platform is Mukoko
  Events at events.mukoko.com (mukoko-dev/nhimbe#155).

### Changed — the registry's component contracts are listed (2026-10-04)

- **`/ecosystem` and `llms.txt` say what the registry holds now, including the component
  contracts.** mzizi-registry#406 added `contracts/`: a versioned, machine-readable contract
  for each of the Mzizi Dashboard Standard's 31 `@bundu/ui` app components. The
  `mzizi-registry` entry on `/ecosystem` and under "Public repositories" in `llms.txt` now
  names it beside Mzizi Roots, and `llms.txt` links the Dashboard Standard page on
  docs.mzizi.dev.

### Changed — security reports go to `security@nyuchi.com` (2026-10-03)

- **Every page's footer, `/ecosystem`, `llms.txt` and `/.well-known/security.txt`'s `Contact`
  name `security@nyuchi.com`**, in place of `security@bundu.org` (owner decision,
  2026-10-03: one security contact for every repository, the console included).
  `SECURITY.md`'s routing table becomes one row; private advisories on the repository
  concerned still work. `scripts/verify-rendered.py` checks for the new address.
  `Expires` (2027-09-29) is unchanged.

### Changed — Vite+ 1.0 checks and type checks the site (2026-10-03)

- **`vite-plus` 1.0.0** (was 0.3), with a `vite.config.ts` that turns on type-aware linting and type checking and carries the org format settings. `pnpm run check` now runs `astro check` and then `vp check`. No page changes: three source files were re-indented by the formatter.

### Changed — the registry has no app any more (2026-10-02)

mzizi-registry removed its Next.js app on 2026-10-02 (mzizi-registry #389 and #391), so the site stops describing one.

- **`/ecosystem`:** mzizi-registry's role is "The components: design system and registry". It was "…registry and portal"; the portal pages are this site's (`/components/<name>` and the rest).
- **`llms.txt`:** "the portal version" is now "the registry version" in the rule about not hardcoding counts. The skills version is unchanged here.
- **`_redirects`:** the comment on the ported portal pages says the registry app itself is gone. No redirect changes.
- **`scripts/generate-previews.mjs`:** it no longer defaults to the registry app's `/playground/<name>` on `mzizi-registry.nyuchi.workers.dev`, which was removed and whose Worker is being deleted. It exits with a message unless `MZIZI_PLAYGROUND_ORIGIN` names a renderer. The committed screenshots are unchanged.
- **README:** the cutover history says the portal pages are rebuilt here (all but `/brand` and `/r/`) and that their old home is gone, and the owed items no longer ask for the registry portal to come back.

### Changed — lint runs once, from the org-required workflow (2026-10-03)

- **Removed `.github/workflows/lint.yml`.** The `mzizi-dev` org ruleset now runs the shared lint on every pull request through `mzizi-dev/.github`'s `org-lint.yml`, publishing the same five `lint / …` checks, so the repo's own caller only ran lint a second time.

### Changed — agent skills 0.8.5

- **`llms.txt`** names `@nyuchi/mzizi-skills` **0.8.5** (was 0.8.4), which npm, `mcp.mzizi.dev` and `api.mzizi.dev/v1/skills` now all serve.
- **`/skills` and `/skills/<name>`** are rebuilt from `api.mzizi.dev`, which now serves 0.8.5 (registry #387, gateway #27). The pages now follow language main `62a0f32`:
  - `mzizi-language` says to check `LANGUAGE-TRACKER.md` before claiming a capability. It teaches the backend `service` (RFC-0011), `mz build` and the MZ08xx codes, and cites RFC-0012 (the harness, a draft) and charter v0.4.
  - `mzizi-backend` describes the language's one backend slice, with no Workers target and nothing live.
  - `mzizi-roots` says only a service lowers, not a component.
  - The skill pages no longer say "nothing lowers yet" or cite charter v0.3.

### Changed — the site matches language main `62a0f32`

A freshness update. What the language can do is now taken from
`LANGUAGE-TRACKER.md` in `mzizi-dev/mzizi`, the language's one tracker of what
it still needs. The facts that moved:

- **Figures:** 425 tests in 18 suites (was 308 in 14) and 12,644 lines in
  `compiler/src` (was 7,454), from a fresh build at `62a0f32` (was
  `e9e9233`). The contract bench and the captured `mz check --agent` output
  on `/language` were re-run at `62a0f32` and are unchanged; they now cite it.
- **Added: "What still has to be built".** The landing status panel and
  `/language` link `LANGUAGE-TRACKER.md` under that name. `/language` has a new
  section summarising it: Mzizi's column against Python, Go, C++, TypeScript
  and Rust, and milestones M1 (a language that computes) and M2 (a working
  programming language), neither reached. The landing page, `/language` and
  `llms.txt` say plainly that Mzizi has no expressions, bindings, callable
  functions, loops, error handling, modules or standard library yet.
- **Changed: what lowers.** "Nothing lowers yet" and "no lowering to Rust" are
  replaced with the narrower truth: `mz build` lowers a `service` (HTTP routes
  and handlers, RFC-0011) to a local Rust + axum package, which CI compiles,
  tests and serves. No component lowers, and there are no Workers, Containers
  or WebAssembly targets. `mz contract` runs a service in process. The `mz`
  commands are listed as check, fix, contract, outline and build (plus hash and
  ir for the IR); `/cli` gains a `mz build` row.
- **Added: RFC-0011 (handlers) and RFC-0012 (the harness)** to the RFC lists on
  `/language`, `/ecosystem` and `llms.txt`. The harness's design is cited as
  RFC-0012 (was "its RFC is being written"). RFC-0009's and RFC-0010's notes no
  longer say nothing in them is implemented.
- **Changed: charter v0.4.** Every citation of the charter says v0.4 (was
  v0.3), and `llms.txt` gives its title, "Mzizi: a general-purpose programming
  language", and its tagline as the goal Phase 0 tests.
- **Changed: "What Mzizi is measured against"** and the `/language` arms table
  follow `benchmarks/arms/`: the React arm exists and has never run (was
  "new"); the Mzizi backend arm, `mzizi-be`, exists with the probe crate
  `mzprobe` and task B1 and has never run (was "blocked"); the Hono, FastAPI,
  Go, C++ and axum arms are not added yet (was "new"). What the kill-criterion
  run still waits on follows `benchmarks/READINESS.md`.
- **Fixed: `llms.txt`** no longer says `api.mzizi.dev/v1/skills` serves skills
  0.8.2; it serves 0.8.4, as npm and `mcp.mzizi.dev` do.
- **Gates:** `verify-rendered.py` now requires the tracker link, the
  "no expressions, bindings, …" sentence, the narrower lowering claim, RFC-0011
  and RFC-0012, and the arms' states, and refuses the old figures, "charter
  v0.3", "nothing lowers yet" and "cannot write or run a handler".
  `check-facts.py` reads the charter's version, the tracker's rows and the
  `benchmarks/arms/` listing live, and fails when the site disagrees, including
  when a tracker row the site calls missing turns ✅.

### Changed — Mzizi is presented as a programming language, and Phase 0 as its goal

The owner's positioning (2026-09-30): Mzizi is a programming language whose
goal is to be used instead of TypeScript, Python and C++, and Rust is its
platform the way JavaScript is TypeScript's. The toolchain and the components
are built to support the language; neither is the language. Every claim is
stated as a goal, never a result.

- **The landing page leads with the owner's tagline.** The hero now reads
  "Mzizi: a general-purpose programming language", with the subline "Built to
  make Rust better, the way TypeScript makes JavaScript better" (was "A
  language designed for machines to write", over "a research language and
  compiler"). One line says how (no borrows, lifetimes or ownership in the
  language you write, with the harness at the core, the layer an agent reads)
  and that this is the goal Phase 0 measures, not a result. The page title,
  meta description and `llms.txt` say the same. Its second button goes to the new benchmark
  section instead of the charter. The status panel still follows directly; it
  now opens with Phase 0's goal, and presents the two pilots as the first tests
  inside Phase 0, not its goal. Phase 0's one goal is to build Mzizi as a
  programming language, measured against the best existing language for each
  kind of task.
- **Added: "What Mzizi is measured against"**, straight after the status panel.
  One card per RFC-0009 task family (`ui-spec`, `backend`, `ui-port`, the
  public suites), with its role (gating or not), what the agent writes, each
  language it is measured against and whether that arm exists or is new, and
  where the Mzizi arm stands. It is the benchmark's question, not a results
  table, and it links where every run is published.
- **Fixed: the toolchain is no longer "the language".** The toolchain section
  no longer says "The compiler is the language". "What the language is" no
  longer lists the `mz` compiler or the IR as parts of the language: it lists
  the language (syntax, type system, semantics, contracts) and says under "It
  isn't" that the toolchain and the components are not the language. Agent
  skills join the toolchain list.
- **Fixed: the components are no longer "the benchmark corpus the language is
  scored against".** On the landing page, `/components` and in `llms.txt` they
  are the language's UI layer and component model (Mzizi Roots, Rust first),
  and supplying the benchmark's public UI tasks is one of their jobs.
- **`/language`:** Phase 0 is titled by its goal (build Mzizi as a
  programming language, measured against the best existing language for each
  kind of task), the task families are described
  as RFC-0009 defines them, and a new table lists every benchmark arm with its
  language, framework and state (exists, never run, new or blocked). Fixed:
  "Mzizi lowers to Rust and Dioxus" is now "designed to lower to Rust; nothing
  lowers yet"; the Leptos arm is marked as never run; the held-out task
  repository is described as not yet created; a defect is defined for backend
  probes as well as UI facts.
- **The harness is the core of the language, by design.** The landing page's
  "It is" list, `/language` and `llms.txt` say the harness is the core of
  Mzizi, the layer an agent reads and works through: the language as an agent
  sees it, the agent protocol, and the plugin host the toolchain, the CLI, the
  MCP server and plugins attach to. Part of it exists as `mz check --agent`'s
  output; the harness as a whole is designed, not built (its RFC is being
  written). It lives in the language repository, `mzizi-dev/mzizi`, and the
  agent-tools packages are its clients. The Phase 0 benchmark harness is named as such everywhere, so the
  two are not confused.
- **`llms.txt`** now says plainly, first, that Mzizi is a general-purpose
  programming language, what its goal is, and which things are toolchain and
  which are components, with RFC-0009's families and arms, and a new rule: do
  not call the toolchain or the components the language.
- **Fixed, stale versions:** `mzizi-mcp` is 0.11.2 on npm, the MCP Registry and
  `mcp.mzizi.dev` (was 0.11.1 in `llms.txt` and `/ecosystem`, 0.11.0 in `.well-known/mcp.json`).
  `@nyuchi/mzizi-skills` is 0.8.4 on npm and `mcp.mzizi.dev`;
  `api.mzizi.dev/v1/skills` still serves 0.8.2 until the gateway's next pin
  (was "0.8.1 everywhere").
- `/cli`, `/ecosystem`, `/architecture`, the footer and the page title say the
  same: `mz` is the compiler that implements the language, the registry is the
  components built to support it, and Mzizi owns the language, its toolchain
  and its components rather than "the framework".
- The rendered-content gate now refuses "the compiler is the language", "the
  corpus the language is scored against", "framework for the agentic",
  "Mzizi lowers to Rust" and the old Phase 0 title, and requires the landing
  page's goal, the Rust-as-platform line, the benchmark section after the
  status panel with every family and arm, and `llms.txt`'s "what is which".

### Changed — the site is rebuilt on `@bundu/ui` 0.2.0, with a hero (#31)

- **The landing page opens on a hero.** The headline is "A language designed
  for machines to write." It carries a "Phase 0 · research prototype" badge,
  two calls to action (try the contract bench, read the charter), and the live
  contract bench beside it. The status panel follows directly, word for word.
  The long text below it is now short sections with cards and tabs; no content
  was removed.
- **Every page is built from `@bundu/ui` 0.2.0.** Each page has a header band
  with a breadcrumb (and BreadcrumbList structured data), and the site's own
  badges, panels, status blocks and rules are now the package's `Badge`,
  `Card`, `Alert` and `Separator`. They render to static HTML: no framework
  JavaScript ships to the browser.
- **Mzizi's colour is now hematite**, the owner's brand decision (2026-09-30),
  replacing the copper the site wore before. Styling is Tailwind v4 over
  `@bundu/ui`, and dark mode still follows the operating system.
- `llms.txt`: `@nyuchi/mzizi-skills` 0.8.1 (five skills), now served by
  `/v1/skills` and the MCP alike; `mzizi-mcp` 0.11.1 (also on `/ecosystem`);
  `@nyuchi/mzizi-cli` 0.6.3.

### Fixed

- **`/tokens`, "Semantic roles"** no longer says the registry's default
  `--primary` is tanzanite and that the site overrides it with copper. It now
  says what the sources say: `/v1/brand`'s semantic ladder still publishes
  tanzanite; the registry's `mzizi-tokens-globals.css` defaults to the Mzizi
  brand, so its `--primary` is `var(--heritage-hematite-aa)`; and this site
  wears hematite through `@bundu/ui`'s `brand-mzizi.css`, which sets `--primary`
  and `--ring` to `--color-hematite`.
- The landing page no longer scrolls sideways on a 375px-wide phone.
- "Mzizi" is Swahili for root, as the docs and the registry say; `/ecosystem`
  and `llms.txt` said Shona.
- The contract bench's keywords meet WCAG AA contrast in light mode.

### Removed

- `src/components/DesignTokens.astro`, the site's generated copy of the palette,
  which `@bundu/ui` 0.2.0 now carries.

### Added

- `CHANGELOG.md`, backfilled from every merged pull request since the site
  began (2026-09-11).
- The `changelog / entry required` check (`.github/workflows/changelog.yml`,
  `scripts/changelog-gate.sh`), which fails a pull request that changes a
  non-exempt file without adding to this file. `scripts/changelog-gate.test.sh`
  tests the gate, and the check runs it first.
- A note beside the inline-spacing check in `scripts/verify-rendered.py`, and
  in `AGENTS.md`, on why it reads the component and skill pages (#29). Registry
  text reaches those pages escaped, so a word glued to a tag there is in this
  site's template and must not be skipped. Nothing on the site changes.

## [2026-09-30]

### Fixed

- Words no longer run into links and inline code where Astro dropped the space
  at a line break, for example "nyuchi,mukoko" on `/ecosystem` and
  "--targetoverrides" on `/cli`: 78 places on the built site. The
  rendered-content gate (`verify-rendered.py`) now fails the build on any new
  one. (#28)

### Changed

- `llms.txt` says `@nyuchi/mzizi-skills` 0.8.0 (five skills) is on npm while
  api.mzizi.dev `/v1/skills` still served the older bundle at the time, and
  points at `meta.version` to check. `/skills` no longer names individual
  skills in its introduction. (#27)
- **Contact:** the footer on every page gives `support@bundu.org` beside
  `security@bundu.org`, `/ecosystem` gains a Contact section, and `llms.txt`,
  `/.well-known/mcp.json`, README and SECURITY.md name it. The site, `llms.txt`,
  the MCP card and `/components` say mcp.mzizi.dev serves mzizi-mcp 0.11.0,
  Rust first (`mzizi_get_component` leads with the Mzizi Roots crate), and that
  `@nyuchi/mzizi-cli` is 0.6.2. The gateway's registry pin is described as
  moving by itself, read from the `X-Mzizi-Source` header. (#26)
- **Each Rust component names its own crate** (mzizi-ui, mzizi-brand,
  mzizi-shell, mzizi-assurance and so on), read from the API's `crate` field,
  instead of mzizi-ui for all of them. A shared crate list with each crate's
  component count and crates.io state appears on the home page, `/components`
  and `/cli`, and component pages link the crate's git source. (#25)
- **The language facts move to mzizi-dev/mzizi `e9e9233`:** 308 tests in 14
  suites and 7,454 lines of `compiler/src`, `mz fix` built, RFC-0009 and
  RFC-0010 linked as drafts, charter v0.3's design goals and phases, and Phase
  0 stated as not complete. All ten Mzizi Roots crates are on crates.io at
  0.1.0, so the pages offer `cargo add mzizi-roots`. The mzizi-cli 0.6.0
  bin-link workaround is gone (0.6.1 fixed it). (#24)

### Added

- A daily and on-demand Freshness workflow (`scripts/check-facts.py`) that
  compares the built site with the language README, npm, crates.io and the MCP
  Registry. It is not a required check. (#24)

## [2026-09-29]

### Added

- **The registry portal's remaining pages are ported, Rust first:**
  `/components/<name>` (577 static pages), `/skills` and `/skills/<name>`,
  `/cli`, `/playground` and `/observability`, built from api.mzizi.dev `/v1`
  at build time. Where a component has a Mzizi Roots implementation (43 at the
  time), its Rust source, crate and crates.io state lead the page and the
  React build follows. `/components` gains a Mzizi Roots section and a Rust
  filter. `/components/nyuchi-*` 301s to `/components/mzizi-*`, and
  `/playground/<name>` 302s to `/components/<name>`. (#23)
- `/.well-known/security.txt` (RFC 9116) and `SECURITY.md`. (#22)

### Changed

- **mzizi.dev leads with the Mzizi language:** the thesis, the status panel
  (two pilots, no advantage shown; the kill criterion, Mzizi against the best
  existing language for each kind of task, not yet measured), the
  `mz contract` bench, and what the language is and isn't. The toolchain and
  the components follow as supporters of the language. The bench's first paint
  is rendered at build time, so it works with JavaScript off. (#22)
- The MCP card, `/ecosystem`, `/skills`, `/cli` and `llms.txt` say the MCP
  server and the CLI are free without sign-in, except the Fundi tools
  (`mzizi_fundi`, `mzizi_report_issue`). `/cli` says `mzizi add` ships in
  `@nyuchi/mzizi-cli` 0.6.0; `/language` lists RFC-0006 to RFC-0008. (#22,
  #23)
- **The site's facts move to 2026-09-29:** api.mzizi.dev is served by
  mzizi-api-gateway (a Hono Worker over the registry's files); nothing is
  generated from a database; the two Phase 0 pilots of 2026-09-27 are reported
  as they fell (neither showed an advantage, and the ~7B open-weight model did
  worse in Mzizi); the compiler figures are re-measured at `a9c928d` (269 tests
  in 12 suites, 6,684 lines, 29 contract clauses) with the method printed
  beside them. (#21)
- `/api/v1` and `/api/v1/*` 308 to `https://api.mzizi.dev/v1`. The portal pages
  not yet ported at the time 302'd to the registry app instead of 404ing.
  (#21)

## [2026-09-27]

### Added

- **A new home page:** a two-column hero with a live `mz contract` bench
  running against the real `primitives/button.mz`, four stat tiles with
  verified numbers, a have/not-yet ledger and a repository grid. (#10)
- **A rebuilt header and footer:** a mobile drawer with the full navigation, a
  focus trap and Escape to close; a vertical mineral strip on the left edge;
  an icon pill linking the GitHub org and the Registry API; and the footer as
  the full site navigation. (#10)
- **Site search** (Pagefind, built at `pnpm run build`), opened from the header
  or with Cmd/Ctrl+K. (#10)

### Changed

- The primary colour is copper, `#b4532f` in light mode and `#FF8A65` in dark,
  replacing tanzanite. (#14)
- Mzizi, not the Bundu Foundation, is named as owner of the framework, the
  registry, the docs and this site, and as operator of the design system and
  registry. The footer's copyright notice names the Bundu Foundation as the
  legal holder. (#16, #17, #19)
- The Mzizi wordmark is capitalised, and larger in the header, and `llms.txt`
  and `/ecosystem` say so; other wordmarks stay lowercase. (follow-up to #10,
  #20)
- `/ecosystem` says docs.mzizi.dev is live and lists every hostname as served
  that day; the README's Docs link points at docs.mzizi.dev. (#13, #18)
- The README is split: the incident narrative stays in `README.md`, and the
  commands, rendered-content gate and deploy mechanics move to a new
  `AGENTS.md`. (#13)

### Fixed

- The search panel and the mobile drawer no longer render open on page load.
  (#10)
- The header's right-hand actions sit flush right on phones instead of leaving
  a gap. (follow-up to #10)

## [2026-09-26]

### Added

- **The site is rebuilt on `@bundu/ui`**, and `/components`, `/architecture`
  and `/tokens` are ported from the registry portal, reading the registry at
  build time. (#8)
- `/components` cards can show a screenshot, produced on demand by
  `scripts/generate-previews.mjs`. `/language` shows real captured
  `mz check --agent` output, a clean run and one with an error. (#9)

### Fixed

- The wash surfaces referenced an undefined `--brand-accent` variable; the
  component count reads 577 everywhere it is stated; the token stylesheet
  escapes `<` and `>` in served names and values before it is injected into
  the page. (follow-up to #8)
- `wrangler.jsonc` names the Cloudflare account, so deploys run
  non-interactively. (#2)

## [2026-09-11]

### Added

- **The first site:** three pages, `llms.txt` and `/.well-known/mcp.json`, as
  a static Astro build on a Cloudflare Worker with Static Assets. (#1)
- The org lint gate and its config files, later brought in line with the
  current org canon. (#4, #7)

### Changed

- The README says the apex cutover had already happened: mzizi.dev was served
  by this Worker, attached in the Cloudflare dashboard outside version
  control, and the registry portal's pages were 404 there. (#6)

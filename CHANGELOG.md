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

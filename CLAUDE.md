# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`AGENTS.md` (imported above) is the canonical rulebook: commands, the CI gates, the
freshness rule, the changelog rule, the deploy footgun, content honesty and naming. This
file adds only what it does not spell out.

## Branches and releases

- `staging` is the integration branch. Branch from `origin/staging` and open pull requests
  against `staging`, not `main`. `main` is what deploys to `mzizi.dev` (see
  `CHANGELOG.md`'s header); work reaches it from `staging`.
- Every push to `staging` runs `.github/workflows/staging-version.yml`, which calls the
  org's reusable staging-release workflow and tags the merged commit as the next **patch**
  (minor/major only via a manual `workflow_dispatch`), so don't create release tags by hand.
- CI (`ci.yml`) runs on pushes to `main`/`staging` and on pull requests targeting `main`,
  `staging` or `claude/**` (so stacked PRs get checks too).
- The `changelog / entry required` check exempts only `.github/`, lockfiles and lint/format
  config (`scripts/changelog-gate.sh`). Any other file, including `CLAUDE.md`, `AGENTS.md`
  or `README.md`, needs a `## [Unreleased]` entry in `CHANGELOG.md` or the `no-changelog`
  label.

## Command notes (beyond the list in AGENTS.md)

```bash
pnpm run ci:prepare                 # astro sync: generates .astro/ types
pnpm check                          # astro check && vp check (type-aware oxlint + typecheck + fmt check)
pnpm fmt                            # vp fmt (settings in vite.config.ts; mirror nyuchi/.github/.oxfmtrc.json)
pnpm test                           # vp test --passWithNoTests; there are no unit tests today
bash scripts/changelog-gate.test.sh # the only scripted test suite (changelog gate, throwaway git repos)
```

- `pnpm run lint` on a fresh clone fails with a TS2339 error on `import.meta.env`
  until `.astro/` types exist. Run `pnpm run ci:prepare` (or `pnpm check`)
  first; CI gets them from `astro check`, which runs before lint.
- `pnpm build` is `astro build && pagefind --site dist`: it needs the network
  (`api.mzizi.dev`) and also writes the site-search index into `dist/pagefind/`.
- There is no per-test selection. `scripts/verify-rendered.py` and `scripts/check-facts.py`
  each take only the dist directory and run every assertion; read the `[FAIL]` lines.
- When the registry's counts move (e.g. the component total or a node count), the
  rendered gate fails on every branch. Update the expected numbers in
  `scripts/verify-rendered.py` and the same counts stated in `AGENTS.md`/`README.md`, with a
  changelog entry (see the 2026-10-06 "Fixed" entry for the pattern).

## Architecture: how the pieces connect

- **One API client.** `src/lib/registry.ts` is the only code that talks to the registry
  API. `readJson()` reads `https://api.mzizi.dev/v1/*` (or `MZIZI_API_ORIGIN`), dedupes
  in-flight requests, caps concurrency at 8, retries with backoff, and throws a loud build
  error rather than falling back. A 404 from `/v1/rs/<name>` is data ("no Rust sibling"),
  not a failure. It also checks crates.io/npm package states and exports `builtAt`, the
  timestamp pages print beside every API-sourced number.
- **Pages.** `src/pages/*.astro` call the `registry.ts` getters in frontmatter.
  `components/[name].astro` and `skills/[name].astro` use `getStaticPaths()` to emit one
  page per registry component/skill, so the page count tracks the live registry.
  `src/layouts/Site.astro` is the shared shell (header drawer, footer contacts, Pagefind
  search dialog).
- **No client framework.** `@bundu/ui` React primitives and `src/components/StaticTabs.tsx`
  render to HTML at build time via `@astrojs/react`. Never add a `client:*` directive; the
  rendered gate fails any page that hydrates or loads the React client. Interactivity is
  small vanilla scripts (e.g. `src/scripts/tabs.ts`) that enhance already-rendered HTML.
- **Static, file-format output.** `astro.config.mjs` sets `output: "static"` and
  `build.format: "file"`; `wrangler.jsonc` serves `dist/` as Worker Static Assets with a
  `404-page` fallback. `public/` (`_redirects`, `llms.txt`, `robots.txt`, `.well-known/`) is
  copied verbatim and CI asserts those files survive into `dist/`.

## Generated vs hand-written

- **Generated, never committed:** `dist/` (including `dist/pagefind/`) and `.astro/`.
- **Generated, then committed:** `public/previews/<name>.jpg` and
  `src/data/component-previews.json`, written by `scripts/generate-previews.mjs`
  (Playwright; on demand, not part of the build; requires `MZIZI_PLAYGROUND_ORIGIN` since
  the old registry playground was removed). `src/lib/previews.ts` reads the manifest via
  `import.meta.glob`, so a missing manifest just means no preview images.
- **Read live at build time:** component lists, node counts, Rust crates, skills, brand
  palette and package versions. Don't hard-code these or commit a snapshot of API data.
- **Hand-written facts the build cannot read** (language test counts, versions, tracker
  sentences) live in `src/pages/index.astro`, `src/pages/language.astro` and
  `public/llms.txt`; `scripts/check-facts.py` (daily `Freshness` workflow) keeps them honest.
  When it fails, fix the site from upstream, not the check.

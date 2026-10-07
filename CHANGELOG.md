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
  - **Landing on staging** (`509bc2f`), not yet released: RFC-0013, the core language, a
    draft (mzizi#76), with its amendments from the language survey (mzizi#81); the foundation slice, with `program`, `fn`, `let`/`var`, `int`/`bool`/
    `text` expressions, `when`/`else`, `print` and `mz run` (mzizi#80), whose tracker rows
    stay 🟡 until it reaches `main`; `design/LANGUAGE-SURVEY.md` (design input); release
    notes from the changelog (mzizi#82); and `CLAUDE.md` (mzizi#77).
  - **In progress toward M1**, labelled "Not available yet": the tracking issue mzizi#69,
    Wave 1's numbers (mzizi#83), the performance suite against hand-written Rust
    (mzizi#85, the benchmark only; no result is committed to the repository, and its pull
    request's description records one informal run on one machine) and a pre-commit hook (mzizi#84), all open and
    unmerged.
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

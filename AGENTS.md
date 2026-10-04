# AGENTS.md — mzizi-site

> Vendor-neutral instructions for any AI agent working in this repository. See
> [`README.md`](./README.md) for what this site is and why it looks the way it does.

## What this repo is

Astro, static output, deployed as a Cloudflare Worker with Static Assets, serving the
`mzizi.dev` apex. No islands, and no UI framework in the browser: pages render at build
time from the public registry API (`api.mzizi.dev`), styled with Tailwind v4 over
`@bundu/ui`, whose React primitives render to static HTML through `@astrojs/react` with no
`client:*` directive. See README's "Where the content comes from" for why build
time, not the browser.

## Build, test, run

```bash
pnpm install
pnpm dev              # local dev server
pnpm run lint         # vp lint (Vite+/oxlint)
pnpm check            # astro check — typechecks pages and frontmatter
pnpm build            # emits dist/
pnpm preview          # serve dist/ locally
python3 scripts/verify-rendered.py dist    # what CI runs; see "The rendered-content gate" below
python3 scripts/check-facts.py dist        # live upstream facts vs dist/; needs the network, not in required CI
```

CI runs, in order: `astro check`, `pnpm run lint`, `astro build`, a guard that the built
`dist/` still contains `llms.txt`, `robots.txt`, `_redirects`, `.well-known/mcp.json`, `.well-known/security.txt` and
`404.html` (the `.well-known` check exists because it's a dot-directory and tooling skips
those by default often enough to be worth proving every time), the rendered-content gate,
and a gitleaks scan.

### The rendered-content gate

Strips every `<script>` from the built HTML and asserts the content is still there: 577
component cards and 577 component pages (each with its source and install command, Rust
before React where there is Rust), the Roots list, the eight node titles, the four rung
titles, the six strands, N2's count of 371, all 21 colour families by CSS variable,
specific hex values, the landing page's Hero (with the contract bench as its media and
the "Phase 0 · research prototype" badge) followed directly by the status panel, ahead of
the components, and no "faster", "better than" or "outperform" on it, that no page hydrates
an island or loads the React client, the skills, `/cli`, `/playground` and `/observability`, `security.txt`'s
`Expires` still in the future, the `/mcp` and `/api/v1` redirects, and no redirect left
pointing at the registry app. A page that quietly renders nothing fails the build — this is the gate
`mzizi-console` shipped without, and paid for with a blank production page that passed CI.

It also refuses known-stale facts: an old test count ("269 tests"), RFC-0009 or RFC-0010
called "forthcoming", `mz fix` listed as unbuilt, the 0.6.0 bin-link workaround, or
`/openapi` said to read from Supabase. Add a pattern there whenever a fact goes stale.

It also holds the positioning (owner, 2026-09-30): Mzizi is a programming language whose
goal is to be used instead of TypeScript, Python and C++, with Rust as its platform the way
JavaScript is TypeScript's. The landing page must state that goal and the owner's tagline ("Built to make Rust better,
the way TypeScript makes JavaScript better", as the goal Phase 0 measures), and
put "What Mzizi is measured against" (every RFC-0009 family and arm, as the benchmark's
question, not a results table) directly after the status panel; `llms.txt` must say which
things are toolchain and which are components. No page may say "the compiler is the
language", call the components "the corpus the language is scored against", call Mzizi a
"framework for the agentic" web, or say Mzizi lowers or compiles to Rust today: only a
`service` lowers, to a local Rust + axum package (`mz build`), and no component does.

It also holds the language tracker (owner, 2026-09-30): `LANGUAGE-TRACKER.md` in
`mzizi-dev/mzizi` is the one list of what Mzizi still needs, and **every capability claim
on this site comes from it**. The landing status panel and `/language` link it as "What
still has to be built", RFC-0011 and RFC-0012 are in every RFC list, and the landing page,
`/language` and `llms.txt` say plainly that Mzizi has no expressions, bindings, callable
functions, loops, error handling, modules or standard library yet. `check-facts.py` reads
the tracker, the charter's version and `benchmarks/arms/`, and fails when that sentence, a
charter version or an arm's state no longer matches upstream.

It also holds the contact addresses: every page's footer links `support@bundu.org` (the
owner's general contact for Mzizi, 2026-09-30) and `security@nyuchi.com` (the one security
contact for every repository, owner, 2026-10-03); `/ecosystem`, `llms.txt` and
`.well-known/mcp.json` name `support@bundu.org`; and no page this repo writes may carry any
other address. Never put a person's own address anywhere.

It also fails on a word glued to an inline tag in the built HTML (`nyuchi,<code>mukoko`,
`</code>takes`). Astro drops the line break between a source line that ends in text and
a next line that starts with `<a>`, `<code>`, `<strong>`, `<em>` and the like (or a line
that ends in a closing tag and a next line that starts with a word). End the first line
with `{" "}`, as the rest of the site does. `(<code>`, `"<a` and anything inside `<pre>`
are allowed. A skill page's body (the registry's Markdown, set as raw HTML) is skipped;
every other part of `components/<name>` and `skills/<name>` is checked, because registry
text there is escaped and any join is in this repo's template.

## Freshness rule

The owner's hard rule (2026-09-30): **mzizi.dev must never lag the language
(`mzizi-dev/mzizi`) or the components** (`mzizi-registry`, the Mzizi Roots crates on
crates.io, and the `@nyuchi/` npm packages built in `agent-tools`).

- A standing site-freshness agent checks upstream state (language `main`, registry
  `main`, the API gateway's registry pin, npm, crates.io, the MCP Registry) against what
  this site says, and opens a PR whenever the site drifts.
- Anyone changing the language or the components must expect a site update to follow,
  and should say so in their PR body.
- `scripts/check-facts.py dist` reads the live facts — the language README's test and
  suite counts, the charter's version, `LANGUAGE-TRACKER.md`'s rows, the arms in
  `benchmarks/arms/`, the npm `latest` versions, the crates.io versions, the crate each
  `/v1/rs/<name>` document names (every Roots page must lead with Rust and name that
  crate), the MCP Registry listing — and fails when the built site disagrees. While the
  Roots crates are on crates.io, it also fails on any page saying one is not. It needs the network, so it runs in
  the `Freshness` workflow (manual and daily), never in the required CI path. When it
  fails, update the site from the upstream source, not the check.
- Facts the build can read (component counts, crate states, npm versions) are read at
  build time. Facts it cannot (the language's test count, lines, commit) are written in
  `src/pages/index.astro`, `src/pages/language.astro` and `public/llms.txt`, and
  `check-facts.py` is what keeps them honest.

### Local dev against a mirror

To build against something other than the live API — it went down for several minutes
during this site's own build-out — set `MZIZI_API_ORIGIN` to a host serving `/v1/ui`,
`/v1/ui/<name>`, `/v1/rs/<name>`, `/v1/architecture`, `/v1/brand`, `/v1/skills` and
`/v1/stats`. **Do not commit a snapshot.** The build reads the API
or fails; a cached copy that keeps serving after the source moves is exactly the failure
this whole approach exists to avoid.

`build.format: "file"` emits `/ecosystem.html` rather than `/ecosystem/index.html`, which
the Static Assets server resolves from `/ecosystem` with no redirect hop.
`not_found_handling` is `404-page`, not the single-page-application rewrite: this is a
multi-page site with no client router, and an unknown path that quietly rendered the
landing page would be a soft 404.

## Changelog (hard rule)

Owner's rule, 2026-09-30: "changelogs are super important".

- **Every pull request that changes a page, a stated fact, an agent-facing file
  (`llms.txt`, `/.well-known/*`), a redirect, a dependency or a default adds an
  entry under `## [Unreleased]` in `CHANGELOG.md`**, in the same pull request.
  Use the Keep a Changelog headings (Added, Changed, Deprecated, Removed, Fixed,
  Security), mark anything that breaks a URL **Breaking**, and say what a reader
  of the site sees differently, not the commit text. A freshness PR is no
  exception: name the facts that moved.
- The `changelog / entry required` check (`.github/workflows/changelog.yml`)
  fails a pull request without one. Pull requests that touch only `.github/`,
  lockfiles or lint config pass, and pure CI, lint or typo pull requests can
  carry the `no-changelog` label instead.
- The logic is `scripts/changelog-gate.sh`, tested by
  `scripts/changelog-gate.test.sh`. Keep both identical to the copies in the
  other Mzizi repositories.

## Deploying — read this before touching `wrangler.jsonc` or `routes`

```bash
pnpm build
pnpm exec wrangler deploy
```

**This is a production deploy to `mzizi.dev`.** The custom domain is attached to this
Worker in the Cloudflare dashboard, not in `wrangler.jsonc` (`wrangler.jsonc` still
declares no routes) — so `wrangler deploy` publishes to the apex whether or not the config
mentions it.

### The route footgun

A custom domain on a hostname something else already serves **takes** that hostname — no
staging step, no partial rollout, the change is complete before anyone looks at it. This
repo's own apex cutover happened exactly this way, outside version control, with no PR
recording the decision (see README for the full incident account).

If you ever do write a route into `wrangler.jsonc`, a custom domain takes a **bare
hostname**:

```jsonc
"routes": [{ "pattern": "mzizi.dev", "custom_domain": true }]
```

**Never `"mzizi.dev/*"`.** Wildcards are rejected outright, and a custom domain already
routes every path on the hostname to the Worker, so a `/*` is both invalid and redundant.
This three-field form silently broke two other Workers in this org (`mzizi-mcp`,
`agent-tools#102`, and `mzizi-console`, which never deployed at all) because **Workers
Builds previews upload a version without applying routes** — the config is only validated
on the production deploy, so the same commit reads green on a PR and red on `main`.

## Content and honesty rules

- **Every claim on this site traces to a file in this org** — mostly
  [`CHARTER.md`](https://github.com/mzizi-dev/mzizi/blob/main/CHARTER.md) — or to a request
  that was actually made. "Designed for" is accurate; "faster than" is not. Two pilots
  have run and neither showed an advantage (`mzizi-dev/mzizi` `benchmarks/results/`);
  the kill-criterion run has not happened (`benchmarks/READINESS.md`), so Phase 0 is
  not complete. Report every new result on the status panel, whichever way it falls.
- Numbers sourced from the registry (component count, per-node counts, the palette) are
  read from the API at build time. Every page showing one states when it was read and
  links the endpoint beside it — a dated fact, not a stale copy pretending to be current.
- `public/.well-known/mcp.json` is a convenience pointer, not a ratified standard — it
  carries no `$schema` and claims conformance to nothing.

## Deliberately not here

See README's "Deliberately not here" for the full list and reasoning (a DNS change, a
sitemap before `/brand` and `/r/` land, a page at `/mcp` instead of its 308, a committed
copy of the registry data, a link to a private repo). None of these is a missing feature —
don't add one without reading why first.

## Naming

The Mzizi wordmark is capitalised in prose: `Mzizi`. The other wordmarks stay lowercase:
`nyuchi`, `mukoko`, `shamwari`, `bundu`. Package names, hostnames and code
identifiers keep their literal spelling. This is `mzizi.dev`
itself — the front door — not to be confused with `mzizi-registry` (the component source)
or `mzizi-console` (`app.mzizi.dev`).

## The published design system

The Mzizi design system is published on claude.ai as the Design System artifact,
<https://claude.ai/artifact/G8CCtAbZ8w717uQ3R5itCc>: voice and content fundamentals, visual
foundations (surfaces, ink and accent, status colours), the marks, and component previews.
Its source of truth is the `design-system/` folder in `mzizi-registry` (arriving with
mzizi-registry#418), which the artifact is built from file for file. Edit the folder, never
the artifact page; the artifact is republished from registry `main` after a merge that
touches it.

## Track big work in GitHub issues

Any substantial build, migration, investigation or multi-step task gets a GitHub issue in the repo that owns it — before or as work starts — so another session, agent or person can pick it up.

- The issue holds the goal, the owner's decisions (verbatim where given), the plan, acceptance criteria, owner-only steps and links.
- Every PR references its issue (`Refs #n`; `Fixes #n` only when the merge completes it).
- Post progress, decisions and a hand-off note (what's done, what's left, branch names) as issue comments — at each merge and before a session or agent finishes.
- Work spanning repos gets a tracking issue that links the per-repo issues.
- Never put secrets, credential status or exploitable detail in issues on public repos.

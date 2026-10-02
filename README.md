# mzizi.dev

> The front door to Mzizi, a programming language, and it leads with the language: what the language is, what it aims for (to be used instead of TypeScript, Python and C++, with Rust underneath), what it has and has not shown, and then the toolchain and components (Mzizi Roots) that support it — plus the agent-facing files (`llms.txt`, `.well-known/mcp.json`) that say the same thing to a machine.

[![CI](https://github.com/mzizi-dev/mzizi-site/actions/workflows/ci.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-site/actions/workflows/ci.yml)
[![Lint](https://github.com/mzizi-dev/mzizi-site/actions/workflows/lint.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-site/actions/workflows/lint.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)

**Version:** 0.1.0 | **Live:** [mzizi.dev](https://mzizi.dev) — this repository serves the apex | **Docs:** [docs.mzizi.dev](https://docs.mzizi.dev)

Astro, static output, deployed as a Cloudflare Worker with Static Assets. The
same shape as `mzizi-console`, minus the islands: a landing page has nothing to
hydrate, and the registry pages below render at build time for the same
reason.

---

## ⚠️ This site now serves `mzizi.dev`, and nobody planned the day it started

**This section was previously a warning that the opposite was true.** It said the
apex was Vercel's, that this Worker declared no routes, and that making it serve
`mzizi.dev` "takes the apex away from the registry in a single deploy and breaks
all three of those surfaces at once". That warning is no longer a warning. It is
a description of what happened.

Measured 2026-09-12:

```console
$ curl -sSI https://mzizi.dev | grep -Ei 'server|x-vercel-id|x-powered-by'
server: cloudflare

$ curl -s https://mzizi.dev/llms.txt | md5
e99fdeddb685cffc336cda951cc7280d      # byte-identical to public/llms.txt here
```

No `x-vercel-id`. No `x-powered-by: Next.js`. The apex returns
`<title>Mzizi — a Rust framework for the agentic web</title>`, which is this
repository's landing page, and `/llms.txt` on the apex is byte-for-byte the file
in `public/`. `mzizi.dev` is served by this Worker.

### What that cost, and what has been rebuilt since

The registry's human-facing portal did not move anywhere when the apex changed
hands. Its pages have since been rebuilt here, on this site, on `@bundu/ui`
(`mzizi-site#5` first), all but `/brand` and `/r/`. The registry's Next.js app
that served the portal was removed on 2026-10-02 (`mzizi-registry#389` and
`#391`), so the "Was" column below is history: none of these pages has an
address anywhere else.

| Path on `mzizi.dev`                                       | Today                        | Was                                            |
| --------------------------------------------------------- | ---------------------------- | ---------------------------------------------- |
| `/`, `/language`, `/ecosystem`                            | 200                          | This site                                      |
| `/llms.txt`, `/robots.txt`                                | 200                          | This site                                      |
| `/.well-known/mcp.json`, `/.well-known/security.txt`      | 200                          | This site                                      |
| `/components`, `/architecture`, `/tokens`                 | **200 — rebuilt here**       | The registry's developer portal                |
| `/components/<name>`, `/skills`, `/skills/<name>`, `/cli` | **200 — rebuilt here**       | The registry's developer portal                |
| `/playground`, `/observability`                           | **200 — rebuilt here**       | The registry's developer portal                |
| `/playground/<name>`                                      | 302 to `/components/<name>`  | The registry's live preview, per component     |
| `/components/nyuchi-*`                                    | 301 to `/components/mzizi-*` | The pre-rename component names                 |
| `/brand`, `/r/`                                           | 404                          | The registry's developer portal                |
| `/api/v1`, `/api/v1/*`                                    | 308 to `api.mzizi.dev/v1`    | The registry API — now on `api.mzizi.dev`      |
| `/api/openapi`                                            | 404                          | The registry API — now `api.mzizi.dev/openapi` |
| `/mcp`                                                    | 308 to `mcp.mzizi.dev/mcp`   | The MCP server — now on `mcp.mzizi.dev`        |

The API and the MCP server survived, because they had already moved to their own
hostnames before the apex changed hands: `api.mzizi.dev` answers, and
`mcp.mzizi.dev/mcp` answers without a token: every tool is free except the two
Fundi tools, which need a console sign-in.

### How it happened, as far as this repository can tell

`wrangler.jsonc` in this repository **still declares no routes.** Nothing here
attaches `mzizi.dev` to this Worker. So the custom domain was added outside
version control — in the Cloudflare dashboard — and neither this repository nor
its review history records the decision.

The paperwork that should have preceded it:

| Change                                                                                                                 | State                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`mzizi-site#3`](https://github.com/mzizi-dev/mzizi-site/pull/3) — the ordered cutover runbook                         | Superseded — the cutover it plans for already happened; the registry-side blocker it found (below) is still open |
| [`mzizi-site#5`](https://github.com/mzizi-dev/mzizi-site/pull/5) — port `/components`, `/architecture`, `/tokens` here | **Merged**                                                                                                       |
| [`mzizi-registry#334`](https://github.com/mzizi-dev/mzizi-registry/pull/334) — point the apex at the Worker            | **Closed**, unmerged                                                                                             |

So the cutover ran without the runbook, and without the pull request that ports
the pages it displaced. That ordering is the whole failure: step 1 of the runbook
was to decide what the apex serves, and step 2 was to move the displaced surfaces
first. Neither happened. `mzizi-site#3` also found a real, still-open blocker
that predates this site entirely: `mzizi-registry`'s own API responses hardcode
`https://mzizi.dev/...` into `registryDependencies`, `homepage` and `docs` on
every item, so a consumer's `npx shadcn add` that follows a dependency link off
this site's install command can still 404 downstream. That needs fixing in
`mzizi-registry`, not here.

### The history is kept because it explains the risk, not to relitigate it

The original warning was correct about the mechanism and correct about the
consequence. It is preserved above, in the past tense, because the next person to
attach a custom domain to a Worker in this org needs to know that this is how it
goes wrong — and because `wrangler.jsonc` carries the same reasoning in a comment
that is now also out of date.

> A custom domain on a hostname that something else already serves **takes** that
> hostname. It does not create one. The Worker starts answering on the next
> request and the previous origin simply stops being asked. There is no staging
> step, no partial rollout, and no warning — the change is complete before
> anybody looks at it.

That is what `app.mzizi.dev` did _not_ do, and the difference is worth keeping
straight: `app.mzizi.dev` had no record before `mzizi-console`'s first production
deploy, so the custom domain **created** it. The apex had a record. So it was
taken.

### The route footgun, if a route is ever written down here

**Do not attach a custom domain or change routes without reading
[`AGENTS.md`](./AGENTS.md) first** — the exact syntax that's safe, the one that silently
broke two other Workers in this org, and why Workers Builds previews can read green on a
PR and red on `main` for the identical commit.

### What is still owed

Not in scope for a documentation change, and written down so nobody has to
reconstruct it:

1. **Decide, retroactively, what the apex serves.** It is currently a
   several-page site by accident rather than by decision. Either that is
   ratified, or something else replaces it. The registry portal cannot come
   back as it was: the registry's app was removed on 2026-10-02.
2. **Decide on `/brand` and `/r/`.** They are the only portal pages not rebuilt
   here: `/components`, `/architecture` and `/tokens` (`mzizi-site#5`), then
   `/components/<name>`, `/skills`, `/cli`, `/playground` and `/observability`
   are. Their old home, the registry's app, is gone, so they come back here or
   not at all.
3. **Fix the hardcoded apex URLs in `mzizi-registry`'s API responses**
   (`registryDependencies`, `homepage`, `docs` — found by `mzizi-site#3`)
   before anyone relies on `npx shadcn add` following a transitive dependency.
4. **Put the route in `wrangler.jsonc`.** A production route that exists only in
   a dashboard is a route nobody can review, and it is why this README was wrong.
5. **Then update this section again** — with a real request, not a green check.

## Where the content comes from

The registry pages are rendered from the public API **at build time**:

```
https://api.mzizi.dev/v1/ui            577 components, 11 fields each
https://api.mzizi.dev/v1/ui/<name>     one component, with its React source
https://api.mzizi.dev/v1/rs/<name>     its Rust implementation, or a 404 saying there is none
https://api.mzizi.dev/v1/architecture  8 nodes, 4 rungs, 6 strands, live counts
https://api.mzizi.dev/v1/brand         21 colour families, type, space, radii, specs
https://api.mzizi.dev/v1/skills        the agent skills, and /skills/<name> for each body
https://api.mzizi.dev/v1/stats         per-node counts from the files (telemetry reads zero)
```

Build time, not the browser, and the reasoning is written out in full in
`src/lib/registry.ts`. The short version: `mzizi-console` shipped a page that
fetched on mount, returned 200, threw nothing, passed CI and painted nothing.
Content that is in the HTML cannot do that. The costs — the build depends on the
API being up, and content is as fresh as the last build — are paid openly: the
build fails loudly rather than falling back to a snapshot, and every page stamps
the minute it read the API next to the endpoint it read.

There is no `/v1/rs` index, so the build asks `/v1/rs/<name>` for every
component (over a thousand requests with `/ui/<name>`, eight at a time, about
fifteen seconds). Only the API's own "has no Rust implementation" 404 is read as
"none"; anything else is retried and then fails the build, so an outage cannot
quietly turn every Rust component back into React-only.

Some facts come from public package registries rather than the API: whether
each crate the `/v1/rs/<name>` documents name (their `crate` field: `mzizi-ui`
for the primitives, `mzizi-brand` for the brand components, and so on) and the
Roots umbrellas (`mzizi-roots`, `mzizi-roots-server`) are on crates.io, and the
latest npm versions of `@nyuchi/mzizi-cli` and `@nyuchi/mzizi-skills`. They are
asked at build time too, so a crate's state is never typed in. A failure to
reach them never fails the build; the page says it could not check.

`/v1/*` is the canonical, documented base; it is what every page prints and the
only base the build reads. `api.mzizi.dev` is served by `mzizi-api-gateway`.

The component previews (`public/previews/*.jpg`, used by `/components`,
`/components/<name>` and `/playground`) are the one exception: they are
screenshots, generated on demand by `scripts/generate-previews.mjs` and
committed with a dated manifest in `src/data/component-previews.json`. The
script drops a panel that rendered blank and never falls back to a picture of
the whole page, so a component with no demo simply has no picture.

### Styling

`@bundu/ui` 0.2.0, the same package `bundu-labs/marketing` (three apps) and
`shamwari-ai/shamwari/site` consume. `src/styles/site.css` is Tailwind v4 over
`@bundu/ui/styles/theme.css` (all 21 colour families, the surface ladder, the type
scale), `globals.css`, `color-scheme.css` (dark mode follows the OS, with no theme
script) and `brand-mzizi.css`. Mzizi's brand mineral is **hematite**, by the owner's
decision of 2026-09-30, recorded in canon (`mzizi-registry` `brand.source.ts`). The
stylesheet types **no colour, size, radius or weight of its own**: its layout rules
name the package's tokens.

Until 0.2.0, `src/components/DesignTokens.astro` generated the missing families and
the ladder from `/v1/brand`. The package carries them now, so that component is gone.

## What is here

```text
mzizi-site/
├── src/pages/          # the site
├── src/layouts/        # one shell
├── src/components/     # RustCrates, StaticTabs (@bundu/ui Tabs, static)
├── src/lib/            # registry.ts — the one place that reads the API
├── src/scripts/        # tabs.ts — switches the static tab sets
├── src/styles/         # site.css — Tailwind v4 over @bundu/ui, layout only
├── scripts/
│   ├── verify-rendered.py   # fails the build if a page renders empty
│   └── check-facts.py       # fails if dist/ disagrees with live upstream facts
├── public/
│   ├── llms.txt        # the agent-facing summary of the ecosystem
│   ├── robots.txt
│   ├── _redirects      # /mcp → mcp.mzizi.dev/mcp, 308. Not a page.
│   └── .well-known/
│       ├── mcp.json    # pointer to the one public MCP server
│       └── security.txt # RFC 9116 security contact; Expires is a fixed date, renew it
├── astro.config.mjs
└── wrangler.jsonc      # still no routes — read the section above before changing that
```

| Page                 | What it says                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | The language first: the thesis, the status panel, the `mz contract` bench, what it is and isn't, then the toolchain and components  |
| `/language`          | The five machine-authorship design goals, the Phase 0 benchmark and kill criterion, the phases (0 to 5), the non-goals and the RFCs |
| `/cli`               | `mz`'s commands, the real install paths (React with shadcn, Rust from `/v1/rs`), and the agent CLI. Free, no gate                   |
| `/components`        | Mzizi Roots (the Rust components) first, then all 577 grouped by DNA node, with a Rust filter                                       |
| `/components/<name>` | One component: its Rust source first where there is one, then the React build, install command, deps, node, owner                   |
| `/playground`        | Static, dated screenshots of React builds, each linked to its source. Says plainly that none of it is interactive                   |
| `/architecture`      | The helix drawn — 8 nodes, 4 rungs, 6 strands, every covenant, live component counts                                                |
| `/tokens`            | All 21 colour families light and dark, the surface ladder, semantic roles, type, spacing, radii and component specs                 |
| `/skills`            | The agent skills, and each one's body at `/skills/<name>`                                                                           |
| `/observability`     | Where the logs live (the console), and what is file-backed                                                                          |
| `/ecosystem`         | Every public repository, what it holds, and whether it is routed                                                                    |

### On content accuracy

Every claim traces to a file in this org — mostly
[`CHARTER.md`](https://github.com/mzizi-dev/mzizi/blob/main/CHARTER.md) — or to a
request that was actually made.

The live/not-yet ledger on the landing page was last re-checked on 2026-09-29.
Every ecosystem hostname resolves. `api.mzizi.dev` has been served by
`mzizi-api-gateway` since that day.

The status panel is the most important block on the site and should stay that
way. Two Phase 0 pilots ran on 2026-09-27
([`benchmarks/results/`](https://github.com/mzizi-dev/mzizi/tree/main/benchmarks/results)
in `mzizi-dev/mzizi`), and neither showed an advantage for Mzizi: on the ~7B
open-weight arm, Mzizi did worse. Neither is the charter's measurement, so the kill
criterion has still not been tested, and Phase 0 is not complete.
[`benchmarks/READINESS.md`](https://github.com/mzizi-dev/mzizi/blob/main/benchmarks/READINESS.md)
there says what the gating run still waits on. "Designed for" is accurate;
"faster than" is not. The kill criterion is Mzizi against the best existing
language for each kind of task
([RFC-0009](https://github.com/mzizi-dev/mzizi/blob/main/design/RFC-0009-comparison-benchmark.md)
§6: per metric within a task family, beat the best incumbent on two of three, on
held-out tasks, with a bootstrap 95% interval that excludes zero), and every run
is published in `benchmarks/results/` whichever way it falls. When a new run
lands, update the panel, the figures and `public/llms.txt` together.

### Freshness rule

The owner's hard rule (2026-09-30): **mzizi.dev must never lag the language
(`mzizi-dev/mzizi`) or the components** (`mzizi-registry`, the Mzizi Roots crates
on crates.io, and the `@nyuchi/` npm packages built in `agent-tools`).

- A standing site-freshness agent checks upstream state (language `main`,
  registry `main`, the API gateway's registry pin, npm, crates.io and the MCP
  Registry) against what this site says, and opens a PR whenever it drifts.
- Anyone changing the language or the components should expect a site update to
  follow, and say so in their PR.
- `scripts/check-facts.py` does the mechanical half: it reads the live facts
  (the language README's test count, the npm and crates.io versions, the MCP
  Registry listing) and fails when the built `dist/` disagrees. It needs the
  network, so it runs from the manual and scheduled `Freshness` workflow, not
  the required CI path.

Numbers that come from the registry — the component count, the per-node counts,
the palette — are read from the API when the site is built, and every page that
shows one says when it read it and links the endpoint beside it. A dated fact is
not the same thing as a stale copy pretending to be current, which is the defect
class this ecosystem keeps removing — this README's own history above being the
example.

### The MCP card

`public/.well-known/mcp.json` is a **convenience pointer**, not a standard. There
is no ratified well-known format for "which MCP servers does this domain
operate", so the file carries no `$schema` and claims conformance to nothing. It
names `https://mcp.mzizi.dev/mcp`. The owner's decision of 2026-09-29 is that the
MCP server and the CLI are free with no gate: auth is required only for the Fundi
tools (anything that files into the Fundi issue desk or needs a console user), and
the card says so. That change is live (`mzizi-mcp` 0.11.0, listed in the MCP
Registry as `io.github.mzizi-dev/mzizi-mcp`, checked 2026-09-30):
`initialize` and `tools/list` answer with no token, and only `mzizi_fundi` and
`mzizi_report_issue` ask for sign-in. The load-bearing agent
surface on this site is `/llms.txt`; the authority on what that server exposes is
the server, over a standard `tools/list` request.

## Stack, and why no framework ships to the browser

Astro renders everything at build time. There are no islands, and no UI framework
runs in the browser: not Svelte, not React, not Vue.

That is doctrine, not taste. The UI is Astro, and underneath it is Rust first and
TypeScript second, with no third UI framework (`mzizi-dev/agent-tools#82`, and the
charter). The owner's direction of 2026-09-30 is that this site is built from
`@bundu/ui` as far as it goes. The package's Astro components (`Hero`, `Section`,
`SectionHeader`, `Breadcrumb`, `MineralStrip`, `Icon`, `SocialIcon`) render
natively. Its React primitives (`Button`, `Card`, `Badge`, `Tabs`, `Alert`,
`Separator`) render through `@astrojs/react` **at build time**, with no `client:*`
directive, so their HTML ships and React does not. `scripts/verify-rendered.py`
fails the build if a page ever loads a framework runtime.

The scripts on the site are progressive enhancement only:

- the filter on `/components`, which sets `hidden` on cards that are already in the
  HTML;
- the `mz contract` bench in the landing page's hero, whose unedited file and real
  all-pass result are rendered into the HTML at build time;
- the tab switcher, over panels that are all in the HTML;
- the header's drawer and search.

With JavaScript off, every page still carries its content, and a `<noscript>` style
shows every tab panel. `scripts/verify-rendered.py` proves that on every commit by
stripping every `<script>` and then grepping for the content.

## Working on it

```bash
pnpm install
pnpm dev              # local dev server
pnpm build            # emits dist/
pnpm preview          # serve dist/ locally
```

See [`AGENTS.md`](./AGENTS.md) for the full command set, what CI checks (including the
rendered-content gate that `mzizi-console` shipped without), and — before you touch
`wrangler.jsonc` or deploy — the route footgun that took this apex by accident.

## Ecosystem

| Repository                                                            | What it is                                                      | Address                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| [`mzizi`](https://github.com/mzizi-dev/mzizi)                         | The language, and Mzizi's main goal — compiler, RFCs, benchmark | —                                         |
| [`mzizi-registry`](https://github.com/mzizi-dev/mzizi-registry)       | The component registry, brand system, DNA helix and Mzizi Roots | Roots crates on crates.io                 |
| [`mzizi-api-gateway`](https://github.com/mzizi-dev/mzizi-api-gateway) | The registry API as a Hono Worker, from the registry's files    | [api.mzizi.dev](https://api.mzizi.dev/v1) |
| [`mzizi-console`](https://github.com/mzizi-dev/mzizi-console)         | The console — Astro shell, Rust/Dioxus islands                  | [app.mzizi.dev](https://app.mzizi.dev)    |
| [`mzizi-docs`](https://github.com/mzizi-dev/mzizi-docs)               | The Mintlify documentation site — the one home of Mzizi's docs  | [docs.mzizi.dev](https://docs.mzizi.dev)  |
| `mzizi-site`                                                          | This repository                                                 | [mzizi.dev](https://mzizi.dev)            |

## Deliberately not here

- **A DNS change.** Human decision, every time — and the apex's own was made
  without this repository being told.
- **A sitemap.** Most of the site is still one hop from the navigation, and
  `robots.txt` has no `Sitemap:` line to match — a directive pointing at a 404
  is worse than none. Add both together once `/brand` and `/r/` have a home.
- **A page at `/mcp`.** It is a 308 to `mcp.mzizi.dev/mcp` and must stay one: an
  MCP client that lands on HTML instead of being redirected does not degrade, it
  fails. 308 specifically, because it preserves the method and body of the
  JSON-RPC POST that streamable-HTTP transport sends; a 301 or 302 lets a client
  turn that POST into a GET and silently drop the request.
- **A committed copy of the registry data.** The build reads the API or it
  fails. A cached snapshot that keeps serving after the source moves is the
  failure this whole approach exists to avoid.
- **Any link to a private repository.** One exists in this org and operates the
  MCP server. The endpoint is public and is named; the source is not.

## Contact

For anything about Mzizi (the language, the components, this site or the docs),
write to `support@bundu.org`. The site gives the same address in its footer, on
`/ecosystem`, in `/llms.txt` and in `/.well-known/mcp.json`, and
`scripts/verify-rendered.py` fails the build if one of them loses it. Bugs and
proposals for this site are welcome as issues here.

## Security

See [`SECURITY.md`](./SECURITY.md). Reports about this site go to
`security@bundu.org`; the console at `app.mzizi.dev` uses `security@nyuchi.com`.
`/.well-known/security.txt` carries the same routing for machines.

## Licence

Licensed under the [Apache License 2.0](LICENSE).

Mzizi is a programming language and an independent open-architecture project
that owns, operates and develops the language, its toolchain and its
components (the design system and registry).

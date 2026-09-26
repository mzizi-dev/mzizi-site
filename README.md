# mzizi.dev

> The front door to the Mzizi ecosystem — what Mzizi is, where every surface lives, and the agent-facing files (`llms.txt`, `.well-known/mcp.json`) that say the same thing to a machine.

[![CI](https://github.com/mzizi-dev/mzizi-site/actions/workflows/ci.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-site/actions/workflows/ci.yml)
[![Lint](https://github.com/mzizi-dev/mzizi-site/actions/workflows/lint.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-site/actions/workflows/lint.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)

**Version:** 0.1.0 | **Live:** [mzizi.dev](https://mzizi.dev) — this repository serves the apex | **Docs:** [docs.bundu.org](https://docs.bundu.org)

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
hands, and most of it still has no live address. Three of its highest-value
pages are the exception — `mzizi-site#5` rebuilt them here, on this site, on
`@bundu/ui`:

| Path on `mzizi.dev`            | Today                       | Was                                       |
| ------------------------------ | --------------------------- | ------------------------------------------ |
| `/`, `/language`, `/ecosystem` | 200                         | This site                                 |
| `/llms.txt`, `/robots.txt`     | 200                         | This site                                 |
| `/.well-known/mcp.json`        | 200                         | This site                                 |
| `/components`                  | **200 — rebuilt here**      | The registry's developer portal           |
| `/architecture`                | **200 — rebuilt here**      | The registry's developer portal           |
| `/tokens`                      | **200 — rebuilt here**      | The registry's developer portal           |
| `/brand`, `/observability`     | 404                         | The registry's developer portal           |
| `/r/`                          | 404                         | The registry's developer portal           |
| `/api/v1`, `/api/openapi`      | 404                         | The registry API — now on `api.mzizi.dev` |
| `/mcp`                         | 308 to `mcp.mzizi.dev/mcp`  | The MCP server — now on `mcp.mzizi.dev`   |

The API and the MCP server survived, because they had already moved to their own
hostnames before the apex changed hands: `api.mzizi.dev` answers, and
`mcp.mzizi.dev/mcp` answers `401` (`invalid_token`) without a token, which is
correct — it is WorkOS-gated.

### How it happened, as far as this repository can tell

`wrangler.jsonc` in this repository **still declares no routes.** Nothing here
attaches `mzizi.dev` to this Worker. So the custom domain was added outside
version control — in the Cloudflare dashboard — and neither this repository nor
its review history records the decision.

The paperwork that should have preceded it:

| Change                                                                                                                 | State                |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------- |
| [`mzizi-site#3`](https://github.com/mzizi-dev/mzizi-site/pull/3) — the ordered cutover runbook                         | Superseded — the cutover it plans for already happened; the registry-side blocker it found (below) is still open |
| [`mzizi-site#5`](https://github.com/mzizi-dev/mzizi-site/pull/5) — port `/components`, `/architecture`, `/tokens` here | **Merged**            |
| [`mzizi-registry#334`](https://github.com/mzizi-dev/mzizi-registry/pull/334) — point the apex at the Worker            | **Closed**, unmerged |

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

**Do not attach a custom domain or change routes without reading this.** A
custom domain takes a **bare hostname**:

```jsonc
"routes": [{ "pattern": "mzizi.dev", "custom_domain": true }]
```

Never `"mzizi.dev/*"`. Wildcards are rejected outright — _"Wildcard operators
(\*) are not allowed in Custom Domains"_ — and a custom domain already routes
every path on the hostname to the Worker, so a `/*` is both invalid and
redundant. `zone_name` is inferred and only means anything on a
non-custom-domain route.

This is not pedantry. The three-field form silently broke two Workers in this
org — `mzizi-mcp` (`agent-tools#102`) and `mzizi-console`, which never deployed
at all — because **Workers Builds previews upload a version without applying
routes**. The config is only validated on the production deploy, so the same
commit reads green on a pull request and red on `main`.

### What is still owed

Not in scope for a documentation change, and written down so nobody has to
reconstruct it:

1. **Decide, retroactively, what the apex serves.** It is currently a
   several-page site by accident rather than by decision. Either that is
   ratified, or the registry portal comes back in full.
2. **Finish giving the registry portal an address.** `/components`,
   `/architecture` and `/tokens` live here now (`mzizi-site#5`).
   `/brand`, `/observability` and `/r/` still have no live home.
3. **Fix the hardcoded apex URLs in `mzizi-registry`'s API responses**
   (`registryDependencies`, `homepage`, `docs` — found by `mzizi-site#3`)
   before anyone relies on `npx shadcn add` following a transitive dependency.
4. **Put the route in `wrangler.jsonc`.** A production route that exists only in
   a dashboard is a route nobody can review, and it is why this README was wrong.
5. **Then update this section again** — with a real request, not a green check.

## Where the content comes from

The three registry pages are rendered from the public API **at build time**:

```
https://api.mzizi.dev/v1/ui            575 components, 11 fields each
https://api.mzizi.dev/v1/architecture  8 nodes, 4 rungs, 6 strands, live counts
https://api.mzizi.dev/v1/brand         21 colour families, type, space, radii, specs
```

Build time, not the browser, and the reasoning is written out in full in
`src/lib/registry.ts`. The short version: `mzizi-console` shipped a page that
fetched on mount, returned 200, threw nothing, passed CI and painted nothing.
Content that is in the HTML cannot do that. The costs — the build depends on the
API being up, and content is as fresh as the last build — are paid openly: the
build fails loudly rather than falling back to a snapshot, and every page stamps
the minute it read the API next to the endpoint it read.

`/v1/*` is the canonical, documented base and is what every page prints.
`api.mzizi.dev` is attached directly to the registry Worker, which serves its
routes under `/api/v1/*`; the rewrite that makes `/v1/*` answer is
`mzizi-registry#335`, still open. So the build TRIES `/v1` and falls back to
`/api/v1`, and the day #335 lands the fallback simply stops being used. Nothing
printed on a page changes either way.

### Styling

`@bundu/ui` — the same package `bundu-labs/marketing` (three apps) and
`shamwari-ai/shamwari/site` consume. `src/styles/site.css` imports
`@bundu/ui/styles/tokens.css` and contains **no colour, size, radius or weight
of its own**; it is layout and nothing else.

The published `0.1.1` is incomplete — 7 of 21 colour families, no experimental
set, heritage under a `--heritage-*` namespace, no surface ladder — so
`src/components/DesignTokens.astro` fills exactly those gaps from `/v1/brand`,
emitting them **under the same variable names a complete package would use**.
When `0.2.0` ships, that component is deleted and the import alone stands. That
is the whole point of generating rather than pasting: the estate is carrying
four different terracottas because four people typed a hex into a stylesheet.

## What is here

```text
mzizi-site/
├── src/pages/          # the site
├── src/layouts/        # one shell
├── src/components/     # DesignTokens.astro — the palette, generated
├── src/lib/            # registry.ts — the one place that reads the API
├── src/styles/         # site.css — layout only, imports @bundu/ui tokens
├── scripts/
│   └── verify-rendered.py   # fails the build if a page renders empty
├── public/
│   ├── llms.txt        # the agent-facing summary of the ecosystem
│   ├── robots.txt
│   ├── _redirects      # /mcp → mcp.mzizi.dev/mcp, 308. Not a page.
│   └── .well-known/
│       └── mcp.json    # pointer to the one public MCP server
├── astro.config.mjs
└── wrangler.jsonc      # still no routes — read the section above before changing that
```

| Page            | What it says                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | What Mzizi is, that nothing has been measured yet, and which hostnames actually resolve                                             |
| `/language`     | The four machine-authorship design goals, the Phase 0 benchmark definition, the five-phase plan, the stated non-goals, and the RFCs |
| `/architecture` | The helix drawn — 8 nodes, 4 rungs, 6 strands, every covenant, live component counts                                                |
| `/components`   | All 575, grouped by DNA node, each with its description, categories and install command                                            |
| `/tokens`       | All 21 colour families light and dark, the surface ladder, semantic roles, type, spacing, radii and component specs                 |
| `/ecosystem`    | Every public repository, what it holds, and whether it is routed                                                                    |

### On content accuracy

Every claim traces to a file in this org — mostly
[`CHARTER.md`](https://github.com/mzizi-dev/mzizi/blob/main/CHARTER.md) — or to a
request that was actually made.

The live/planned column on the landing page was written when only `mzizi.dev` and
`mcp.mzizi.dev` had DNS records. **That is out of date in the pages themselves**
and has not been fixed here, because this change is the README. As of 2026-09-12
`mzizi.dev`, `api.mzizi.dev`, `app.mzizi.dev` and `mcp.mzizi.dev` all resolve;
`docs.mzizi.dev` still does not.

The status panel is the most important block on the site and should stay that
way. The Phase 0 benchmark has not run, so nothing here has been measured against
the charter's kill criteria. "Designed for" is accurate; "faster than" is not,
and will not be until there is a number.

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
names `https://mcp.mzizi.dev/mcp`, which is real and OAuth-gated — an
unauthenticated request answers `401` (`invalid_token`). The load-bearing agent
surface on this site is `/llms.txt`; the authority on what that server exposes is
the server, over a standard `tools/list` request.

## Stack, and why there is no framework in it

Astro renders everything at build time. There are no islands and no UI framework
— not Svelte, not React, not Vue.

That is doctrine, not taste: the UI is Astro and underneath is Rust first and
TypeScript second, with no third UI framework (`mzizi-dev/agent-tools#82`, and
the charter). It has one consequence worth stating plainly: this site cannot
`npx shadcn@latest add` a registry component, because every one of them is a
React `.tsx`. What it does instead is build its own pieces to the registry's
`componentSpecs` — badges 22px and pill, cards 14px with a 1px border, controls
56px and never below 48px — read from the same API. The dimensions are the
system's; only the markup is local.

There is exactly one script on the site: the filter on `/components`, which sets
`hidden` on cards that are already in the HTML. With JavaScript off the page is
the entire corpus, just unfiltered. `scripts/verify-rendered.py` proves that on
every commit by stripping every `<script>` and then grepping for the content.

## Working on it

```bash
pnpm install
pnpm dev              # local dev server
pnpm check            # astro check — typechecks pages and frontmatter
pnpm build            # emits dist/
pnpm preview          # serve dist/ locally
```

```bash
python3 scripts/verify-rendered.py dist    # what CI runs; see below
```

CI runs `astro check`, `astro build`, a guard that the built `dist/` still
contains `llms.txt`, `robots.txt`, `_redirects`, `.well-known/mcp.json` and
`404.html`, the rendered-content gate, and a gitleaks scan. The `.well-known`
guard is there because it is a dot-directory and tooling skips those by default
often enough to be worth proving every time.

The rendered-content gate is the one `mzizi-console` did not have. It strips
every `<script>` from the built HTML and then asserts the content is there: 575
component cards, the eight node titles, the four rung titles, the six strands,
N2's count of 371, all 21 colour families by CSS variable, specific hex values,
and the `/mcp` redirect. A page that quietly renders nothing fails the build.

To build against a mirror while the API is down — it went down for several
minutes during this work — set `MZIZI_API_ORIGIN` to something serving
`/v1/ui`, `/v1/architecture` and `/v1/brand`. Do not commit a snapshot.

`build.format: "file"` emits `/ecosystem.html` rather than
`/ecosystem/index.html`, which the Static Assets server resolves from
`/ecosystem` with no redirect hop. `not_found_handling` is `404-page`, not the
single-page-application rewrite: this is a multi-page site with no client
router, and an unknown path that quietly rendered the landing page would be a
soft 404.

## Deploying

```bash
pnpm build
pnpm exec wrangler deploy
```

**This is a production deploy to `mzizi.dev`.** Because the custom domain is
attached to this Worker in the Cloudflare dashboard rather than in
`wrangler.jsonc`, `wrangler deploy` publishes to the apex whether or not the
config mentions it. Read the route note above before touching `routes`.

## Ecosystem

| Repository                                                            | What it is                                                      | Address                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| [`mzizi`](https://github.com/mzizi-dev/mzizi)                         | The language — Rust compiler and runtime research, Phase 0      | —                                                |
| [`mzizi-registry`](https://github.com/mzizi-dev/mzizi-registry)       | The component registry, brand system and DNA-helix architecture | Portal partly restored here; the rest unrouted   |
| [`mzizi-api-gateway`](https://github.com/mzizi-dev/mzizi-api-gateway) | The registry API as a pure-Rust Worker                          | [api.mzizi.dev](https://api.mzizi.dev/v1)        |
| [`mzizi-console`](https://github.com/mzizi-dev/mzizi-console)         | The console — Astro shell, Rust/Dioxus islands                  | [app.mzizi.dev](https://app.mzizi.dev)           |
| [`mzizi-docs`](https://github.com/mzizi-dev/mzizi-docs)               | The Mintlify documentation site                                 | Not deployed; `docs.mzizi.dev` does not resolve  |
| `mzizi-site`                                                          | This repository                                                 | [mzizi.dev](https://mzizi.dev)                   |

## Deliberately not here

- **A DNS change.** Human decision, every time — and the apex's own was made
  without this repository being told.
- **A sitemap.** Most of the site is still one hop from the navigation, and
  `robots.txt` has no `Sitemap:` line to match — a directive pointing at a 404
  is worse than none. Add both together once the remaining 14 pages land.
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

## Licence

Licensed under the [Apache License 2.0](LICENSE).

Mzizi is an open-architecture project of the **Bundu Foundation**, operated and
developed by **Nyuchi**.

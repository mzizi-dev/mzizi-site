# mzizi-site

The front door to the Mzizi ecosystem — what Mzizi is, where every surface
lives, and the agent-facing files (`llms.txt`, `.well-known/mcp.json`) that say
the same thing to a machine.

Astro, static output, deployed as a Cloudflare Worker with Static Assets. The
same shape as `mzizi-console`, minus the islands: a landing page has nothing to
hydrate.

## `mzizi.dev` is live on this site

The apex cut over. `mzizi.dev` is served by this Worker; the Next.js registry
app that used to serve it is still running, intact, at
[`mzizi-registry.nyuchi.workers.dev`](https://mzizi-registry.nyuchi.workers.dev),
which makes it the reference implementation for anything not yet ported.

That cutover is the whole reason this repository is being filled in. The old
site had 21 pages. Every one that has not been rebuilt here is a 404 in
production right now:

| Path | Status |
| ---- | ------ |
| `/`, `/language`, `/ecosystem`, `/404` | live, written for this site |
| `/components` | **rebuilt** — all 575, grouped by DNA node |
| `/architecture` | **rebuilt** — the helix drawn, 8 nodes, 4 rungs, 6 strands |
| `/tokens` | **rebuilt** — all 21 colour families, surfaces, type, space, specs |
| `/architecture/nodes/1…12` | not yet ported |
| `/playground`, `/skills`, `/cli`, `/observability` | not yet ported |
| `/privacy`, `/terms` | not yet ported |

`/mcp` is not a page and must not become one — see `public/_redirects`.

### Deploying

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
└── wrangler.jsonc      # read before adding a route
```

| Page            | What it says                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | What Mzizi is, that nothing has been measured yet, and which hostnames actually resolve                                             |
| `/language`     | The four machine-authorship design goals, the Phase 0 benchmark definition, the five-phase plan, the stated non-goals, and the RFCs |
| `/architecture` | The helix drawn — 8 nodes, 4 rungs, 6 strands, every covenant, live component counts                                                |
| `/components`   | All 575, grouped by DNA node, each with its description, categories and install command                                            |
| `/tokens`       | All 21 colour families light and dark, the surface ladder, semantic roles, type, spacing, radii and component specs                |
| `/ecosystem`    | Every public repository, what it holds, and whether it is routed                                                                    |

### On content accuracy

Every claim traces to a file in this org — mostly
[`CHARTER.md`](https://github.com/mzizi-dev/mzizi/blob/main/CHARTER.md) — or to
a request that was actually made. The live/planned column on the landing page
was checked with `dig`, not assumed: as of writing, only `mzizi.dev` and
`mcp.mzizi.dev` have DNS records. `api.mzizi.dev`, `app.mzizi.dev` and
`docs.mzizi.dev` do not resolve, however finished their repositories are.

The status panel is the most important block on the site and should stay that
way. The Phase 0 benchmark has not run, so nothing here has been measured
against the charter's kill criteria. "Designed for" is accurate; "faster than"
is not, and will not be until there is a number.

Numbers that come from the registry — the component count, the per-node counts,
the palette — are read from the API when the site is built, and every page that
shows one says when it read it and links the endpoint beside it. A dated fact is
not the same thing as a stale copy pretending to be current.

### The MCP card

`public/.well-known/mcp.json` is a **convenience pointer**, not a standard. There
is no ratified well-known format for "which MCP servers does this domain
operate", so the file carries no `$schema` and claims conformance to nothing. It
names `https://mcp.mzizi.dev/mcp`, which is real and OAuth-gated — an
unauthenticated request answers `invalid_token`. The load-bearing agent surface
on this site is `/llms.txt`; the authority on what that server exposes is the
server, over a standard `tools/list` request.

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

**This site serves `mzizi.dev`.** A deploy is production. Read the route note
above before touching `routes` in `wrangler.jsonc`.

## Deliberately not here

- **A DNS change.** Human decision, every time.
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

Apache-2.0. Mzizi is a research project of the Bundu Foundation, operated by
nyuchi.

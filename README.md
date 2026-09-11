# mzizi-site

The front door to the Mzizi ecosystem — what Mzizi is, where every surface
lives, and the agent-facing files (`llms.txt`, `.well-known/mcp.json`) that say
the same thing to a machine.

Astro, static output, deployed as a Cloudflare Worker with Static Assets. The
same shape as `mzizi-console`, minus the islands: a landing page has nothing to
hydrate.

## ⚠️ This site does not serve `mzizi.dev` yet, and must not be made to by accident

`mzizi.dev` is **live right now** and is served by
[`mzizi-dev/mzizi-registry`](https://github.com/mzizi-dev/mzizi-registry) on
Vercel. Check before you touch anything:

```bash
curl -sSI https://mzizi.dev | grep -Ei 'x-vercel-id|x-powered-by'
```

If that still shows `x-vercel-id`, the apex is Vercel's and the registry is what
answers on it — including the component registry, `/api/v1`, and `/mcp`.

`wrangler.jsonc` therefore declares **no routes at all**. The Worker deploys to
`mzizi-site.<subdomain>.workers.dev`, which is where this should be reviewed
until a human decides otherwise. Adding a `mzizi.dev` custom domain to this
Worker takes the apex away from the registry in a single deploy and breaks all
three of those surfaces at once. Shipping a site that is not yet live is a much
smaller failure than that.

### What a cutover would actually involve

Not in scope for this repository, and not a thing to do incrementally. Written
down so nobody has to reconstruct it:

1. **Decide what the apex serves.** The registry portal and this site both want
   `mzizi.dev`. Either the registry moves (to its own hostname, with redirects)
   or this site takes a different one. That is a product decision, not a
   deployment step.
2. **Move `/api/v1` and `/mcp` off the apex first.** They are served from the
   registry today. `mzizi-api-gateway` is built for `api.mzizi.dev` and
   `mcp.mzizi.dev` already resolves, so the pieces exist — but `api.mzizi.dev`
   has no DNS record yet, so nothing currently consumes it. Anything pointing at
   `mzizi.dev/api/v1` breaks the moment the apex changes hands, and that
   includes `mzizi-console`, which reads the API at runtime.
3. **Keep `/llms.txt` truthful across the swap.** The registry's `llms.txt` is
   detailed and specific to the design system; this one is about the ecosystem.
   Whoever holds the apex owns that file, and losing the registry's content in
   the swap would be a real regression for agents.
4. **Then, and only then, add the route** — as a bare hostname (see below),
   deploy to production, and verify with a real request rather than a green
   check.

### The route footgun, if a route is ever added

A custom domain takes a **bare hostname**:

```jsonc
"routes": [{ "pattern": "mzizi.dev", "custom_domain": true }]
```

Never `"mzizi.dev/*"`. Wildcards are rejected outright — *"Wildcard operators
(\*) are not allowed in Custom Domains"* — and a custom domain already routes
every path on the hostname to the Worker, so a `/*` is both invalid and
redundant. `zone_name` is inferred and only means anything on a
non-custom-domain route.

This is not pedantry. The three-field form silently broke two Workers in this
org — `mzizi-mcp` (`agent-tools#102`) and `mzizi-console`, which never deployed
at all — because **Workers Builds previews upload a version without applying
routes**. The config is only validated on the production deploy, so the same
commit reads green on a pull request and red on `main`.

## What is here

```text
mzizi-site/
├── src/pages/          # four pages: /, /language, /ecosystem, 404
├── src/layouts/        # one shell
├── public/
│   ├── llms.txt        # the agent-facing summary of the ecosystem
│   ├── robots.txt
│   ├── site.css
│   └── .well-known/
│       └── mcp.json    # pointer to the one public MCP server
├── astro.config.mjs
└── wrangler.jsonc      # no routes — read the section above before changing that
```

| Page         | What it says                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | What Mzizi is, that nothing has been measured yet, and which hostnames actually resolve                                                |
| `/language`  | The four machine-authorship design goals, the Phase 0 benchmark definition, the five-phase plan, the stated non-goals, and the RFCs    |
| `/ecosystem` | Every public repository, what it holds, and whether it is routed                                                                       |

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

No page fetches or caches a component count, a version, or a token value. Those
are generated from a database and would go stale at build time, and a stale copy
that still looks authoritative is the defect class this ecosystem keeps
removing.

### The MCP card

`public/.well-known/mcp.json` is a **convenience pointer**, not a standard. There
is no ratified well-known format for "which MCP servers does this domain
operate", so the file carries no `$schema` and claims conformance to nothing. It
names `https://mcp.mzizi.dev/mcp`, which is real and OAuth-gated — an
unauthenticated request answers `invalid_token`. The load-bearing agent surface
on this site is `/llms.txt`; the authority on what that server exposes is the
server, over a standard `tools/list` request.

## Stack, and why there is no framework in it

Astro renders everything at build time. There are no islands, no client-side
JavaScript, and no UI framework — not Svelte, not React, not Vue.

That is doctrine, not taste: the UI is Astro and underneath is Rust first and
TypeScript second, with no third UI framework (`mzizi-dev/agent-tools#82`, and
the charter). `mzizi-console` has islands because it renders live registry data;
this site renders prose, so the correct amount of runtime is none.

## Working on it

```bash
pnpm install
pnpm dev              # local dev server
pnpm check            # astro check — typechecks pages and frontmatter
pnpm build            # emits dist/
pnpm preview          # serve dist/ locally
```

CI runs `astro check`, `astro build`, a guard that the built `dist/` still
contains `llms.txt`, `robots.txt`, `.well-known/mcp.json` and `404.html`, and a
gitleaks scan. The `.well-known` guard is there because it is a dot-directory
and tooling skips those by default often enough to be worth proving every time.

`build.format: "file"` emits `/ecosystem.html` rather than
`/ecosystem/index.html`, which the Static Assets server resolves from
`/ecosystem` with no redirect hop. `not_found_handling` is `404-page`, not the
single-page-application rewrite: this is a multi-page site with no client
router, and an unknown path that quietly rendered the landing page would be a
soft 404.

## Deploying

```bash
pnpm build
pnpm exec wrangler deploy     # → mzizi-site.<subdomain>.workers.dev
```

No production route is attached, so this cannot affect `mzizi.dev`. Read the
cutover section above before changing that.

## Deliberately not here

- **A route, a DNS change, or any Vercel configuration.** See above. Human
  decision.
- **A sitemap.** Three pages, all one hop from the navigation. `robots.txt` has
  no `Sitemap:` line to match — a directive pointing at a 404 is worse than
  none. Add both together if the site grows.
- **Live registry data.** That is what the console and the API are for.
- **Any link to a private repository.** One exists in this org and operates the
  MCP server. The endpoint is public and is named; the source is not.

## Licence

Apache-2.0. Mzizi is a research project of the Bundu Foundation, operated by
nyuchi.

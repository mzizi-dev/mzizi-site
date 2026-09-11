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

### The cutover runbook

**Nothing in this section has been executed.** It is written down so the
decision is a decision and not an archaeology exercise. Steps are ordered, and
the order is load-bearing — each one names what breaks if it is done early.

The shape of the problem is a cycle. `mzizi.dev` serves *both* the registry site
*and* `/api/v1`. `mzizi-api-gateway` fronts the API at `api.mzizi.dev`, but its
`ORIGIN` is `https://mzizi.dev/api` — it proxies **to the apex**. So the thing
that would let the apex move is currently built on top of the apex:

```text
          today                                after the cutover

  api.mzizi.dev ──proxy──┐              api.mzizi.dev ──proxy──┐
                         ▼                                     ▼
  mzizi.dev ──────► registry (Vercel)    <NEW HOST> ─────► registry (Vercel)
   ▲  serves BOTH site AND /api/v1        mzizi.dev ─────► mzizi-site (Worker)
```

The whole runbook is: **give the registry a second front door, walk the traffic
onto it, and only then take the apex.**

---

#### Step 0 — Preflight. Prove the current state rather than assuming it

```bash
# The apex is Vercel's, and the registry is what answers on it.
curl -sSI https://mzizi.dev | grep -Ei 'x-vercel-id|x-powered-by'

# The gateway is live and still proxies to the apex.
curl -s https://api.mzizi.dev/v1/health
#   {"origin":"https://mzizi.dev/api", ... "status":"ok"}

# The apex A record is Cloudflare-proxied (172.67.x / 104.21.x), NOT Vercel's
# own anycast IP. The zone is on Cloudflare; the orange cloud hides Vercel.
dig +short mzizi.dev A
dig +short mzizi.dev NS
```

If `/v1/health` reports an `origin` that is no longer the apex, someone has
already done Step 3 and this document is stale. Stop and re-read it.

---

#### Step 1 — Give the registry a stable non-apex hostname

**Vercel dashboard only.** There is no `vercel.json` in `mzizi-dev/mzizi-registry`
and one should not be added for this: domains are project settings, not build
config, and a `vercel.json` that half-describes the routing is worse than none.

In the Vercel project for `mzizi-registry` → **Settings → Domains**, add a
hostname that is *not* the apex. `registry.mzizi.dev` is the obvious choice —
same zone, so the DNS record is added in Cloudflare alongside the others.

> **Do not guess the hostname from a `*.vercel.app` alias.** `mzizi.vercel.app`
> resolves and returns 200, and it is **a different project** — it 404s on
> `/api/v1/ui` and serves an unrelated `llms.txt`. Confirm any candidate serves
> the registry before trusting it.

Then verify the new host serves the API identically to the apex, byte for byte:

```bash
NEW=https://registry.mzizi.dev        # whatever was actually provisioned

for e in ui brand architecture ui/button; do
  a=$(curl -s "$NEW/api/v1/$e" | shasum | cut -d' ' -f1)
  b=$(curl -s "https://mzizi.dev/api/v1/$e" | shasum | cut -d' ' -f1)
  [ "$a" = "$b" ] && echo "$e  IDENTICAL" || echo "$e  *** DIFFER — STOP ***"
done
```

**If done out of order:** this step is safe at any time — it only *adds* a way to
reach the registry. It is first because every later step depends on it existing.
Doing Step 3 or Step 5 before this one has a completed, verified hostname is what
takes the API down.

---

#### Step 2 — Fix the absolute apex URLs baked into the registry payload

:rotating_light: **This is a blocker and it is not obvious from the outside.**

The registry does not just *live* at the apex, it **hardcodes the apex into the
JSON it serves**. As measured:

```bash
curl -s https://api.mzizi.dev/v1/ui | grep -o 'https://mzizi\.dev[^"]*' | wc -l
# 805
```

Those are not cosmetic. They appear in:

- **`registryDependencies`** — e.g. `address-input` declares
  `["https://mzizi.dev/api/v1/ui/input"]`. The shadcn CLI resolves these
  **transitively**, so after the cutover
  `npx shadcn@latest add https://api.mzizi.dev/v1/ui/address-input` fetches the
  component fine and then **fails** following its dependency to a 404 apex.
- **`homepage`** on the registry document, and **`docs`** on each item, which
  point at `https://mzizi.dev/components/<name>` — registry HTML pages that do
  not exist on this static site.

These URLs are generated by the registry from a base URL. That generation must
emit the **gateway** (`https://api.mzizi.dev/v1`) for API links, and whatever
hostname ends up owning the registry's HTML for `docs`/`homepage` links. Fix it
in `mzizi-dev/mzizi-registry`, deploy, and re-measure:

```bash
curl -s https://api.mzizi.dev/v1/ui | grep -o 'https://mzizi\.dev[^"]*' | wc -l
# must be 0
```

**If done out of order:** skip this and the cutover looks clean — the apex serves
the new site, `api.mzizi.dev` answers, the console renders — while **every
multi-component `shadcn add` in the ecosystem breaks**, including for people who
never touched anything. It fails at *their* install, not in any of our checks,
which is why it has to be closed before the apex moves rather than after.

---

#### Step 3 — Repoint the gateway's `ORIGIN`

Only once Step 1 is verified and Step 2 is shipped.

In `mzizi-dev/mzizi-api-gateway`, `src/lib.rs`:

```rust
const ORIGIN: &str = "https://mzizi.dev/api";        // before
const ORIGIN: &str = "https://registry.mzizi.dev/api";  // after
```

The comment block above it records the original NXDOMAIN measurement; rewrite it
to record this move rather than deleting it. Merge (this repo is merge-only),
let Workers Builds deploy, then verify on production — not on the preview:

```bash
curl -s https://api.mzizi.dev/v1/health
#   origin must now be the Step 1 hostname

for e in ui brand architecture; do
  printf '%-14s %s\n' "$e" "$(curl -s -o /dev/null -w '%{http_code}' https://api.mzizi.dev/v1/$e)"
done
```

At this point `api.mzizi.dev` no longer depends on the apex. **That is the
moment the cycle is broken**, and it is the only irreversible-feeling step that
is actually trivially reversible: revert the constant and redeploy.

**If done out of order:** pointing `ORIGIN` at a hostname that does not serve
`/api` yet breaks `api.mzizi.dev` immediately — and `app.mzizi.dev` with it,
since `mzizi-console` now reads `https://api.mzizi.dev/v1`. Doing it *after*
Step 5 is worse: the apex would already be the static site, so the gateway would
be proxying to a 404 and there would be no working API to fall back to.

---

#### Step 4 — Decide what `/llms.txt` says, before the swap, not after

These two files are **not** a detailed version and a summary version of one
document. They describe **different subjects**, and the apex can only serve one:

| | `mzizi.dev/llms.txt` (registry) | this site's `public/llms.txt` |
| --- | --- | --- |
| size | ~10.5 KB | ~6.8 KB |
| subject | the **design system** — component registry, live counts, install paths | **Mzizi the Rust framework** — the language, the charter, unmeasured status |
| tone | "always fetch the authoritative value from the URL listed next to it" | "say that it is a design with an argument behind it, not a proven result" |

Swapping the apex silently replaces one with the other. An agent that has learned
`mzizi.dev/llms.txt` means *"the shadcn registry, here are the live counts"*
would start receiving *"a Rust language research project, nothing has been
benchmarked"*. Both files are accurate about their own subject; neither is a
substitute for the other.

Capture both before touching anything:

```bash
curl -s https://mzizi.dev/llms.txt                    -o /tmp/llms.registry.txt
curl -s https://mzizi-site.nyuchi.workers.dev/llms.txt -o /tmp/llms.site.txt
diff /tmp/llms.registry.txt /tmp/llms.site.txt
```

The decision is a product one and belongs to whoever owns the apex. The options,
in rough order of preference:

1. **Merge** — this site's `public/llms.txt` becomes the front-door document and
   *links* to the registry's, which continues to be served in full from the Step 1
   hostname. The apex file must then name that hostname explicitly.
2. **Keep both, at distinct paths** — the registry's content moves to something
   like `/llms-registry.txt` here, referenced from `/llms.txt`.
3. **Serve the registry's verbatim** and lose the framework framing. This is the
   worst of the three: the framework/design-system name collision is precisely
   what this site's `llms.txt` exists to disambiguate.

**If done out of order:** nothing 404s, which is what makes this the easiest step
to skip and the hardest to notice. The regression is silent, it lands in agent
context rather than in a status code, and by the time anyone spots it the
original is only recoverable from a Vercel deployment or git history.

---

#### Step 5 — Only now, take the apex

Every earlier step must be done and verified. Then, in this repo's
`wrangler.jsonc`, replace the no-routes comment block with:

```jsonc
"routes": [
  {
    "pattern": "mzizi.dev",
    "custom_domain": true,
  },
],
```

**A bare hostname.** Not `"mzizi.dev/*"`, no `zone_name` — see
[the route footgun](#the-route-footgun-if-a-route-is-ever-added) below, which is
not a style note and has already broken two Workers in this org.

```bash
pnpm build
pnpm exec wrangler deploy       # production; previews do NOT apply routes
```

> **The apex already has a DNS record, so this is a takeover, not a creation.**
> Every other hostname in this org (`api`, `app`, `mcp`) was *created* by its
> first custom-domain deploy, on a name with no record. `mzizi.dev` has a
> Cloudflare-proxied A record pointing at Vercel. Adding the custom domain must
> **replace** it, and Cloudflare may refuse rather than clobber an existing
> record. Expect to have to remove the A record by hand, and expect a brief
> window where the apex is down between removing it and the Worker binding. Do
> this at a quiet hour, not at the end of a working day.

Verify with real requests, not a green check:

```bash
curl -sSI https://mzizi.dev | grep -Ei 'x-vercel-id|server'   # x-vercel-id GONE
curl -s -o /dev/null -w 'apex:      %{http_code}\n' https://mzizi.dev/
curl -s -o /dev/null -w 'llms:      %{http_code}\n' https://mzizi.dev/llms.txt
curl -s -o /dev/null -w 'api (gw):  %{http_code}\n' https://api.mzizi.dev/v1/ui
curl -s -o /dev/null -w 'console:   %{http_code}\n' https://app.mzizi.dev/
curl -s https://api.mzizi.dev/v1/health
```

**Rollback** is removing the custom domain from this Worker and restoring the
Vercel A record. Know that before starting, not during.

---

#### Step 6 — The apex paths that disappear

The registry answers on a number of apex paths that this three-page site does
not. Measured:

| path | apex today | this site |
| --- | --- | --- |
| `/components` | 200 | **404** |
| `/architecture` | 200 | **404** |
| `/tokens` | 200 | **404** |
| `/api/openapi` | 200 | **404** |
| `/mcp` | 308 → `mcp.mzizi.dev/mcp` | **404** |
| `/api/v1/*` | 200 | **404** |
| `/llms.txt` | 200 | 200 (different content — Step 4) |

Each needs a decision before Step 5: redirect to the Step 1 hostname, rebuild
here, or accept the 404 deliberately. Two are already load-bearing elsewhere:

- **`/mcp`** is a documented redirect. `public/.well-known/mcp.json` names
  `mcp.mzizi.dev/mcp` directly so the card survives, but anything that learned
  the apex form stops working.
- **`mzizi.dev/components` and `mzizi.dev/architecture`** are the `<noscript>`
  escape hatches in `mzizi-console`'s Components and Architecture pages. They are
  flagged in place in that repo; they must be re-pointed as part of this cutover.

A `_redirects`-style mapping is not available on a Static Assets Worker without
adding code to this Worker, which currently has none. If redirects are wanted,
that is a design change to make here **before** Step 5, not after.

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
was checked with `dig`, not assumed.

> :warning: **That column is now out of date and the pages have not been
> updated.** It was written when only `mzizi.dev` and `mcp.mzizi.dev` resolved.
> `api.mzizi.dev` (the gateway) and `app.mzizi.dev` (the console) both went live
> and both answer, so `src/pages/index.astro` currently marks two live surfaces
> as `○ planned` with the note "the hostname does not resolve yet". Only
> `docs.mzizi.dev` is still unrouted. Re-check before trusting the table, and fix
> it before this site takes the apex — a front door that is wrong about which of
> its own surfaces exist is worse than no front door:
>
> ```bash
> for h in api app mcp docs; do printf '%-16s %s\n' "$h.mzizi.dev" "$(dig +short $h.mzizi.dev | tr '\n' ' ')"; done
> ```

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

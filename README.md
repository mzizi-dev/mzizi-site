# mzizi.dev

> The front door to the Mzizi ecosystem — what Mzizi is, where every surface lives, and the agent-facing files (`llms.txt`, `.well-known/mcp.json`) that say the same thing to a machine.

[![CI](https://github.com/mzizi-dev/mzizi-site/actions/workflows/ci.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-site/actions/workflows/ci.yml)
[![Lint](https://github.com/mzizi-dev/mzizi-site/actions/workflows/lint.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-site/actions/workflows/lint.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)

**Version:** 0.1.0 | **Live:** [mzizi.dev](https://mzizi.dev) — this repository serves the apex | **Docs:** [docs.bundu.org](https://docs.bundu.org)

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

### What that cost

The three pages here are all the apex has. Everything the registry used to serve
from it is gone:

| Path on `mzizi.dev`            | Today | Was                                       |
| ------------------------------ | ----- | ----------------------------------------- |
| `/`, `/language`, `/ecosystem` | 200   | This site                                 |
| `/llms.txt`, `/robots.txt`     | 200   | This site                                 |
| `/.well-known/mcp.json`        | 200   | This site                                 |
| `/components`, `/brand`        | 404   | The registry's developer portal           |
| `/tokens`, `/architecture`     | 404   | The registry's developer portal           |
| `/observability`, `/r/`        | 404   | The registry's developer portal           |
| `/api/v1`, `/api/openapi`      | 404   | The registry API — now on `api.mzizi.dev` |
| `/mcp`                         | 404   | The MCP server — now on `mcp.mzizi.dev`   |

The API and the MCP server survived, because they had already moved to their own
hostnames before the apex changed hands: `api.mzizi.dev` answers, and
`mcp.mzizi.dev/mcp` answers `401` without a token, which is correct — it is
WorkOS-gated. **The registry's human-facing portal did not move anywhere.** It has
no live address at all right now.

### How it happened, as far as this repository can tell

`wrangler.jsonc` in this repository **still declares no routes.** Nothing here
attaches `mzizi.dev` to this Worker. So the custom domain was added outside
version control — in the Cloudflare dashboard — and neither this repository nor
its review history records the decision.

The paperwork that should have preceded it is all still open or refused:

| Change                                                                                                                 | State                |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------- |
| [`mzizi-site#3`](https://github.com/mzizi-dev/mzizi-site/pull/3) — the ordered cutover runbook                         | **Open**, unmerged   |
| [`mzizi-site#5`](https://github.com/mzizi-dev/mzizi-site/pull/5) — port `/components`, `/architecture`, `/tokens` here | **Open**, unmerged   |
| [`mzizi-registry#334`](https://github.com/mzizi-dev/mzizi-registry/pull/334) — point the apex at the Worker            | **Closed**, unmerged |

So the cutover ran without the runbook, and without the pull request that ports
the pages it displaced. That ordering is the whole failure: step 1 of the runbook
was to decide what the apex serves, and step 2 was to move the displaced surfaces
first. Neither happened.

### The history is kept because it explains the risk, not to relitigate it

The original warning was correct about the mechanism and correct about the
consequence. It is preserved below, in the past tense, because the next person to
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

A custom domain takes a **bare hostname**:

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

1. **Decide, retroactively, what the apex serves.** It is currently a three-page
   site by accident rather than by decision. Either that is ratified, or the
   registry portal comes back.
2. **Give the registry portal an address.** `/components`, `/tokens`, `/brand`,
   `/architecture`, `/observability` and `/r/` have no live home. Either
   [`mzizi-site#5`](https://github.com/mzizi-dev/mzizi-site/pull/5) lands and
   they live here, or the registry gets its own hostname.
3. **Put the route in `wrangler.jsonc`.** A production route that exists only in
   a dashboard is a route nobody can review, and it is why this README was wrong.
4. **Then update this section again** — with a real request, not a green check.

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
└── wrangler.jsonc      # still no routes — read the section above before changing that
```

| Page         | What it says                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | What Mzizi is, that nothing has been measured yet, and which hostnames actually resolve                                             |
| `/language`  | The four machine-authorship design goals, the Phase 0 benchmark definition, the five-phase plan, the stated non-goals, and the RFCs |
| `/ecosystem` | Every public repository, what it holds, and whether it is routed                                                                    |

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

No page fetches or caches a component count, a version, or a token value. Those
would go stale at build time, and a stale copy that still looks authoritative is
the defect class this ecosystem keeps removing — this README being the current
example.

### The MCP card

`public/.well-known/mcp.json` is a **convenience pointer**, not a standard. There
is no ratified well-known format for "which MCP servers does this domain
operate", so the file carries no `$schema` and claims conformance to nothing. It
names `https://mcp.mzizi.dev/mcp`, which is real and OAuth-gated — an
unauthenticated request answers `401`. The load-bearing agent surface on this
site is `/llms.txt`; the authority on what that server exposes is the server,
over a standard `tools/list` request.

## Stack, and why there is no framework in it

Astro renders everything at build time. There are no islands, no client-side
JavaScript, and no UI framework — not Svelte, not React, not Vue.

That is doctrine, not taste: the UI is Astro and underneath is Rust first and
TypeScript second, with no third UI framework (`mzizi-dev/agent-tools#82`, and
the charter). `mzizi-console` has islands because it renders live registry data;
this site renders prose, so the correct amount of runtime is none.

`build.format: "file"` emits `/ecosystem.html` rather than
`/ecosystem/index.html`, which the Static Assets server resolves from
`/ecosystem` with no redirect hop. `not_found_handling` is `404-page`, not the
single-page-application rewrite: this is a multi-page site with no client router,
and an unknown path that quietly rendered the landing page would be a soft 404.

## Commands

| Command        | What it does                                     |
| -------------- | ------------------------------------------------ |
| `pnpm install` | Install                                          |
| `pnpm dev`     | Local dev server                                 |
| `pnpm check`   | `astro check` — typechecks pages and frontmatter |
| `pnpm build`   | Emits `dist/`                                    |
| `pnpm preview` | Serve `dist/` locally                            |

CI runs `astro check`, `astro build`, a guard that the built `dist/` still
contains `llms.txt`, `robots.txt`, `.well-known/mcp.json` and `404.html`, and a
gitleaks scan. The `.well-known` guard is there because it is a dot-directory and
tooling skips those by default often enough to be worth proving every time.

## Deploying

```bash
pnpm build
pnpm exec wrangler deploy
```

**This is now a production deploy to `mzizi.dev`.** It was not when this section
was written. Because the custom domain is attached to this Worker in the
Cloudflare dashboard rather than in `wrangler.jsonc`, `wrangler deploy` publishes
to the apex whether or not the config mentions it.

## Ecosystem

| Repository                                                            | What it is                                                      | Address                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| [`mzizi`](https://github.com/mzizi-dev/mzizi)                         | The language — Rust compiler and runtime research, Phase 0      | —                                               |
| [`mzizi-registry`](https://github.com/mzizi-dev/mzizi-registry)       | The component registry, brand system and DNA-helix architecture | Portal currently unrouted                       |
| [`mzizi-api-gateway`](https://github.com/mzizi-dev/mzizi-api-gateway) | The registry API as a pure-Rust Worker                          | [api.mzizi.dev](https://api.mzizi.dev/api/v1)   |
| [`mzizi-console`](https://github.com/mzizi-dev/mzizi-console)         | The console — Astro shell, Rust/Dioxus islands                  | [app.mzizi.dev](https://app.mzizi.dev)          |
| [`mzizi-docs`](https://github.com/mzizi-dev/mzizi-docs)               | The Mintlify documentation site                                 | Not deployed; `docs.mzizi.dev` does not resolve |
| `mzizi-site`                                                          | This repository                                                 | [mzizi.dev](https://mzizi.dev)                  |

## Deliberately not here

- **A DNS change, or any Vercel configuration.** Human decision — and the last
  one was made without this repository being told.
- **A sitemap.** Three pages, all one hop from the navigation. `robots.txt` has
  no `Sitemap:` line to match — a directive pointing at a 404 is worse than none.
  Add both together if the site grows.
- **Live registry data.** That is what the console and the API are for.
- **Any link to a private repository.** One exists in this org and operates the
  MCP server. The endpoint is public and is named; the source is not.

## Licence

Licensed under the [Apache License 2.0](LICENSE).

Mzizi is an open-architecture project of the **Bundu Foundation**, operated and
developed by **Nyuchi**.

# Security policy

## What this repository is, in security terms

`mzizi-site` builds `mzizi.dev`: static HTML, CSS and a few small inline scripts,
rendered at build time from the public registry API and served by Cloudflare Workers
Static Assets. It has no accounts, no sessions, no forms, no database and no secrets at
runtime. The build reads `api.mzizi.dev` and nothing else.

In scope:

- Anything that lets content on `mzizi.dev` run script it should not: an XSS through
  registry data rendered into a page (component source, skill bodies and descriptions
  are all remote input at build time), or a way to inject markup into the static output.
- Redirects in `public/_redirects` that can be abused as an open redirect.
- The agent-facing files (`/llms.txt`, `/.well-known/mcp.json`) pointing agents at the
  wrong server.
- Anything in this repository's workflows that lets a fork or pull request obtain a
  token or write where it should not.

## Where to report

| What                                                                        | Where                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| This site, the console at `app.mzizi.dev`, and anything else Mzizi operates | `security@nyuchi.com`, or a private advisory on the repository concerned |

For this repository, open a private advisory at
<https://github.com/mzizi-dev/mzizi-site/security/advisories/new>, or email
`security@nyuchi.com`. Do not open a public issue for a vulnerability until it is fixed.

Anything that is not a vulnerability (questions, bugs, proposals) goes to
`support@bundu.org`, or to an issue on the repository concerned.

The machine-readable form of this routing is
[`/.well-known/security.txt`](https://mzizi.dev/.well-known/security.txt)
([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)). Its `Expires` date is fixed,
because the site is static; renew it before it lapses.

## What to expect

This is a small project with no on-call rotation and no bug bounty. We aim to
acknowledge a report within a week and will say so plainly if a fix will take longer.
Credit goes in the fix's commit and advisory unless you would rather not be named.

#!/usr/bin/env python3
"""Prove the built pages actually rendered, with every <script> removed.

This exists because of a specific failure. `mzizi-console` shipped a page that
was blank in a browser: the bundle loaded, the fetch returned 200, nothing
threw, and CI was green — because nothing in the pipeline ever asked whether
anything had been RENDERED. A 200 and a passing build are both compatible with
an empty page.

So this script does not check status codes or file sizes. It strips every
<script> element out of the built HTML and then looks for the actual content a
reader came for: named components, node titles, covenants, hex values, and the
counts. If the data source were to disappear, or a loop were to render nothing,
or a page were to move to a client-side fetch, these assertions fail.

Usage:  python3 scripts/verify-rendered.py [dist-dir]
"""

from __future__ import annotations

import html
import pathlib
import re
import sys

DIST = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "dist")

# The registry's own numbers. Kept here deliberately rather than read from the
# API: if the corpus really grows, that is a change someone should make on
# purpose, in a commit, with the number in the diff.
EXPECTED_COMPONENTS = 577
EXPECTED_NODES = 8
EXPECTED_RUNGS = 4
EXPECTED_STRANDS = 6
EXPECTED_FAMILIES = 21

failures: list[str] = []
notes: list[str] = []


def text_without_scripts(page: str, quiet: bool = False) -> str:
    """The page as a reader with JavaScript switched off would receive it."""
    raw = (DIST / page).read_text(encoding="utf-8")
    if "<script" in raw and not quiet:
        notes.append(f"{page}: contains <script>; stripping it before every check")
    stripped = re.sub(r"<script\b.*?</script>", "", raw, flags=re.S | re.I)
    return stripped


def check(page: str, label: str, condition: bool, detail: str = "") -> None:
    status = "ok  " if condition else "FAIL"
    line = f"  [{status}] {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    if not condition:
        failures.append(f"{page}: {label} {detail}".strip())


def count(pattern: str, body: str) -> int:
    return len(re.findall(pattern, body, flags=re.I))


# --- /components ---------------------------------------------------------
print("components.html")
body = text_without_scripts("components.html")
plain = html.unescape(re.sub(r"<[^>]+>", " ", body))

cards = count(r"<article class=\"component\"", body)
check("components.html", f"{EXPECTED_COMPONENTS} component cards in the HTML",
      cards == EXPECTED_COMPONENTS, f"found {cards}")

installs = count(r"npx shadcn@latest add https://api\.mzizi\.dev/v1/ui/", body)
check("components.html", "one install command per component",
      installs >= EXPECTED_COMPONENTS, f"found {installs}")

# The page may NAME the retired form in prose ("…is retired"); what it must
# never do is tell somebody to install from it.
check("components.html", "no retired mzizi.dev/api/v1 install form",
      not re.search(r"add\s+(https://)?mzizi\.dev/api/v1", body))

# Named components from opposite ends of the corpus, and one from a rung.
for name in ("accessibility-audit", "accordion", "date-picker", "ai-chat",
             "circuit-breaker", "webhook-card"):
    check("components.html", f"component “{name}” is named on the page",
          f">{name}<" in body or f"/v1/ui/{name}" in body)

for node_title in ("Primitives", "Brand components", "Safety rails",
                   "Resilience patterns", "Pages", "Shell", "Assurance"):
    check("components.html", f"node “{node_title}” heading rendered",
          node_title in plain)

check("components.html", "the corpus total is printed", str(EXPECTED_COMPONENTS) in plain)

check("components.html", "the Mzizi Roots section leads the page",
      0 <= plain.find("Mzizi Roots: the Rust components") < plain.find("Every component"))
roots = count(r'<ul class="roots-list">', body)
check("components.html", "the Roots list is rendered", roots == 1)
rust_cards = count(r"data-rust=\"1\"", body)
check("components.html", "Rust components carry a Rust flag", rust_cards >= 1, f"found {rust_cards}")
check("components.html", "every card links to its own page",
      count(r'<h3> ?<a href="/components/', body) >= EXPECTED_COMPONENTS)

# --- /components/<name> --------------------------------------------------
print("\ncomponents/<name>.html")
detail_pages = sorted((DIST / "components").glob("*.html"))
check("components/", f"{EXPECTED_COMPONENTS} component pages built",
      len(detail_pages) == EXPECTED_COMPONENTS, f"found {len(detail_pages)}")
rust_pages = 0
failures_before = len(failures)
for page in detail_pages:
    rel = f"components/{page.name}"
    body = text_without_scripts(rel, quiet=True)
    if "<pre><code>" not in body and "ships no source file" not in body:
        check(rel, "renders its source, or says it has none", False)
    if "npx shadcn@latest add https://api.mzizi.dev/v1/ui/" not in body:
        check(rel, "prints its React install command", False)
    rust_at = body.find("Mzizi Roots: the Rust implementation")
    if rust_at >= 0:
        rust_pages += 1
        if not 0 <= rust_at < body.find('id="react"'):
            check(rel, "the Rust implementation comes before the React build", False)
check("components/", "every page renders its source (or says it has none) and its install command",
      len(failures) == failures_before)
check("components/", "some pages lead with a Rust implementation", rust_pages > 0, f"{rust_pages} Rust pages")

body = text_without_scripts("components/button.html")
plain = html.unescape(re.sub(r"<[^>]+>", " ", body))
check("components/button.html", "button leads with its Rust source",
      "Mzizi Roots: the Rust implementation" in plain and "use dioxus::prelude::*;" in plain)
check("components/button.html", "button shows its React source too",
      "class-variance-authority" in plain and "React build" in plain)
for fact in ("Owner", "Collection", "npm dependencies", "Registry dependencies"):
    check("components/button.html", f"“{fact}” is shown", fact in plain)
body = text_without_scripts("components/accordion.html")
check("components/accordion.html", "a React-only component says it has no Rust yet",
      "No Rust implementation yet." in body)

# --- /skills -------------------------------------------------------------
print("\nskills")
body = text_without_scripts("skills.html")
skill_cards = count(r'<a href="/skills/', body)
skill_pages = sorted((DIST / "skills").glob("*.html"))
check("skills.html", "one card per skill page", skill_cards == len(skill_pages) > 0,
      f"{skill_cards} cards, {len(skill_pages)} pages")
body = text_without_scripts("skills/simplify.html")
check("skills/simplify.html", "the skill body is rendered as HTML", "<h1" in body or "<h2" in body)

# --- /cli, /playground, /observability -----------------------------------
print("\ncli, playground, observability")
body = html.unescape(re.sub(r"<[^>]+>", " ", text_without_scripts("cli.html")))
check("cli.html", "the React install path", "npx shadcn@latest add https://api.mzizi.dev/v1/ui/" in body)
check("cli.html", "the Rust path", "/v1/rs/<name>" in body)
check("cli.html", "mzizi add names the release it ships in",
      "mzizi add" in body and "@nyuchi/mzizi-cli" in body and "0.6.0" in body)
check("cli.html", "the MCP gate is named as the Fundi tools only",
      "mzizi_fundi" in body and "mzizi_report_issue" in body)
check("cli.html", "mz check --agent", "mz check --agent" in body)
body = html.unescape(re.sub(r"<[^>]+>", " ", text_without_scripts("playground.html")))
check("playground.html", "says plainly it is not interactive", "Not interactive." in body)
body = html.unescape(re.sub(r"<[^>]+>", " ", text_without_scripts("observability.html")))
check("observability.html", "links the console", "app.mzizi.dev" in body)
check("observability.html", "shows the file-backed N2 count", "N2" in body and "371" in body)

# --- /architecture -------------------------------------------------------
print("\narchitecture.html")
body = text_without_scripts("architecture.html")
plain = html.unescape(re.sub(r"<[^>]+>", " ", body))

node_sections = count(r"<section class=\"helix-entry\"", body)
check("architecture.html", f"{EXPECTED_NODES + EXPECTED_RUNGS} helix positions rendered",
      node_sections == EXPECTED_NODES + EXPECTED_RUNGS, f"found {node_sections}")

strand_cards = count(r"<li class=\"strand\"", body)
check("architecture.html", f"{EXPECTED_STRANDS} strands rendered",
      strand_cards == EXPECTED_STRANDS, f"found {strand_cards}")

for title in ("Design tokens", "Primitives", "Brand components", "Safety rails",
              "Resilience patterns", "Pages", "Shell", "Assurance"):
    check("architecture.html", f"node “{title}” rendered", title in plain)

for title in ("Fundi", "Documentation", "Discovery", "Skills"):
    check("architecture.html", f"rung “{title}” rendered", title in plain)

for strand in ("Core guarantee", "Shipped", "Swappable", "Spine",
               "Genetic code", "Transcription"):
    check("architecture.html", f"strand “{strand}” rendered", strand in plain)

# Real component counts, not placeholders: N2 holds 371, N6 holds 52.
check("architecture.html", "N2 shows its live count of 371", "371 components" in plain)
check("architecture.html", "N6 shows its live count of 52", "52 components" in plain)
check("architecture.html", f"the {EXPECTED_COMPONENTS} total is printed", str(EXPECTED_COMPONENTS) in plain)

# The diagram is in the HTML, not drawn by a script.
check("architecture.html", "the helix is inline SVG", "<svg" in body and "backbone" in body)
dots = count(r"class=\"node-dot\"", body)
check("architecture.html", "every helix position has a plotted dot",
      dots == EXPECTED_NODES + EXPECTED_RUNGS, f"found {dots}")

# A covenant is the sentence that makes a node mean something.
check("architecture.html", "covenants rendered",
      "A primitive does one thing well." in plain)

# --- /tokens -------------------------------------------------------------
print("\ntokens.html")
body = text_without_scripts("tokens.html")
plain = html.unescape(re.sub(r"<[^>]+>", " ", body))

families = count(r"<li class=\"family\"", body)
check("tokens.html", f"{EXPECTED_FAMILIES} colour families rendered",
      families == EXPECTED_FAMILIES, f"found {families}")

# All 21 by name. The classic defect here is shipping only the seven minerals.
minerals = ["cobalt", "tanzanite", "malachite", "gold", "terracotta", "sodalite", "copper"]
heritage = ["indigo", "savanna", "baobab", "sunset", "river", "hematite", "kalahari"]
experimental = ["ember", "acacia", "fern", "lagoon", "storm", "dusk", "protea"]
for name in minerals + heritage + experimental:
    check("tokens.html", f"family “{name}” rendered", f"--color-{name}" in body)

# Real hex values, light and dark, painted and printed.
for hexcode in ("#0047AB", "#00B0FF", "#B388FF", "#7986CB", "#DA8766", "#FFD740"):
    check("tokens.html", f"hex {hexcode} is in the HTML", hexcode in body)

hexes = set(re.findall(r"#[0-9A-Fa-f]{6}", body))
check("tokens.html", "a full palette's worth of distinct hex values",
      len(hexes) >= 60, f"found {len(hexes)}")

check("tokens.html", "both themes shown per family",
      count(r">Light<", body) >= EXPECTED_FAMILIES and count(r">Dark<", body) >= EXPECTED_FAMILIES)

for prose in ("Katanga (DRC) and Zambian Copperbelt",
              "Indigofera, West Africa textile tradition",
              "Digital future, trust, knowledge"):
    check("tokens.html", f"origin/symbolism prose rendered: “{prose[:32]}…”", prose in plain)

check("tokens.html", "typography rendered", "Noto Serif" in plain and "JetBrains Mono" in plain)
check("tokens.html", "spacing steps rendered", count(r"<li class=\"step\"", body) == 17,
      f"found {count(chr(60) + 'li class=.step.', body)}")
check("tokens.html", "radii rendered", "9999px" in body)

# --- / (the landing page, which leads with the language) -----------------
print("\nindex.html")
body = text_without_scripts("index.html")
plain = html.unescape(re.sub(r"<[^>]+>", " ", body))
plain = re.sub(r"\s+", " ", plain)

check("index.html", "the status panel is rendered",
      "Status: two pilots, no advantage yet" in plain)
check("index.html", "the status panel says neither pilot showed an advantage",
      "show no measurable advantage for Mzizi" in plain)
# The panel comes before anything about components: the language leads.
status_at = plain.find("Status: two pilots")
components_at = plain.find("The components: Mzizi Roots")
check("index.html", "the status panel precedes the components section",
      0 <= status_at < components_at, f"status at {status_at}, components at {components_at}")
# The bench's first paint is in the HTML, not drawn by its script.
check("index.html", "the contract bench renders its source without JavaScript",
      "button_size" in plain and "at_least" in plain)
check("index.html", "the contract bench renders its all-pass result without JavaScript",
      "5 contract clauses, 0 failed" in plain)
check("index.html", "the language-is / isn't section is rendered",
      "What the language is, and what it isn't" in plain)
check("index.html", "the status panel says Phase 0 is not complete",
      "Phase 0 is not complete" in plain and "benchmarks/READINESS.md" in plain)
body = text_without_scripts("language.html", quiet=True)
for rfc in ("RFC-0009-comparison-benchmark.md", "RFC-0010-contracts-everywhere.md"):
    check("language.html", f"links {rfc} in mzizi-dev/mzizi design/",
          f'href="https://github.com/mzizi-dev/mzizi/blob/main/design/{rfc}"' in body)

# --- /.well-known --------------------------------------------------------
print("\n.well-known")
security = (DIST / ".well-known" / "security.txt").read_text(encoding="utf-8")
check(".well-known/security.txt", "has a Contact line",
      re.search(r"^Contact: mailto:security@bundu\.org$", security, re.M) is not None)
expires = re.search(r"^Expires: (\d{4}-\d\d-\d\dT[\d:]+Z)$", security, re.M)
check(".well-known/security.txt", "has an ISO 8601 Expires line", expires is not None)
if expires:
    import datetime
    when = datetime.datetime.fromisoformat(expires.group(1).replace("Z", "+00:00"))
    now = datetime.datetime.now(datetime.timezone.utc)
    check(".well-known/security.txt", "Expires is in the future — renew it if this fails",
          when > now, expires.group(1))
check(".well-known/security.txt", "has its Canonical URL",
      "Canonical: https://mzizi.dev/.well-known/security.txt" in security)

# --- /mcp ----------------------------------------------------------------
print("\n_redirects")
redirects = (DIST / "_redirects").read_text(encoding="utf-8")
check("_redirects", "/mcp still 308s to mcp.mzizi.dev/mcp",
      re.search(r"^/mcp\s+https://mcp\.mzizi\.dev/mcp\s+308\s*$", redirects, re.M) is not None)
check("_redirects", "/mcp is not also built as a page",
      not (DIST / "mcp.html").exists())
check("_redirects", "/api/v1 still 308s to api.mzizi.dev/v1",
      re.search(r"^/api/v1\s+https://api\.mzizi\.dev/v1\s+308\s*$", redirects, re.M) is not None)
# The portal pages are ported: nothing on this site may send a reader back to
# the registry app for them, and each one must exist as a page.
check("_redirects", "no redirect to the registry app is left",
      "mzizi-registry.nyuchi.workers.dev" not in redirects)
for page in ("cli", "skills", "playground", "observability"):
    check("_redirects", f"/{page} is a page, not a redirect",
          (DIST / f"{page}.html").exists()
          and re.search(rf"^/{page}\s", redirects, re.M) is None)

# --- stale claims -----------------------------------------------------------
# Facts that were true while this site was being built and are not now. A page
# that still says one of them is wrong, however well it renders.
print("\nstale claims")
stale = {
    "invalid_token": "the MCP server answers without a token (since mzizi-mcp 0.10.1)",
    "until it deploys": "the no-sign-in MCP change has deployed",
    "written but not published": "mzizi add ships in @nyuchi/mzizi-cli 0.6.0",
    "mzizi-registry.nyuchi.workers.dev/components": "component pages are served here",
}
built = [p for p in DIST.rglob("*") if p.suffix in (".html", ".txt", ".json") and "pagefind" not in p.parts]
for phrase, why in stale.items():
    hits = [str(p.relative_to(DIST)) for p in built if phrase in p.read_text(encoding="utf-8")]
    check("dist/", f"no page says “{phrase}” — {why}", not hits, ", ".join(hits[:5]))

# The same idea for facts that break across tags or lines, matched against each
# file as a reader sees it: scripts and tags stripped, entities decoded,
# whitespace collapsed. Each one was the site's own wording once. When a fact
# goes stale, add its old wording here so it cannot come back. The live check
# of the current values is scripts/check-facts.py, which needs the network.
stale_patterns = {
    r"\b269 tests\b": "the language has 308 tests in 14 suites (mzizi-dev/mzizi e9e9233)",
    r"\b12 suites\b": "the language's tests run in 14 suites (e9e9233)",
    r"\b6,684\b": "compiler/src is 7,454 lines (e9e9233)",
    r"(RFC-0009|RFC-0010)[^.]{0,120}\bforthcoming\b|\bforthcoming\b[^.]{0,120}(RFC-0009|RFC-0010)":
        "RFC-0009 and RFC-0010 are merged in mzizi-dev/mzizi design/",
    r"(RFC-0009|RFC-0010)[^.]{0,120}not in design/ yet": "RFC-0009 and RFC-0010 are in design/",
    r"not (yet )?built:? mz fix\b|not there yet: mz fix\b": "mz fix is built (e9e9233)",
    r"Known issue in 0\.6\.0": "@nyuchi/mzizi-cli 0.6.1 fixed the bin-link bug",
    r"mzizi-cli/dist/cli\.js": "npx mzizi works from 0.6.1; no by-path workaround",
    r"still says routes read from Supabase": "/openapi no longer says that (checked 2026-09-29)",
    r"io\.github\.nyuchi/mzizi-mcp": "the MCP Registry entry is io.github.mzizi-dev/mzizi-mcp",
    # One crate for every Rust component. From registry 9b86e03 on, the gateway
    # serves each document's own crate (mzizi-ui for primitives, mzizi-brand for
    # brand). The pin moves by itself now, so none is named here as current.
    r"The document names the crate mzizi-ui|The crate it names, mzizi-ui|module of the mzizi-ui crate|records the mzizi-ui crate":
        "/v1/rs/<name> names each component's own crate (since registry 9b86e03)",
    r"did not yet serve the twelve brand components|named mzizi-ui for every component":
        "api.mzizi.dev serves the brand components (since registry 9b86e03)",
}


def reader_text(path: pathlib.Path) -> str:
    raw = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        raw = re.sub(r"<script\b.*?</script>", " ", raw, flags=re.S | re.I)
        raw = re.sub(r"<style\b.*?</style>", " ", raw, flags=re.S | re.I)
        raw = re.sub(r"<[^>]+>", " ", raw)
        raw = html.unescape(raw)
    raw = raw.replace("`", "")
    return re.sub(r"\s+", " ", raw)


readable = {str(p.relative_to(DIST)): reader_text(p) for p in built}
for pattern, why in stale_patterns.items():
    hits = [name for name, text in readable.items() if re.search(pattern, text, re.I)]
    check("dist/", f"nothing matches /{pattern}/ — {why}", not hits, ", ".join(hits[:5]))

# --- contact ----------------------------------------------------------------
# The owner's general contact for Mzizi (2026-09-30) is support@bundu.org, and
# security reports go to security@bundu.org. The footer carries both on every
# page; /ecosystem, llms.txt and the MCP card carry the general one. No other
# address may appear: the console's security@nyuchi.com is named in
# security.txt's comment and the repository docs, never on a page, and a
# personal or retired address (conduct@, a person's own) must not come back.
print("\ncontact")
CONTACT, SECURITY = "support@bundu.org", "security@bundu.org"
html_pages = [p for p in built if p.suffix == ".html"]
no_footer = [str(p.relative_to(DIST)) for p in html_pages
             if f'href="mailto:{CONTACT}"' not in p.read_text(encoding="utf-8")
             or f'href="mailto:{SECURITY}"' not in p.read_text(encoding="utf-8")]
check("footer", f"every page links {CONTACT} and {SECURITY}", not no_footer,
      f"{len(no_footer)} without: {', '.join(no_footer[:5])}")
for name in ("ecosystem.html", "llms.txt", ".well-known/mcp.json"):
    check(name, f"names {CONTACT}", CONTACT in (DIST / name).read_text(encoding="utf-8"))
address = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
allowed = {CONTACT, SECURITY}
# Only what this repository writes. Component and skill pages render registry
# source, whose demo data (you@example.com, a sample sign-in) is not a contact
# point; their footers are covered by the check above.
surfaces = [p for p in built if p.relative_to(DIST).parts[0] not in ("components", "skills")]
strays = sorted({f"{p.relative_to(DIST)}: {m}" for p in surfaces
                 for m in address.findall(reader_text(p))
                 if m not in allowed and not (p.name == "security.txt" and m == "security@nyuchi.com")})
check("dist/", f"no contact address but {CONTACT} and {SECURITY}", not strays, ", ".join(strays[:5]))

# --- result ---------------------------------------------------------------
if notes:
    print("\nnotes")
    for note in notes:
        print(f"  - {note}")

print()
if failures:
    print(f"FAILED: {len(failures)} assertion(s)")
    for failure in failures:
        print(f"  - {failure}")
    sys.exit(1)
print("All pages render their content with every <script> removed.")

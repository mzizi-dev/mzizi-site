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
EXPECTED_COMPONENTS = 656
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
# Any skill page, not a named one: the set is whatever /v1/skills serves at the
# gateway's pin, and skills are renamed and removed between releases (0.8.0
# consolidates them to five).
if skill_pages:
    first = str(skill_pages[0].relative_to(DIST))
    body = text_without_scripts(first)
    check(first, "the skill body is rendered as HTML", "<h1" in body or "<h2" in body)

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
check("observability.html", "shows the file-backed N2 count", "N2" in body and "388" in body)

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

# Real component counts, not placeholders: N2 holds 388, N6 holds 90.
check("architecture.html", "N2 shows its live count of 388", "388 components" in plain)
check("architecture.html", "N6 shows its live count of 90", "90 components" in plain)
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
# The hero leads, carries the bench as its media, and is honest about Phase 0;
# the status panel is the very next block (owner decision, 2026-09-30).
raw_index = (DIST / "index.html").read_text(encoding="utf-8")
hero_at = raw_index.find('data-slot="hero"')
media_at = raw_index.find('data-slot="hero-media"')
bench_at = raw_index.find('id="bench-src"')
check("index.html", "the page opens on the Hero", 0 <= hero_at < raw_index.find('id="status"'))
check("index.html", "the contract bench is the Hero's media", 0 <= hero_at < media_at < bench_at)
check("index.html", "the Hero's status badge says Phase 0 is a research prototype",
      "Phase 0 · research prototype" in html.unescape(raw_index))
after_hero = re.search(r'data-slot="hero".*?</section>\s*<section\b[^>]*\bid="([^"]+)"', raw_index, re.S)
check("index.html", "the status panel is the block directly after the Hero",
      after_hero is not None and after_hero.group(1) == "status",
      after_hero.group(1) if after_hero else "no section after the hero")
for claim in (r"\bfaster\b", r"\bbetter than\b", r"\boutperform"):
    check("index.html", f"the landing page makes no /{claim}/ claim", re.search(claim, plain, re.I) is None)
# Positioning (owner, 2026-09-30): Mzizi is a programming language whose goal
# is to be used instead of TypeScript, Python and C++, with Rust as its
# platform. The page says so as a goal, and puts the benchmark's question, per
# task family, straight after the status panel: never a results table.
check("index.html", "the landing page states the goal against TypeScript, Python and C++",
      "instead of TypeScript, Python or C++" in plain)
check("index.html", "the hero carries the owner's tagline, as a goal: built to make Rust better, the way TypeScript makes JavaScript better",
      "Built to make Rust better, the way TypeScript makes JavaScript better" in plain
      and "That is the goal Phase 0 measures" in plain)
check("index.html", "the benchmark's question is rendered, and says nothing is measured",
      "What Mzizi is measured against" in plain and "nothing below has been measured yet" in plain)
for fam in ("ui-spec", "backend", "ui-port"):
    check("index.html", f"the benchmark section names the {fam} family", fam in plain)
for arm in ("TypeScript · React", "TypeScript · Hono", "Python · FastAPI", "Go · net/http",
            "C++20 · cpp-httplib", "Rust · axum", "Rust · Dioxus 0.7.10", "Rust · Leptos 0.8.21"):
    check("index.html", f"the benchmark section lists the {arm} arm", arm in plain)
after_status = re.search(r'id="status".*?</section>\s*<section\b[^>]*\bid="([^"]+)"', raw_index, re.S)
check("index.html", "the benchmark's question is the block directly after the status panel",
      after_status is not None and after_status.group(1) == "benchmark",
      after_status.group(1) if after_status else "no section after the status panel")
llms = (DIST / "llms.txt").read_text(encoding="utf-8")
check("llms.txt", "says Mzizi is a programming language, and what its goal is",
      "general-purpose programming language" in llms and "instead of TypeScript, Python and C++" in llms)
check("llms.txt", "says which things are toolchain and components, not the language",
      "**The toolchain, which implements and supports the language:**" in llms
      and "**The components, which support the language:**" in llms)
# The harness is the core of Mzizi by design (owner, 2026-09-30), and not
# built yet: llms.txt says both, and never confuses it with benchmarks/harness/.
check("llms.txt", "says the harness is the core of the language, and not built yet",
      "**The harness is the core of Mzizi**" in llms and "The harness as a whole is not built" in llms)
body = text_without_scripts("language.html", quiet=True)
for rfc in ("RFC-0009-comparison-benchmark.md", "RFC-0010-contracts-everywhere.md",
            "RFC-0011-handlers.md", "RFC-0012-harness.md"):
    check("language.html", f"links {rfc} in mzizi-dev/mzizi design/",
          f'href="https://github.com/mzizi-dev/mzizi/blob/main/design/{rfc}"' in body)
for rfc in ("RFC-0011-handlers.md", "RFC-0012-harness.md"):
    check("llms.txt", f"lists {rfc}", f"https://github.com/mzizi-dev/mzizi/blob/main/design/{rfc}" in llms)

# The language tracker (owner, 2026-09-30): LANGUAGE-TRACKER.md is the one list
# of what Mzizi still needs, and every capability claim comes from it. The
# /language page and the landing status panel link it as "What still has to be
# built", and the site says plainly what a program has (tracker C1–C4, C9, on
# main since the 8 October release, #91) and what Mzizi does not have yet.
# scripts/check-facts.py holds both sentences to the live tracker: it fails when
# a row named as missing turns ✅, or a row named as present is not on main.
TRACKER = "https://github.com/mzizi-dev/mzizi/blob/main/LANGUAGE-TRACKER.md"
PRESENT = "In a program, Mzizi has expressions, bindings, functions, control flow and error handling"
MISSING = "no modules, standard library, text operations, maps or sets, methods on records or concurrency yet"
status_panel = re.search(r'id="status".*?</section>', raw_index, re.S)
check("index.html", "the status panel links the tracker as “What still has to be built”",
      status_panel is not None and f'href="{TRACKER}"' in status_panel.group(0)
      and "What still has to be built" in status_panel.group(0))
check("language.html", "links the tracker as “What still has to be built”",
      f'href="{TRACKER}"' in body and "What still has to be built" in body)
language_plain = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", body)))
for name, text in (("index.html", plain), ("language.html", language_plain), ("llms.txt", re.sub(r"\s+", " ", llms.replace("*", "")))):
    check(name, "says plainly what Mzizi does not have yet (LANGUAGE-TRACKER.md)", MISSING in text)
    check(name, "says what a program has, and no more (LANGUAGE-TRACKER.md C1–C4, C9)", PRESENT in text)
# The backend slice (mzizi-dev/mzizi #29–#33): a service lowers, to a local
# Rust + axum package, and nothing else does. The pages say exactly that.
for name, text in (("index.html", plain), ("language.html", language_plain)):
    check(name, "says a service lowers to a local Rust + axum package, and no component does",
          "local Rust + axum package" in text and "No component lowers yet" in text)
# The arms as benchmarks/arms/ holds them (checked live by check-facts.py).
check("index.html", "the React arm exists and has never run",
      re.search(r"TypeScript · React\s*exists, never run", plain) is not None)
check("index.html", "the other-language backend arms are not added yet",
      all(re.search(re.escape(a) + r"\s*not added yet", plain) for a in
          ("TypeScript · Hono", "Python · FastAPI", "Go · net/http", "C++20 · cpp-httplib", "Rust · axum")))
check("index.html", "the Mzizi backend arm is mzizi-be, with the probe crate and task B1",
      "mzizi-be" in plain and "mzprobe" in plain and "B1" in plain)

# Progress (owner, 2026-10-07: "We also need to be updating docs and the site
# with progress and where we are"). The landing page's status section and
# /language show what is on main, what is on staging, and what is in progress
# toward M1, and the in-progress column is labelled as not available and links
# the tracking issue and its open pull requests. src/lib/progress.ts holds the
# data; scripts/check-facts.py checks each linked pull request is still open.
LANG = "https://github.com/mzizi-dev/mzizi"
M1_LINKS = (f"{LANG}/issues/69", f"{LANG}/pull/76", f"{LANG}/pull/80", f"{LANG}/pull/81", f"{LANG}/pull/83",
            f"{LANG}/pull/85", f"{LANG}/pull/87", f"{LANG}/pull/88", f"{LANG}/pull/89", f"{LANG}/pull/91",
            f"{LANG}/pull/92", f"{LANG}/pull/93", f"{LANG}/pull/95", f"{LANG}/pull/96")
for name, raw in (("index.html", status_panel.group(0) if status_panel else ""),
                  ("language.html", (DIST / "language.html").read_text(encoding="utf-8"))):
    text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", raw)))
    check(name, "shows what is on main, on staging, and in progress toward M1",
          all(h in text for h in ("On main today", "Landing on staging", "In progress toward M1")))
    check(name, "labels the in-progress work as open pull requests, not available yet",
          "Not available yet" in text and "None of this is in Mzizi today" in text)
    for link in M1_LINKS:
        check(name, f"links {link.removeprefix(LANG + '/')}", f'href="{link}"' in raw)
    # In progress is never presented as shipped: the column order is fixed.
    at = [text.find(h) for h in ("On main today", "Landing on staging", "In progress toward M1")]
    check(name, "the three columns read main, then staging, then in progress", -1 < at[0] < at[1] < at[2])
# RFC-0013 (#76) and the language survey reached main in the 8 October release
# (#91): link their files on main, and no design/ file on staging anywhere.
RFC13 = f"{LANG}/blob/main/design/RFC-0013-core-language.md"
for name in ("language.html", "llms.txt"):
    raw = (DIST / name).read_text(encoding="utf-8")
    check(name, "lists RFC-0013 on main, with its pull request #76",
          RFC13 in raw and f"{LANG}/pull/76" in raw)
    check(name, "links the language survey on main",
          f"{LANG}/blob/main/design/LANGUAGE-SURVEY.md" in raw)
staged = [str(p.relative_to(DIST)) for p in sorted(DIST.rglob("*"))
          if p.suffix in (".html", ".txt") and f"{LANG}/blob/staging/design/" in p.read_text(encoding="utf-8")]
check("dist/", "no page links a design/ file on staging (RFC-0013 and the survey are on main)",
      not staged, ", ".join(staged[:5]))

# Programs (RFC-0013, on main since the 8 October release). The landing page,
# /language and /cli each show a real example program from mzizi-dev/mzizi's
# examples/ and what mz run printed for it (src/lib/programs.ts), and /cli
# lists mz run and mz harness as commands.
for name, head, line in (("index.html", "program errors", "20 and 151 were rejected: too_old is above 150"),
                         ("language.html", "program numbers", "0.1 + 0.2 is 0.30000000000000004"),
                         ("cli.html", "program control", "collatz(27) takes 111 steps")):
    raw = html.unescape(text_without_scripts(name, quiet=True))
    check(name, f"shows a real program ({head}) and the output mz run printed for it",
          head in raw and line in raw and "$ mz run examples/" in raw)
cli_text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text_without_scripts("cli.html", quiet=True))))
for command in ("mz run [--release] <program.mz>", "mz harness version | definition [--agent] | entry <name> [--agent]"):
    check("cli.html", f"lists {command.split(' [')[0].split(' |')[0]} as a command", command in cli_text)
check("cli.html", "does not list mz run as unbuilt",
      re.search(r"not built:[^.]*\bmz run\b(?! --agent)", cli_text) is None)

# --- no framework in the browser -------------------------------------------
# @bundu/ui's React primitives render to HTML at build time. A `client:*`
# directive would ship React and hydrate an island; the doctrine is no third UI
# framework in the browser, so no page may load one.
print("\nno framework runtime")
all_html = sorted(DIST.rglob("*.html"))
islands = [str(p.relative_to(DIST)) for p in all_html
           if re.search(r"<astro-island\b|renderer-url=|/_astro/client\.[^\"']*\.js", p.read_text(encoding="utf-8"))]
check("dist/", "no page hydrates an island or loads the React client", not islands, ", ".join(islands[:5]))

# --- The share card ------------------------------------------------------
# Without an og:image, a link preview picks any image on the page or none.
print("\nshare card")
import json as _json
_og_manifest = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "og-cards.json"
og_cards = _json.loads(_og_manifest.read_text(encoding="utf-8")) if _og_manifest.is_file() else {}
check("og-cards.json", "lists a card for the landing page and each top-level page",
      "index" in og_cards and all(p.stem in og_cards for p in DIST.glob("*.html") if p.name != "404.html"),
      ", ".join(p.stem for p in DIST.glob("*.html") if p.name != "404.html" and p.stem not in og_cards))
def _is_card(f: pathlib.Path) -> bool:
    b = f.read_bytes() if f.is_file() else b""
    return b[:8] == b"\x89PNG\r\n\x1a\n" and int.from_bytes(b[16:20], "big") == 1200 and int.from_bytes(b[20:24], "big") == 630
bad_png = [s for s in [*og_cards, "index-light"] if not _is_card(DIST / "og" / f"{s}.png")]
check("og/", "every card is in dist/ as a 1200 x 630 PNG", not bad_png, ", ".join(bad_png))
def _want_card(p: pathlib.Path) -> str:
    rel = p.relative_to(DIST).with_suffix("").as_posix()
    first = rel.split("/")[0]
    return first if first in og_cards else "index"
no_card = [p.relative_to(DIST).as_posix() for p in DIST.rglob("*.html")
           if p.name != "404.html" and not p.relative_to(DIST).as_posix().startswith("pagefind/")
           and f'property="og:image" content="https://mzizi.dev/og/{_want_card(p)}.png"' not in p.read_text(encoding="utf-8")]
check("dist/", "every page names its own section's card as its absolute og:image", not no_card, ", ".join(no_card[:5]))
for icon in ("favicon.svg", "favicon-32.png", "apple-touch-icon.png"):
    check(icon, "is in dist/", (DIST / icon).is_file())
no_icon = [p.relative_to(DIST).as_posix() for p in DIST.glob("*.html")
           if 'rel="icon" href="/favicon.svg"' not in p.read_text(encoding="utf-8")
           or 'rel="apple-touch-icon" href="/apple-touch-icon.png"' not in p.read_text(encoding="utf-8")]
check("dist/", "every top-level page links the favicon and the touch icon", not no_icon, ", ".join(no_icon[:5]))
check("index.html", "asks for a large-image card on X", 'name="twitter:card" content="summary_large_image"' in raw_index)

# --- /.well-known --------------------------------------------------------
print("\n.well-known")
security = (DIST / ".well-known" / "security.txt").read_text(encoding="utf-8")
check(".well-known/security.txt", "has a Contact line",
      re.search(r"^Contact: mailto:security@nyuchi\.com$", security, re.M) is not None)
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
    r"\b(269|308|428|437|534|643) tests\b": "the language has 644 tests in 24 suites (mzizi-dev/mzizi dc156c5)",
    r"\b512 of them in the compiler crate\b": "the compiler crate has 513 of the 644 tests (dc156c5)",
    r"\b(12|14|18|19) suites\b": "the language's tests run in 24 suites (dc156c5)",
    r"\b(6,684|7,454|12,706|12,916|26,811)\b|about 12,[79]00 lines": "compiler/src is 26,850 lines (dc156c5)",
    # The harness at dc156c5: 137 entries, 70 diagnostic codes, 51 pending (#93).
    r"\b133 entries\b|\b66 (of them )?diagnostic codes\b|\b55 codes\b": "mz harness definition has 137 entries and 70 diagnostic codes, with 51 codes pending (dc156c5)",
    # The tracker marks C1–C5, C9 and C10 ✅ on main (#92): no page says they read 🟡.
    r"still marks (those rows|C1–C5)[^.]{0,80}🟡|rows \(C1–C5, C9, C10\) 🟡": "the tracker marks C1–C5, C9 and C10 ✅ on main (#92)",
    # Programs reached main in the 8 October release (#91).
    r"\bmz run\b[^.]{0,120}(\bnot (yet )?(on|released to) main\b|\bon (the )?staging\b)":
        "mz run is on main since the 8 October release (#91)",
    r"\bMzizi has no functions\b|\bno expressions, bindings, callable functions\b":
        "a program has functions, expressions, bindings, control flow and errors (tracker C1–C4, C9)",
    # The React arm's pins came from the registry's lockfile on 2026-10-07
    # (released to mzizi-dev/mzizi main in 0653903; benchmarks/READINESS.md item 1).
    r"waits on:? the React arm's pins|still needs the React arm's pins":
        "the React arm's pins come from the registry's lockfile (READINESS.md item 1, done 2026-10-07)",
    r"(RFC-0009|RFC-0010)[^.]{0,120}\bforthcoming\b|\bforthcoming\b[^.]{0,120}(RFC-0009|RFC-0010)":
        "RFC-0009 and RFC-0010 are merged in mzizi-dev/mzizi design/",
    r"(RFC-0009|RFC-0010)[^.]{0,120}not in design/ yet": "RFC-0009 and RFC-0010 are in design/",
    r"not (yet )?built:? mz fix\b|not there yet: mz fix\b": "mz fix is built (e9e9233)",
    r"Known issue in 0\.6\.0": "@nyuchi/mzizi-cli 0.6.1 fixed the bin-link bug",
    r"mzizi-cli/dist/cli\.js": "npx mzizi works from 0.6.1; no by-path workaround",
    r"still says routes read from Supabase": "/openapi no longer says that (checked 2026-09-29)",
    # Naming the old entry AS the old one is right (the mzizi-backend skill
    # says "the old io.github.nyuchi/mzizi-mcp entry is stale"); presenting
    # it as current is not.
    r"(?<!old )io\.github\.nyuchi/mzizi-mcp": "the MCP Registry entry is io.github.mzizi-dev/mzizi-mcp",
    # One crate for every Rust component. From registry 9b86e03 on, the gateway
    # serves each document's own crate (mzizi-ui for primitives, mzizi-brand for
    # brand). The pin moves by itself now, so none is named here as current.
    r"The document names the crate mzizi-ui|The crate it names, mzizi-ui|module of the mzizi-ui crate|records the mzizi-ui crate":
        "/v1/rs/<name> names each component's own crate (since registry 9b86e03)",
    r"did not yet serve the twelve brand components|named mzizi-ui for every component":
        "api.mzizi.dev serves the brand components (since registry 9b86e03)",
    # Positioning (owner, 2026-09-30). The toolchain and the components support
    # the language; neither is the language, and nothing lowers yet.
    r"\bthe compiler is the language\b":
        "the mz compiler is the toolchain that implements the language",
    r"corpus the language is scored against":
        "the components are built to support the language; supplying benchmark tasks is one job",
    r"\b(general-purpose|Rust) framework for the agentic|a language for the agentic web, in Rust":
        "Mzizi is a programming language, with Rust as its platform",
    r"\bMzizi (lowers|compiles) to Rust\b":
        "Mzizi is designed to lower to Rust; today only a service lowers, to a local Rust + axum package (LANGUAGE-TRACKER.md P3)",
    r"React[^.]{0,20}\((new|all new)\)|TypeScript · React\s*new\b":
        "the React arm is in benchmarks/arms/ and has never run",
    r"mzizi-be[^.]{0,30}\bblocked\b":
        "the mzizi-be arm exists, with mzprobe and task B1, and has never run",
    r"\bPhase 0\b[^.]{0,40}\bProve the core claim, no rendering attached":
        "Phase 0's one goal is building Mzizi as a programming language, measured against the best existing language for each kind of task (RFC-0009)",
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

# The language's state at mzizi-dev/mzizi 62a0f32 (charter v0.4, RFC-0012, the
# backend slice #29–#33), in this repository's own words. The skill pages are
# left out: their bodies are @nyuchi/mzizi-skills as /v1/skills serves it, which
# the skills-freshness agent keeps current, and check-facts.py notes when one
# lags. Every other page is this repository's text.
language_state_patterns = {
    r"\bcharter\W{0,3}(\(|, )?v0\.[0-3]\b|CHARTER\.md\W{0,3}(\(|, )?v0\.[0-3]\b":
        "the charter on main is v0.4, “Mzizi: a general-purpose programming language”",
    r"\bnothing lowers yet\b|\bNo lowering to Rust\b|Nothing it compiles runs yet|emits no Rust yet":
        "a service lowers to a local Rust + axum package, which CI compiles, tests and serves (mz build, #32)",
    r"cannot write or run a handler":
        "a service with HTTP routes and handlers exists, and mz contract runs it (#30, #31)",
    r"\bRFC is being written\b":
        "the harness's design is RFC-0012, a draft, on main",
}
own_pages = {name: text for name, text in readable.items() if not name.startswith("skills/")}
for pattern, why in language_state_patterns.items():
    hits = [name for name, text in own_pages.items() if re.search(pattern, text, re.I)]
    check("dist/", f"nothing matches /{pattern}/ — {why}", not hits, ", ".join(hits[:5]))

# --- contact ----------------------------------------------------------------
# The owner's general contact for Mzizi (2026-09-30) is support@bundu.org, and
# security reports go to security@nyuchi.com (owner, 2026-10-03). The footer
# carries both on every page; /ecosystem, llms.txt and the MCP card carry the
# general one. No other address may appear: a personal or retired address
# (conduct@, security@bundu.org, a person's own) must not come back.
print("\ncontact")
CONTACT, SECURITY = "support@bundu.org", "security@nyuchi.com"
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

# --- spaces around inline elements -------------------------------------------
# Astro drops the line break between a line that ends in text and a next line
# that starts with an inline element, so
#
#     is lowercase: <code>nyuchi</code>,
#     <code>mukoko</code>
#
# builds as `nyuchi,<code>mukoko` and reads "nyuchi,mukoko". The same happens
# when a line ends in `</code>` and the next one starts with a word. The fix is
# a `{" "}` at the end of the first line (or one joined line). This found 58 such
# places across the site on 2026-09-30.
#
# The check reads the built HTML, not the source, because only the build knows
# which line breaks Astro kept. In rendered prose, a word or a `.,;:!?)` glued
# to an opening inline tag, or a closing inline tag glued to a word, is wrong
# whatever the source looked like, so it does not need to see the source.
# An opening bracket, a quote, a slash, a dash or an arrow before a tag is
# allowed (`(<code>`, `"<a`, `/<code>`, `→<strong>`). Code in <pre>, scripts,
# styles and SVG are left out, and so is a skill page's body, which is the
# registry's Markdown rendered as it is and not this repository's writing.
#
# Do not widen that to all of `components/` or `skills/`. Those pages are this
# repository's templates (`src/pages/*/[name].astro`) with registry text in
# them, and registry text reaches the HTML escaped, so it can never make a tag
# of its own: a join on those pages is in the template and renders once per
# component. The skill body is the only registry content set as raw HTML.
print("\nspaces around inline elements")
INLINE = r"a|abbr|b|cite|code|dfn|em|i|kbd|mark|q|s|samp|small|strong|sub|sup|time|u|var"
glued_before = re.compile(r"[\w.,;:!?)](?=<(?:" + INLINE + r")[\s>])")
glued_after = re.compile(r"</(?:" + INLINE.replace("|i|", "|") + r")>(?=\w)")
skipped = re.compile(
    r"<(script|style|pre|svg|textarea)\b.*?</\1>|<article class=\"prose skill-body\".*?</article>",
    flags=re.S | re.I)
glued: list[str] = []
for path in html_pages:
    raw = skipped.sub(" ", path.read_text(encoding="utf-8"))
    for pattern in (glued_before, glued_after):
        for m in pattern.finditer(raw):
            around = re.sub(r"\s+", " ", raw[max(0, m.start() - 40):m.end() + 30])
            glued.append(f"{path.relative_to(DIST)}: …{around}…")
check("dist/", "no word or punctuation is glued to an inline tag — end the source line with {\" \"}",
      not glued, f"{len(glued)} found: " + " | ".join(glued[:8]) if glued else "")

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

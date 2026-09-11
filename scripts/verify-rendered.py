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
EXPECTED_COMPONENTS = 575
EXPECTED_NODES = 8
EXPECTED_RUNGS = 4
EXPECTED_STRANDS = 6
EXPECTED_FAMILIES = 21

failures: list[str] = []
notes: list[str] = []


def text_without_scripts(page: str) -> str:
    """The page as a reader with JavaScript switched off would receive it."""
    raw = (DIST / page).read_text(encoding="utf-8")
    if "<script" in raw:
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
check("architecture.html", "the 575 total is printed", "575" in plain)

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

# --- /mcp ----------------------------------------------------------------
print("\n_redirects")
redirects = (DIST / "_redirects").read_text(encoding="utf-8")
check("_redirects", "/mcp still 308s to mcp.mzizi.dev/mcp",
      re.search(r"^/mcp\s+https://mcp\.mzizi\.dev/mcp\s+308\s*$", redirects, re.M) is not None)
check("_redirects", "/mcp is not also built as a page",
      not (DIST / "mcp.html").exists())

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

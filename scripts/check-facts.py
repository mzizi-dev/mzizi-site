#!/usr/bin/env python3
"""Fail when the built site disagrees with the live upstream facts.

The owner's freshness rule (2026-09-30): mzizi.dev must never lag the language
(`mzizi-dev/mzizi`) or the components (`mzizi-registry`, the Mzizi Roots crates
on crates.io, the `@nyuchi/` npm packages). Most of what the site says about
them is read at build time. Some of it cannot be: the language's test count,
for one, comes from a Rust build this site does not run. This script reads each
upstream source and compares it with what `dist/` says.

It needs the network, so it is not in the required CI path. It runs from the
`Freshness` workflow (manual and scheduled) and by hand:

    pnpm build && python3 scripts/check-facts.py dist

A failure means the site has drifted. Fix the site from the upstream source,
not this script, unless the source moved (then fix both, in one commit).
"""

from __future__ import annotations

import html
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.request

DIST = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
UA = "mzizi-site check-facts (https://github.com/mzizi-dev/mzizi-site)"

LANGUAGE_README = "https://raw.githubusercontent.com/mzizi-dev/mzizi/main/README.md"
LANGUAGE_DESIGN = "https://api.github.com/repos/mzizi-dev/mzizi/contents/design?ref=main"
LANGUAGE_HEAD = "https://api.github.com/repos/mzizi-dev/mzizi/commits/main"
NPM = ("@nyuchi/mzizi-cli", "@nyuchi/mzizi-mcp", "@nyuchi/mzizi-skills")
CRATES = (
    "mzizi-tokens",
    "mzizi-ui",
    "mzizi-brand",
    "mzizi-shell",
    "mzizi-assurance",
    "mzizi-fundi",
    "mzizi-docs",
    "mzizi-discovery",
    "mzizi-roots",
    "mzizi-roots-server",
)
MCP_REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers?search=mzizi-mcp"
MCP_NAME = "io.github.mzizi-dev/mzizi-mcp"

failures: list[str] = []
notes: list[str] = []


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"  [{'ok  ' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(f"{label} {detail}".strip())


def fetch(url: str) -> str:
    headers = {"user-agent": UA, "accept": "application/json"}
    if url.startswith("https://api.github.com/") and os.environ.get("GITHUB_TOKEN"):
        headers["authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def fetch_json(url: str):
    return json.loads(fetch(url))


def reader_text(path: pathlib.Path) -> str:
    """A file as a reader sees it: tags, scripts and backticks gone, spaces collapsed."""
    raw = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        raw = re.sub(r"<(script|style)\b.*?</\1>", " ", raw, flags=re.S | re.I)
        raw = re.sub(r"<[^>]+>", " ", raw)
        raw = html.unescape(raw)
    return re.sub(r"\s+", " ", raw.replace("`", "").replace("*", ""))


def upstream(label: str, get):
    """Read one upstream fact. A source that cannot be read is a failure, not a pass."""
    try:
        return get()
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as error:
        check(f"read {label}", False, str(error))
        return None


pages = {
    name: reader_text(DIST / name)
    for name in ("index.html", "language.html", "ecosystem.html", "cli.html", "components.html", "llms.txt")
}

# --- the language -------------------------------------------------------------
print("the language (mzizi-dev/mzizi main)")
readme = upstream("the language README", lambda: fetch(LANGUAGE_README))
if readme:
    tests = re.search(r"\b([\d,]+) tests in (\d+) suites\b", readme)
    lines = re.search(r"`compiler/src` is ([\d,]+) lines", readme)
    check("the README states a test and suite count", tests is not None)
    check("the README states compiler/src's line count", lines is not None)
    if tests:
        n, suites = tests.group(1), tests.group(2)
        check(f"index.html shows {n} tests in {suites} suites",
              f"{n} tests passing, {suites} suites" in pages["index.html"])
        for page in ("language.html", "llms.txt"):
            check(f"{page} says {n} tests in {suites} suites",
                  f"{n} tests in {suites} suites" in pages[page])
    if lines:
        check(f"index.html shows {lines.group(1)} lines in the compiler",
              f"{lines.group(1)} lines of Rust in the compiler" in pages["index.html"])

# The commit the figures cite. A newer main is not by itself drift (the figures
# may still hold), so this is a note for the freshness agent, not a failure.
head = upstream("the language's main commit", lambda: fetch_json(LANGUAGE_HEAD)["sha"])
cited = re.search(r"mzizi-dev/mzizi/commit/([0-9a-f]{7,40})", (DIST / "index.html").read_text(encoding="utf-8"))
if head and cited:
    if head.startswith(cited.group(1)):
        print(f"  [ok  ] index.html's figures cite main ({cited.group(1)})")
    else:
        notes.append(f"language main is {head[:7]}; index.html's figures cite {cited.group(1)}. "
                     "Re-run the figures (cargo test --workspace, lines in compiler/src, mz contract) and bump the commit.")

design = upstream("the language's design/ listing", lambda: fetch_json(LANGUAGE_DESIGN))
if design:
    rfcs = sorted(entry["name"] for entry in design if re.match(r"RFC-\d{4}-.*\.md$", entry["name"]))
    raw_language = (DIST / "language.html").read_text(encoding="utf-8")
    for rfc in rfcs:
        check(f"language.html links {rfc}",
              f"https://github.com/mzizi-dev/mzizi/blob/main/design/{rfc}" in raw_language)

# --- npm ---------------------------------------------------------------------
print("\nnpm (latest dist-tags)")
for package in NPM:
    latest = upstream(package, lambda: fetch_json(f"https://registry.npmjs.org/{package.replace('/', '%2f')}/latest")["version"])
    if not latest:
        continue
    short = package.split("/")[1]
    # llms.txt's dated version list names each package with its version.
    listed = re.findall(rf"{re.escape(short)} ([0-9]+\.[0-9]+\.[0-9]+)\b(?! and later)", pages["llms.txt"])
    check(f"llms.txt lists {package} at {latest}", latest in listed, f"llms.txt says {sorted(set(listed)) or 'nothing'}")
    if short == "mzizi-mcp":
        # Every "mzizi-mcp <version>" anywhere on the site is a claim about the live server.
        for name in ("index.html", "ecosystem.html", "llms.txt"):
            stale = sorted(set(re.findall(r"mzizi-mcp ([0-9]+\.[0-9]+\.[0-9]+)", pages[name])) - {latest})
            check(f"{name} names no older mzizi-mcp than {latest}", not stale, ", ".join(stale))

# --- crates.io ---------------------------------------------------------------
print("\ncrates.io (Mzizi Roots)")
# llms.txt gives the Roots crates one version, dated: "Mzizi Roots on crates.io, all 0.1.0".
crate_versions = set(re.findall(r"Mzizi Roots on crates\.io, all ([0-9]+\.[0-9]+\.[0-9]+)", pages["llms.txt"]))
for crate in CRATES:
    version = upstream(crate, lambda: fetch_json(f"https://crates.io/api/v1/crates/{crate}")["crate"]["max_version"])
    if not version:
        continue
    check(f"llms.txt names {crate} at {version}",
          re.search(rf"\b{re.escape(crate)}\b", pages["llms.txt"]) is not None and crate_versions == {version},
          f"llms.txt says {sorted(crate_versions) or 'no version'}")
    if crate in ("mzizi-ui", "mzizi-roots"):
        check(f"components.html shows {crate} at {version}", f"{version}" in pages["components.html"]
              and "not on crates.io yet" not in pages["components.html"])
        check(f"cli.html shows {crate} at {version}", f"{crate} ({version})" in pages["cli.html"]
              or f"at {version}" in pages["cli.html"])

# --- the MCP Registry --------------------------------------------------------
print("\nthe MCP Registry")
listing = upstream("the MCP Registry", lambda: fetch_json(MCP_REGISTRY))
if listing is not None:
    names = {entry["server"]["name"]: entry["server"]["version"] for entry in listing.get("servers", [])}
    check(f"{MCP_NAME} is listed", MCP_NAME in names, ", ".join(sorted(names)) or "no entries")
    check(f"llms.txt names {MCP_NAME}", MCP_NAME in pages["llms.txt"])
    for name in names:
        if name != MCP_NAME:
            check(f"the site does not name the other listing {name}",
                  all(name not in text for text in pages.values()))

if notes:
    print("\nnotes")
    for note in notes:
        print(f"  - {note}")

print()
if failures:
    print(f"DRIFT: {len(failures)} fact(s) on the site disagree with upstream")
    for failure in failures:
        print(f"  - {failure}")
    sys.exit(1)
print("The built site agrees with every upstream fact checked.")

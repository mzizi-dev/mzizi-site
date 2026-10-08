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
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

DIST = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
UA = "mzizi-site check-facts (https://github.com/mzizi-dev/mzizi-site)"

LANGUAGE_README = "https://raw.githubusercontent.com/mzizi-dev/mzizi/main/README.md"
LANGUAGE_DESIGN = "https://api.github.com/repos/mzizi-dev/mzizi/contents/design?ref=main"
LANGUAGE_HEAD = "https://api.github.com/repos/mzizi-dev/mzizi/commits/main"
LANGUAGE_CHARTER = "https://raw.githubusercontent.com/mzizi-dev/mzizi/main/CHARTER.md"
LANGUAGE_TRACKER = "https://raw.githubusercontent.com/mzizi-dev/mzizi/main/LANGUAGE-TRACKER.md"
LANGUAGE_ARMS = "https://api.github.com/repos/mzizi-dev/mzizi/contents/benchmarks/arms?ref=main"
TRACKER_LINK = "https://github.com/mzizi-dev/mzizi/blob/main/LANGUAGE-TRACKER.md"
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
API = "https://api.mzizi.dev/v1"
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


def compiler_lines() -> str:
    """compiler/src's line count at the language's main, counted in the source.

    Not read from the README: the README can lag its code (it said 12,644 at
    9a88e1d, where the code is 12,706), and the landing page's figure is from a
    fresh build, not the README. Anonymous git, so no API rate limit. Lines are
    counted as `git grep -c ''` counts them.
    """
    with tempfile.TemporaryDirectory(prefix="mzizi-lang-") as tmp:
        try:
            git = lambda *args: subprocess.run(["git", "-C", tmp, *args], check=True,
                                               capture_output=True, text=True, timeout=120).stdout
            subprocess.run(["git", "clone", "--quiet", "--depth", "1", "--filter=blob:none", "--no-checkout",
                            "https://github.com/mzizi-dev/mzizi", tmp],
                           check=True, capture_output=True, text=True, timeout=120)
            git("checkout", "--quiet", "HEAD", "--", "compiler/src")
            total = 0
            for name in filter(None, git("ls-files", "compiler/src").split("\n")):
                text = (pathlib.Path(tmp) / name).read_text(encoding="utf-8")
                total += 0 if text == "" else text.count("\n") + (0 if text.endswith("\n") else 1)
        except (subprocess.SubprocessError, OSError) as error:
            raise ValueError(f"could not count compiler/src: {error}") from error
    return f"{total:,}"


def upstream(label: str, get):
    """Read one upstream fact. A source that cannot be read is a failure, not a pass."""
    try:
        return get()
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as error:
        check(f"read {label}", False, str(error))
        return None


pages = {
    name: reader_text(DIST / name)
    for name in ("index.html", "language.html", "ecosystem.html", "cli.html", "components.html", "llms.txt",
                 ".well-known/mcp.json")
}

# --- the language -------------------------------------------------------------
print("the language (mzizi-dev/mzizi main)")
readme = upstream("the language README", lambda: fetch(LANGUAGE_README))
if readme:
    tests = re.search(r"\b([\d,]+) tests in (\d+) suites\b", readme)
    check("the README states a test and suite count", tests is not None)
    if tests:
        n, suites = tests.group(1), tests.group(2)
        check(f"index.html shows {n} tests in {suites} suites",
              f"{n} tests passing, {suites} suites" in pages["index.html"])
        for page in ("language.html", "llms.txt"):
            check(f"{page} says {n} tests in {suites} suites",
                  f"{n} tests in {suites} suites" in pages[page])
lines = upstream("the language's compiler/src", compiler_lines)
if lines:
    check(f"index.html shows {lines} lines in the compiler (counted in the source)",
          f"{lines} lines of Rust in the compiler" in pages["index.html"])

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

# The charter's version. Every page that names a charter version names this one.
charter = upstream("the language's CHARTER.md", lambda: fetch(LANGUAGE_CHARTER))
if charter:
    version = re.search(r"Mzizi Research Charter, v(\d+\.\d+)", charter)
    title = re.search(r"^# (.+)$", charter, re.M)
    check("CHARTER.md states its version", version is not None)
    if version:
        current = version.group(1)
        for name, text in pages.items():
            cited = set(re.findall(r"(?:charter|CHARTER\.md)\W{0,3}(?:\(|, )?v(\d+\.\d+)\b", text, re.I))
            check(f"{name} names no charter version but v{current}", cited <= {current},
                  ", ".join(sorted(cited - {current})))
        for name in ("language.html", "llms.txt"):
            check(f"{name} cites charter v{current}",
                  re.search(rf"(?:charter|CHARTER\.md)\W{{0,3}}(?:\(|, )?v{re.escape(current)}\b", pages[name], re.I) is not None)
    if title:
        heading = title.group(1).strip()
        check(f"llms.txt carries the charter's title, “{heading}”", heading in pages["llms.txt"])

# The tracker (owner, 2026-09-30): LANGUAGE-TRACKER.md is the one list of what
# Mzizi still needs, and every capability claim on the site comes from it. The
# site says what a program has (PRESENT) and what Mzizi has none of yet
# (MISSING). The moment a MISSING row turns ✅ upstream, or a PRESENT row is not
# on main in at least a narrow form (🟡 or ✅), that sentence is wrong and this
# fails until it is rewritten.
tracker = upstream("the language's LANGUAGE-TRACKER.md", lambda: fetch(LANGUAGE_TRACKER))
PRESENT = "In a program, Mzizi has expressions, bindings, functions, control flow and error handling"
MISSING = "no modules, standard library, text operations, maps or sets, methods on records or concurrency yet"
if tracker:
    rows = dict(re.findall(r"^\|\s*([A-Z]\d+)\s*\|[^|]*\|\s*(✅|🟡|📝|❌)\s*\|", tracker, re.M))
    # C1 expressions, C2 bindings, C3 functions, C4 control flow, C9 error handling.
    present = {"C1": "expressions", "C2": "bindings", "C3": "functions", "C4": "control flow",
               "C9": "error handling"}
    # P1 modules, P2 standard library, C6 text operations, C7 maps and sets,
    # C8 methods on records, P9 concurrency.
    named = {"P1": "modules", "P2": "standard library", "C6": "text operations", "C7": "maps or sets",
             "C8": "methods on records", "P9": "concurrency"}
    check("the tracker has every row the site's sentences name", all(r in rows for r in (*present, *named)),
          ", ".join(r for r in (*present, *named) if r not in rows))
    done = [named[r] for r in named if rows.get(r) == "✅"]
    absent = [f"{present[r]} ({r} {rows.get(r, 'missing')})" for r in present if rows.get(r) not in ("✅", "🟡")]
    for name in ("index.html", "language.html", "llms.txt"):
        says = MISSING in pages[name]
        check(f"{name} says Mzizi has {MISSING}", says)
        check(f"{name}'s list of what Mzizi lacks matches the tracker", not (says and done),
              f"the tracker marks {', '.join(done)} ✅" if done else "")
        has = PRESENT in pages[name]
        check(f"{name} says “{PRESENT}”", has)
        check(f"{name}'s list of what a program has matches the tracker", not (has and absent),
              f"the tracker does not have {', '.join(absent)} on main" if absent else "")
    for name in ("index.html", "language.html"):
        raw = (DIST / name).read_text(encoding="utf-8")
        check(f"{name} links the tracker as “What still has to be built”",
              f'href="{TRACKER_LINK}"' in raw and "What still has to be built" in pages[name])
    check("llms.txt links the tracker", TRACKER_LINK in pages["llms.txt"])
    # Lowering (P3): today a service lowers and nothing else does.
    if rows.get("P3") == "✅":
        check("the site's lowering claim matches the tracker (P3 is ✅: everything lowers)", False)
    elif rows.get("P3") == "🟡":
        for name in ("index.html", "language.html"):
            check(f"{name} says a service lowers and no component does (tracker P3 🟡)",
                  "local Rust + axum package" in pages[name] and "No component lowers yet" in pages[name])

# The benchmark arms: every directory in benchmarks/arms/ is an arm that
# exists; the /language table says "exists" for exactly those, and "not added
# yet" for the rest, and the landing page's React arm follows the same listing.
arms = upstream("the language's benchmarks/arms/ listing", lambda: fetch_json(LANGUAGE_ARMS))
if arms:
    present = {entry["name"] for entry in arms if entry["type"] == "dir"}
    raw_language = (DIST / "language.html").read_text(encoding="utf-8")
    # Astro adds data-astro-cid-* attributes to scoped elements, so match tags loosely.
    table = dict(re.findall(r'<th scope="row"[^>]*><code[^>]*>([^<]+)</code></th>.*?<td class="state"[^>]*>([^<]+)</td>',
                            raw_language, re.S))
    check("language.html has an arms table", bool(table))
    for arm in sorted(present):
        check(f"language.html lists the {arm} arm as existing", table.get(arm, "").startswith("exists"),
              table.get(arm, "missing"))
    for arm, state in sorted(table.items()):
        if arm not in present:
            check(f"language.html says the {arm} arm is not added yet", state.startswith("not added"), state)
    react = re.search(r"TypeScript · React\s*(exists, never run|exists|not added yet)", pages["index.html"])
    check("index.html's React arm state follows benchmarks/arms/",
          react is not None and (react.group(1).startswith("exists") == ("react" in present)),
          react.group(1) if react else "missing")

# Progress toward M1 (owner, 2026-10-07). The landing page and /language list
# the pull requests that are in progress, labelled as not available. One that
# has merged or closed is no longer in progress: move it (to "Landing on
# staging", or "On main today" once released) in src/lib/progress.ts and
# llms.txt. A pull request that merges into main and turns a tracker row ✅
# also changes what the site says Mzizi lacks (the tracker check above).
print("\nprogress toward M1 (open pull requests)")
PULL = r'https://github\.com/mzizi-dev/mzizi/pull/(\d+)'
raw_index = (DIST / "index.html").read_text(encoding="utf-8")
column = raw_index.split('id="toward-m1"', 1)
check("index.html has the “In progress toward M1” column (id toward-m1)", len(column) == 2)
listed = sorted({int(n) for n in re.findall(r'href="' + PULL + '"', column[1].split("</ul>", 1)[0])}) if len(column) == 2 else []
# llms.txt carries the same list by hand, under its "In progress toward M1" item.
llms_raw = (DIST / "llms.txt").read_text(encoding="utf-8")
llms_block = re.search(r"\*\*In progress toward M1, not available:\*\*(.*?)\n- \*\*", llms_raw, re.S)
check("llms.txt has its “In progress toward M1” list", llms_block is not None)
llms_listed = sorted({int(n) for n in re.findall(PULL, llms_block.group(1))}) if llms_block else []
check("llms.txt lists the same pull requests in progress as index.html", llms_listed == listed,
      f"llms.txt {llms_listed}, index.html {listed}")
check("index.html's “In progress toward M1” column links the tracking issue #69",
      len(column) == 2 and 'href="https://github.com/mzizi-dev/mzizi/issues/69"' in column[1].split("</ul>", 1)[0])
for number in sorted(set(listed) | set(llms_listed)):
    state = upstream(f"mzizi-dev/mzizi#{number}",
                     lambda: fetch_json(f"https://api.github.com/repos/mzizi-dev/mzizi/pulls/{number}"))
    if state:
        merged = state.get("merged_at")
        is_open = state["state"] == "open"
        check(f"#{number} is still open, as the site says", is_open,
              "" if is_open else
              f"merged into {state['base']['ref']} on {merged[:10]}: move it out of “In progress”"
              if merged else "closed: take it out of “In progress”")
# Every open pull request that works toward M1 (its body refers to #69) is listed.
# A release pull request (staging to main) is not work toward M1, though its
# body quotes the entries that do: what it carries is the staging column.
open_prs = upstream("the language's open pull requests",
                    lambda: fetch_json("https://api.github.com/repos/mzizi-dev/mzizi/pulls?state=open&per_page=100"))
if open_prs is not None:
    for pr in open_prs:
        if pr["base"]["ref"] == "main" and pr["title"].startswith("chore(release)"):
            print(f"  [note] #{pr['number']} is a release pull request ({pr['title']}), not listed in progress")
            continue
        if re.search(r"(?<![\w/])#69\b|issues/69\b", pr.get("body") or ""):
            check(f"#{pr['number']} (open, refs #69) is listed in progress toward M1",
                  pr["number"] in listed, pr["title"])
# Staging released: RFC-0013 reaching main's design/ means the "Landing on
# staging" column has shipped. Move its items to "On main today", and re-read
# the tracker (C1–C5 and C10 may be ✅, which changes what the site says Mzizi
# lacks).
if design and any(entry["name"].startswith("RFC-0013") for entry in design):
    hits = [name for name in pages
            if "mzizi/blob/staging/design/RFC-0013" in (DIST / name).read_text(encoding="utf-8")
            or re.search(r"RFC-0013[^.]{0,200}\bnot yet (on|released to) main\b", pages[name], re.I)]
    check("no page still places RFC-0013 on staging (it is in main's design/)", not hits, ", ".join(hits))
# mz run reaching main (tracker C10 ✅): no page may still say it is not there.
if tracker and rows.get("C10") == "✅":
    hits = [name for name, text in pages.items()
            if re.search(r"\bmz run\b[^.]{0,120}(\bnot (yet )?(on|released to) main\b|\bon (the )?staging\b)|\bno mz run\b",
                         text, re.I)]
    check("no page says mz run is not on main (tracker C10 is ✅)", not hits, ", ".join(hits))
# Tracker rows C1–C5, C9 and C10 read ✅ on main (#92): a page that still says the
# tracker marks them 🟡 is stale, and so is the "Landing on staging" column if it
# lists them as waiting for a release.
if tracker and all(rows.get(r) == "✅" for r in ("C1", "C2", "C3", "C4", "C5", "C9", "C10")):
    hits = [name for name, text in pages.items()
            if re.search(r"still (marks|reads?) (those rows|C1–C5|C1–C4)[^.]{0,80}🟡|rows \(C1–C5, C9, C10\) 🟡", text)]
    check("no page says the tracker still marks C1–C5, C9 and C10 🟡 (they are ✅ on main)", not hits, ", ".join(hits))

# The skill pages carry @nyuchi/mzizi-skills as /v1/skills serves it. Language
# facts in them that went stale upstream are the skills-freshness agent's to
# fix, not this site's, so they are notes here, not failures.
skill_stale = re.compile(r"\bnothing lowers yet\b|\bRFC is being written\b|(?:charter|CHARTER\.md)\W{0,3}(?:\(|, )?v0\.[0-3]\b", re.I)
skill_pages = sorted((DIST / "skills").glob("*.html")) if (DIST / "skills").is_dir() else []
lagging = [p.name for p in skill_pages if skill_stale.search(reader_text(p))]
if lagging:
    notes.append(f"skill pages still carry pre-62a0f32 language facts ({', '.join(lagging)}): "
                 "@nyuchi/mzizi-skills lags the language; tell the skills-freshness agent.")

# --- npm ---------------------------------------------------------------------
print("\nnpm (latest dist-tags)")
npm_latest: dict[str, str] = {}
for package in NPM:
    latest = upstream(package, lambda: fetch_json(f"https://registry.npmjs.org/{package.replace('/', '%2f')}/latest")["version"])
    if not latest:
        continue
    npm_latest[package] = latest
    short = package.split("/")[1]
    # llms.txt's dated version list names each package with its version.
    listed = re.findall(rf"{re.escape(short)} ([0-9]+\.[0-9]+\.[0-9]+)\b(?! and later)", pages["llms.txt"])
    check(f"llms.txt lists {package} at {latest}", latest in listed, f"llms.txt says {sorted(set(listed)) or 'nothing'}")
    if short == "mzizi-mcp":
        # Every "mzizi-mcp <version>" anywhere on the site is a claim about the live server.
        for name in ("index.html", "ecosystem.html", "llms.txt", ".well-known/mcp.json"):
            stale = sorted(set(re.findall(r"mzizi-mcp ([0-9]+\.[0-9]+\.[0-9]+)", pages[name])) - {latest})
            check(f"{name} names no older mzizi-mcp than {latest}", not stale, ", ".join(stale))

# --- crates.io ---------------------------------------------------------------
print("\ncrates.io (Mzizi Roots)")
# llms.txt gives the Roots crates one version, dated: "Mzizi Roots on crates.io, all 0.1.0".
published: dict[str, str] = {}
crate_versions = set(re.findall(r"Mzizi Roots on crates\.io, all ([0-9]+\.[0-9]+\.[0-9]+)", pages["llms.txt"]))
for crate in CRATES:
    version = upstream(crate, lambda: fetch_json(f"https://crates.io/api/v1/crates/{crate}")["crate"]["max_version"])
    if not version:
        continue
    check(f"llms.txt names {crate} at {version}",
          re.search(rf"\b{re.escape(crate)}\b", pages["llms.txt"]) is not None and crate_versions == {version},
          f"llms.txt says {sorted(crate_versions) or 'no version'}")
    published[crate] = version
    if crate == "mzizi-roots":
        # /ecosystem's registry card gives the ten crates one version, read at build time.
        stated_eco = set(re.findall(r"ten crates on crates\.io at ([0-9]+\.[0-9]+\.[0-9]+)", pages["ecosystem.html"]))
        check(f"ecosystem.html names the Roots crates at {version}", stated_eco == {version},
              f"ecosystem.html says {sorted(stated_eco) or 'no version'}")
    if crate in ("mzizi-ui", "mzizi-brand", "mzizi-roots"):
        check(f"components.html shows {crate} at {version}", f"{version}" in pages["components.html"]
              and "not on crates.io yet" not in pages["components.html"])
        check(f"cli.html shows {crate} at {version}", f"{crate} ({version})" in pages["cli.html"]
              or f"at {version}" in pages["cli.html"])

# --- the Rust documents (api.mzizi.dev /v1/rs/<name>) -------------------------
# Every component in the Roots list must lead its page with Rust and name the
# crate its own document names. The crate differs by node (mzizi-ui for the
# primitives, mzizi-brand for the brand components), so a page that names one
# crate for all of them has drifted from the gateway's registry pin.
print("\nthe Rust documents (api.mzizi.dev /v1/rs/<name>)")
raw_components = (DIST / "components.html").read_text(encoding="utf-8")
roots_list = re.search(r'<ul class="roots-list">(.*?)</ul>', raw_components, re.S)
check("components.html has a Roots list", roots_list is not None)
roots = re.findall(r'href="/components/([^"]+)"', roots_list.group(1)) if roots_list else []
named: dict[str, list[str]] = {}
for name in roots:
    document = upstream(f"/v1/rs/{name}", lambda: fetch_json(f"{API}/rs/{name}"))
    if not document:
        continue
    crate = document["crate"]["name"]
    named.setdefault(crate, []).append(name)
    raw_page = (DIST / "components" / f"{name}.html").read_text(encoding="utf-8")
    rust_at, react_at = raw_page.find('class="impl impl-rust"'), raw_page.find('class="impl impl-react"')
    check(f"components/{name}.html leads with Rust and names {crate}",
          0 <= rust_at < react_at and f"The API names the crate {crate}" in reader_text(DIST / "components" / f"{name}.html"))
for crate, components in sorted(named.items()):
    print(f"  [note] {crate}: {len(components)} components")
    if crate not in published:
        version = upstream(crate, lambda: fetch_json(f"https://crates.io/api/v1/crates/{crate}")["crate"]["max_version"])
        check(f"{crate}, named by /v1/rs, is in this script's CRATES list", False,
              f"on crates.io at {version}" if version else "")
        if version:
            published[crate] = version

# While every crate the site could name is on crates.io, no page may say one is
# not. The pages ask crates.io at build time, so this catches wording typed in
# by hand that the build cannot correct.
not_published = re.compile(r"not on crates\.io( yet)?|(while|until) (the|a) crate is (unpublished|published)|crate is unpublished", re.I)
if published and all(crate in published for crate in (*CRATES, *named)):
    built_text = [p for p in DIST.rglob("*") if p.suffix in (".html", ".txt") and "pagefind" not in p.parts]
    hits = [str(p.relative_to(DIST)) for p in built_text if not_published.search(reader_text(p))]
    check("no page says a Roots crate is not on crates.io", not hits, ", ".join(hits[:5]))

# --- the MCP Registry --------------------------------------------------------
print("\nthe MCP Registry")
listing = upstream("the MCP Registry", lambda: fetch_json(MCP_REGISTRY))
if listing is not None:
    # The search returns every published version of a server; the one marked
    # isLatest is the listing a client installs.
    names: dict[str, str] = {}
    for entry in listing.get("servers", []):
        official = entry.get("_meta", {}).get("io.modelcontextprotocol.registry/official", {})
        if official.get("isLatest", True) or entry["server"]["name"] not in names:
            names[entry["server"]["name"]] = entry["server"]["version"]
    check(f"{MCP_NAME} is listed", MCP_NAME in names, ", ".join(sorted(names)) or "no entries")
    check(f"llms.txt names {MCP_NAME}", MCP_NAME in pages["llms.txt"])
    # The Registry entry can trail npm. llms.txt says so, dated, while it does
    # ("still lists the 0.10.1 release"), and must stop saying so once it catches up.
    listed_version = names.get(MCP_NAME)
    trailing = re.findall(r"still lists the ([0-9]+\.[0-9]+\.[0-9]+) release", pages["llms.txt"])
    npm_mcp = npm_latest.get("@nyuchi/mzizi-mcp")
    if listed_version and npm_mcp:
        if listed_version == npm_mcp:
            check(f"llms.txt does not say the Registry trails npm (both at {npm_mcp})", not trailing,
                  ", ".join(trailing))
        else:
            check(f"llms.txt says the Registry still lists {listed_version} (npm is at {npm_mcp})",
                  trailing == [listed_version], ", ".join(trailing) or "it says nothing")
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

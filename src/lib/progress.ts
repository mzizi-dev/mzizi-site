/**
 * Where the language stands: what is on `main`, what is on `staging` waiting
 * for the next release, and what is still in open pull requests toward M2.
 *
 * Shared by the landing page's status panel and `/language`, so the two never
 * disagree. `public/llms.txt` says the same in its own words.
 *
 * Sources, all in `mzizi-dev/mzizi`, read on 2026-10-20:
 * - "On main": the release pull request #120 ("chore(release): staging to main"),
 *   merged as 6f7b096 at 11:11 UTC on 20 October, and tagged v0.9.0 (the GitHub
 *   release was published at 11:13 UTC). It carries #112 (the C6 review
 *   follow-ups, issue #107), #111 (RFC-0014, a draft), #113 and #116 (the rust-toolchain
 *   pins), #115 (no UI framework's name in the README or the charter) and #119 (the
 *   dated changelog). Read from `LANGUAGE-TRACKER.md`, `README.md`,
 *   `CHANGELOG.md`, `design/` and `compiler/` at 6f7b096. Measured there in a
 *   fresh worktree with a private CARGO_TARGET_DIR: `cargo test --workspace`
 *   passes 765 tests in 29 suites, 634 of them in the compiler crate;
 *   `mz harness definition` gives 197 entries, 79 distinct diagnostic codes (53
 *   `MZ09xx` and 26 shared) and 49 pending codes; `compiler/src` is 33,518 lines
 *   (`git ls-files compiler/src`, counted as scripts/check-facts.py counts them).
 *   No file under `examples/` changed since 1d5e578, so the program outputs below
 *   are still the ones `mz run` printed.
 * - "Landing on staging": nothing. `staging` is at a0bb6b0 and `main` at 6f7b096,
 *   and `git diff --quiet origin/main origin/staging` is clean: the release
 *   commit brings main to staging's tree.
 * - "In progress": `GET /repos/mzizi-dev/mzizi/pulls?state=open` returned one pull
 *   request on 2026-10-20, #118, an RFC-0015 draft against staging, which does not
 *   refer to #110 or #69 and is not toward M2, so it is not listed here. No open pull
 *   request implements Tier 2. When one opens toward M2, list it here and in
 *   llms.txt (scripts/check-facts.py fails until you do); when one merges, move it.
 * - The 8 October release (1d5e578, v0.8.0) is kept below as history.
 */

export const LANG = "https://github.com/mzizi-dev/mzizi";
export const PROGRESS_DATE = "2026-10-20";
// The release, and the language commits this file was written from. `main` and
// `staging` hold the same tree, so nothing is waiting.
export const RELEASE = "20 October";
export const MAIN_COMMIT = "6f7b096";
// The release tag main-release.yml created for MAIN_COMMIT (GitHub release v0.9.0).
export const RELEASE_TAG = "v0.9.0";
export const RELEASE_TAG_HREF = `${LANG}/releases/tag/v0.9.0`;
// The commit staging was at when the release was cut; main carries its tree.
export const RELEASED_STAGING = "a0bb6b0";
export const STAGING_COMMIT = "a0bb6b0";

export type Link = { href: string; label: string };
export type Item = { text: string; links?: Link[] };

const pr = (n: number): Link => ({ href: `${LANG}/pull/${n}`, label: `#${n}` });

export const M1_ISSUE: Link = { href: `${LANG}/issues/69`, label: "#69" };
export const M2_ISSUE: Link = { href: `${LANG}/issues/110`, label: "#110" };
export const RELEASE_PR: Link = pr(109);

export const onMain: Item[] = [
  {
    text: "Released as v0.9.0 on 20 October: main-release.yml tagged 6f7b096 after CI passed, and created the GitHub release. The release notes are the CHANGELOG.md entries since the last main release, plus the merged pull requests. It carries the C6 review follow-ups (#112, for issue #107): an option return the signature cannot build reports MZ0919 only; MZ0962 names another language's spelling as written; and the int minimum, -9223372036854775808, is read as a literal under a unary minus (RFC-0013 §3.1). It carries RFC-0014, the Tier 2 design, as a draft (#111): modules, the standard library and Rust crate interop are designed there and not built. It also carries the rust-toolchain pins (#113, #116), the README and charter without a UI framework's name (#115), and the dated changelog (#119).",
    links: [
      { href: RELEASE_TAG_HREF, label: "v0.9.0" },
      pr(120),
      pr(112),
      pr(111),
      pr(113),
      pr(115),
      pr(116),
      pr(119),
    ],
  },
  {
    text: "Released as v0.8.0 on 8 October: main-release.yml tagged 1d5e578 after CI passed, and created the GitHub release. The release notes are the CHANGELOG.md entries since the last main release, plus the merged pull requests. It carries the rest of text operations (#106), the tracker and README prose (#105) and the release prep (#108).",
    links: [
      { href: `${LANG}/releases/tag/v0.8.0`, label: "v0.8.0" },
      RELEASE_PR,
      pr(105),
      pr(106),
      pr(108),
    ],
  },
  {
    text: 'Text operations in a program (C6, RFC-0013 §10), complete: length, contains, starts_with, ends_with, trim, to_upper, to_lower, replace and repeat; and the methods that return an option or a list, s[i] and s.slice(a, to = b) and s.find(t) (option), s.split(sep) and s.chars() (list), and s.parse_int() and s.parse_float() (option). split("") is MZ0915, and an empty separator at run time traps with MZ0991 (exit 101). Built-in methods with tests meet C6 (owner, 2026-10-08; RFC-0013 §20 Q20). examples/text.mz runs through mz run in CI against text.expected.',
    links: [pr(98), pr(106)],
  },
  {
    text: 'M1, a language that computes, is met: every Tier 1 row of the tracker (C1–C10) is ✅ on main, and the tracker says so in its milestones. Modules (P1), the standard library (P2) and concurrency (P9) are ❌; generics and interfaces (P12) come after M1. A row is ✅ only when its "Done when" test is on main and green.',
    links: [M1_ISSUE, pr(92), pr(95), pr(97), pr(103)],
  },
  {
    text: "Records with methods (C8, RFC-0013 §11): in a program, a record with fields, fn methods that read self, an always contract checked at each construction, with and field assignment, built by field name and printed as point(x = 3.0, y = 4.0). Shipped in the third release with C7; examples/records.mz runs through mz run in CI against records.expected.",
    links: [pr(101), pr(102)],
  },
  {
    text: "Collections (C7, RFC-0013 §9): list(T), map(K, V) and set(K) in a program, with bracket literals, indexing that returns an option read with otherwise, in, for each over a list, the methods and the eight named folds. Maps and sets iterate in key order. examples/collections.mz runs through mz run in CI against collections.expected.",
    links: [pr(99)],
  },
  {
    text: "Programs that compute (RFC-0013, released to main on 8 October in #91). A program file kind with fn main and print; functions with typed parameters and returns, calls and recursion; let, var and assignment; int, float, bool and text expressions, the numeric methods and interpolation; when, else when, match (exhaustive, and usable as a value), for each over a range, while, break, continue and early return; enums, with columns; and errors as values: result(T, E), return error(e), a prefix try that propagates, and a match on a result. Integer overflow and division by zero stop the program (MZ0991, exit 101); a float never traps.",
    links: [pr(80), pr(83), pr(89), pr(87), pr(91)],
  },
  {
    text: "The language harness, the spine of the language: every built feature of a program registers an entry in compiler/src/harness.rs, and mz harness version, definition and entry print the definition as JSON (197 entries, 79 distinct diagnostic codes, 53 MZ09xx and 26 shared, at 6f7b096; 49 codes pending). `not` sits at its own precedence level (#100). Enforced by tests: every code the compiler can emit has an entry or is on the pending list, every trigger still raises its code with a declared fix kind, every example still checks, and every program example still prints its stated output. Written by hand and not compared with the checker: each code's say text and each feature's teaching text. component and service are registered at kind level only. The plugin host and the generated skills are not built; tracker row H1 is 🟡.",
    links: [
      pr(88),
      pr(93),
      pr(100),
      {
        href: `${LANG}/blob/main/design/RFC-0012-harness.md`,
        label: "RFC-0012",
      },
    ],
  },
  {
    text: "mz run, which checks a program, lowers it to a Rust package with no dependencies, builds it with Cargo and runs it, exiting with the program's status; mz build writes the same package. CI runs every example program (hello, fib, numbers, control, errors, collections, records, text) and compares its output with a committed .expected file.",
    links: [pr(80)],
  },
  {
    text: "RFC-0013, the core language: one RFC for all of Tier 1 (C1–C10), with the amendments from the language survey. Tier 1 is designed in RFC-0013; the rows above are its built parts. The tracker split C8 into records and methods (M1) and P12, generics and interfaces, after M1 (#95).",
    links: [
      {
        href: `${LANG}/blob/main/design/RFC-0013-core-language.md`,
        label: "RFC-0013",
      },
      pr(76),
      pr(81),
      pr(95),
    ],
  },
  {
    text: "UI components: enums with data columns, records, list and option types, a view, and contracts that mz contract evaluates. Nine primitives are written in Mzizi.",
  },
  {
    text: "One kind of backend program: a service with HTTP routes and handlers. mz contract runs it in process; mz build lowers it to a local Rust + axum package, which CI compiles, tests and serves.",
  },
  {
    text: "The toolchain: mz check (with --agent, NDJSON diagnostics), mz fix, mz contract, mz outline, mz ir and mz hash, mz build (a service or a program), mz run and mz harness. 765 tests in 29 suites in the workspace, 634 of them in the compiler crate, at 6f7b096.",
  },
  {
    text: "A performance suite against hand-written Rust (benchmarks/perf): four programs, each with a Rust reference built with and without overflow checks. CI checks only that all three print the same output; no timing is gated or committed, and no overflow check is removed yet.",
    links: [pr(85)],
  },
  {
    text: "Also in the 8 October releases: a survey of the top 10 languages as design input (nothing in it is implemented or measured), release notes generated from CHANGELOG.md, a pre-commit hook that asks for a changelog entry, and a CLAUDE.md. Tooling and docs, not the language.",
    links: [
      {
        href: `${LANG}/blob/main/design/LANGUAGE-SURVEY.md`,
        label: "design/LANGUAGE-SURVEY.md",
      },
      pr(82),
      pr(86),
      pr(77),
    ],
  },
  {
    text: "From the 7 October releases: blocks nest at most 64 deep (MZ0411, where deep nesting used to crash mz), robustness tests, no unsafe code in the compiler, and match in a view is MZ0410.",
    links: [pr(72), pr(79)],
  },
];

export const onStaging: Item[] = [
  {
    text: "Nothing is waiting. staging (a0bb6b0) and main (6f7b096) hold the same tree, so every merged change is on main. The next pull request to staging will be the first thing listed here.",
  },
];

export const inProgress: Item[] = [
  {
    text: "M2, a working programming language (Tier 1 plus P1–P6 ✅ on main), has its own tracking issue, #110, opened on 9 October. M1 (#69) is met. M2 is not reached, so Mzizi is not yet called a working programming language.",
    links: [M2_ISSUE],
  },
  {
    text: "Still to build for M2, with no pull request open on 20 October: modules and imports across files (P1), and the standard library (P2), which the public suites wait on. The tracker has both as ❌. RFC-0014 is their draft design, on main; nothing in it is implemented. Rust crate interop (P6) and errors mapped back to .mz (P5) are also M2 rows; neither has a pull request open.",
  },
];

// Owner decisions of 2026-10-07, from #69's comments.
export const decisions: string[] = [
  "One RFC per tier. Tier 1 is RFC-0013; Tier 2 and Tier 3 get their own.",
  "mz run is to compile a program to Rust and run it: the lowered Rust is the source of truth.",
  "Methods on records now; generics later, after M1.",
  "Integer overflow checks stay in every build. The compiler removes a check only where it proves the operation cannot overflow, and each removal is visible in the lowered Rust and tested.",
  "A performance suite against hand-written Rust, with its results kept in a private benchmarks repository.",
  "Release notes come from the changelog, and every pull request carries a changelog entry.",
];
export const DECISIONS_HREF = `${LANG}/issues/69#issuecomment-6048068655`;
export const DECISIONS_FIRST_HREF = `${LANG}/issues/69#issuecomment-6041248170`;

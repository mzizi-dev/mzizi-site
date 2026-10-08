/**
 * Where the language stands: what is on `main`, what is on `staging` waiting
 * for the next release, and what is still in open pull requests toward M1.
 *
 * Shared by the landing page's status panel and `/language`, so the two never
 * disagree. `public/llms.txt` says the same in its own words.
 *
 * Sources, all in `mzizi-dev/mzizi`, read on 2026-10-08:
 * - "On main": the release pull request #109 ("chore(release): staging to main"),
 *   merged as 1d5e578. It carries #105 (the tracker and README prose), #106 (the
 *   rest of C6, text operations) and #108 (release prep). Read from
 *   `LANGUAGE-TRACKER.md`, `README.md`, `CHANGELOG.md` and `examples/` at 1d5e578.
 *   Measured there in a fresh clone, with a private CARGO_TARGET_DIR:
 *   `cargo test --workspace` gives 760 tests in 27 suites, 629 of them in the
 *   compiler crate, all passing; `mz harness definition` gives 197 entries, 80
 *   diagnostic codes (53 `MZ09xx` and 27 shared) and 49 pending codes;
 *   `compiler/src` is 33,438 lines (`git ls-files compiler/src`, counted as
 *   scripts/check-facts.py counts them); `mz run` prints the `.expected` file of
 *   each example program, including `text`. `main-release.yml` tagged 1d5e578 as
 *   v0.8.0 after CI passed (GitHub release at releases/tag/v0.8.0).
 * - "Landing on staging": nothing. `staging` and `main` are both at 1d5e578, and
 *   `git diff 1d5e578 origin/staging` is empty.
 * - "In progress": `GET /repos/mzizi-dev/mzizi/pulls?state=open` returned no
 *   pull requests on 2026-10-08. M1 is met on `main`, so the column names the
 *   tracking issue and the work that follows it, with no pull request yet.
 *   When one opens, list it here and in llms.txt (scripts/check-facts.py fails
 *   until you do); when one merges, move it.
 */

export const LANG = "https://github.com/mzizi-dev/mzizi";
export const PROGRESS_DATE = "2026-10-08";
// The release, and the language commits this file was written from. `main` and
// `staging` are both at 1d5e578, so nothing is waiting.
export const RELEASE = "8 October";
export const MAIN_COMMIT = "1d5e578";
// The release tag main-release.yml created for MAIN_COMMIT (GitHub release v0.8.0).
export const RELEASE_TAG = "v0.8.0";
export const RELEASE_TAG_HREF = `${LANG}/releases/tag/v0.8.0`;
export const RELEASED_STAGING = "1d5e578";
export const STAGING_COMMIT = "1d5e578";

export type Link = { href: string; label: string };
export type Item = { text: string; links?: Link[] };

const pr = (n: number): Link => ({ href: `${LANG}/pull/${n}`, label: `#${n}` });

export const M1_ISSUE: Link = { href: `${LANG}/issues/69`, label: "#69" };
export const RELEASE_PR: Link = pr(109);

export const onMain: Item[] = [
  {
    text: "Released as v0.8.0: main-release.yml tagged 1d5e578 after CI passed, and created the GitHub release. The release notes are the CHANGELOG.md entries since the last main release, plus the merged pull requests. It carries the rest of text operations (#106), the tracker and README prose (#105) and the release prep (#108).",
    links: [
      { href: RELEASE_TAG_HREF, label: "v0.8.0" },
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
    text: "The language harness, the spine of the language: every built feature of a program registers an entry in compiler/src/harness.rs, and mz harness version, definition and entry print the definition as JSON (197 entries, 80 of them diagnostic codes, 53 MZ09xx and 27 shared, at 1d5e578; 49 codes pending). `not` sits at its own precedence level (#100). Enforced by tests: every code the compiler can emit has an entry or is on the pending list, every trigger still raises its code with a declared fix kind, every example still checks, and every program example still prints its stated output. Written by hand and not compared with the checker: each code's say text and each feature's teaching text. component and service are registered at kind level only. The plugin host and the generated skills are not built; tracker row H1 is 🟡.",
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
    text: "The toolchain: mz check (with --agent, NDJSON diagnostics), mz fix, mz contract, mz outline, mz ir and mz hash, mz build (a service or a program), mz run and mz harness. 760 tests in 27 suites in the workspace, 629 of them in the compiler crate.",
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
    text: "Nothing is waiting. staging (1d5e578) and main (1d5e578) hold the same tree, so every merged change is on main. The next pull request to staging will be the first thing listed here.",
  },
];

export const inProgress: Item[] = [
  {
    text: "M2, a working programming language (Tier 1 plus P1–P6 ✅ on main). M1 was the tracking issue's goal and is met; the same issue, #69, tracks the work toward M2. M2 is not reached, so Mzizi is not yet called a working programming language.",
    links: [M1_ISSUE],
  },
  {
    text: "Still to build for M2, with no pull request open on 8 October: modules and imports across files (P1), and the standard library (P2), which the public suites wait on. The tracker has both as ❌. Rust crate interop (P6) and errors mapped back to .mz (P5) are also M2 rows; neither has a pull request open.",
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

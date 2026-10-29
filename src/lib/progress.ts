/**
 * Where the language stands: what is on `main`, what is on `staging` waiting
 * for the next release, and what is still in open pull requests toward M2.
 *
 * Shared by the landing page's status panel and `/language`, so the two never
 * disagree. `public/llms.txt` says the same in its own words.
 *
 * Sources, all in `mzizi-dev/mzizi`, read on 2026-10-29:
 * - "On main": the release pull request #140 ("chore(release): staging to main,
 *   2026-10-29"), merged as 2b36c8f and tagged v0.12.0 (published 06:14 UTC on
 *   29 October). Since the site's last pin (6f7b096, v0.9.0, 20 October) there
 *   were three release pull requests: #125 (v0.10.0, 21 October, CI only), #128
 *   (v0.11.0, 21 October, docs only: the 20 October target decision) and #140
 *   (v0.12.0, 29 October: #134, the HOST and slim-profile change to `mz build`'s
 *   services with the tokio pin, and the pilot 3 and 4 write-ups, #138 and #139).
 *   Read from `LANGUAGE-TRACKER.md`, `README.md`, `CHANGELOG.md`, `design/`,
 *   `compiler/` and `benchmarks/results/` at 2b36c8f. No tracker mark changed
 *   since 6f7b096 (the status columns are identical); row P11's text did.
 *   Measured at 2b36c8f in a fresh clone with a private CARGO_TARGET_DIR, on
 *   macOS: `cargo test --workspace --no-fail-fast` ran 767 tests in 35 suites
 *   (cargo's result blocks; 27 of them hold tests): 766 passed and 1 failed,
 *   `an_index_out_of_range_an_int_sum_overflow_and_a_range_too_long_trap_with_101`,
 *   whose `range_huge` case exited 137 (killed) where it expects 101, on a 16 GB
 *   laptop; repeated twice, not investigated further. The upstream README, which
 *   lags, still says 765 in 29 suites. `mz harness definition` gives 197 entries,
 *   79 distinct diagnostic codes (53 `MZ09xx` and 26 shared) and 49 pending codes,
 *   all unchanged. `compiler/src` is 33,540 lines (every `.rs` file, counted as
 *   scripts/check-facts.py counts them). No file under `examples/` or
 *   `primitives/` changed since 6f7b096, and the tests that compare `mz run` with
 *   each `.expected` file passed, so the program outputs below are unchanged.
 * - "Landing on staging": nothing. `staging` is at 99fa985 (#139) and `main` at
 *   2b36c8f, and a diff of the two trees is empty.
 * - "In progress": five pull requests were open on 2026-10-29, all against
 *   staging: #118 (RFC-0015, a draft), #123 (RFC-0016, a draft), #129 (a `match`
 *   in a service handler is one MZ0410), #130 (a charter wording) and #131
 *   (portal docs). None refers to #110 or #69 and none is toward M2, so none is
 *   listed with a link here (scripts/check-facts.py fails for an open one that
 *   does). When one opens toward M2, list it here and in llms.txt; when one
 *   merges, move it.
 * - The 20 October (v0.9.0, 6f7b096) and 8 October (v0.8.0, 1d5e578) releases are
 *   kept below as history.
 */

export const LANG = "https://github.com/mzizi-dev/mzizi";
export const PROGRESS_DATE = "2026-10-29";
// The release, and the language commits this file was written from. `main` and
// `staging` hold the same tree, so nothing is waiting.
export const RELEASE = "29 October";
export const MAIN_COMMIT = "2b36c8f";
// The release tag main-release.yml created for MAIN_COMMIT (the v0.12.0 release).
export const RELEASE_TAG = "v0.12.0";
export const RELEASE_TAG_HREF = `${LANG}/releases/tag/v0.12.0`;
// The release pull request, staging to main.
export const RELEASE_PR_NUMBER = 140;
// staging's tip (#139); main carries its tree.
export const RELEASED_STAGING = "99fa985";
export const STAGING_COMMIT = "99fa985";

export type Link = { href: string; label: string };
export type Item = { text: string; links?: Link[] };

const pr = (n: number): Link => ({ href: `${LANG}/pull/${n}`, label: `#${n}` });

export const M1_ISSUE: Link = { href: `${LANG}/issues/69`, label: "#69" };
export const M2_ISSUE: Link = { href: `${LANG}/issues/110`, label: "#110" };
export const RELEASE_PR: Link = pr(109);

export const onMain: Item[] = [
  {
    text: "Released as v0.12.0 on 29 October: main-release.yml tagged 2b36c8f after CI passed. A service that mz build lowers now reads HOST as well as PORT (default 127.0.0.1, as before; a container sets 0.0.0.0, and a value that is not an IP address stops the service with exit 1), its Cargo.toml carries a slim release profile (lto, codegen-units = 1, panic = abort, strip, overflow-checks), and its tokio pin moves to 1.53.3 for RUSTSEC-2026-0386 (#134, fixing #132, #133 and #136). The size and memory figures in the changelog measure Rust's output through Mzizi's lowering, not a Mzizi advantage. It also publishes the write-ups of pilots 3 and 4 (#138, #139); both sat at the ceiling and separated no arms, and neither is the kill-criterion run.",
    links: [
      { href: RELEASE_TAG_HREF, label: "v0.12.0" },
      pr(140),
      pr(134),
      pr(138),
      pr(139),
    ],
  },
  {
    text: "Released as v0.11.0 and v0.10.0 on 21 October: documentation and CI only, no compiler change. v0.11.0 carries the 20 October target decision into LANGUAGE-TRACKER.md row P11 and design/ROADMAP.md: three targets (Cloudflare Workers, containers on any OCI host, bare metal), with RFC-0016 (#123, a draft) approved as design only; the build waits for the Phase 0 gate and no container or Workers target exists. It also records squash merging through the merge queue. v0.10.0 makes CI report on merge queue runs.",
    links: [
      { href: `${LANG}/releases/tag/v0.11.0`, label: "v0.11.0" },
      pr(128),
      pr(121),
      pr(126),
      { href: `${LANG}/releases/tag/v0.10.0`, label: "v0.10.0" },
      pr(125),
      pr(124),
    ],
  },
  {
    text: "Released as v0.9.0 on 20 October: main-release.yml tagged 6f7b096 after CI passed. It carries the C6 review follow-ups (#112, for issue #107): an option return the signature cannot build reports MZ0919 only; MZ0962 names another language's spelling as written; and the int minimum, -9223372036854775808, is read as a literal under a unary minus (RFC-0013 §3.1). It carries RFC-0014, the Tier 2 design, as a draft (#111): modules, the standard library and Rust crate interop are designed there and not built. It also carries the rust-toolchain pins (#113, #116), the README and charter without a UI framework's name (#115), and the dated changelog (#119).",
    links: [
      { href: `${LANG}/releases/tag/v0.9.0`, label: "v0.9.0" },
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
    text: "The language harness, the spine of the language: every built feature of a program registers an entry in compiler/src/harness.rs, and mz harness version, definition and entry print the definition as JSON (197 entries, 79 distinct diagnostic codes, 53 MZ09xx and 26 shared, at 2b36c8f; 49 codes pending). `not` sits at its own precedence level (#100). Enforced by tests: every code the compiler can emit has an entry or is on the pending list, every trigger still raises its code with a declared fix kind, every example still checks, and every program example still prints its stated output. Written by hand and not compared with the checker: each code's say text and each feature's teaching text. component and service are registered at kind level only. The plugin host and the generated skills are not built; tracker row H1 is 🟡.",
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
    text: "The toolchain: mz check (with --agent, NDJSON diagnostics), mz fix, mz contract, mz outline, mz ir and mz hash, mz build (a service or a program), mz run and mz harness. 767 tests in 35 suites in the workspace at 2b36c8f, run on a macOS laptop: 766 passed, and one (a range too long to hold in memory) was killed by the operating system where it expects exit 101.",
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
    text: "Nothing is waiting. staging (99fa985) and main (2b36c8f) hold the same tree, so every merged change is on main. The next pull request to staging will be the first thing listed here.",
  },
];

export const inProgress: Item[] = [
  {
    text: "M2, a working programming language (Tier 1 plus P1–P6 ✅ on main), has its own tracking issue, #110, opened on 9 October. M1 (#69) is met. M2 is not reached, so Mzizi is not yet called a working programming language.",
    links: [M2_ISSUE],
  },
  {
    text: "Still to build for M2, with no pull request open on 29 October: modules and imports across files (P1), and the standard library (P2), which the public suites wait on. The tracker has both as ❌. RFC-0014 is their draft design, on main; nothing in it is implemented. Rust crate interop (P6) and errors mapped back to .mz (P5) are also M2 rows; neither has a pull request open. Five other pull requests are open on 29 October, none toward M2: the RFC-0015 (performance teardown) and RFC-0016 (three targets) drafts, a checker fix, a charter wording and a portal doc.",
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

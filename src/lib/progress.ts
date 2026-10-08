/**
 * Where the language stands: what is on `main`, what is on `staging` waiting
 * for the next release, and what is still in open pull requests toward M1.
 *
 * Shared by the landing page's status panel and `/language`, so the two never
 * disagree. `public/llms.txt` says the same in its own words.
 *
 * Sources, all in `mzizi-dev/mzizi`, read on 2026-10-08:
 * - "On main": the 8 October release, #96 ("chore(release): staging to main"),
 *   merged as dc156c5. It carries `staging` at 8ac7b55 to `main` tree for tree
 *   (`git diff origin/main origin/staging` is empty), so it holds #92 (2240347:
 *   the tracker marks C1–C5, C9 and C10 ✅) and #93 (2f7254a, ca9446a and
 *   64c0784: the language harness registers every code a program can raise).
 *   Read from `LANGUAGE-TRACKER.md`, `README.md` and `CHANGELOG.md` at dc156c5,
 *   and from a fresh build there: `cargo test --workspace` gives 644 tests in 24
 *   suites, 513 of them in the compiler crate; `mz harness definition` gives 137
 *   entries, 70 diagnostic codes and 51 pending codes; `compiler/src` is 26,850
 *   lines; the three example programs `mz run` prints the `.expected` files for.
 *   No `v0.6` tag existed on 2026-10-08 when this was read: `main-release.yml`
 *   tags after CI passes, and the site names the tag once it exists.
 * - "Landing on staging": #95 (`claude/c8-split`), merged into `staging` on
 *   2026-10-08 as 0d25354, after the release. It splits tracker row C8 and adds
 *   P12; it changes the tracker only. It is not on `main` until the next release.
 * - "In progress": the open pull requests that refer to tracking issue #69,
 *   apart from a release. None was open on 2026-10-08 after #95 merged, and no
 *   pull request is open for C6 or C7. When one opens, list it here and in
 *   llms.txt (scripts/check-facts.py fails until you do); when one merges,
 *   move it.
 */

export const LANG = "https://github.com/mzizi-dev/mzizi";
export const PROGRESS_DATE = "2026-10-08";
// The release, and the language commits this file was written from: `main`
// after #96 (dc156c5) holds the same tree as `staging` at 8ac7b55
// (RELEASED_STAGING); `staging` has since moved to 0d25354 (#95).
export const RELEASE = "8 October";
export const MAIN_COMMIT = "dc156c5";
export const RELEASED_STAGING = "8ac7b55";
export const STAGING_COMMIT = "0d25354";

export type Link = { href: string; label: string };
export type Item = { text: string; links?: Link[] };

const pr = (n: number): Link => ({ href: `${LANG}/pull/${n}`, label: `#${n}` });

export const M1_ISSUE: Link = { href: `${LANG}/issues/69`, label: "#69" };
export const RELEASE_PR: Link = pr(96);

export const onMain: Item[] = [
  {
    text: "Programs that compute (RFC-0013, released to main on 8 October in #91). A program file kind with fn main and print; functions with typed parameters and returns, calls and recursion; let, var and assignment; int, float, bool and text expressions, the numeric methods and interpolation; when, else when, match (exhaustive, and usable as a value), for each over a range, while, break, continue and early return; enums, with columns; and errors as values: result(T, E), return error(e), a prefix try that propagates, and a match on a result. Integer overflow and division by zero stop the program (MZ0991, exit 101); a float never traps.",
    links: [pr(80), pr(83), pr(89), pr(87), pr(91)],
  },
  {
    text: 'The tracker marks C1–C5, C9 and C10 ✅ (#92): each row\'s "Done when" was checked on main before its mark changed. P4 and H1 stay 🟡. On main since the 8 October release (#96).',
    links: [pr(92), RELEASE_PR],
  },
  {
    text: "mz run, which checks a program, lowers it to a Rust package with no dependencies, builds it with Cargo and runs it, exiting with the program's status; mz build writes the same package. CI runs every example program (hello, fib, numbers, control, errors) and compares its output with a committed .expected file.",
    links: [pr(80)],
  },
  {
    text: "The language harness, the spine of the language: every built feature of a program registers an entry in compiler/src/harness.rs, and mz harness version, definition and entry print the definition as JSON (137 entries, 70 of them diagnostic codes, 45 MZ09xx and 25 shared, at dc156c5; 51 codes pending, from 55). Enforced by tests: every code the compiler can emit has an entry or is on the pending list, every trigger still raises its code with a declared fix kind, every example still checks, and every program example still prints its stated output. Written by hand and not compared with the checker: each code's say text and each feature's teaching text. component and service are registered at kind level only. The plugin host and the generated skills are not built; tracker row H1 is 🟡.",
    links: [
      pr(88),
      pr(93),
      {
        href: `${LANG}/blob/main/design/RFC-0012-harness.md`,
        label: "RFC-0012",
      },
    ],
  },
  {
    text: "RFC-0013, the core language: one RFC for all of Tier 1 (C1–C10), with the amendments from the language survey. A draft for review, with 29 questions for the owner: design, apart from what is built above.",
    links: [
      {
        href: `${LANG}/blob/main/design/RFC-0013-core-language.md`,
        label: "RFC-0013",
      },
      pr(76),
      pr(81),
    ],
  },
  {
    text: "UI components: enums with data columns, records, list and option types, a view, and contracts that mz contract evaluates. Nine primitives are written in Mzizi.",
  },
  {
    text: "One kind of backend program: a service with HTTP routes and handlers. mz contract runs it in process; mz build lowers it to a local Rust + axum package, which CI compiles, tests and serves.",
  },
  {
    text: "The toolchain: mz check (with --agent, NDJSON diagnostics), mz fix, mz contract, mz outline, mz ir and mz hash, mz build (a service or a program), mz run and mz harness. 644 tests in 24 suites in the workspace, 513 of them in the compiler crate.",
  },
  {
    text: "A performance suite against hand-written Rust (benchmarks/perf): four programs, each with a Rust reference built with and without overflow checks. CI checks only that all three print the same output; no timing is gated or committed, and no overflow check is removed yet.",
    links: [pr(85)],
  },
  {
    text: "Also in the 8 October release: a survey of the top 10 languages as design input (nothing in it is implemented or measured), release notes generated from CHANGELOG.md, a pre-commit hook that asks for a changelog entry, and a CLAUDE.md. Tooling and docs, not the language.",
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
    text: 'Tracker row C8 split (#95, merged to staging on 8 October as 0d25354): C8 becomes "User types: records and methods" for M1, and a new Tier 2 row, P12, "Generics and interfaces", comes after M1 and takes the generics and interfaces the owner deferred past M1. It changes the tracker only; nothing is built by it. On main in the next release.',
    links: [pr(95)],
  },
];

export const inProgress: Item[] = [
  {
    text: "M1, a language that computes: every Tier 1 row of the tracker (C1–C10) ✅ on main, built in waves. The tracking issue.",
    links: [M1_ISSUE],
  },
  {
    text: "Next in Wave 1, with no pull request open on 8 October: maps, sets and collection operations (C7), text operations (C6), and methods on records (C8). RFC-0013 designs them; none is built.",
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

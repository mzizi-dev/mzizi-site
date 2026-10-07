/**
 * Where the language stands: what is on `main`, what is on `staging` waiting
 * for the next release, and what is still in open pull requests toward M1.
 *
 * Shared by the landing page's status panel and `/language`, so the two never
 * disagree. `public/llms.txt` says the same in its own words.
 *
 * Sources, all in `mzizi-dev/mzizi`, read on 2026-10-07:
 * - "On main": `LANGUAGE-TRACKER.md` and `CHANGELOG.md` at `main` (0653903).
 *   Two releases reached `main` on 2026-10-07: #72 (9a88e1d) and #79
 *   (0653903). Their entries are still under `## [Unreleased]` in `main`'s
 *   CHANGELOG.md, not in a dated section. Every capability here is a tracker
 *   row that is ✅, or the narrow form a 🟡 row names.
 * - "On staging": the commits on `staging` that are not on `main`, up to
 *   9254ef4 (the survey, CLAUDE.md #77, release notes #82, RFC-0013 #76 and
 *   its amendments #81, the foundation slice #80, and the pre-commit hook
 *   #86, which superseded the closed #84). The tracker on staging still marks C1–C5 and
 *   C10 🟡: they turn ✅ only when the slice reaches `main`.
 * - "In progress": the open pull requests and tracking issue #69. Nothing in
 *   that list is available. When one merges, move it, and when it reaches
 *   `main` and its tracker row turns ✅, change what the site says Mzizi lacks
 *   (scripts/check-facts.py fails until you do).
 */

export const LANG = "https://github.com/mzizi-dev/mzizi";
export const PROGRESS_DATE = "2026-10-07";
// The language's main and staging commits this file was written from.
export const MAIN_COMMIT = "0653903";
export const STAGING_COMMIT = "9254ef4";

export type Link = { href: string; label: string };
export type Item = { text: string; links?: Link[] };

const pr = (n: number): Link => ({ href: `${LANG}/pull/${n}`, label: `#${n}` });

export const M1_ISSUE: Link = { href: `${LANG}/issues/69`, label: "#69" };

export const onMain: Item[] = [
  {
    text: "UI components: enums with data columns, records, list and option types, a view, and contracts that mz contract evaluates. Nine primitives are written in Mzizi.",
  },
  {
    text: "One kind of backend program: a service with HTTP routes and handlers. mz contract runs it in process; mz build lowers it to a local Rust + axum package, which CI compiles, tests and serves.",
  },
  {
    text: "The toolchain: mz check (with --agent, NDJSON diagnostics), mz fix, mz contract, mz outline, mz ir and mz hash, and mz build for a service only.",
  },
  {
    text: "From the 7 October releases (#72, #79), as listed under [Unreleased] in CHANGELOG.md on main. #79: blocks nest at most 64 deep (MZ0411, where deep nesting used to crash mz), mz build escapes file names in the comments it writes, robustness tests, and no unsafe code in the compiler. 437 tests.",
    links: [
      pr(72),
      pr(79),
      { href: `${LANG}/blob/main/CHANGELOG.md`, label: "CHANGELOG.md" },
    ],
  },
  {
    text: "#72: match in a view is MZ0410; RFC-0012 (the harness, a draft) surveys prior art in §8; the React arm's pins come from the registry's lockfile; the workflows are pinned to commit SHAs and audited.",
    links: [pr(72)],
  },
];

export const onStaging: Item[] = [
  {
    text: "RFC-0013, the core language: one RFC for all of Tier 1 (C1–C10), with the amendments from the language survey (named arguments, records, options, collections and errors). A draft for review: design, apart from the foundation slice below, with 29 questions for the owner.",
    links: [
      {
        href: `${LANG}/blob/staging/design/RFC-0013-core-language.md`,
        label: "RFC-0013",
      },
      pr(76),
      pr(81),
    ],
  },
  {
    text: "The foundation slice: a program file kind with fn main, functions with parameters and returns, let and var, int, bool and text expressions, when/else, return and print, and mz run, which lowers a program to a Rust package with no dependencies, builds it and runs it. Integer overflow and division by zero stop the program with MZ0991. The tracker still marks these rows 🟡: they turn ✅ when the slice reaches main.",
    links: [pr(80)],
  },
  {
    text: "A survey of the top 10 languages, feature by feature: 63 features, each marked adopt, improve, already has, or reject. Design input only: nothing in it is implemented or measured.",
    links: [
      {
        href: `${LANG}/blob/staging/design/LANGUAGE-SURVEY.md`,
        label: "design/LANGUAGE-SURVEY.md",
      },
    ],
  },
  {
    text: "Release notes generated from CHANGELOG.md, and a changelog entry required in every pull request. CI only.",
    links: [pr(82)],
  },
  {
    text: "A pre-commit hook (.githooks/pre-commit, installed with scripts/install-hooks.sh) that refuses a commit without a CHANGELOG.md entry and runs cargo fmt --check on staged Rust, with a test that CI's compiler job runs. Tooling, not the language. It supersedes #84, which was closed.",
    links: [pr(86)],
  },
  {
    text: "A CLAUDE.md for agents working in the repository. Docs only.",
    links: [pr(77)],
  },
];

export const inProgress: Item[] = [
  {
    text: "M1, a language that computes: every Tier 1 row of the tracker (C1–C10) ✅ on main, built in waves. The tracking issue.",
    links: [M1_ISSUE],
  },
  {
    text: "Wave 1, numbers: a float type, numeric methods such as round and sqrt, the rest of the operators, and their diagnostics, in a program.",
    links: [pr(83)],
  },
  {
    text: "A performance suite against hand-written Rust: four programs in the foundation slice, each with a Rust reference built with and without overflow checks. It builds the benchmark only; no overflow check is removed yet. No result is committed to the repository; the pull request's description records one informal run on one machine.",
    links: [pr(85)],
  },
  {
    text: "Wave 1, errors: enums in a program, a result(T, E) type, return error(e), prefix try, a match on a result, and main returning a result (an escaped error is MZ0992, and mz run exits 1). Only the match on a result is built; a general match is control flow's.",
    links: [pr(87)],
  },
  {
    text: "Next in Wave 1, with no pull request open yet: loops and a general match, maps and collection operations, and methods on records.",
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

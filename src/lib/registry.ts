/**
 * The registry, read once at build time.
 *
 * ## Why build time and not the browser
 *
 * `/components`, `/architecture` and `/tokens` are pages a person reads. The
 * alternative — an island that fetches on mount — was tried in this ecosystem
 * and failed in the worst available way: in `mzizi-console` the bundle loaded,
 * the fetch returned 200, no exception was thrown, CI was green, and the page
 * painted nothing, because the island mounted against an element that was not
 * there. Nothing in that pipeline ever asked whether anything had *rendered*.
 *
 * Reading the API here means the answer is in the HTML. No JavaScript runs, no
 * island can miss its mount point, and a browser with scripting off sees all
 * 575 components. The cost is real and is stated rather than hidden:
 *
 *   1. The BUILD depends on `api.mzizi.dev`. If the API is down, the build
 *      fails — loudly, by design. There is deliberately no committed snapshot
 *      to fall back to, because a silent fallback to stale data is the failure
 *      this whole approach exists to avoid. A failed build keeps serving the
 *      last good `dist/`; it does not publish a half-empty page.
 *   2. Content is as fresh as the last build. Every page that renders this data
 *      therefore stamps the fetch time and links to the live endpoint, so a
 *      reader can always tell how old the number in front of them is. That is
 *      the honest version of a snapshot: dated, and next to its source.
 *
 * The API is the authority either way. This module never transforms a value it
 * displays — it groups, sorts and counts, and nothing else.
 */

/** The canonical origin. Never `mzizi.dev/api/v1`; that form is retired. */
export const API_ORIGIN = "https://api.mzizi.dev";

/**
 * The canonical public base, and the one every page PRINTS.
 *
 * `npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>` is the documented
 * install command — 1,464 references across the estate were migrated onto it,
 * and the previous apex printed exactly this form. It is what a reader should
 * copy, so it is what the pages show, always.
 */
export const CANONICAL_BASE = `${API_ORIGIN}/v1`;

/**
 * The bases this build will try to READ from, in order of preference.
 *
 * `api.mzizi.dev` is attached straight to the registry Worker, which serves its
 * routes under `/api/v1/*`. The rewrite that makes `/v1/*` answer is
 * `mzizi-registry#335`, which is open and unmerged — so right now the canonical
 * path 404s and `/api/v1` is what actually responds. Rather than pin either
 * one, the build asks: canonical first, `/api/v1` as the fallback. The day #335
 * lands, the next build silently starts using `/v1` and this list can lose its
 * second entry. Nothing that is printed on a page changes either way.
 */
const READ_BASES = [`${API_ORIGIN}/v1`, `${API_ORIGIN}/api/v1`];

/**
 * Where the build actually reads from.
 *
 * Almost always `API_ORIGIN`. `MZIZI_API_ORIGIN` exists so that someone can
 * point a build at a local mirror of the API during an outage — the endpoint
 * WAS down for several minutes while these pages were being written — without
 * anybody being tempted to commit a snapshot of the data into this repository
 * and quietly serve it forever. The override has to be typed out on the command
 * line, so it is never what CI or a production build does by accident.
 *
 * Displayed URLs always use `API_ORIGIN`: a page tells a reader where the data
 * lives, not which mirror this particular build happened to read.
 */
const ORIGIN_OVERRIDE: string | undefined = import.meta.env.MZIZI_API_ORIGIN;

/**
 * The install command every consumer is told to run. One definition, because
 * 1,464 references across this estate were migrated onto this exact form and a
 * second spelling on the front door would start the drift again.
 */
export function installCommand(name: string): string {
  return `npx shadcn@latest add ${CANONICAL_BASE}/ui/${name}`;
}

/** One item in the registry. Eleven fields, exactly as `/v1/ui` serves them. */
export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  categories: string[];
  dependencies: string[];
  registryDependencies: string[];
  /** DNA node this component lives in, derived from its directory. */
  node: number;
  nodeLabel: string;
  owner: string;
  collection: string;
}

interface RegistryResponse {
  name: string;
  homepage: string;
  items: RegistryItem[];
  meta: { total: number; count: number; registryTotal: number };
}

/** A node (N1–N8) or a rung (N9–N12) of the double helix. */
export interface HelixEntry {
  node_number: number;
  sub_label: string;
  title: string;
  type: "node" | "rung";
  strand: string | null;
  backbone: string | null;
  role: string;
  covenant: string;
  description: string;
  stakeholder: string;
  implementation_rules: string[];
  sort_order: number;
  component_count: number;
}

export interface Strand {
  name: string;
  title: string;
  backbone: string;
  covenant: string;
  description: string;
  sort_order: number;
}

export interface Architecture {
  nodes: HelixEntry[];
  rungs: HelixEntry[];
  strands: Strand[];
}

/** A colour family. Minerals and heritage carry the prose; experimental does not. */
export interface ColourFamily {
  name: string;
  hex: string;
  lightHex: string;
  darkHex: string;
  cssVar: string;
  containerLight?: string;
  containerDark?: string;
  onContainerLight?: string;
  onContainerDark?: string;
  uiLight?: string;
  uiDark?: string;
  origin?: string;
  symbolism?: string;
  usage?: string;
  heptagonIndex?: number;
}

export interface ThemedToken {
  name: string;
  light: string;
  dark: string;
  usage: string;
}

export interface TypeStep {
  name: string;
  sizePx: number;
  sizeRem: string;
  lineHeight: string;
  weight: number;
  font: "sans" | "serif" | "mono";
  usage: string;
}

export interface SpacingStep {
  name: string;
  px: number;
  rem: string;
  usage: string;
}

export interface Brand {
  version: string;
  lastUpdated: string;
  minerals: ColourFamily[];
  heritage: ColourFamily[];
  experimental: ColourFamily[];
  semanticColors: ThemedToken[];
  backgrounds: ThemedToken[];
  typography: {
    fonts: Record<"sans" | "serif" | "mono", { family: string; usage: string; reason: string }>;
    scale: TypeStep[];
  };
  spacing: SpacingStep[];
  radii: Record<string, string>;
  componentSpecs: {
    name: string;
    note?: string;
    heights: Record<string, number>;
    padding: string;
    variants: string[];
    borderRadius: number;
    minTouchTarget: number;
  }[];
  accessibility: {
    standard: string;
    contrastDescription: string;
    focusIndicator: string;
    minTouchTarget: number;
    defaultTouchTarget: number;
    keyboardNavigation: string;
    screenReaders: string;
  };
}

/**
 * One fetch per endpoint per build, however many pages ask.
 *
 * Astro renders each page in the same process, so a module-level cache is all
 * the deduplication needed — without it, three pages plus `astro check` would
 * hit the API a dozen times for data that cannot change mid-build.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Four attempts, doubling from one second.
 *
 * Not optimism — measurement. While this page was being built the API returned
 * 404 on every endpoint for several minutes and then came back on its own; it
 * sits behind a Next.js deployment, so a redeploy takes the whole surface out
 * briefly. A build that gives up on the first blip would make those windows
 * into red CI runs for no reason. Four attempts covers roughly fifteen seconds;
 * anything longer is a real outage and should be reported as one, not waited
 * out.
 */
const ATTEMPTS = 4;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson<T>(path: string): Promise<T> {
  const bases = ORIGIN_OVERRIDE ? [`${ORIGIN_OVERRIDE}/v1`] : READ_BASES;
  let pending = inFlight.get(path) as Promise<T> | undefined;
  if (!pending) {
    pending = (async () => {
      let last = "";
      let url = "";
      for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        for (const base of bases) {
          url = `${base}${path}`;
          try {
            const response = await fetch(url, {
              headers: { accept: "application/json" },
            });
            if (response.ok) return (await response.json()) as T;
            last = `${url} answered ${response.status} ${response.statusText}`;
          } catch (error) {
            last = `${url} threw ${error instanceof Error ? error.message : String(error)}`;
          }
        }
        if (attempt < ATTEMPTS) await wait(1000 * 2 ** (attempt - 1));
      }
      // Loud, with the URL and the last thing it said. A build that dies here
      // is working as intended: better a red build than a page that ships
      // empty. There is deliberately no cached copy to fall back to.
      throw new Error(
        `mzizi-site build: could not read ${path} after ${ATTEMPTS} attempts ` +
          `against ${bases.join(" and ")} — last: ${last}. These pages are ` +
          `rendered from the live API at build time, so the build cannot ` +
          `proceed without it. If the API is down, wait — do not add a ` +
          `snapshot. To build against a mirror, set MZIZI_API_ORIGIN.`,
      );
    })();
    inFlight.set(path, pending);
  }
  return pending;
}

/** Every component in the registry, `/v1/ui`. */
export async function getComponents(): Promise<{
  items: RegistryItem[];
  total: number;
}> {
  const data = await readJson<RegistryResponse>("/ui");
  const total = data.meta?.registryTotal ?? data.items.length;
  if (data.items.length !== total) {
    // A paginated response would silently ship a partial corpus. Refuse.
    throw new Error(
      `mzizi-site build: /ui returned ${data.items.length} items but reports ` +
        `${total} in the registry. Refusing to render a partial corpus.`,
    );
  }
  return { items: data.items, total };
}

/** The DNA double helix, `/v1/architecture`. */
export async function getArchitecture(): Promise<Architecture> {
  const { data } = await readJson<{ data: Architecture }>("/architecture");
  return data;
}

/** The brand system, `/v1/brand`. */
export async function getBrand(): Promise<Brand> {
  return readJson<Brand>("/brand");
}

/**
 * The moment this build read the API, to the minute, in UTC.
 *
 * Rendered on every page that shows fetched data. A snapshot that says when it
 * was taken is a fact; one that does not is a claim.
 */
export const builtAt = new Date().toISOString().replace(/:\d\d\.\d+Z$/, "Z");

/** Group components by their DNA node, in node order. */
export function byNode(
  items: RegistryItem[],
): { node: number; nodeLabel: string; items: RegistryItem[] }[] {
  const groups = new Map<number, { node: number; nodeLabel: string; items: RegistryItem[] }>();
  for (const item of items) {
    let group = groups.get(item.node);
    if (!group) {
      group = { node: item.node, nodeLabel: item.nodeLabel, items: [] };
      groups.set(item.node, group);
    }
    group.items.push(item);
  }
  for (const group of groups.values()) {
    group.items.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...groups.values()].sort((a, b) => a.node - b.node);
}

/** `registry:ui` → `ui`. The prefix is the same on every item and carries nothing. */
export function shortType(type: string): string {
  return type.replace(/^registry:/, "");
}

/**
 * Black or white, whichever is readable on `hex`.
 *
 * A swatch has to print its own hex code on itself, and the palette runs from
 * `#00B0FF` to `#0E0D0C`, so one fixed ink colour is illegible on half of it.
 * This is WCAG 2.x relative luminance — derived from the value being shown,
 * never a per-swatch colour someone chose by eye. Nothing here invents a
 * colour; it only picks which end of the existing contrast pair to use.
 */
export function readableInk(hex: string): "#000000" | "#ffffff" {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const channel = (offset: number) => {
    const srgb = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}


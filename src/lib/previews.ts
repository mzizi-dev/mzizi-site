/**
 * The static component previews, if any have been generated.
 *
 * `public/previews/<name>.jpg` is written by `scripts/generate-previews.mjs`
 * (a screenshot of the component's React build rendered in the registry's
 * playground) and committed like any other static asset, together with
 * `src/data/component-previews.json`, the manifest read here. It is not a build
 * step; see the script's header for why.
 *
 * `import.meta.glob` on a pattern with zero matches returns an empty object
 * rather than failing, which is the "never generated" case: previews are a
 * decorative enhancement over the text, and nothing depends on them.
 */
interface Manifest {
  /** When the screenshots were taken, ISO 8601. */
  generatedAt?: string;
  /** Where they were taken from. */
  source?: string;
  previews: Record<string, boolean>;
}

const manifests = import.meta.glob<{
  default: Manifest | Record<string, boolean>;
}>("../data/component-previews.json", { eager: true });
const raw = Object.values(manifests)[0]?.default;

// The first version of the manifest was a bare name → boolean map, with no date.
const manifest: Manifest =
  raw && "previews" in raw && typeof raw.previews === "object"
    ? (raw as Manifest)
    : { previews: (raw as Record<string, boolean> | undefined) ?? {} };

export const previews: Record<string, boolean> = manifest.previews;
export const previewsGeneratedAt: string | undefined = manifest.generatedAt;
export const previewsSource: string | undefined = manifest.source;

export function hasPreview(name: string): boolean {
  return previews[name] === true;
}

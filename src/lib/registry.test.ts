import { describe, expect, it } from "vite-plus/test";
import { parseSizeLayers } from "./registry";

const BASE = `:root {
  --size-touch: 2.75rem;
  --target-floor: 2.75rem;
  --fs-body: 1.0625rem;
}`;
const TABLET = `@media (min-width: 48rem) {\n  :root {\n    --fs-body: 1rem;\n  }\n}`;
const DESKTOP = `@media (min-width: 64rem) and (pointer: fine) and (hover: hover) {
  :root {
    --target-floor: 1.5rem;
    --size-touch: 2.25rem;
    --fs-body: 15px;
  }
}`;
const LEGACY = `:root[data-mzizi-sizes="legacy"] {\n  --size-touch: 3.5rem;\n}`;

describe("parseSizeLayers", () => {
  it("cascades phone, tablet and desktop, reading rem and px", () => {
    const [phone, tablet, desktop] = parseSizeLayers(
      [BASE, TABLET, DESKTOP].join("\n"),
    );
    expect(phone.px).toMatchObject({ "size-touch": 44, "fs-body": 17 });
    expect(tablet.px).toMatchObject({ "size-touch": 44, "fs-body": 16 });
    expect(desktop.px).toMatchObject({
      "size-touch": 36,
      "target-floor": 24,
      "fs-body": 15,
    });
  });

  it("is phone-only until the registry serves density", () => {
    expect(parseSizeLayers(BASE)).toHaveLength(1);
  });

  it("takes the phone layer from the base block, wherever density and legacy sit", () => {
    const [phone] = parseSizeLayers([LEGACY, DESKTOP, BASE].join("\n"));
    expect(phone.px).toMatchObject({ "size-touch": 44, "target-floor": 44 });
  });

  it("throws when there is no touch size to show", () => {
    expect(() => parseSizeLayers(":root { --fs-body: 1rem; }")).toThrow();
  });
});

import { describe, expect, it } from "vite-plus/test";
import file from "../../public/_headers?raw";

const lines: string[] = file
  .split("\n")
  .filter((l) => l.trim() && !l.trim().startsWith("#"))
  .map((l) => l.trim());

describe("public/_headers", () => {
  it("applies one rule to every path", () => {
    expect(lines[0]).toBe("/*");
  });

  it("sends HSTS for a year, without includeSubDomains or preload", () => {
    const hsts = lines.find((l) => l.startsWith("Strict-Transport-Security:"));
    expect(hsts).toBe("Strict-Transport-Security: max-age=31536000");
  });

  it("sends nosniff, a frame protection, a referrer policy and a permissions policy", () => {
    expect(lines).toContain("X-Content-Type-Options: nosniff");
    expect(lines).toContain("X-Frame-Options: SAMEORIGIN");
    expect(lines).toContain("Referrer-Policy: strict-origin-when-cross-origin");
    expect(lines.some((l) => l.startsWith("Permissions-Policy:"))).toBe(true);
  });
});

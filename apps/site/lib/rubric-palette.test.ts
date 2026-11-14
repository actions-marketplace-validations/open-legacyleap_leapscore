import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RUBRIC_ROUTES = join(process.cwd(), "app", "rubric");

/**
 * Rubric surfaces use neutral chrome plus the four band-tier tokens only
 * (design D9). Any Tailwind palette hue in a rubric route is a violation.
 */
const PALETTE =
  /\b(?:bg|text|border|outline|ring|from|to|via|decoration|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

describe("rubric palette (design D9)", () => {
  it("uses no colour outside neutral tokens and the band-tier palette", () => {
    const files = readdirSync(RUBRIC_ROUTES, { recursive: true })
      .map((path) => join(RUBRIC_ROUTES, String(path)))
      .filter((path) => /\.(ts|tsx)$/.test(path) && !path.includes(".test."));
    expect(files.length).toBeGreaterThan(0);
    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(PALETTE)) {
        violations.push(`${file.replace(process.cwd() + "/", "")}: ${match[0]}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("no rubric route retains the light-mode flag cards", () => {
    const files = readdirSync(RUBRIC_ROUTES, { recursive: true })
      .map((path) => join(RUBRIC_ROUTES, String(path)))
      .filter((path) => /\.(ts|tsx)$/.test(path) && !path.includes(".test."));
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(/amber-50|red-50/);
    }
  });
});

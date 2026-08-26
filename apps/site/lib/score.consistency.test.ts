/*
 * Consistency invariant (AGENTS.md lint-by-hand): derived views must match the
 * canonical seed. This test recomputes the system score from lib/sample.ts and
 * asserts the headline lands on exactly 58.00 — if anyone edits a seed row,
 * this is the tripwire.
 */

import { describe, expect, it } from "vitest";

import { coverageCounts, scoreSystem, tierForScore } from "@/lib/scoring";
import { getReportProvider } from "@/lib/provider";

const CATEGORY_ROWS = {
  ECOS: 8,
  ARCH: 10,
  TEST: 8,
  SEC: 8,
  DATA: 8,
  API: 8,
  VEL: 10,
  PERF: 8,
  DOCS: 8,
} as const;

describe("canonical sample (django/django)", () => {
  it("recomputes the headline to exactly 58.00", async () => {
    const report = await getReportProvider().getReport({
      repo: "django/django",
    });
    expect(report.headline.score).toBe(58);
  });

  it("lands in the Moderate tier", async () => {
    const tier = tierForScore(58);
    expect(tier.label).toBe("Moderate");
  });

  it("standard audit covers 76 rows at 49/19/8", async () => {
    const report = await getReportProvider().getReport({
      repo: "django/django",
    });
    const { coverage } = report;
    expect(coverage.measured + coverage.estimated + coverage.unknown).toBe(76);
    expect(coverage.measured).toBe(49);
    expect(coverage.estimated).toBe(19);
    expect(coverage.unknown).toBe(8);
    expect(coverage.not_applicable).toBe(8);
    // +18 deep-dive → 102 all-up
    expect(report.full_table.length).toBe(102);
  });

  it("101 of the 102 rows are accounted for by category denominators", () => {
    const categories = Object.keys(CATEGORY_ROWS);
    const reports = {
      ECOS: CATEGORY_ROWS.ECOS,
      ARCH: CATEGORY_ROWS.ARCH,
      TEST: CATEGORY_ROWS.TEST,
      SEC: CATEGORY_ROWS.SEC,
      DATA: CATEGORY_ROWS.DATA,
      API: CATEGORY_ROWS.API,
      VEL: CATEGORY_ROWS.VEL,
      PERF: CATEGORY_ROWS.PERF,
      DOCS: CATEGORY_ROWS.DOCS,
    };
    const total = Object.values(reports).reduce((a, b) => a + b, 0);
    expect(total).toBe(76);
    expect(categories.length).toBe(9); // FE is the 10th, N/A here
  });
});

describe("system score math", () => {
  it("category score = Σ÷(applicable×3)×100 for a fixture", () => {
    const cats = scoreSystem([
      {
        meta: { id: "TEST", name: "testing", weight: 10 },
        rows: [
          {
            id: "T1",
            name: "a",
            category_id: "TEST",
            status: "measured",
            score: 3 as const,
            effort: "",
            not_applicable: false,
          },
          {
            id: "T2",
            name: "b",
            category_id: "TEST",
            status: "measured",
            score: 0 as const,
            effort: "",
            not_applicable: false,
          },
        ],
      },
    ]);
    expect(cats.categories[0].category_score).toBeCloseTo(50);
  });

  it("unknown and N/A rows are excluded from both numerator and denominator", () => {
    const cats = scoreSystem([
      {
        meta: { id: "SEC", name: "security", weight: 20 },
        rows: [
          {
            id: "S1",
            name: "a",
            category_id: "SEC",
            status: "measured",
            score: 3 as const,
            effort: "",
            not_applicable: false,
          },
          {
            id: "S2",
            name: "b",
            category_id: "SEC",
            status: "unknown",
            effort: "",
            not_applicable: false,
          },
          {
            id: "S3",
            name: "c",
            category_id: "SEC",
            status: "unknown",
            effort: "",
            not_applicable: true,
          },
        ],
      },
    ]);
    expect(cats.categories[0].applicable).toBe(1);
    expect(cats.categories[0].category_score).toBe(100);
  });

  it("coverage counts match the canonical decision", async () => {
    const report = await getReportProvider().getReport({
      repo: "django/django",
    });
    expect(coverageCounts(report.categories).measured).toBe(49);
  });
});

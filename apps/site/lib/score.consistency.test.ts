/*
 * Consistency invariant (AGENTS.md lint-by-hand): the site's sealed sample is
 * the scanner's envelope, not a re-derived view. This test pins the committed
 * v1.0.2 local scan and checks the site's scoring helpers agree with it.
 */

import { describe, expect, it } from "vitest";

import { coverageCounts, scoreSystem, tierForScore } from "@/lib/scoring";
import { getSample } from "@/lib/samples";

describe("committed sample (synthetic Maven fixture)", () => {
  it("returns the sealed headline the scanner produced", async () => {
    const report = getSample("maven-multi-module")!.envelope.report;
    expect(report.headline.score).toBe(5.71);
    expect(report.headline.tier).toBe("Critical");
    expect(report.sample).toBe(true);
  });

  it("carries the release's real engine and rubric versions", async () => {
    const report = getSample("maven-multi-module")!.envelope.report;
    expect(report.snapshot.engine_version).toBe("1.0.2");
    expect(report.snapshot.rubric_version).toBe("docs/rubric@tranche-a");
    expect(report.snapshot.repo).toBe("maven-multi-module");
  });

  it("lands in the Critical tier", () => {
    expect(tierForScore(5.71).label).toBe("Critical");
  });

  it("coverage is the sealed coverage, not an authored count", async () => {
    const report = getSample("maven-multi-module")!.envelope.report;
    const { coverage } = report;
    expect(coverage.measured).toBe(13);
    expect(coverage.estimated).toBe(1);
    expect(coverage.unknown).toBe(14);
    expect(coverage.not_applicable).toBe(3);
    expect(coverage.not_implemented).toBe(71);
    expect(report.full_table.length).toBe(102);
  });

  it("every full-table row is accounted for by a category denominator or the deep-dive annex", async () => {
    const report = getSample("maven-multi-module")!.envelope.report;
    const inCategories = report.categories.reduce((sum, c) => sum + c.indicator_rows.length, 0);
    expect(inCategories).toBe(102);
    expect(report.categories.length).toBe(10);
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

  it("coverage counts agree with the sealed envelope", async () => {
    const report = getSample("maven-multi-module")!.envelope.report;
    const coverage = coverageCounts(report.categories);
    expect(coverage.measured).toBe(report.coverage.measured);
    expect(coverage.estimated).toBe(report.coverage.estimated);
    expect(coverage.unknown).toBe(report.coverage.unknown);
    expect(coverage.not_applicable).toBe(report.coverage.not_applicable);
  });
});

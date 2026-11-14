import { describe, expect, it } from "vitest";

import {
  RUBRIC_INDEX,
  categorySummaries,
  defaultStatusCounts,
  releaseStatus,
  releaseStatusCounts,
} from "./rubric-index";
import { filterRubricIndex, rubricFacets } from "./rubric-filter";

describe("rubric index filters (spec: rubric-browser)", () => {
  it("a term matches ID or name across categories", () => {
    const byId = filterRubricIndex(RUBRIC_INDEX, { term: "ARCH-02" });
    expect(byId.map((entry) => entry.id)).toEqual(["ARCH-02"]);
    const byName = filterRubricIndex(RUBRIC_INDEX, { term: "coupling" });
    expect(byName.some((entry) => entry.id === "ARCH-02")).toBe(true);
    expect(byName.every((entry) => entry.name.toLowerCase().includes("coupling"))).toBe(true);
  });

  it("tier and status narrow to the intersection", () => {
    const tier = filterRubricIndex(RUBRIC_INDEX, { tier: "A" });
    const status = filterRubricIndex(RUBRIC_INDEX, { status: "measured" });
    const both = filterRubricIndex(RUBRIC_INDEX, { tier: "A", status: "measured" });
    expect(tier.length).toBeGreaterThan(0);
    expect(status.length).toBeGreaterThan(0);
    expect(both.every((entry) => entry.tier === "A" && entry.status === "measured")).toBe(true);
    const expected = tier.filter((entry) => entry.status === "measured").map((entry) => entry.id);
    expect(both.map((entry) => entry.id)).toEqual(expected);
  });

  it("gate participation filters to rows that feed the gate", () => {
    const withGate = RUBRIC_INDEX.find((entry) => entry.gates.length > 0);
    expect(withGate).toBeDefined();
    const gate = withGate!.gates[0];
    const filtered = filterRubricIndex(RUBRIC_INDEX, { gate });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((entry) => entry.gates.includes(gate))).toBe(true);
  });

  it("'none' selects rows that feed no gate", () => {
    const filtered = filterRubricIndex(RUBRIC_INDEX, { gate: "none" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((entry) => entry.gates.length === 0)).toBe(true);
  });

  it("clearing the filters restores the full catalog", () => {
    const all = filterRubricIndex(RUBRIC_INDEX, {});
    expect(all).toEqual(RUBRIC_INDEX);
    expect(filterRubricIndex(RUBRIC_INDEX, { term: "", tier: "", status: "", gate: "" })).toEqual(
      RUBRIC_INDEX,
    );
  });

  it("a non-matching term yields nothing, so the surface can state it", () => {
    expect(filterRubricIndex(RUBRIC_INDEX, { term: "zzzz-no-such-indicator" })).toEqual([]);
  });

  it("facet counts say how many indicators each filter option leaves", () => {
    const facets = rubricFacets(RUBRIC_INDEX);
    const tierTotal = Object.values(facets.tiers).reduce((sum, count) => sum + count, 0);
    const statusTotal = Object.values(facets.statuses).reduce((sum, count) => sum + count, 0);
    expect(tierTotal).toBe(RUBRIC_INDEX.length);
    expect(statusTotal).toBe(RUBRIC_INDEX.length);
    expect(facets.tiers.A).toBe(filterRubricIndex(RUBRIC_INDEX, { tier: "A" }).length);
    expect(facets.statuses.measured).toBe(
      filterRubricIndex(RUBRIC_INDEX, { status: "measured" }).length,
    );
    expect(facets.noGate).toBe(filterRubricIndex(RUBRIC_INDEX, { gate: "none" }).length);
  });
});

describe("rubric index aggregates (design D4)", () => {
  it("release status counts sum to the rubric denominator", () => {
    const counts = releaseStatusCounts();
    expect(counts.total).toBe(102);
    expect(counts.measured + counts.estimated + counts.unknown + counts.not_implemented).toBe(102);
    expect(counts.not_implemented).toBe(71);
  });

  it("default status is a rubric property, not release coverage", () => {
    const counts = defaultStatusCounts();
    expect(counts.measured + counts.estimated + counts.unknown).toBe(102);
    expect(counts.measured).not.toBe(releaseStatusCounts().measured);
  });

  it("an unimplemented row is reported as not implemented even when declared measured", () => {
    const notImplemented = RUBRIC_INDEX.find(
      (entry) => entry.status === "measured" && releaseStatus(entry.id) === "not_implemented",
    );
    expect(notImplemented).toBeDefined();
  });

  it("ten category summaries carry weights, counts, and mixes", () => {
    const categories = categorySummaries();
    expect(categories).toHaveLength(10);
    expect(categories.reduce((sum, category) => sum + category.count, 0)).toBe(102);
    for (const category of categories) {
      expect(category.prefix).toMatch(/^\d{2}$/);
      expect(category.thesis).toBeTruthy();
      expect(category.summary).toBeTruthy();
      expect(
        category.tiers.A + category.tiers.B + category.tiers.C + category.tiers.D,
      ).toBe(category.count);
      expect(
        category.defaultStatus.measured +
          category.defaultStatus.estimated +
          category.defaultStatus.unknown,
      ).toBe(category.count);
    }
  });
});

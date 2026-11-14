import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import MethodPage from "@/app/method/page";
import SamplesPage from "@/app/samples/page";
import { ReportView } from "@/components/report-view";
import { TIERS, publicTierLabel } from "@/lib/scoring";
import sampleEnvelope from "@/lib/samples/maven-multi-module.json";
import type { Report } from "@/lib/types";

const fixture = (sampleEnvelope as unknown as { report: Report }).report;

/** Alias strings that must never appear as a band label. The 0–3 row taxonomy
 *  verdict (`3 — Healthy`) is a row verdict, not a band — strip it first. */
function staleBandLabels(markup: string): string[] {
  const withoutRowTaxonomy = markup.replace(/3\s*—\s*Healthy/g, "");
  return ["Healthy", "High Risk"].filter((label) => withoutRowTaxonomy.includes(label));
}

describe("public band vocabulary (Low/Moderate/High/Critical)", () => {
  it("TIERS labels are the public set and thresholds are unchanged", () => {
    expect(TIERS.map((t) => t.label)).toEqual(["Low", "Moderate", "High", "Critical"]);
    expect(TIERS.map((t) => t.min)).toEqual([80, 53, 27, 0]);
  });

  it("legacy stored tiers normalize; aliases stay data-only", () => {
    expect(publicTierLabel("Healthy")).toBe("Low");
    expect(publicTierLabel("High Risk")).toBe("High");
    expect(publicTierLabel("Moderate")).toBe("Moderate");
    expect(publicTierLabel("nonsense")).toBeNull();
    expect(publicTierLabel(undefined)).toBeNull();
  });

  it("method page renders the public set", () => {
    const html = renderToStaticMarkup(MethodPage());
    for (const label of ["Low", "Moderate", "High", "Critical"]) {
      expect(html).toContain(label);
    }
    expect(staleBandLabels(html)).toEqual([]);
  });

  it("sample gallery prints a public label for a committed envelope", () => {
    const html = renderToStaticMarkup(SamplesPage());
    expect(html).toContain(publicTierLabel(fixture.headline.tier));
    expect(staleBandLabels(html)).toEqual([]);
  });

  it("report view prints no alias as a band label", () => {
    const html = renderToStaticMarkup(<ReportView report={fixture} title="Report" />);
    expect(html).toContain(fixture.headline.tier);
    expect(staleBandLabels(html)).toEqual([]);
  });
});

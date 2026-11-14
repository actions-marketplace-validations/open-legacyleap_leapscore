import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { gateCapStatement, type Report as ContractReport } from "@leapscore/contracts";
import { ReportView } from "@/components/report-view";
import sampleEnvelope from "@/lib/samples/maven-multi-module.json";
import type { Report } from "@/lib/types";

const fixture = (sampleEnvelope as unknown as { report: Report }).report;

/** The same sealed run with a proven gate capping the band. */
function capped(report: Report): Report {
  const next = structuredClone(report) as ContractReport;
  next.headline = {
    ...next.headline,
    tier: "High",
    gate_capped: true,
    uncapped_tier: "Moderate",
    capped_by_gates: ["G1"],
  };
  return next as Report;
}

describe("site gate-cap disclosure", () => {
  it("the shared sentence names the gate, the cap, and the band the score earned", () => {
    const s = gateCapStatement(["G1"], "Moderate");
    expect(s).toContain("G1");
    expect(s).toContain("High");
    expect(s).toContain("Moderate");
  });

  it("states the cap beside the headline when a gate capped the verdict", () => {
    const html = renderToStaticMarkup(<ReportView report={capped(fixture)} title="Capped run" />);
    expect(html).toMatch(/Verdict capped at High/);
    expect(html).toContain("G1");
    // The score the cap displaced is still shown — the cap never hides the number.
    expect(html).toContain("Moderate");
    expect(html).toMatch(/score itself is unchanged/);
  });

  it("states no cap for a run nothing capped", () => {
    const html = renderToStaticMarkup(<ReportView report={fixture} title="Sample report" />);
    expect(html).not.toMatch(/Verdict capped/);
  });

  it("the sealed fixture carries no cap fields (guards against fixture drift)", () => {
    expect(fixture.headline.gate_capped).toBeUndefined();
    expect(fixture.headline.uncapped_tier).toBeUndefined();
  });
});

/**
 * Site suppression matrix (report-rendering / release-funnel): the site report
 * hero and its closing next step are one presentation state. A suppressed
 * report shows the verdict, coverage, and the measure paths — never a dial,
 * score, tier, CI band, or a `band=` link. A scored report keeps its band.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { SUPPRESSED_NEXT_STEP, assessmentNextStep } from "@leapscore/contracts";
import { ReportNextStep } from "@/components/report-next-step";
import { ReportView } from "@/components/report-view";
import sampleEnvelope from "@/lib/samples/maven-multi-module.json";
import type { Report } from "@/lib/types";

const scored = structuredClone(
  (sampleEnvelope as unknown as { report: Report }).report,
);
const suppressed = structuredClone(scored);
suppressed.headline = {
  ...suppressed.headline,
  suppressed: true,
  verdict: "insufficient-signal",
  ci_band: "band-must-not-render",
};
delete suppressed.next_band_path;

function suppressedReport(): Report {
  const clone = structuredClone(suppressed);
  // Ensure at least one measure path renders.
  if (!clone.full_table.some((r) => r.status === "unknown" && !r.not_applicable)) {
    clone.full_table = [
      ...clone.full_table,
      {
        id: "VEL-06",
        name: "History-derived signal",
        category_id: "VEL",
        status: "unknown",
        effort: "⚡",
        unknown_measure_path:
          "Needs git history — re-run with a full checkout.",
      },
    ];
  }
  return clone;
}

describe("4.3 site suppression matrix", () => {
  it("scored report renders the dial, the score, the band, and the band link", () => {
    const html = renderToStaticMarkup(<ReportView report={scored} title="Sample report" />);
    expect(html).toContain("system score");
    expect(html).toContain(String(scored.headline.score));
    expect(html).toContain(scored.headline.tier);
    expect(html).toContain(`href="${assessmentNextStep(scored.headline).url.replace(/&/g, "&amp;")}"`);
    expect(html).toContain("band=");
    expect(html).not.toContain("verdict=insufficient-signal");
    expect(html).not.toContain('data-testid="suppressed-verdict"');
  });

  it("suppressed report renders the verdict and measure paths, never a band CTA", () => {
    const report = suppressedReport();
    const html = renderToStaticMarkup(<ReportView report={report} title="Sample report" />);
    expect(html).toContain('data-testid="suppressed-verdict"');
    expect(html).toContain("insufficient signal");
    expect(html).toContain('data-testid="measure-paths"');
    expect(html).toContain(SUPPRESSED_NEXT_STEP);
    expect(html).toContain("verdict=insufficient-signal");
    expect(html).not.toContain("band=");
    // No dial, no headline number/tier, no ci_band as a verdict.
    expect(html).not.toContain("system score");
    expect(html).not.toContain("text-4xl");
    expect(html).not.toContain("band-must-not-render");
    expect(html).not.toContain("band=critical");
  });

  it("the closing band is the same state on both reports", () => {
    const scoredBand = renderToStaticMarkup(<ReportNextStep headline={scored.headline} />);
    const suppressedBand = renderToStaticMarkup(
      <ReportNextStep headline={suppressedReport().headline} />,
    );
    expect(scoredBand).toContain("band=");
    expect(scoredBand).not.toContain("verdict=");
    expect(suppressedBand).toContain("verdict=insufficient-signal");
    expect(suppressedBand).not.toContain("band=");
  });
});

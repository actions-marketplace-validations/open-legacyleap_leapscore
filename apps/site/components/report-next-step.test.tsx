import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  POSITIONING_LINE,
  assessmentNextStep,
  SUPPRESSED_NEXT_STEP,
} from "@leapscore/contracts";
import { ReportNextStep } from "@/components/report-next-step";
import { ReportView } from "@/components/report-view";
import { publicTierLabel } from "@/lib/scoring";
import sampleEnvelope from "@/lib/samples/maven-multi-module.json";
import type { Report } from "@/lib/types";

const fixture = (sampleEnvelope as unknown as { report: Report }).report;

function escaped(url: string): string {
  return url.replace(/&/g, "&amp;");
}

describe("site report next-step band", () => {
  it("renders sentence → tracked link → positioning line, all from contracts", () => {
    const html = renderToStaticMarkup(
      <ReportNextStep headline={{ tier: "Moderate" }} />,
    );
    const step = assessmentNextStep({ tier: "Moderate" });
    expect(html).toContain(step.sentence);
    expect(html).toContain(POSITIONING_LINE);
    expect(html).toContain(`href="${escaped(step.url)}"`);
    expect(html.indexOf(step.sentence)).toBeLessThan(html.indexOf("Continue to the assessment"));
    expect(html.indexOf("Continue to the assessment")).toBeLessThan(html.indexOf(POSITIONING_LINE));
    // tracked URL appears once — as the link target
    expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
  });

  it("uses the fixture headline's tracked link and closes the report body", () => {
    const step = assessmentNextStep(fixture.headline);
    const html = renderToStaticMarkup(<ReportView report={fixture} title="Sample report" />);
    expect(html).toContain(`href="${escaped(step.url)}"`);
    expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
    expect(html).toContain(step.sentence);
    // the positioning line is the report's final content: it follows the band
    // sentence and the report's own meta line
    expect(html.indexOf(POSITIONING_LINE)).toBeGreaterThan(html.indexOf(step.sentence));
    expect(html.indexOf(POSITIONING_LINE)).toBeGreaterThan(
      html.lastIndexOf(fixture.snapshot.rubric_version),
    );
    expect(html.trimEnd().endsWith("</p></section></div>")).toBe(true);
  });

  it("normalizes a legacy stored tier to the public band", () => {
    const legacy = publicTierLabel("Healthy");
    const html = renderToStaticMarkup(<ReportNextStep headline={{ tier: "Healthy" }} />);
    expect(legacy).toBe("Low");
    expect(html).toContain(assessmentNextStep({ tier: "Low" }).sentence);
    expect(html).toContain(escaped(assessmentNextStep({ tier: "Low" }).url));
    expect(html).not.toContain("band=healthy");
  });

  it("a suppressed headline renders the coverage-limit sentence and no band link", () => {
    const html = renderToStaticMarkup(
      <ReportNextStep headline={{ suppressed: true, verdict: "insufficient-signal", tier: "Critical" }} />,
    );
    expect(html).toContain(SUPPRESSED_NEXT_STEP);
    expect(html).not.toContain("band=");
    expect(html).not.toContain("band=critical");
    expect(html).toContain("verdict=insufficient-signal");
    expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
  });
});

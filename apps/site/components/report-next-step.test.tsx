import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  POSITIONING_LINE,
  assessmentCtaForBand,
  assessmentUrlForBand,
} from "@leapscore/contracts";
import { ReportNextStep } from "@/components/report-next-step";
import { ReportView } from "@/components/report-view";
import { publicTierLabel } from "@/lib/scoring";
import sampleEnvelope from "@/lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json";
import type { Report } from "@/lib/types";

const fixture = (sampleEnvelope as unknown as { report: Report }).report;

function escaped(url: string): string {
  return url.replace(/&/g, "&amp;");
}

describe("site report next-step band", () => {
  it("renders sentence → tracked link → positioning line, all from contracts", () => {
    const html = renderToStaticMarkup(<ReportNextStep tier="Moderate" score={58} />);
    const sentence = assessmentCtaForBand("Moderate");
    const url = assessmentUrlForBand("Moderate");
    expect(html).toContain(sentence);
    expect(html).toContain(POSITIONING_LINE);
    expect(html).toContain(`href="${escaped(url)}"`);
    expect(html.indexOf(sentence)).toBeLessThan(html.indexOf("Continue to the assessment"));
    expect(html.indexOf("Continue to the assessment")).toBeLessThan(html.indexOf(POSITIONING_LINE));
    // tracked URL appears once — as the link target
    expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
  });

  it("uses the fixture tier's tracked link and closes the report body", () => {
    expect(fixture.headline.tier).toBe("Moderate");
    const html = renderToStaticMarkup(<ReportView report={fixture} title="Sample report" />);
    const url = assessmentUrlForBand(fixture.headline.tier);
    expect(html).toContain(`href="${escaped(url)}"`);
    expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
    expect(html).toContain(assessmentCtaForBand("Moderate"));
    // the positioning line is the report's final content: it follows the band
    // sentence and the report's own meta line
    expect(html.indexOf(POSITIONING_LINE)).toBeGreaterThan(
      html.indexOf(assessmentCtaForBand("Moderate")),
    );
    expect(html.indexOf(POSITIONING_LINE)).toBeGreaterThan(
      html.lastIndexOf(fixture.snapshot.rubric_version),
    );
    expect(html.trimEnd().endsWith("</p></section></div>")).toBe(true);
  });

  it("normalizes a legacy stored tier to the public band", () => {
    const legacy = publicTierLabel("Healthy");
    const html = renderToStaticMarkup(<ReportNextStep tier="Healthy" score={88} />);
    expect(legacy).toBe("Low");
    expect(html).toContain(assessmentCtaForBand("Low"));
    expect(html).toContain(escaped(assessmentUrlForBand("Low")));
    expect(html).not.toContain("band=healthy");
  });
});

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { bandPathBlock, type NextBandPath } from "@leapscore/contracts";
import { BandPath } from "@/components/band-path";
import { ReportView } from "@/components/report-view";
import sampleEnvelope from "@/lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json";
import type { Report } from "@/lib/types";

const fixture = (sampleEnvelope as unknown as { report: Report }).report;
const fixturePath = fixture.next_band_path as NextBandPath;
const fixtureBlock = bandPathBlock(fixturePath, {
  tier: fixture.headline.tier,
  score: fixture.headline.score,
});

describe("site next-band path block", () => {
  it("renders the persisted run's destination, distance, classes, arrival, and unreached count", () => {
    expect(fixturePath.destination).toBe("Low");
    expect(fixturePath.threshold).toBe(80);
    expect(fixturePath.points_needed).toBe(22);

    const html = renderToStaticMarkup(<ReportView report={fixture} title="Sample report" />);

    // destination and distance, straight from the shared block model
    expect(html).toContain(fixtureBlock.heading);
    expect(html).toContain(fixtureBlock.statement);
    expect(html).toContain("Reach Low — 22pp needed (band floor 80, sealed 58).");

    // each class's label, effort, totals, cumulative arrival, and its steps
    expect(fixtureBlock.classes.length).toBeGreaterThan(0);
    for (const c of fixtureBlock.classes) {
      expect(html).toContain(c.label);
      expect(html).toContain(c.effort);
      expect(html).toContain(`${c.total} · cumulative ${c.cumulative}`);
      expect(html).toContain(c.arrival);
      for (const s of c.steps) {
        expect(html).toContain(`href="#row-${s.row}"`);
        expect(html).toContain(s.pp);
      }
    }
    // honest arrival is rendered, not smoothed: sprint crosses alone, quarter
    // still names its combined-only arrival
    expect(fixtureBlock.classes[0].arrival).toContain("Sprint alone reaches Low");
    expect(fixtureBlock.classes[1].arrival).toBe(
      "Quarter crosses only with the classes before it",
    );

    // unreached-row disclosure and the stated assumption
    expect(html).toContain(fixtureBlock.unreached as string);
    expect(html).toContain(
      `${fixturePath.unreached_rows} rows could not be reached by this path (unknown or not implemented).`,
    );
    expect(html).toContain(fixtureBlock.assumption);
  });

  it("renders steps only from the persisted run's graded rows", () => {
    const graded = new Set(
      (fixture.full_table ?? [])
        .filter(
          (r) =>
            (r.status === "measured" || r.status === "estimated") &&
            typeof r.score === "number" &&
            r.score >= 0 &&
            r.score <= 2,
        )
        .map((r) => r.id),
    );
    const steps = fixturePath.classes.flatMap((c) => c.steps);
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) expect(graded.has(s.row)).toBe(true);

    const html = renderToStaticMarkup(<BandPath path={fixturePath} tier="Moderate" score={58} />);
    const hrefs = [...html.matchAll(/href="#row-([A-Z]+-\d+)"/g)].map((m) => m[1]);
    expect(hrefs).toHaveLength(steps.length);
    expect(new Set(hrefs)).toEqual(new Set(steps.map((s) => s.row)));
  });

  it("positions the block after the top risks and before the per-deduction detail", () => {
    const html = renderToStaticMarkup(<ReportView report={fixture} title="Sample report" />);
    const risks = html.indexOf("Top restore-levers");
    const block = html.indexOf(fixtureBlock.heading);
    const detail = html.indexOf("Category scorecard");
    expect(risks).toBeGreaterThan(-1);
    expect(block).toBeGreaterThan(risks);
    expect(block).toBeLessThan(detail);
  });

  it("renders a terminal path as a statement with no destination or steps", () => {
    const terminal: NextBandPath = {
      destination: null,
      threshold: null,
      points_needed: null,
      classes: [],
      unreached_rows: 3,
      terminal: true,
    };
    const html = renderToStaticMarkup(<BandPath path={terminal} tier="Low" score={85} />);
    expect(html).toContain("Already at the highest band (Low) — no next band to reach.");
    expect(html).not.toContain("Reach ");
    expect(html).not.toContain("<li");
    expect(html).toContain("3 rows could not be reached by this path (unknown or not implemented).");
  });

  it("renders the shortfall explicitly when no class reaches the destination", () => {
    const stunted: NextBandPath = {
      destination: "Moderate",
      threshold: 53,
      points_needed: 5,
      classes: [
        { class: "sprint", pp: 2, cumulative_pp: 2, arrival: "not-reached", steps: [
          { row: "SEC-01", name: "Auth", recoverable_pp: 2, effort: "⚡ ≤30 min" },
        ] },
      ],
      unreached_rows: 4,
      terminal: false,
    };
    const html = renderToStaticMarkup(<BandPath path={stunted} tier="High" score={48} />);
    const block = bandPathBlock(stunted, { tier: "High", score: 48 });
    expect(block.shortfall).not.toBeNull();
    expect(html).toContain(block.shortfall as string);
    expect(html).toContain("3pp short, and 4 rows this path could not reach would have to be graded first");
    expect(html).toContain("Sprint stays short of Moderate");
  });

  it("renders no block at all when the report carries no path", () => {
    expect(renderToStaticMarkup(<BandPath path={undefined} tier="Moderate" score={58} />)).toBe("");
    const noPath: Report = { ...fixture, next_band_path: undefined };
    const html = renderToStaticMarkup(<ReportView report={noPath} title="Sample report" />);
    expect(html).not.toContain(fixtureBlock.heading);
    expect(html).toContain("Top restore-levers");
  });
});

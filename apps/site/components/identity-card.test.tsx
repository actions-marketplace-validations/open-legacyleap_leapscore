/** report-identity 5.1–5.8 — the identity card on the site: contents, placement,
 * commit forms, sample marker, absent/suppressed degradation, and the live page. */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { IdentityCard } from "@/components/identity-card";
import { ReportView } from "@/components/report-view";
import { SealedLiveReport } from "@/app/live/LiveReportClient";
import { SAMPLE_IDENTITY } from "@/lib/sample";
import sampleEnvelope from "@/lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json";
import type { Report } from "@/lib/types";

const fixture = structuredClone((sampleEnvelope as unknown as { report: Report }).report);

/** The card's own markup, isolated from the rest of the report. */
function cardHtml(report: Report): string {
  const html = renderToStaticMarkup(<IdentityCard report={report} />);
  return html;
}

function withoutIdentity(report: Report): Report {
  const next = structuredClone(report);
  delete next.identity;
  return next;
}

describe("5.1 the card renders the sealed block through the contract helpers", () => {
  it("states subject, shape, size, and stack", () => {
    const html = cardHtml(fixture);
    expect(html).toContain("django/django");
    expect(html).toContain("commit 506fc82");
    expect(html).toContain("2026-08-12T00:00:00Z");
    // Size: measured counts, one approximated magnitude from the contract helper.
    expect(html).toContain("3128");
    expect(html).toContain("412");
    expect(html).toContain("~420k");
    expect(html).not.toContain("420000");
    expect(html).toContain("source-v1");
    expect(html).toContain("sampled 40 of 1247 files");
    // Stack: shares, primary language, ecosystems, framework names only.
    expect(html).toContain("primary");
    expect(html).toContain("Python");
    expect(html).toContain("72%");
    expect(html).toContain("ecosystems: js, py");
    expect(html).toContain("frameworks: Django");
    expect(html).not.toMatch(/Django\s+\d/);
  });

  it("renders the fixture's unknown stage as not measured with its reason", () => {
    const html = cardHtml(fixture);
    expect(html).toMatch(/archetype not measured — authored sample/);
  });

  it("has no filesystem or scanner access of its own", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./identity-card.tsx", import.meta.url), "utf8"),
    );
    expect(source).not.toMatch(/node:fs|node:child_process|apps\/scanner|@leapscore\/scanner/);
  });
});

describe("5.2 / 5.3 / 5.4 placement, commit identity, and the retained chip", () => {
  const withChip = (): Report => {
    const next = structuredClone(fixture);
    next.snapshot.archetype = "service";
    next.snapshot.archetype_confidence = "medium";
    next.snapshot.scanned_commit = "abc1234567890";
    next.identity = {
      ...structuredClone(SAMPLE_IDENTITY),
      shape: { status: "measured", archetype: "service", confidence: "medium" },
    };
    return next;
  };

  it("places the card above the headline and provenance after the full table", () => {
    const html = renderToStaticMarkup(<ReportView report={withChip()} title="Report" />);
    const card = html.indexOf('data-testid="identity-card"');
    const headline = html.indexOf("system score");
    const fullTable = html.indexOf("All 102 indicators");
    const provenance = html.indexOf('data-testid="provenance-band"');
    expect(card).toBeGreaterThanOrEqual(0);
    expect(card).toBeLessThan(headline);
    expect(provenance).toBeGreaterThan(fullTable);
    // No provenance value precedes the headline.
    for (const marker of ["SCHEMA", "RUBRIC", "ENGINE", "SCAN TIME"]) {
      expect(html.indexOf(marker)).toBeGreaterThan(headline);
    }
  });

  it("links commit <short7> when the repo is a GitHub slug and the sha is known", () => {
    const html = renderToStaticMarkup(<IdentityCard report={withChip()} />);
    expect(html).toContain("commit abc1234");
    expect(html).toContain('href="https://github.com/django/django/commit/abc1234567890"');
  });

  it("renders commit unknown as plain text with no link", () => {
    const next = withChip();
    next.snapshot.scanned_commit = "unknown";
    next.identity = { ...next.identity!, subject: { ...next.identity!.subject, commit: "unknown" } };
    const html = renderToStaticMarkup(<IdentityCard report={next} />);
    expect(html).toContain("commit unknown");
    expect(html).not.toContain("/commit/");
  });

  it("retains the archetype chip and reads the same sealed value as the card", () => {
    const report = withChip();
    const html = renderToStaticMarkup(<ReportView report={report} title="Report" />);
    expect(html).toContain("Detected: service");
    const card = html.slice(html.indexOf('data-testid="identity-card"'), html.indexOf("system score"));
    expect(card).toContain(">service<");
    // One source: the card's archetype is the chip's archetype.
    expect(report.identity?.shape.archetype).toBe(report.snapshot.archetype);
  });
});

describe("7.1 the committed fixture and the sample agree, and one card shows all three forms", () => {
  it("the fixture's identity block deep-equals the sample constant", () => {
    expect((sampleEnvelope as unknown as { report: { identity: unknown } }).report.identity).toEqual(
      SAMPLE_IDENTITY,
    );
  });

  it("the fixture block typechecks as a ReportIdentity", async () => {
    const { identityValueLabel } = await import("@leapscore/contracts");
    const id = fixture.identity!;
    expect(["measured", "estimated", "unknown"]).toContain(id.size.status);
    expect(id.size.lines?.status).toBe("estimated");
    expect(identityValueLabel(id.size.lines!)).toBe("~420k");
    expect(id.stack.languages[0]).toMatchObject({ name: "Python" });
  });

  it("renders measured, estimated, and unknown forms in one card", () => {
    const html = cardHtml(fixture);
    // measured: a counted value, no approximation marker
    expect(html).toContain("3128");
    // estimated: the marker, derived at render
    expect(html).toContain("~420k");
    // unknown: stated as not measured with its reason
    expect(html).toMatch(/archetype not measured — authored sample/);
  });
});

describe("5.5 / 5.6 / 5.7 sample, absent block, and suppression", () => {
  it("states the sample marker as the card's first line", () => {
    const html = cardHtml(fixture);
    const card = html.slice(html.indexOf('data-testid="identity-card"'));
    expect(card).toMatch(/Illustrative sample/);
    expect(card.indexOf("Illustrative sample")).toBeLessThan(card.indexOf("commit 506fc82"));
  });

  it("renders no card and no error for a pre-change envelope", () => {
    const report = withoutIdentity(fixture);
    // A pre-change envelope still states its commit in the receipt.
    report.snapshot.scanned_commit = "506fc82";
    const html = renderToStaticMarkup(<ReportView report={report} title="Old run" />);
    expect(html).not.toContain('data-testid="identity-card"');
    expect(html).not.toMatch(/Illustrative sample/);
    // The report is otherwise intact: verdict and evidence still render.
    expect(html).toContain("system score");
    expect(html).toContain("All 102 indicators");
    // With no card to state the commit, the provenance receipt keeps it.
    expect(html).toContain("COMMIT");
    expect(html).toContain("506fc82");
  });

  it("renders the card in full when the headline is suppressed", () => {
    const report = structuredClone(fixture);
    report.headline = {
      ...report.headline,
      suppressed: true,
      verdict: "insufficient-signal",
      ci_band: "insufficient-signal",
    };
    const html = renderToStaticMarkup(<ReportView report={report} title="Suppressed run" />);
    expect(html).toContain('data-testid="identity-card"');
    expect(html).toContain("~420k");
    expect(html).toContain("3128");
  });
});

describe("5.8 the live page puts the same card above the revealed headline", () => {
  it("renders the subject band first in the revealed state", () => {
    const html = renderToStaticMarkup(
      <SealedLiveReport
        report={fixture}
        traces={[]}
        elapsedMs={1_200}
        indicatorCount={31}
        runId="django__django__506fc82__2026-08-12T000000-000Z"
      />,
    );
    const card = html.indexOf('data-testid="identity-card"');
    const headline = html.indexOf("system score");
    expect(card).toBeGreaterThanOrEqual(0);
    expect(card).toBeLessThan(headline);
    // No provenance value is chrome above the headline, and no duplicated
    // "Detected:" line stands in for the card.
    expect(html).not.toContain("Detected:");
    expect(html.indexOf("SCHEMA")).toBeGreaterThan(headline);
    // The repo title appears once: the report body owns it, not the header.
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
  });
});

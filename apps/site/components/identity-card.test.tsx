/** report-identity 5.1–5.8 — the identity card on the site: contents, placement,
 * commit forms, sample marker, absent/suppressed degradation, and the live page.
 * The committed sample is a real v1.0.2 scan of the checked-in synthetic Maven
 * fixture, so every value below is read from that envelope. */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { IdentityCard } from "@/components/identity-card";
import { ReportView } from "@/components/report-view";
import { SealedLiveReport } from "@/app/live/LiveReportClient";
import sampleEnvelope from "@/lib/fixtures/maven-multi-module__bce7fc0__2026-11-12T155107-061Z.json";
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
  it("states subject, shape, size, and stack from the sealed scan", () => {
    const html = cardHtml(fixture);
    expect(html).toContain("maven-multi-module");
    expect(html).toContain("commit bce7fc0");
    expect(html).toContain("2026-11-12T15:51:07.061Z");
    // Size: measured counts and a measured line magnitude (no approximation marker).
    expect(html).toContain("10");
    expect(html).toContain("30");
    expect(html).toContain("64");
    expect(html).not.toContain("~64");
    expect(html).toContain("source-v1");
    expect(html).toContain("measured");
    // Stack: shares, primary language, ecosystems, framework names only.
    expect(html).toContain("primary");
    expect(html).toContain("Java");
    expect(html).toContain("100%");
    expect(html).toContain("ecosystems: java");
    expect(html).toContain("frameworks: Spring");
    expect(html).not.toMatch(/Spring\s+\d/);
  });

  it("renders the measured shape through the one sealed archetype", () => {
    const html = cardHtml(fixture);
    expect(html).toContain("mixed");
    expect(html).toContain("(low)");
    expect(html).toContain("planes: server · test");
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
      ...structuredClone(fixture.identity!),
      subject: { ...fixture.identity!.subject, repo: "acme/claims", commit: "abc1234567890" },
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
    expect(html).toContain('href="https://github.com/acme/claims/commit/abc1234567890"');
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

describe("7.1 the committed sample's identity is the sealed one", () => {
  it("the fixture's identity subject is the scanned directory name", () => {
    expect(fixture.identity?.subject.repo).toBe(fixture.snapshot.repo);
    expect(fixture.identity?.subject.repo).toBe("maven-multi-module");
    expect(fixture.identity?.subject.commit).toBe("bce7fc006329ffc4ed69d80b6175cbe265a3d901");
  });

  it("the fixture block typechecks as a ReportIdentity", async () => {
    const { identityValueLabel } = await import("@leapscore/contracts");
    const id = fixture.identity!;
    expect(["measured", "estimated", "unknown"]).toContain(id.size.status);
    expect(id.size.lines?.status).toBe("measured");
    expect(identityValueLabel(id.size.lines!)).toBe("64");
    expect(id.stack.languages[0]).toMatchObject({ name: "Java" });
  });
});

describe("5.5 / 5.6 / 5.7 sample, absent block, and suppression", () => {
  it("states the sample marker as the card's first line", () => {
    const html = cardHtml(fixture);
    const card = html.slice(html.indexOf('data-testid="identity-card"'));
    expect(card).toMatch(/Illustrative sample/);
    expect(card.indexOf("Illustrative sample")).toBeLessThan(card.indexOf("commit bce7fc0"));
  });

  it("renders no card and no error for a pre-change envelope", () => {
    const report = withoutIdentity(fixture);
    // A pre-change envelope still states its commit in the receipt.
    report.snapshot.scanned_commit = "bce7fc0";
    const html = renderToStaticMarkup(<ReportView report={report} title="Old run" />);
    expect(html).not.toContain('data-testid="identity-card"');
    expect(html).not.toMatch(/Illustrative sample/);
    // The report is otherwise intact: verdict and evidence still render.
    expect(html).toContain("system score");
    expect(html).toContain("All 102 indicators");
    // With no card to state the commit, the provenance receipt keeps it.
    expect(html).toContain("COMMIT");
    expect(html).toContain("bce7fc0");
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
    expect(html).toContain("64");
    expect(html).toContain("10");
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
        runId="maven-multi-module__bce7fc0__2026-11-12T155107-061Z"
      />,
    );
    const card = html.indexOf('data-testid="identity-card"');
    const headline = html.indexOf("system score");
    expect(card).toBeGreaterThanOrEqual(0);
    expect(card).toBeLessThan(headline);
    // The card and the chip both derive from the same sealed archetype; the
    // live page adds no second "Detected:" line of its own.
    expect(html.match(/Detected:/g) ?? []).toHaveLength(1);
    expect(html.indexOf("SCHEMA")).toBeGreaterThan(headline);
    // The repo title appears once: the report body owns it, not the header.
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
  });
});

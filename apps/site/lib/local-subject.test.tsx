/**
 * Local subject portability on the site (scan-local / report-identity): the
 * committed local sample names the directory, and a nested subject renders its
 * basename with no absolute path on any human-readable surface.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ReportView } from "@/components/report-view";
import { IdentityCard } from "@/components/identity-card";
import sampleEnvelope from "@/lib/fixtures/maven-multi-module__bce7fc0__2026-11-12T155107-061Z.json";
import type { Report } from "@/lib/types";

const fixture = structuredClone(
  (sampleEnvelope as unknown as { report: Report }).report,
);

describe("4.4 local subject renders as a name", () => {
  it("the committed sample's subject carries no absolute path or file URL", () => {
    expect(fixture.snapshot).not.toHaveProperty("local_path");
    expect(fixture.snapshot.repo).not.toContain("/");
    expect(fixture.snapshot.repo).not.toContain("file://");
    if (fixture.identity) {
      expect(fixture.identity.subject.repo).toBe(fixture.snapshot.repo);
      expect(fixture.identity.subject.repo).not.toContain("/");
    }
  });

  it("renders a nested subject by its basename, with no machine path", () => {
    const nested = structuredClone(fixture);
    nested.snapshot.repo = "claims-core";
    if (nested.identity) nested.identity.subject.repo = "claims-core";
    const html = renderToStaticMarkup(<ReportView report={nested} title="Sample report" />);
    const card = renderToStaticMarkup(<IdentityCard report={nested} />);
    for (const surface of [html, card]) {
      expect(surface).toContain("claims-core");
      expect(surface).not.toContain("file://");
      expect(surface).not.toMatch(/\/Users\//);
      expect(surface).not.toMatch(/[A-Za-z]:\\\\/);
    }
  });
});

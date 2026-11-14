import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CONTRACT_VERSION, DELTA_DOCUMENT } from "@leapscore/contracts";
import SampleDetailPage from "@/app/samples/[slug]/page";
import { ScanTraceView } from "@/components/scan-trace-view";
import {
  getSample,
  inspectSampleDocuments,
  listSamples,
  slugFromFileName,
} from "@/lib/samples";
import sampleEnvelope from "@/lib/samples/maven-multi-module.json";
import { samplesManifestSource } from "../scripts/build-samples-manifest";

function envelope(ranAt: string): Record<string, unknown> {
  const document = JSON.parse(JSON.stringify(sampleEnvelope)) as Record<string, unknown>;
  (document.meta as Record<string, unknown>).ranAt = ranAt;
  return document;
}

describe("sample slug derivation", () => {
  it("derives the URL from the stable file name", () => {
    expect(slugFromFileName("maven-multi-module.json")).toBe("maven-multi-module");
    expect(slugFromFileName("second-sample.json")).toBe("second-sample");
  });

  it("rejects names that are not lowercase kebab-case json files", () => {
    expect(slugFromFileName("Maven.json")).toBeNull();
    expect(slugFromFileName("maven_sample.json")).toBeNull();
    expect(slugFromFileName("with space.json")).toBeNull();
    expect(slugFromFileName("maven-multi-module.txt")).toBeNull();
  });
});

describe("committed sample set", () => {
  it("lists the committed sealed envelope", () => {
    const samples = listSamples();
    expect(samples).toHaveLength(1);
    expect(samples[0].slug).toBe("maven-multi-module");
    expect(samples[0].envelope.meta.repo).toBe("maven-multi-module");
    expect(samples[0].envelope.report.headline.score).toBe(5.71);
    expect(samples[0].envelope.report.headline.tier).toBe("Critical");
    expect(Array.isArray(samples[0].envelope.trace)).toBe(true);
  });

  it("resolves a sample by slug and an unknown slug to nothing", () => {
    expect(getSample("maven-multi-module")?.fileName).toBe("maven-multi-module.json");
    expect(getSample("does-not-exist")).toBeNull();
  });

  it("orders by sealed ranAt descending, then slug", () => {
    const { samples } = inspectSampleDocuments([
      { fileName: "older.json", document: envelope("2026-01-01T00:00:00.000Z") },
      { fileName: "newer.json", document: envelope("2026-02-01T00:00:00.000Z") },
      { fileName: "a-tie.json", document: envelope("2026-02-01T00:00:00.000Z") },
    ]);
    expect(samples.map((sample) => sample.slug)).toEqual([
      "a-tie",
      "newer",
      "older",
    ]);
  });
});

describe("invalid committed documents fail loudly", () => {
  it("records a non-envelope document", () => {
    const { samples, issues } = inspectSampleDocuments([
      { fileName: "broken.json", document: { hello: "world" } },
    ]);
    expect(samples).toEqual([]);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toBe("not-an-envelope");
  });

  it("records a delta document as a non-envelope", () => {
    const { issues } = inspectSampleDocuments([
      {
        fileName: "delta.json",
        document: {
          document: DELTA_DOCUMENT,
          delta_schema: 1,
          baseline: {},
          current: {},
          verdict: {},
          rows: [],
          transitions: [],
        },
      },
    ]);
    expect(issues[0].reason).toBe("delta-document");
    expect(issues[0].detail).toContain(DELTA_DOCUMENT);
  });

  it("records an unsupported contract version", () => {
    const future = envelope("2026-03-01T00:00:00.000Z");
    (future.meta as Record<string, unknown>).contractVersion = CONTRACT_VERSION + 1;
    future.contractVersion = CONTRACT_VERSION + 1;
    const { issues } = inspectSampleDocuments([
      { fileName: "future.json", document: future },
    ]);
    expect(issues[0].reason).toBe("unsupported-contract-version");
    expect(issues[0].detail).toContain(String(CONTRACT_VERSION + 1));
  });

  it("refuses to list a set containing an invalid document", () => {
    expect(() =>
      listSamples([{ fileName: "broken.json", document: { hello: "world" } }]),
    ).toThrow(/not-an-envelope/);
  });
});

describe("adding a sample needs no route change", () => {
  it("the directory listing becomes the manifest for every committed file", () => {
    const source = samplesManifestSource([
      "maven-multi-module.json",
      "second-sample.json",
    ]);
    expect(source).toContain('import sample0 from "../samples/maven-multi-module.json";');
    expect(source).toContain('import sample1 from "../samples/second-sample.json";');
    expect(source).toContain('{ fileName: "maven-multi-module.json"');
    expect(source).toContain('{ fileName: "second-sample.json"');
  });

  it("a second envelope is listed and addressable by its own slug", () => {
    const { samples } = inspectSampleDocuments([
      { fileName: "maven-multi-module.json", document: envelope("2026-01-01T00:00:00.000Z") },
      { fileName: "second-sample.json", document: envelope("2026-02-01T00:00:00.000Z") },
    ]);
    expect(samples.map((sample) => sample.slug)).toEqual([
      "second-sample",
      "maven-multi-module",
    ]);
  });

  it("the detail route derives every static path from the sample set", async () => {
    const { generateStaticParams } = await import("@/app/samples/[slug]/page");
    expect(generateStaticParams()).toEqual(
      listSamples().map((sample) => ({ slug: sample.slug })),
    );
  });
});

describe("sample detail reuses the sealed report presentation", () => {
  it("renders the sealed score, provenance, and no removed history path", async () => {
    const html = renderToStaticMarkup(
      await SampleDetailPage({
        params: Promise.resolve({ slug: "maven-multi-module" }),
      }),
    );
    expect(html).toContain("Illustrative sample");
    expect(html).toContain("5.71");
    expect(html).not.toContain('href="/reports');
  });

  it("names the envelope's own engine and rubric versions before the first score", async () => {
    const html = renderToStaticMarkup(
      await SampleDetailPage({
        params: Promise.resolve({ slug: "maven-multi-module" }),
      }),
    );
    const engine = sampleEnvelope.report.snapshot.engine_version;
    const rubric = sampleEnvelope.report.snapshot.rubric_version;
    const firstScore = html.indexOf(String(sampleEnvelope.report.headline.score));
    expect(firstScore).toBeGreaterThan(-1);
    expect(html.indexOf(engine)).toBeGreaterThan(-1);
    expect(html.indexOf(rubric)).toBeGreaterThan(-1);
    expect(html.indexOf(engine)).toBeLessThan(firstScore);
    expect(html.indexOf(rubric)).toBeLessThan(firstScore);
  });

  it("degrades an absent trace to an empty scan log", () => {
    const html = renderToStaticMarkup(createElement(ScanTraceView, { trace: [] }));
    expect(html).toBe("");
  });
});

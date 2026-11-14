import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SAMPLE_FILES, SAMPLE_ROW_INDEX } from "./generated/samples";
import {
  sampleRowIndex,
  samplesManifestSource,
} from "../scripts/build-samples-manifest";
import { firstRowLink } from "./rubric-index";

const SAMPLES = join(process.cwd(), "lib", "samples");

describe("generated sample row index (design D6)", () => {
  it("is deterministic across runs", () => {
    const files = readdirSync(SAMPLES)
      .filter((fileName) => fileName.endsWith(".json"))
      .sort();
    const documents = files.map((fileName) => ({
      fileName,
      document: JSON.parse(readFileSync(join(SAMPLES, fileName), "utf-8")),
    }));
    const first = samplesManifestSource(files, documents);
    const second = samplesManifestSource(files, documents);
    expect(first).toBe(second);
    expect(
      readFileSync(join(process.cwd(), "lib", "generated", "samples.ts"), "utf-8"),
    ).toBe(first);
    expect(sampleRowIndex(documents)).toEqual(SAMPLE_ROW_INDEX);
  });

  it("indexes every row a committed envelope carries", () => {
    for (const sample of SAMPLE_FILES) {
      const rows = (sample.document as { report?: { full_table?: unknown[] } })
        .report?.full_table;
      expect(Array.isArray(rows)).toBe(true);
      for (const row of rows as Array<{ id?: string }>) {
        if (!row.id) continue;
        const link = firstRowLink(SAMPLE_ROW_INDEX, row.id);
        expect(link, `${row.id} has no sample row entry`).not.toBeNull();
        expect(link?.slug).toBe(sample.fileName.replace(/\.json$/, ""));
        expect(link?.anchor).toBe(`row-${row.id}`);
      }
    }
  });

  it("a row with no committed evidence renders no link", () => {
    expect(firstRowLink(SAMPLE_ROW_INDEX, "ARCH-02")).not.toBeNull();
    expect(firstRowLink({}, "ARCH-02")).toBeNull();
  });
});

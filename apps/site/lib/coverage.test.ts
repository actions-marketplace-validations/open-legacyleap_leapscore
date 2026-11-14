import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import {
  COVERAGE_ENGINE_VERSION,
  COVERAGE_INDICATOR_IDS,
  COVERAGE_TOTAL,
  isIndicatorImplemented,
} from "./generated/coverage";
import { INDICATOR_REGISTRY } from "./generated/rubric";
import {
  buildCoverageManifest,
  mapDetectorFiles,
} from "../scripts/build-coverage-manifest";
import {
  assertCoverageClaimVersion,
  coverageClaim,
} from "./coverage-claim";

const DETECTORS = join(process.cwd(), "..", "scanner", "src", "scan", "detectors");

describe("generated coverage manifest (design D5)", () => {
  it("matches the shipped detector tree, so a rename fails here", () => {
    const ids = mapDetectorFiles(readdirSync(DETECTORS));
    expect(ids).toHaveLength(31);
    expect([...COVERAGE_INDICATOR_IDS].sort()).toEqual(ids);
  });

  it("names only indicators the compiled rubric knows", () => {
    for (const id of COVERAGE_INDICATOR_IDS) {
      expect(INDICATOR_REGISTRY[id]).toBeDefined();
    }
    expect(COVERAGE_TOTAL).toBe(Object.keys(INDICATOR_REGISTRY).length);
    expect(COVERAGE_ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("fails loudly for a detector file it cannot map", () => {
    expect(() => mapDetectorFiles(["arch1.ts"])).toThrow(
      /not <code><NN>\.ts/,
    );
  });

  it("fails loudly when the detector directory is missing", () => {
    expect(() => buildCoverageManifest("/definitely/not/a/detector/tree")).toThrow(
      /missing/,
    );
  });

  it("exposes an implementation predicate", () => {
    expect(isIndicatorImplemented("ARCH-01")).toBe(true);
    expect(isIndicatorImplemented("ARCH-02")).toBe(false);
  });
});

describe("coverage claim (design D5)", () => {
  it("composes the versioned sentence from the manifest", () => {
    const claim = coverageClaim();
    expect(claim.version).toBe(COVERAGE_ENGINE_VERSION);
    expect(claim.count).toBe(COVERAGE_INDICATOR_IDS.length);
    expect(claim.total).toBe(COVERAGE_TOTAL);
    expect(claim.sentence).toContain(`${claim.count} of ${COVERAGE_TOTAL}`);
    expect(claim.sentence).toContain(claim.version);
    expect(claim.sentence).toContain(claim.date);
  });

  it("fails the build when the hand-maintained version drifts", () => {
    expect(() => assertCoverageClaimVersion("9.9.9", "1.0.2")).toThrow(
      /9\.9\.9.*1\.0\.2/,
    );
  });
});

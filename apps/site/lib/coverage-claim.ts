/**
 * The one public sentence about shipped detector coverage (design D5).
 *
 * The count and the engine version come from `lib/generated/coverage.ts`, which
 * `scripts/build-coverage-manifest.ts` derives from the shipped detector tree and
 * the scanner package manifest. Only the release date is hand-maintained here, and
 * the claim version is asserted against the generated manifest so a release that
 * forgets this copy fails the build instead of drifting silently.
 */
import {
  COVERAGE_ENGINE_VERSION,
  COVERAGE_INDICATOR_IDS,
  COVERAGE_TOTAL,
} from "./generated/coverage";

/** The engine version this copy was written for. Asserted against the manifest. */
export const COVERAGE_CLAIM_VERSION = "1.0.2";

/** The release date this copy was written for. The one hand-maintained token. */
export const COVERAGE_CLAIM_DATE = "14 Nov 2026";

export type CoverageClaim = {
  version: string;
  date: string;
  count: number;
  total: number;
  /** Union sentence: detectors that ship, out of the rubric denominator. */
  sentence: string;
};

/** Fail when the hand-maintained claim version disagrees with the generated manifest. */
export function assertCoverageClaimVersion(
  claimVersion: string,
  manifestVersion: string,
): void {
  if (claimVersion !== manifestVersion) {
    throw new Error(
      `coverage claim version ${claimVersion} does not match generated manifest engine version ${manifestVersion} — regenerate lib/generated/coverage.ts or update the claim`,
    );
  }
}

/** Compose the versioned coverage claim, asserting the copy matches the release. */
export function coverageClaim(): CoverageClaim {
  assertCoverageClaimVersion(COVERAGE_CLAIM_VERSION, COVERAGE_ENGINE_VERSION);
  const count = COVERAGE_INDICATOR_IDS.length;
  return {
    version: COVERAGE_CLAIM_VERSION,
    date: COVERAGE_CLAIM_DATE,
    count,
    total: COVERAGE_TOTAL,
    sentence: `${count} of ${COVERAGE_TOTAL} indicators have a detector in this release (engine ${COVERAGE_CLAIM_VERSION}, ${COVERAGE_CLAIM_DATE}).`,
  };
}

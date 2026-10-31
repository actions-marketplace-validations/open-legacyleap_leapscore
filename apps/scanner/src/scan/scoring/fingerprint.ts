/** apps/scanner/src/scan/scoring/fingerprint.ts — deterministic score fingerprint (deterministic-scoring 2.2) */
import { createHash } from 'node:crypto';
import type { FactRecord } from '../facts';

/** Fingerprint scheme version — bump when the hash input changes eras.
 * v2 (detector-honesty 4.4): measurement semantics — `measurement` +
 * `unknownMeasurePath` join the normalized fact, so a pre-demotion constant row
 * and a post-demotion unknown row hash differently.
 * v3 (release-packaging D4): engine identity source — `engine_version` is the
 * release version build-stamped into the artifact (package version, or the
 * `unofficial-build` disclosure), no longer the `'unified/1.0'` source literal.
 * Pre/post-change fingerprints are not comparable (measurement-honesty era rule). */
export const FINGERPRINT_VERSION = 3;

type FingerprintInput = {
  facts: FactRecord[];
  rubricVersion: string;
  engineVersion: string;
  engineSha7: string;
  snapshotVersions?: Record<string, unknown>;
  strict: boolean;
  indicatorSet: string[];
  archetype: string;
  scorePolicy?: string;
};

/** Stable stringify: sorted object keys, arrays in order. */
export function stableStringify(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (typeof v === 'object') {
    const keys = Object.keys(v as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(',')}}}`;
  }
  const s = JSON.stringify(v);
  return s === undefined ? 'null' : s;
}

function normalizedFact(f: FactRecord): unknown {
  const rec = f as unknown as Record<string, unknown>;
  const prov = (rec.provenance as Record<string, unknown> | undefined) ?? {};
  const { durationMs: _drop, ...provRest } = prov;
  void _drop;
  return {
    detectorId: rec.detectorId,
    schemaVersion: rec.schemaVersion,
    facts: rec.facts,
    evidencePointers: rec.evidencePointers,
    provenance: provRest,
    truncated: rec.truncated,
    error: (rec as { error?: unknown }).error ?? null,
    // v2: the detector's measurement verdict and its what-it-takes note are
    // semantic (measured vs estimated vs unknown), never a machine artifact.
    measurement: rec.measurement ?? null,
    unknownMeasurePath: rec.unknownMeasurePath ?? null,
  };
}

/**
 * SHA-256 over the scored payload only. Excluded per run: runId, scanned_at,
 * durations, trace timings, machine identity. Included: sorted facts (timings
 * normalized out), rubric/engine versions, resolved release engine identity
 * (post-2.3 release-derived, never consumer-tree), per-detector tool versions
 * (via fact provenance), snapshot versions, and semantic flags.
 */
export function computeScoreFingerprint(input: FingerprintInput): string {
  const sorted = [...input.facts].sort((a, b) =>
    String((a as unknown as { detectorId?: string }).detectorId ?? '').localeCompare(
      String((b as unknown as { detectorId?: string }).detectorId ?? ''),
    ),
  );
  const payload = {
    fingerprint_version: FINGERPRINT_VERSION,
    facts: sorted.map(normalizedFact),
    rubric_version: input.rubricVersion,
    engine_version: input.engineVersion,
    engine_sha7: input.engineSha7,
    snapshot_versions: input.snapshotVersions ?? {},
    strict: input.strict,
    indicator_set: [...input.indicatorSet].sort(),
    archetype: input.archetype,
    score_policy: input.scorePolicy ?? 'frozen',
  };
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

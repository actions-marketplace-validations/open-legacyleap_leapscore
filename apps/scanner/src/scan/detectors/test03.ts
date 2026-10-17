import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, measuredFact, unknownFact } from './common';
import { scanTestFiles } from '../testfiles';

const WHAT_IT_TAKES =
  'enumerate test files and classify each by path/framework markers — needs an enumerable tree with test files (per-file tier assignment is a heuristic, so this row is `estimated`, never `measured`)';

/**
 * TEST-03 — test pyramid inversion, classified from the tree (detector-honesty
 * 2.2; spec test-03 §2/§4). Status is `estimated` (never `measured`) because the
 * per-file tier assignment is a heuristic; <60% classified → `unknown`.
 */
export async function detectTest03(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('TEST-03', 'test-classify', started, WHAT_IT_TAKES);
    const scan = await scanTestFiles(ctx, signal);
    if (scan.total === 0) {
      return unknownFact('TEST-03', 'test-classify', started,
        'zero test files — no pyramid shape to classify; TEST-05/TEST-08 carry the zero-test signal (na_when)');
    }
    const highCount = Math.round(scan.highRatio * scan.total);
    const classifiedRatio = scan.total ? highCount / scan.total : 0;
    if (classifiedRatio < 0.6) {
      return unknownFact('TEST-03', 'test-classify', started,
        `only ${Math.round(classifiedRatio * 100)}% of ${scan.total} test files could be tier-classified (<60%) — ${WHAT_IT_TAKES}`);
    }
    const weighted = scan.unit * 1 + scan.integration * 2 + scan.e2e * 3;
    const e2eShare = weighted ? Math.round((scan.e2e * 3 / weighted) * 1000) / 1000 : 0;
    const facts = {
      test03: {
        unit: scan.unit,
        integration: scan.integration,
        e2e: scan.e2e,
        unclassified: scan.unclassified,
        e2e_share_est: e2eShare,
        classification_confidence: { high: scan.highRatio, low: Math.round((1 - scan.highRatio) * 1000) / 1000 },
      },
    };
    const pointers = scan.files.slice(0, 10).map((f) => filePointer(f.path, `tier ${f.tier}${f.highConfidence ? '' : ' (low-confidence)'}; ${f.tests} test defs`));
    return measuredFact({
      detectorId: 'TEST-03',
      producer: 'test-classify',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: { status: 'estimated', confidence: scan.highRatio >= 0.8 ? 'medium' : 'low' },
      truncated: scan.truncated,
    });
  } catch (e) {
    return { detectorId: 'TEST-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'test-classify', version: '1.0', flags: ['test-classify'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}

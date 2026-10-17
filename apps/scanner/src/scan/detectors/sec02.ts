import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact } from './common';
import { scanSecrets } from '../secrets';

const WHAT_IT_TAKES =
  'run a secret scanner over the tree and git history (the offline release runs a built-in documented rule set; gitleaks/trufflehog widen it when installed)';

/**
 * SEC-02 — hardcoded secrets (detector-honesty 4.1; spec sec-02). Runs the
 * built-in documented rule pack over the tree always and over bounded git history
 * where available. Absence of the external scanners is disclosed
 * (`wider_scanners_run: []`) and history that was not scanned is stated
 * (`history_scanned_full: false`) — never presented as clean. G1 is evaluable
 * offline from these facts.
 */
export async function detectSec02(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('SEC-02', 'secret-rules', started, WHAT_IT_TAKES);
    const scan = await scanSecrets(ctx, signal);
    const facts = {
      sec02: {
        tree_findings: scan.tree_findings,
        // count (spec §3 + G1) — the bounded detail list is separate
        history_only_findings: scan.history_only_findings.length,
        history_only_findings_list: scan.history_only_findings.slice(0, 50),
        verified_live: scan.verified_live,
        history_scanned_full: scan.history_scanned_full,
        history_scanned: scan.history_scanned,
        rules_applied: scan.rules_applied,
        wider_scanners_run: scan.wider_scanners_run,
        wider_scanners_declared: scan.wider_scanners_declared,
        files_scanned: scan.files_scanned,
      },
    };
    const pointers = [
      ...scan.tree_findings.slice(0, 6).map((f) => filePointer(f.file, `rule ${f.rule} at line ${f.line} (unverified)`)),
      scan.history_scanned
        ? basisPointer('git', `git log -p --all over bounded history; history_scanned_full=${scan.history_scanned_full}`)
        : basisPointer('scan', 'no git history available — history-only findings not scanned (disclosed, never assumed clean)'),
    ];
    return measuredFact({
      detectorId: 'SEC-02',
      producer: 'secret-rules',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: { status: 'measured', confidence: scan.history_scanned_full ? 'medium' : 'low' },
      truncated: scan.truncated || !scan.history_scanned,
    });
  } catch (e) {
    return { detectorId: 'SEC-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'secret-rules', version: '1.0', flags: ['secret-rules'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}

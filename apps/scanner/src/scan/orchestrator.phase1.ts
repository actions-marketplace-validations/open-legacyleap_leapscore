import { createBudgetControllerForIndicators } from './budget';
import { createGhClient, GhRateLimitError } from './gh';
import { ingestRepoUrl } from './ingest';
import type { FactRecord } from './facts';
import { validateFact } from './facts';
import { detectVel06 } from './detectors/vel06';
import { detectVel09 } from './detectors/vel09';
import { detectVel08 } from './detectors/vel08';
import { detectVel10 } from './detectors/vel10';
import { detectSec07 } from './detectors/sec07';
import { detectTest08 } from './detectors/test08';
import type { Phase1ScanContext } from './detector';
import { factsToRows, scorePhase1 } from './scoring/scorer/phase1';
import { tierForScore } from './scoring/seal';

export type Phase1Report = ReturnType<typeof scorePhase1> & {
  id: string;
  snapshot: { repo: string; scanned_at: string; engine_version: string; rubric_version: string };
  headline: { score: number; tier: string };
  provenance: { tool_manifest: string[] };
  facts: FactRecord[];
};

export async function runPhase1Scan(repoUrl: string, opts: { token?: string; fetchImpl?: typeof fetch; indicatorIds?: string[] } = {}): Promise<Phase1Report | { status: 'snapshot_refused'; reason: string; detail: string }> {
  const token = opts.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  const gh = createGhClient({ token, fetchImpl: opts.fetchImpl });
  const ids = opts.indicatorIds ?? ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'];
  const budget = createBudgetControllerForIndicators(ids as string[], { withCloneBase: false });
  const signal = budget.signal;
  const scanId = `ls_phase1_${Date.now().toString(36)}`;

  // Ingest
  let ingest: Awaited<ReturnType<typeof ingestRepoUrl>>;
  try {
    ingest = await ingestRepoUrl(repoUrl, gh, { signal });
  } catch (e) {
    if (e instanceof GhRateLimitError) return { status: 'snapshot_refused', reason: 'rate-limited', detail: e.message.slice(0, 200) };
    throw e;
  }
  if (!ingest.ok) return { status: 'snapshot_refused', reason: ingest.reason, detail: ingest.detail };
  const { owner, repo, normalized } = ingest;

  const ctx: Phase1ScanContext = { owner, repo, gh, signal, toolVersions: new Map([['gh-api', 'phase1']]) };

  // Parallel detectors under budget
  const detectors = [detectVel06, detectVel09, detectVel08, detectVel10, detectSec07, detectTest08];
  const settled = await Promise.allSettled(detectors.map((fn) => fn(ctx)));
  budget.cancel();

  const facts: FactRecord[] = settled.map((r, i) => {
    const id = ['VEL-06', 'VEL-09', 'VEL-08', 'VEL-10', 'SEC-07', 'TEST-08'][i];
    if (r.status === 'fulfilled') {
      const f = r.value as FactRecord;
      const rec: FactRecord = { ...f, id, root: '/', scanId, commitSha: 'unknown' };
      const v = validateFact(rec);
      if (!v.ok) {
        return { ...rec, truncated: true, error: { kind: 'crash' as const, detail: v.errors!.join('; ') } };
      }
      return rec;
    }
    const detail = r.reason instanceof Error ? r.reason.message : String(r.reason);
    return { id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'gh-api', version: 'phase1', flags: [], durationMs: 0 }, truncated: true, error: { kind: 'crash' as const, detail: detail.slice(0, 300) }, root: '/', scanId } as FactRecord;
  });

  const rows = factsToRows(facts);
  const scored = scorePhase1(rows);
  const tier = tierForScore(scored.score);
  const toolManifest = [...new Set(facts.flatMap((f) => f.provenance.flags))];

  return {
    id: scanId,
    score: scored.score,
    snapshot: { repo: normalized, scanned_at: new Date().toISOString(), engine_version: 'phase1/0.1.0', rubric_version: 'docs/rubric/@phase1' },
    headline: { score: Math.round(scored.score * 100) / 100, tier },
    categories: scored.categories as unknown as Phase1Report['categories'],
    coverage: scored.coverage as unknown as Phase1Report['coverage'],
    status: scored.status as Phase1Report['status'],
    gates: scored.gates as unknown as Phase1Report['gates'],
    provenance: { tool_manifest: toolManifest },
    facts,
  };
}

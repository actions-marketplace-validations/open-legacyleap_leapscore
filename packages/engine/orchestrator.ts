/** engine/orchestrator.ts — unified budgeted scan (GH-API + clone under one deadline) */
import { createBudgetControllerForIndicators, budgetForIndicators, BUDGET_COST, INDICATOR_BUDGET_CLASS } from './budget';
import { createGhClient, GhRateLimitError } from './gh';
import { ingestRepoUrl } from './ingest';
import { shallowClone } from './clone';
import { sniffEcosystems } from './ecosystem';
import { createQueue } from './queue';
import type { FactRecord } from './facts';
import { validateFact } from './facts';
import { detectVel06 } from './detectors/vel06';
import { detectVel09 } from './detectors/vel09';
import { detectVel08 } from './detectors/vel08';
import { detectVel10 } from './detectors/vel10';
import { detectSec07 } from './detectors/sec07';
import { detectTest08 } from './detectors/test08';
import { detectEcos01 } from './detectors/ecos01';
import { detectEcos02 } from './detectors/ecos02';
import { detectEcos03 } from './detectors/ecos03';
import { detectEcos05 } from './detectors/ecos05';
import { detectEcos07 } from './detectors/ecos07';
import { detectSec01 } from './detectors/sec01';
import { detectSec06 } from './detectors/sec06';
import { detectSec02 } from './detectors/sec02';
import { detectArch01 } from './detectors/arch01';
import { detectArch08 } from './detectors/arch08';
import { detectArch05 } from './detectors/arch05';
import { detectTest03 } from './detectors/test03';
import { detectTest05 } from './detectors/test05';
import type { Phase1ScanContext, ScanContext } from './detector';

const phase1Ids = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'];
const phase2Ids = ['ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];
export const MVP_IDS = [...phase1Ids, ...phase2Ids];
const phase2Detectors = [
  detectEcos01, detectEcos02, detectEcos03, detectEcos05, detectEcos07,
  detectSec01, detectSec06, detectSec02,
  detectArch01, detectArch08, detectArch05,
  detectTest03, detectTest05,
];

export function getUnifiedBudget(indicatorIds: string[] = MVP_IDS) {
  return budgetForIndicators(indicatorIds, { withCloneBase: indicatorIds.some(id => INDICATOR_BUDGET_CLASS[id] === 'slow-dissolvable') });
}

/** Unified scan: single budget covering GH + clone detectors, streaming meta/progress/done */
export async function* runUnifiedScan(repoUrl: string, opts: { token?: string; indicatorIds?: string[] } = {}): AsyncGenerator<{ type: string; budgetMs?: number; breakdown?: Record<string, number>; indicatorCount?: number; pct?: number; elapsedMs?: number; remainingMs?: number; completedIds?: string[]; completedCost?: number; totalCost?: number; facts?: FactRecord[]; snapshot?: unknown; id?: string; error?: string; reason?: string; detail?: string }> {
  const ids = opts.indicatorIds ?? MVP_IDS;
  const { budgetMs, breakdown, indicatorCount } = getUnifiedBudget(ids);
  const totalCost = ids.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? 'fast'] ?? 5000), 0) + (ids.some(id => INDICATOR_BUDGET_CLASS[id] === 'slow-dissolvable') ? 30000 : 5000);
  const budget = createBudgetControllerForIndicators(ids, { withCloneBase: ids.some(id => INDICATOR_BUDGET_CLASS[id] === 'slow-dissolvable') });
  const start = Date.now();
  const signal = budget.signal;

  // Ingest + GH setup
  const token = opts.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  const gh = createGhClient({ token });
  yield { type: 'meta', budgetMs, breakdown, indicatorCount, totalCost };

  let ingest: Awaited<ReturnType<typeof ingestRepoUrl>>;
  try {
    ingest = await ingestRepoUrl(repoUrl, gh, { signal });
  } catch (e) {
    budget.cancel();
    if (e instanceof GhRateLimitError) { yield { type: 'refused', reason: 'rate-limited', detail: e.message.slice(0,500) }; return; }
    yield { type: 'refused', reason: 'crash', detail: (e instanceof Error ? e.message : String(e)).slice(0,500) }; return;
  }
  if (!ingest.ok) { budget.cancel(); yield { type: 'refused', reason: ingest.reason, detail: ingest.detail }; return; }
  const { owner, repo, normalized } = ingest;
  const scanId = `ls_${Date.now().toString(36)}`;

  // GH detectors (phase1 subset that is in requested ids)
  const ghIds = phase1Ids.filter(id => ids.includes(id));
  const ghDetectors = [detectVel06, detectVel09, detectVel08, detectVel10, detectSec07, detectTest08].filter((_, i) => ids.includes(phase1Ids[i]));
  const ghCtx: Phase1ScanContext = { owner, repo, gh, signal, toolVersions: new Map([['gh-api','1.0']]) };
  let ghFacts: FactRecord[] = [];
  if (ghDetectors.length) {
    const settled = await Promise.allSettled(ghDetectors.map(fn => (fn as any)(ghCtx)));
    ghFacts = settled.map((r, idx) => {
      const id = ghIds[idx];
      if (r.status === 'fulfilled') {
        const f = r.value as FactRecord;
        const rec: FactRecord = { ...f, id, root: '/', scanId, commitSha: 'unknown' } as unknown as FactRecord;
        const v = validateFact(rec);
        if (!v.ok) return { ...rec, truncated: true, error: { kind: 'crash' as const, detail: v.errors!.join('; ') } } as unknown as FactRecord;
        return rec;
      }
      const detail = r.reason instanceof Error ? r.reason.message : String(r.reason);
      const isBudget = String(detail).includes('budget-exceeded') || String(detail).includes('TimeoutError');
      return { id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'gh-api', version: '1', flags: [], durationMs: 0 }, truncated: true, error: { kind: isBudget ? 'cap' : 'crash', detail: detail.slice(0,300) }, root: '/', scanId } as unknown as FactRecord;
    });
    const elapsedMs = Date.now() - start;
    const completedIds = ghFacts.filter(f => !f.error).map(f => f.detectorId);
    const completedCost = completedIds.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? 'fast'] ?? 5000), 0);
    const timePct = Math.min(elapsedMs / budgetMs, 1);
    const costPct = totalCost ? completedCost / totalCost : 0;
    const pct = Math.min(100, Math.round((0.6 * timePct + 0.4 * costPct) * 100));
    yield { type: 'progress', pct, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost };
  }

  if (signal.aborted) {
    // Budget already expired after GH phase — seal with what we have + unknown for remaining
    const remainingIds = ids.filter(id => !ghFacts.some(f => f.detectorId === id));
    const unknownFacts: FactRecord[] = remainingIds.map(id => ({ id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'budget', version: '1', flags: [], durationMs: 0 }, truncated: true, error: { kind: 'cap' as const, detail: 'budget-exceeded' }, root: '/', scanId } as unknown as FactRecord));
    const allFacts = [...ghFacts, ...unknownFacts];
    budget.cancel();
    yield { type: 'done', facts: allFacts, snapshot: { repo: normalized, scanned_at: new Date().toISOString(), engine_version: 'unified/1.0', rubric_version: 'docs/rubric/@mvp' }, id: scanId };
    return;
  }

  // Clone phase — only if any clone-dependent ids requested; otherwise skip
  const needsClone = ids.some(id => phase2Ids.includes(id));
  let cloneFacts: FactRecord[] = [];
  if (needsClone && !signal.aborted) {
    const queue = createQueue({ concurrency: 1 });
    const job = queue.enqueue('unified-clone', async (sig) => {
      const clone = await shallowClone(repoUrl, { signal: sig, byteCap: 4*1024*1024 });
      try {
        const manifests = await sniffEcosystems(clone.clonePath);
        const ctx: ScanContext = {
          clonePath: clone.clonePath,
          commitSha: clone.commitSha,
          gh,
          manifests: manifests.map(m => ({ root: m.root, ecosystem: m.ecosystem as never, lockfile: m.lockfile, manifest: m.manifest })),
          budgetLease: budget.lease(),
          cache: { get: () => undefined, set: () => {} },
          toolVersions: new Map([['phase2','1.0']]),
          readFile: clone.readFile,
        };
        // Run only the requested phase2 detectors
        const reqPhase2Ids = phase2Ids.filter(id => ids.includes(id));
        const reqDetectors = phase2Detectors.filter((_, i) => ids.includes(phase2Ids[i]));
        const settled = await Promise.allSettled(reqDetectors.map(fn => fn(ctx, sig)));
        return settled.map((r,i) => {
          const id = reqPhase2Ids[i];
          if (r.status === 'fulfilled') {
            const f = r.value;
            const rec: FactRecord = { ...f, id, root: '/', scanId, commitSha: clone.commitSha } as unknown as FactRecord;
            const v = validateFact(rec);
            if (!v.ok) return { ...rec, truncated: true, error: { kind: 'crash', detail: v.errors!.join('; ') } } as unknown as FactRecord;
            return rec;
          }
          const detail = String((r as any).reason).slice(0,300);
          const isBudget = detail.includes('budget-exceeded') || detail.includes('TimeoutError') || detail.includes('AbortError');
          return { id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'phase2', version: '1', flags: [], durationMs: 0 }, truncated: true, error: { kind: isBudget ? 'cap' : 'crash', detail }, root: '/', scanId } as unknown as FactRecord;
        });
      } finally {
        clone.cleanup();
      }
    });
    try {
      cloneFacts = await job.result;
    } catch (e) {
      // Shallow clone failed — GH facts still seal, clone rows become unknown
      const detail = e instanceof Error ? e.message : String(e);
      const remainingPhase2 = phase2Ids.filter(id => ids.includes(id));
      cloneFacts = remainingPhase2.map(id => ({ id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'phase2', version: '1', flags: [], durationMs: 0 }, truncated: true, error: { kind: 'cap' as const, detail: detail.slice(0,300) }, root: '/', scanId } as unknown as FactRecord));
    }
  }

  budget.cancel();
  const allFacts = [...ghFacts, ...cloneFacts];
  // Fill any requested id not yet covered (e.g. budget aborted mid-detector) as unknown budget-exceeded
  const covered = new Set(allFacts.map(f => f.detectorId));
  for (const id of ids) if (!covered.has(id)) {
    allFacts.push({ id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'budget', version: '1', flags: [], durationMs: 0 }, truncated: true, error: { kind: 'cap' as const, detail: 'budget-exceeded' }, root: '/', scanId } as unknown as FactRecord);
  }
  yield { type: 'done', facts: allFacts, snapshot: { repo: normalized, scanned_at: new Date().toISOString(), engine_version: 'unified/1.0', rubric_version: 'docs/rubric/@mvp' }, id: scanId };
}

/** Back-compat: two-phase generator now delegates to unified scan but preserves legacy shape for callers that still consume phase events */
export async function* runTwoPhaseScan(repoUrl: string, opts: { token?: string } = {}): AsyncGenerator<{ phase: string; facts?: FactRecord[]; done?: boolean; error?: string; budgetMs?: number; indicatorCount?: number }> {
  const gen = runUnifiedScan(repoUrl, opts);
  let meta: { budgetMs: number; indicatorCount: number } | null = null;
  let lastFacts: FactRecord[] | undefined;
  for await (const evt of gen) {
    if (evt.type === 'meta') { meta = { budgetMs: evt.budgetMs!, indicatorCount: evt.indicatorCount! }; yield { phase: 'meta', budgetMs: evt.budgetMs, indicatorCount: evt.indicatorCount }; continue; }
    if (evt.type === 'progress') { yield { phase: 'scanning' }; continue; }
    if (evt.type === 'refused') { yield { phase: 'refused', error: `${evt.reason}: ${evt.detail}` }; return; }
    if (evt.type === 'done') { lastFacts = evt.facts; yield { phase: 'done', facts: evt.facts, done: true, budgetMs: meta?.budgetMs, indicatorCount: meta?.indicatorCount }; return; }
  }
  if (lastFacts) yield { phase: 'done', facts: lastFacts, done: true };
}

/** engine/orchestrator.ts — two-phase orchestration (Phase1 GH-API 10s + Phase2 clone 4-min via worker/queue) */
import { createBudgetController, createBudgetControllerForIndicators, budgetForIndicators } from './budget';
import { createGhClient } from './gh';
import { ingestRepoUrl } from './ingest';
import { shallowClone } from './clone';
import { sniffEcosystems } from './ecosystem';
import { createQueue } from './queue';
import type { FactRecord } from './facts';
import { validateFact } from './facts';
import { runPhase1Scan } from './orchestrator.phase1';
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
import type { ScanContext } from './detector';

const phase2Detectors = [
  detectEcos01, detectEcos02, detectEcos03, detectEcos05, detectEcos07,
  detectSec01, detectSec06, detectSec02,
  detectArch01, detectArch08, detectArch05,
  detectTest03, detectTest05,
];
const phase2Ids = ['ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];

export async function* runTwoPhaseScan(repoUrl: string, opts: { token?: string } = {}): AsyncGenerator<{ phase: string; facts?: FactRecord[]; done?: boolean; error?: string }> {
  // Phase 1
  yield { phase: 'phase1-start' };
  const phase1 = await runPhase1Scan(repoUrl, opts);
  if ('status' in phase1 && phase1.status === 'snapshot_refused') {
    yield { phase: 'refused', error: `${phase1.reason}: ${phase1.detail}` };
    return;
  }
  const p1 = phase1 as Exclude<typeof phase1, { status: string }>;
  yield { phase: 'phase1-done', facts: p1.facts };

  // Phase 2: indicator-driven budget (13 MVP Phase-2 IDs → ~240s)
  yield { phase: 'cloning' };
  const budget = createBudgetControllerForIndicators(phase2Ids as string[], { withCloneBase: true });
  const queue = createQueue({ concurrency: 1 });
  let phase2Facts: FactRecord[] = [];
  let cloneError: string | undefined;
  const job = queue.enqueue('phase2', async (signal) => {
    const clone = await shallowClone(repoUrl, { signal, byteCap: 4*1024*1024 });
    try {
      const manifests = await sniffEcosystems(clone.clonePath);
      const ctx: ScanContext = {
        clonePath: clone.clonePath,
        commitSha: clone.commitSha,
        gh: createGhClient({ token: opts.token }),
        manifests: manifests.map(m => ({ root: m.root, ecosystem: m.ecosystem as never, lockfile: m.lockfile, manifest: m.manifest })),
        budgetLease: budget.lease(),
        cache: { get: () => undefined, set: () => {} },
        toolVersions: new Map([['phase2','1.0']]),
        readFile: clone.readFile,
      };
      const settled = await Promise.allSettled(phase2Detectors.map(fn => fn(ctx, signal)));
      const facts: FactRecord[] = settled.map((r,i) => {
        const id = phase2Ids[i];
        if (r.status === 'fulfilled') {
          const f = r.value;
          const rec: FactRecord = { ...f, id, root: '/', scanId: p1.id, commitSha: clone.commitSha } as unknown as FactRecord;
          const v = validateFact(rec);
          if (!v.ok) return { ...rec, truncated: true, error: { kind: 'crash', detail: v.errors!.join('; ') } } as unknown as FactRecord;
          return rec;
        }
        return { id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'phase2', version: '1', flags: [], durationMs: 0 }, truncated: true, error: { kind: 'crash', detail: String(r.reason).slice(0,300) }, root: '/', scanId: p1.id } as unknown as FactRecord;
      });
      return facts;
    } finally {
      clone.cleanup();
      budget.cancel();
    }
  });

  // Stream Phase 2 progress
  yield { phase: 'sniffing' };
  await new Promise(r => setTimeout(r, 50));
  yield { phase: 'scanning' };
  try {
    phase2Facts = await job.result;
    yield { phase: 'scoring', facts: phase2Facts };
    const allFacts = [...p1.facts, ...phase2Facts];
    yield { phase: 'done', facts: allFacts, done: true };
  } catch (e) {
    cloneError = e instanceof Error ? e.message : String(e);
    yield { phase: 'done', error: cloneError.slice(0,500), done: true };
  }
}

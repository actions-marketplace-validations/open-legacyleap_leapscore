/** apps/scanner/src/scan/local.ts — local-path orchestrator (spec: scan-local, scan-phase-2) */
import { stat, readFile as fsReadFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { createBudgetControllerForIndicators, budgetForIndicators, BUDGET_COST, INDICATOR_BUDGET_CLASS, computeSampleN, partitionByteCap, isKillerTrip } from './budget';
import { walkSortedTree } from './tree';
import { buildToolVersions, toolVersion } from './detectors/common';
import { sniffEcosystems } from './ecosystem';
import { classifyArchetype, classifyArchetypePerRoot } from './archetype';
import { validateFact, type FactRecord } from './facts';
import { createStrictFetch, StrictOfflineError } from './offline';
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
import { detectDocs01 } from './detectors/docs01';
import { detectDocs03 } from './detectors/docs03';
import { detectDocs04 } from './detectors/docs04';
import { detectDocs08 } from './detectors/docs08';
import { detectDocs09 } from './detectors/docs09';
import { detectPerf02 } from './detectors/perf02';
import { detectPerf06 } from './detectors/perf06';
import { detectData01 } from './detectors/data01';
import { detectEcos06 } from './detectors/ecos06';
import { detectEcos08 } from './detectors/ecos08';
import { detectSec09 } from './detectors/sec09';
import { detectSec10 } from './detectors/sec10';
import type { ScanContext } from './detector';

/** The 6 GH-API detectors never run on local paths. */
export const GH_ONLY_IDS = new Set(['VEL-06', 'VEL-09', 'VEL-08', 'VEL-10', 'SEC-07', 'TEST-08']);

export const LOCAL_IDS = [
  'ECOS-01', 'ECOS-02', 'ECOS-03', 'ECOS-05', 'ECOS-07',
  'SEC-01', 'SEC-06', 'SEC-02',
  'ARCH-01', 'ARCH-08', 'ARCH-05',
  'TEST-03', 'TEST-05',
  'DOCS-01', 'DOCS-03', 'DOCS-04', 'DOCS-08', 'DOCS-09',
  'PERF-02', 'PERF-06',
  'DATA-01',
  'ECOS-06', 'ECOS-08',
  'SEC-09', 'SEC-10',
];

const LOCAL_DETECTORS = [
  detectEcos01, detectEcos02, detectEcos03, detectEcos05, detectEcos07,
  detectSec01, detectSec06, detectSec02,
  detectArch01, detectArch08, detectArch05,
  detectTest03, detectTest05,
  detectDocs01, detectDocs03, detectDocs04, detectDocs08, detectDocs09,
  detectPerf02, detectPerf06,
  detectData01,
  detectEcos06, detectEcos08,
  detectSec09, detectSec10,
];

const execFileAsync = promisify(execFile);

export type LocalScanOpts = {
  indicatorIds?: string[];
  strict?: boolean;
  fetchImpl?: typeof fetch;
  byteCap?: number;
  scannedCommitOverride?: string;
  /** Override the wall-clock killer (4.1 verification only; default KILLER_TIMEOUT_MS). */
  killerMs?: number;
};

export type LocalScanEvent = {
  type: string;
  [k: string]: unknown;
};

/** readFile bound to a real directory with the same traversal guard + byte cap as clone.ts. */
export function bindLocalReadFile(root: string, opts: { byteCap?: number; signal?: AbortSignal } = {}) {
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  let bytesRead = 0;
  return async (p: string): Promise<Buffer | null> => {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const full = join(root, p.replace(/^\//, ''));
    if (full !== root && !full.startsWith(root + '/')) return null;
    try {
      const buf = await fsReadFile(full);
      bytesRead += buf.length;
      if (bytesRead > byteCap) throw new DOMException('byteCap exceeded', 'QuotaExceededError');
      return buf;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  };
}

/** Partitioned readFile factory (deterministic-scoring 1.3): each detector gets an
 * independent byte counter so one detector cannot exhaust another's budget. */
export function bindLocalReadFilePartitioned(
  root: string,
  opts: { byteCap?: number; signal?: AbortSignal } = {},
) {
  const totalCap = opts.byteCap ?? 4 * 1024 * 1024;
  return {
    totalCap,
    forDetector(perDetectorCap: number) {
      let bytesRead = 0;
      return async (p: string): Promise<Buffer | null> => {
        if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const full = join(root, p.replace(/^\//, ''));
        if (full !== root && !full.startsWith(root + '/')) return null;
        try {
          const buf = await fsReadFile(full);
          bytesRead += buf.length;
          if (bytesRead > perDetectorCap) throw new DOMException('byteCap exceeded', 'QuotaExceededError');
          return buf;
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
          throw e;
        }
      };
    },
  };
}

export async function resolveLocalCommit(absPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', absPath, 'rev-parse', 'HEAD']);
    const sha = stdout.trim();
    return /^[0-9a-f]{4,40}$/i.test(sha) ? sha : 'unknown';
  } catch {
    return 'unknown';
  }
}

function statusForFact(f: FactRecord): 'measured' | 'estimated' | 'unknown' {
  if ((f as unknown as { error?: unknown }).error) return 'unknown';
  return 'measured';
}

function errorKindForFact(f: FactRecord): 'cap' | 'crash' | 'rate-limit' | undefined {
  const err = (f as unknown as { error?: { kind?: string; detail?: string } }).error;
  if (!err) return undefined;
  if (err.kind === 'cap') return 'cap';
  if (String(err.detail).toLowerCase().includes('rate-limit') || String(err.detail).toLowerCase().includes('rate limit')) return 'rate-limit';
  return 'crash';
}

/**
 * Local scan: no ingest, no clone, no GH-API. Detectors read directly from
 * `<path>` via the same read-only readFile with identical traversal guards
 * and byte caps. GH-touching detectors are excluded from the local set.
 */
export async function* runLocalScan(
  targetPath: string,
  opts: LocalScanOpts = {},
): AsyncGenerator<LocalScanEvent> {
  const absPath = resolve(targetPath);
  try {
    const st = await stat(absPath);
    if (!st.isDirectory()) {
      yield { type: 'refused', reason: 'bad_path', detail: `not a directory: ${targetPath}` };
      return;
    }
  } catch {
    yield { type: 'refused', reason: 'bad_path', detail: `path does not exist: ${targetPath}` };
    return;
  }

  const requested = (opts.indicatorIds ?? LOCAL_IDS).filter((id) => !GH_ONLY_IDS.has(id));
  const ids = requested.filter((id) => LOCAL_IDS.includes(id));
  const { budgetMs, breakdown, indicatorCount } = budgetForIndicators(ids, { withCloneBase: true });
  const totalCost = ids.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? 'fast'] ?? 5000), 0) + 30000;
  const budget = createBudgetControllerForIndicators(ids, { withCloneBase: true, byteCap: opts.byteCap, killerMs: opts.killerMs });
  const start = Date.now();
  const signal = budget.signal;
  const scanId = `ls_${Date.now().toString(36)}`;

  const fetchImpl = opts.strict ? createStrictFetch() : (opts.fetchImpl ?? fetch);
  void fetchImpl;

  yield { type: 'meta', budgetMs, breakdown, indicatorCount, totalCost, milestone: `Budget ${Math.ceil(budgetMs / 1000)}s · ${indicatorCount} indicators (local)` };
  {
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Budget ${Math.ceil(budgetMs / 1000)}s · ${indicatorCount} indicators (local, no clone)`, phase: 'budget' };
  }

  const readFile = bindLocalReadFile(absPath, { byteCap: opts.byteCap, signal });
  const commitSha = opts.scannedCommitOverride ?? await resolveLocalCommit(absPath);

  // Deterministic bounding (1.2): single canonical sorted walk → fileCount → sampleN,
  // threaded into every slow detector's lease before fan-out.
  let sampleN: number | undefined;
  try {
    const walk = await walkSortedTree(absPath);
    sampleN = computeSampleN(walk.fileCount);
    budget.setSampleN(sampleN);
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Tree walk — ${walk.fileCount} files, sampleN ${sampleN ?? 'full'} (canonical sorted order)`, phase: 'budget' };
  } catch {
    // walk failure must not fail the scan; detectors fall back to full reads
  }

  let manifests: Array<{ root: string; ecosystem: string; lockfile: string; manifest: string }> = [];
  try {
    const sniffed = await sniffEcosystems(absPath);
    manifests = sniffed.map((m) => ({ root: m.root, ecosystem: m.ecosystem as never, lockfile: m.lockfile, manifest: m.manifest }));
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Sniff — ${manifests.length} ecosystems (local, no clone)`, phase: 'sniff' };
  } catch (e) {
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Sniff failed — ${String(e).slice(0, 120)}`, phase: 'sniff', status: 'error' };
  }

  let archetypeResult: Awaited<ReturnType<typeof classifyArchetype>> | null = null;
  try {
    archetypeResult = manifests.length > 1
      ? await classifyArchetypePerRoot(absPath, readFile, manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem })))
      : await classifyArchetype(absPath, readFile, manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem })));
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Archetype — ${archetypeResult.archetype} (${archetypeResult.confidence})`, phase: 'archetype', status: archetypeResult.archetype ?? 'unknown' };
  } catch (e) {
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Archetype — error: ${String(e).slice(0, 120)}`, phase: 'archetype', status: 'error' };
  }

  const ctx: ScanContext = {
    clonePath: absPath,
    commitSha,
    gh: undefined,
    manifests: manifests as ScanContext['manifests'],
    budgetLease: budget.lease(),
    cache: { get: () => undefined, set: () => {} },
    toolVersions: buildToolVersions(),
    readFile,
  };

  let reqIds = ids;
  let reqDetectors = LOCAL_DETECTORS.filter((_, i) => ids.includes(LOCAL_IDS[i]));
  if (archetypeResult) {
    try {
      const { evaluateApplicability } = await import('./scoring/scorer/applicability');
      const filtered: string[] = [];
      const filteredDet: typeof reqDetectors = [];
      const skipped: string[] = [];
      for (let i = 0; i < reqIds.length; i++) {
        const id = reqIds[i];
        const det = reqDetectors[i];
        const ev = evaluateApplicability(id, archetypeResult.archetype as never, archetypeResult.planeInventory as never);
        if (ev.notApplicable) skipped.push(id);
        else { filtered.push(id); filteredDet.push(det); }
      }
      if (skipped.length) {
        const elapsedMs = Date.now() - start;
        yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Skipped not_applicable: ${skipped.join(', ')}`, phase: 'budget', status: 'skipped' };
      }
      reqIds = filtered;
      reqDetectors = filteredDet;
    } catch { /* ignore */ }
  }

  const starts = reqDetectors.map(() => Date.now());
  // Partitioned byte budgets (1.3): each detector reads through an independent
  // counter so scheduling order cannot let one detector starve another.
  const partitioned = bindLocalReadFilePartitioned(absPath, { byteCap: opts.byteCap, signal });
  const perDetectorCap = partitionByteCap(partitioned.totalCap, Math.max(1, reqDetectors.length));
  const detectorCtxs = reqDetectors.map(() => ({ ...ctx, readFile: partitioned.forDetector(perDetectorCap) }));
  let settled: Array<{ ok: boolean; value?: FactRecord; error?: unknown; durationMs: number }>;
  try {
    settled = await Promise.all(reqDetectors.map((fn, idx) => {
      const s = starts[idx];
      if (signal.aborted || (opts.strict && (signal as unknown as { _strictAborted?: boolean })._strictAborted)) {
        return Promise.resolve({ ok: false as const, error: new StrictOfflineError('aborted'), durationMs: Date.now() - s });
      }
      return (fn as unknown as (ctx: ScanContext, sig: AbortSignal) => Promise<FactRecord>)(detectorCtxs[idx], signal).then(
        (v) => ({ ok: true as const, value: v, durationMs: Date.now() - s }),
        (e) => ({ ok: false as const, error: e, durationMs: Date.now() - s }),
      );
    }));
  } catch (e) {
    const elapsedMs = Date.now() - start;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Local detectors crashed — ${String(e).slice(0, 120)}`, phase: 'detector', status: 'error' };
    settled = [];
  }

  // Killer timeout (4.1): the wall-clock budget is a run-failure killer, never a
  // degraded seal. Check BEFORE budget.cancel() — cancel aborts cleanly.
  if (isKillerTrip(signal)) {
    budget.cancel();
    yield { type: 'run-failure', reason: 'budget-exceeded', detail: 'wall-clock killer fired before deterministic work completed — no headline sealed' };
    return;
  }

  const facts: FactRecord[] = settled.map((r, i) => {
    const id = reqIds[i];
    if (r.ok && r.value) {
      const rec = { ...r.value, id, root: '/', scanId, commitSha } as unknown as FactRecord;
      const v = validateFact(rec);
      if (!v.ok) {
        return { ...rec, truncated: true, error: { kind: 'crash' as const, detail: v.errors!.join('; ') } } as unknown as FactRecord;
      }
      return rec;
    }
    const detail = String((r as unknown as { error: unknown }).error).slice(0, 300);
    const isBudget = detail.includes('budget-exceeded') || detail.includes('TimeoutError') || detail.includes('AbortError') || detail.includes('byteCap');
    return { id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'phase2', version: toolVersion('phase2'), flags: [], durationMs: 0 }, truncated: true, error: { kind: isBudget ? 'cap' as const : 'crash' as const, detail }, root: '/', scanId } as unknown as FactRecord;
  });

  // Determinism: sort detector outputs by id before seal.
  facts.sort((a, b) => String(a.detectorId).localeCompare(String(b.detectorId)));

  for (let i = 0; i < reqIds.length; i++) {
    const id = reqIds[i];
    const f = facts.find((x) => x.detectorId === id);
    const durationMs = settled[i]?.durationMs ?? 0;
    const status = f ? statusForFact(f) : 'unknown';
    const errorKind = f ? errorKindForFact(f) : undefined;
    const elapsedMs = Date.now() - start;
    const label = errorKind ? `${id} — ${durationMs}ms · ${status} (${errorKind})` : `${id} — ${durationMs}ms · ${status}`;
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label, phase: 'detector', detectorId: id, durationMs, status, errorKind };
  }

  {
    const elapsedMs = Date.now() - start;
    const completedIds = facts.filter((f) => !(f as unknown as { error?: unknown }).error).map((f) => f.detectorId);
    const completedCost = completedIds.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? 'fast'] ?? 5000), 0);
    // Deterministic progress (scan-phase-2): completed work only, never elapsed/budgetMs.
    const costPct = totalCost ? completedCost / totalCost : 0;
    const countPct = reqIds.length ? completedIds.length / reqIds.length : 0;
    const pct = Math.min(99, Math.round(((0.5 * costPct + 0.5 * countPct)) * 100));
    yield { type: 'progress', pct, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: `Local detectors — ${completedIds.length}/${reqIds.length} complete` };
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Local detectors — ${completedIds.length}/${reqIds.length} complete`, phase: 'clone' };
    yield { type: 'progress', pct: Math.min(99, pct + 1), elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: 'Scoring — gates evaluated' };
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: 'Scoring — gates evaluated', phase: 'scoring' };
  }

  budget.cancel();
  const covered = new Set(facts.map((f) => f.detectorId));
  for (const id of ids) {
    if (!covered.has(id)) {
      facts.push({ id, detectorId: id, schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'budget', version: toolVersion('budget'), flags: [], durationMs: 0 }, truncated: true, error: { kind: 'cap' as const, detail: 'budget-exceeded' }, root: '/', scanId } as unknown as FactRecord);
    }
  }
  facts.sort((a, b) => String(a.detectorId).localeCompare(String(b.detectorId)));

  {
    const elapsedMs = Date.now() - start;
    const unknownCount = facts.filter((f) => (f as unknown as { error?: unknown }).error).length;
    const status = unknownCount === 0 ? 'complete' : 'degraded';
    yield { type: 'trace', ts: elapsedMs, elapsedMs, label: `Seal — ${status} · ${facts.filter((f) => !(f as unknown as { error?: unknown }).error).length}/${ids.length} measured`, phase: 'seal', status };
  }

  const snapshot: Record<string, unknown> = {
    repo: absPath,
    scanned_at: new Date().toISOString(),
    engine_version: 'unified/1.0',
    rubric_version: 'docs/rubric@tranche-a',
    scanned_commit: commitSha,
    local_path: absPath,
  };
  if (archetypeResult) {
    snapshot.archetype = archetypeResult.archetype;
    snapshot.archetype_confidence = archetypeResult.confidence;
    snapshot.planeInventory = archetypeResult.planeInventory;
    snapshot.archetype_evidence = archetypeResult.evidencePointers;
    if (archetypeResult.perRoot) snapshot.perRoot = archetypeResult.perRoot;
  } else {
    snapshot.archetype = 'unknown';
    snapshot.archetype_confidence = 'low';
    snapshot.planeInventory = { has_server: false, has_data: false, has_deploy: false, has_client: false, has_test: false, evidence: { has_server: [], has_data: [], has_deploy: [], has_client: [], has_test: [] } };
    snapshot.archetype_evidence = ['local scan — archetype unavailable'];
  }
  yield { type: 'done', facts, snapshot, id: scanId, strict: !!opts.strict };
}

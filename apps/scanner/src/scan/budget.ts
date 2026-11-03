/** engine/budget.ts — policy budget + uniform sharding (05 §4, Q3) */
// Phase 1: hard 10s wall-clock cap via AbortController + per-call timeouts.
// Phase 2 generalizes to uniform file-tree shard -> sampleN + byteCap.

export type BudgetLease = { timeoutMs: number; byteCap: number; sampleN?: number };

export type BudgetController = {
  signal: AbortSignal;
  lease(): BudgetLease;
  isDissolved(): boolean;
  cancel(): void;
  /** Thread deterministic sampleN after the canonical tree walk (deterministic-scoring 1.2). */
  setSampleN(n: number | undefined): void;
};

/** Wall-clock killer constant (deterministic-scoring D6/4.1): generous run-failure net,
 * not a control loop. Value confirmed by the 1.4 corpus spike; see change notes. */
export const KILLER_TIMEOUT_MS = 240_000;

/** Tree-read budget partitioned across the clone/local detectors. */
export const DETECTOR_TREE_BYTE_BUDGET = 4 * 1024 * 1024;

/** Read allocation reserved for the identity pass (report-identity design D2/D5):
 * the pass runs before the detector partition, with its own reader and its own
 * counter, so an identity read cap can never be mistaken for a detector cap and
 * identity cost cannot starve a detector. Reserved *on top of* the detector tree
 * budget — fixed work gets a base, indicator-derived work gets the rest, on the
 * `withCloneBase` precedent — so every detector's byte partition is identical
 * with and without the identity pass. */
export const IDENTITY_READ_ALLOCATION = 2 * 1024 * 1024;

/** The scan's total tree-read budget: detector partition plus the reserved
 * identity allocation. `identity: false` is the same scan without the pass. */
export function scanTreeReadBudget(opts: { identity?: boolean } = {}): number {
  return DETECTOR_TREE_BYTE_BUDGET + (opts.identity === false ? 0 : IDENTITY_READ_ALLOCATION);
}

export function createBudgetController(opts: { timeoutMs?: number; byteCap?: number; sampleN?: number } = {}): BudgetController {
  const timeoutMs = opts.timeoutMs ?? 10_000; // Phase-1 default; Phase-2 uses 240_000
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  let sampleN = opts.sampleN;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('budget-exceeded', 'TimeoutError')), timeoutMs);
  // allow process to exit in tests
  if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') (timer as unknown as { unref: () => void }).unref?.();

  return {
    signal: controller.signal,
    lease(): BudgetLease {
      const remaining = timeoutMs;
      return { timeoutMs: remaining, byteCap, sampleN };
    },
    setSampleN(n: number | undefined): void {
      sampleN = n;
    },
    isDissolved(): boolean {
      return controller.signal.aborted;
    },
    cancel() {
      clearTimeout(timer);
      if (!controller.signal.aborted) controller.abort(new DOMException('cancelled', 'AbortError'));
    },
  };
}

/** Uniform file-tree sharding: deterministic sampleN for slow-dissolvable detectors (05 §4) */
export function computeSampleN(fileCount: number, opts: { maxFiles?: number } = {}): number | undefined {
  const max = opts.maxFiles ?? 500;
  if (fileCount <= max) return undefined;
  // deterministic: same sampleN for all slow detectors in this scan
  return max;
}

/** Indicator-count-driven budget — unified: budgetMs = baseMs + Σ cost class, clamped */
export const BUDGET_COST: Record<string, number> = { fast: 5_000, 'api-budgeted': 10_000, 'slow-dissolvable': 40_000 };
export const INDICATOR_BUDGET_CLASS: Record<string, string> = {
  'VEL-06': 'fast', 'VEL-08': 'fast', 'VEL-10': 'fast', 'TEST-08': 'fast',
  'VEL-09': 'api-budgeted', 'SEC-07': 'api-budgeted',
  'ECOS-01': 'api-budgeted', 'ECOS-02': 'api-budgeted', 'ECOS-03': 'api-budgeted', 'ECOS-07': 'fast', 'ECOS-05': 'slow-dissolvable',
  'SEC-01': 'fast', 'SEC-06': 'fast', 'SEC-02': 'fast',
  'ARCH-01': 'slow-dissolvable', 'ARCH-08': 'slow-dissolvable', 'ARCH-05': 'api-budgeted',
  'TEST-03': 'fast', 'TEST-05': 'fast',
  // Tranche A (12 Tier-A measured, fast except DOCS-08 api-budgeted)
  'DOCS-01': 'fast', 'DOCS-03': 'fast', 'DOCS-04': 'fast', 'DOCS-09': 'fast',
  'PERF-02': 'fast', 'PERF-06': 'fast',
  'DATA-01': 'fast',
  'ECOS-06': 'fast', 'ECOS-08': 'fast',
  'SEC-09': 'fast', 'SEC-10': 'fast',
  'DOCS-08': 'api-budgeted',
};

export function budgetForIndicators(ids: string[], opts: { withCloneBase?: boolean } = {}): { budgetMs: number; breakdown: Record<string, number>; indicatorCount: number } {
  const withClone = opts.withCloneBase ?? ids.some((id) => INDICATOR_BUDGET_CLASS[id] === 'slow-dissolvable');
  const base = withClone ? 30_000 : 5_000;
  const counts: Record<string, number> = { fast: 0, 'api-budgeted': 0, 'slow-dissolvable': 0 };
  for (const id of ids) {
    const cls = INDICATOR_BUDGET_CLASS[id] ?? 'fast';
    counts[cls] = (counts[cls] ?? 0) + 1;
  }
  let sum = base;
  for (const [cls, n] of Object.entries(counts)) sum += (BUDGET_COST[cls] ?? 5_000) * n;
  // clamp: MVP Phase1 ~10s, Phase2 ~240s, but allow larger for v1 59
  const clamped = Math.min(Math.max(sum, 10_000), 240_000);
  // For small Phase1 list (6) with base 5s: 5 + 4*5 +2*10 = 5+20+20=45s clamped to 10s → need special: if not withClone, clamp to 10s max
  // So apply phase-specific clamp: no clone → max 15s
  const final = withClone ? clamped : Math.min(Math.max(sum, 10_000), 15_000);
  return { budgetMs: final, breakdown: counts, indicatorCount: ids.length };
}

export function createBudgetControllerForIndicators(ids: string[], opts: { byteCap?: number; withCloneBase?: boolean; sampleN?: number; killerMs?: number } = {}): BudgetController & { budgetMs: number; breakdown: Record<string, number>; killerMs: number } {
  const { budgetMs, breakdown } = budgetForIndicators(ids, opts);
  // The wall-clock budget is a pathological-repo killer only (deterministic-scoring
  // 4.1): a fixed generous constant independent of the indicator list. It never
  // degrades rows — when it fires the run fails loudly with no sealed headline.
  const killerMs = opts.killerMs ?? KILLER_TIMEOUT_MS;
  const ctrl = createBudgetController({ timeoutMs: killerMs, byteCap: opts.byteCap, sampleN: opts.sampleN });
  return Object.assign(ctrl, { budgetMs, breakdown, killerMs });
}

/** True when the wall-clock killer (not a normal cancel) aborted the signal.
 * budget.cancel() aborts with 'cancelled'/AbortError; the killer aborts with
 * DOMException('budget-exceeded', 'TimeoutError'). Check BEFORE cancel(). */
export function isKillerTrip(signal: AbortSignal): boolean {
  if (!signal.aborted) return false;
  const reason = signal.reason as unknown;
  const msg = reason instanceof DOMException ? reason.message : String(reason ?? '');
  return msg.includes('budget-exceeded');
}

/** Test/CI escape hatch for the killer constant (4.1 verification only). */
export function killerMsFromEnv(env: Record<string, string | undefined>): number | undefined {
  const raw = env.LEAPSCORE_KILLER_MS;
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
/** Partition a total byte budget across detectors so no detector can exhaust
 * another's budget (deterministic-scoring 1.3). Even split with a 256 KiB floor. */
export function partitionByteCap(totalByteCap: number, detectorCount: number): number {
  if (detectorCount <= 0) return totalByteCap;
  return Math.max(256 * 1024, Math.floor(totalByteCap / detectorCount));
}

/** True when a read failed because a byte budget was exceeded — the readFile
 * wrappers (clone.ts/local.ts) throw `QuotaExceededError` with a 'byteCap'
 * message. Budget truncation must be disclosed by the consumer, never swallowed
 * into a partial verdict (legacy-stacks 8.1). */
export function isReadBudgetError(e: unknown): boolean {
  const name = (e as { name?: string } | null)?.name;
  if (name === 'QuotaExceededError') return true;
  const msg = e instanceof Error ? e.message : String(e ?? '');
  return /bytecap|read budget/i.test(msg);
}

/** Helper: race a promise against an AbortSignal with cap semantics */
export function withBudget<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (v) => { signal.removeEventListener('abort', onAbort); resolve(v); },
      (e) => { signal.removeEventListener('abort', onAbort); reject(e); },
    );
  });
}

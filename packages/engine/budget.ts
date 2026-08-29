/** engine/budget.ts — policy budget + uniform sharding (05 §4, Q3) */
// Phase 1: hard 10s wall-clock cap via AbortController + per-call timeouts.
// Phase 2 generalizes to uniform file-tree shard -> sampleN + byteCap.

export type BudgetLease = { timeoutMs: number; byteCap: number; sampleN?: number };

export type BudgetController = {
  signal: AbortSignal;
  lease(): BudgetLease;
  isDissolved(): boolean;
  cancel(): void;
};

export function createBudgetController(opts: { timeoutMs?: number; byteCap?: number; sampleN?: number } = {}): BudgetController {
  const timeoutMs = opts.timeoutMs ?? 10_000; // Phase-1 default; Phase-2 uses 240_000
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('budget-exceeded', 'TimeoutError')), timeoutMs);
  // allow process to exit in tests
  if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') (timer as unknown as { unref: () => void }).unref?.();

  return {
    signal: controller.signal,
    lease(): BudgetLease {
      const remaining = timeoutMs;
      return { timeoutMs: remaining, byteCap, sampleN: opts.sampleN };
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

export function createBudgetControllerForIndicators(ids: string[], opts: { byteCap?: number; withCloneBase?: boolean } = {}): BudgetController & { budgetMs: number; breakdown: Record<string, number> } {
  const { budgetMs, breakdown } = budgetForIndicators(ids, opts);
  const ctrl = createBudgetController({ timeoutMs: budgetMs, byteCap: opts.byteCap });
  return Object.assign(ctrl, { budgetMs, breakdown });
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

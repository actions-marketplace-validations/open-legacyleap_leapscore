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

export function createBudgetController(opts: { timeoutMs?: number; byteCap?: number } = {}): BudgetController {
  const timeoutMs = opts.timeoutMs ?? 10_000; // Phase-1 default
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('budget-exceeded', 'TimeoutError')), timeoutMs);
  // allow process to exit in tests
  if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') (timer as unknown as { unref: () => void }).unref?.();

  return {
    signal: controller.signal,
    lease(): BudgetLease {
      const remaining = timeoutMs; // simplified: full lease for Phase 1 (no sharding)
      return { timeoutMs: remaining, byteCap };
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

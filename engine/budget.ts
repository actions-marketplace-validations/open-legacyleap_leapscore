/** engine/budget.ts — policy budget + uniform sharding (05 §4, Q3) */
// Wall-clock cap 1-5min, per-detector timeout+byteCap, uniform file-tree shard -> sampleN.
// byteCap + abort -> truncated=true -> scorer forces estimated+scope-limited or unknown rate-limited.
// Concurrency = min(4, cpus) via BUDGET_CONCURRENCY env.
// Stub.

export type BudgetLease = { timeoutMs: number; byteCap: number; sampleN?: number };
export function createBudgetController(_opts: unknown) { return { lease(): BudgetLease { return { timeoutMs: 30000, byteCap: 4 * 1024 * 1024 }; }, isDissolved(): boolean { return false; } }; }

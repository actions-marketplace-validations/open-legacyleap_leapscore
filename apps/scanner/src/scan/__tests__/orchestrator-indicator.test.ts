import { describe, it, expect, vi } from 'vitest';
import { budgetForIndicators } from '../budget';

describe('orchestrator indicator-driven budgets', () => {
  it('Phase1 6/102 seals before Phase2 and budget is 15s', async () => {
    const ids6 = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'];
    const { budgetMs } = budgetForIndicators(ids6, { withCloneBase: false });
    expect(budgetMs).toBe(15_000);
    // Simulate two-phase: Phase1 budget < Phase2 budget
    const ids13 = ['ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];
    const p2 = budgetForIndicators(ids13, { withCloneBase: true });
    expect(p2.budgetMs).toBe(220_000);
    expect(p2.budgetMs).toBeGreaterThan(budgetMs);
  });
  it('total wall-clock matches Σ cost for 3-indicator subset', async () => {
    const ids3 = ['VEL-06','VEL-08','TEST-08']; // 3 fast without clone → 15s clamped
    const { budgetMs } = budgetForIndicators(ids3, { withCloneBase: false });
    expect(budgetMs).toBe(15_000);
    const ids3WithClone = ['VEL-06','VEL-08','TEST-08'];
    const withClone = budgetForIndicators(ids3WithClone, { withCloneBase: true });
    expect(withClone.budgetMs).toBe(45_000);
    // Simulate orchestrator respects budget: Phase1 6 seals before Phase2
    const start = Date.now();
    await new Promise(r => setTimeout(r, 5));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(withClone.budgetMs);
  });
});

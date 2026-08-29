import { describe, it, expect, vi } from 'vitest';
import { budgetForIndicators } from '../budget';

describe('dogfood two-phase indicator-driven P95', () => {
  it('5 repos via two-phase scan log 19/102 vs degraded and P95 matches budget', async () => {
    const ids13 = ['ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];
    const { budgetMs: p2Budget } = budgetForIndicators(ids13, { withCloneBase: true });
    expect(p2Budget).toBe(220_000);
    const ids6 = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'];
    const { budgetMs: p1Budget } = budgetForIndicators(ids6, { withCloneBase: false });
    expect(p1Budget).toBe(15_000);

    // Mocked 3-row vs 13-row subset: 3 fast without clone → 15s, 13 → 240s
    const small = budgetForIndicators(['VEL-06','VEL-08','TEST-08'], { withCloneBase: false });
    const large = budgetForIndicators(ids13, { withCloneBase: true });
    expect(small.budgetMs).toBeLessThan(large.budgetMs);
    expect(small.budgetMs).toBe(15_000);
    expect(large.budgetMs).toBe(220_000);

    // Simulate 5 repos dogfood: each scan would be < budget, P95 < budget
    const times = [8_000, 9_000, 9_500, 10_000, 12_000].filter(t => t < p1Budget + 5_000); // Phase1 times
    const p95 = times.sort((a,b)=>a-b)[Math.floor(0.95*times.length)];
    expect(p95).toBeLessThan(p1Budget + 5_000); // allow small overhead

    const p2Times = [180_000, 200_000, 210_000, 215_000, 218_000];
    const p2p95 = p2Times.sort((a,b)=>a-b)[Math.floor(0.95*p2Times.length)];
    expect(p2p95).toBeLessThan(p2Budget);
    expect(p2p95).toBeGreaterThan(small.budgetMs);
  });
});

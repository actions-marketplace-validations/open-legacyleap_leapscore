import { describe, it, expect } from 'vitest';
import {
  DETECTOR_TREE_BYTE_BUDGET,
  IDENTITY_READ_ALLOCATION,
  budgetForIndicators,
  createBudgetControllerForIndicators,
  computeSampleN,
  partitionByteCap,
  scanTreeReadBudget,
} from '../budget';

describe('indicator-driven budget', () => {
  it('6 IDs → ~15s (Phase1, no clone base)', () => {
    const { budgetMs } = budgetForIndicators(['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'], { withCloneBase: false });
    expect(budgetMs).toBe(15_000);
  });
  it('13 IDs → ~220s (Phase2, clone base)', () => {
    const ids = ['ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];
    const { budgetMs } = budgetForIndicators(ids, { withCloneBase: true });
    expect(budgetMs).toBe(220_000);
  });
  it('3 fast only → ~45s with clone base (indicator-driven)', () => {
    const { budgetMs } = budgetForIndicators(['VEL-06','VEL-08','TEST-08'], { withCloneBase: true });
    expect(budgetMs).toBe(45_000);
  });
  it('3 fast without clone → clamped 15s', () => {
    const { budgetMs } = budgetForIndicators(['VEL-06','VEL-08','TEST-08'], { withCloneBase: false });
    expect(budgetMs).toBeGreaterThanOrEqual(10_000);
    expect(budgetMs).toBeLessThanOrEqual(15_000);
  });
  it('two slow detectors receive same sampleN via uniform sharding', () => {
    const n1 = computeSampleN(1200);
    const n2 = computeSampleN(1200);
    expect(n1).toBe(n2);
    expect(n1).toBe(500);
    const ctrl = createBudgetControllerForIndicators(['ARCH-01','ARCH-08'], { withCloneBase: true });
    expect(ctrl.budgetMs).toBeGreaterThan(0);
    expect(ctrl.lease().sampleN).toBeUndefined(); // sampleN comes from file sharding, not budgetMs
    // simulate fileCount sharding: both detectors get same sampleN
    const s1 = computeSampleN(2000);
    const s2 = computeSampleN(2000);
    expect(s1).toBe(s2);
  });
  it('createBudgetControllerForIndicators exposes budgetMs and breakdown', () => {
    const ctrl = createBudgetControllerForIndicators(['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'], { withCloneBase: false });
    expect(ctrl.budgetMs).toBe(15_000);
    // The wall-clock timeout is the fixed killer constant, independent of the list (4.1)
    expect(ctrl.lease().timeoutMs).toBe(240_000);
    expect(ctrl.killerMs).toBe(240_000);
    ctrl.cancel();
  });
  it('31 IDs (Tranche A) → clamped 240s', () => {
    const { budgetMs } = budgetForIndicators(['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08','ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05','DOCS-01','DOCS-03','DOCS-04','DOCS-08','DOCS-09','PERF-02','PERF-06','DATA-01','ECOS-06','ECOS-08','SEC-09','SEC-10'], { withCloneBase: true });
    expect(budgetMs).toBe(240_000);
    expect(budgetMs).toBeLessThanOrEqual(240_000);
  });
});

describe('reserved identity read allocation (report-identity 3.1)', () => {
  it('is a named reservation applied before the detector partition', () => {
    expect(IDENTITY_READ_ALLOCATION).toBeGreaterThan(0);
    expect(scanTreeReadBudget({ identity: true })).toBe(
      DETECTOR_TREE_BYTE_BUDGET + IDENTITY_READ_ALLOCATION,
    );
    expect(scanTreeReadBudget({ identity: false })).toBe(DETECTOR_TREE_BYTE_BUDGET);
    expect(scanTreeReadBudget({ identity: true }) - IDENTITY_READ_ALLOCATION).toBe(
      DETECTOR_TREE_BYTE_BUDGET,
    );
  });

  it('leaves every detector byte partition identical with and without the identity pass', () => {
    for (const count of [1, 6, 25, 31]) {
      const withIdentity = partitionByteCap(DETECTOR_TREE_BYTE_BUDGET, count);
      const withoutIdentity = partitionByteCap(
        scanTreeReadBudget({ identity: false }),
        count,
      );
      expect(withIdentity).toBe(withoutIdentity);
      // And the reservation is additive: it never comes out of the detector split.
      expect(scanTreeReadBudget({ identity: true })).toBeGreaterThan(DETECTOR_TREE_BYTE_BUDGET);
    }
  });
});

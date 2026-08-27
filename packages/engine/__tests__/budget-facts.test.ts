import { describe, it, expect } from 'vitest';
import { createBudgetController, withBudget } from '../budget';
import { validateFact } from '../facts';
import type { FactRecord } from '../facts';

describe('budget', () => {
  it('aborts after timeout', async () => {
    const bc = createBudgetController({ timeoutMs: 15 });
    const p = withBudget(new Promise(() => {}), bc.signal);
    await expect(p).rejects.toBeInstanceOf(DOMException);
    expect(bc.isDissolved()).toBe(true);
    bc.cancel();
  });
  it('lease returns timeoutMs', () => {
    const bc = createBudgetController({ timeoutMs: 10_000 });
    expect(bc.lease().timeoutMs).toBe(10_000);
    bc.cancel();
  });
});

describe('facts envelope validation', () => {
  it('accepts valid envelope', () => {
    const r: FactRecord = {
      id: 'VEL-09',
      detectorId: 'VEL-09',
      schemaVersion: '1.0.0',
      facts: { prs_sampled: 10 },
      evidencePointers: [{ endpoint: '/pulls' }],
      provenance: { tool: 'gh-api', version: '1', flags: [], durationMs: 12 },
      truncated: false,
      root: '/',
    };
    expect(validateFact(r).ok).toBe(true);
  });
  it('rejects forbidden keys', () => {
    const r = {
      id: 'VEL-09',
      detectorId: 'VEL-09',
      schemaVersion: '1.0.0',
      facts: { score: 3 },
      evidencePointers: [],
      provenance: { tool: 'gh-api', version: '1', flags: [], durationMs: 1 },
      truncated: false,
      root: '/',
    } as unknown as FactRecord;
    const v = validateFact(r);
    expect(v.ok).toBe(false);
    expect(v.errors?.some(e => e.includes('forbidden'))).toBe(true);
  });
  it('rejects missing provenance', () => {
    const r = {
      id: 'VEL-09',
      detectorId: 'VEL-09',
      schemaVersion: '1.0.0',
      facts: {},
      evidencePointers: [],
      truncated: false,
      root: '/',
    } as unknown as FactRecord;
    expect(validateFact(r).ok).toBe(false);
  });
});

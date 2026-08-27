import { describe, it, expect, vi } from 'vitest';
import { getReportProviderForTest, SampleReportProvider } from '@/lib/provider';
import type { ReportProvider, Report } from '@/lib/types';

function mockLive(score: number): ReportProvider {
  return {
    async getReport(): Promise<Report> {
      return { headline: { score, tier: 'Moderate', ci_band: 'live' }, coverage: { measured: 6, estimated: 0, unknown: 96, not_applicable: 0, measured_pct: '6%', estimated_pct: '0%', unknown_pct: '94%' }, gates: [], categories: [], top_blockers: [], deep_dive_scope: [], full_table: [], report_schema: '1', id: 'live', status: 'complete', snapshot: { repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 'live', rubric_version: '1' }, sample: true } as unknown as Report;
    },
  };
}

describe('provider live vs fixture toggle', () => {
  it('returns sample when live flag off', async () => {
    const p = getReportProviderForTest({ live: null }, { tokenPresent: true, liveImpl: mockLive(42) });
    const r = await p.getReport({ repo: 'o/r' });
    expect(r.coverage.measured).not.toBe(6); // sample has ~65% measured
    expect(r.snapshot.engine_version).toContain('mock adapter');
  });
  it('returns live when live=1 and token present', async () => {
    const live = mockLive(42);
    const p = getReportProviderForTest({ live: '1' }, { tokenPresent: true, liveImpl: live });
    const r = await p.getReport({ repo: 'o/r' });
    expect(r.headline.score).toBe(42);
    expect(r.coverage.measured).toBe(6);
  });
  it('falls back to sample when token absent even with live=1', async () => {
    const p = getReportProviderForTest({ live: '1' }, { tokenPresent: false, liveImpl: mockLive(42) });
    const r = await p.getReport({ repo: 'o/r' });
    expect(r.coverage.measured).not.toBe(6);
  });
  it('sample provider still deterministically scores 58', async () => {
    const p = new SampleReportProvider();
    const r = await p.getReport({ repo: 'django/django' });
    expect(r.headline.score).toBe(58);
  });
});

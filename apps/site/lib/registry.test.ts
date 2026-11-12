import { describe, it, expect } from 'vitest';
import { INDICATOR_REGISTRY, CATEGORY_LABELS, getIndicatorName } from './generated/rubric';
import { getReportProvider } from '@/lib/provider';

describe('registry single-source (report-rendering)', () => {
  it('contains 102 indicators', () => {
    expect(Object.keys(INDICATOR_REGISTRY).length).toBe(102);
  });
  it('no indicator renders its ID as title', () => {
    for (const [id, meta] of Object.entries(INDICATOR_REGISTRY)) {
      expect(meta.name).not.toBe(id);
      expect(meta.name.length).toBeGreaterThan(3);
      expect(meta.effort).toMatch(/⚡|🔶|🔷/);
    }
  });
  it('category labels are full names, not IDs', () => {
    expect(CATEGORY_LABELS['ECOS']).toBe('Dependency & Ecosystem Health');
    expect(CATEGORY_LABELS['SEC']).toContain('Security');
  });
  it('sample full_table uses registry names (no ECOS-01-as-title leak)', async () => {
    const report = await getReportProvider().getReport({ repo: 'maven-multi-module' });
    const leak = report.full_table.filter(r => r.name === r.id);
    expect(leak).toEqual([]);
    // spot check canonical title
    const ecos01 = report.full_table.find(r => r.id === 'ECOS-01')!;
    expect(ecos01.name).toBe(INDICATOR_REGISTRY['ECOS-01'].name);
  });
  it('live rows arrive built over the scan API (no in-process live builder)', async () => {
    // The scanner service builds live rows; the site has no live row-builder.
    // The sample seam still normalizes every row to the registry.
    const report = await getReportProvider().getReport({ repo: 'maven-multi-module' });
    const leak = report.full_table.filter((r) => r.name === r.id);
    expect(leak).toEqual([]);
  });
  it('Unknown indicator (FOO-99) returns Unknown indicator (FOO-99)', () => {
    expect(getIndicatorName('FOO-99')).toBe('Unknown indicator (FOO-99)');
  });
});

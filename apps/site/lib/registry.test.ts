import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  INDICATOR_REGISTRY,
  CATEGORY_LABELS,
  CATEGORY_CHARTERS,
  CATEGORY_ORDER,
  getIndicatorName,
} from './generated/rubric';
import { getSample } from '@/lib/samples';

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
  it('sample full_table uses registry names (no ECOS-01-as-title leak)', () => {
    const report = getSample('maven-multi-module')!.envelope.report;
    const leak = report.full_table.filter(r => r.name === r.id);
    expect(leak).toEqual([]);
    // spot check canonical title
    const ecos01 = report.full_table.find(r => r.id === 'ECOS-01')!;
    expect(ecos01.name).toBe(INDICATOR_REGISTRY['ECOS-01'].name);
  });
  it('live rows arrive built over the scan API (no in-process live builder)', () => {
    // The scanner service builds live rows; the site has no live row-builder.
    // The sample seam still normalizes every row to the registry.
    const report = getSample('maven-multi-module')!.envelope.report;
    const leak = report.full_table.filter((r) => r.name === r.id);
    expect(leak).toEqual([]);
  });
  it('Unknown indicator (FOO-99) returns Unknown indicator (FOO-99)', () => {
    expect(getIndicatorName('FOO-99')).toBe('Unknown indicator (FOO-99)');
  });

  it('carries the browser contract for all 102 entries', () => {
    for (const [id, meta] of Object.entries(INDICATOR_REGISTRY)) {
      expect(['YES', 'NO', 'PART'], `${id} v1`).toContain(meta.v1);
      expect(['standard', 'deep-dive'], `${id} rollup`).toContain(meta.rollup);
      expect(Array.isArray(meta.gates), `${id} gates`).toBe(true);
      expect(meta.definition, `${id} definition`).toBeTruthy();
      expect(meta.why, `${id} why`).toBeTruthy();
      expect(meta.manifests, `${id} manifests`).toBeTruthy();
      expect(meta.detection, `${id} detection`).toBeTruthy();
      expect(meta.yellow, `${id} yellow`).toBeTruthy();
      expect(meta.red, `${id} red`).toBeTruthy();
      expect(meta.yellow_rationale, `${id} yellow rationale`).toBeTruthy();
      expect(meta.red_rationale, `${id} red rationale`).toBeTruthy();
      const levels = ['3', '2', '1', '0'].map((level) => meta.criteria[level as '3']);
      expect(levels.every(Boolean), `${id} criteria levels`).toBe(true);
      expect(meta.scope, `${id} scope`).toBeTruthy();
      expect(meta.statusing, `${id} statusing`).toBeTruthy();
      expect(meta.score_mapping, `${id} score mapping`).toBeTruthy();
      expect(meta.fact_schema, `${id} fact schema`).toBeTruthy();
      expect(meta.evidence, `${id} evidence`).toBeTruthy();
    }
  });

  it('every category charter is emitted verbatim', () => {
    expect(CATEGORY_ORDER).toHaveLength(10);
    const indicatorsDir = join(process.cwd(), '..', '..', 'docs', 'rubric', 'indicators');
    const dirs = readdirSync(indicatorsDir).filter((entry) => /^\d{2}-/.test(entry));
    for (const code of CATEGORY_ORDER) {
      const candidates = dirs.filter((entry) => {
        const text = readFileSync(join(indicatorsDir, entry, 'README.md'), 'utf8');
        return new RegExp(`\\|\\s*${code}-\\d{2}\\s*\\|`).test(text);
      });
      expect(candidates.length, `${code} charter`).toBeGreaterThan(0);
      const charter = readFileSync(join(indicatorsDir, candidates[0], 'README.md'), 'utf8');
      const thesis = charter.match(/^\*\*Thesis:\*\*\s*(.+)$/m)?.[1]?.trim();
      const summary = charter.match(/^\*\*Category summary:\*\*\s*(.+)$/m)?.[1]?.trim();
      expect(CATEGORY_CHARTERS[code].thesis).toBe(thesis);
      expect(CATEGORY_CHARTERS[code].summary).toBe(summary);
    }
  });
});

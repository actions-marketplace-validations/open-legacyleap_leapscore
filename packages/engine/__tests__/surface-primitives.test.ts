import { describe, it, expect } from 'vitest';
import { normalizeTargetSlug } from '../surface/slug';
import { buildToken, parseToken, renderTitle } from '../surface/identity';
import { selectSurfaceRows, categoryOf } from '../surface/rows';
import type { EnvelopeRow } from '../surface/rows';
import { bandOf, splitHumanZone, parsePreviousStatus, renderGeneratedBody, renderBody, HUMAN_MARKER } from '../surface/body';
import { labelsFor, categoryLabel, severityLabel } from '../surface/labels';

describe('normalizeTargetSlug (1.1)', () => {
  it('maps owner/repo to owner-repo lowercase', () => {
    expect(normalizeTargetSlug('django/django')).toBe('django-django');
    expect(normalizeTargetSlug('Vercel/Next.js')).toBe('vercel-next-js');
  });
  it('tolerates slug collisions deterministically', () => {
    expect(normalizeTargetSlug('a/b-c')).toBe(normalizeTargetSlug('a-b/c'));
  });
  it('trims dashes and caps at 64 chars', () => {
    expect(normalizeTargetSlug('--a//b--')).toBe('a-b');
    expect(normalizeTargetSlug(`${'a'.repeat(40)}/${'b'.repeat(40)}`).length).toBe(64);
  });
});

describe('identity token (1.2)', () => {
  it('round-trips build/parse', () => {
    const t = buildToken('django/django', 'SEC-01');
    expect(parseToken(`prefix\n${t}\nrest`)).toEqual({ version: 'v1', target: 'django/django', indicator: 'SEC-01' });
  });
  it('titles are cosmetic — parse ignores them', () => {
    expect(parseToken('[LeapScore] django/django SEC-01: whatever')).toBeNull();
    expect(renderTitle('django/django', 'SEC-01', 'Secrets')).toBe('[LeapScore] django/django SEC-01: Secrets');
  });
  it('rejects missing/malformed tokens, tolerates extra whitespace', () => {
    expect(parseToken('no token here')).toBeNull();
    expect(parseToken('<!-- leapscore:v1 target=a/b -->')).toBeNull();
    expect(parseToken('<!--  leapscore:v1   target=a/b   indicator=SEC-01   -->')).toEqual({
      version: 'v1',
      target: 'a/b',
      indicator: 'SEC-01',
    });
  });
});

function row(over: Partial<EnvelopeRow> & { id: string }): EnvelopeRow {
  return { name: over.id, status: 'measured', score: 1, category_id: over.id.split('-')[0], ...over } as EnvelopeRow;
}

describe('selectSurfaceRows (1.3)', () => {
  it('keeps applicable measured/estimated 0–2, drops the rest', () => {
    const table = [
      row({ id: 'SEC-01', status: 'measured', score: 0 }),
      row({ id: 'SEC-02', status: 'estimated', score: 2 }),
      row({ id: 'ECOS-01', status: 'measured', score: 3 }),
      row({ id: 'ARCH-01', status: 'unknown' }),
      row({ id: 'DOCS-01', status: 'measured', score: 1, not_applicable: true }),
      row({ id: 'VEL-06', status: 'measured', score: undefined }),
      row({ id: 'PERF-02', status: 'estimated', score: 1 }),
      row({ id: 'DATA-01', status: 'measured', score: 2 }),
    ];
    expect(selectSurfaceRows(table).map((r) => r.id)).toEqual(['SEC-01', 'SEC-02', 'PERF-02', 'DATA-01']);
  });
  it('rejects non-arrays', () => {
    expect(selectSurfaceRows(null)).toEqual([]);
  });
  it('derives category from id prefix fallback', () => {
    expect(categoryOf({ id: 'SEC-09', name: 'x', status: 'measured' })).toBe('SEC');
  });
});

describe('body render + human zone (1.4)', () => {
  const r = row({
    id: 'SEC-01',
    name: 'Secrets',
    status: 'measured',
    score: 1,
    reason: 'live secret found in history',
    evidence: { tool: 'gitleaks', pointers: [{ file: 'a.py', line: 3 }] },
    effort: '🔶 ~2–4 h',
    remediation: { quick_win: 'rotate now', structural: 'pre-commit hooks', gold_standard: 'zero', effort: '🔶 ~2–4 h' },
  });
  const ctx = { target: 'django/django', row: r, repoSha: 'abc1234', engineRef: 'def5678', runUrl: 'https://x/runs/1' };
  it('renders token, status, evidence, remediation, provenance', () => {
    const b = renderGeneratedBody(ctx);
    expect(b).toContain('<!-- leapscore:v1 target=django/django indicator=SEC-01 -->');
    expect(b).toContain('Status: Red (score 1/3, measured)');
    expect(b).toContain('live secret found');
    expect(b).toContain('rotate now');
    expect(b).toContain('abc1234 · engine def5678');
    expect(parsePreviousStatus(b)).toEqual({ band: 'Red', score: 1 });
  });
  it('band thresholds', () => {
    expect(bandOf(0)).toBe('Red');
    expect(bandOf(2)).toBe('Yellow');
    expect(bandOf(3)).toBe('Green');
  });
  it('preserves the human zone byte-for-byte across regeneration', () => {
    const human = 'Rollout notes:\n- step 1\n- step 2  ';
    const first = renderBody(ctx, human);
    expect(first).toContain(HUMAN_MARKER);
    const { generated, human: kept } = splitHumanZone(first);
    expect(kept).toBe(human);
    const regen = renderBody({ ...ctx, repoSha: 'zzz9999' }, kept);
    expect(splitHumanZone(regen).human).toBe(human);
    expect(regen).toContain('zzz9999');
    expect(parsePreviousStatus(generated)).not.toBeNull();
  });
});

describe('labels (1.5)', () => {
  it('computes the full set with gate flag', () => {
    const r = row({ id: 'SEC-01', score: 1 });
    expect(labelsFor({ row: r, slug: 'django-django', inGate: true })).toEqual([
      'leapscore',
      'leapscore:red',
      'leapscore:sec',
      'leapscore:target-django-django',
      'leapscore:gate',
    ]);
  });
  it('swaps severity on band change and omits gate when clear', () => {
    const r = row({ id: 'VEL-06', score: 2 });
    expect(labelsFor({ row: r, slug: 'a-b', inGate: false })).toContain('leapscore:yellow');
    expect(labelsFor({ row: r, slug: 'a-b', inGate: false })).not.toContain('leapscore:gate');
  });
  it('falls back for unknown categories', () => {
    expect(categoryLabel({ id: 'XX-01', name: 'x', status: 'measured' })).toBe('leapscore:xx');
    expect(severityLabel(0)).toBe('leapscore:red');
  });
});

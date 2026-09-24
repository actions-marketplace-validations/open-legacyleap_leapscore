import { describe, it, expect } from 'vitest';
import { planLifecycle } from '../surface/lifecycle';
import type { PlanContext } from '../surface/lifecycle';
import { checkSurfaceAllowed, GUARDRAIL_SKIP_REASON } from '../surface/guardrail';
import { formatSummaryLine, formatStepSummary } from '../surface/summary';
import { renderGeneratedBody } from '../surface/body';
import { buildToken } from '../surface/identity';
import type { EnvelopeRow } from '../surface/rows';
import type { DiscoveredIssue } from '../surface/discover';

const ctx: PlanContext = {
  target: 'django/django',
  slug: 'django-django',
  gateRowIds: new Set(['SEC-01']),
  repoSha: 'abc1234',
  engineRef: 'def5678',
  runUrl: 'https://x/runs/1',
};

function row(over: Partial<EnvelopeRow> & { id: string }): EnvelopeRow {
  return { name: over.id, status: 'measured', score: 1, category_id: over.id.split('-')[0], reason: 'r', ...over } as EnvelopeRow;
}

function discovered(number: number, target: string, indicator: string, score: number, state: 'open' | 'closed'): DiscoveredIssue {
  const r = row({ id: indicator, score });
  const body = `${buildToken(target, indicator)}\n${renderGeneratedBody({ target, row: r, repoSha: 'oldsha', engineRef: 'oldref' })}\n<!-- leapscore:human -->\n`;
  return { number, title: 't', body, state, indicator };
}

describe('planLifecycle (3.1)', () => {
  it('opens on first sighting with title/body/labels', () => {
    const [a] = planLifecycle(ctx, [row({ id: 'SEC-01', name: 'Secrets', score: 0 })], new Map(), []);
    expect(a.kind).toBe('open');
    if (a.kind === 'open') {
      expect(a.title).toBe('[LeapScore] django/django SEC-01: Secrets');
      expect(a.labels).toContain('leapscore:gate');
      expect(a.body).toContain('abc1234 · engine def5678');
      expect(a.body).toContain('https://x/runs/1');
    }
  });
  it('comments band change with transition + provenance', () => {
    const map = new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 2, 'open')]]);
    const [a] = planLifecycle(ctx, [row({ id: 'SEC-01', score: 0 })], map, []);
    expect(a.kind).toBe('comment');
    if (a.kind === 'comment') {
      expect(a.transition).toBe('Yellow→Red (score 2→0)');
      expect(a.comment).toContain('Yellow→Red');
      expect(a.comment).toContain('abc1234');
      expect(a.comment).toContain('def5678');
      expect(a.comment).toContain('https://x/runs/1');
    }
  });
  it('reopens closed issues on band change and on identical non-green', () => {
    const map = new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 2, 'closed')]]);
    const [a] = planLifecycle(ctx, [row({ id: 'SEC-01', score: 0 })], map, []);
    expect(a.kind).toBe('reopen');
    const map2 = new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 1, 'closed')]]);
    const [b] = planLifecycle(ctx, [row({ id: 'SEC-01', score: 1 })], map2, []);
    expect(b.kind).toBe('reopen');
    if (b.kind === 'reopen') expect(b.transition).toBeNull();
  });
  it('wobble comments without transition noise; identical refreshes silently', () => {
    const map = new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 0, 'open')]]);
    const [a] = planLifecycle(ctx, [row({ id: 'SEC-01', score: 1 })], map, []);
    expect(a.kind).toBe('comment');
    const [b] = planLifecycle(ctx, [row({ id: 'SEC-01', score: 1 })], new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 1, 'open')]]), []);
    expect(b.kind).toBe('refresh');
    if (b.kind === 'refresh') expect(b.comment).toBeNull();
  });
  it('closes now-green rows with transition', () => {
    const map = new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 0, 'open')]]);
    const green = row({ id: 'SEC-01', score: 3 });
    const [a] = planLifecycle(ctx, [], map, [green]);
    expect(a.kind).toBe('close');
    if (a.kind === 'close') expect(a.transition).toContain('→Green');
  });
  it('notes unmeasurable rows without state change', () => {
    const map = new Map([['SEC-01', discovered(1, ctx.target, 'SEC-01', 0, 'open')]]);
    const [a] = planLifecycle(ctx, [], map, [row({ id: 'SEC-01', status: 'unknown' })]);
    expect(a.kind).toBe('note');
    if (a.kind === 'note') {
      expect(a.comment).toContain('no longer measurable');
      expect(a.body).toBe(map.get('SEC-01')!.body);
    }
  });
  it('handles unparseable previous bodies without transition claims', () => {
    const map = new Map([
      ['SEC-01', { number: 1, title: 't', body: `${buildToken(ctx.target, 'SEC-01')}\nhand-written`, state: 'open' as const, indicator: 'SEC-01' }],
    ]);
    const [a] = planLifecycle(ctx, [row({ id: 'SEC-01', score: 1 })], map, []);
    expect(a.kind).toBe('comment');
    if (a.kind === 'comment') {
      expect(a.previous).toBeNull();
      expect(a.comment).not.toContain('→');
    }
  });
});

describe('checkSurfaceAllowed (3.2)', () => {
  it('covers all four cells of the visibility table', () => {
    expect(checkSurfaceAllowed({ isSelf: true, runnerPrivate: false, targetPrivate: true })).toEqual({ allowed: true });
    expect(checkSurfaceAllowed({ isSelf: false, runnerPrivate: true, targetPrivate: true })).toEqual({ allowed: true });
    expect(checkSurfaceAllowed({ isSelf: false, runnerPrivate: false, targetPrivate: false })).toEqual({ allowed: true });
    expect(checkSurfaceAllowed({ isSelf: false, runnerPrivate: false, targetPrivate: true })).toEqual({
      allowed: false,
      reason: GUARDRAIL_SKIP_REASON,
    });
  });
});

describe('summary contract (3.3)', () => {
  it('formats the exact summary line', () => {
    expect(formatSummaryLine({ opened: 3, commented: 5, closed: 1, skipped: 0 })).toBe(
      'surface: 3 opened / 5 commented / 1 closed / 0 skipped',
    );
  });
  it('renders step summary with burst, warnings, skip reasons', () => {
    const s = formatStepSummary({
      counts: { opened: 2, commented: 0, closed: 0, skipped: 0 },
      firstScan: true,
      warnings: ['duplicate token SEC-01: #1 wins'],
      skippedReason: undefined,
    });
    expect(s).toContain('surface: 2 opened / 0 commented / 0 closed / 0 skipped');
    expect(s).toContain('First-scan burst');
    expect(s).toContain('- Warning: duplicate token SEC-01: #1 wins');
    const s2 = formatStepSummary({ counts: { opened: 0, commented: 1, closed: 0, skipped: 0 }, firstScan: false, warnings: [] });
    expect(s2).not.toContain('First-scan burst');
    const s3 = formatStepSummary({
      counts: { opened: 0, commented: 0, closed: 0, skipped: 0 },
      firstScan: false,
      warnings: [],
      skippedReason: GUARDRAIL_SKIP_REASON,
    });
    expect(s3).toContain(`surface-skipped: ${GUARDRAIL_SKIP_REASON}`);
  });
});

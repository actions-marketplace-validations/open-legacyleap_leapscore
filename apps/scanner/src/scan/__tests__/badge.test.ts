/** apps/scanner/src/scan/__tests__/badge.test.ts — score-badge SVG + snippet
 * contract (spec: score-badge §Deterministic output, §Embed snippet). */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { badgeViewModel, CONTRACT_VERSION, BAND_PALETTE } from '@leapscore/contracts';
import { renderBadgeSvg, renderBadgeSnippet, badgeTextWidth } from '../badge';

type Fixture = {
  status?: string;
  score?: number;
  tier?: string;
  suppressed?: boolean;
  coverage?: { measured: number; estimated: number; unknown: number };
  scannedAt?: string;
};

function envelope(o: Fixture = {}) {
  return {
    contractVersion: CONTRACT_VERSION,
    meta: { runId: 'acme__api__a3f9c1__20261031T091200Z' },
    report: {
      status: o.status ?? 'complete',
      headline: {
        score: o.score ?? 62,
        tier: o.tier ?? 'Moderate',
        suppressed: o.suppressed ?? false,
      },
      coverage: o.coverage ?? { measured: 45, estimated: 20, unknown: 35 },
      snapshot: { scanned_at: o.scannedAt ?? '2026-10-31T09:12:00Z' },
    },
    trace: [],
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('2.1 fixed label + variable value, role=img, aria-label (golden file)', () => {
  it('matches the golden SVG for a scored envelope', () => {
    const svg = renderBadgeSvg(badgeViewModel(envelope()));
    const golden = readFileSync(join(__dirname, 'fixtures', 'badge.scored.svg'), 'utf8');
    expect(svg).toBe(golden);
  });

  it('emits role="img" and the full accessible sentence', () => {
    const vm = badgeViewModel(envelope());
    const svg = renderBadgeSvg(vm);
    expect(svg).toContain('role="img"');
    expect(svg).toContain(`aria-label="${vm.accessibleName}"`);
    expect(vm.accessibleName).toContain('62');
    expect(vm.accessibleName).toContain('Moderate');
    expect(vm.accessibleName).toContain('65% gradeable');
    expect(vm.accessibleName).toContain('October 2026');
  });

  it('keeps the label segment constant across states', () => {
    const scored = renderBadgeSvg(badgeViewModel(envelope()));
    const suppressed = renderBadgeSvg(
      badgeViewModel(envelope({ suppressed: true, coverage: { measured: 20, estimated: 21, unknown: 59 } })),
    );
    const label = '>leapscore</text>';
    expect(scored).toContain(label);
    expect(suppressed).toContain(label);
  });
});

describe('2.2 two visual tiers: tinted claim, untinted qualifier', () => {
  it('puts the tier hex exactly once, in the claim segment', () => {
    const svg = renderBadgeSvg(badgeViewModel(envelope()));
    const tierHex = BAND_PALETTE.Moderate;
    expect(svg.split(tierHex)).toHaveLength(2);
    const claimIndex = svg.indexOf('>62 Moderate</text>');
    const qualifierIndex = svg.indexOf('>65% · 2026-10</text>');
    expect(claimIndex).toBeGreaterThan(0);
    expect(qualifierIndex).toBeGreaterThan(claimIndex);
    const hexIndex = svg.indexOf(tierHex);
    expect(hexIndex).toBeLessThan(claimIndex);
    // The qualifier segment is untinted.
    const qualifierRect = svg.match(/<path d="M158[^"]*" fill="([^"]+)"\/>/);
    expect(qualifierRect?.[1]).not.toBe(tierHex);
  });

  it('carries no tier tint for an unscored claim', () => {
    const svg = renderBadgeSvg(badgeViewModel(envelope({ suppressed: true })));
    for (const hex of Object.values(BAND_PALETTE)) expect(svg).not.toContain(hex);
  });

  it('advances text deterministically', () => {
    expect(badgeTextWidth('62 Moderate')).toBe(badgeTextWidth('62 Moderate'));
    expect(badgeTextWidth('')).toBe(0);
  });
});

describe('2.3 deterministic, byte-identical output', () => {
  it('renders identical bytes twice and after a simulated clock change', () => {
    const first = renderBadgeSvg(badgeViewModel(envelope()));
    const second = renderBadgeSvg(badgeViewModel(envelope()));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-07-04T12:00:00Z'));
    const third = renderBadgeSvg(badgeViewModel(envelope()));
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(third).not.toContain('2031');
    expect(third).not.toContain('07-04');
  });
});

describe('2.4 self-contained SVG', () => {
  it('references nothing external and runs nothing', () => {
    const svg = renderBadgeSvg(badgeViewModel(envelope()));
    expect(svg).not.toMatch(/href/i);
    expect(svg).not.toContain('<script');
    expect(svg).not.toContain('@import');
    expect(svg).not.toContain('url(');
    expect(svg).not.toMatch(/<image/i);
    expect(svg).not.toContain('@font-face');
  });
});

describe('2.5 month is UTC-truncated and envelope-owned', () => {
  it('truncates a UTC timestamp at month precision', () => {
    const vm = badgeViewModel(envelope({ scannedAt: '2026-11-01T02:00:00Z' }));
    expect(vm.value).toContain('2026-11');
    expect(vm.value).not.toContain('2026-11-01');
  });

  it('regenerating an old envelope keeps the old month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-15T00:00:00Z'));
    const vm = badgeViewModel(envelope({ scannedAt: '2026-03-09T18:30:00Z' }));
    expect(vm.value).toContain('2026-03');
    expect(vm.value).not.toContain('2027');
  });
});

describe('3.1 embed snippet wraps the badge in the sealed permalink', () => {
  it('links to the run report and carries the full sentence as alt', () => {
    const vm = badgeViewModel(envelope());
    const snippet = renderBadgeSnippet(vm, { svgPath: 'docs/badge.svg' });
    const permalink = 'https://leapscore.dev/reports/acme__api__a3f9c1__20261031T091200Z';
    expect(vm.permalink).toBe(permalink);
    expect(snippet.markdown).toBe(
      `[![LeapScore badge: score 62, band Moderate, 65% gradeable, measured October 2026.](docs/badge.svg)](${permalink})`,
    );
    expect(snippet.html).toContain(`<a href="${permalink}">`);
    expect(snippet.html).toContain('src="docs/badge.svg"');
    expect(snippet.html).toContain('alt="LeapScore badge: score 62');
    // alt is the sentence, not a label
    expect(snippet.html).not.toContain('alt="badge"');
    expect(snippet.html).not.toMatch(/alt="62"/);
  });
});

describe('3.2 the citation link is not a campaign link', () => {
  it('carries no assessment parameters and resolves to /reports/<runId>', () => {
    const vm = badgeViewModel(envelope());
    const snippet = renderBadgeSnippet(vm, { svgPath: 'badge.svg' });
    for (const text of [snippet.markdown, snippet.html, vm.permalink]) {
      expect(text).not.toContain('utm_campaign');
      expect(text).not.toContain('band=');
      expect(text).not.toContain('/assessment');
    }
    expect(new URL(vm.permalink).pathname).toBe('/reports/acme__api__a3f9c1__20261031T091200Z');
  });
});

describe('6.2 the README note quotes the emitted snippet format verbatim', () => {
  it('documents the exact Markdown and HTML lines the emitter produces', () => {
    const vm = badgeViewModel(envelope());
    const snippet = renderBadgeSnippet(vm, { svgPath: 'docs/leapscore-badge.svg' });
    const readme = readFileSync(join(__dirname, '../../../README.md'), 'utf8');
    expect(readme).toContain(snippet.markdown);
    expect(readme).toContain(snippet.html);
    expect(readme).toMatch(/Regenerate in CI; never hand-edit the date\./);
  });
});

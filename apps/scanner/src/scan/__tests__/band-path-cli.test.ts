/** band-path change verification — seal wiring, stdout clause, band gate, cross-artifact consistency. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, gateOutcome, parseFailUnderBand } from '../../../bin/scan';
import { sealScan } from '../scoring/seal';
import { computeScoreFingerprint } from '../scoring/fingerprint';
import { renderHtml, renderMarkdown, type RenderInput } from '../render';
import {
  assessmentUrlForBand,
  bandPathBlock,
  bandThresholdFor,
  formatBandPathClause,
  POSITIONING_LINE,
  type NextBandPath,
} from '@leapscore/contracts';
import type { FactRecord } from '../facts';

function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-local-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }));
  writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
  writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
  return dir;
}

async function runCli(argv: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(argv, { env: {}, stdout: (s) => out.push(s), stderr: (s) => err.push(s) });
  return { code, out, err };
}

function readEnvelope(outDir: string): { report: Record<string, unknown> & { headline: { score: number; tier: string; suppressed?: boolean }; next_band_path?: NextBandPath; full_table: Array<{ id: string; status: string; score?: number }> }; meta: { score_fingerprint: string } } {
  return JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
}

function cleanup(...dirs: string[]) {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

function fake(id: string, facts: Record<string, unknown>): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts,
    evidencePointers: [{ detail: `${id} detail` }],
    provenance: { tool: 'test', version: '1', flags: ['test'], durationMs: 1 },
    truncated: false,
  } as unknown as FactRecord;
}

describe('2.6 derivation wired into the seal path', () => {
  it('a local scan seals report.json carrying a next-band path consistent with its own rows', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir]);
      expect(r.code).toBe(0);
      const env = readEnvelope(outDir);
      const path = env.report.next_band_path!;
      expect(path).toBeDefined();
      expect(path.terminal).toBe(false);
      // Destination resolves through the contract vocabulary, never a second table.
      const floor = bandThresholdFor(path.destination!.toLowerCase());
      expect(path.threshold).toBe(floor);
      expect(path.points_needed).toBeCloseTo(path.threshold! - env.report.headline.score, 10);
      // Classes appear in sprint, quarter, structural order with consistent arrival states.
      const order = ['sprint', 'quarter', 'structural'];
      expect(path.classes.map((c) => c.class)).toEqual(path.classes.map((c) => c.class).sort((a, b) => order.indexOf(a) - order.indexOf(b)));
      let cumulative = 0;
      for (const c of path.classes) {
        cumulative += c.pp;
        expect(c.cumulative_pp).toBeCloseTo(cumulative, 10);
        expect(c.arrival).toBe(c.pp >= path.points_needed! ? 'alone' : c.cumulative_pp >= path.points_needed! ? 'combined' : 'not-reached');
        expect(c.steps.length).toBeGreaterThan(0);
      }
      // Every step is a graded row of the sealed table, scoring 0–2, deduped.
      const rowById = new Map(env.report.full_table.map((row) => [row.id, row]));
      const stepIds = path.classes.flatMap((c) => c.steps).map((s) => s.row);
      expect(new Set(stepIds).size).toBe(stepIds.length);
      for (const id of stepIds) {
        const row = rowById.get(id)!;
        expect(row, id).toBeDefined();
        expect(['measured', 'estimated']).toContain(row.status);
        expect(row.score).toBeGreaterThanOrEqual(0);
        expect(row.score).toBeLessThanOrEqual(2);
      }
      // The unreached count is exactly the ungraded rows of the sealed table.
      const unreached = env.report.full_table.filter((row) => row.status === 'unknown' || row.status === 'not_implemented').length;
      expect(path.unreached_rows).toBe(unreached);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('2.7 the derived field never joins the fingerprint', () => {
  it('one fixture sealed twice — with and without the path field — keeps byte-identical fingerprints and sealed payload', () => {
    const ids = ['DOCS-01', 'DOCS-03', 'DOCS-04', 'DOCS-08', 'DOCS-09', 'PERF-02', 'PERF-06', 'DATA-01', 'ECOS-06', 'ECOS-08', 'SEC-09', 'SEC-10',
      'ECOS-01', 'ECOS-02', 'ECOS-03', 'ECOS-05', 'ECOS-07', 'SEC-01', 'SEC-06', 'SEC-02'];
    const facts = ids.map((id) => fake(id, { [id.toLowerCase().replace('-', '')]: {} }));
    // Fixed scanned_at + scanId → the two seals differ only by the derived field's
    // presence when one report is stripped.
    const snap = () => ({ repo: 'o/r', scanned_at: '2026-08-12T00:00:00.000Z', engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' });
    const seal = () => sealScan({ facts, snapshot: snap(), budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'x', engineRef: 'abc1234', scanId: 'ls_fixed' });
    const enabled = seal();
    expect(enabled.report.next_band_path).toBeDefined();
    const second = seal();
    expect(second.report.next_band_path).toBeDefined();
    // "Disabled" for a purely derived field: the field is deleted after seal. The
    // sealed payload (score/tier/gates/coverage/fingerprint) is byte-identical.
    const withoutPath = JSON.parse(JSON.stringify(second.report));
    delete withoutPath.next_band_path;
    const withPathDeleted = JSON.parse(JSON.stringify(enabled.report));
    delete withPathDeleted.next_band_path;
    expect(JSON.stringify(withoutPath)).toBe(JSON.stringify(withPathDeleted));
    expect(second.meta.score_fingerprint).toBe(enabled.meta.score_fingerprint);
    // Mechanism: the fingerprint is a function of the facts and semantic flags —
    // the report object (and therefore any report field) is not an input.
    expect(enabled.meta.score_fingerprint).toBe(computeScoreFingerprint({
      facts,
      rubricVersion: 't',
      engineVersion: 't',
      engineSha7: 'abc1234',
      snapshotVersions: {},
      strict: false,
      indicatorSet: facts.map((f) => f.detectorId),
      archetype: 'unknown',
      scorePolicy: 'frozen',
    }));
  });
});

describe('3.4 stdout path clause', () => {
  it('slots between the status fields and the band sentence; tracked URL stays the single final token', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir]);
      expect(r.code).toBe(0);
      const env = readEnvelope(outDir);
      const path = env.report.next_band_path!;
      const tier = env.report.headline.tier;
      const clause = formatBandPathClause(path, tier);
      const line = r.out[0];
      const statusEnd = line.indexOf(' coverage:');
      const clauseAt = line.indexOf(` ${clause} `);
      const sentenceAt = line.indexOf(' — ');
      expect(statusEnd).toBeGreaterThanOrEqual(0);
      expect(clauseAt).toBeGreaterThan(statusEnd); // after the status fields
      expect(clauseAt).toBeLessThan(sentenceAt); // before the band sentence
      const url = assessmentUrlForBand(tier);
      expect(line.split(url)).toHaveLength(2);
      expect(line.endsWith(url)).toBe(true);
      expect(line.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('4.1 band-name parsing', () => {
  it('accepts only the public band vocabulary', () => {
    expect(parseFailUnderBand('critical')).toBe('critical');
    expect(parseFailUnderBand('high')).toBe('high');
    expect(parseFailUnderBand('moderate')).toBe('moderate');
    expect(parseFailUnderBand(' Moderate ')).toBe('moderate');
    expect(parseFailUnderBand('')).toBeUndefined();
    expect(parseFailUnderBand(undefined)).toBeUndefined();
    expect(() => parseFailUnderBand('healthy')).toThrow(/critical\|high\|moderate\|low/);
  });

  it('an unrecognized band name exits 2 before any work with no report files', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under-band', 'healthy']);
      expect(r.code).toBe(2);
      expect(r.err.join('\n')).toMatch(/--fail-under-band/);
      for (const f of ['report.json', 'report.html', 'report.md']) expect(existsSync(join(outDir, f))).toBe(false);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('4.2 numeric and band thresholds are mutually exclusive', () => {
  it('supplying both is refused with exit 2 and no report files', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under', '50', '--fail-under-band', 'moderate']);
      expect(r.code).toBe(2);
      expect(r.err.join('\n')).toMatch(/conflict|mutually exclusive/i);
      for (const f of ['report.json', 'report.html', 'report.md']) expect(existsSync(join(outDir, f))).toBe(false);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('4.3/4.4/4.6 band gate evaluation after seal', () => {
  it('trips below the named band with all three report files present, and the stdout state names the band gate', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      // The fixture seals well below High (27).
      const baseline = await runCli(['scan', dir, '--out', outDir]);
      const score = readEnvelope(outDir).report.headline.score;
      expect(score).toBeLessThan(27);
      expect(baseline.code).toBe(0);
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under-band', 'high']);
      expect(r.code).toBe(3);
      for (const f of ['report.json', 'report.html', 'report.md']) expect(existsSync(join(outDir, f))).toBe(true);
      expect(r.err.join('\n')).toContain('fail-under-band high');
      expect(r.out[0]).toContain('threshold:trip(fail-under-band high)');
    } finally {
      cleanup(dir, outDir);
    }
  }, 180_000);

  it('passes at or above the named band floor, including a seal exactly at 53 for moderate', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      // Boundary semantics: exactly at the floor passes; a hair below trips.
      expect(gateOutcome(53, { failUnderBand: 'moderate' })).toEqual({ tripped: false, thresholdState: ' threshold:pass(fail-under-band moderate)' });
      expect(gateOutcome(52.99, { failUnderBand: 'moderate' }).tripped).toBe(true);
      expect(gateOutcome(0, { failUnderBand: 'critical' }).tripped).toBe(false);
      expect(gateOutcome(26.99, { failUnderBand: 'high' }).tripped).toBe(true);
      // Live: anything above the critical floor (0) passes.
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under-band', 'critical']);
      expect(r.code).toBe(0);
      expect(r.out[0]).toContain('threshold:pass(fail-under-band critical)');
      for (const f of ['report.json', 'report.html', 'report.md']) expect(existsSync(join(outDir, f))).toBe(true);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('4.5 a suppressed headline never satisfies a band gate', () => {
  it('an insufficient-signal seal fails the band gate fail-closed, with no path rendered', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-empty-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      expect(gateOutcome(90, { failUnderBand: 'critical', suppressed: true }).tripped).toBe(true);
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under-band', 'critical']);
      expect(r.code).toBe(3);
      const env = readEnvelope(outDir);
      expect(env.report.headline.suppressed).toBe(true);
      expect('next_band_path' in env.report).toBe(false); // absent, not empty
      expect(r.out[0]).toContain('insufficient-signal');
      expect(r.out[0]).not.toContain('next:');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('3.5 terminal and unreachable states render explicit statements', () => {
  const base: RenderInput = {
    score: 58,
    tier: 'Moderate',
    repo: 'o/r',
    repoSha: 'abc1234',
    runId: 'ls_x',
    scannedAt: '2026-08-12T00:00:00.000Z',
    status: 'complete',
    coverage: { measured: 20, estimated: 1, unknown: 5 },
    gates: [],
    topBlockers: [],
    categories: [],
  };
  const terminalPath: NextBandPath = { destination: null, threshold: null, points_needed: null, classes: [], unreached_rows: 2, terminal: true };
  const unreachablePath: NextBandPath = {
    destination: 'Low',
    threshold: 80,
    points_needed: 50,
    classes: [{ class: 'sprint', pp: 2, cumulative_pp: 2, arrival: 'not-reached', steps: [{ row: 'SEC-01', name: 'Unpatched vulnerabilities', recoverable_pp: 2, effort: '⚡ ≤30 min' }] }],
    unreached_rows: 3,
    terminal: false,
  };

  it('terminal band renders a band-accomplished statement, not an empty block', () => {
    const block = bandPathBlock(terminalPath, { tier: 'Low', score: 85 });
    for (const doc of [renderHtml({ ...base, tier: 'Low', score: 85, nextBandPath: terminalPath }), renderMarkdown({ ...base, tier: 'Low', score: 85, nextBandPath: terminalPath })]) {
      expect(doc).toContain(block.statement);
      expect(doc).toContain(block.heading);
      expect(doc).toContain(block.unreached!);
      expect(doc).not.toContain('Reach '); // no invented destination
    }
  });

  it('a no-reachable-path block states the shortfall instead of an undifferentiated list', () => {
    const block = bandPathBlock(unreachablePath, { tier: 'Moderate', score: 30 });
    for (const doc of [renderHtml({ ...base, score: 30, tier: 'High', nextBandPath: unreachablePath }), renderMarkdown({ ...base, score: 30, tier: 'High', nextBandPath: unreachablePath })]) {
      expect(doc).toContain(block.shortfall!);
      expect(doc).toContain(block.classes[0].arrival); // "stays short of Low" — honest, not smoothed
      expect(doc).toContain(block.unreached!);
    }
  });

  it('no path renders no block at all', () => {
    for (const doc of [renderHtml(base), renderMarkdown(base)]) {
      expect(doc).not.toContain('Path to the next band');
      expect(doc).not.toContain('Reach ');
    }
  });

  it('renders each class by its tag and verification framing, never a calendar noun', () => {
    const block = bandPathBlock(unreachablePath, { tier: 'Moderate', score: 30 });
    for (const doc of [
      renderHtml({ ...base, score: 30, tier: 'High', nextBandPath: unreachablePath }),
      renderMarkdown({ ...base, score: 30, tier: 'High', nextBandPath: unreachablePath }),
    ]) {
      expect(block.classes[0].tag).toBe('⚡');
      expect(doc).toContain(`${block.classes[0].tag} ${block.classes[0].verify}`);
      expect(doc).toContain('Verify effort: ⚡ ≤30 min');
      // The step's quick win is labelled as remediation prose, not as the tag's duration.
      expect(doc).not.toMatch(/Sprint|Quarter|Structural/);
    }
  });
});

describe('6.1 one derivation serves every surface', () => {
  it('destination, distance, cumulative arrival, and unreached count agree across report.json, report.html, report.md, and stdout', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir]);
      expect(r.code).toBe(0);
      const env = readEnvelope(outDir);
      const path = env.report.next_band_path!;
      const tier = env.report.headline.tier;
      const block = bandPathBlock(path, { tier, score: env.report.headline.score });
      const html = readFileSync(join(outDir, 'report.html'), 'utf8');
      const md = readFileSync(join(outDir, 'report.md'), 'utf8');
      const line = r.out[0];
      // Same sealed field on all four surfaces.
      expect(line).toContain(` ${formatBandPathClause(path, tier)} `);
      expect(md).toContain(`## ${block.heading}`);
      expect(md).toContain(block.statement);
      expect(html).toContain(`<h2>${block.heading}</h2>`);
      expect(html).toContain(block.statement);
      for (const c of block.classes) {
        expect(md).toContain(c.arrival);
        expect(md).toContain(`**${c.tag} ${c.verify}**`);
        expect(html).toContain(c.arrival);
        for (const s of c.steps.slice(0, 3)) {
          expect(md).toContain(s.row);
          expect(html).toContain(s.row);
        }
      }
      expect(md).toContain(block.unreached!);
      expect(html).toContain(block.unreached!);
      // Path block sits after top risks and before the per-deduction detail.
      expect(md.indexOf(`## ${block.heading}`)).toBeGreaterThan(md.indexOf('## Top 5 risks'));
      expect(md.indexOf(`## ${block.heading}`)).toBeLessThan(md.indexOf('## Detail'));
      expect(html.indexOf(`<h2>${block.heading}</h2>`)).toBeGreaterThan(html.indexOf('<h2>Top risks</h2>'));
      expect(html.indexOf(`<h2>${block.heading}</h2>`)).toBeLessThan(html.indexOf('<h2>Detail</h2>'));
      // The funnel grammar still closes both documents with a path block present:
      // methodology link → band CTA → positioning line, URL exactly once, final.
      expect(html).toContain(assessmentUrlForBand(tier).replace(/&/g, '&amp;'));
      expect(md).toContain(assessmentUrlForBand(tier));
      expect(md.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      const mdOrder = [md.indexOf('Methodology:'), md.indexOf('> Next step:'), md.indexOf(assessmentUrlForBand(tier))];
      expect(mdOrder[0]).toBeGreaterThanOrEqual(0);
      expect(mdOrder[0]).toBeLessThan(mdOrder[1]);
      expect(mdOrder[1]).toBeLessThan(mdOrder[2]);
      expect(md.trimEnd().endsWith(POSITIONING_LINE)).toBe(true);
      const htmlOrder = [html.indexOf('Methodology:'), html.indexOf('<div class="cta">'), html.indexOf('<p class="positioning">')];
      expect(htmlOrder[0]).toBeLessThan(htmlOrder[1]);
      expect(htmlOrder[1]).toBeLessThan(htmlOrder[2]);
      expect(html.trimEnd()).toMatch(/<p class="positioning">.*<\/p>\s*<\/body>\s*<\/html>$/s);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('5.1 thin CLI contract usage text', () => {
  it('--help enumerates the band gate as mutually exclusive with the numeric one', async () => {
    const r = await runCli(['--help']);
    expect(r.code).toBe(0);
    const help = r.out.join('\n');
    expect(help).toContain('--fail-under <0-100> | --fail-under-band <critical|high|moderate|low>');
    expect(help).toContain('Mutually exclusive with --fail-under');
    expect(help).toContain('3 threshold trip (--fail-under / --fail-under-band)');
  });
});

describe('6.2 sealed scoring is untouched by the derived field', () => {
  it('two scans of one fixture share byte-identical score, tier, gates, coverage, and fingerprint, and derive the same path', async () => {
    const dir = makeFixture();
    const out1 = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    const out2 = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const a = await runCli(['scan', dir, '--out', out1]);
      const b = await runCli(['scan', dir, '--out', out2]);
      expect(a.code).toBe(0);
      expect(b.code).toBe(0);
      const e1 = readEnvelope(out1);
      const e2 = readEnvelope(out2);
      expect(e2.report.headline).toEqual(e1.report.headline); // score + tier
      expect(e2.report.gates).toEqual(e1.report.gates);
      expect(e2.report.coverage).toEqual(e1.report.coverage);
      expect(e2.meta.score_fingerprint).toBe(e1.meta.score_fingerprint);
      // "With and without the path field": stripping the derived field leaves the
      // sealed payload byte-identical, and the derivation is deterministic.
      const withoutPath = JSON.parse(JSON.stringify(e2.report));
      delete withoutPath.next_band_path;
      expect(withoutPath.headline).toEqual(e1.report.headline);
      expect(withoutPath.gates).toEqual(e1.report.gates);
      expect(withoutPath.coverage).toEqual(e1.report.coverage);
      expect(e2.report.next_band_path).toEqual(e1.report.next_band_path);
    } finally {
      cleanup(dir, out1, out2);
    }
  }, 180_000);
});

describe('6.4 funnel grammar unchanged by the path block', () => {
  it('positioning line closes both documents, the tracked URL appears once per artifact, and bands stay public', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir]);
      expect(r.code).toBe(0);
      const env = readEnvelope(outDir);
      const path = env.report.next_band_path!;
      const tier = env.report.headline.tier;
      const html = readFileSync(join(outDir, 'report.html'), 'utf8');
      const md = readFileSync(join(outDir, 'report.md'), 'utf8');
      const line = r.out[0];

      // The positioning line remains each human-readable document's final content.
      expect(html.trimEnd()).toMatch(/<p class="positioning">.*<\/p>\s*<\/body>\s*<\/html>$/s);
      expect(md.trimEnd().endsWith(POSITIONING_LINE)).toBe(true);

      // One tracked URL per artifact: HTML, Markdown, stdout — final token on stdout.
      expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(md.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(line.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(html).toContain(assessmentUrlForBand(tier).replace(/&/g, '&amp;'));
      expect(line.endsWith(assessmentUrlForBand(tier))).toBe(true);

      // Band vocabulary stays the public set; no legacy alias reaches a surface.
      const publicBands = ['Low', 'Moderate', 'High', 'Critical'];
      expect(publicBands).toContain(path.destination);
      expect(publicBands).toContain(tier);
      const block = bandPathBlock(path, { tier, score: env.report.headline.score });
      expect(block.statement).toContain(`Reach ${path.destination}`);
      expect(md).toContain(block.statement);
      expect(html).toContain(`<h2>${block.heading}</h2>`);
      for (const doc of [html, md, line]) expect(doc).not.toContain('High Risk');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

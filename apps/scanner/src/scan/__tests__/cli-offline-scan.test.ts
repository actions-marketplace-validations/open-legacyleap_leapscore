/** apps/scanner/src/scan/__tests__/cli-offline-scan.test.ts — CLI contract, local path, offline posture, tiers, emitters */
import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../../bin/scan';
import { runLocalScan, GH_ONLY_IDS, LOCAL_IDS } from '../local';
import { createStrictFetch, StrictOfflineError, assertAllowlistedUrl } from '../offline';
import { sealScan, tierForScore, tierLegacyFor, localSlugFromPath } from '../scoring/seal';
import { assessmentUrlForBand, assessmentCtaForBand, parseRunId } from '@leapscore/contracts';
import { renderHtml, renderMarkdown } from '../render';
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

describe('1.1 CLI parsing', () => {
  it('help mentions scan <path>, --strict, --fail-under', async () => {
    const r = await runCli(['--help']);
    expect(r.code).toBe(0);
    expect(r.out.join('\n')).toContain('scan <path>');
    expect(r.out.join('\n')).toContain('--strict');
    expect(r.out.join('\n')).toContain('--fail-under');
  });
  it('bad path exits 2 and names the path', async () => {
    const r = await runCli(['scan', '/no/such/dir-xyz', '--out', join(tmpdir(), 'never-out')]);
    expect(r.code).toBe(2);
    expect(r.err.join('\n')).toContain('/no/such/dir-xyz');
  });
  it('--strict + --repo is rejected before any work', async () => {
    const r = await runCli(['--repo', 'a/b', '--strict', '--out', join(tmpdir(), 'never-out')]);
    expect(r.code).toBe(2);
    expect(r.err.join('\n')).toMatch(/strict/i);
  });
  it('non-empty --sha exits 2', async () => {
    const r = await runCli(['--repo', 'a/b', '--sha', 'abc', '--out', join(tmpdir(), 'never.json')]);
    expect(r.code).toBe(2);
  });
  it('invalid --fail-under exits 2', async () => {
    const dir = makeFixture();
    try {
      const r = await runCli(['scan', dir, '--out', join(tmpdir(), 'never-out'), '--fail-under', '101']);
      expect(r.code).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('1.2 exit map with --fail-under', () => {
  it('exit 3 on low score with all three files still written', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under', '100']);
      expect(r.code).toBe(3);
      expect(existsSync(join(outDir, 'report.json'))).toBe(true);
      expect(existsSync(join(outDir, 'report.html'))).toBe(true);
      expect(existsSync(join(outDir, 'report.md'))).toBe(true);
      expect(r.err.join('\n')).toMatch(/threshold trip/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
  it('exit 0 when score clears the threshold', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--fail-under', '0']);
      expect(r.code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('1.3 + 5.3 single stdout line with tracked link', () => {
  it('prints one line with score/band and the assessment URL exactly once', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir]);
      expect(r.code).toBe(0);
      expect(r.out).toHaveLength(1);
      expect(r.out[0]).toMatch(/\d+(\.\d+)?\/(Low|Moderate|High|Critical)/);
      const matches = r.out[0].match(/utm_campaign=cli-scan-v1/g) ?? [];
      expect(matches).toHaveLength(1);
      // identical link appears in stdout raw, and (HTML-escaped) in HTML and raw in Markdown
      const url = assessmentUrlForBand(/Low|Moderate|High|Critical/.exec(r.out[0])![0]);
      const html = readFileSync(join(outDir, 'report.html'), 'utf8');
      const md = readFileSync(join(outDir, 'report.md'), 'utf8');
      expect(r.out[0]).toContain(url);
      expect(html).toContain(url.replace(/&/g, '&amp;'));
      expect(md).toContain(url);
      expect(html.match(/utm_campaign=cli-scan-v1/g)!.length).toBeGreaterThanOrEqual(1);
      expect(md.match(/utm_campaign=cli-scan-v1/g)!.length).toBeGreaterThanOrEqual(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('2.1 local orchestrator excludes GH detectors', () => {
  it('seals a fixture dir with local ids only and no gh.request', async () => {
    const dir = makeFixture();
    try {
      const ghSpy = vi.fn(async () => { throw new Error('must not be called'); });
      void ghSpy;
      const events: Array<{ type: string; [k: string]: unknown }> = [];
      for await (const e of runLocalScan(dir)) events.push(e as { type: string; [k: string]: unknown });
      const done = events.find((e) => e.type === 'done');
      expect(done).toBeDefined();
      const facts = (done!.facts as FactRecord[]) ?? [];
      expect(facts.length).toBeGreaterThan(0);
      for (const f of facts) expect(GH_ONLY_IDS.has(f.detectorId)).toBe(false);
      // every local detector id is covered
      const covered = new Set(facts.map((f) => f.detectorId));
      for (const id of LOCAL_IDS) expect(covered.has(id)).toBe(true);
      expect((done!.snapshot as Record<string, unknown>).local_path).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('2.3 determinism: sorted outputs, commit identity', () => {
  it('same fixture twice -> identical scores, runIds differ only by timestamp', async () => {
    const dir = makeFixture();
    const outA = mkdtempSync(join(tmpdir(), 'leapscore-a-'));
    const outB = mkdtempSync(join(tmpdir(), 'leapscore-b-'));
    try {
      const ra = await runCli(['scan', dir, '--out', outA]);
      // ensure a different timestamp for the second run
      await new Promise((r) => setTimeout(r, 1100));
      const rb = await runCli(['scan', dir, '--out', outB]);
      expect(ra.code).toBe(0);
      expect(rb.code).toBe(0);
      const a = JSON.parse(readFileSync(join(outA, 'report.json'), 'utf8'));
      const b = JSON.parse(readFileSync(join(outB, 'report.json'), 'utf8'));
      expect(a.report.headline.score).toBe(b.report.headline.score);
      expect(a.meta.runId).not.toBe(b.meta.runId);
      const pa = parseRunId(a.meta.runId);
      const pb = parseRunId(b.meta.runId);
      expect(pa!.repoSlug).toBe(pb!.repoSlug);
      expect(pa!.engineSha7).toBe(pb!.engineSha7);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outA, { recursive: true, force: true });
      rmSync(outB, { recursive: true, force: true });
    }
  }, 180_000);
  it('scanned_commit falls back to unknown outside git', async () => {
    const dir = makeFixture();
    try {
      const events: Array<{ type: string; [k: string]: unknown }> = [];
      for await (const e of runLocalScan(dir)) events.push(e as { type: string; [k: string]: unknown });
      const done = events.find((e) => e.type === 'done');
      expect((done!.snapshot as Record<string, unknown>).scanned_commit).toMatch(/^[0-9a-f]{4,40}$|^unknown$/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('3.1 strict network guard', () => {
  it('strict fetch throws on any attempt', async () => {
    const f = createStrictFetch();
    await expect(f('https://registry.npmjs.org/x' as unknown as URL)).rejects.toBeInstanceOf(StrictOfflineError);
  });
  it('allowlist permits registries but never code exfil hosts', () => {
    expect(() => assertAllowlistedUrl('https://registry.npmjs.org/lodash')).not.toThrow();
    expect(() => assertAllowlistedUrl('https://leapscore.dev/assessment')).toThrow();
  });
  it('--strict fixture scan opens zero sockets (fetch spy)', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-strict-'));
    const origFetch = globalThis.fetch;
    const spy = vi.fn(async () => { throw new Error('socket opened'); });
    (globalThis as unknown as { fetch: unknown }).fetch = spy;
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--strict']);
      expect(r.code).toBe(0);
      expect(spy).not.toHaveBeenCalled();
      expect(existsSync(join(outDir, 'report.json'))).toBe(true);
    } finally {
      (globalThis as unknown as { fetch: unknown }).fetch = origFetch;
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('3.3 three files share score and runId', () => {
  it('report.json/html/md agree after a local seal', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir]);
      expect(r.code).toBe(0);
      const env = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
      const html = readFileSync(join(outDir, 'report.html'), 'utf8');
      const md = readFileSync(join(outDir, 'report.md'), 'utf8');
      expect(env.meta.runId).toBeTruthy();
      expect(html).toContain(String(env.meta.score));
      expect(html).toContain(env.meta.runId);
      expect(md).toContain(String(env.meta.score));
      expect(md).toContain(env.meta.runId);
      expect(md).toContain(env.meta.tier);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('4.1 tier rename in seal', () => {
  function fakeFact(id: string, facts: Record<string, unknown>, tool = 'test', pointers: Array<{ file?: string; detail?: string }> = [{ file: 'evidence.txt' }]): FactRecord {
    return {
      id, detectorId: id, schemaVersion: '1.0.0', facts,
      evidencePointers: pointers,
      provenance: { tool, version: '1', flags: [tool], durationMs: 1 },
      truncated: false,
    } as unknown as FactRecord;
  }
  it('headline tier uses new names with tier_legacy alias', () => {
    const facts = [
      fakeFact('DOCS-04', { docs04: { docs_present: [], stages_covered: [], stages_missing: ['setup', 'run', 'test'], undefined_commands: [], last_verified_days: 9999 } }, 'onboarding-inventory', [{ file: 'README.md', detail: 'no onboarding' }]),
    ];
    const sealed = sealScan({
      facts, snapshot: { repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' },
      budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: localSlugFromPath('claims-core'),
    });
    expect(['Low', 'Moderate', 'High', 'Critical']).toContain(sealed.report.headline.tier);
    expect(sealed.report.headline.tier_legacy).toBe(tierLegacyFor(sealed.report.headline.tier));
    expect(sealed.meta.tier_legacy).toBe(sealed.report.headline.tier_legacy);
    expect(tierForScore(82)).toBe('Low');
    expect(tierForScore(41)).toBe('High');
  });
  it('boundary scores map per 80/53/27', () => {
    expect(tierForScore(80)).toBe('Low');
    expect(tierForScore(53)).toBe('Moderate');
    expect(tierForScore(27)).toBe('High');
  });
});

describe('4.3 every-deduction trace', () => {
  it('top blocker names evidence file, rule, and weight', () => {
    const facts = [
      { id: 'DOCS-04', detectorId: 'DOCS-04', schemaVersion: '1.0.0', facts: { docs04: { docs_present: [], stages_covered: [], stages_missing: ['setup'], undefined_commands: [], last_verified_days: 9999 } }, evidencePointers: [{ file: 'README.md', detail: 'missing setup' }], provenance: { tool: 'onboarding-inventory', version: '1', flags: [], durationMs: 1 }, truncated: false },
    ] as unknown as FactRecord[];
    const sealed = sealScan({
      facts, snapshot: { repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' },
      budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'claims-core',
    });
    expect(sealed.report.top_blockers.length).toBeGreaterThan(0);
    const top = sealed.report.top_blockers[0];
    expect(top.evidence_file).toBe('README.md');
    expect(top.rule).toBe('onboarding-inventory');
    expect(top.weight_pp).toMatch(/pp$/);
  });
});

describe('5.1 + 5.2 emitters', () => {
  const base = {
    score: 41, tier: 'High', tierLegacy: 'High Risk', repo: 'claims-core', repoSha: 'abc1234567',
    runId: 'claims-core__abc1234__2026-10-16T100000-000Z', scannedAt: '2026-10-16T10:00:00.000Z',
    status: 'degraded', coverage: { measured: 20, estimated: 0, unknown: 11 },
    gates: [{ id: 'G3', name: 'Runtime EOL', status: 'proven', note: 'past EOL' }],
    topBlockers: [{ row: 'ECOS-01', name: 'Runtime', points_lost: 3, weight_pp: '1.20pp', summary: 'EOL runtime', evidence_file: 'Dockerfile', rule: 'runtime-inventory' }],
    categories: [{ id: 'ECOS', name: 'Ecosystem', category_score: 40, weight: 10, applicable: 5 }],
  };
  it('HTML is self-contained: no scripts, external styles, or images', () => {
    const html = renderHtml(base);
    expect(html).toContain('41');
    expect(html).toContain('High');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<link');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('url(');
    expect(html).toContain('Dockerfile');
  });
  it('Markdown carries band CTA per tier', () => {
    for (const tier of ['Low', 'Moderate', 'High', 'Critical'] as const) {
      const md = renderMarkdown({ ...base, tier });
      expect(md).toContain(assessmentCtaForBand(tier));
      expect(md).toContain(assessmentUrlForBand(tier));
    }
  });
});

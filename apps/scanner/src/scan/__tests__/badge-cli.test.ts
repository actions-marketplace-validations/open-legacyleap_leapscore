/** apps/scanner/src/scan/__tests__/badge-cli.test.ts — `--badge` flag, artifact
 * trio parity, fixture refusal (spec: score-badge §Badge never overstates). */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, parseArgs, parseBadgePath, writeBadgeArtifacts, writeReportsAndExit } from '../../../bin/scan';
import { badgeCoverage } from '@leapscore/contracts';

function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-badge-fixture-'));
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

function expectedCoverage(report: { coverage: { measured: number; estimated: number; unknown: number } }): number {
  return Math.round(badgeCoverage(report.coverage) * 100);
}

describe('4.1 --badge flag parser', () => {
  it('accepts space and equals forms', () => {
    expect(parseArgs(['scan', '.', '--out', 'o', '--badge', 'badge.svg']).badge).toBe('badge.svg');
    expect(parseArgs(['scan', '.', '--out', 'o', '--badge=docs/badge.svg']).badge).toBe('docs/badge.svg');
    expect(parseArgs(['scan', '.', '--out', 'o']).badge).toBeUndefined();
  });

  it('rejects an empty value as a usage error (exit 2)', async () => {
    expect(() => parseBadgePath('')).toThrow(/missing value for --badge/);
    expect(() => parseBadgePath('   ')).toThrow(/missing value for --badge/);
    const r = await runCli(['scan', '.', '--out', join(tmpdir(), 'never-out'), '--badge', '']);
    expect(r.code).toBe(2);
    expect(r.err.join('\n')).toMatch(/missing value for --badge/);
  });
});

describe('4.2 a sealed scan writes the badge and its snippet beside the trio', () => {
  it('produces all five files with the badge agreeing with report.json', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-badge-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--strict', '--badge', join(outDir, 'badge.svg')]);
      expect(r.code).toBe(0);
      for (const name of ['report.json', 'report.html', 'report.md', 'badge.svg', 'badge.snippet.md']) {
        expect(existsSync(join(outDir, name))).toBe(true);
      }
      const env = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
      const svg = readFileSync(join(outDir, 'badge.svg'), 'utf8');
      const snippet = readFileSync(join(outDir, 'badge.snippet.md'), 'utf8');
      const score = Math.floor(env.report.headline.score);
      const band = env.report.headline.tier;
      const pct = expectedCoverage(env.report);
      if (env.report.headline.suppressed) {
        expect(svg).toContain('>unscored</text>');
        expect(svg).toContain(`${pct}%`);
      } else {
        expect(svg).toContain(`>${score} ${band}</text>`);
        expect(svg).toContain(`${pct}%`);
      }
      expect(snippet).toContain('https://leapscore.dev/reports/');
      expect(snippet).toContain(`alt="LeapScore badge:`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('4.3 a fixture/sample envelope refuses rather than emitting an empty file', () => {
  it('the emitter refuses and writes nothing', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-badge-refuse-'));
    const badgePath = join(outDir, 'badge.svg');
    try {
      const envelope = {
        contractVersion: 1,
        meta: { runId: 'acme__api__a3f9c1__20261031T091200Z' },
        report: {
          sample: true,
          status: 'complete',
          headline: { score: 62, tier: 'Moderate' },
          coverage: { measured: 45, estimated: 20, unknown: 35 },
          snapshot: { scanned_at: '2026-10-31T09:12:00Z' },
        },
        trace: [],
      };
      const res = await writeBadgeArtifacts(envelope, badgePath);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.detail).toMatch(/sample/i);
      expect(existsSync(badgePath)).toBe(false);
      expect(existsSync(join(outDir, 'badge.snippet.md'))).toBe(false);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);

  it('a scan path whose sealed report is a fixture exits 2 with the reason', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-badge-refuse-scan-'));
    const badgePath = join(outDir, 'badge.svg');
    try {
      const first = await runCli(['scan', dir, '--out', outDir, '--strict']);
      expect(first.code).toBe(0);
      const env = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
      env.report.sample = true;
      const err: string[] = [];
      const code = await writeReportsAndExit(
        { report: env.report, meta: env.meta, traceToPersist: env.trace, stdoutLine: '' },
        {
          env: {},
          stdout: () => {},
          stderr: (s) => err.push(s),
          outDir,
          startMs: Date.now(),
          trace: [],
          failUnder: undefined,
          failUnderBand: undefined,
          scorePolicy: 'frozen',
          badge: badgePath,
        },
      );
      expect(code).toBe(2);
      expect(err.join('\n')).toMatch(/refused \(badge\): .*sample/i);
      expect(existsSync(badgePath)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('4.4 --badge leaves the sealed trio and the fingerprint untouched', () => {
  it('report.json / report.html / report.md and score_fingerprint are identical', async () => {
    const dir = makeFixture();
    const outA = mkdtempSync(join(tmpdir(), 'leapscore-badge-a-'));
    const outB = mkdtempSync(join(tmpdir(), 'leapscore-badge-b-'));
    try {
      const plain = await runCli(['scan', dir, '--out', outA, '--strict']);
      const badged = await runCli(['scan', dir, '--out', outB, '--strict', '--badge', join(outB, 'badge.svg')]);
      expect(plain.code).toBe(0);
      expect(badged.code).toBe(0);
      expect(existsSync(join(outA, 'badge.svg'))).toBe(false);
      expect(existsSync(join(outB, 'badge.svg'))).toBe(true);

      const envA = JSON.parse(readFileSync(join(outA, 'report.json'), 'utf8'));
      const envB = JSON.parse(readFileSync(join(outB, 'report.json'), 'utf8'));
      expect(envB.meta.score_fingerprint).toBe(envA.meta.score_fingerprint);
      expect(envB.meta.score_fingerprint).toBeTruthy();

      // Scrub the run-scoped identity before normalising the envelopes, because
      // normalisation deletes the very fields the scrub needs.
      const scrub = (text: string, env: typeof envA) =>
        text.split(env.meta.runId).join('<RUN>').split(env.report.snapshot.scanned_at).join('<AT>');
      for (const name of ['report.html', 'report.md']) {
        const a = scrub(readFileSync(join(outA, name), 'utf8'), envA);
        const b = scrub(readFileSync(join(outB, name), 'utf8'), envB);
        expect(b).toBe(a);
      }

      const normalize = (env: typeof envA) => {
        delete env.meta.runId;
        delete env.meta.ranAt;
        delete env.meta.durationMs;
        delete env.meta.filename;
        delete env.report.id;
        delete env.report.snapshot.scanned_at;
        delete env.trace;
        return env;
      };
      expect(JSON.stringify(normalize(envB), null, 2)).toBe(JSON.stringify(normalize(envA), null, 2));
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outA, { recursive: true, force: true });
      rmSync(outB, { recursive: true, force: true });
    }
  }, 180_000);
});

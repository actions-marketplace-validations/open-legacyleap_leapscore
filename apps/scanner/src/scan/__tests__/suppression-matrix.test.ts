/**
 * Suppression matrix (report-rendering / release-funnel): a suppressed run and
 * a scored run are different presentation states on every CLI surface. A
 * suppressed scan states the verdict and links without a band; a scored scan
 * keeps its band sentence and `band=` link. Each artifact carries the tracked
 * URL exactly once.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../../bin/scan';

const dirs: string[] = [];

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

function makeScoredFixture(): string {
  const dir = temp('leapscore-matrix-scored-');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }));
  writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
  writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
  return dir;
}

async function scan(target: string) {
  const outDir = temp('leapscore-matrix-out-');
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(['scan', target, '--out', outDir], {
    env: { LEAPSCORE_SHA: 'fixedsha' },
    stdout: (line) => out.push(line),
    stderr: (line) => err.push(line),
  });
  expect(err).toEqual([]);
  expect(code).toBe(0);
  expect(out).toHaveLength(1);
  return {
    line: out[0],
    html: readFileSync(join(outDir, 'report.html'), 'utf8'),
    md: readFileSync(join(outDir, 'report.md'), 'utf8'),
  };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('2.4 scanner suppression matrix', () => {
  it('scored run keeps the band sentence and the band link on stdout, HTML, and Markdown', async () => {
    const r = await scan(makeScoredFixture());
    expect(r.line).not.toContain('insufficient-signal');
    expect(r.line).toContain('band=');
    expect(r.line).not.toContain('verdict=');
    for (const artifact of [r.html, r.md]) {
      expect(artifact).toContain('band=');
      expect(artifact).not.toContain('verdict=insufficient-signal');
      expect(artifact.match(/utm_campaign=cli-scan-v1/g) ?? []).toHaveLength(1);
    }
    expect(r.html).toContain('<span class="band">');
  }, 120_000);

  it('suppressed run states the verdict with no band on stdout, HTML, and Markdown', async () => {
    // An empty directory is the honest coverage limit: no attempted row grades.
    const r = await scan(temp('leapscore-matrix-empty-'));
    expect(r.line).toContain('insufficient-signal');
    expect(r.line).toContain('verdict=insufficient-signal');
    expect(r.line).not.toContain('band=');

    expect(r.html).toMatch(/<h1><span class="score">insufficient signal<\/span><\/h1>/);
    expect(r.html).not.toContain('<span class="band">');
    expect(r.html).not.toContain('band=');
    expect(r.html).toContain('verdict=insufficient-signal');

    expect(r.md.split('\n').find((line) => line.startsWith('# LeapScore:'))).toMatch(/^# LeapScore: insufficient signal — /);
    expect(r.md).not.toContain('band=');
    expect(r.md).toContain('verdict=insufficient-signal');

    for (const artifact of [r.html, r.md]) {
      expect(artifact).toMatch(/coverage limit, not a clean bill of health/);
      expect(artifact.match(/utm_campaign=cli-scan-v1/g) ?? []).toHaveLength(1);
    }
    expect(r.line).toMatch(/coverage limit, not a clean bill of health/);
  }, 120_000);
});

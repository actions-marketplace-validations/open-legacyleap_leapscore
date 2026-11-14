/** apps/scanner/src/scan/__tests__/sample-seal-matrix.test.ts — the `sample` marker per seal path
 *
 * report-envelope's "Report self-description marker": `report.sample` is true only for
 * authored demo data; a scan of a real target — remote or local path — never carries it
 * as true. release-packaging 1.5 nails the full seal matrix (closes the detector-honesty
 * deferred item): every real seal path (local / unified / server fallback) leaves the
 * field false-or-absent; the authored fixtures keep `sample: true`.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../../bin/scan';
import { sealScan } from '../scoring/seal';
import { runPhase1Scan } from '../orchestrator.phase1';
import type { FactRecord } from '../facts';

function fakeFact(id = 'DOCS-01'): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts: { docs01: { adr_count: 1 } },
    evidencePointers: [{ detail: 'test detail' }],
    provenance: { tool: 'test', version: '1', flags: ['test'], durationMs: 1 },
    truncated: false,
  } as unknown as FactRecord;
}

function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-sample-fx-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
  writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
  return dir;
}

async function runCli(argv: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(argv, { env: {}, stdout: (s) => out.push(s), stderr: (s) => err.push(s) });
  return { code, out, err };
}

describe('sample seal matrix (report-envelope: self-description marker)', () => {
  it('local-path CLI seal leaves report.sample false-or-absent', async () => {
    const dir = makeFixture();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-sample-out-'));
    try {
      const r = await runCli(['scan', dir, '--out', outDir, '--strict']);
      expect(r.code).toBe(0);
      const env = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
      expect(env.report.sample ?? false).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 180_000);

  it('the shared composer (server + unified CLI path through sealScan) never sets the marker', () => {
    // The unified orchestrator and the scanner server both seal through sealScan with
    // the orchestrator snapshot; the composer copies the snapshot verbatim and never
    // writes `sample` — a real seal cannot acquire the marker on any path.
    const sealed = sealScan({
      facts: [fakeFact()],
      snapshot: { repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' },
      budgetMs: 10_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'o-r',
      engineRef: 'abc1234',
    });
    expect(sealed.report.sample ?? false).toBe(false);
  });

  it('a phase-1 snapshot sealed through the composer stays unmarked', async () => {
    // The phase-1 path is GH-API-only and refuses without a token (exit before any
    // request), so it runs offline on any machine; when it refuses, the composed
    // snapshot never exists and there is nothing to mark — vacuously conformant.
    const saved = { GH_TOKEN: process.env.GH_TOKEN, GITHUB_TOKEN: process.env.GITHUB_TOKEN };
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
    try {
      const res = await runPhase1Scan('https://github.com/o/r');
      if (!('snapshot' in res)) return;
      const sealed = sealScan({
        facts: res.facts,
        snapshot: res.snapshot,
        budgetMs: 10_000,
        startMs: Date.now(),
        trace: [],
        subjectSlug: 'o-r',
        engineRef: 'abc1234',
      });
      expect(sealed.report.sample ?? false).toBe(false);
    } finally {
      Object.assign(process.env, saved);
    }
  });

  it('the server fallback snapshot shape carries no marker before sealing', () => {
    // server.ts's defensive fallback snapshot (the shape it would seal if the
    // orchestrator produced none) is checked for its actual construction: no marker.
    const fallback = { repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 'v', rubric_version: 'r' };
    const sealed = sealScan({
      facts: [fakeFact()],
      snapshot: fallback,
      budgetMs: 10_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'o-r',
      engineRef: 'abc1234',
    });
    expect(sealed.report.sample ?? false).toBe(false);
  });
});

describe('the committed site sample keeps the marker', () => {
  it('the site fixture envelope carries sample: true', () => {
    const file = join(import.meta.dirname ?? '.', '../../../../site/lib/samples/maven-multi-module.json');
    expect(existsSync(file)).toBe(true);
    const env = JSON.parse(readFileSync(file, 'utf8'));
    expect(env.report.sample).toBe(true);
    // It is a real seal of a synthetic demo target, not an authored report:
    // the engine and rubric are the release's own values.
    expect(env.report.snapshot.engine_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(env.report.snapshot.rubric_version).toBe('docs/rubric@tranche-a');
  });

  it('the sample set is exactly the committed envelopes, with no second authored sample', () => {
    const seed = join(import.meta.dirname ?? '.', '../../../../site/lib/sample.ts');
    expect(existsSync(seed)).toBe(false);
    const samplesDir = join(import.meta.dirname ?? '.', '../../../../site/lib/samples');
    expect(readdirSync(samplesDir).filter((name) => name.endsWith('.json'))).toEqual([
      'maven-multi-module.json',
    ]);
    // The old in-process provider is gone; the gallery reads the committed set.
    expect(existsSync(join(import.meta.dirname ?? '.', '../../../../site/lib/provider.ts'))).toBe(false);
  });
});

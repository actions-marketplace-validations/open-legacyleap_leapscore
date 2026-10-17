/** detector-honesty 1.4 — provenance-registry invariant.
 *
 * Truthful provenance: no sealed row may cite a producer this build cannot run,
 * every cited producer must appear in `report.provenance.tool_manifest`, and a
 * real fixture scan must therefore pass while a fabricated producer must fail.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLocalScan } from '../local';
import { sealScan } from '../scoring/seal';
import { checkProvenanceRegistry } from '../scoring/provenance';
import { RUNNABLE_PRODUCERS, isRunnableProducer } from '../detectors/common';
import type { FactRecord } from '../facts';

/** A minimal but real target: a JS manifest + lockfile so local rows measure. */
function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-prov-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      version: '1.0.0',
      dependencies: { express: '4.18.2', lodash: '4.17.20' },
      devDependencies: { vitest: '1.0.0' },
    }),
  );
  writeFileSync(
    join(dir, 'package-lock.json'),
    JSON.stringify({
      name: 'fixture',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': { name: 'fixture', version: '1.0.0' },
        'node_modules/express': { version: '4.18.2' },
        'node_modules/lodash': { version: '4.17.20' },
        'node_modules/body-parser/node_modules/qs': { version: '6.11.0' },
        'node_modules/qs': { version: '6.11.0' },
      },
    }),
  );
  mkdirSync(join(dir, 'docs/adr'), { recursive: true });
  writeFileSync(join(dir, 'docs/adr/0001-record.md'), '# 1. Record architecture decisions\n');
  writeFileSync(join(dir, 'CHANGELOG.md'), '# Changelog\n\n## 1.0.0\n- initial\n');
  writeFileSync(join(dir, '.nvmrc'), '20.11.0\n');
  return dir;
}

async function scanAndSeal(dir: string) {
  const events: Array<{ type: string; [k: string]: unknown }> = [];
  for await (const e of runLocalScan(dir, { strict: true })) events.push(e as { type: string; [k: string]: unknown });
  const done = events.find((e) => e.type === 'done')!;
  const facts = (done.facts as FactRecord[]) ?? [];
  const snapshot = done.snapshot as Record<string, unknown>;
  const sealed = sealScan({
    facts,
    snapshot,
    budgetMs: 60_000,
    startMs: Date.now(),
    trace: [],
    subjectSlug: 'fixture',
    engineRef: 'abc1234',
    strict: true,
  });
  return sealed.report as unknown as {
    full_table: Array<{ id: string; evidence?: { tool?: string; tool_version?: string } }>;
    provenance: { tool_manifest: Array<{ tool: string; version: string }> };
  };
}

describe('provenance registry is the single source of truth (1.2)', () => {
  it('only registers producers this build can actually run', () => {
    for (const name of RUNNABLE_PRODUCERS) expect(isRunnableProducer(name)).toBe(true);
    // names that imply binaries the release never spawns are gone
    for (const gone of ['lizard', 'jscpd', 'syft', 'trivy', 'pyramid', 'gitleaks', 'endoflife.date', 'lockfile+rg', 'registry', 'osv', 'skip', 'lockfile', 'metadata-snapshot']) {
      expect(isRunnableProducer(gone), gone).toBe(false);
    }
    // what actually ran is registered
    for (const present of ['gh-api', 'git', 'lockfile-parse', 'eol-snapshot', 'advisory-snapshot', 'secret-rules', 'test-classify', 'test-scan']) {
      expect(isRunnableProducer(present), present).toBe(true);
    }
  });
});

describe('sealed report cites only runnable producers (1.1/1.3)', () => {
  it('a real fixture scan passes the registry check and the manifest names its producers', async () => {
    const dir = makeFixture();
    try {
      const report = await scanAndSeal(dir);
      const manifest = report.provenance.tool_manifest;
      expect(checkProvenanceRegistry(report.full_table, manifest)).toEqual([]);
      // measured/estimated rows exist → manifest must be non-empty and truthful
      const withEvidence = report.full_table.filter((r) => r.evidence?.tool);
      expect(withEvidence.length).toBeGreaterThan(0);
      expect(manifest.length).toBeGreaterThan(0);
      for (const r of withEvidence) {
        expect(isRunnableProducer(r.evidence!.tool!)).toBe(true);
        expect(manifest.some((m) => m.tool === r.evidence!.tool)).toBe(true);
      }
      // no local row may cite the remote-only producer
      expect(withEvidence.some((r) => r.evidence!.tool === 'gh-api')).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('the registry check rejects fabricated provenance (1.4)', () => {
  it('fails when a row cites a producer outside the runnable set', () => {
    const errors = checkProvenanceRegistry(
      [{ id: 'ARCH-01', evidence: { tool: 'lizard', tool_version: '1.0' } }],
      [{ tool: 'lizard', version: '1.0' }],
    );
    expect(errors.join('\n')).toMatch(/not in the runnable-producer registry/);
  });
  it('fails when a cited producer is missing from the manifest', () => {
    const errors = checkProvenanceRegistry(
      [{ id: 'ECOS-06', evidence: { tool: 'lockfile-parse', tool_version: '1.0' } }],
      [],
    );
    expect(errors.join('\n')).toMatch(/missing from report\.provenance\.tool_manifest/);
  });
  it('fails when evidence carries no tool_version', () => {
    const errors = checkProvenanceRegistry(
      [{ id: 'ECOS-06', evidence: { tool: 'lockfile-parse' } }],
      [{ tool: 'lockfile-parse', version: '1.0' }],
    );
    expect(errors.join('\n')).toMatch(/has no tool_version/);
  });
});

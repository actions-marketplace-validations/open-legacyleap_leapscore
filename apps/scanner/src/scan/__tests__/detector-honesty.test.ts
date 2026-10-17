/** detector-honesty golden fixtures — one fixture per "verify" clause of tasks
 * 2.1–2.5, 3.1–3.4 and 2.5. Every graded number must be re-derivable from the
 * fixture (design D7 invariant 2); a demotion fixture asserts `unknown` + a
 * what-it-takes note and never a constant.
 *
 * The only external binary used is `git` (a bounded local repo), consistent with
 * the release posture: no socket, no other binary.
 */
import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, utimesSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bindLocalReadFile } from '../local';
import { sniffEcosystems } from '../ecosystem';
import { buildToolVersions } from '../detectors/common';
import type { ScanContext, RawFact } from '../detector';
import type { FactRecord } from '../facts';
import { detectArch05 } from '../detectors/arch05';
import { detectTest03 } from '../detectors/test03';
import { detectTest05 } from '../detectors/test05';
import { detectEcos01 } from '../detectors/ecos01';
import { detectEcos02 } from '../detectors/ecos02';
import { detectEcos03 } from '../detectors/ecos03';
import { detectEcos05 } from '../detectors/ecos05';
import { detectEcos06 } from '../detectors/ecos06';
import { detectEcos07 } from '../detectors/ecos07';
import { detectEcos08 } from '../detectors/ecos08';
import { detectSec01 } from '../detectors/sec01';
import { detectSec02 } from '../detectors/sec02';
import { detectDocs01 } from '../detectors/docs01';
import { scoreMvp } from '../scoring/scorer/mvp';
import { computeScoreFingerprint } from '../scoring/fingerprint';
import { ADVISORY_SNAPSHOT_VERSION, EOL_SNAPSHOT_VERSION } from '../snapshots';

const SCAN_MS = Date.parse('2026-10-17T00:00:00.000Z');

async function makeCtx(dir: string, opts: { scanMs?: number } = {}): Promise<ScanContext> {
  const readFile = bindLocalReadFile(dir, {});
  const manifests = (await sniffEcosystems(dir)).map((m) => ({
    root: m.root,
    ecosystem: m.ecosystem as never,
    lockfile: m.lockfile,
    manifest: m.manifest,
  }));
  const store = new Map<string, unknown>();
  return {
    clonePath: dir,
    commitSha: 'fixture',
    manifests,
    budgetLease: { timeoutMs: 30_000, byteCap: 8 * 1024 * 1024 },
    cache: { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } },
    toolVersions: buildToolVersions(),
    readFile,
    scanMs: opts.scanMs ?? SCAN_MS,
  };
}

function dirWith(files: Record<string, string | Buffer>): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-dh-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function raw(v: Record<string, unknown>): Record<string, unknown> {
  return v;
}

function nested(id: string, facts: Record<string, unknown>): Record<string, unknown> {
  return { [id.toLowerCase().replace('-', '')]: facts };
}

function asRecord(f: RawFact): FactRecord {
  return { ...f, id: f.detectorId, root: '/' } as unknown as FactRecord;
}

const SIG = new AbortController().signal;

// ---------------------------------------------------------------------------

describe('2.1 ARCH-05 churn from a known git history', () => {
  it('measures churn_top10_share and a core hot spot from git log --name-only', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-arch05-'));
    try {
      // 205 commits spanning 205 days (≥200 commits, ≥180d) with a bugfix
      // subject every 4th commit; src/hot.js is touched by every commit.
      const script = [
        'set -e',
        'git init -q',
        'git config user.email t@example.com',
        'git config user.name tester',
        'mkdir -p src tests',
        'base=1790000000',
        'i=0',
        'while [ $i -lt 205 ]; do',
        '  ts=$((base - (205 - i) * 86400))',
        '  echo "line $i" >> src/hot.js',
        '  if [ $((i % 4)) -eq 0 ]; then subj="fix: hot spot bug $i"; else subj="feat: change $i"; fi',
        '  if [ $((i % 5)) -eq 0 ]; then echo "// test $i" >> tests/hot.test.js; fi',
        '  git add -A',
        '  GIT_AUTHOR_DATE="@$ts +0000" GIT_COMMITTER_DATE="@$ts +0000" git commit -q -m "$subj"',
        '  i=$((i + 1))',
        'done',
      ].join('\n');
      execFileSync('sh', ['-c', script], { cwd: dir, stdio: 'ignore' });

      const ctx = await makeCtx(dir, { scanMs: 1_790_000_000_000 });
      const fact = await detectArch05(ctx, SIG);
      expect(fact.error).toBeUndefined();
      expect(fact.measurement?.status).toBe('measured');
      const a = (fact.facts as Record<string, unknown>).arch05 as {
        commits_analyzed: number;
        churn_top10_share: number;
        hotspots: Array<{ file: string; in_core_path: boolean }>;
      };
      expect(a.commits_analyzed).toBeGreaterThanOrEqual(200);
      expect(a.churn_top10_share).toBeGreaterThan(0);
      const hot = a.hotspots.find((h) => h.file === 'src/hot.js');
      expect(hot, 'src/hot.js must be a churn∩defect hot spot').toBeDefined();
      expect(hot!.in_core_path).toBe(true);
      expect(fact.evidencePointers.some((p) => p.endpoint === 'git')).toBe(true);
      expect(fact.evidencePointers.some((p) => p.file === 'src/hot.js')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('thin history and non-git targets are unknown with what-it-takes, never N/A', async () => {
    const dir = dirWith({ 'src/a.js': 'export const a = 1;\n' });
    try {
      const fact = await detectArch05(await makeCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      expect(fact.unknownMeasurePath).toMatch(/git hot-spot/);
      expect(fact.error?.kind).toBe('cap');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------

describe('2.2 TEST-03 classifier is estimated-only; TEST-05 greps markers', () => {
  async function pyramid() {
    return dirWith({
      'tests/unit/a.test.js': "it('a', () => { expect(1).toBe(1); });\n",
      'tests/unit/b.test.js': "it('b', () => { expect(2).toBe(2); });\n",
      'tests/unit/c.test.js': "it('c', () => { expect(3).toBe(3); });\nit.skip('later', () => {});\n",
      'tests/integration/d.test.js': "it('d', () => { expect(4).toBe(4); });\n",
      'tests/e2e/e.spec.js': "it('e', () => { expect(5).toBe(5); });\n",
    });
  }

  it('classifies the pyramid and is never measured', async () => {
    const dir = await pyramid();
    try {
      const fact = await detectTest03(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('test-classify');
      expect(fact.measurement?.status).toBe('estimated');
      expect(fact.error).toBeUndefined();
      const t = (fact.facts as Record<string, unknown>).test03 as { unit: number; integration: number; e2e: number };
      expect(t.unit).toBe(3);
      expect(t.integration).toBe(1);
      expect(t.e2e).toBe(1);
      // scores per the TEST-03 predicate (unit layer exists, e2e share ≤ 0.5) → 2
      const row = scoreMvp([asRecord(fact)]).rows.find((r) => r.id === 'TEST-03') as unknown as { status: string; score?: number };
      expect(row.status).toBe('estimated');
      expect(row.score).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('TEST-05 counts skip markers as measured facts', async () => {
    const dir = await pyramid();
    try {
      const fact = await detectTest05(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('test-scan');
      expect(fact.measurement?.status).toBe('measured');
      const t = (fact.facts as Record<string, unknown>).test05 as { skipped_total: number; skip_ratio: number };
      expect(t.skipped_total).toBe(1);
      expect(t.skip_ratio).toBeGreaterThan(0);
      expect(fact.evidencePointers.some((p) => p.file === 'tests/unit/c.test.js')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------

const JS_LOCK = JSON.stringify({
  name: 'fixture',
  lockfileVersion: 3,
  packages: {
    '': { name: 'fixture', version: '1.0.0' },
    'node_modules/lodash': { version: '4.17.20', integrity: 'sha512-x' },
    'node_modules/express': { version: '4.18.2', integrity: 'sha512-x' },
    'node_modules/react': { version: '18.2.0', integrity: 'sha512-x' },
  },
});

function jsFixture(extra: Record<string, string> = {}): string {
  return dirWith({
    'package.json': JSON.stringify({
      name: 'fixture',
      version: '1.0.0',
      dependencies: { lodash: '4.17.20', express: '4.18.2', react: '18.2.0' },
    }),
    'package-lock.json': JS_LOCK,
    'index.js': "const _ = require('lodash');\nconst React = require('react');\nvoid _; void React;\n",
    ...extra,
  });
}

describe('2.3 lockfile/manifest parsing (ECOS-02/06/07) across ecosystems', () => {
  it('ECOS-02 resolves direct-dep major drift from the lockfile + metadata', async () => {
    const dir = jsFixture();
    try {
      const fact = await detectEcos02(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('lockfile-parse');
      expect(fact.measurement?.status).toBe('measured'); // resolvable_ratio ≥ 0.8
      const e = (fact.facts as Record<string, unknown>).ecos02 as { resolvable_ratio: number; pct_behind_1plus_major: number };
      expect(e.resolvable_ratio).toBe(1);
      expect(e.pct_behind_1plus_major).toBeGreaterThan(0); // express 5, react 19
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ECOS-06 counts transitive entries and duplicate versions from the lockfile', async () => {
    const dir = jsFixture();
    try {
      const fact = await detectEcos06(await makeCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos06 as { transitive_total: number };
      expect(e.transitive_total).toBe(3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ECOS-06 detects a duplicate version nested in one npm lockfile', async () => {
    // Regression guard (legacy-stacks 4.3): the resolution map collapses to one
    // version per name, so duplicates must come from the multi-version record.
    const dir = dirWith({
      'package.json': JSON.stringify({ name: 'f', version: '1.0.0', dependencies: { lodash: '4.17.20' } }),
      'package-lock.json': JSON.stringify({
        name: 'f',
        lockfileVersion: 3,
        packages: {
          '': { name: 'f', version: '1.0.0' },
          'node_modules/lodash': { version: '4.17.20', integrity: 'sha512-x' },
          'node_modules/foo/node_modules/lodash': { version: '4.17.15', integrity: 'sha512-y' },
        },
      }),
    });
    try {
      const fact = await detectEcos06(await makeCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos06 as { duplicates: Array<{ name: string; versions: string[] }> };
      expect(e.duplicates).toEqual([{ name: 'lodash', versions: ['4.17.15', '4.17.20'] }]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ECOS-07 reports lockfile presence + pin ratio', async () => {
    const dir = jsFixture();
    try {
      const fact = await detectEcos07(await makeCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos07 as { pin_ratio: number; lockfiles: unknown[] };
      expect(e.pin_ratio).toBe(100);
      expect(e.lockfiles.length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('an unparseable lockfile yields unknown, not a partial guess', async () => {
    const dir = dirWith({
      'package.json': JSON.stringify({ name: 'f', version: '1.0.0', dependencies: { lodash: '4.17.20' } }),
      'package-lock.json': 'this is not json',
    });
    try {
      const ctx = await makeCtx(dir);
      const ecos06 = await detectEcos06(ctx, SIG);
      expect(ecos06.measurement?.status).toBe('unknown');
      expect(ecos06.unknownMeasurePath).toMatch(/lockfile/);
      const sec01 = await detectSec01(ctx, SIG);
      expect(sec01.measurement?.status).toBe('unknown');
      expect(sec01.unknownMeasurePath).toMatch(/lockfile/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('2.4 ECOS-05 licenses + ECOS-08 frameworks from manifest + snapshot', () => {
  it('ECOS-05 reads direct-dep licenses and is always estimated', async () => {
    const dir = jsFixture();
    try {
      const fact = await detectEcos05(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('lockfile-parse');
      expect(fact.measurement?.status).toBe('estimated');
      const e = (fact.facts as Record<string, unknown>).ecos05 as { packages_total: number; license_unknown_count: number; copyleft_strong: unknown[] };
      expect(e.packages_total).toBe(3);
      expect(e.license_unknown_count).toBe(0);
      expect(e.copyleft_strong).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ECOS-05 is unknown when no direct license is resolvable', async () => {
    const dir = dirWith({
      'package.json': JSON.stringify({ name: 'f', version: '1.0.0', dependencies: { 'totally-private-pkg': '1.0.0' } }),
      'package-lock.json': JSON.stringify({ packages: { 'node_modules/totally-private-pkg': { version: '1.0.0' } } }),
    });
    try {
      const fact = await detectEcos05(await makeCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      expect(fact.unknownMeasurePath).toMatch(/metadata table/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ECOS-08 resolves framework support from the snapshot and is N/A with no framework', async () => {
    const dir = jsFixture();
    try {
      const fact = await detectEcos08(await makeCtx(dir), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos08 as { frameworks: Array<{ name: string; support_status: string }> };
      expect(e.frameworks.map((x) => x.name)).toEqual(['express', 'react']);
      // scorer: no framework-class dep → not_applicable
      const noFw = jsFixtureNoFramework();
      try {
        const f2 = await detectEcos08(await makeCtx(noFw), SIG);
        expect(((f2.facts as Record<string, unknown>).ecos08 as { frameworks: unknown[] }).frameworks).toEqual([]);
        const row = scoreMvp([asRecord(f2)]).rows.find((r) => r.id === 'ECOS-08') as unknown as { status: string; not_applicable?: boolean };
        expect(row.not_applicable).toBe(true);
        expect(row.status).toBe('not_applicable');
      } finally {
        rmSync(noFw, { recursive: true, force: true });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function jsFixtureNoFramework(): string {
    return dirWith({
      'package.json': JSON.stringify({ name: 'f', version: '1.0.0', dependencies: { lodash: '4.17.20' } }),
      'package-lock.json': JSON.stringify({ packages: { 'node_modules/lodash': { version: '4.17.20' } } }),
    });
  }
});

describe('2.5 residual doc-age literals are real reads', () => {
  it('newest_adr_days comes from the file date, not a placeholder', async () => {
    const dir = dirWith({ 'docs/adr/0001-record.md': '# 1. Record architecture decisions\n' });
    try {
      const hundredDaysAgo = (Date.now() - 100 * 86_400_000) / 1000;
      utimesSync(join(dir, 'docs/adr/0001-record.md'), hundredDaysAgo, hundredDaysAgo);
      const fact = await detectDocs01(await makeCtx(dir, { scanMs: Date.now() }), SIG);
      const d = (fact.facts as Record<string, unknown>).docs01 as { adr_count: number; newest_adr_days: number | null };
      expect(d.adr_count).toBe(1);
      expect(d.newest_adr_days).not.toBeNull();
      expect(d.newest_adr_days!).toBeGreaterThanOrEqual(99);
      expect(d.newest_adr_days!).toBeLessThanOrEqual(101);
      expect(fact.evidencePointers.some((p) => p.file === 'docs/adr')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------

describe('3.1/3.4 ECOS-01 resolves from the vendored snapshot with no socket', () => {
  it('a past-EOL node pin resolves offline and opens no socket', async () => {
    const dir = dirWith({ '.nvmrc': '10.15.0\n', 'package.json': JSON.stringify({ name: 'f', version: '1.0.0' }) });
    const origFetch = globalThis.fetch;
    const spy = vi.fn(async () => { throw new Error('socket opened'); });
    (globalThis as unknown as { fetch: unknown }).fetch = spy;
    try {
      const fact = await detectEcos01(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('eol-snapshot');
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<{ cycle: string; is_past_eol: boolean }>; lookup_ok: boolean };
      expect(e.lookup_ok).toBe(true);
      expect(e.runtimes[0].cycle).toBe('10');
      expect(e.runtimes[0].is_past_eol).toBe(true);
      expect(fact.evidencePointers.some((p) => p.file === '.nvmrc')).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      (globalThis as unknown as { fetch: unknown }).fetch = origFetch;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('an unknown runtime and an uncovered package both yield unknown in a strict-style run', async () => {
    const dir = dirWith({ '.tool-versions': 'elixir 1.15.0\n' });
    try {
      const fact = await detectEcos01(await makeCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      expect(fact.unknownMeasurePath).toMatch(/refresh the vendored datasets|no pinned runtime resolved/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('3.2 SEC-01 measures a known-affected locked dependency offline', () => {
  it('names the advisory id resolved from the vendored dataset', async () => {
    const dir = jsFixture();
    try {
      const fact = await detectSec01(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('advisory-snapshot');
      expect(fact.measurement?.status).toBe('measured'); // js is covered
      const e = (fact.facts as Record<string, unknown>).sec01 as {
        findings: Array<{ id: string; pkg: string; severity: string; in_core_import_closure: boolean }>;
        advisory_snapshot_version: string;
      };
      const lodash = e.findings.find((f) => f.pkg === 'lodash');
      expect(lodash, 'lodash 4.17.20 is affected by CVE-2020-8203').toBeDefined();
      expect(lodash!.id).toBe('CVE-2020-8203');
      expect(lodash!.in_core_import_closure).toBe(true);
      expect(e.advisory_snapshot_version).toBe(ADVISORY_SNAPSHOT_VERSION);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('4.1 SEC-02 built-in rule set makes G1 evaluable offline', () => {
  it('flags a tree secret, discloses no wider scanner, and G1 is not unevaluable', async () => {
    const dir = dirWith({
      'config/keys.js': "module.exports = { awsKey: 'AKIAABCDEFGHIJKLMNOP' };\n",
    });
    try {
      const fact = await detectSec02(await makeCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('secret-rules');
      const e = (fact.facts as Record<string, unknown>).sec02 as {
        tree_findings: Array<{ rule: string; file: string }>;
        wider_scanners_run: string[];
        rules_applied: string[];
      };
      expect(e.tree_findings.some((f) => f.rule === 'aws-access-token' && f.file === 'config/keys.js')).toBe(true);
      expect(e.wider_scanners_run).toEqual([]); // absence disclosed, never faked
      expect(e.rules_applied).toContain('aws-access-token');
      const g1 = scoreMvp([asRecord(fact)]).gates.find((g) => g.id === 'G1')!;
      expect(g1.status).not.toBe('unevaluable');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------

describe('3.3 snapshot versions join the fingerprint', () => {
  const base = {
    rubricVersion: 'r',
    engineVersion: 'e',
    engineSha7: 'abc1234',
    strict: true,
    indicatorSet: ['ECOS-01'],
    archetype: 'service',
    facts: [] as FactRecord[],
  };
  it('a dataset refresh changes the fingerprint; identical data does not', () => {
    const v1 = computeScoreFingerprint({ ...base, snapshotVersions: { 'eol-snapshot': EOL_SNAPSHOT_VERSION } });
    const v1b = computeScoreFingerprint({ ...base, snapshotVersions: { 'eol-snapshot': EOL_SNAPSHOT_VERSION } });
    const v2 = computeScoreFingerprint({ ...base, snapshotVersions: { 'eol-snapshot': 'eol-refreshed-next' } });
    expect(v1).toBe(v1b);
    expect(v1).not.toBe(v2);
  });
});

// ---------------------------------------------------------------------------

describe('4.2/4.3 demoted and GH-only rows carry no constant score', () => {
  it('a local scan grades no row from a constant', () => {
    // Only DOCS-03 is provided; every other implemented row must resolve to
    // unknown/not_applicable — never a fabricated score.
    const docs = raw(nested('DOCS-03', { runbook_dir: 'r', count: 5, topics_covered: ['a'], restore_doc_present: true, newest_days: 10 }));
    const fact = { detectorId: 'DOCS-03', id: 'DOCS-03', root: '/', schemaVersion: '1.0.0', facts: docs, evidencePointers: [], provenance: { tool: 'runbook-inventory', version: '1.1', flags: [], durationMs: 1 }, truncated: false } as unknown as FactRecord;
    const res = scoreMvp([fact]);
    for (const id of ['ARCH-01', 'ARCH-08', 'SEC-06']) {
      const row = res.rows.find((r) => r.id === id) as unknown as { status: string; score?: number };
      expect(row.status, id).toBe('unknown');
      expect(row.score, id).toBeUndefined();
    }
    for (const id of ['VEL-06', 'VEL-08', 'VEL-09', 'VEL-10', 'SEC-07', 'TEST-08']) {
      const row = res.rows.find((r) => r.id === id) as unknown as { status: string; score?: number };
      expect(row.status, id).toBe('unknown');
      expect(row.score, id).toBeUndefined();
    }
  });
});

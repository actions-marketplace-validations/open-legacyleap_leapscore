/** legacy-stacks 7.2 — determinism and honesty over the committed fixture estates:
 * repeat-run fingerprint equality per fixture, no-literal conformance via seeded
 * tree regressions (each assertion flips when the tree changes, so a hard-coded
 * baseline constant fails it), unknown-when-unmapped, and thin-estate
 * insufficiency with what-it-takes notes. Same four estates as the 7.1 suite.
 */
import { describe, it, expect } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sniffEcosystems } from '../ecosystem';
import { bindLocalReadFile, bindLocalReadFilePartitioned } from '../local';
import { buildToolVersions } from '../detectors/common';
import { scanDependencies } from '../deps';
import { scanTestFiles } from '../testfiles';
import { detectEcos01 } from '../detectors/ecos01';
import { detectEcos02 } from '../detectors/ecos02';
import { detectEcos03 } from '../detectors/ecos03';
import { detectEcos05 } from '../detectors/ecos05';
import { detectEcos06 } from '../detectors/ecos06';
import { detectEcos07 } from '../detectors/ecos07';
import { detectEcos08 } from '../detectors/ecos08';
import { detectSec01 } from '../detectors/sec01';
import { detectTest03 } from '../detectors/test03';
import { detectTest05 } from '../detectors/test05';
import { scoreMvp } from '../scoring/scorer/mvp';
import { computeScoreFingerprint } from '../scoring/fingerprint';
import { snapshotVersions } from '../snapshots';
import type { ScanContext, RawFact } from '../detector';
import type { FactRecord } from '../facts';

const FIXTURES = fileURLToPath(new URL('fixtures/legacy-stacks', import.meta.url));
const SIG = new AbortController().signal;
const SCAN_MS = Date.parse('2026-10-17T00:00:00.000Z');

type Detector = (ctx: ScanContext, s: AbortSignal) => Promise<RawFact>;
type HonestyRow = { id: string; status: string; score?: number; unknown_measure_path?: string };

const WEBFORMS_DETECTORS: Detector[] = [detectEcos01, detectEcos02, detectEcos03, detectEcos05, detectEcos06, detectEcos07, detectSec01, detectTest03, detectTest05];
const MAVEN_DETECTORS: Detector[] = [detectEcos01, detectEcos02, detectEcos05, detectEcos07, detectSec01, detectTest03, detectTest05];
const CENSUS_DETECTORS: Detector[] = [detectEcos01, detectEcos07, detectTest03, detectTest05];

async function makeFixtureCtx(dir: string): Promise<ScanContext> {
  const manifests = (await sniffEcosystems(dir)).map((m) => ({ ...m, ecosystem: m.ecosystem as never }));
  const store = new Map<string, unknown>();
  return {
    clonePath: dir,
    commitSha: 'fixture',
    manifests,
    budgetLease: { timeoutMs: 30_000, byteCap: 8 * 1024 * 1024 },
    cache: { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } },
    toolVersions: buildToolVersions(),
    readFile: bindLocalReadFile(dir, {}),
    scanMs: SCAN_MS,
  };
}

function asRecord(f: RawFact): FactRecord {
  return { ...f, id: f.detectorId, root: '/' } as unknown as FactRecord;
}

/** Ctx with a caller-supplied (possibly partitioned/starved) readFile — the
 * read-budget disclosure tests (8.1/8.3) constrain per-detector bytes here. */
function budgetCtx(dir: string, manifests: ScanContext['manifests'], readFile: ScanContext['readFile']): ScanContext {
  const store = new Map<string, unknown>();
  return {
    clonePath: dir,
    commitSha: 'budget',
    manifests,
    budgetLease: { timeoutMs: 30_000, byteCap: 1024 },
    cache: { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } },
    toolVersions: buildToolVersions(),
    readFile,
    scanMs: SCAN_MS,
  };
}

async function runCopy(name: string, detectors: Detector[], mutate?: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), `leapscore-honesty-${name}-`));
  cpSync(join(FIXTURES, name), dir, { recursive: true });
  if (mutate) mutate(dir);
  const ctx = await makeFixtureCtx(dir);
  const facts: RawFact[] = [];
  for (const d of detectors) facts.push(await d(ctx, SIG));
  const result = scoreMvp(facts.map(asRecord));
  return { dir, ctx, facts, result, rows: result.rows as unknown as HonestyRow[] };
}

function section<T>(f: RawFact, key: string): T {
  return (f.facts as Record<string, unknown>)[key] as T;
}

/** Seal-equivalent fingerprint: the same composition `sealScan` hashes. */
function fpOf(facts: RawFact[]): string {
  return computeScoreFingerprint({
    facts: facts.map(asRecord),
    rubricVersion: 'docs/rubric@legacy-stacks',
    engineVersion: 'unified/1.0',
    engineSha7: 'fixture1',
    snapshotVersions: snapshotVersions(),
    strict: false,
    indicatorSet: facts.map((f) => f.detectorId),
    archetype: 'unknown',
  });
}

describe('7.2 determinism and honesty on the committed estates', () => {
  it('repeat scans of every estate produce identical scores and fingerprints', async () => {
    const estates: Array<[string, Detector[]]> = [
      ['webforms-vbnet', WEBFORMS_DETECTORS],
      ['maven-multi-module', MAVEN_DETECTORS],
      ['vb6', CENSUS_DETECTORS],
      ['delphi', CENSUS_DETECTORS],
    ];
    for (const [name, detectors] of estates) {
      const a = await runCopy(name, detectors);
      try {
        const b = await runCopy(name, detectors);
        try {
          expect(a.result.score, name).toBe(b.result.score);
          expect(a.result.suppressed, name).toBe(b.result.suppressed);
          expect(a.result.verdict, name).toBe(b.result.verdict);
          const fa = fpOf(a.facts);
          expect(fa, name).toMatch(/^[0-9a-f]{64}$/);
          expect(fa, name).toBe(fpOf(b.facts));
        } finally {
          rmSync(b.dir, { recursive: true, force: true });
        }
      } finally {
        rmSync(a.dir, { recursive: true, force: true });
      }
    }
  }, 60_000);

  it('seeded webforms edit: graded facts follow the tree (no literal constants)', async () => {
    const base = await runCopy('webforms-vbnet', WEBFORMS_DETECTORS);
    const variant = await runCopy('webforms-vbnet', WEBFORMS_DETECTORS, (dir) => {
      const p = join(dir, 'src/OrderPortal.Web/packages.config');
      writeFileSync(p, readFileSync(p, 'utf8').replace(/^\s*<package id="Contoso\.Ledger\.Client"[^>]*\/>\n/m, ''));
    });
    try {
      const e2 = (fx: typeof base) => section<{ direct_deps_total: number; unresolvable: number; unresolvable_names: string[]; resolvable_ratio: number }>(
        fx.facts.find((f) => f.detectorId === 'ECOS-02')!, 'ecos02',
      );
      const e5 = (fx: typeof base) => section<{ license_unknown_count: number; license_unknown_names: string[] }>(
        fx.facts.find((f) => f.detectorId === 'ECOS-05')!, 'ecos05',
      );
      // baseline discloses the private feed package as unresolvable / license-unknown...
      expect(e2(base).unresolvable_names).toEqual(['Contoso.Ledger.Client']);
      expect(e2(base).resolvable_ratio).toBe(0.857);
      expect(e5(base).license_unknown_names).toEqual(['Contoso.Ledger.Client']);
      // ...and removing it from the manifest flips every one of those facts
      expect(e2(variant).direct_deps_total).toBe(6);
      expect(e2(variant).unresolvable).toBe(0);
      expect(e2(variant).unresolvable_names).toEqual([]);
      expect(e2(variant).resolvable_ratio).toBe(1);
      expect(e5(variant).license_unknown_count).toBe(0);
      // a constant-producing engine would have kept the baseline values here
      expect(fpOf(variant.facts)).not.toBe(fpOf(base.facts));
    } finally {
      rmSync(base.dir, { recursive: true, force: true });
      rmSync(variant.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('seeded maven edit: a resolvable version does not launder absent metadata', async () => {
    const variant = await runCopy('maven-multi-module', MAVEN_DETECTORS, (dir) => {
      const p = join(dir, 'orders-batch/pom.xml');
      writeFileSync(p, readFileSync(p, 'utf8').replace('${undefined.version}', '3.2.1'));
    });
    try {
      // the seeded edit landed: the dependency now carries a literal version…
      const deps = await scanDependencies(variant.ctx);
      expect(deps.direct.find((d) => d.name === 'com.acme:mystery-report-lib')?.version).toBe('3.2.1');
      // …yet the package is absent from the curated metadata, so it stays
      // disclosed as unresolvable / license-unknown — never a permissive default
      const e2 = section<{ unresolvable: number; unresolvable_names: string[]; resolvable_ratio: number }>(
        variant.facts.find((f) => f.detectorId === 'ECOS-02')!, 'ecos02',
      );
      expect(e2.unresolvable).toBe(1);
      expect(e2.unresolvable_names).toEqual(['com.acme:mystery-report-lib']);
      expect(e2.resolvable_ratio).toBe(0.857);
      const e5 = section<{ license_unknown_names: string[] }>(variant.facts.find((f) => f.detectorId === 'ECOS-05')!, 'ecos05');
      expect(e5.license_unknown_names).toEqual(['com.acme:mystery-report-lib']);
    } finally {
      rmSync(variant.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('unmapped Delphi project version degrades ECOS-01 to unknown with what-it-takes', async () => {
    const variant = await runCopy('delphi', CENSUS_DETECTORS, (dir) => {
      const p = join(dir, 'src/OrderEntry.dproj');
      writeFileSync(p, readFileSync(p, 'utf8').replace(/<ProjectVersion>[^<]*<\/ProjectVersion>/, '<ProjectVersion>99.9</ProjectVersion>'));
    });
    try {
      const e1 = variant.facts.find((f) => f.detectorId === 'ECOS-01')!;
      expect(e1.measurement?.status).toBe('unknown');
      expect(e1.unknownMeasurePath).toMatch(/no pinned runtime resolved from the snapshot \(unmapped: delphi@99\.9\)/);
      const e1f = section<{ runtimes: unknown[]; unmapped_pins: string[]; lookup_ok: boolean }>(e1, 'ecos01');
      expect(e1f.runtimes).toEqual([]);
      expect(e1f.unmapped_pins).toEqual(['delphi@99.9']);
      expect(e1f.lookup_ok).toBe(false);
      // the row never fabricates a score from the unmappable pin
      const row = variant.rows.find((r) => r.id === 'ECOS-01')!;
      expect(row.status).toBe('unknown');
      expect(row.score).toBeUndefined();
      expect(row.unknown_measure_path).toMatch(/delphi@99\.9/);
    } finally {
      rmSync(variant.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('thin VB6/Delphi estates stay honest: insufficient-signal + renormalized reference + what-it-takes', async () => {
    for (const name of ['vb6', 'delphi']) {
      const fx = await runCopy(name, CENSUS_DETECTORS);
      try {
        expect(fx.result.suppressed, name).toBe(true);
        expect(fx.result.verdict, name).toBe('insufficient-signal');
        expect(typeof fx.result.score, name).toBe('number'); // number never hidden, only flagged
        // the renormalized reference remains visible under suppression
        expect(typeof fx.result.renormalized_score, name).toBe('number');
        expect(fx.result.renormalized_score, name).toBeGreaterThan(0);
        // exactly the runtime pin is measured; everything else stays unknown with a note
        expect(fx.result.coverage.measured, name).toBe(1);
        const notes = fx.rows.filter((r) => r.status === 'unknown' && r.unknown_measure_path);
        expect(notes.length, name).toBeGreaterThan(0);
        const e7 = fx.rows.find((r) => r.id === 'ECOS-07')!;
        expect(e7.status, name).toBe('unknown');
        expect(e7.unknown_measure_path, name).toMatch(/na_when clause-b/);
        const t3 = fx.rows.find((r) => r.id === 'TEST-03')!;
        expect(t3.unknown_measure_path, name).toMatch(/zero test files/);
      } finally {
        rmSync(fx.dir, { recursive: true, force: true });
      }
    }
  }, 60_000);
});

describe('8.1 read-budget truncation is disclosed, never graded over a partial surface', () => {
  it('a starved manifest read set is flagged and every dependency-row consumer goes unknown', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-budget-deps-'));
    try {
      const a = '<packages><package id="Newtonsoft.Json" version="7.0.1" /></packages>';
      const b = `<packages>${'<package id="log4net" version="2.0.3" />'.repeat(30)}</packages>`;
      mkdirSync(join(dir, 'a'), { recursive: true });
      mkdirSync(join(dir, 'b'), { recursive: true });
      writeFileSync(join(dir, 'a/packages.config'), a);
      writeFileSync(join(dir, 'b/packages.config'), b);
      const manifests = [
        { root: 'a', ecosystem: 'csharp' as never, manifest: 'packages.config', lockfile: 'packages.config' },
        { root: 'b', ecosystem: 'csharp' as never, manifest: 'packages.config', lockfile: 'packages.config' },
      ];

      // cap clears a/ but not b/ — the second read throws QuotaExceededError.
      // Each consumer reads through its own partitioned stream, as in the scan harness.
      const starvedCtx = () => budgetCtx(dir, manifests, bindLocalReadFilePartitioned(dir, {}).forDetector(a.length + 1));
      const scan = await scanDependencies(starvedCtx());
      expect(scan.readBudgetExhausted).toBe(true);
      expect(scan.manifests).toBe(1);
      expect(scan.manifestsTotal).toBe(2);
      expect(scan.direct.map((d) => d.name)).toEqual(['Newtonsoft.Json']);

      // every deps-row consumer refuses to grade the partial set
      for (const det of [detectEcos02, detectEcos03, detectEcos05, detectEcos06, detectEcos07, detectEcos08, detectSec01]) {
        const f = await det(starvedCtx(), SIG);
        expect(f.measurement?.status, f.detectorId).toBe('unknown');
        expect(f.unknownMeasurePath ?? '', f.detectorId).toMatch(/read budget after 1 of 2 dependency manifests/);
        expect(f.unknownMeasurePath ?? '', f.detectorId).toMatch(/scan a narrower sub-tree/);
        expect(f.unknownMeasurePath ?? '', f.detectorId).not.toMatch(/fully private/);
      }

      // control: the same tree with an unconstrained reader grades normally
      const full = budgetCtx(dir, manifests, bindLocalReadFile(dir, {}));
      const fullScan = await scanDependencies(full);
      expect(fullScan.readBudgetExhausted).toBe(false);
      expect(fullScan.manifests).toBe(2);
      expect(fullScan.manifestsTotal).toBe(2);
      expect((await detectEcos02(full, SIG)).measurement?.status).toBe('measured');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a starved test-file surface goes unknown with the read-budget disclosure (TEST-03/05)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-budget-tests-'));
    try {
      cpSync(join(FIXTURES, 'webforms-vbnet'), dir, { recursive: true });
      const manifests = (await sniffEcosystems(dir)).map((m) => ({ ...m, ecosystem: m.ecosystem as never }));

      // zero-cap partition: every read is budget-blocked before any byte is usable
      const starvedCtx = () => budgetCtx(dir, manifests, bindLocalReadFilePartitioned(dir, {}).forDetector(0));
      const scan = await scanTestFiles(starvedCtx(), SIG);
      expect(scan.total).toBeGreaterThan(0);
      expect(scan.unreadByBudget).toBe(scan.total);
      expect(scan.truncated).toBe(true);

      const t3 = await detectTest03(starvedCtx(), SIG);
      expect(t3.measurement?.status).toBe('unknown');
      expect(t3.unknownMeasurePath ?? '').toMatch(/read budget after 0 of \d+ test files/);
      const t5 = await detectTest05(starvedCtx(), SIG);
      expect(t5.measurement?.status).toBe('unknown');
      expect(t5.unknownMeasurePath ?? '').toMatch(/read budget after 0 of \d+ test files/);

      // control: unconstrained reads classify the surface (no budget flag)
      const full = budgetCtx(dir, manifests, bindLocalReadFile(dir, {}));
      const fullScan = await scanTestFiles(full, SIG);
      expect(fullScan.unreadByBudget).toBe(0);
      expect(fullScan.truncated).toBe(false);
      expect(fullScan.testsTotal).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('8.3 review fixes: pin-surface and supplementary-read budget disclosure', () => {
  it('a starved runtime-pin surface goes unknown with the read coverage (ECOS-01)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-budget-pins-'));
    try {
      const a = '<Project><PropertyGroup><TargetFrameworkVersion>v4.8</TargetFrameworkVersion></PropertyGroup></Project>\n';
      const b = `<Project><PropertyGroup><TargetFrameworkVersion>v4.7.2</TargetFrameworkVersion></PropertyGroup></Project>\n<!-- ${'x'.repeat(2048)} -->\n`;
      writeFileSync(join(dir, 'A.csproj'), a);
      writeFileSync(join(dir, 'B.csproj'), b);
      const manifests = [
        { root: '.', ecosystem: 'csharp' as never, manifest: 'A.csproj', lockfile: 'packages.lock.json' },
        { root: '.', ecosystem: 'csharp' as never, manifest: 'B.csproj', lockfile: 'packages.lock.json' },
      ];

      // cap fits A.csproj only — B.csproj's read throws QuotaExceededError and the
      // pin surface is incomplete, so neither project file may be graded
      const starved = await detectEcos01(
        budgetCtx(dir, manifests, bindLocalReadFilePartitioned(dir, {}).forDetector(a.length + 1)), SIG,
      );
      expect(starved.measurement?.status).toBe('unknown');
      expect(starved.unknownMeasurePath ?? '').toMatch(/read budget after 1 of 2 runtime pin sources/);
      expect(starved.unknownMeasurePath ?? '').toMatch(/scan a narrower sub-tree/);

      // control: unconstrained reads grade, and a version conflict carries BOTH
      // files as evidence (spec: conflicting pins resolve with both files)
      const full = await detectEcos01(budgetCtx(dir, manifests, bindLocalReadFile(dir, {})), SIG);
      expect(full.measurement?.status).toBe('measured');
      const e = section<{ conflict: boolean; runtimes: Array<{ product: string; version: string; conflict_sources?: string[] }> }>(full, 'ecos01');
      expect(e.conflict).toBe(true);
      expect(e.runtimes[0]).toMatchObject({ product: 'dotnetfx', version: '4.7.2' });
      expect(e.runtimes[0].conflict_sources).toEqual(['A.csproj#TargetFrameworkVersion', 'B.csproj#TargetFrameworkVersion']);
      const files = full.evidencePointers.map((p) => p.file);
      expect(files).toContain('A.csproj#TargetFrameworkVersion');
      expect(files).toContain('B.csproj#TargetFrameworkVersion');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a starved supplementary license read goes unknown, never silently "absent" (ECOS-05)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-budget-license-'));
    try {
      const pc = '<packages><package id="Newtonsoft.Json" version="9.0.1" /></packages>';
      const pkg = `{\n "bin": { "tool": "cli.js" },\n "pad": "${'x'.repeat(2048)}"\n}\n`;
      writeFileSync(join(dir, 'packages.config'), pc);
      writeFileSync(join(dir, 'package.json'), pkg);
      const manifests = [{ root: '.', ecosystem: 'csharp' as never, manifest: 'packages.config', lockfile: 'packages.config' }];

      // the manifest read fits; package.json (feeding the G8-relevant packaging
      // signal) is starved — the row discloses instead of reading it as absent
      const starved = await detectEcos05(
        budgetCtx(dir, manifests, bindLocalReadFilePartitioned(dir, {}).forDetector(pc.length + 10)), SIG,
      );
      expect(starved.measurement?.status).toBe('unknown');
      expect(starved.unknownMeasurePath ?? '').toMatch(/read budget after 0 of 1 license supplementary reads/);

      // control: unconstrained reads grade the license surface normally
      const full = await detectEcos05(budgetCtx(dir, manifests, bindLocalReadFile(dir, {})), SIG);
      expect(full.measurement?.status).toBe('estimated');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

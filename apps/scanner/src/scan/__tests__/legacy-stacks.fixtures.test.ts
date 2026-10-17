/** legacy-stacks 7.1 — committed fixture estates. One estate per legacy stack:
 * WebForms+VB.NET (dual classic/legacy-to-SDK shape), multi-module legacy Maven,
 * VB6, Delphi. Each `it` copies the committed tree to a temp dir and asserts row
 * statuses, evidence pointers and disclosure text end-to-end. The same four
 * estates carry the 7.2 determinism/honesty suites.
 */
import { describe, it, expect } from 'vitest';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sniffEcosystems } from '../ecosystem';
import { scanStackCensus } from '../stackcensus';
import { detectPlaneInventory } from '../archetype';
import { bindLocalReadFile } from '../local';
import { buildToolVersions } from '../detectors/common';
import { scanDependencies } from '../deps';
import { detectEcos01 } from '../detectors/ecos01';
import { detectEcos02 } from '../detectors/ecos02';
import { detectEcos03 } from '../detectors/ecos03';
import { detectEcos05 } from '../detectors/ecos05';
import { detectEcos06 } from '../detectors/ecos06';
import { detectEcos07 } from '../detectors/ecos07';
import { detectSec01 } from '../detectors/sec01';
import { detectTest03 } from '../detectors/test03';
import { detectTest05 } from '../detectors/test05';
import { scoreMvp } from '../scoring/scorer/mvp';
import type { ScanContext, RawFact } from '../detector';
import type { FactRecord } from '../facts';

const FIXTURES = fileURLToPath(new URL('fixtures/legacy-stacks', import.meta.url));
const SIG = new AbortController().signal;
const SCAN_MS = Date.parse('2026-10-17T00:00:00.000Z');

type Detector = (ctx: ScanContext, s: AbortSignal) => Promise<RawFact>;
type ScoredRow = { id: string; status: string; score?: number };

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

async function runFixture(name: string, detectors: Detector[]) {
  const dir = mkdtempSync(join(tmpdir(), `leapscore-fx-${name}-`));
  cpSync(join(FIXTURES, name), dir, { recursive: true });
  const ctx = await makeFixtureCtx(dir);
  const facts: RawFact[] = [];
  for (const d of detectors) facts.push(await d(ctx, SIG));
  const rows = scoreMvp(facts.map(asRecord)).rows as unknown as ScoredRow[];
  return { dir, ctx, facts, rows };
}

function section<T>(f: RawFact, key: string): T {
  return (f.facts as Record<string, unknown>)[key] as T;
}

function expectUnknown(f: RawFact, pattern: RegExp): void {
  expect(f.measurement?.status, f.detectorId).toBe('unknown');
  expect(f.unknownMeasurePath ?? '', f.detectorId).toMatch(pattern);
}

function expectRow(rows: ScoredRow[], id: string, status: string, score?: number): void {
  const r = rows.find((x) => x.id === id);
  expect(r, `row ${id} present`).toBeDefined();
  expect(r!.status, id).toBe(status);
  if (score === undefined) expect(r!.score, id).toBeUndefined();
  else expect(r!.score, id).toBe(score);
}

describe('7.1 committed fixture estates (WebForms+VB.NET / legacy Maven / VB6 / Delphi)', () => {
  it('webforms-vbnet: classic WebForms and SDK-style projects in one estate', async () => {
    const fx = await runFixture('webforms-vbnet', WEBFORMS_DETECTORS);
    try {
      // ingestion: 4 csharp manifests; the packages.config slot is lockless by design
      expect(fx.ctx.manifests).toHaveLength(4);
      const deps = await scanDependencies(fx.ctx);
      expect(deps.noLockfileMechanism).toEqual(['csharp:packages.config']);

      const byId = (id: string) => fx.facts.find((f) => f.detectorId === id)!;

      // ECOS-01 — net8.0 in support while .NET Framework 4.5 is a decade past EOL
      const e1 = byId('ECOS-01');
      expect(e1.measurement?.status).toBe('measured');
      expect(e1.measurement?.confidence).toBe('medium');
      const e1f = section<{ conflict: boolean; runtimes: Array<{ product: string; version: string; is_past_eol: boolean }> }>(e1, 'ecos01');
      expect(e1f.conflict).toBe(false);
      expect(e1f.runtimes.map((r) => `${r.product}@${r.version} ${r.is_past_eol ? 'past' : 'in-support'}`)).toEqual([
        'dotnet@8.0 in-support',
        'dotnetfx@4.5 past',
      ]);
      expect(e1.evidencePointers.some((p) => p.file === 'src/OrderPortal.Web/OrderPortal.Web.vbproj#TargetFrameworkVersion' && p.detail?.includes('EOL 2016-01-12'))).toBe(true);

      // ECOS-02 — lockfile-resolved direct set with one undisclosed-named package
      const e2 = byId('ECOS-02');
      expect(e2.measurement?.status).toBe('measured');
      const e2f = section<{
        direct_deps_total: number; unresolvable: number; unresolvable_names: string[]; resolvable_ratio: number;
        pct_behind_1plus_major: number; pct_behind_2plus_major: number;
        core_framework_gaps: Array<{ name: string; current: string; latest_major: number; majors_behind: number }>;
      }>(e2, 'ecos02');
      expect(e2f.direct_deps_total).toBe(7);
      expect(e2f.unresolvable).toBe(1);
      expect(e2f.unresolvable_names).toEqual(['Contoso.Ledger.Client']);
      expect(e2f.resolvable_ratio).toBe(0.857);
      expect(e2f.pct_behind_1plus_major).toBe(83.3);
      expect(e2f.pct_behind_2plus_major).toBe(16.7);
      expect(e2f.core_framework_gaps).toEqual([
        { name: 'EntityFramework', current: '5.0.0', latest_major: 6, majors_behind: 1 },
        { name: 'Microsoft.AspNet.Mvc', current: '4.0.40804', latest_major: 5, majors_behind: 1 },
      ]);
      expect(e2.evidencePointers.filter((p) => p.detail === 'direct-dep versions resolved from this lockfile').map((p) => p.file)).toEqual([
        'src/OrderPortal.Api/packages.lock.json',
        'src/OrderPortal.Etl/packages.lock.json',
      ]);

      // ECOS-03 — abandonment order + load-bearing (in-core-import) flags
      const e3 = byId('ECOS-03');
      expect(e3.measurement?.status).toBe('measured');
      const e3f = section<{
        load_bearing_total: number;
        abandoned: Array<{ name: string; months_since_release: number; in_core_path: boolean }>;
      }>(e3, 'ecos03');
      expect(e3f.load_bearing_total).toBe(7);
      expect(e3f.abandoned.map((a) => `${a.name} ${a.months_since_release}${a.in_core_path ? ' *core' : ''}`)).toEqual([
        'Microsoft.AspNet.Mvc 52',
        'Dapper 43 *core',
        'Newtonsoft.Json 43 *core',
        'log4net 39 *core',
        'EntityFramework 30',
        'Serilog 28 *core',
      ]);

      // ECOS-05 — license coverage estimated, unknown package disclosed by name
      const e5 = byId('ECOS-05');
      expect(e5.measurement?.status).toBe('estimated');
      expect(e5.measurement?.scopeLimited).toBe(true);
      const e5f = section<{ license_unknown_count: number; license_unknown_names: string[] }>(e5, 'ecos05');
      expect(e5f.license_unknown_count).toBe(1);
      expect(e5f.license_unknown_names).toEqual(['Contoso.Ledger.Client']);
      expect(e5.evidencePointers.some((p) => p.file === 'manifest:csharp' && p.detail === 'Contoso.Ledger.Client license classified from package metadata')).toBe(true);

      // ECOS-06 — duplicate transitive across the two lockfiles
      const e6 = byId('ECOS-06');
      expect(e6.measurement?.status).toBe('measured');
      const e6f = section<{ transitive_total: number; lockfiles_parsed: number; duplicates: Array<{ name: string; versions: string[] }> }>(e6, 'ecos06');
      expect(e6f.transitive_total).toBe(8);
      expect(e6f.lockfiles_parsed).toBe(2);
      expect(e6f.duplicates).toEqual([{ name: 'Serilog.Sinks.File', versions: ['4.0.0', '5.0.0'] }]);

      // ECOS-07 — measured pinning plus the structural lockfile-mechanism disclosure
      const e7 = byId('ECOS-07');
      expect(e7.measurement?.status).toBe('measured');
      const e7f = section<{ lockfile_mechanism_absent: string[]; pin_ratio: number; manifests_total: number; lockfiles: Array<{ path: string }> }>(e7, 'ecos07');
      expect(e7f.lockfile_mechanism_absent).toEqual(['csharp:packages.config']);
      expect(e7f.pin_ratio).toBe(100);
      expect(e7f.manifests_total).toBe(4);
      expect(e7f.lockfiles.map((l) => l.path)).toEqual(['src/OrderPortal.Api/packages.lock.json', 'src/OrderPortal.Etl/packages.lock.json']);
      const e7Details = e7.evidencePointers.map((p) => p.detail ?? '');
      expect(e7Details).toContain('no lockfile mechanism for csharp:packages.config — absence is structural, not a coverage gap; pinning is assessed from the manifest declarations');
      expect(e7Details).toContain('no git history — staleness check dropped, presence facts stand');

      // SEC-01 — advisory join with core-import closure
      const s1 = byId('SEC-01');
      expect(s1.measurement?.status).toBe('measured');
      const s1f = section<{ findings: Array<Record<string, unknown>>; ecosystems_scanned: string[]; ecosystems_uncovered: string[] }>(s1, 'sec01');
      expect(s1f.findings[0]).toMatchObject({ id: 'CVE-2018-1285', pkg: 'log4net', version: '1.2.10', severity: 'HIGH', in_core_import_closure: true });
      expect(s1f.ecosystems_scanned).toEqual(['csharp']);
      expect(s1f.ecosystems_uncovered).toEqual([]);
      expect(s1.evidencePointers.some((p) => p.endpoint === 'advisory-snapshot')).toBe(true);

      // TEST-03 / TEST-05 — Tests/Unit tree classified from the .vb conventions
      const t3 = byId('TEST-03');
      expect(t3.measurement?.status).toBe('estimated');
      const t3f = section<{ unit: number; classification_confidence: { high: number; low: number } }>(t3, 'test03');
      expect(t3f.unit).toBe(1);
      expect(t3f.classification_confidence).toEqual({ high: 1, low: 0 });
      expect(t3.evidencePointers.some((p) => p.file === 'Tests/Unit/BillingTests.vb' && p.detail === 'tier unit; 4 test defs')).toBe(true);
      const t5 = byId('TEST-05');
      expect(t5.measurement?.status).toBe('measured');
      const t5f = section<{ total_tests_est: number; skipped_total: number; skip_ratio: number }>(t5, 'test05');
      expect(t5f.total_tests_est).toBe(4);
      expect(t5f.skipped_total).toBe(2);
      expect(t5f.skip_ratio).toBe(0.5);
      expect(t5.evidencePointers.some((p) => p.file === 'Tests/Unit/BillingTests.vb' && p.detail === '2 skip marker(s) at line(s) 15, 21')).toBe(true);

      // planes — System.Web/Entity Framework signatures; no desktop/UI plane
      const plane = await detectPlaneInventory(fx.dir, bindLocalReadFile(fx.dir, {}));
      expect(plane.has_server).toBe(true);
      expect(plane.evidence.has_server.join(' ')).toContain('OrderPortal.Web.vbproj: System.Web');
      expect(plane.has_data).toBe(true);
      expect(plane.evidence.has_data.join(' ')).toContain('Entity Framework');
      expect(plane.has_client).toBe(false);
      expect(plane.evidence.has_client.join(' ')).toContain('tree scan');
      expect(plane.has_test).toBe(true);
      expect(plane.evidence.has_test.join(' ')).toContain('Tests/');

      // row statuses + scores through the MVP scorer
      expectRow(fx.rows, 'ECOS-01', 'measured', 1);
      expectRow(fx.rows, 'ECOS-02', 'measured', 1);
      expectRow(fx.rows, 'ECOS-03', 'measured', 0);
      expectRow(fx.rows, 'ECOS-05', 'estimated', 1);
      expectRow(fx.rows, 'ECOS-06', 'measured', 3);
      expectRow(fx.rows, 'ECOS-07', 'measured', 1);
      expectRow(fx.rows, 'SEC-01', 'measured', 1);
      expectRow(fx.rows, 'TEST-03', 'estimated', 2);
      expectRow(fx.rows, 'TEST-05', 'measured', 1);
    } finally {
      rmSync(fx.dir, { recursive: true, force: true });
    }
  });

  it('maven-multi-module: inherited versions, scopes, and lockless unknowns', async () => {
    const fx = await runFixture('maven-multi-module', MAVEN_DETECTORS);
    try {
      expect(fx.ctx.manifests).toHaveLength(4);
      const deps = await scanDependencies(fx.ctx);
      expect(deps.noLockfileMechanism).toEqual(['java:pom.xml']);
      // dependencyManagement interpolation + scopes
      const core = deps.direct.filter((d) => d.file === 'orders-core/pom.xml');
      const spring = core.find((d) => d.name === 'org.springframework:spring-core')!;
      expect(spring.version).toBe('4.3.30.RELEASE');
      expect(spring.version_source).toBe('pom.xml');
      expect(core.find((d) => d.name === 'junit:junit')?.scope).toBe('dev');
      const servlet = deps.direct.filter((d) => d.name === 'javax.servlet:servlet-api');
      expect(servlet.length).toBeGreaterThan(0); // provided → dev, never the prod set
      expect(servlet.every((d) => d.scope === 'dev')).toBe(true);
      expect(deps.direct.find((d) => d.name === 'com.acme:mystery-report-lib')?.version).toBeNull();

      const byId = (id: string) => fx.facts.find((f) => f.detectorId === id)!;

      const e1 = byId('ECOS-01');
      expect(e1.measurement?.status).toBe('measured');
      const e1f = section<{ runtimes: Array<{ product: string; version: string; pin_source: string; is_past_eol: boolean }> }>(e1, 'ecos01');
      expect(e1f.runtimes).toHaveLength(1);
      expect(e1f.runtimes[0]).toMatchObject({ product: 'java', version: '1.7', pin_source: 'pom.xml', is_past_eol: true });
      expect(e1.evidencePointers.some((p) => p.file === 'pom.xml' && p.detail?.includes('EOL 2022-07-19'))).toBe(true);

      const e2 = byId('ECOS-02');
      expect(e2.measurement?.status).toBe('measured');
      const e2f = section<{
        direct_deps_total: number; unresolvable_names: string[]; resolvable_ratio: number;
        core_framework_gaps: Array<{ name: string; current: string; latest_major: number; majors_behind: number }>;
      }>(e2, 'ecos02');
      expect(e2f.direct_deps_total).toBe(7);
      expect(e2f.unresolvable_names).toEqual(['com.acme:mystery-report-lib']);
      expect(e2f.resolvable_ratio).toBe(0.857);
      expect(e2f.core_framework_gaps).toEqual([
        { name: 'org.apache.struts:struts2-core', current: '2.3.30', latest_major: 6, majors_behind: 4 },
      ]);
      expect(e2.evidencePointers.some((p) => p.endpoint === 'lockfile-parse')).toBe(true); // no lockfile; snapshot is the version source

      const e5 = byId('ECOS-05');
      expect(e5.measurement?.status).toBe('estimated');
      expect(e5.measurement?.scopeLimited).toBe(true);
      expect(section<{ license_unknown_names: string[] }>(e5, 'ecos05').license_unknown_names).toEqual(['com.acme:mystery-report-lib']);

      // ECOS-07 — pin_ratio over the manifest set with the Maven disclosure
      const e7 = byId('ECOS-07');
      expect(e7.measurement?.status).toBe('measured');
      const e7f = section<{ lockfiles: unknown[]; lockfile_mechanism_absent: string[]; pin_ratio: number; manifests_total: number }>(e7, 'ecos07');
      expect(e7f.lockfiles).toEqual([]);
      expect(e7f.lockfile_mechanism_absent).toEqual(['java:pom.xml']);
      expect(e7f.pin_ratio).toBe(88.9);
      expect(e7f.manifests_total).toBe(4);
      expect(e7.evidencePointers.map((p) => p.detail ?? '')).toContain('no lockfile mechanism for java:pom.xml — absence is structural, not a coverage gap; pinning is assessed from the manifest declarations');

      // lockless ESTATE → SEC-01 cannot join advisories; the measure path says what it takes
      expectUnknown(byId('SEC-01'), /no lockfile found — versions are unpinned so advisories cannot be matched/);
      // Maven `src/test/` is not a high-confidence dir for tier classification at this ratio
      expectUnknown(byId('TEST-03'), /only 0% of 1 test files could be tier-classified/);

      const t5 = byId('TEST-05');
      expect(t5.measurement?.status).toBe('measured');
      expect(t5.evidencePointers.some((p) => p.file === 'orders-core/src/test/java/com/acme/orders/LedgerTest.java' && p.detail === '1 skip marker(s) at line(s) 15')).toBe(true);

      // planes — child-module poms are read; `packaging` is not a server dep
      const plane = await detectPlaneInventory(fx.dir, bindLocalReadFile(fx.dir, {}));
      expect(plane.has_server).toBe(true);
      const serverEv = plane.evidence.has_server.join(' ');
      expect(serverEv).toContain('orders-web/pom.xml: servlet/Struts');
      expect(serverEv).toContain('orders-core/pom.xml: servlet/Struts');
      expect(serverEv).not.toContain('pom.xml: gin');
      expect(plane.has_test).toBe(true);
      expect(plane.evidence.has_test.join(' ')).toContain('JUnit');

      // rows — lockless rows stay unknown, never guessed
      expectRow(fx.rows, 'ECOS-01', 'measured', 1);
      expectRow(fx.rows, 'ECOS-02', 'measured', 0);
      expectRow(fx.rows, 'ECOS-03', 'unknown');
      expectRow(fx.rows, 'ECOS-05', 'estimated', 1);
      expectRow(fx.rows, 'ECOS-06', 'unknown');
      expectRow(fx.rows, 'ECOS-07', 'measured', 0);
      expectRow(fx.rows, 'SEC-01', 'unknown');
      expectRow(fx.rows, 'TEST-03', 'unknown');
      expectRow(fx.rows, 'TEST-05', 'measured', 1);
    } finally {
      rmSync(fx.dir, { recursive: true, force: true });
    }
  });

  it('vb6: census-only estate pins the toolchain and names its unknowns', async () => {
    const fx = await runFixture('vb6', CENSUS_DETECTORS);
    try {
      expect(fx.ctx.manifests).toHaveLength(0); // census is a separate signal from dep manifests
      const census = await scanStackCensus({ clonePath: fx.dir });
      expect(census.vb6.detected).toBe(true);
      expect(census.vb6.project_files).toEqual(['Ledger.vbp']);
      expect(census.vb6.evidence).toEqual(['Ledger.cls', 'Ledger.frm', 'Ledger.vbp', 'Main.bas', 'Widget.ctl']);

      const byId = (id: string) => fx.facts.find((f) => f.detectorId === id)!;
      const e1 = byId('ECOS-01');
      expect(e1.measurement?.status).toBe('measured');
      const e1f = section<{ runtimes: Array<{ product: string; version: string; pin_source: string; is_past_eol: boolean }> }>(e1, 'ecos01');
      expect(e1f.runtimes[0]).toMatchObject({ product: 'vb6', version: '6.0', pin_source: 'Ledger.vbp', is_past_eol: true });
      expect(e1.evidencePointers.some((p) => p.file === 'Ledger.vbp' && p.detail?.includes('EOL 2008-04-08'))).toBe(true);

      // disclosures — a manifest-less tree cannot decide ECOS-07; tests are na_when zero-test
      expectUnknown(byId('ECOS-07'), /no manifest found \(na_when clause-b\)/);
      expectUnknown(byId('TEST-03'), /zero test files/);
      expectUnknown(byId('TEST-05'), /zero test files/);

      const plane = await detectPlaneInventory(fx.dir, bindLocalReadFile(fx.dir, {}));
      expect(plane.has_client).toBe(true);
      expect(plane.evidence.has_client.join(' ')).toContain('Ledger.frm');
      expect(plane.has_server).toBe(false);
      expect(plane.evidence.has_server.join(' ')).toContain('tree scan');

      expectRow(fx.rows, 'ECOS-01', 'measured', 1);
      expectRow(fx.rows, 'ECOS-02', 'unknown');
      expectRow(fx.rows, 'ECOS-07', 'unknown');
      expectRow(fx.rows, 'TEST-03', 'unknown');
      expectRow(fx.rows, 'TEST-05', 'unknown');
    } finally {
      rmSync(fx.dir, { recursive: true, force: true });
    }
  });

  it('delphi: .dproj project version resolves through the mapping table', async () => {
    const fx = await runFixture('delphi', CENSUS_DETECTORS);
    try {
      expect(fx.ctx.manifests).toHaveLength(0);
      const census = await scanStackCensus({ clonePath: fx.dir });
      expect(census.delphi.detected).toBe(true);
      expect(census.delphi.project_files).toEqual(['src/OrderEntry.dpr', 'src/OrderEntry.dproj']);

      const byId = (id: string) => fx.facts.find((f) => f.detectorId === id)!;
      const e1 = byId('ECOS-01');
      expect(e1.measurement?.status).toBe('measured');
      const e1f = section<{ runtimes: Array<{ product: string; version: string; pin_source: string; is_past_eol: boolean }> }>(e1, 'ecos01');
      expect(e1f.runtimes[0]).toMatchObject({ product: 'delphi', version: 'XE8', pin_source: 'src/OrderEntry.dproj#ProjectVersion 17.2', is_past_eol: true });
      expect(e1.evidencePointers.some((p) => p.file === 'src/OrderEntry.dproj#ProjectVersion 17.2' && p.detail?.includes('EOL 2019-12-31'))).toBe(true);

      expectUnknown(byId('ECOS-07'), /no manifest found \(na_when clause-b\)/);

      const plane = await detectPlaneInventory(fx.dir, bindLocalReadFile(fx.dir, {}));
      expect(plane.has_client).toBe(true);
      expect(plane.evidence.has_client.join(' ')).toContain('src/Main.dfm');
      expect(plane.has_server).toBe(false);
      expect(plane.evidence.has_server.join(' ')).toContain('tree scan');

      expectRow(fx.rows, 'ECOS-01', 'measured', 1);
      expectRow(fx.rows, 'ECOS-07', 'unknown');
      expectRow(fx.rows, 'TEST-03', 'unknown');
      expectRow(fx.rows, 'TEST-05', 'unknown');
    } finally {
      rmSync(fx.dir, { recursive: true, force: true });
    }
  });
});

/** legacy-stacks change verification — one test per task "verify" clause.
 * Stack-coverage ingestion/parsing/pins/planes for .NET/VB.NET, legacy Java,
 * VB6 and Delphi. Fixtures are real temp trees; no socket is ever opened.
 */
import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sniffEcosystems, discoverDotnetFiles, MAX_DOTNET_PROJECT_DEPTH } from '../ecosystem';
import { scanStackCensus, cachedStackCensus } from '../stackcensus';
import { detectPlaneInventory } from '../archetype';
import { walkSortedTree } from '../tree';
import { scanDependencies, parseNuGetLock, uniqueDirect } from '../deps';
import { bindLocalReadFile } from '../local';
import { buildToolVersions } from '../detectors/common';
import { detectEcos01 } from '../detectors/ecos01';
import { detectEcos02 } from '../detectors/ecos02';
import { detectEcos03 } from '../detectors/ecos03';
import { detectEcos05 } from '../detectors/ecos05';
import { detectEcos06 } from '../detectors/ecos06';
import { detectEcos07 } from '../detectors/ecos07';
import { detectEcos08 } from '../detectors/ecos08';
import { detectTest03 } from '../detectors/test03';
import { detectTest05 } from '../detectors/test05';
import { detectSec01 } from '../detectors/sec01';
import { scanTestFiles } from '../testfiles';
import { scanSourceImports, extractImports, couplingFor } from '../sourcefiles';
import type { ScanContext } from '../detector';
import {
  resolveRuntime, resolveFramework, lookupPackage, matchAdvisories,
  advisoryCoveredEcosystems, snapshotVersions,
  EOL_SNAPSHOT_VERSION, ADVISORY_SNAPSHOT_VERSION, EOL_SNAPSHOT_SOURCE, ADVISORY_SNAPSHOT_SOURCE,
} from '../snapshots';
import { computeScoreFingerprint } from '../scoring/fingerprint';

function dirWith(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-legacy-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 1.1 .NET-family recognition behind a bounded recursive discovery

describe('1.1 .NET-family recognition (bounded recursive discovery)', () => {
  it('discovers src/Billing/Billing.csproj with no .NET files at the root', async () => {
    const dir = dirWith({
      'src/Billing/Billing.csproj': '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net48</TargetFramework></PropertyGroup></Project>\n',
    });
    try {
      const manifests = await sniffEcosystems(dir);
      const entry = manifests.find((m) => m.ecosystem === 'csharp');
      expect(entry).toBeDefined();
      expect(entry!.root).toBe('src/Billing');
      expect(entry!.manifest).toBe('Billing.csproj');
      expect(entry!.lockfile).toBe('packages.lock.json');
    } finally {
      cleanup(dir);
    }
  });

  it('emits no csharp entries for a non-.NET fixture (existing sniff unchanged)', async () => {
    const dir = dirWith({
      'package.json': JSON.stringify({ name: 'f', version: '1.0.0' }),
      'package-lock.json': JSON.stringify({ lockfileVersion: 3, packages: { '': {} } }),
      'src/app.js': 'export const a = 1;\n',
      'docs/readme.md': '# x\n',
    });
    try {
      const manifests = await sniffEcosystems(dir);
      expect(manifests.some((m) => m.ecosystem === 'csharp')).toBe(false);
      // classic discovery still works
      expect(manifests.find((m) => m.ecosystem === 'js' && m.root === '.')).toBeDefined();
    } finally {
      cleanup(dir);
    }
  });

  it('discovers packages.config and packages.lock.json shapes', async () => {
    const dir = dirWith({
      'Legacy/Legacy.csproj': '<Project ToolsVersion="4.0" />\n',
      'Legacy/packages.config': '<packages><package id="Newtonsoft.Json" version="9.0.1" targetFramework="net45" /></packages>\n',
      'Modern/Modern.csproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Serilog" Version="3.0.0" /></ItemGroup></Project>\n',
      'Modern/packages.lock.json': JSON.stringify({ version: 1, dependencies: { 'net8.0': { Serilog: { type: 'Direct', resolved: '3.0.0' } } } }),
    });
    try {
      const manifests = await sniffEcosystems(dir);
      const cs = manifests.filter((m) => m.ecosystem === 'csharp').map((m) => `${m.root}/${m.manifest}->${m.lockfile}`);
      expect(cs).toContain('Legacy/Legacy.csproj->packages.lock.json');
      expect(cs).toContain('Legacy/packages.config->packages.config'); // classic NuGet: no lockfile mechanism (4.2)
      expect(cs).toContain('Modern/Modern.csproj->packages.lock.json');
    } finally {
      cleanup(dir);
    }
  });

  it('stays bounded: depth 4 is discovered, deeper is not; build dirs are skipped', async () => {
    expect(MAX_DOTNET_PROJECT_DEPTH).toBe(4);
    const deep = `a/b/c/d/Deep.csproj`;
    const tooDeep = `a/b/c/d/e/TooDeep.csproj`;
    const dir = dirWith({
      [deep]: '<Project Sdk="Microsoft.NET.Sdk" />\n',
      [tooDeep]: '<Project Sdk="Microsoft.NET.Sdk" />\n',
      'obj/generated/Gen.csproj': '<Project Sdk="Microsoft.NET.Sdk" />\n',
    });
    try {
      const discovered = await discoverDotnetFiles(dir);
      expect(discovered.projects).toContain(deep);
      expect(discovered.projects).not.toContain(tooDeep);
      expect(discovered.projects.some((p) => p.startsWith('obj/'))).toBe(false);
    } finally {
      cleanup(dir);
    }
  });

  it('a solution-only tree is still recognized (no package manifest)', async () => {
    const dir = dirWith({
      'App.sln': 'Microsoft Visual Studio Solution File, Format Version 12.00\n',
    });
    try {
      const discovery = await discoverDotnetFiles(dir);
      expect(discovery.solutions).toEqual(['App.sln']);
      const manifests = await sniffEcosystems(dir);
      const entry = manifests.find((m) => m.ecosystem === 'csharp');
      expect(entry).toBeDefined();
      expect(entry!.manifest).toBe('App.sln');
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 1.2 Stack census (VB6 / Delphi) — a signal separate from dependency manifests

describe('1.2 stack census (VB6 / Delphi)', () => {
  it('identifies a VB6 estate with evidence paths and zero dependency manifests', async () => {
    const dir = dirWith({
      'Billing.vbp': "Type=Exe\nForm=Billing.frm\nModule=Main.bas\n",
      'Billing.frm': 'VERSION 5.00\nBegin VB.Form Billing\nEnd\n',
      'Main.bas': 'Attribute VB_Name = "Main"\nSub Main()\nEnd Sub\n',
      'Ledger.cls': 'VERSION 1.0 CLASS\n',
      'Widget.ctl': 'VERSION 5.00\n',
    });
    try {
      const census = await scanStackCensus({ clonePath: dir });
      expect(census.vb6.detected).toBe(true);
      expect(census.vb6.project_files).toEqual(['Billing.vbp']);
      expect(census.vb6.evidence).toEqual(expect.arrayContaining(['Billing.frm', 'Main.bas']));
      expect(census.vb6.file_count).toBe(5);
      expect(census.delphi.detected).toBe(false);
      // Census is NOT a manifest: no sniffed ecosystems, zero parsed manifests.
      expect(await sniffEcosystems(dir)).toEqual([]);
      const scan = await scanDependencies({ manifests: [], readFile: async () => null, clonePath: dir });
      expect(scan.manifests).toBe(0);
      expect(scan.direct).toEqual([]);
    } finally {
      cleanup(dir);
    }
  });

  it('identifies a Delphi estate with project files and evidence paths', async () => {
    const dir = dirWith({
      'src/OrderEntry.dpr': "program OrderEntry;\nuses Forms, Main in 'Main.pas';\n",
      'src/Main.pas': 'unit Main;\ninterface\nimplementation\nend.\n',
      'src/Main.dfm': 'object Form1: TForm1\nend\n',
      'src/OrderEntry.dproj': '<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003"><PropertyGroup><ProjectVersion>15</ProjectVersion></PropertyGroup></Project>\n',
    });
    try {
      const census = await scanStackCensus({ clonePath: dir });
      expect(census.delphi.detected).toBe(true);
      expect(census.delphi.project_files).toEqual(['src/OrderEntry.dpr', 'src/OrderEntry.dproj']);
      expect(census.delphi.evidence).toContain('src/Main.pas');
      expect(census.vb6.detected).toBe(false);
      expect(await sniffEcosystems(dir)).toEqual([]);
      const scan = await scanDependencies({ manifests: [], readFile: async () => null, clonePath: dir });
      expect(scan.manifests).toBe(0);
    } finally {
      cleanup(dir);
    }
  });

  it('memoizes the census through the scan cache', async () => {
    const dir = dirWith({ 'App.vbp': 'Type=Exe\n' });
    try {
      const store = new Map<string, unknown>();
      const ctx = {
        clonePath: dir,
        cache: { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } },
      } as never;
      const a = await cachedStackCensus(ctx);
      const b = await cachedStackCensus(ctx);
      expect(a).toBe(b);
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 2.1/2.2 NuGet dependency parsing

async function depScan(dir: string) {
  const manifests = (await sniffEcosystems(dir)).map((m) => ({ ...m, ecosystem: m.ecosystem as never }));
  return scanDependencies({ manifests, readFile: bindLocalReadFile(dir, {}), clonePath: dir });
}

describe('2.1 NuGet manifests parse into direct-dependency facts', () => {
  it('packages.config yields exact versions in prod scope with file evidence', async () => {
    const dir = dirWith({
      'Legacy/Legacy.csproj': '<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003" />\n',
      'Legacy/packages.config': '<packages>\n  <package id="Newtonsoft.Json" version="9.0.1" targetFramework="net45" />\n</packages>\n',
    });
    try {
      const scan = await depScan(dir);
      const dep = scan.direct.find((d) => d.name === 'Newtonsoft.Json');
      expect(dep).toBeDefined();
      expect(dep!.version).toBe('9.0.1');
      expect(dep!.scope).toBe('prod');
      expect(dep!.ecosystem).toBe('csharp');
      expect(dep!.file).toBe('Legacy/packages.config');
    } finally {
      cleanup(dir);
    }
  });

  it('PackageReference attribute and child-element forms both resolve', async () => {
    const dir = dirWith({
      'Modern/Modern.csproj': [
        '<Project Sdk="Microsoft.NET.Sdk">',
        '  <ItemGroup>',
        '    <PackageReference Include="Serilog" Version="3.0.0" />',
        '    <PackageReference Include="Dapper">',
        '      <Version>2.1.35</Version>',
        '    </PackageReference>',
        '    <PackageReference Update="Skipped.Meta" Version="1.0.0" />',
        '  </ItemGroup>',
        '</Project>',
        '',
      ].join('\n'),
      'Modern/packages.lock.json': JSON.stringify({
        version: 1,
        dependencies: {
          'net8.0': {
            Serilog: { type: 'Direct', requested: '[3.0.0, )', resolved: '3.0.0', contentHash: 'sha512-x' },
          },
        },
      }),
    });
    try {
      const scan = await depScan(dir);
      const serilog = scan.direct.find((d) => d.name === 'Serilog');
      const dapper = scan.direct.find((d) => d.name === 'Dapper');
      expect(serilog!.version).toBe('3.0.0');
      expect(serilog!.file).toBe('Modern/Modern.csproj');
      expect(dapper!.version).toBe('2.1.35');
      expect(dapper!.file).toBe('Modern/Modern.csproj');
      expect(scan.direct.some((d) => d.name === 'Skipped.Meta')).toBe(false);
    } finally {
      cleanup(dir);
    }
  });

  it('vbproj PackageReference is parsed like csproj', async () => {
    const dir = dirWith({
      'Web/Web.vbproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="MySql.Data" Version="6.9.12" /></ItemGroup></Project>\n',
    });
    try {
      const scan = await depScan(dir);
      const dep = scan.direct.find((d) => d.name === 'MySql.Data');
      expect(dep!.version).toBe('6.9.12');
      expect(dep!.ecosystem).toBe('csharp');
    } finally {
      cleanup(dir);
    }
  });
});

describe('2.2 packages.lock.json is parsed as a NuGet lock', () => {
  it('distinguishes direct from transitive and resolves locked versions', async () => {
    const lock = {
      version: 1,
      dependencies: {
        'net8.0': {
          Serilog: { type: 'Direct', requested: '[3.0.0, )', resolved: '3.1.1', contentHash: 'sha512-a' },
          'Serilog.Sinks.File': { type: 'Transitive', resolved: '5.0.0', contentHash: 'sha512-b' },
        },
      },
    };
    const parsed = parseNuGetLock(JSON.stringify(lock))!;
    expect(parsed).not.toBeNull();
    expect(parsed.packages).toBe(2);
    expect(parsed.direct.get('Serilog')).toBe('3.1.1');
    expect(parsed.direct.has('Serilog.Sinks.File')).toBe(false);
    expect(parsed.integrity).toBe(true);

    const dir = dirWith({
      'App/App.csproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Serilog" Version="3.0.0" /></ItemGroup></Project>\n',
      'App/packages.lock.json': JSON.stringify(lock),
    });
    try {
      const scan = await depScan(dir);
      const dep = scan.direct.find((d) => d.name === 'Serilog');
      expect(dep!.version).toBe('3.1.1'); // lockfile resolution wins over the manifest spec
      const lf = scan.lockfiles.find((l) => l.path === 'App/packages.lock.json');
      expect(lf).toBeDefined();
      expect(lf!.ecosystem).toBe('csharp');
      expect(lf!.packages).toBe(2);
      expect(lf!.integrity).toBe(true);
      expect(lf!.versions).toEqual({ Serilog: ['3.1.1'], 'Serilog.Sinks.File': ['5.0.0'] });
    } finally {
      cleanup(dir);
    }
  });

  it('npm-shaped input under packages.lock.json is rejected, not parsed as npm', async () => {
    const npmShaped = JSON.stringify({ name: 'x', lockfileVersion: 3, packages: { 'node_modules/serilog': { version: '1.0.0' } } });
    expect(parseNuGetLock(npmShaped)).toBeNull();
    const dir = dirWith({
      'App/App.csproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Serilog" Version="3.0.0" /></ItemGroup></Project>\n',
      'App/packages.lock.json': npmShaped,
    });
    try {
      const scan = await depScan(dir);
      expect(scan.lockfiles).toEqual([]);
      expect(scan.unsupported).toContain('csharp:packages.lock.json');
      // direct dep still parses from the manifest, with the unresolved-lock disclosure
      expect(scan.direct.find((d) => d.name === 'Serilog')).toBeDefined();
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 2.3 Maven fidelity: ${properties}, in-repo parent, dependencyManagement, scopes

const PARENT_POM = [
  '<project xmlns="http://maven.apache.org/POM/4.0.0">',
  '  <groupId>com.acme</groupId>',
  '  <artifactId>parent</artifactId>',
  '  <version>5.3.39</version>',
  '  <packaging>pom</packaging>',
  '  <properties><spring.version>4.3.30.RELEASE</spring.version></properties>',
  '  <dependencyManagement>',
  '    <dependencies>',
  '      <dependency>',
  '        <groupId>org.springframework</groupId>',
  '        <artifactId>spring-core</artifactId>',
  '        <version>${spring.version}</version>',
  '      </dependency>',
  '    </dependencies>',
  '  </dependencyManagement>',
  '</project>',
  '',
].join('\n');

const CHILD_POM = [
  '<project xmlns="http://maven.apache.org/POM/4.0.0">',
  '  <parent>',
  '    <groupId>com.acme</groupId>',
  '    <artifactId>parent</artifactId>',
  '    <version>5.3.39</version>',
  '    <relativePath>../pom.xml</relativePath>',
  '  </parent>',
  '  <artifactId>module</artifactId>',
  '  <dependencies>',
  '    <dependency>',
  '      <groupId>org.springframework</groupId>',
  '      <artifactId>spring-core</artifactId>',
  '    </dependency>',
  '    <dependency>',
  '      <groupId>junit</groupId>',
  '      <artifactId>junit</artifactId>',
  '      <version>4.13.2</version>',
  '      <scope>test</scope>',
  '    </dependency>',
  '    <dependency>',
  '      <groupId>javax.servlet</groupId>',
  '      <artifactId>servlet-api</artifactId>',
  '      <version>${missing.version}</version>',
  '      <scope>provided</scope>',
  '    </dependency>',
  '  </dependencies>',
  '</project>',
  '',
].join('\n');

describe('2.3 Maven fidelity', () => {
  it('resolves ${property}, in-repo parent dependencyManagement, and excludes dev scopes', async () => {
    const dir = dirWith({ 'pom.xml': PARENT_POM, 'module/pom.xml': CHILD_POM });
    try {
      const scan = await depScan(dir);
      const spring = scan.direct.find((d) => d.name === 'org.springframework:spring-core');
      expect(spring).toBeDefined();
      expect(spring!.version).toBe('4.3.30.RELEASE');
      expect(spring!.file).toBe('module/pom.xml');
      expect(spring!.version_source).toBe('pom.xml'); // inherited from the parent POM
      const junit = scan.direct.find((d) => d.name === 'junit:junit');
      expect(junit!.scope).toBe('dev'); // test scope leaves the prod set
      const servlet = scan.direct.find((d) => d.name === 'javax.servlet:servlet-api');
      expect(servlet!.scope).toBe('dev'); // provided scope leaves the prod set
      const prod = uniqueDirect(scan.direct, 'prod').map((d) => d.name);
      expect(prod).toContain('org.springframework:spring-core');
      expect(prod).not.toContain('junit:junit');
      expect(prod).not.toContain('javax.servlet:servlet-api');
    } finally {
      cleanup(dir);
    }
  });

  it('keeps an unresolvable ${property} unresolvable — never a guessed version', async () => {
    const dir = dirWith({
      'pom.xml': [
        '<project>',
        '  <groupId>com.acme</groupId><artifactId>app</artifactId><version>1.0.0</version>',
        '  <dependencies>',
        '    <dependency>',
        '      <groupId>com.acme</groupId><artifactId>mystery</artifactId>',
        '      <version>${undefined.version}</version>',
        '    </dependency>',
        '  </dependencies>',
        '</project>',
      ].join('\n'),
    });
    try {
      const scan = await depScan(dir);
      const dep = scan.direct.find((d) => d.name === 'com.acme:mystery');
      expect(dep).toBeDefined();
      expect(dep!.version).toBeNull();
      expect(dep!.spec).toBe('${undefined.version}');
    } finally {
      cleanup(dir);
    }
  });

  it('does not treat a parent above the scanned tree as resolvable', async () => {
    const dir = dirWith({
      'module/pom.xml': CHILD_POM, // no ../pom.xml in the tree
    });
    try {
      const scan = await depScan(dir);
      const spring = scan.direct.find((d) => d.name === 'org.springframework:spring-core');
      expect(spring).toBeDefined();
      expect(spring!.version).toBeNull();
      expect(spring!.version_source).toBeUndefined();
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 2.4 wiring: ECOS-02/03/08 resolve a .NET fixture's packages end-to-end

const SIG = new AbortController().signal;

async function makeScanCtx(dir: string): Promise<ScanContext> {
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
    scanMs: Date.parse('2026-10-17T00:00:00.000Z'),
  };
}

function dotnetEstate(): string {
  return dirWith({
    // classic WebForms-era project: packages.config, no NuGet lockfile mechanism
    'src/Billing/Billing.csproj': '<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003" />\n',
    'src/Billing/packages.config': [
      '<packages>',
      '  <package id="Newtonsoft.Json" version="9.0.1" targetFramework="net45" />',
      '  <package id="log4net" version="1.2.10" targetFramework="net45" />',
      '  <package id="EntityFramework" version="5.0.0" targetFramework="net45" />',
      '  <package id="Microsoft.AspNet.Mvc" version="4.0.40804" targetFramework="net45" />',
      '</packages>',
      '',
    ].join('\n'),
    // SDK-style project with a real NuGet lockfile
    'src/Api/Api.csproj': [
      '<Project Sdk="Microsoft.NET.Sdk">',
      '  <ItemGroup>',
      '    <PackageReference Include="Serilog" Version="3.0.0" />',
      '    <PackageReference Include="Dapper" Version="2.1.35" />',
      '  </ItemGroup>',
      '</Project>',
      '',
    ].join('\n'),
    'src/Api/packages.lock.json': JSON.stringify({
      version: 1,
      dependencies: {
        'net8.0': {
          Serilog: { type: 'Direct', resolved: '3.0.0' },
          Dapper: { type: 'Direct', resolved: '2.1.35' },
          'Serilog.Sinks.File': { type: 'Transitive', resolved: '5.0.0' },
        },
      },
    }),
  });
}

describe('2.4 ECOS-02/03/08 resolve a .NET fixture end-to-end', () => {
  it('ECOS-02 measures drift and surfaces framework-class gaps (set + prefix paths)', async () => {
    const dir = dotnetEstate();
    try {
      const fact = await detectEcos02(await makeScanCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('lockfile-parse');
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos02 as {
        direct_deps_total: number; resolvable_ratio: number;
        pct_behind_1plus_major: number; pct_behind_2plus_major: number;
        core_framework_gaps: Array<{ name: string; majors_behind: number }>;
      };
      expect(e.direct_deps_total).toBe(6);
      expect(e.resolvable_ratio).toBe(1);
      expect(e.pct_behind_1plus_major).toBe(83.3);
      expect(e.pct_behind_2plus_major).toBe(16.7); // Newtonsoft.Json 9 → 13
      expect(e.core_framework_gaps.map((g) => g.name)).toEqual(['EntityFramework', 'Microsoft.AspNet.Mvc']);
    } finally {
      cleanup(dir);
    }
  });

  it('ECOS-03 reads last-release metadata for the load-bearing NuGet set', async () => {
    const dir = dotnetEstate();
    try {
      const fact = await detectEcos03(await makeScanCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('lockfile-parse');
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos03 as {
        load_bearing_total: number; resolvable_ratio: number;
        abandoned: Array<{ name: string; months_since_release: number }>;
      };
      expect(e.load_bearing_total).toBe(6);
      expect(e.resolvable_ratio).toBe(1);
      expect(e.abandoned.map((a) => a.name)).toEqual([
        'Microsoft.AspNet.Mvc', 'Dapper', 'Newtonsoft.Json', 'log4net', 'EntityFramework', 'Serilog',
      ]);
      for (const a of e.abandoned) expect(a.months_since_release).toBeGreaterThan(24);
    } finally {
      cleanup(dir);
    }
  });

  it('ECOS-08 resolves aspnet/entityframework from the snapshot (offline)', async () => {
    const dir = dotnetEstate();
    try {
      const fact = await detectEcos08(await makeScanCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('eol-snapshot');
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos08 as {
        frameworks: Array<{ name: string; version: string; support_status: string; eol_date: string | null }>;
      };
      expect(e.frameworks.map((f) => [f.name, f.support_status, f.eol_date])).toEqual([
        ['aspnet', 'maintenance', null],
        ['entityframework', 'maintenance', null],
      ]);
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 3.1/3.3 Snapshot data resolves every new product offline

const SCAN_MS = Date.parse('2026-10-17T00:00:00Z');

describe('3.1/3.3 vendored snapshot resolves the new products', () => {
  it('dotnet modern cycles resolve with the in-support / past-EOL split', () => {
    const six = resolveRuntime('.NET', '6.0.36', SCAN_MS);
    expect(six).not.toBeNull();
    expect(six!.product).toBe('dotnet');
    expect(six!.cycle).toBe('6.0');
    expect(six!.is_past_eol).toBe(true); // eol 2024-11-12
    const eight = resolveRuntime('dotnet', '8.0.21', SCAN_MS);
    expect(eight!.cycle).toBe('8.0');
    expect(eight!.is_past_eol).toBe(false); // eol 2026-11-10 — after the scan instant
    expect(eight!.days_until_eol).toBeGreaterThan(0);
  });

  it('dotnetfx is framed OS-bound: 4.5.2 is past, 4.8.1 carries no date claim', () => {
    const old = resolveRuntime('dotnetfx', '4.5.2', SCAN_MS);
    expect(old!.cycle).toBe('4.5.2');
    expect(old!.eol_date).toBe('2022-04-26');
    expect(old!.is_past_eol).toBe(true);
    const supported = resolveRuntime('netfx', '4.8.1', SCAN_MS);
    expect(supported!.product).toBe('dotnetfx');
    expect(supported!.is_past_eol).toBe(false);
    expect(supported!.days_until_eol).toBeNull(); // OS-bound: no fabricated date
  });

  it('vb6 resolves to the 2008 toolchain framing and says so in the source note', () => {
    const vb6 = resolveRuntime('vb6', '6.0', SCAN_MS);
    expect(vb6!.cycle).toBe('6.0');
    expect(vb6!.eol_date).toBe('2008-04-08');
    expect(vb6!.is_past_eol).toBe(true);
    expect(EOL_SNAPSHOT_SOURCE).toContain('vb6: toolchain end-of-life 2008');
    expect(EOL_SNAPSHOT_SOURCE).toContain('dotnetfx');
    expect(EOL_SNAPSHOT_SOURCE).toContain('delphi');
  });

  it('java legacy cycles resolve, including pre-9 1.x naming', () => {
    const six = resolveRuntime('java', '1.6.0_45', SCAN_MS);
    expect(six!.cycle).toBe('6');
    expect(six!.is_past_eol).toBe(true);
    const seven = resolveRuntime('jdk', '1.7.0_80', SCAN_MS);
    expect(seven!.cycle).toBe('7');
    expect(seven!.is_past_eol).toBe(true);
    const eight = resolveRuntime('java', '1.8.0_292', SCAN_MS);
    expect(eight!.cycle).toBe('8');
    expect(eight!.is_past_eol).toBe(false);
  });

  it('delphi maps exact cycles only — unmappable versions are null, never a lower cycle', () => {
    const xe8 = resolveRuntime('delphi', 'XE8', SCAN_MS);
    expect(xe8!.cycle).toBe('XE8');
    expect(xe8!.is_past_eol).toBe(true);
    const rio = resolveRuntime('delphi', '10.3', SCAN_MS);
    expect(rio!.cycle).toBe('10.3');
    expect(rio!.is_past_eol).toBe(true);
    const current = resolveRuntime('delphi', '12.2', SCAN_MS);
    expect(current!.cycle).toBe('12');
    expect(current!.is_past_eol).toBe(false);
    // versions not in the curated table stay null — no fall-through to a lower cycle
    expect(resolveRuntime('delphi', '99.0', SCAN_MS)).toBeNull();
    expect(resolveRuntime('delphi', '13', SCAN_MS)).toBeNull();
    expect(resolveRuntime('delphi', 'XE10', SCAN_MS)).toBeNull();
  });

  it('unknown products and versions return null — no silent defaults', () => {
    expect(resolveRuntime('cobol', '85', SCAN_MS)).toBeNull();
    expect(resolveRuntime('delphi', 'garbage', SCAN_MS)).toBeNull();
    expect(resolveFramework('not-a-framework', '1.0')).toBeNull();
    expect(lookupPackage('nuget', 'No.Such.Package')).toBeNull();
    expect(matchAdvisories('nuget', 'No.Such.Package', '1.0.0')).toEqual([]);
  });

  it('the new frameworks resolve (aspnet/entityframework/struts2)', () => {
    const aspnet = resolveFramework('webforms', '5.2.9');
    expect(aspnet).not.toBeNull();
    expect(aspnet!.name).toBe('aspnet');
    expect(aspnet!.support_status).toBe('maintenance');
    expect(aspnet!.eol_date).toBeNull(); // OS-bound framing, no blanket EOL date
    const ef = resolveFramework('EntityFramework', '6.4.4');
    expect(ef!.support_status).toBe('maintenance');
    const struts = resolveFramework('struts2', '2.5.10.1');
    expect(struts!.support_status).toBe('active');
  });

  it('nuget + maven package metadata resolves case-tolerantly', () => {
    const nj = lookupPackage('nuget', 'Newtonsoft.Json');
    expect(nj!.ecosystem).toBe('csharp');
    expect(nj!.latest_major).toBe(13);
    expect(lookupPackage('nuget', 'newtonsoft.json')!.latest_major).toBe(13);
    expect(lookupPackage('csharp', 'EntityFramework')!.latest_major).toBe(6);
    const struts = lookupPackage('maven', 'org.apache.struts:struts2-core');
    expect(struts!.ecosystem).toBe('java');
    expect(struts!.latest_major).toBe(6);
    expect(lookupPackage('maven', 'org.springframework:spring-core')!.latest_major).toBe(6);
    expect(lookupPackage('maven', 'org.example:absent')).toBeNull();
  });

  it('nuget advisories match affected pins and clear fixed ones', () => {
    const affected = matchAdvisories('nuget', 'log4net', '1.2.10');
    expect(affected.map((a) => a.id)).toEqual(['CVE-2018-1285']);
    expect(matchAdvisories('nuget', 'Log4Net', '1.2.10').map((a) => a.id)).toEqual(['CVE-2018-1285']);
    expect(matchAdvisories('csharp', 'log4net', '2.0.15')).toEqual([]);
    expect(matchAdvisories('nuget', 'System.Text.Encodings.Web', '4.7.1').map((a) => a.id)).toEqual(['CVE-2021-26701']);
    expect(matchAdvisories('nuget', 'System.Text.Encodings.Web', '4.7.2')).toEqual([]);
  });

  it('maven advisories match affected pins and clear fixed ones', () => {
    expect(matchAdvisories('maven', 'org.apache.struts:struts2-core', '2.5.10').map((a) => a.id)).toEqual(['CVE-2017-5638']);
    expect(matchAdvisories('maven', 'org.apache.struts:struts2-core', '2.5.10.1')).toEqual([]);
    expect(matchAdvisories('maven', 'org.springframework:spring-core', '4.3.30.RELEASE').map((a) => a.id)).toEqual(['CVE-2022-22965']);
    expect(matchAdvisories('maven', 'org.springframework:spring-core', '5.3.18')).toEqual([]);
    expect(matchAdvisories('maven', 'com.fasterxml.jackson.core:jackson-databind', '2.13.2').map((a) => a.id)).toEqual(['CVE-2020-36518']);
    expect(matchAdvisories('maven', 'com.fasterxml.jackson.core:jackson-databind', '2.13.2.1')).toEqual([]);
  });

  it('the advisory dataset discloses its coverage and selection rule', () => {
    expect(advisoryCoveredEcosystems()).toEqual(expect.arrayContaining(['csharp', 'java', 'js', 'py']));
    expect(ADVISORY_SNAPSHOT_SOURCE).toContain('Selection rule');
    expect(ADVISORY_SNAPSHOT_SOURCE).toContain('false-positive');
  });
});

describe('3.2 snapshot versions join the score fingerprint', () => {
  it('version ids are content-hash shaped and fingerprinted', () => {
    expect(EOL_SNAPSHOT_VERSION).toMatch(/^eol-\d{4}\.\d{2}-[0-9a-f]{12}$/);
    expect(ADVISORY_SNAPSHOT_VERSION).toMatch(/^adv-\d{4}\.\d{2}-[0-9a-f]{12}$/);
    const versions = snapshotVersions();
    expect(versions['eol-snapshot']).toBe(EOL_SNAPSHOT_VERSION);
    expect(versions['advisory-snapshot']).toBe(ADVISORY_SNAPSHOT_VERSION);
    const fp = (snapshotVersions: Record<string, string>) => computeScoreFingerprint({
      facts: [], rubricVersion: 'docs/rubric@tranche-a', engineVersion: 'unified/1.0', engineSha7: 'abc1234',
      strict: false, indicatorSet: ['ECOS-01'], archetype: 'legacy-enterprise', snapshotVersions,
    });
    expect(fp(versions)).not.toBe(fp({}));
    expect(fp(versions)).not.toBe(fp({ ...versions, 'eol-snapshot': `${versions['eol-snapshot']}x` }));
  });
});

// ---------------------------------------------------------------------------
// 4.1 Runtime-pin extraction (ECOS-01 pin sources)

describe('4.1 runtime-pin extraction (ECOS-01)', () => {
  it('a classic csproj TargetFrameworkVersion resolves to dotnetfx past support', async () => {
    const dir = dirWith({
      'src/Billing/Billing.csproj': '<Project ToolsVersion="4.0"><PropertyGroup><TargetFrameworkVersion>v4.5</TargetFrameworkVersion></PropertyGroup></Project>\n',
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      expect(fact.provenance.tool).toBe('eol-snapshot');
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>>; lookup_ok: boolean; conflict: boolean };
      expect(e.lookup_ok).toBe(true);
      expect(e.conflict).toBe(false);
      expect(e.runtimes).toEqual([
        expect.objectContaining({
          product: 'dotnetfx', version: '4.5', cycle: '4.5',
          pin_source: 'src/Billing/Billing.csproj#TargetFrameworkVersion',
          eol_date: '2016-01-12', is_past_eol: true,
        }),
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it('modern TFMs pin dotnet; a multi-target file pins both products without conflict', async () => {
    const dir = dirWith({
      'src/Web/Web.csproj': '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net48;net8.0</TargetFramework></PropertyGroup></Project>\n',
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>>; conflict: boolean };
      const byProduct = Object.fromEntries(e.runtimes.map((r) => [r.product, r]));
      expect(byProduct.dotnetfx).toMatchObject({ cycle: '4.8', is_past_eol: false });
      expect(byProduct.dotnet).toMatchObject({ cycle: '8.0', is_past_eol: false });
      expect(e.conflict).toBe(false); // different products are not a pin conflict
    } finally {
      cleanup(dir);
    }
  });

  it('global.json contributes the secondary dotnet SDK pin', async () => {
    const dir = dirWith({
      'global.json': JSON.stringify({ sdk: { version: '6.0.301', rollForward: 'latestPatch' } }),
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'dotnet', version: '6.0.301', cycle: '6.0', pin_source: 'global.json#sdk', is_past_eol: true }),
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it('a .vbp presence is the VB6 pin (6.0, toolchain framing)', async () => {
    const dir = dirWith({
      'Legacy/Ledger.vbp': 'Type=Exe\nForm=Ledger.frm\n',
      'Legacy/Ledger.frm': 'VERSION 5.00\n',
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'vb6', version: '6.0', cycle: '6.0', pin_source: 'Legacy/Ledger.vbp', eol_date: '2008-04-08', is_past_eol: true }),
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it('a .dproj ProjectVersion maps to the Delphi release cycle', async () => {
    const dir = dirWith({
      'src/OrderEntry.dproj': '<Project><PropertyGroup><ProjectVersion>17.2</ProjectVersion></PropertyGroup></Project>\n',
      'src/OrderEntry.dpr': 'program OrderEntry;\n',
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'delphi', version: 'XE8', cycle: 'XE8', pin_source: 'src/OrderEntry.dproj#ProjectVersion 17.2', is_past_eol: true }),
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it('a .dof-only tree resolves the pre-2009 version record', async () => {
    const dir = dirWith({
      'Legacy/Ledger.dpr': 'program Ledger;\n',
      'Legacy/Ledger.dof': '[FileVersion]\nVersion=7.0\n',
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'delphi', version: '7', cycle: '7', pin_source: 'Legacy/Ledger.dof#FileVersion 7.0', is_past_eol: true }),
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it('unmappable / version-less Delphi projects stay unknown with what-it-takes', async () => {
    const unmapped = dirWith({ 'src/Broken.dproj': '<Project><PropertyGroup><ProjectVersion>99.0</ProjectVersion></PropertyGroup></Project>\n' });
    try {
      const fact = await detectEcos01(await makeScanCtx(unmapped), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      expect(fact.unknownMeasurePath).toMatch(/no pinned runtime resolved/);
      expect(fact.unknownMeasurePath).toMatch(/delphi@99\.0/);
      expect(fact.unknownMeasurePath).toMatch(/refresh the vendored datasets/);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { unmapped_pins: string[] };
      expect(e.unmapped_pins).toEqual(['delphi@99.0']);
    } finally {
      cleanup(unmapped);
    }
    const versionless = dirWith({ 'App.dpr': 'program App;\n' });
    try {
      const fact = await detectEcos01(await makeScanCtx(versionless), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      const e = (fact.facts as Record<string, unknown>).ecos01 as { unmapped_pins: string[] };
      expect(e.unmapped_pins).toEqual(['delphi@unknown']); // never a guessed release
    } finally {
      cleanup(versionless);
    }
  });

  it('conflicting pins follow numeric-aware lowest-wins with the conflict flag', async () => {
    const dir = dirWith({
      'src/A/A.csproj': '<Project><PropertyGroup><TargetFrameworkVersion>v4.8</TargetFrameworkVersion></PropertyGroup></Project>\n',
      'src/B/B.csproj': '<Project><PropertyGroup><TargetFrameworkVersion>v4.7.2</TargetFrameworkVersion></PropertyGroup></Project>\n',
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      expect(fact.measurement?.confidence).toBe('low'); // conflict lowers confidence
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>>; conflict: boolean };
      expect(e.conflict).toBe(true);
      expect(e.runtimes).toEqual([expect.objectContaining({
        product: 'dotnetfx', version: '4.7.2', cycle: '4.7.2',
        // both files as evidence (stack-coverage scenario: the losing pin source
        // is recorded too, not only the lowest-wins winner)
        conflict_sources: ['src/A/A.csproj#TargetFrameworkVersion', 'src/B/B.csproj#TargetFrameworkVersion'],
      })]);
      const files = fact.evidencePointers.map((p) => p.file);
      expect(files).toContain('src/A/A.csproj#TargetFrameworkVersion');
      expect(files).toContain('src/B/B.csproj#TargetFrameworkVersion');
    } finally {
      cleanup(dir);
    }
  });

  it('build.gradle contributes the Java pin (VERSION_1_8 and toolchain forms)', async () => {
    const groovy = dirWith({ 'build.gradle': "plugins { id 'java' }\nsourceCompatibility = JavaVersion.VERSION_1_8\n" });
    try {
      const fact = await detectEcos01(await makeScanCtx(groovy), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'java', version: '1.8', cycle: '8', pin_source: 'build.gradle:sourceCompatibility', is_past_eol: false }),
      ]);
    } finally {
      cleanup(groovy);
    }
    const kts = dirWith({ 'build.gradle.kts': "java {\n  toolchain { languageVersion = JavaLanguageVersion.of(17) }\n}\n" });
    try {
      const fact = await detectEcos01(await makeScanCtx(kts), SIG);
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'java', version: '17', cycle: '17', pin_source: 'build.gradle.kts:toolchain' }),
      ]);
    } finally {
      cleanup(kts);
    }
  });

  it('pom.xml maven-compiler-plugin <source> contributes the Java pin', async () => {
    const dir = dirWith({
      'pom.xml': [
        '<project xmlns="http://maven.apache.org/POM/4.0.0">',
        '  <build><plugins><plugin>',
        '    <artifactId>maven-compiler-plugin</artifactId>',
        '    <version>2.3.2</version>',
        '    <configuration><source>1.7</source><target>1.7</target></configuration>',
        '  </plugin></plugins></build>',
        '</project>',
        '',
      ].join('\n'),
    });
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos01 as { runtimes: Array<Record<string, unknown>> };
      expect(e.runtimes).toEqual([
        expect.objectContaining({ product: 'java', version: '1.7', pin_source: 'pom.xml', is_past_eol: true }),
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it('no socket is opened during pin extraction and resolution', async () => {
    const dir = dirWith({
      'src/Billing/Billing.csproj': '<Project><PropertyGroup><TargetFrameworkVersion>v4.5</TargetFrameworkVersion></PropertyGroup></Project>\n',
      'src/Billing/packages.config': '<packages><package id="Newtonsoft.Json" version="9.0.1" /></packages>\n',
    });
    const spy = vi.fn(() => { throw new Error('socket'); });
    vi.stubGlobal('fetch', spy);
    try {
      const fact = await detectEcos01(await makeScanCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      expect(spy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 4.2 ECOS-07 lock / lockless semantics for the new ecosystems

describe('4.2 ECOS-07 lock / lockless semantics', () => {
  it('packages.lock.json is lock evidence for the NuGet ecosystem', async () => {
    const dir = dirWith({
      'src/Api/Api.csproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Serilog" Version="3.0.0" /></ItemGroup></Project>\n',
      'src/Api/packages.lock.json': JSON.stringify({ version: 1, dependencies: { 'net8.0': { Serilog: { type: 'Direct', resolved: '3.0.0', contentHash: 'sha512-x' } } } }),
    });
    try {
      const fact = await detectEcos07(await makeScanCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos07 as { lockfiles: Array<Record<string, unknown>>; lockfile_mechanism_absent: string[] };
      expect(e.lockfiles).toEqual([
        expect.objectContaining({ path: 'src/Api/packages.lock.json', ecosystem: 'csharp', integrity_hashes: true }),
      ]);
      expect(e.lockfile_mechanism_absent).toEqual([]);
    } finally {
      cleanup(dir);
    }
  });

  it('classic NuGet (no lockfile mechanism) is disclosed as structural, not a coverage gap', async () => {
    const dir = dirWith({
      'Legacy/Legacy.csproj': '<Project ToolsVersion="4.0" />\n',
      'Legacy/packages.config': '<packages><package id="Newtonsoft.Json" version="9.0.1" /></packages>\n',
    });
    try {
      const ctx = await makeScanCtx(dir);
      const scan = await scanDependencies(ctx);
      expect(scan.noLockfileMechanism).toEqual(['csharp:packages.config']);
      expect(scan.unsupported).toEqual([]); // structural absence is not a parse failure
      const fact = await detectEcos07(ctx, SIG);
      expect(fact.measurement?.status).toBe('measured'); // presence/absence is itself the fact
      const e = (fact.facts as Record<string, unknown>).ecos07 as { lockfiles: unknown[]; lockfile_mechanism_absent: string[] };
      expect(e.lockfiles).toEqual([]);
      expect(e.lockfile_mechanism_absent).toEqual(['csharp:packages.config']);
      expect(fact.evidencePointers.some((p) => String((p as { detail?: string }).detail ?? '').includes('no lockfile mechanism for csharp:packages.config'))).toBe(true);
    } finally {
      cleanup(dir);
    }
  });

  it('the Maven precedent rides the same rule (java:pom.xml)', async () => {
    const dir = dirWith({
      'pom.xml': '<project><groupId>com.acme</groupId><artifactId>app</artifactId><version>1.0.0</version></project>\n',
    });
    try {
      const scan = await scanDependencies(await makeScanCtx(dir));
      expect(scan.noLockfileMechanism).toEqual(['java:pom.xml']);
    } finally {
      cleanup(dir);
    }
  });

  it('a census-only stack reports unknown, never a zero-derived clean state', async () => {
    const dir = dirWith({
      'Legacy.vbp': 'Type=Exe\nForm=Legacy.frm\n',
      'Legacy.frm': 'VERSION 5.00\n',
    });
    try {
      const fact = await detectEcos07(await makeScanCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      expect(fact.unknownMeasurePath).toMatch(/no manifest found/);
      expect(fact.unknownMeasurePath).toMatch(/na_when clause-b/);
      expect((fact.facts as Record<string, unknown>).ecos07).toBeUndefined();
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 4.3 ECOS-02/03/05/06 ride the new parsers and data on a .NET fixture

/** Mixed .NET estate: classic packages.config (with one package absent from the
 * vendored tables), two SDK-style projects whose lockfiles share a transitive
 * at different versions (the cross-project duplicate signal), and one lock-less
 * classic project. Every asserted number below is re-derivable from this tree
 * (design D7 invariant 2) — nothing is a literal. */
function dotnetEstateMixed(): string {
  return dirWith({
    'src/Billing/Billing.csproj': '<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003" />\n',
    'src/Billing/packages.config': [
      '<packages>',
      '  <package id="Newtonsoft.Json" version="9.0.1" targetFramework="net45" />',
      '  <package id="log4net" version="1.2.10" targetFramework="net45" />',
      '  <package id="Contoso.Internal.Widgets" version="1.4.0" targetFramework="net45" />',
      '</packages>',
      '',
    ].join('\n'),
    'src/Api/Api.csproj': [
      '<Project Sdk="Microsoft.NET.Sdk">',
      '  <ItemGroup>',
      '    <PackageReference Include="Serilog" Version="3.0.0" />',
      '    <PackageReference Include="Dapper" Version="2.1.35" />',
      '  </ItemGroup>',
      '</Project>',
      '',
    ].join('\n'),
    'src/Api/packages.lock.json': JSON.stringify({
      version: 1,
      dependencies: {
        'net8.0': {
          Serilog: { type: 'Direct', resolved: '3.0.0', contentHash: 'sha512-a' },
          Dapper: { type: 'Direct', resolved: '2.1.35', contentHash: 'sha512-b' },
          'Serilog.Sinks.File': { type: 'Transitive', resolved: '5.0.0', contentHash: 'sha512-c' },
        },
      },
    }),
    'src/Legacy/Legacy.csproj': [
      '<Project Sdk="Microsoft.NET.Sdk">',
      '  <ItemGroup>',
      '    <PackageReference Include="Serilog" Version="3.0.0" />',
      '  </ItemGroup>',
      '</Project>',
      '',
    ].join('\n'),
    'src/Legacy/packages.lock.json': JSON.stringify({
      version: 1,
      dependencies: {
        'net48': {
          Serilog: { type: 'Direct', resolved: '3.0.0', contentHash: 'sha512-d' },
          'Serilog.Sinks.File': { type: 'Transitive', resolved: '4.0.0', contentHash: 'sha512-e' },
        },
      },
    }),
  });
}

describe('4.3 ECOS-02/03/05/06 ride the new parsers (.NET fixture)', () => {
  it('drift/abandonment/license/bloat facts are measured reads of the mixed estate', async () => {
    const dir = dotnetEstateMixed();
    try {
      const ctx = await makeScanCtx(dir);
      const f2 = await detectEcos02(ctx, SIG);
      const f3 = await detectEcos03(ctx, SIG);
      const f5 = await detectEcos05(ctx, SIG);
      const f6 = await detectEcos06(ctx, SIG);

      // ECOS-02: 5 unique direct deps (Billing 3 + Api 2; Legacy's Serilog dedupes).
      // Contoso.Internal.Widgets is absent from the vendored table → counted and
      // named, never guessed. 4/5 = 0.8 resolvable → measured.
      expect(f2.measurement?.status).toBe('measured');
      const e2 = (f2.facts as Record<string, unknown>).ecos02 as {
        direct_deps_total: number; unresolvable: number; unresolvable_names: string[]; resolvable_ratio: number;
        pct_behind_1plus_major: number; pct_behind_2plus_major: number; core_framework_gaps: unknown[];
      };
      expect(e2.direct_deps_total).toBe(5);
      expect(e2.resolvable_ratio).toBe(0.8);
      expect(e2.unresolvable).toBe(1);
      expect(e2.unresolvable_names).toEqual(['Contoso.Internal.Widgets']);
      // Newtonsoft.Json 9 → 13 is the only ≥2-major gap; log4net 1 → 2 and Serilog 3 → 4 are 1-major.
      expect(e2.pct_behind_1plus_major).toBe(75);
      expect(e2.pct_behind_2plus_major).toBe(25);
      expect(e2.core_framework_gaps).toEqual([]);

      // ECOS-03: last-release join over the load-bearing set; the uncovered
      // package is named, not silently dropped.
      expect(f3.measurement?.status).toBe('measured');
      const e3 = (f3.facts as Record<string, unknown>).ecos03 as {
        load_bearing_total: number; unresolvable: number; unresolvable_names: string[]; resolvable_ratio: number;
        abandoned: Array<{ name: string; version: string | null; months_since_release: number }>;
      };
      expect(e3.load_bearing_total).toBe(5);
      expect(e3.unresolvable).toBe(1);
      expect(e3.unresolvable_names).toEqual(['Contoso.Internal.Widgets']);
      expect(e3.resolvable_ratio).toBe(0.8);
      expect(e3.abandoned.map((a) => a.name).sort()).toEqual(['Dapper', 'Newtonsoft.Json', 'Serilog', 'log4net']);
      for (const a of e3.abandoned) expect(a.months_since_release).toBeGreaterThan(24);
      // Versions come from the lockfile join where locked (Serilog), manifest pin otherwise.
      expect(e3.abandoned.find((a) => a.name === 'Serilog')!.version).toBe('3.0.0');
      expect(e3.abandoned.find((a) => a.name === 'Newtonsoft.Json')!.version).toBe('9.0.1');

      // ECOS-05: license classes from the table; the uncovered package is named
      // and the row is scope-limited (estimated clamp [1,2]).
      expect(f5.measurement?.status).toBe('estimated');
      expect(f5.measurement?.scopeLimited).toBe(true);
      expect(f5.truncated).toBe(true);
      const e5 = (f5.facts as Record<string, unknown>).ecos05 as {
        packages_total: number; license_unknown_count: number; license_unknown_names: string[];
        copyleft_strong: unknown[]; copyleft_weak_count: number;
      };
      expect(e5.packages_total).toBe(5);
      expect(e5.license_unknown_count).toBe(1);
      expect(e5.license_unknown_names).toEqual(['Contoso.Internal.Widgets']);
      expect(e5.copyleft_strong).toEqual([]);
      expect(e5.copyleft_weak_count).toBe(0);

      // ECOS-06: transitive totals from both lockfiles; the shared transitive at
      // two versions is a cross-project duplicate (the .NET bloat signal).
      expect(f6.measurement?.status).toBe('measured');
      const e6 = (f6.facts as Record<string, unknown>).ecos06 as {
        transitive_total: number; lockfiles_parsed: number;
        duplicates: Array<{ name: string; versions: string[] }>; duplicate_security_critical: boolean;
      };
      expect(e6.transitive_total).toBe(5); // Api 3 + Legacy 2 lock entries
      expect(e6.lockfiles_parsed).toBe(2);
      expect(e6.duplicates).toEqual([{ name: 'Serilog.Sinks.File', versions: ['4.0.0', '5.0.0'] }]);
      expect(e6.duplicate_security_critical).toBe(false);

      // No literal payloads: the facts carry derived values and pointers, never
      // echoed manifest/lockfile text.
      const blob = [f2, f3, f5, f6].map((f) => JSON.stringify(f.facts)).join('\n');
      expect(blob).not.toMatch(/<package|PackageReference|contentHash|targetFramework/i);
    } finally {
      cleanup(dir);
    }
  });

  it('an entirely uncovered estate demotes every covered-table row to unknown', async () => {
    // "Demotion fixture" for the new stacks: nothing in the vendored tables —
    // drift/abandonment/license rows must be `unknown` with the packages named,
    // never a zero-derived clean state (spec honesty requirement).
    const dir = dirWith({
      'App/App.csproj': [
        '<Project Sdk="Microsoft.NET.Sdk">',
        '  <ItemGroup>',
        '    <PackageReference Include="Contoso.Core" Version="1.0.0" />',
        '    <PackageReference Include="Contoso.Ui" Version="2.0.0" />',
        '  </ItemGroup>',
        '</Project>',
        '',
      ].join('\n'),
      'App/packages.lock.json': JSON.stringify({
        version: 1,
        dependencies: {
          'net8.0': {
            'Contoso.Core': { type: 'Direct', resolved: '1.0.0' },
            'Contoso.Ui': { type: 'Direct', resolved: '2.0.0' },
          },
        },
      }),
    });
    try {
      const ctx = await makeScanCtx(dir);
      const f2 = await detectEcos02(ctx, SIG);
      expect(f2.measurement?.status).toBe('unknown');
      expect(f2.unknownMeasurePath).toMatch(/fully private ecosystem/);
      expect((f2.facts as Record<string, unknown>).ecos02).toMatchObject({
        unresolvable: 2, unresolvable_names: ['Contoso.Core', 'Contoso.Ui'],
      });

      const f3 = await detectEcos03(ctx, SIG);
      expect(f3.measurement?.status).toBe('unknown');
      expect(f3.unknownMeasurePath).toMatch(/every load-bearing dependency is unresolvable/);
      expect((f3.facts as Record<string, unknown>).ecos03).toMatchObject({
        unresolvable: 2, unresolvable_names: ['Contoso.Core', 'Contoso.Ui'],
      });

      const f5 = await detectEcos05(ctx, SIG);
      expect(f5.measurement?.status).toBe('unknown');
      expect(f5.unknownMeasurePath).toMatch(/none of the 2 direct dependencies is covered/);
      expect((f5.facts as Record<string, unknown>).ecos05).toMatchObject({
        license_unknown_count: 2, license_unknown_names: ['Contoso.Core', 'Contoso.Ui'],
      });
    } finally {
      cleanup(dir);
    }
  });

  it('ECOS-06 stays unknown for a classic estate with no lockfile mechanism', async () => {
    const dir = dirWith({
      'Legacy/Legacy.csproj': '<Project ToolsVersion="4.0" />\n',
      'Legacy/packages.config': '<packages><package id="Newtonsoft.Json" version="9.0.1" /></packages>\n',
    });
    try {
      const fact = await detectEcos06(await makeScanCtx(dir), SIG);
      expect(fact.measurement?.status).toBe('unknown');
      expect(fact.unknownMeasurePath).toMatch(/no lockfile found/);
      expect(fact.unknownMeasurePath).toMatch(/transitive counts are unknowable/);
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 5.1 Plane evidence for legacy stacks + canonical-walk skip dirs

describe('5.1 plane evidence (.NET / legacy Java / desktop) and skip dirs', () => {
  it('.NET web and data signatures set has_server + has_data', async () => {
    const dir = dirWith({
      'src/Web/Web.csproj': [
        '<Project Sdk="Microsoft.NET.Sdk.Web">',
        '  <ItemGroup>',
        '    <PackageReference Include="EntityFramework" Version="6.4.4" />',
        '  </ItemGroup>',
        '</Project>',
        '',
      ].join('\n'),
      'src/Web/Default.aspx': '<%@ Page Language="C#" %>\n',
    });
    try {
      const plane = await detectPlaneInventory(dir, bindLocalReadFile(dir, {}));
      expect(plane.has_server).toBe(true);
      expect(plane.has_data).toBe(true);
      expect(plane.evidence.has_server.join(' ')).toContain('Microsoft.NET.Sdk.Web');
      expect(plane.evidence.has_server.join(' ')).toContain('src/Web/Default.aspx');
      expect(plane.evidence.has_data.join(' ')).toContain('src/Web/Web.csproj: Entity Framework');
    } finally {
      cleanup(dir);
    }
    // a plain library project without web/data signatures keeps both planes false
    const plain = dirWith({
      'src/Lib/Lib.csproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Newtonsoft.Json" Version="13.0.3" /></ItemGroup></Project>\n',
    });
    try {
      const plane = await detectPlaneInventory(plain, bindLocalReadFile(plain, {}));
      expect(plane.has_server).toBe(false);
      expect(plane.has_data).toBe(false);
      expect(plane.evidence.has_server.join(' ')).toContain('tree scan');
    } finally {
      cleanup(plain);
    }
  });

  it('legacy Java servlet/JSP signatures set has_server', async () => {
    const dir = dirWith({
      'pom.xml': [
        '<project xmlns="http://maven.apache.org/POM/4.0.0">',
        '  <dependencies>',
        '    <dependency><groupId>javax.servlet</groupId><artifactId>servlet-api</artifactId><version>2.5</version></dependency>',
        '  </dependencies>',
        '</project>',
        '',
      ].join('\n'),
      'WebContent/WEB-INF/web.xml': '<web-app version="2.5" />\n',
      'WebContent/index.jsp': '<% out.println("hi"); %>\n',
    });
    try {
      const plane = await detectPlaneInventory(dir, bindLocalReadFile(dir, {}));
      expect(plane.has_server).toBe(true);
      const ev = plane.evidence.has_server.join(' ');
      expect(ev).toContain('pom.xml: servlet/Struts');
      expect(ev).toContain('WebContent/WEB-INF/web.xml');
    } finally {
      cleanup(dir);
    }
  });

  it('desktop UI (WinForms, VB6 forms, Delphi VCL) sets has_client', async () => {
    const dir = dirWith({
      'src/Forms/Forms.csproj': '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><UseWindowsForms>true</UseWindowsForms></PropertyGroup></Project>\n',
      'Legacy/Legacy.vbp': 'Type=Exe\nForm=Legacy.frm\n',
      'Legacy/Legacy.frm': 'VERSION 5.00\nBegin VB.Form Main\nEnd\n',
      'delphi/OrderEntry.dfm': 'object Form1: TForm1\n  Caption = \'Order\'\nend\n',
    });
    try {
      const plane = await detectPlaneInventory(dir, bindLocalReadFile(dir, {}));
      expect(plane.has_client).toBe(true);
      const ev = plane.evidence.has_client.join(' ');
      expect(ev).toContain('desktop UI (WinForms/WPF)');
      expect(ev).toMatch(/Legacy\.frm|OrderEntry\.dfm/);
    } finally {
      cleanup(dir);
    }
  });

  it('a capitalized Tests/ directory with NUnit markers sets has_test', async () => {
    const dir = dirWith({
      'App/App.Tests/App.Tests.csproj': '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="NUnit" Version="3.14.0" /></ItemGroup></Project>\n',
      'App/Tests/OrderTests.cs': 'using NUnit.Framework;\n[TestFixture]\npublic class OrderTests { }\n',
    });
    try {
      const plane = await detectPlaneInventory(dir, bindLocalReadFile(dir, {}));
      expect(plane.has_test).toBe(true);
      const ev = plane.evidence.has_test.join(' ');
      expect(ev).toMatch(/App\/Tests\/|App\/App\.Tests\/App\.Tests\.csproj/);
    } finally {
      cleanup(dir);
    }
  });

  it('canonical walk skips the D6 build/IDE dirs and keeps bin/ + packages/', async () => {
    const dir = dirWith({
      'src/App.cs': 'class App { }\n',
      'obj/project.assets.json': '{}\n',
      'target/classes/App.class': 'x\n',
      '.gradle/cache.bin': 'x\n',
      '.vs/state.bin': 'x\n',
      '__history/Old.pas': 'unit Old;\n',
      '__recovery/Rescued.bas': 'Sub Main\nEnd Sub\n',
      'bin/tool.sh': '#!/bin/sh\n',
      'packages/pkg/index.js': 'module.exports = 1;\n',
    });
    try {
      const walk = await walkSortedTree(dir);
      expect(walk.paths).toContain('src/App.cs');
      expect(walk.paths).toContain('bin/tool.sh');
      expect(walk.paths).toContain('packages/pkg/index.js');
      for (const skipped of ['obj/', 'target/', '.gradle/', '.vs/', '__history/', '__recovery/']) {
        expect(walk.paths.some((p) => p.startsWith(skipped)), skipped).toBe(false);
      }
      // fileCount counts files only and is the sampleN input — exactly the 3 kept files
      expect(walk.fileCount).toBe(3);
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 5.2 .NET test-file classification (marker families + read-bound disclosure)

describe('5.2 test classifier covers .NET conventions', () => {
  it('classifies MSTest/NUnit/xUnit C# and VB markers, skip forms, case-tolerant dirs', async () => {
    const dir = dirWith({
      // case-tolerant Tests/ dir + suffix convention
      'App/Tests/OrderServiceTests.cs': [
        'using Microsoft.VisualStudio.TestTools.UnitTesting;',
        '[TestClass]',
        'public class OrderServiceTests {',
        '  [TestMethod] public void Places() {}',
        '  [TestMethod, Ignore] public void Legacy() {}',
        '  [TestMethod] public void Skipped() { Assert.Inconclusive("todo"); }',
        '}',
        '',
      ].join('\n'),
      'App/Tests/NUnitCaseTests.cs': [
        'using NUnit.Framework;',
        '[TestFixture]',
        'public class NUnitCaseTests {',
        '  [Test] public void Works() {}',
        '  [TestCase(1)] public void Cases(int n) {}',
        '  [Test, Ignore("flaky")] public void Flaky() {}',
        '}',
        '',
      ].join('\n'),
      'App/Tests/TheoryTests.cs': [
        'using Xunit;',
        'public class TheoryTests {',
        '  [Fact] public void Once() {}',
        '  [Theory(Skip = "not ready")] public void Later(int n) {}',
        '}',
        '',
      ].join('\n'),
      // VB forms
      'Legacy/VbTests.vb': [
        'Imports Microsoft.VisualStudio.TestTools.UnitTesting',
        '<TestClass>',
        'Public Class VbTests',
        '    <TestMethod>',
        '    Public Sub Works()',
        '    End Sub',
        '    <TestMethod, Ignore>',
        '    Public Sub Old()',
        '    End Sub',
        'End Class',
        '',
      ].join('\n'),
    });
    try {
      const scan = await scanTestFiles(await makeScanCtx(dir));
      const byPath = new Map(scan.files.map((f) => [f.path, f]));

      const mstest = byPath.get('App/Tests/OrderServiceTests.cs')!;
      expect(mstest.tier).toBe('unit');
      // `*Tests.cs` file-name convention classifies unit at high confidence
      // (legacy-stacks 8.3); a bare `Tests/` dir without the convention stays a
      // low-confidence hint whose tier comes from content
      expect(mstest.highConfidence).toBe(true);
      expect(mstest.tests).toBe(3); // [TestMethod] x3
      expect(mstest.skips).toEqual([5, 6]); // [TestMethod, Ignore] + Assert.Inconclusive

      const nunit = byPath.get('App/Tests/NUnitCaseTests.cs')!;
      expect(nunit.tests).toBe(3); // [Test], [TestCase], [Test, Ignore]
      expect(nunit.skips).toEqual([6]);

      const xunit = byPath.get('App/Tests/TheoryTests.cs')!;
      expect(xunit.tests).toBe(2); // [Fact], [Theory(Skip…)]
      expect(xunit.skips).toEqual([4]);

      const vb = byPath.get('Legacy/VbTests.vb')!;
      expect(vb.tier).toBe('unit');
      expect(vb.tests).toBe(2); // <TestMethod> x2
      expect(vb.skips).toEqual([7]);

      expect(scan.truncated).toBe(false);
      expect(scan.skipTotal).toBe(5);
    } finally {
      cleanup(dir);
    }
  });

  it('discloses scope-limited when the test-file read bound is hit', async () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < 81; i++) {
      const n = String(i).padStart(3, '0');
      files[`App/Tests/unit/Case${n}Tests.cs`] = [
        'using Xunit;',
        'public class CaseTests {',
        '  [Fact] public void Works() {}',
        '  [Fact(Skip = "why")] public void Later() {}',
        '}',
        '',
      ].join('\n');
    }
    const dir = dirWith(files);
    try {
      const ctx = await makeScanCtx(dir);
      const scan = await scanTestFiles(ctx);
      expect(scan.total).toBe(80); // MAX_TEST_FILES_READ
      expect(scan.truncated).toBe(true);
      expect(scan.skipTotal).toBe(80);

      const t3 = await detectTest03(ctx, SIG);
      expect(t3.truncated).toBe(true);
      expect(t3.measurement?.status).toBe('estimated');
      expect(t3.measurement?.scopeLimited).toBe(true);

      const t5 = await detectTest05(ctx, SIG);
      expect(t5.truncated).toBe(true);
      expect(t5.measurement?.status).toBe('measured');
      expect(t5.measurement?.scopeLimited).toBe(true);
      const e5 = (t5.facts as Record<string, unknown>).test05 as { skipped_total: number; skip_ratio: number };
      expect(e5.skipped_total).toBe(80);
      expect(e5.skip_ratio).toBe(0.5);
    } finally {
      cleanup(dir);
    }
  });

  it('dotted .Tests project dirs and *Tests.cs|vb names classify unit at high confidence', async () => {
    const dir = dirWith({
      'src/Orchard.Tests/ContentManagerTests.cs': [
        'using NUnit.Framework;',
        'public class ContentManagerTests {',
        '  [Test] public void Works() {}',
        '}',
        '',
      ].join('\n'),
      'src/Orchard.Tests/ApiSmokeTests.cs': [
        'using Microsoft.AspNetCore.Mvc.Testing;',
        'public class ApiSmokeTests {',
        '  [Fact] public void Boots() { _ = new WebApplicationFactory<Program>(); }',
        '}',
        '',
      ].join('\n'),
    });
    try {
      const ctx = await makeScanCtx(dir);
      const scan = await scanTestFiles(ctx);
      const byPath = new Map(scan.files.map((f) => [f.path, f]));

      const unit = byPath.get('src/Orchard.Tests/ContentManagerTests.cs')!;
      expect(unit.tier).toBe('unit');
      expect(unit.highConfidence).toBe(true); // *Tests.cs convention (legacy-stacks 8.3)

      // a content marker still beats the convention: WebApplicationFactory → integration
      const integ = byPath.get('src/Orchard.Tests/ApiSmokeTests.cs')!;
      expect(integ.tier).toBe('integration');
      expect(integ.highConfidence).toBe(true);
      expect(scan.highRatio).toBe(1);

      // the ≥60% TEST-03 classifiability bar is now reachable on the .Tests layout
      const t3 = await detectTest03(ctx, SIG);
      expect(t3.measurement?.status).toBe('estimated');
    } finally {
      cleanup(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// 5.3 source-import extraction covers C# `using` / VB `Imports`

describe('5.3 C#/VB source imports feed reachability and coupling', () => {
  it('extracts usings/Imports (incl. global/static/alias forms) as module tokens', () => {
    expect(extractImports([
      'using System.Web;',
      'global using Foo.Bar;',
      'using static System.Math;',
      'using EF = Microsoft.EntityFrameworkCore;',
      '',
    ].join('\n'))).toEqual(['System.Web', 'Foo.Bar', 'System.Math', 'Microsoft.EntityFrameworkCore']);

    expect(extractImports([
      'Imports System.Web',
      "Imports System.IO, System.Net ' comment tail",
      'Imports EF = Microsoft.EntityFrameworkCore',
      '',
    ].join('\n'))).toEqual(['System.Web', 'System.IO', 'System.Net', 'Microsoft.EntityFrameworkCore']);
  });

  it('a mixed .cs/.vb fixture resolves reachability and coupling end-to-end', async () => {
    const dir = dirWith({
      'src/Legacy/Legacy.csproj': [
        '<Project Sdk="Microsoft.NET.Sdk">',
        '  <PropertyGroup><TargetFramework>net48</TargetFramework></PropertyGroup>',
        '  <ItemGroup><PackageReference Include="Newtonsoft.Json" Version="9.0.1" /></ItemGroup>',
        '</Project>',
        '',
      ].join('\n'),
      'src/Legacy/packages.lock.json': JSON.stringify({
        version: 1,
        dependencies: { net48: { 'Newtonsoft.Json': { type: 'Direct', resolved: '9.0.1' } } },
      }),
      'src/Legacy/Service.cs': [
        'using Newtonsoft.Json;',
        'namespace Legacy { public class Service { } }',
        '',
      ].join('\n'),
      'src/Legacy/LegacyModule.vb': [
        'Imports Newtonsoft.Json',
        'Public Module LegacyModule',
        'End Module',
        '',
      ].join('\n'),
    });
    try {
      const ctx = await makeScanCtx(dir);
      const imports = await scanSourceImports(ctx);
      expect(imports.sourceFiles).toBe(2); // .cs + .vb both in the source set
      expect(imports.filesScanned).toBe(2);
      expect(imports.truncated).toBe(false);
      expect(imports.tokens.has('Newtonsoft.Json')).toBe(true);

      const coupling = couplingFor(imports, ['Newtonsoft.Json']);
      expect(coupling.share).toBe(1); // both scanned files import it
      expect(coupling.facade).toBe(false);

      const fact = await detectEcos03(ctx, SIG);
      expect(fact.measurement?.status).toBe('measured');
      const e = (fact.facts as Record<string, unknown>).ecos03 as {
        abandoned: Array<{ name: string; in_core_path: boolean }>;
      };
      expect(e.abandoned.map((a) => [a.name, a.in_core_path])).toEqual([['Newtonsoft.Json', true]]);
    } finally {
      cleanup(dir);
    }
  });

  it('labels ECOS-03 estimated/scope-limited and SEC-01 scope-limited when the source read bound truncates', async () => {
    const files: Record<string, string> = {
      'src/Legacy/Legacy.csproj': [
        '<Project Sdk="Microsoft.NET.Sdk">',
        '  <ItemGroup><PackageReference Include="Newtonsoft.Json" Version="9.0.1" /></ItemGroup>',
        '</Project>',
        '',
      ].join('\n'),
      'src/Legacy/packages.lock.json': JSON.stringify({
        version: 1,
        dependencies: { 'net8.0': { 'Newtonsoft.Json': { type: 'Direct', resolved: '9.0.1' } } },
      }),
    };
    for (let i = 0; i < 401; i++) {
      const n = String(i).padStart(3, '0');
      files[`src/Legacy/Svc${n}.cs`] = `using Newtonsoft.Json;\nnamespace Legacy { public class Svc${n} { } }\n`;
    }
    const dir = dirWith(files);
    try {
      const ctx = await makeScanCtx(dir);
      const imports = await scanSourceImports(ctx);
      expect(imports.sourceFiles).toBe(401);
      expect(imports.filesScanned).toBe(400); // MAX_SOURCE_FILES
      expect(imports.truncated).toBe(true);

      const e3 = await detectEcos03(ctx, SIG);
      expect(e3.truncated).toBe(true);
      expect(e3.measurement?.status).toBe('estimated');
      expect(e3.measurement?.scopeLimited).toBe(true);

      const s1 = await detectSec01(ctx, SIG);
      expect(s1.truncated).toBe(true);
      expect(s1.measurement?.status).toBe('measured');
      expect(s1.measurement?.scopeLimited).toBe(true);
    } finally {
      cleanup(dir);
    }
  });
});

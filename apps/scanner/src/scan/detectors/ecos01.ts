import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact, readBudgetNote, readText, makeReadBudgetTracker, type ReadBudgetTracker } from './common';
import { walkSortedTree } from '../tree';
import { resolveRuntime, cmpVersion, snapshotVersions, SNAPSHOT_REFRESH_HINT } from '../snapshots';
import { cachedStackCensus } from '../stackcensus';

const WHAT_IT_TAKES =
  'declare a runtime version pin (.nvmrc / .python-version / .tool-versions / package.json engines / pyproject requires-python / Dockerfile FROM / CI matrix / .NET TargetFramework(Version) or global.json SDK / .vbp / Delphi project version / build.gradle Java level) so the EOL snapshot can resolve it';

const YELLOW_MARGIN_DAYS = 90;
const CORE_PIN = /dockerfile|workflow|ci|\.github/i;

export type RuntimePin = { product: string; version: string; pin_source: string };

function parseVersionLine(raw: string): string | null {
  const m = /([0-9]+(?:\.[0-9]+){0,2}(?:[-+][0-9A-Za-z.-]+)?)/.exec(raw);
  return m ? m[1] : null;
}

/** .NET target framework moniker → runtime product pin (design D7): `net48` is
 * .NET Framework 4.8 (`dotnetfx`), `netcoreapp3.1`/`net8.0` are `dotnet`.
 * `netstandard*` and `uap` are contract monikers, not runtime pins. */
function dotnetPinForTfm(tfm: string): { product: 'dotnet' | 'dotnetfx'; version: string } | null {
  const t = tfm.trim().toLowerCase();
  const core = /^netcoreapp(\d+\.\d+)/.exec(t);
  if (core) return { product: 'dotnet', version: core[1] };
  const modern = /^net(\d+\.\d+)(?:-|$)/.exec(t);
  if (modern) return { product: 'dotnet', version: modern[1] };
  const classic = /^net(\d{2,3})(?:-|$)/.exec(t);
  if (classic) {
    const d = classic[1];
    return { product: 'dotnetfx', version: `${d[0]}.${d[1]}${d[2] ? `.${d[2]}` : ''}` };
  }
  return null;
}

/** `.dproj` ProjectVersion → Delphi release cycle (4.1; design D7). Curated from
 * the vendor/JPLib project-version tables — the numbers are not semver and are
 * version-graded per release. Ambiguous values resolve to the *older* candidate
 * (conservative); values absent here stay unmapped → `unknown`. */
const DELPHI_PROJECT_VERSION: Record<string, string> = {
  '12.0': '2009', // 2009 / 2010 — indistinguishable by project file
  '12.2': 'XE', '12.3': 'XE',
  '13.4': 'XE2',
  '14.3': 'XE3', '14.4': 'XE3', // 14.4 is XE3 Update 2 / XE4
  '14.6': 'XE4',
  '15.0': 'XE5', '15.1': 'XE5', '15.3': 'XE5', // 15.2 is AppMethod — not tracked
  '15.4': 'XE6',
  '16.0': 'XE7', '16.1': 'XE7',
  '17.0': 'XE8', '17.1': 'XE8', '17.2': 'XE8',
  '18.0': '10',
  '18.1': '10', // Seattle / Berlin Update 1
  '18.2': '10.1', // Berlin / Tokyo Update 1
  '18.3': '10.2', '18.4': '10.2',
  '18.5': '10.3', '18.6': '10.3', '18.7': '10.3', '18.8': '10.3',
  '19.0': '10.4', '19.1': '10.4', '19.2': '10.4',
  '19.3': '11', '19.4': '11',
  '20.0': '12', '20.1': '12', '20.2': '12', '20.3': '12', // 20.3 is also 13 Florence
};

/** `.dof` [FileVersion] → Delphi release (pre-2009 projects). */
const DELPHI_DOF_VERSION: Record<string, string> = { '6.0': '6', '7.0': '7' };

/** Best-effort runtime-pin extraction over the enumerated tree (spec ecos-01 §2).
 * Every read goes through `pinReads` (legacy-stacks 8.3): a read-budget-blocked
 * read means the pin surface is incomplete, so the caller emits `unknown` with
 * the read coverage instead of grading the prefix. */
async function extractPins(ctx: ScanContext, signal: AbortSignal, pinReads: ReadBudgetTracker): Promise<RuntimePin[]> {
  const pins: RuntimePin[] = [];
  const add = (product: string, version: string | null, pin_source: string) => {
    if (version) pins.push({ product, version, pin_source });
  };
  const read = (path: string) => readText(ctx, path, pinReads);

  const vmLines: Array<[string, string]> = [
    ['.nvmrc', 'node'], ['.node-version', 'node'],
    ['.python-version', 'python'], ['.ruby-version', 'ruby'], ['.java-version', 'java'],
  ];
  for (const [file, product] of vmLines) {
    const text = await read(file);
    if (text) add(product, parseVersionLine(text.trim().split('\n')[0] ?? ''), file);
  }
  const toolVersions = await read('.tool-versions');
  if (toolVersions) {
    for (const line of toolVersions.split('\n')) {
      const m = /^([a-z0-9]+)\s+(.+)$/i.exec(line.trim());
      if (!m) continue;
      add(m[1].toLowerCase(), parseVersionLine(m[2]), '.tool-versions');
    }
  }
  const runtimeTxt = await read('runtime.txt');
  if (runtimeTxt) add('python', parseVersionLine(runtimeTxt.trim()), 'runtime.txt');

  const pkgRaw = await read('package.json');
  if (pkgRaw) {
    try {
      const j = JSON.parse(pkgRaw) as { engines?: Record<string, string> };
      const node = j.engines?.node;
      if (node) add('node', parseVersionLine(node), 'package.json#engines');
    } catch { /* ignore */ }
  }
  const pyproject = await read('pyproject.toml');
  if (pyproject) {
    const m = /requires-python\s*=\s*["']([^"']+)["']/.exec(pyproject);
    if (m) add('python', parseVersionLine(m[1]), 'pyproject.toml');
  }
  const goMod = await read('go.mod');
  if (goMod) {
    const m = /^go\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/m.exec(goMod);
    if (m) add('go', m[1], 'go.mod');
  }
  const gemfile = await read('Gemfile');
  if (gemfile) {
    const m = /^\s*ruby\s+["']([0-9][^"']*)["']/m.exec(gemfile);
    if (m) add('ruby', parseVersionLine(m[1]), 'Gemfile');
  }
  const pom = await read('pom.xml');
  if (pom) {
    // legacy-stacks 8.3: the `maven-compiler-plugin` `<configuration><source>`
    // form joins the pom pin list (spec ecos-01 §2) — the classic legacy-Maven
    // declaration; `maven.compiler.*` / `<java.version>` remain primary.
    const cpBlock = /<artifactId>\s*maven-compiler-plugin\s*<\/artifactId>[\s\S]*?<\/plugin>/.exec(pom);
    const m = /<java\.version>\s*([^<\s]+)\s*<\/java\.version>/.exec(pom)
      ?? /<maven\.compiler\.(?:source|target)>\s*([^<\s]+)\s*<\//.exec(pom)
      ?? (cpBlock ? /<source>\s*([^<\s]+)\s*<\/source>/.exec(cpBlock[0]) ?? undefined : undefined);
    if (m) add('java', parseVersionLine(m[1]), 'pom.xml');
  }
  for (const file of ['build.gradle', 'build.gradle.kts']) {
    const text = await read(file);
    if (!text) continue;
    const jv = /JavaVersion\.VERSION_(\d+)(?:_(\d+))?/.exec(text);
    if (jv) {
      add('java', jv[2] ? `${jv[1]}.${jv[2]}` : jv[1], `${file}:sourceCompatibility`);
      continue;
    }
    const sc = /(?:source|target)Compatibility\s*[:=]\s*['"]?(\d+(?:\.\d+)*)['"]?/.exec(text);
    if (sc) { add('java', sc[1], `${file}:sourceCompatibility`); continue; }
    const lv = /JavaLanguageVersion\.of\((\d+)\)/.exec(text);
    if (lv) add('java', lv[1], `${file}:toolchain`);
  }

  // .NET runtime pins (4.1; design D7): project target framework is primary,
  // the global.json SDK pin is secondary; conflicts follow lowest-wins.
  for (const m of ctx.manifests ?? []) {
    if (m.ecosystem !== 'csharp') continue;
    const path = m.root && m.root !== '.' ? `${m.root}/${m.manifest}` : m.manifest;
    if (/\.(csproj|vbproj)$/i.test(m.manifest)) {
      const text = await read(path);
      if (!text) continue;
      const tfms = /<TargetFramework>\s*([^<\s]+)\s*<\/TargetFramework>/i.exec(text)?.[1];
      const tfv = /<TargetFrameworkVersion>\s*([^<\s]+)\s*<\/TargetFrameworkVersion>/i.exec(text)?.[1];
      if (tfms) {
        for (const tfm of tfms.split(';')) {
          const pin = dotnetPinForTfm(tfm);
          if (pin) add(pin.product, pin.version, `${path}#TargetFramework`);
        }
      } else if (tfv && /^\d/.test(tfv.replace(/^v/i, ''))) {
        add('dotnetfx', tfv.replace(/^v/i, ''), `${path}#TargetFrameworkVersion`);
      }
    } else if (m.manifest === 'global.json') {
      const raw = await read(path);
      if (raw) {
        try {
          const v = (JSON.parse(raw) as { sdk?: { version?: string } }).sdk?.version;
          if (v) add('dotnet', parseVersionLine(v), `${path}#sdk`);
        } catch { /* ignore */ }
      }
    }
  }

  // VB6 / Delphi are census-only stacks (design D2): project-file evidence is
  // the pin. `.dproj` is authoritative when present; `.dof`/`.dpr`-only trees
  // are pre-2009 and resolve from their version record (or stay unmapped).
  try {
    const census = await cachedStackCensus(ctx, signal);
    if (census.vb6.detected) {
      add('vb6', '6.0', census.vb6.project_files[0] ?? census.vb6.evidence[0] ?? 'vb6 census');
    }
    if (census.delphi.detected) {
      const projects = census.delphi.project_files;
      const dprojs = projects.filter((p) => /\.dproj$/i.test(p)).slice(0, 5);
      const dofs = dprojs.length ? [] : projects.filter((p) => /\.dof$/i.test(p)).slice(0, 5);
      for (const p of dprojs) {
        const raw = /<ProjectVersion>\s*([^<\s]+)\s*<\/ProjectVersion>/i.exec(await read(p) ?? '')?.[1];
        if (!raw) continue;
        add('delphi', DELPHI_PROJECT_VERSION[raw] ?? raw, `${p}#ProjectVersion ${raw}`);
      }
      for (const p of dofs) {
        const raw = /\[FileVersion\][^\[]*?\bversion\s*=\s*([0-9.]+)/i.exec(await read(p) ?? '')?.[1];
        if (!raw) continue;
        add('delphi', DELPHI_DOF_VERSION[raw] ?? raw, `${p}#FileVersion ${raw}`);
      }
      if (!dprojs.length && !dofs.length) {
        const dpr = projects.find((p) => /\.dpr$/i.test(p));
        if (dpr) add('delphi', 'unknown', `${dpr}#no version record`);
      }
    }
  } catch { /* census unavailable */ }

  // Container base images (core deploy path).
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    const dockerfiles = walk.paths.filter((p) => !p.endsWith('/') && /(^|\/)Dockerfile(\.[\w.-]+)?$/.test(p)).sort().slice(0, 5);
    for (const df of dockerfiles) {
      const text = await read(df);
      if (!text) continue;
      for (const line of text.split('\n')) {
        const m = /^\s*FROM\s+([^\s:]+)(?::([^\s]+))?/i.exec(line);
        if (!m) continue;
        const image = m[1].toLowerCase();
        const tag = m[2];
        const product = image.includes('node') ? 'node' : image.includes('python') ? 'python' : image.includes('ruby') ? 'ruby' : image.includes('openjdk') || image.includes('jdk') || image.includes('java') ? 'java' : image.includes('golang') || image.includes('go') ? 'go' : null;
        if (product) add(product, tag ? parseVersionLine(tag) : null, `${df}:FROM`);
      }
    }
  } catch { /* tree unavailable */ }
  return pins;
}

/**
 * ECOS-01 — runtime/language EOL, resolved from the vendored offline snapshot
 * (detector-honesty 2.x/3.x; spec ecos-01). No socket: `endoflife.date` data is
 * vendored; a pin the snapshot cannot resolve is disclosed, never scored as
 * "in support" (spec §7).
 */
export async function detectEcos01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-01', 'eol-snapshot', started, WHAT_IT_TAKES);
    const pinReads = makeReadBudgetTracker();
    const pins = await extractPins(ctx, signal, pinReads);
    if (pinReads.budgetBlocked > 0) {
      return unknownFact('ECOS-01', 'eol-snapshot', started,
        readBudgetNote(pinReads.reads, pinReads.reads + pinReads.budgetBlocked, 'runtime pin sources'));
    }
    if (pins.length === 0) {
      return unknownFact('ECOS-01', 'eol-snapshot', started, `${WHAT_IT_TAKES}; no runtime pin was found in the tree`);
    }

    const byProduct = new Map<string, RuntimePin>();
    const sourcesByProduct = new Map<string, string[]>();
    const mismatched = new Set<string>();
    let conflict = false;
    for (const pin of [...pins].sort((a, b) => a.pin_source.localeCompare(b.pin_source))) {
      const sources = sourcesByProduct.get(pin.product) ?? [];
      sources.push(pin.pin_source);
      sourcesByProduct.set(pin.product, sources);
      const existing = byProduct.get(pin.product);
      if (!existing) { byProduct.set(pin.product, pin); continue; }
      if (existing.version !== pin.version) {
        conflict = true;
        mismatched.add(pin.product);
        // most conservative (lowest) wins — numeric-aware, so `4.10` > `4.9`
        if (cmpVersion(pin.version, existing.version) < 0) byProduct.set(pin.product, pin);
      }
    }

    const runtimes: Array<Record<string, unknown>> = [];
    const unmapped: string[] = [];
    const pointers = [];
    for (const pin of [...byProduct.values()].sort((a, b) => a.product.localeCompare(b.product))) {
      const res = resolveRuntime(pin.product, pin.version, nowMs);
      if (!res) { unmapped.push(`${pin.product}@${pin.version}`); continue; }
      // spec ecos-01 §2.5 / stack-coverage: conflicting pins record every source —
      // the losing file is evidence too, not just the lowest-wins winner.
      const conflictSources = mismatched.has(pin.product)
        ? [...new Set(sourcesByProduct.get(pin.product) ?? [])].sort()
        : [];
      runtimes.push({
        product: res.product,
        version: pin.version,
        cycle: res.cycle,
        pin_source: pin.pin_source,
        eol_date: res.eol_date,
        days_until_eol: res.days_until_eol,
        is_past_eol: res.is_past_eol,
        ...(conflictSources.length > 1 ? { conflict_sources: conflictSources } : {}),
      });
      pointers.push(filePointer(pin.pin_source.split(':')[0], `${res.product} ${pin.version} → cycle ${res.cycle}, EOL ${res.eol_date ?? 'unknown'} (${res.days_until_eol}d)`));
      for (const src of conflictSources) {
        if (src === pin.pin_source) continue;
        pointers.push(filePointer(src.split(':')[0], `conflicting ${res.product} pin source (lowest version wins — see conflict_sources)`));
      }
    }
    pointers.push(basisPointer('eol-snapshot', `vendored eol dataset ${snapshotVersions()['eol-snapshot']}`));

    const lookupOk = runtimes.length > 0 && unmapped.length === 0;
    const facts = { ecos01: { runtimes, conflict, unmapped_pins: unmapped, lookup_ok: lookupOk } };

    if (runtimes.length === 0) {
      return unknownFact('ECOS-01', 'eol-snapshot', started,
        `no pinned runtime resolved from the snapshot (unmapped: ${unmapped.join(', ')}) — ${SNAPSHOT_REFRESH_HINT}`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    const measurement = lookupOk ? { status: 'measured' as const, confidence: conflict ? 'low' as const : 'medium' as const } : { status: 'estimated' as const, confidence: 'low' as const, scopeLimited: true };
    return measuredFact({
      detectorId: 'ECOS-01',
      producer: 'eol-snapshot',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement,
      truncated: !lookupOk,
    });
  } catch (e) {
    return { detectorId: 'ECOS-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'eol-snapshot', version: '1.0', flags: ['eol-snapshot'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}

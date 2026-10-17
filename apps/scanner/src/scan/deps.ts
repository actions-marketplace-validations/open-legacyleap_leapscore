/** apps/scanner/src/scan/deps.ts — cross-ecosystem manifest + lockfile parsing
 * (detector-honesty 2.3/2.4). No execution, no network: only the text the
 * orchestrator already read through `ctx.readFile` (byte-capped).
 *
 * What is measured vs. unknown: direct dependencies, locked versions, lockfile
 * presence/integrity, duplicate versions and transitive counts are all parsed
 * facts. Anything the parser cannot read is reported as `unsupported` so the
 * caller can degrade that row to `unknown` rather than emit a partial guess.
 */
import type { ScanContext } from './detector';

export type EcosystemKey = 'js' | 'py' | 'go' | 'rust' | 'java' | 'ruby' | 'php';

export type DirectDep = {
  name: string;
  /** Locked version when known, else an exact manifest pin, else null (unresolved). */
  version: string | null;
  /** The raw manifest spec (range/operator preserved). */
  spec: string;
  scope: 'prod' | 'dev';
  ecosystem: EcosystemKey;
};

export type LockfileInfo = {
  path: string;
  ecosystem: EcosystemKey;
  /** Total packages recorded (transitive total). */
  packages: number;
  /** Registry integrity hashes present in the lockfile. */
  integrity: boolean;
  /** Same package name recorded at more than one version. */
  duplicates: Array<{ name: string; versions: string[] }>;
};

export type DependencyScan = {
  /** Number of dependency manifests parsed (or attempted). */
  manifests: number;
  direct: DirectDep[];
  lockfiles: LockfileInfo[];
  /** Ecosystem conventions present in the tree but not parseable by this build. */
  unsupported: string[];
  /** `${ecosystem}:${name}` -> locked version */
  locked: Map<string, string>;
  /** Transitive total across lockfiles (minus the root). */
  transitiveTotal: number;
};

type Racer = Pick<ScanContext, 'readFile' | 'manifests' | 'clonePath'>;

async function readText(ctx: Racer, path: string): Promise<string | null> {
  try {
    const buf = await ctx.readFile(path);
    return buf ? buf.toString('utf8') : null;
  } catch {
    return null;
  }
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Return the exact version a manifest spec pins to, else null (ranges are not resolutions). */
export function exactVersion(spec: string): string | null {
  const s = spec.trim().replace(/^[\^~=<>!]*\s*/, '').replace(/^v/, '');
  const m = /^(\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)\s*$/.exec(s);
  return m ? m[1] : null;
}

function nameOf(key: string): string {
  const marker = 'node_modules/';
  const i = key.lastIndexOf(marker);
  if (i >= 0) return key.slice(i + marker.length);
  return key;
}

// --- per-ecosystem lockfile parsers -----------------------------------------

type ParsedLock = { packages: number; versions: Map<string, string>; integrity: boolean };

function parseNpmLock(text: string): ParsedLock | null {
  const j = parseJson(text);
  if (!j) return null;
  const versions = new Map<string, string>();
  let integrity = false;
  let packages = 0;
  const pkgs = (j.packages ?? null) as Record<string, { version?: string; integrity?: string }> | null;
  if (pkgs) {
    for (const [k, v] of Object.entries(pkgs)) {
      if (k === '') continue;
      const name = nameOf(k);
      if (!name || typeof v?.version !== 'string') continue;
      packages++;
      versions.set(name, v.version);
      if (typeof v.integrity === 'string' && v.integrity) integrity = true;
    }
  }
  const deps = (j.dependencies ?? null) as Record<string, { version?: string }> | null;
  if (deps && packages === 0) {
    for (const [name, v] of Object.entries(deps)) {
      if (typeof v?.version !== 'string') continue;
      packages++;
      versions.set(name, v.version);
    }
  }
  return { packages, versions, integrity };
}

function parseYarnLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  let packages = 0;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    if (!header || /^\s/.test(header) || !header.trimEnd().endsWith(':')) continue;
    let version: string | null = null;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const m = /^\s+version\s+"?([^"\s]+)"?/.exec(lines[j]);
      if (m) { version = m[1]; break; }
      if (!/^\s/.test(lines[j]) && lines[j].trim()) break;
    }
    if (!version) continue;
    const specs = header.trimEnd().replace(/:$/, '').split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    for (const spec of specs) {
      const at = spec.lastIndexOf('@');
      const name = at > 0 ? spec.slice(0, at) : spec;
      if (name) versions.set(name, version);
    }
    packages++;
  }
  return { packages, versions, integrity: /integrity\s/.test(text) };
}

function parsePnpmLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  let packages = 0;
  for (const line of text.split('\n')) {
    const m = /^\s{2,}\/?(@?[^@\s/][^@\s]*?)@([^:()\s]+):\s*$/.exec(line);
    if (!m) continue;
    packages++;
    if (!versions.has(m[1])) versions.set(m[1], m[2]);
  }
  return { packages, versions, integrity: /integrity:|resolution:/.test(text) };
}

function parsePoetryOrCargoLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  let packages = 0;
  let name: string | null = null;
  for (const line of text.split('\n')) {
    if (line.trim() === '[[package]]') { name = null; continue; }
    const nm = /^\s*name\s*=\s*"([^"]+)"/.exec(line);
    if (nm) { name = nm[1]; continue; }
    const vm = /^\s*version\s*=\s*"([^"]+)"/.exec(line);
    if (vm && name) { packages++; versions.set(name, vm[1]); name = null; }
  }
  return { packages, versions, integrity: /checksum\s*=|integrity=/.test(text) };
}

function parseGoSum(text: string): ParsedLock {
  const versions = new Map<string, string>();
  let packages = 0;
  for (const line of text.split('\n')) {
    const m = /^(\S+)\s+(v\S+?)(?:\/go\.mod)?\s+h1:/.exec(line.trim());
    if (!m) continue;
    packages++;
    if (!versions.has(m[1])) versions.set(m[1], m[2]);
  }
  return { packages, versions, integrity: text.includes('h1:') };
}

function parseGradleLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  let packages = 0;
  for (const line of text.split('\n')) {
    const m = /^([^=#\s]+:[^=#:\s]+):([^=\s]+)=/.exec(line.trim());
    if (!m) continue;
    packages++;
    versions.set(`${m[1]}`, m[2]);
  }
  return { packages, versions, integrity: false };
}

function parseGemLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  let packages = 0;
  let inSpecs = false;
  for (const line of text.split('\n')) {
    if (/^specs:/.test(line)) { inSpecs = true; continue; }
    if (/^\S/.test(line) && !/^specs:/.test(line)) { if (line.trim()) inSpecs = false; continue; }
    if (!inSpecs) continue;
    const m = /^ {4}([^\s(]+) \(([^)]+)\)$/.exec(line);
    if (!m) continue;
    packages++;
    versions.set(m[1], m[2]);
  }
  return { packages, versions, integrity: /checksum|remote:/.test(text) };
}

function parseComposerLock(text: string): ParsedLock | null {
  const j = parseJson(text);
  if (!j) return null;
  const versions = new Map<string, string>();
  let packages = 0;
  for (const key of ['packages', 'packages-dev']) {
    const arr = j[key];
    if (!Array.isArray(arr)) continue;
    for (const p of arr as Array<{ name?: string; version?: string; dist?: { shasum?: string } }>) {
      if (!p?.name || !p?.version) continue;
      packages++;
      versions.set(p.name, p.version);
    }
  }
  return { packages, versions, integrity: text.includes('"shasum"') || text.includes('"reference"') };
}

// --- per-ecosystem manifest parsers -----------------------------------------

type ParsedManifest = { direct: DirectDep[] };

function parseNpmManifest(eco: EcosystemKey, text: string): ParsedManifest | null {
  const j = parseJson(text);
  if (!j) return null;
  const direct: DirectDep[] = [];
  for (const [scope, field] of [['prod', 'dependencies'], ['dev', 'devDependencies'], ['dev', 'peerDependencies']] as const) {
    const deps = j[field];
    if (!deps || typeof deps !== 'object') continue;
    for (const [name, spec] of Object.entries(deps as Record<string, string>)) direct.push({ name, spec: String(spec), version: null, scope, ecosystem: eco });
  }
  return { direct };
}

function parseRequirementsTxt(eco: EcosystemKey, text: string, scope: 'prod' | 'dev'): ParsedManifest {
  const direct: DirectDep[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('-')) continue;
    const m = /^([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*([=<>!~].*)?$/.exec(line);
    if (!m) continue;
    direct.push({ name: m[1], spec: (m[2] ?? '').trim(), version: null, scope, ecosystem: eco });
  }
  return { direct };
}

function parsePyproject(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  const block = /dependencies\s*=\s*\[([\s\S]*?)\]/.exec(text);
  if (block) {
    for (const q of block[1].matchAll(/["']([^"']+)["']/g)) {
      const spec = q[1];
      const m = /^([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*([=<>!~].*)?$/.exec(spec.trim());
      if (m) direct.push({ name: m[1], spec: (m[2] ?? '').trim(), version: null, scope: 'prod', ecosystem: eco });
    }
  }
  return { direct };
}

function parseGoMod(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  const reqBlocks = text.match(/require\s*\(([\s\S]*?)\)/g) ?? [];
  const singles = text.match(/^require\s+(\S+)\s+(\S+)/gm) ?? [];
  for (const b of reqBlocks) {
    for (const line of b.split('\n')) {
      const m = /^\s*([^\s/][^\s]*?)\s+(v[^\s]+)/.exec(line);
      if (m && !line.includes('// indirect')) direct.push({ name: m[1], spec: m[2], version: null, scope: 'prod', ecosystem: eco });
    }
  }
  for (const s of singles) {
    const m = /^require\s+(\S+)\s+(\S+)/.exec(s);
    if (m) direct.push({ name: m[1], spec: m[2], version: null, scope: 'prod', ecosystem: eco });
  }
  return { direct };
}

function parseCargoToml(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  let section = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const h = /^\[([^\]]+)\]/.exec(line);
    if (h) { section = h[1].trim(); continue; }
    if (section !== 'dependencies' && section !== 'dev-dependencies') continue;
    const m = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line);
    if (!m) continue;
    const value = m[2];
    const spec = /^["']/.test(value) ? value.replace(/["']/g, '').trim() : (/version\s*=\s*["']([^"']+)["']/.exec(value)?.[1] ?? '');
    direct.push({ name: m[1], spec, version: null, scope: section === 'dependencies' ? 'prod' : 'dev', ecosystem: eco });
  }
  return { direct };
}

function parsePomXml(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  for (const block of text.match(/<dependency>[\s\S]*?<\/dependency>/g) ?? []) {
    const g = /<groupId>\s*([^<\s]+)\s*<\/groupId>/.exec(block)?.[1];
    const a = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(block)?.[1];
    const v = /<version>\s*([^<\s]+)\s*<\/version>/.exec(block)?.[1];
    if (a) direct.push({ name: g ? `${g}:${a}` : a, spec: v ?? '', version: null, scope: 'prod', ecosystem: eco });
  }
  return { direct };
}

function parseGemfile(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  for (const raw of text.split('\n')) {
    const m = /^\s*gem\s+["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?/.exec(raw);
    if (!m) continue;
    const spec = m[2] ?? '';
    direct.push({ name: m[1], spec, version: null, scope: /group\s*:?test|:development/.test(raw) ? 'dev' : 'prod', ecosystem: eco });
  }
  return { direct };
}

function parseComposerJson(eco: EcosystemKey, text: string): ParsedManifest | null {
  const j = parseJson(text);
  if (!j) return null;
  const direct: DirectDep[] = [];
  for (const [scope, field] of [['prod', 'require'], ['dev', 'require-dev']] as const) {
    const deps = j[field];
    if (!deps || typeof deps !== 'object') continue;
    for (const [name, spec] of Object.entries(deps as Record<string, string>)) {
      if (name === 'php' || name.startsWith('ext-')) continue;
      direct.push({ name, spec: String(spec), version: null, scope, ecosystem: eco });
    }
  }
  return { direct };
}

const LOCKFILES: Record<string, (text: string) => ParsedLock | null> = {
  'package-lock.json': parseNpmLock,
  'npm-shrinkwrap.json': parseNpmLock,
  'yarn.lock': parseYarnLock,
  'pnpm-lock.yaml': parsePnpmLock,
  'poetry.lock': parsePoetryOrCargoLock,
  'uv.lock': parsePoetryOrCargoLock,
  'Cargo.lock': parsePoetryOrCargoLock,
  'go.sum': parseGoSum,
  'gradle.lockfile': parseGradleLock,
  'Gemfile.lock': parseGemLock,
  'composer.lock': parseComposerLock,
  'packages.lock.json': parseNpmLock,
};

function ecosystemOf(eco: string): EcosystemKey | null {
  const e = eco.toLowerCase();
  if (['js', 'py', 'go', 'rust', 'java', 'ruby', 'php'].includes(e)) return e as EcosystemKey;
  return null;
}

/** Parse every sniffed manifest + its lockfile. Pure over the provided readFile. */
export async function scanDependencies(ctx: Racer): Promise<DependencyScan> {
  const direct: DirectDep[] = [];
  const lockfiles: LockfileInfo[] = [];
  const locked = new Map<string, string>();
  const unsupported = new Set<string>();
  const seenManifest = new Set<string>();
  let manifests = 0;

  for (const m of ctx.manifests) {
    const eco = ecosystemOf(String(m.ecosystem));
    if (!eco) { unsupported.add(String(m.ecosystem)); continue; }
    const prefix = m.root && m.root !== '.' ? `${m.root}/` : '';
    const manifestPath = `${prefix}${m.manifest}`;
    const lockPath = `${prefix}${m.lockfile}`;
    if (seenManifest.has(manifestPath)) continue;
    seenManifest.add(manifestPath);

    const mText = await readText(ctx, manifestPath);
    if (mText == null) continue;
    manifests++;

    let parsed: ParsedManifest | null = null;
    if (eco === 'js') parsed = parseNpmManifest(eco, mText);
    else if (eco === 'py') {
      if (m.manifest.endsWith('.toml')) parsed = parsePyproject(eco, mText);
      else parsed = parseRequirementsTxt(eco, mText, /dev|test/.test(m.manifest) ? 'dev' : 'prod');
      // requirements-dev.txt etc.
      const devText = await readText(ctx, `${prefix}requirements-dev.txt`);
      if (devText) parsed.direct.push(...parseRequirementsTxt(eco, devText, 'dev').direct);
    } else if (eco === 'go') parsed = parseGoMod(eco, mText);
    else if (eco === 'rust') parsed = parseCargoToml(eco, mText);
    else if (eco === 'java') parsed = parsePomXml(eco, mText);
    else if (eco === 'ruby') parsed = parseGemfile(eco, mText);
    else if (eco === 'php') parsed = parseComposerJson(eco, mText);
    if (!parsed) { unsupported.add(eco); continue; }

    // lockfile
    const lText = await readText(ctx, lockPath);
    if (lText != null && LOCKFILES[m.lockfile]) {
      const pl = LOCKFILES[m.lockfile](lText);
      if (pl) {
        const byName = new Map<string, Set<string>>();
        for (const [name, ver] of pl.versions) {
          locked.set(`${eco}:${name}`, ver);
          if (!byName.has(name)) byName.set(name, new Set());
          byName.get(name)!.add(ver);
        }
        const duplicates = [...byName.entries()].filter(([, s]) => s.size > 1).map(([name, s]) => ({ name, versions: [...s].sort() }));
        lockfiles.push({ path: lockPath, ecosystem: eco, packages: pl.packages, integrity: pl.integrity, duplicates });
      } else {
        unsupported.add(`${eco}:${m.lockfile}`);
      }
    } else if (lText != null && !LOCKFILES[m.lockfile]) {
      unsupported.add(`${eco}:${m.lockfile}`);
    }

    for (const d of parsed.direct) {
      const lock = locked.get(`${eco}:${d.name}`) ?? null;
      direct.push({ ...d, version: lock ?? exactVersion(d.spec) });
    }
  }

  const transitiveTotal = lockfiles.reduce((a, l) => a + l.packages, 0);
  return { manifests, direct, lockfiles, unsupported: [...unsupported].sort(), locked, transitiveTotal };
}

/** Deduplicate direct deps by ecosystem+name (prod wins over dev). */
export function uniqueDirect(deps: DirectDep[], scope?: 'prod' | 'dev'): DirectDep[] {
  const byKey = new Map<string, DirectDep>();
  for (const d of deps) {
    if (scope && d.scope !== scope) continue;
    const key = `${d.ecosystem}:${d.name}`;
    const existing = byKey.get(key);
    if (!existing || (existing.scope === 'dev' && d.scope === 'prod')) byKey.set(key, d);
  }
  return [...byKey.values()].sort((a, b) => `${a.ecosystem}:${a.name}`.localeCompare(`${b.ecosystem}:${b.name}`));
}

export function majorOf(version: string | null): number | null {
  if (!version) return null;
  const m = /(\d+)/.exec(version.replace(/^v/, ''));
  return m ? Number(m[1]) : null;
}

/** Percentage of direct deps with an exact pin (ECOS-07 pin ratio). */
export function pinRatio(deps: DirectDep[]): number {
  const pinned = deps.filter((d) => exactVersion(d.spec) != null || d.version != null).length;
  return deps.length ? Math.round((pinned / deps.length) * 1000) / 10 : 0;
}

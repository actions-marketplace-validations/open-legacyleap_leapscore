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
import { isReadBudgetError } from './budget';

export type EcosystemKey = 'js' | 'py' | 'go' | 'rust' | 'java' | 'ruby' | 'php' | 'csharp';

export type DirectDep = {
  name: string;
  /** Locked version when known, else an exact manifest pin, else null (unresolved). */
  version: string | null;
  /** The raw manifest spec (range/operator preserved). */
  spec: string;
  scope: 'prod' | 'dev';
  ecosystem: EcosystemKey;
  /** Manifest file that declares this dependency (detector-honesty evidence rule). */
  file?: string;
  /** File that supplied the resolved version when it differs from `file`
   * (e.g. an in-repo parent POM or dependencyManagement block). */
  version_source?: string;
};

export type LockfileInfo = {
  path: string;
  ecosystem: EcosystemKey;
  /** Total packages recorded (transitive total). */
  packages: number;
  /** Registry integrity hashes present in the lockfile. */
  integrity: boolean;
  /** Every version recorded per package name (each list sorted) — duplicate
   * versions are derived from this across all lockfiles (legacy-stacks 4.3). */
  versions: Record<string, string[]>;
};

export type DependencyScan = {
  /** Number of dependency manifests read (or attempted). */
  manifests: number;
  /** Manifest entries considered (deduped by path) — the read-coverage
   * denominator for `manifests`. */
  manifestsTotal: number;
  /** True when a read failed on the harness byte budget before the manifest
   * surface was covered (`QuotaExceededError` from the partitioned readers).
   * The parsed set is then a deterministic prefix, not a gradeable surface:
   * consumers disclose it and emit `unknown` rather than a partial verdict
   * (legacy-stacks 8.1). */
  readBudgetExhausted: boolean;
  direct: DirectDep[];
  lockfiles: LockfileInfo[];
  /** Ecosystem conventions present in the tree but not parseable by this build. */
  unsupported: string[];
  /** `${ecosystem}:${manifest}` for manifests whose ecosystem has no lockfile
   * mechanism at all (Maven poms, classic NuGet packages.config) — absence of a
   * lockfile is structural for these, not a coverage gap (legacy-stacks 4.2). */
  noLockfileMechanism: string[];
  /** `${ecosystem}:${name}` -> locked version */
  locked: Map<string, string>;
  /** Transitive total across lockfiles (minus the root). */
  transitiveTotal: number;
};

type Racer = Pick<ScanContext, 'readFile' | 'manifests' | 'clonePath'>;

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
  // Accepts dotted qualifiers (Maven's `4.3.30.RELEASE`) as exact; ranges and
  // operators (`[1.0,2.0)`, `1.x`) still never resolve.
  const m = /^(\d+\.\d+(?:\.\d+)?(?:[.\-+][0-9A-Za-z][0-9A-Za-z.+-]*)?)\s*$/.exec(s);
  return m ? m[1] : null;
}

function nameOf(key: string): string {
  const marker = 'node_modules/';
  const i = key.lastIndexOf(marker);
  if (i >= 0) return key.slice(i + marker.length);
  return key;
}

// --- per-ecosystem lockfile parsers -----------------------------------------

type ParsedLock = {
  packages: number;
  /** name -> resolved version (first or last seen per the parser's rule). */
  versions: Map<string, string>;
  /** name -> every version the lockfile records at that name (duplicate
   * detection; legacy-stacks 4.3). */
  versionSets: Map<string, Set<string>>;
  integrity: boolean;
};

/** Record one parsed lock entry: `mode` fixes the resolution pick (first/last
 * seen wins); every version seen lands in `versionSets` so duplicate versions
 * stay visible even when the resolution collapses to one (legacy-stacks 4.3). */
function recordVersion(
  versions: Map<string, string>,
  versionSets: Map<string, Set<string>>,
  name: string,
  version: string,
  mode: 'first' | 'last' = 'last',
): void {
  if (mode === 'last' || !versions.has(name)) versions.set(name, version);
  const set = versionSets.get(name) ?? new Set<string>();
  set.add(version);
  versionSets.set(name, set);
}

function parseNpmLock(text: string): ParsedLock | null {
  const j = parseJson(text);
  if (!j) return null;
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let integrity = false;
  let packages = 0;
  const pkgs = (j.packages ?? null) as Record<string, { version?: string; integrity?: string }> | null;
  if (pkgs) {
    for (const [k, v] of Object.entries(pkgs)) {
      if (k === '') continue;
      const name = nameOf(k);
      if (!name || typeof v?.version !== 'string') continue;
      packages++;
      recordVersion(versions, versionSets, name, v.version);
      if (typeof v.integrity === 'string' && v.integrity) integrity = true;
    }
  }
  const deps = (j.dependencies ?? null) as Record<string, { version?: string }> | null;
  if (deps && packages === 0) {
    for (const [name, v] of Object.entries(deps)) {
      if (typeof v?.version !== 'string') continue;
      packages++;
      recordVersion(versions, versionSets, name, v.version);
    }
  }
  return { packages, versions, versionSets, integrity };
}

function parseYarnLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
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
      if (name) recordVersion(versions, versionSets, name, version);
    }
    packages++;
  }
  return { packages, versions, versionSets, integrity: /integrity\s/.test(text) };
}

function parsePnpmLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let packages = 0;
  for (const line of text.split('\n')) {
    const m = /^\s{2,}\/?(@?[^@\s/][^@\s]*?)@([^:()\s]+):\s*$/.exec(line);
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, m[1], m[2], 'first');
  }
  return { packages, versions, versionSets, integrity: /integrity:|resolution:/.test(text) };
}

function parsePoetryOrCargoLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let packages = 0;
  let name: string | null = null;
  for (const line of text.split('\n')) {
    if (line.trim() === '[[package]]') { name = null; continue; }
    const nm = /^\s*name\s*=\s*"([^"]+)"/.exec(line);
    if (nm) { name = nm[1]; continue; }
    const vm = /^\s*version\s*=\s*"([^"]+)"/.exec(line);
    if (vm && name) { packages++; recordVersion(versions, versionSets, name, vm[1]); name = null; }
  }
  return { packages, versions, versionSets, integrity: /checksum\s*=|integrity=/.test(text) };
}

function parseGoSum(text: string): ParsedLock {
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let packages = 0;
  for (const line of text.split('\n')) {
    const m = /^(\S+)\s+(v\S+?)(?:\/go\.mod)?\s+h1:/.exec(line.trim());
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, m[1], m[2], 'first');
  }
  return { packages, versions, versionSets, integrity: text.includes('h1:') };
}

function parseGradleLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let packages = 0;
  for (const line of text.split('\n')) {
    const m = /^([^=#\s]+:[^=#:\s]+):([^=\s]+)=/.exec(line.trim());
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, `${m[1]}`, m[2]);
  }
  return { packages, versions, versionSets, integrity: false };
}

function parseGemLock(text: string): ParsedLock {
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let packages = 0;
  let inSpecs = false;
  for (const line of text.split('\n')) {
    if (/^specs:/.test(line)) { inSpecs = true; continue; }
    if (/^\S/.test(line) && !/^specs:/.test(line)) { if (line.trim()) inSpecs = false; continue; }
    if (!inSpecs) continue;
    const m = /^ {4}([^\s(]+) \(([^)]+)\)$/.exec(line);
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, m[1], m[2]);
  }
  return { packages, versions, versionSets, integrity: /checksum|remote:/.test(text) };
}

function parseComposerLock(text: string): ParsedLock | null {
  const j = parseJson(text);
  if (!j) return null;
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  let packages = 0;
  for (const key of ['packages', 'packages-dev']) {
    const arr = j[key];
    if (!Array.isArray(arr)) continue;
    for (const p of arr as Array<{ name?: string; version?: string; dist?: { shasum?: string } }>) {
      if (!p?.name || !p?.version) continue;
      packages++;
      recordVersion(versions, versionSets, p.name, p.version);
    }
  }
  return { packages, versions, versionSets, integrity: text.includes('"shasum"') || text.includes('"reference"') };
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

// --- Maven (legacy Java fidelity — legacy-stacks 2.3) ------------------------

type PomData = {
  groupId: string | null;
  artifactId: string | null;
  version: string | null;
  properties: Record<string, string>;
  dependencyManagement: Map<string, string>;
  dependencies: Array<{ name: string; version: string | null; scope: string | null }>;
  parent: { relativePath: string | null } | null;
};

function tagText(text: string, tag: string): string | null {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(text);
  return m ? m[1] : null;
}

function parsePomData(text: string): PomData {
  const properties: Record<string, string> = {};
  const propsBlock = tagText(text, 'properties');
  if (propsBlock) {
    for (const m of propsBlock.matchAll(/<([A-Za-z0-9_.-]+)\s*>\s*([^<]*?)\s*<\/\1>/g)) {
      properties[m[1]] = m[2];
    }
  }

  const parentBlock = tagText(text, 'parent');
  let parent: PomData['parent'] = null;
  if (parentBlock) {
    const rp = tagText(parentBlock, 'relativePath');
    // Tag absent → default ../pom.xml; `<relativePath/>` → '' (repository-only, no local file).
    parent = { relativePath: rp != null ? rp.trim() : null };
  }

  // Project coordinates live outside parent/dependencyManagement/dependencies blocks.
  const coordText = text
    .replace(/<parent>[\s\S]*?<\/parent>/g, '')
    .replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, '')
    .replace(/<dependencies>[\s\S]*?<\/dependencies>/g, '');
  const groupId = tagText(coordText, 'groupId')?.trim() ?? null;
  const artifactId = tagText(coordText, 'artifactId')?.trim() ?? null;
  const version = tagText(coordText, 'version')?.trim() ?? null;

  const dm = new Map<string, string>();
  const dmBlock = tagText(text, 'dependencyManagement');
  if (dmBlock) {
    for (const block of dmBlock.match(/<dependency>[\s\S]*?<\/dependency>/g) ?? []) {
      const g = /<groupId>\s*([^<\s]+)\s*<\/groupId>/.exec(block)?.[1];
      const a = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(block)?.[1];
      const v = /<version>\s*([^<\s]+)\s*<\/version>/.exec(block)?.[1];
      if (a && v) dm.set(g ? `${g}:${a}` : a, v);
    }
  }

  // Direct deps: top-level `<dependencies>` only — profiles/build blocks are
  // not part of the production surface this row measures.
  const directText = text
    .replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, '')
    .replace(/<build>[\s\S]*?<\/build>/g, '')
    .replace(/<profiles>[\s\S]*?<\/profiles>/g, '');
  const dependencies: PomData['dependencies'] = [];
  for (const block of directText.match(/<dependency>[\s\S]*?<\/dependency>/g) ?? []) {
    const g = /<groupId>\s*([^<\s]+)\s*<\/groupId>/.exec(block)?.[1];
    const a = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(block)?.[1];
    const v = /<version>\s*([^<\s]+)\s*<\/version>/.exec(block)?.[1];
    const scope = /<scope>\s*([^<\s]+)\s*<\/scope>/.exec(block)?.[1] ?? null;
    if (a) dependencies.push({ name: g ? `${g}:${a}` : a, version: v ?? null, scope });
  }

  return { groupId, artifactId, version, properties, dependencyManagement: dm, dependencies, parent };
}

function interpolate(value: string, props: Record<string, string>): string {
  return value.replace(/\$\{([^}]+)\}/g, (raw, key: string) => props[key] ?? raw);
}

function pathDir(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? '' : p.slice(0, i);
}

/** Resolve baseDir/rel into a canonical repo-relative path, or null when it
 * escapes the scanned tree (a parent above the root is not readable). */
function normalizeRel(baseDir: string, rel: string): string | null {
  const parts = (baseDir ? `${baseDir}/${rel}` : rel).split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (out.length === 0) return null;
      out.pop();
      continue;
    }
    out.push(part);
  }
  return out.length ? out.join('/') : null;
}

type PomChain = {
  props: Record<string, string>;
  /** dependencyManagement name → {version, source file} (child DM wins over parent). */
  dm: Map<string, { version: string; source: string }>;
  projectVersion: string | null;
};

const MAX_PARENT_DEPTH = 6;

async function loadPomChain(
  startText: string,
  startPath: string,
  loadPom?: (repoRelPath: string) => Promise<string | null>,
): Promise<PomChain> {
  const chain: Array<{ path: string; data: PomData }> = [{ path: startPath, data: parsePomData(startText) }];
  const seen = new Set<string>([startPath]);
  let current = chain[0];
  while (loadPom && chain.length < MAX_PARENT_DEPTH) {
    const parent = current.data.parent;
    if (!parent) break;
    const rel = parent.relativePath ?? '../pom.xml';
    if (rel === '') break; // `<relativePath/>` — resolve from the repository, not the tree
    const target = normalizeRel(pathDir(current.path), rel);
    if (!target || seen.has(target)) break;
    const text = await loadPom(target);
    if (text == null) break;
    seen.add(target);
    current = { path: target, data: parsePomData(text) };
    chain.push(current);
  }

  const props: Record<string, string> = {};
  for (let i = chain.length - 1; i >= 0; i--) Object.assign(props, chain[i].data.properties);
  const dm = new Map<string, { version: string; source: string }>();
  for (let i = chain.length - 1; i >= 0; i--) {
    for (const [k, v] of chain[i].data.dependencyManagement) dm.set(k, { version: v, source: chain[i].path });
  }
  // Inherited project coordinates (child omits them → nearest ancestor supplies).
  const holder = chain.find((c) => c.data.version)?.data ?? chain[0].data;
  const projectVersion = holder.version;
  if (projectVersion) {
    props['project.version'] ??= projectVersion;
    props['pom.version'] ??= projectVersion;
  }
  if (holder.groupId) props['project.groupId'] ??= holder.groupId;
  if (holder.artifactId) props['project.artifactId'] ??= holder.artifactId;

  return { props, dm, projectVersion };
}

/** Maven pom parsing with `${property}` interpolation, in-repo parent chains and
 * `dependencyManagement` lookup; `test`/`provided` scopes leave the prod set and
 * an unresolvable version stays unresolved (legacy-stacks 2.3). */
async function parsePomXml(
  eco: EcosystemKey,
  text: string,
  opts: { manifestPath?: string; loadPom?: (repoRelPath: string) => Promise<string | null> } = {},
): Promise<ParsedManifest> {
  const manifestPath = opts.manifestPath ?? 'pom.xml';
  const { props, dm } = await loadPomChain(text, manifestPath, opts.loadPom);
  const own = parsePomData(text);
  const direct: DirectDep[] = [];

  for (const dep of own.dependencies) {
    let spec = '';
    let versionSource: string | undefined;
    if (dep.version) {
      spec = interpolate(dep.version, props).trim();
    } else {
      const inherited = dm.get(dep.name);
      if (inherited) {
        spec = interpolate(inherited.version, props).trim();
        versionSource = inherited.source;
      }
    }
    direct.push({
      name: dep.name,
      spec,
      version: null,
      scope: dep.scope === 'test' || dep.scope === 'provided' ? 'dev' : 'prod',
      ecosystem: eco,
      ...(versionSource && versionSource !== manifestPath ? { version_source: versionSource } : {}),
    });
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

// --- NuGet (.NET/VB.NET) -----------------------------------------------------

/** XML attribute value (single or double quoted) inside a matched tag body. */
function attrOf(attrs: string, name: string): string | null {
  const rx = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const m = rx.exec(attrs);
  return m ? (m[1] ?? m[2] ?? '').trim() : null;
}

/** Classic NuGet `packages.config`: `<package id="X" version="9.0.1" …/>` —
 * exact versions, production scope (legacy-stacks 2.1). */
function parsePackagesConfig(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  for (const m of text.matchAll(/<package\b([^>]*?)\/?>/gi)) {
    const id = attrOf(m[1], 'id');
    if (!id) continue;
    const version = attrOf(m[1], 'version');
    direct.push({ name: id, spec: version ?? '', version: null, scope: 'prod', ecosystem: eco });
  }
  return { direct };
}

/** `PackageReference` items in `.csproj`/`.vbproj` — attribute form
 * (`Include= Version=`) and child-element form (legacy-stacks 2.1).
 * `Update`-only items declare no new dependency and are skipped; a version the
 * tree cannot resolve (`$(…)`/`${…}` properties) stays an unresolved spec. */
function parseCsproj(eco: EcosystemKey, text: string): ParsedManifest {
  const direct: DirectDep[] = [];
  for (const m of text.matchAll(/<PackageReference\b([^>]*?)(?:\/>|>([\s\S]*?)<\/PackageReference>)/gi)) {
    const name = attrOf(m[1] ?? '', 'include');
    if (!name) continue;
    const version = attrOf(m[1] ?? '', 'version') ?? (/<Version>\s*([^<\s]+)\s*<\/Version>/i.exec(m[2] ?? '')?.[1] ?? null);
    direct.push({ name, spec: version ?? '', version: null, scope: 'prod', ecosystem: eco });
  }
  return { direct };
}

/** Non-package .NET anchors (`.sln`, `global.json`, `Directory.Packages.props`):
 * recognition evidence that declares no packages of its own. */
function parseDotnetAnchor(): ParsedManifest {
  return { direct: [] };
}

export type NuGetLockParse = ParsedLock & {
  /** Packages the lock marks as direct (the rest are transitive). */
  direct: Map<string, string>;
};

/** NuGet `packages.lock.json` (legacy-stacks 2.2 / design D9): entries are
 * keyed `<tfm>.<Package> → { type: Direct|Transitive|Project, resolved }`.
 * npm-shaped JSON has no `resolved` entries and is rejected (`null`), never
 * interpreted as an npm lock file. */
export function parseNuGetLock(text: string): NuGetLockParse | null {
  const j = parseJson(text);
  if (!j) return null;
  const deps = j.dependencies;
  if (!deps || typeof deps !== 'object') return null;
  const versions = new Map<string, string>();
  const versionSets = new Map<string, Set<string>>();
  const directMap = new Map<string, string>();
  let packages = 0;
  let integrity = false;
  for (const [tfm, bucket] of Object.entries(deps as Record<string, unknown>)) {
    if (!bucket || typeof bucket !== 'object') continue;
    void tfm;
    for (const [name, entry] of Object.entries(bucket as Record<string, unknown>)) {
      const e = entry as { type?: string; resolved?: string; contentHash?: string } | null;
      if (!e || typeof e.resolved !== 'string' || !e.resolved) continue;
      packages++;
      recordVersion(versions, versionSets, name, e.resolved);
      if (e.type === 'Direct') directMap.set(name, e.resolved);
      if (typeof e.contentHash === 'string' && e.contentHash) integrity = true;
    }
  }
  if (packages === 0) return null;
  return { packages, versions, versionSets, integrity, direct: directMap };
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
  'packages.lock.json': parseNuGetLock,
};

function ecosystemOf(eco: string): EcosystemKey | null {
  const e = eco.toLowerCase();
  if (['js', 'py', 'go', 'rust', 'java', 'ruby', 'php', 'csharp'].includes(e)) return e as EcosystemKey;
  return null;
}

/** Parse every sniffed manifest + its lockfile. Pure over the provided readFile.
 * Read coverage is tracked (legacy-stacks 8.1): if the harness byte budget ends
 * before the manifest surface is covered, `readBudgetExhausted` is set and the
 * partial set is disclosed by consumers — never graded as a whole-tree fact. */
export async function scanDependencies(ctx: Racer): Promise<DependencyScan> {
  const direct: DirectDep[] = [];
  const lockfiles: LockfileInfo[] = [];
  const locked = new Map<string, string>();
  const unsupported = new Set<string>();
  const noLockfileMechanism = new Set<string>();
  const seenManifest = new Set<string>();
  let manifests = 0;
  let readBudgetExhausted = false;

  /** Read through the byte-budgeted reader with truncation tracking: once the
   * cap is hit every later read fails identically, so reading stops and the
   * scan flags itself instead of silently skipping the rest of the tree. */
  const trackedRead = async (path: string): Promise<string | null> => {
    if (readBudgetExhausted) return null;
    try {
      const buf = await ctx.readFile(path);
      return buf ? buf.toString('utf8') : null;
    } catch (e) {
      if (isReadBudgetError(e)) readBudgetExhausted = true;
      return null;
    }
  };

  // Dedupe by path up front so read coverage has a fixed denominator.
  const entries: Array<{ eco: EcosystemKey; manifest: string; lockfile: string; manifestPath: string; lockPath: string; prefix: string }> = [];
  for (const m of ctx.manifests) {
    const eco = ecosystemOf(String(m.ecosystem));
    if (!eco) { unsupported.add(String(m.ecosystem)); continue; }
    const prefix = m.root && m.root !== '.' ? `${m.root}/` : '';
    const manifestPath = `${prefix}${m.manifest}`;
    if (seenManifest.has(manifestPath)) continue;
    seenManifest.add(manifestPath);
    entries.push({ eco, manifest: m.manifest, lockfile: m.lockfile, manifestPath, lockPath: `${prefix}${m.lockfile}`, prefix });
  }
  const manifestsTotal = entries.length;

  for (const e of entries) {
    const { eco, manifestPath, lockPath, prefix } = e;
    const mText = await trackedRead(manifestPath);
    if (mText == null) continue;
    manifests++;

    let parsed: ParsedManifest | null = null;
    if (eco === 'js') parsed = parseNpmManifest(eco, mText);
    else if (eco === 'py') {
      if (e.manifest.endsWith('.toml')) parsed = parsePyproject(eco, mText);
      else parsed = parseRequirementsTxt(eco, mText, /dev|test/.test(e.manifest) ? 'dev' : 'prod');
      // requirements-dev.txt etc.
      const devText = await trackedRead(`${prefix}requirements-dev.txt`);
      if (devText) parsed.direct.push(...parseRequirementsTxt(eco, devText, 'dev').direct);
    } else if (eco === 'go') parsed = parseGoMod(eco, mText);
    else if (eco === 'rust') parsed = parseCargoToml(eco, mText);
    else if (eco === 'java') {
      parsed = await parsePomXml(eco, mText, {
        manifestPath,
        loadPom: async (repoRelPath: string) => trackedRead(repoRelPath),
      });
    }
    else if (eco === 'ruby') parsed = parseGemfile(eco, mText);
    else if (eco === 'php') parsed = parseComposerJson(eco, mText);
    else if (eco === 'csharp') {
      if (/\.(csproj|vbproj)$/i.test(e.manifest)) parsed = parseCsproj(eco, mText);
      else if (/packages\.config$/i.test(e.manifest)) parsed = parsePackagesConfig(eco, mText);
      else parsed = parseDotnetAnchor(); // .sln / global.json / Directory.Packages.props
    }
    if (!parsed) { unsupported.add(eco); continue; }

    // lockfile — a self-slot manifest (no-lockfile-mechanism ecosystems) reuses
    // the text already read: the same file, never a second budgeted read.
    const lText = lockPath === manifestPath ? mText : await trackedRead(lockPath);
    if (lText != null && LOCKFILES[e.lockfile]) {
      const pl = LOCKFILES[e.lockfile](lText);
      if (pl) {
        for (const [name, ver] of pl.versions) locked.set(`${eco}:${name}`, ver);
        const versions: Record<string, string[]> = {};
        for (const [name, set] of [...pl.versionSets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
          versions[name] = [...set].sort();
        }
        lockfiles.push({ path: lockPath, ecosystem: eco, packages: pl.packages, integrity: pl.integrity, versions });
      } else {
        unsupported.add(`${eco}:${e.lockfile}`);
      }
    } else if (lText != null && !LOCKFILES[e.lockfile]) {
      // Self-slot (`lockfile === manifest`) = the ecosystem has no lockfile
      // mechanism (Maven pom.xml, classic NuGet packages.config): structural
      // absence, disclosed as such — never a parse failure (legacy-stacks 4.2).
      if (e.lockfile === e.manifest) noLockfileMechanism.add(`${eco}:${e.manifest}`);
      else unsupported.add(`${eco}:${e.lockfile}`);
    }

    for (const d of parsed.direct) {
      const lock = locked.get(`${eco}:${d.name}`) ?? null;
      direct.push({ ...d, file: d.file ?? manifestPath, version: lock ?? exactVersion(d.spec) });
    }
  }

  const transitiveTotal = lockfiles.reduce((a, l) => a + l.packages, 0);
  return { manifests, manifestsTotal, readBudgetExhausted, direct, lockfiles, unsupported: [...unsupported].sort(), noLockfileMechanism: [...noLockfileMechanism].sort(), locked, transitiveTotal };
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

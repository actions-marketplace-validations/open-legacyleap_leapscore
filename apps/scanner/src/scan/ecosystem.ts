/** engine/ecosystem.ts — path-scoped manifest sniff (05 §3, Q4)
 *
 * Two discovery models coexist (legacy-stacks D3):
 * - the classic root+1 sniff for the seven pre-existing ecosystems — unchanged,
 *   so their discovery results do not shift; and
 * - a bounded recursive .NET-family project discovery (max-depth constant,
 *   canonical sorted, build/IDE dirs skipped) that only matches
 *   `.sln`/`.csproj`/`.vbproj`/`packages.config`/`packages.lock.json`/
 *   `Directory.Packages.props`/`global.json`.
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export type Manifest = { root: string; ecosystem: string; lockfile: string; manifest: string };

const PATTERNS: Array<{ manifest: string; lockfile: string; ecosystem: string }> = [
  { manifest: 'package.json', lockfile: 'package-lock.json', ecosystem: 'js' },
  { manifest: 'package.json', lockfile: 'pnpm-lock.yaml', ecosystem: 'js' },
  { manifest: 'package.json', lockfile: 'yarn.lock', ecosystem: 'js' },
  { manifest: 'pyproject.toml', lockfile: 'poetry.lock', ecosystem: 'py' },
  { manifest: 'pyproject.toml', lockfile: 'requirements.txt', ecosystem: 'py' },
  { manifest: 'requirements.txt', lockfile: 'requirements.txt', ecosystem: 'py' },
  { manifest: 'go.mod', lockfile: 'go.sum', ecosystem: 'go' },
  { manifest: 'Cargo.toml', lockfile: 'Cargo.lock', ecosystem: 'rust' },
  { manifest: 'pom.xml', lockfile: 'pom.xml', ecosystem: 'java' },
  { manifest: 'build.gradle', lockfile: 'gradle.lockfile', ecosystem: 'java' },
  { manifest: 'Gemfile', lockfile: 'Gemfile.lock', ecosystem: 'ruby' },
  { manifest: 'composer.json', lockfile: 'composer.lock', ecosystem: 'php' },
];

/** Max repo-relative directory depth for .NET-family discovery (legacy-stacks D3;
 * open question 4-vs-6 resolved to 4 — widening is another deliberate change). */
export const MAX_DOTNET_PROJECT_DEPTH = 4;

/** Build/IDE dirs skipped by the .NET discovery walk only (the canonical walk's
 * skip set is separate; `bin`/`packages` stay walked there per D6). */
const DOTNET_DISCOVERY_SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.git', 'obj', 'target', '.vs', '__history', '__recovery']);

/** Every .NET-family file the bounded project scan found (legacy-stacks D3),
 * as repo-relative paths in canonical sorted order. */
export type DotnetDiscovery = {
  /** `.sln` solution files. */
  solutions: string[];
  /** `.csproj` / `.vbproj` project files (NuGet PackageReference manifests). */
  projects: string[];
  /** Classic NuGet `packages.config` files (exact-version dependency manifests). */
  packagesConfigs: string[];
  /** `packages.lock.json` NuGet lock files. */
  lockFiles: string[];
  /** `Directory.Packages.props` central package-management files. */
  centralProps: string[];
  /** `global.json` SDK pins. */
  globalJsons: string[];
};

function emptyDiscovery(): DotnetDiscovery {
  return { solutions: [], projects: [], packagesConfigs: [], lockFiles: [], centralProps: [], globalJsons: [] };
}

/**
 * Bounded recursive .NET-family project discovery (legacy-stacks D3): canonical
 * sorted walk, max depth `MAX_DOTNET_PROJECT_DEPTH`, build/IDE dirs skipped.
 * Purely additive — it never participates in the classic root+1 sniff.
 */
export async function discoverDotnetFiles(clonePath: string, opts: { maxDepth?: number } = {}): Promise<DotnetDiscovery> {
  const out = emptyDiscovery();
  const maxDepth = opts.maxDepth ?? MAX_DOTNET_PROJECT_DEPTH;
  async function walk(dir: string, depth: number, relBase: string): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.github') continue; // dot-dirs (.vs, .gradle, …) are never walked
      if (e.isDirectory()) {
        if (DOTNET_DISCOVERY_SKIP_DIRS.has(e.name)) continue;
        await walk(join(dir, e.name), depth + 1, relBase ? `${relBase}/${e.name}` : e.name);
        continue;
      }
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      const name = e.name.toLowerCase();
      if (name.endsWith('.sln')) out.solutions.push(rel);
      else if (name.endsWith('.csproj') || name.endsWith('.vbproj')) out.projects.push(rel);
      else if (e.name === 'packages.config') out.packagesConfigs.push(rel);
      else if (e.name === 'packages.lock.json') out.lockFiles.push(rel);
      else if (e.name === 'Directory.Packages.props') out.centralProps.push(rel);
      else if (e.name === 'global.json') out.globalJsons.push(rel);
    }
  }
  await walk(clonePath, 0, '');
  out.solutions.sort();
  out.projects.sort();
  out.packagesConfigs.sort();
  out.lockFiles.sort();
  out.centralProps.sort();
  out.globalJsons.sort();
  return out;
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i < 0 ? '.' : path.slice(0, i);
}

/** Build manifest entries from a .NET discovery result. One entry per project /
 * `packages.config`; `.sln`/`Directory.Packages.props`/`global.json` anchor stack
 * recognition only when no package manifest was found (they declare no packages). */
function dotnetManifests(discovery: DotnetDiscovery): Manifest[] {
  const out: Manifest[] = [];
  const seen = new Set<string>();
  const push = (root: string, manifest: string, lockfile: string) => {
    const key = `${root}\u0000${manifest}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ root, ecosystem: 'csharp', lockfile, manifest });
  };
  const baseNameOf = (root: string, path: string) => (root === '.' ? path : path.slice(root.length + 1));

  for (const proj of discovery.projects) {
    const root = dirOf(proj);
    push(root, baseNameOf(root, proj), 'packages.lock.json');
  }
  for (const cfg of discovery.packagesConfigs) {
    // Classic NuGet: packages.config declares exact-version direct deps but has
    // NO lockfile mechanism (no transitive graph, cannot use packages.lock.json)
    // — the self-slot records that as structural absence, Maven-style (4.2).
    push(dirOf(cfg), 'packages.config', 'packages.config');
  }
  if (out.length === 0) {
    // No package manifest anywhere — the solution / central props / SDK pin is
    // still .NET-stack evidence, so recognition survives (bounded discovery).
    for (const s of discovery.solutions) push(dirOf(s), baseNameOf(dirOf(s), s), 'packages.lock.json');
    for (const c of discovery.centralProps) push(dirOf(c), 'Directory.Packages.props', 'packages.lock.json');
    for (const g of discovery.globalJsons) push(dirOf(g), 'global.json', 'packages.lock.json');
  }
  return out;
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}

export async function sniffEcosystems(clonePath: string, opts: { readFile?: (p: string) => Promise<Buffer | null> } = {}): Promise<Manifest[]> {
  const manifests: Manifest[] = [];
  // Check at root and one-level subdirs (for monorepo)
  const roots = ['.', ...await listSubdirs(clonePath)];
  for (const root of roots) {
    const base = root === '.' ? clonePath : join(clonePath, root);
    for (const pat of PATTERNS) {
      const mPath = join(base, pat.manifest);
      const lPath = join(base, pat.lockfile);
      const hasManifest = await exists(mPath);
      const hasLock = await exists(lPath);
      // If custom readFile provided (for tests), use it
      if (opts.readFile) {
        const m = await opts.readFile(root === '.' ? pat.manifest : `${root}/${pat.manifest}`);
        const l = await opts.readFile(root === '.' ? pat.lockfile : `${root}/${pat.lockfile}`);
        if (m || l) {
          if (!manifests.find((x) => x.root === root && x.ecosystem === pat.ecosystem)) {
            manifests.push({ root, ecosystem: pat.ecosystem, lockfile: pat.lockfile, manifest: pat.manifest });
          }
        }
        continue;
      }
      if (hasManifest || hasLock) {
        if (!manifests.find((x) => x.root === root && x.ecosystem === pat.ecosystem)) {
          manifests.push({ root, ecosystem: pat.ecosystem, lockfile: pat.lockfile, manifest: pat.manifest });
        }
      }
    }
  }

  // .NET-family bounded recursive discovery (legacy-stacks 1.1 / design D3).
  // Additive and .NET-scoped: non-.NET trees yield no new entries.
  try {
    const discovery = await discoverDotnetFiles(clonePath);
    for (const m of dotnetManifests(discovery)) {
      if (!manifests.find((x) => x.root === m.root && x.manifest === m.manifest)) manifests.push(m);
    }
  } catch { /* fs unavailable — classic sniff result stands */ }

  return manifests;
}

async function listSubdirs(clonePath: string): Promise<string[]> {
  try {
    const entries = await readdir(clonePath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules').map((e) => e.name).sort();
  } catch { return []; }
}

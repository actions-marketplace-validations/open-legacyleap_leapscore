/** engine/ecosystem.ts — path-scoped manifest sniff (05 §3, Q4) */
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
  return manifests;
}

async function listSubdirs(clonePath: string): Promise<string[]> {
  try {
    const entries = await readdir(clonePath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules').map((e) => e.name);
  } catch { return []; }
}

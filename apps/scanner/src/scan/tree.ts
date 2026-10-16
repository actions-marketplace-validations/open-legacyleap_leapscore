/** apps/scanner/src/scan/tree.ts — canonical sorted file-tree walk (deterministic-scoring D1/D2) */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Sorted readdir: canonical byte-order so every consumer sees the same order on any machine. */
export async function sortedReaddir(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  entries.sort();
  return entries;
}

/** Sorted readdir with Dirents preserved (for type-filtered walks). */
export async function sortedReaddirents<T extends { name: string }>(
  list: () => Promise<T[]>,
): Promise<T[]> {
  const entries = await list();
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return entries;
}

export type SortedWalk = {
  /** All relative paths in canonical sorted order (dirs end with '/'). */
  paths: string[];
  /** Number of files (excludes dir markers) — input to computeSampleN. */
  fileCount: number;
};

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.git']);

/** Walk the target tree once in canonical sorted order. Shared by the scan seam (D1). */
export async function walkSortedTree(root: string, opts: { maxDepth?: number } = {}): Promise<SortedWalk> {
  const maxDepth = opts.maxDepth ?? 12;
  const out: string[] = [];
  async function walk(dir: string, depth: number, relBase: string): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try {
      const { readdir: rd } = await import('node:fs/promises');
      entries = await rd(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.github') continue;
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) {
        out.push(`${rel}/`);
        await walk(join(dir, e.name), depth + 1, rel);
      } else {
        out.push(rel);
      }
    }
  }
  await walk(root, 0, '');
  out.sort();
  const fileCount = out.filter((p) => !p.endsWith('/')).length;
  return { paths: out, fileCount };
}

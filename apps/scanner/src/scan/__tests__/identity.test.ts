/** report-identity 2.x — the shared identity derivation (scope rule, tree shape,
 * line ladder, determinism). */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  IDENTITY_SAMPLE_K,
  SOURCE_SCOPE_ID,
  SOURCE_SCOPE_V1,
  deriveIdentity,
  deriveLineMagnitude,
  detectFrameworks,
  extensionHistogram,
  isInSourceScope,
  languageShares,
  sourceFilesOf,
  strideSample,
} from '../identity';
import { walkSortedTree } from '../tree';
import type { StackCensus } from '../stackcensus';

function tempTree(files: Record<string, string | Buffer>): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-identity-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function readFileBoundTo(root: string) {
  return async (p: string): Promise<Buffer | null> => {
    try {
      return await readFile(join(root, p));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  };
}

const lines = (n: number) => `${'\n'.repeat(n)}x`;

describe('2.1 source-v1 scope is one exported rule, testable by path', () => {
  it('accepts source files the scanner already parses', () => {
    for (const path of [
      'src/index.ts',
      'app/main.py',
      'cmd/server.go',
      'src/main/java/App.java',
      'lib/x.rb',
      'web/app.php',
      'src/lib.rs',
      'src/Program.cs',
      'legacy/Form1.frm',
      'legacy/Unit1.pas',
      'src/bootstrap.js',
    ]) {
      expect(isInSourceScope(path), path).toBe(true);
      expect(SOURCE_SCOPE_V1.includes(path), path).toBe(true);
    }
  });

  it('rejects lockfiles, generated bundles, vendored code, and non-source files', () => {
    for (const path of [
      'package-lock.json',
      'yarn.lock',
      'poetry.lock',
      'go.sum',
      'Cargo.lock',
      'docs/README.md',
      'assets/logo.svg',
      'public/app.min.js',
      'dist/bundle.js',
      'node_modules/react/index.js',
      'vendor/github.com/x/y/z.go',
      'third_party/lib.c',
      'src/generated.pb.go',
      'src/Foo.designer.cs',
      'src/schema.generated.ts',
    ]) {
      expect(isInSourceScope(path), path).toBe(false);
      expect(SOURCE_SCOPE_V1.includes(path), path).toBe(false);
    }
  });

  it('records the versioned scope identifier', () => {
    expect(SOURCE_SCOPE_V1.id).toBe('source-v1');
    expect(SOURCE_SCOPE_ID).toBe('source-v1');
  });
});

describe('2.2 tree shape over one walk', () => {
  it('counts files and directories and derives language shares of the source set', async () => {
    const dir = tempTree({
      'src/a.ts': 'const a = 1;\n',
      'src/b.tsx': 'export const b = 2;\n',
      'src/c.ts': 'export {};\n',
      'svc/main.py': 'print(1)\n',
      'svc/util.py': 'print(2)\n',
      'README.md': '# readme\n',
      'package-lock.json': '{"lockfileVersion":3}\n',
      'package.json': JSON.stringify({ dependencies: { express: '4.18.2' } }),
    });
    try {
      const walk = await walkSortedTree(dir);
      const identity = await deriveIdentity({
        walk,
        manifests: [{ root: '.', ecosystem: 'js', manifest: 'package.json' }],
        readFile: readFileBoundTo(dir),
        subject: { repo: 'o/r', commit: 'abc1234', scanned_at: '2026-01-01T00:00:00Z' },
      });

      expect(identity.size.status).toBe('measured');
      // 8 files + 2 dirs (src/, svc/); `node_modules` is skipped by the walk.
      expect(identity.size.files).toBe(8);
      expect(identity.size.directories).toBe(2);

      const languages = identity.stack.languages;
      const total = languages.reduce((a, l) => a + l.files, 0);
      const shareSum = languages.reduce((a, l) => a + l.share, 0);
      expect(total).toBe(5); // md + lockfile are outside the source scope
      expect(shareSum).toBeCloseTo(1, 3);
      expect(languages.find((l) => l.name === 'TypeScript')?.files).toBe(3);
      expect(languages.find((l) => l.name === 'Python')?.files).toBe(2);
      expect(identity.stack.primary_language).toBe('TypeScript');

      // Frameworks are presence-only: the name, never a version or a status.
      expect(identity.stack.frameworks).toContain('Express');
      const serialized = JSON.stringify(identity.stack.frameworks);
      expect(serialized).not.toMatch(/4\.18/);
      expect(serialized).not.toMatch(/support_status|support|version/i);
      expect(identity.stack.ecosystems).toEqual(['js']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('histograms extensions of the whole tree (extrapolation input)', () => {
    const histogram = extensionHistogram(['a.ts', 'b.ts', 'c.py', 'notes.md', 'Dockerfile']);
    expect(histogram.get('.ts')).toBe(2);
    expect(histogram.get('.py')).toBe(1);
    expect(histogram.get('.md')).toBe(1);
    expect(histogram.has('')).toBe(false);
  });

  it('names a deterministic primary language on a tie', () => {
    const { primary, languages } = languageShares(['b.py', 'a.ts']);
    expect(primary).toBe('Python');
    expect(languages.map((l) => l.name)).toEqual(['Python', 'TypeScript']);
  });
});

describe('2.3 line-magnitude ladder follows coverage, not budget', () => {
  it('reads everything and reports measured when files_in_scope <= k', async () => {
    const dir = tempTree({ 'a.ts': lines(10), 'b.ts': lines(20), 'c.py': lines(30) });
    try {
      const walk = await walkSortedTree(dir);
      const item = await deriveLineMagnitude({
        sourcePaths: sourceFilesOf(walk.paths),
        readFile: readFileBoundTo(dir),
      });
      expect(item.status).toBe('measured');
      expect(item.value).toBe(60);
      expect(item.method).toBe('read-all');
      expect(item.scope).toBe('source-v1');
      expect(item.covered).toEqual({ files_read: 3, files_in_scope: 3 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reads a fixed stride and reports estimated with its coverage disclosed', async () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < 100; i++) files[`src/f${String(i).padStart(3, '0')}.ts`] = lines(4);
    const dir = tempTree(files);
    try {
      const walk = await walkSortedTree(dir);
      const item = await deriveLineMagnitude({
        sourcePaths: sourceFilesOf(walk.paths),
        readFile: readFileBoundTo(dir),
      });
      expect(item.status).toBe('estimated');
      expect(item.method).toBe('stride-sample');
      expect(item.covered).toEqual({ files_read: IDENTITY_SAMPLE_K, files_in_scope: 100 });
      // 4 lines/file across 100 files, extrapolated from a uniform sample.
      expect(item.value).toBe(400);
      // Stored precision follows status: two significant figures.
      expect(String(item.value).replace(/0+$/, '').length).toBeLessThanOrEqual(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps the stride deterministic and spread across the canonical order', () => {
    const items = Array.from({ length: 100 }, (_, i) => `f${i}`);
    const sampled = strideSample(items, 10);
    expect(sampled).toEqual(['f0', 'f10', 'f20', 'f30', 'f40', 'f50', 'f60', 'f70', 'f80', 'f90']);
    expect(strideSample(['a', 'b'], 10)).toEqual(['a', 'b']);
  });

  it('reads everything and reports measured when the local lane asks for read-all above k', async () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < 100; i++) files[`src/f${String(i).padStart(3, '0')}.ts`] = lines(2);
    const dir = tempTree(files);
    try {
      const walk = await walkSortedTree(dir);
      const item = await deriveLineMagnitude({
        sourcePaths: sourceFilesOf(walk.paths),
        readFile: readFileBoundTo(dir),
        readAll: true,
      });
      expect(item.status).toBe('measured');
      expect(item.method).toBe('read-all');
      expect(item.value).toBe(200);
      expect(item.covered).toEqual({ files_read: 100, files_in_scope: 100 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports unknown with the reason when the scope is empty — never zero', async () => {
    const dir = tempTree({ 'README.md': '# only docs\n', 'Dockerfile': 'FROM scratch\n' });
    try {
      const walk = await walkSortedTree(dir);
      const item = await deriveLineMagnitude({
        sourcePaths: sourceFilesOf(walk.paths),
        readFile: readFileBoundTo(dir),
      });
      expect(item.status).toBe('unknown');
      expect(item.value).toBeUndefined();
      expect(item.reason).toMatch(/empty scope/i);
      expect(item.scope).toBe('source-v1');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports unknown — not a partial number — when the read allocation is exhausted', async () => {
    const dir = tempTree({ 'a.ts': lines(5), 'b.ts': lines(5) });
    try {
      const walk = await walkSortedTree(dir);
      const item = await deriveLineMagnitude({
        sourcePaths: sourceFilesOf(walk.paths),
        readFile: async () => {
          throw Object.assign(new Error('byteCap exceeded'), { name: 'QuotaExceededError' });
        },
      });
      expect(item.status).toBe('unknown');
      expect(item.reason).toMatch(/identity read allocation/i);
      expect(item.covered?.files_read).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('2.5 identity derivation is deterministic', () => {
  const census: StackCensus = {
    vb6: { id: 'vb6', detected: false, project_files: [], evidence: [], file_count: 0 },
    delphi: { id: 'delphi', detected: false, project_files: [], evidence: [], file_count: 0 },
    truncated: false,
  };

  const files: Record<string, string> = {
    'src/a.ts': lines(3),
    'src/nested/b.ts': lines(7),
    'svc/c.py': lines(11),
    'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
  };

  it('derives the same block twice over the same tree', async () => {
    const dir = tempTree(files);
    try {
      const walk = await walkSortedTree(dir);
      const input = {
        walk,
        manifests: [{ root: '.', ecosystem: 'js', manifest: 'package.json' }],
        readFile: readFileBoundTo(dir),
        archetype: { archetype: 'service', confidence: 'medium', planeInventory: { has_server: true } },
        census,
        subject: { repo: 'o/r', commit: 'abc1234', scanned_at: '2026-01-01T00:00:00Z' },
      };
      const a = await deriveIdentity(input);
      const b = await deriveIdentity(input);
      expect(a).toEqual(b);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not depend on file-creation order', async () => {
    const dir = tempTree(files);
    // Same content, created in a different order.
    const shuffled: Record<string, string> = {};
    for (const key of Object.keys(files).reverse()) shuffled[key] = files[key];
    const other = tempTree(shuffled);
    try {
      const sortedWalk = await walkSortedTree(dir);
      const shuffledWalk = await walkSortedTree(other);
      const base = {
        manifests: [{ root: '.', ecosystem: 'js', manifest: 'package.json' }],
        archetype: { archetype: 'service', confidence: 'medium' },
        census,
        subject: { repo: 'o/r', commit: 'abc1234', scanned_at: '2026-01-01T00:00:00Z' },
      };
      const a = await deriveIdentity({ ...base, walk: sortedWalk, readFile: readFileBoundTo(dir) });
      const b = await deriveIdentity({ ...base, walk: shuffledWalk, readFile: readFileBoundTo(other) });
      expect(a).toEqual(b);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  });
});

describe('framework detection is presence-only', () => {
  it('names frameworks from manifest text and never a version', async () => {
    const dir = tempTree({
      'package.json': JSON.stringify({ dependencies: { next: '16.0.0', react: '19.2.0' } }),
      'pyproject.toml': '[project]\ndependencies = ["django==3.2.25"]\n',
    });
    try {
      const names = await detectFrameworks(
        [
          { root: '.', manifest: 'package.json' },
          { root: '.', manifest: 'pyproject.toml' },
        ],
        readFileBoundTo(dir),
      );
      expect(names).toEqual(['Django', 'Next.js', 'React']);
      expect(JSON.stringify(names)).not.toMatch(/\d+\.\d+/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('an unreadable manifest contributes no claim rather than a guess', async () => {
    const names = await detectFrameworks(
      [{ root: '.', manifest: 'package.json' }],
      async () => {
        throw new Error('cap');
      },
    );
    expect(names).toEqual([]);
  });
});

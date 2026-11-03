/** report-identity 2.4 / 3.x / 4.x — the identity pass through both lanes, the
 * seal, and the two exclusion proofs (fingerprint, inertness). */
import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runLocalScan } from '../local';
import { sealScan } from '../scoring/seal';
import { degradedIdentity, deriveIdentity } from '../identity';
import { IDENTITY_READ_ALLOCATION } from '../budget';
import type { FactRecord } from '../facts';
import type { ReportIdentity } from '@leapscore/contracts';

const cloneState = vi.hoisted(() => ({
  handle: null as null | {
    clonePath: string;
    commitSha: string;
    cleanup: () => void;
    readFile: (p: string) => Promise<Buffer | null>;
    partitionedReadFile: (cap: number) => (p: string) => Promise<Buffer | null>;
  },
  /** How the identity-bound reader behaves: normal, quota-capped, or crashing. */
  identityReader: 'normal' as 'normal' | 'quota' | 'crash',
}));

vi.mock('../ingest', () => ({
  ingestRepoUrl: async () => ({ ok: true, owner: 'o', repo: 'r', normalized: 'o/r' }),
  GhRateLimitError: class GhRateLimitError extends Error {},
}));

vi.mock('../clone', () => ({
  shallowClone: async () => {
    if (!cloneState.handle) throw new Error('no clone handle in this test');
    return cloneState.handle;
  },
}));

function makeTree(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-identity-scan-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function fsReader(root: string) {
  return async (p: string): Promise<Buffer | null> => {
    try {
      return await readFile(join(root, p));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  };
}

function cloneHandleFor(root: string) {
  return {
    clonePath: root,
    commitSha: 'abc1234567890',
    cleanup: () => {},
    readFile: fsReader(root),
    partitionedReadFile: (cap: number) => {
      const reader = fsReader(root);
      if (cap !== IDENTITY_READ_ALLOCATION) return reader;
      return async (p: string) => {
        if (cloneState.identityReader === 'quota') {
          throw Object.assign(new DOMException('byteCap exceeded', 'QuotaExceededError'));
        }
        if (cloneState.identityReader === 'crash') throw new Error('identity reader crashed');
        return reader(p);
      };
    },
  };
}

async function drainRemote(indicatorIds: string[]) {
  const { runUnifiedScan } = await import('../orchestrator');
  let done: { facts: FactRecord[]; snapshot: unknown; identity?: ReportIdentity } | null = null;
  for await (const evt of runUnifiedScan('https://github.com/o/r', { indicatorIds })) {
    if (evt.type === 'done') {
      done = {
        facts: (evt.facts as FactRecord[]) ?? [],
        snapshot: evt.snapshot,
        identity: evt.identity,
      };
      break;
    }
  }
  return done;
}

function fixtureFiles(): Record<string, string> {
  return {
    'package.json': JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }),
    'package-lock.json': JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }),
    'src/index.ts': 'export const one = 1;\n'.repeat(20),
    'src/other.ts': 'export const two = 2;\n'.repeat(10),
    'svc/app.py': 'print("hi")\n'.repeat(5),
    'README.md': '# fixture\n',
  };
}

describe('2.4 / 3.3 the local lane seals identity from already-computed scan values', () => {
  it('seals report.identity with measured size values and the snapshot archetype', async () => {
    const dir = makeTree(fixtureFiles());
    try {
      let done: { facts: FactRecord[]; snapshot: unknown; identity?: ReportIdentity } | null = null;
      for await (const evt of runLocalScan(dir, { indicatorIds: ['ARCH-01'] })) {
        if (evt.type === 'done') {
          done = {
            facts: (evt.facts as FactRecord[]) ?? [],
            snapshot: evt.snapshot,
            identity: (evt as { identity?: ReportIdentity }).identity,
          };
          break;
        }
      }
      expect(done).not.toBeNull();
      expect(done!.identity).toBeDefined();

      const sealed = sealScan({
        facts: [...done!.facts].sort((a, b) => String(a.detectorId).localeCompare(String(b.detectorId))),
        snapshot: done!.snapshot as Record<string, unknown>,
        budgetMs: 1_000,
        startMs: Date.now(),
        trace: [],
        identity: done!.identity,
        engineRef: 'abc1234',
        execImpl: () => {
          throw new Error('no consumer-tree git');
        },
      });

      expect(sealed.report.identity).toBeDefined();
      const identity = sealed.report.identity!;
      expect(identity.size.status).toBe('measured');
      expect(identity.size.files).toBe(6);
      expect(identity.size.directories).toBe(2);
      expect(identity.size.lines?.status).toBe('measured');
      // One source of truth: identity names the archetype the report sealed.
      expect(identity.shape.archetype).toBe(sealed.report.snapshot.archetype);
      // Presence-only stack vocabulary: names, never versions or support status.
      expect(Array.isArray(identity.stack.frameworks)).toBe(true);
      expect(JSON.stringify(identity.stack.frameworks)).not.toMatch(/version|support/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('3.2 the remote lane derives identity on its own reservation-bound reader', () => {
  it('a remote-shaped scan seals an identity block', async () => {
    const dir = makeTree(fixtureFiles());
    cloneState.handle = cloneHandleFor(dir);
    cloneState.identityReader = 'normal';
    try {
      const done = await drainRemote(['ECOS-06']);
      expect(done).not.toBeNull();
      expect(done!.identity).toBeDefined();
      expect(done!.identity!.size.lines?.status).toBe('measured');
      expect(done!.identity!.size.files).toBe(6);

      const sealed = sealScan({
        facts: done!.facts,
        snapshot: done!.snapshot as Record<string, unknown>,
        budgetMs: 1_000,
        startMs: Date.now(),
        trace: [],
        identity: done!.identity,
        engineRef: 'abc1234',
        execImpl: () => {
          throw new Error('no consumer-tree git');
        },
      });
      expect(sealed.report.identity).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
      cloneState.handle = null;
    }
  });

  it('an identity read cap yields unknown with the identity limit named — not an error', async () => {
    const dir = makeTree(fixtureFiles());
    cloneState.handle = cloneHandleFor(dir);
    cloneState.identityReader = 'quota';
    try {
      const done = await drainRemote(['ECOS-06']);
      expect(done).not.toBeNull();
      const lines = done!.identity!.size.lines!;
      expect(lines.status).toBe('unknown');
      expect(lines.reason).toMatch(/identity read allocation/i);
      expect(lines.reason).not.toMatch(/detector/i);
      expect(lines.value).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
      cloneState.handle = null;
    }
  });
});

describe('3.4 the identity pass never fails the run', () => {
  it('a crash inside the pass still seals, with unknown statuses and reasons', async () => {
    const dir = makeTree(fixtureFiles());
    cloneState.handle = cloneHandleFor(dir);
    cloneState.identityReader = 'crash';
    try {
      const done = await drainRemote(['ECOS-06']);
      expect(done).not.toBeNull();
      expect(done!.facts.length).toBeGreaterThan(0);
      const lines = done!.identity!.size.lines!;
      expect(lines.status).toBe('unknown');
      expect(lines.reason).toMatch(/read failed/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      cloneState.handle = null;
    }
  });

  it('a throw in the derivation itself degrades to unknown instead of escaping', async () => {
    const hostileWalk = {
      get paths(): string[] {
        throw new Error('walk exploded');
      },
      fileCount: 0,
    };
    const identity = await deriveIdentity({
      walk: hostileWalk as never,
      manifests: [],
      readFile: async () => null,
      subject: { repo: 'o/r', commit: 'abcdef1', scanned_at: '2026-01-01T00:00:00Z' },
    });
    expect(identity.shape.status).toBe('unknown');
    expect(identity.shape.reason).toMatch(/walk exploded/);
    expect(identity.size.status).toBe('unknown');
    expect(identity.size.reason).toMatch(/walk exploded/);
    expect(identity.stack.status).toBe('unknown');
  });

  it('degradedIdentity states each stage as unknown with the same reason', () => {
    const identity = degradedIdentity(
      { repo: 'o/r', commit: 'unknown', scanned_at: '2026-01-01T00:00:00Z' },
      'identity pass did not run',
    );
    expect(identity.shape.status).toBe('unknown');
    expect(identity.size.lines?.status).toBe('unknown');
    expect(identity.stack.languages).toEqual([]);
  });
});

function fakeFact(id: string): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts: { value: 1 },
    evidencePointers: [],
    provenance: { tool: 'test', version: '1', flags: [], durationMs: 1 },
    truncated: false,
  } as unknown as FactRecord;
}

function identityWithStatus(status: 'measured' | 'estimated'): ReportIdentity {
  return {
    subject: { repo: 'o/r', commit: 'abcdef1', scanned_at: '2026-08-12T00:00:00.000Z' },
    shape: { status: 'measured', archetype: 'library', confidence: 'high' },
    size: {
      status: 'measured',
      files: 10,
      directories: 2,
      lines: { status, value: 420000, method: status === 'measured' ? 'read-all' : 'stride-sample', scope: 'source-v1' },
    },
    stack: {
      status: 'measured',
      languages: [{ name: 'TypeScript', share: 1, files: 10 }],
      primary_language: 'TypeScript',
      ecosystems: ['js'],
      frameworks: ['React'],
    },
  };
}

describe('4.1 the seal carries the block only when the pass ran', () => {
  const snapshot = {
    repo: 'o/r',
    scanned_at: '2026-08-12T00:00:00.000Z',
    engine_version: 't',
    rubric_version: 't',
    scanned_commit: 'abcdef1',
  };
  const seal = (identity?: ReportIdentity) =>
    sealScan({
      facts: [fakeFact('ECOS-01')],
      snapshot,
      budgetMs: 10_000,
      startMs: Date.now(),
      trace: [],
      identity,
      engineRef: 'abc1234',
      execImpl: () => {
        throw new Error('no consumer-tree git');
      },
    });

  it('is present for a scanned target and absent when the pass was skipped', () => {
    expect(seal(identityWithStatus('measured')).report.identity).toBeDefined();
    expect(seal(undefined).report.identity).toBeUndefined();
    expect('identity' in seal(undefined).report).toBe(false);
  });
});

describe('4.2 fingerprint exclusion: the lane cannot change the fingerprint', () => {
  const snapshot = {
    repo: 'o/r',
    scanned_at: '2026-08-12T00:00:00.000Z',
    engine_version: 't',
    rubric_version: 't',
    scanned_commit: 'abcdef1',
  };
  const seal = (identity?: ReportIdentity) =>
    sealScan({
      facts: [fakeFact('ECOS-01')],
      snapshot,
      budgetMs: 10_000,
      startMs: Date.now(),
      trace: [],
      identity,
      engineRef: 'abc1234',
      execImpl: () => {
        throw new Error('no consumer-tree git');
      },
    });

  it('same content, measured vs estimated magnitude ⇒ one score_fingerprint', () => {
    const measured = seal(identityWithStatus('measured'));
    const estimated = seal(identityWithStatus('estimated'));
    expect(measured.meta.score_fingerprint).toBeTruthy();
    expect(estimated.meta.score_fingerprint).toBe(measured.meta.score_fingerprint);
    // The sealed blocks do differ — the exclusion is not "the block is empty".
    expect(measured.report.identity?.size.lines?.status).toBe('measured');
    expect(estimated.report.identity?.size.lines?.status).toBe('estimated');
  });

  it('identity presence itself is not a fingerprinted input', () => {
    expect(seal(identityWithStatus('measured')).meta.score_fingerprint).toBe(
      seal(undefined).meta.score_fingerprint,
    );
  });
});

describe('4.3 the block is inert: every graded quantity is byte-identical', () => {
  const snapshot = {
    repo: 'o/r',
    scanned_at: '2026-08-12T00:00:00.000Z',
    engine_version: 't',
    rubric_version: 't',
    scanned_commit: 'abcdef1',
  };
  const seal = (identity?: ReportIdentity) =>
    sealScan({
      facts: [fakeFact('ECOS-01'), fakeFact('SEC-02')],
      snapshot,
      budgetMs: 10_000,
      startMs: Date.now(),
      trace: [],
      identity,
      engineRef: 'abc1234',
      execImpl: () => {
        throw new Error('no consumer-tree git');
      },
    });

  it('headline, tier, coverage, gates, categories and next_band_path are unchanged', () => {
    const withIdentity = seal(identityWithStatus('measured'));
    const withoutIdentity = seal(undefined);
    const strip = (sealed: ReturnType<typeof seal>) => {
      const report = { ...sealed.report } as Record<string, unknown>;
      delete report.identity;
      // Run-scoped identity, not a graded quantity.
      delete report.id;
      return JSON.stringify(report);
    };
    expect(strip(withIdentity)).toBe(strip(withoutIdentity));
    expect(withIdentity.report.headline).toEqual(withoutIdentity.report.headline);
    expect(withIdentity.report.coverage).toEqual(withoutIdentity.report.coverage);
    expect(withIdentity.report.gates).toEqual(withoutIdentity.report.gates);
    expect(withIdentity.report.categories).toEqual(withoutIdentity.report.categories);
    expect(withIdentity.report.next_band_path).toEqual(withoutIdentity.report.next_band_path);
  });
});

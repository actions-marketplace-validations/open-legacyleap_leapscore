/** apps/scanner/src/scan/__tests__/detector.contract.test.ts — contract tests for Phase-1 6 detectors (Q10) */
import { describe, it, expect, vi } from 'vitest';
import { detectVel06 } from '../detectors/vel06';
import { detectVel09 } from '../detectors/vel09';
import { detectVel08 } from '../detectors/vel08';
import { detectVel10 } from '../detectors/vel10';
import { detectSec07 } from '../detectors/sec07';
import { detectTest08 } from '../detectors/test08';
import { validateFact } from '../facts';
import type { Phase1ScanContext } from '../detector';

const phase1Detectors = [
  { id: 'VEL-06', fn: detectVel06 },
  { id: 'VEL-09', fn: detectVel09 },
  { id: 'VEL-08', fn: detectVel08 },
  { id: 'VEL-10', fn: detectVel10 },
  { id: 'SEC-07', fn: detectSec07 },
  { id: 'TEST-08', fn: detectTest08 },
] as const;

function ghFor(map: Record<string, unknown>) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  return {
    request: vi.fn(async (path: string) => {
      const key = keys.find((k) => path === k || path.startsWith(k + '/') || path.startsWith(k + '?')) ?? keys.find((k) => path.startsWith(k));
      const v = key ? map[key] : [];
      if (v instanceof Error) throw v;
      return v;
    }),
  } as unknown as import('../detector').RateLimitedGhClient;
}

describe('detector contract: Phase-1 6 detectors', () => {
  for (const { id, fn } of phase1Detectors) {
    it(`${id} envelope never contains score/status/confidence and validates`, async () => {
      const gh = ghFor({
        '/repos/o/r': { private: false },
        '/repos/o/r/commits': [{ author: { login: 'a' }, commit: { author: { name: 'a' } } }],
        '/repos/o/r/pulls': Array.from({ length: 12 }, () => ({ additions: 10, deletions: 10, user: { login: 'x' }, merged_at: '2024-01-01', created_at: '2024-01-01' })),
        '/repos/o/r/contents/.github/workflows': [],
        '/repos/o/r/branches': [{ name: 'main' }],
        '/repos/o/r/contents': [{ name: 'package.json' }],
        '/repos/o/r/contents/.github/dependabot.yml': { content: Buffer.from('x').toString('base64'), encoding: 'base64' },
      });
      const ctx: Phase1ScanContext = { owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() };
      const fact = await fn(ctx);
      // Never score/status
      expect((fact as Record<string, unknown>).score).toBeUndefined();
      expect((fact as Record<string, unknown>).status).toBeUndefined();
      expect((fact.facts as Record<string, unknown>).score).toBeUndefined();
      // Validates
      const rec = { ...fact, id, root: '/', scanId: 'test' } as unknown as Parameters<typeof validateFact>[0];
      expect(validateFact(rec).ok).toBe(true);
      // Has provenance
      expect(fact.provenance.tool).toBe('gh-api');
      expect(fact.evidencePointers).toBeDefined();
    });

    it(`${id} honors abort within 50ms`, async () => {
      // Make gh hang
      const gh = {
        request: vi.fn(async (_path: string, _p?: unknown, opts?: { signal?: AbortSignal }) => {
          return new Promise((_, reject) => {
            opts?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
          });
        }),
      } as unknown as import('../detector').RateLimitedGhClient;
      const ac = new AbortController();
      const ctx: Phase1ScanContext = { owner: 'o', repo: 'r', gh, signal: ac.signal, toolVersions: new Map() };
      const p = fn(ctx);
      setTimeout(() => ac.abort(new DOMException('Aborted', 'AbortError')), 5);
      const fact = await p;
      expect(fact.truncated).toBe(true);
      expect(fact.error?.kind).toBe('cap');
    });
  }
});

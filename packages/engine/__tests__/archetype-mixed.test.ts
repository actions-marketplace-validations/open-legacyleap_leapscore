import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { classifyArchetypePerRoot } from '../archetype';

describe('archetype per-root mixed', () => {
  it('mixed monorepo frontend/infra/api yields per-root + mixed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'arch-mixed-'));
    try {
      // frontend — react client (with main so library-like)
      mkdirSync(join(dir, 'frontend'), { recursive: true });
      writeFileSync(join(dir, 'frontend/package.json'), JSON.stringify({ name: 'frontend', main: 'index.js', dependencies: { react: '^18' } }));
      mkdirSync(join(dir, 'frontend/src/components'), { recursive: true });
      writeFileSync(join(dir, 'frontend/src/components/Button.tsx'), 'x');
      // infra — tf
      mkdirSync(join(dir, 'infra'), { recursive: true });
      writeFileSync(join(dir, 'infra/main.tf'), 'resource');
      writeFileSync(join(dir, 'infra/vars.tf'), 'var');
      writeFileSync(join(dir, 'infra/outputs.tf'), 'out');
      // api — express service with migrations and Dockerfile
      mkdirSync(join(dir, 'api'), { recursive: true });
      writeFileSync(join(dir, 'api/package.json'), JSON.stringify({ dependencies: { express: '^4', pg: '^8' } }));
      mkdirSync(join(dir, 'api/migrations'), { recursive: true });
      writeFileSync(join(dir, 'api/migrations/001.sql'), 'create');
      writeFileSync(join(dir, 'api/Dockerfile'), 'FROM node');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const manifests = [
        { root: 'frontend', ecosystem: 'js' },
        { root: 'infra', ecosystem: 'js' },
        { root: 'api', ecosystem: 'js' },
      ];
      const res = await classifyArchetypePerRoot(dir, rf as never, manifests);
      expect(res.archetype).toBe('mixed');
      expect(res.perRoot?.length).toBe(3);
      const byRoot = new Map(res.perRoot!.map(r => [r.root, r.archetype]));
      // frontend should be library-ish or service? has client -> not docs, but has client true without server -> may be library or docs? Need at least not unknown
      expect(byRoot.get('frontend')).not.toBe('unknown');
      expect(byRoot.get('infra')).toBe('infra');
      expect(byRoot.get('api')).toBe('service');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

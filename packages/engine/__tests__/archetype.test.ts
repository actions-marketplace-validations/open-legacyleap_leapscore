import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { classifyArchetype, detectPlaneInventory } from '../archetype';

function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'arch-test-'));
  return d;
}

function write(p: string, content: string) {
  const dir = p.slice(0, p.lastIndexOf('/'));
  if (dir) mkdirSync(dir, { recursive: true });
  writeFileSync(p, content);
}

describe('archetype + plane inventory', () => {
  it('library detected when package.json has main and no deploy/data', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'package.json'), JSON.stringify({ name: 'mylib', main: 'index.js', version: '1.0.0' }));
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, [{ root: '.', ecosystem: 'js' }]);
      expect(res.archetype).toBe('library');
      expect(res.confidence).toMatch(/medium|high/);
      expect(res.planeInventory.has_deploy).toBe(false);
      expect(res.planeInventory.has_data).toBe(false);
      expect(res.evidencePointers.join(' ')).toContain('package.json');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('agent-skills detected when skills/ md prompts present', async () => {
    const dir = tmp();
    try {
      mkdirSync(join(dir, 'skills'), { recursive: true });
      write(join(dir, 'skills/a.md'), '# skill');
      write(join(dir, 'skills/b.md'), '# skill');
      write(join(dir, 'skills/c.md'), '# skill');
      write(join(dir, 'README.md'), '# readme');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, []);
      expect(res.archetype).toBe('agent-skills');
      expect(res.planeInventory.has_server).toBe(false);
      expect(res.planeInventory.has_deploy).toBe(false);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('service detected when has_server + has_data + has_deploy', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'package.json'), JSON.stringify({ dependencies: { express: '^4' } }));
      mkdirSync(join(dir, 'migrations'), { recursive: true });
      write(join(dir, 'migrations/001.sql'), 'create');
      write(join(dir, 'Dockerfile'), 'FROM node');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, [{ root: '.', ecosystem: 'js' }]);
      expect(res.archetype).toBe('service');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('infra detected when many *.tf', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'main.tf'), 'resource');
      write(join(dir, 'vars.tf'), 'var');
      write(join(dir, 'outputs.tf'), 'out');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, []);
      expect(res.archetype).toBe('infra');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('docs detected when mdRatio high', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'README.md'), '# docs');
      write(join(dir, 'docs/a.md'), '# a');
      write(join(dir, 'docs/b.md'), '# b');
      write(join(dir, 'guide.md'), '# g');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, []);
      expect(res.archetype).toBe('docs');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('unknown when no manifest and no plane', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'README.md'), 'hello');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, []);
      expect(res.archetype).toBe('unknown');
      expect(res.confidence).toBe('low');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('plane inventory exhaustive evidence for false planes', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'README.md'), 'hi');
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const p = await detectPlaneInventory(dir, rf as never);
      expect(p.has_data).toBe(false);
      expect(p.evidence.has_data.join(' ')).toContain('tree scan');
      expect(p.has_deploy).toBe(false);
      expect(p.evidence.has_deploy.join(' ')).toContain('tree scan');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('cli detected when bin present', async () => {
    const dir = tmp();
    try {
      write(join(dir, 'package.json'), JSON.stringify({ name: 'cli', bin: './bin.js' }));
      const rf = async (p: string) => {
        try { const { readFile } = await import('node:fs/promises'); return await readFile(join(dir, p)); } catch { return null; }
      };
      const res = await classifyArchetype(dir, rf as never, []);
      expect(res.archetype).toBe('cli');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

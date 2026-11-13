/**
 * Local subject portability (scan-local / report-identity): a sealed local
 * report names the scanned directory, never the machine path, and the identity
 * a report already had — runId and score fingerprint — does not move.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { main } from '../../../bin/scan';
import { runLocalScan } from '../local';
import { buildRunId, localSlugFromPath, normalizeTs, sealScan } from '../scoring/seal';
import type { FactRecord } from '../facts';

const created: string[] = [];

function makeTarget(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-portable-'));
  created.push(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }));
  writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
  writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
  return dir;
}

afterEach(() => {
  vi.useRealTimers();
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('3.3 local artifacts are path-free', () => {
  it('seals the basename and publishes no absolute path in JSON, HTML, or Markdown', async () => {
    const dir = makeTarget();
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-portable-out-'));
    created.push(outDir);
    const code = await main(['scan', dir, '--out', outDir], {
      env: { LEAPSCORE_SHA: 'fixedsha' },
      stdout: () => {},
      stderr: () => {},
    });
    expect(code).toBe(0);

    const json = readFileSync(join(outDir, 'report.json'), 'utf8');
    const html = readFileSync(join(outDir, 'report.html'), 'utf8');
    const md = readFileSync(join(outDir, 'report.md'), 'utf8');
    for (const artifact of [json, html, md]) {
      expect(artifact).not.toContain(dir);
      expect(artifact).not.toContain(`file://${dir}`);
    }
    const envelope = JSON.parse(json) as { meta: { repo: string; repoUrl: string }; report: { snapshot: Record<string, unknown>; identity?: { subject: { repo: string } } } };
    expect(envelope.report.snapshot.repo).toBe(basename(dir));
    expect(envelope.report.snapshot.local_path).toBeUndefined();
    expect(envelope.meta.repo).toBe(basename(dir));
    expect(envelope.meta.repoUrl).toBe(`file://${basename(dir)}`);
    expect(envelope.report.identity?.subject.repo).toBe(basename(dir));
  }, 120_000);
});

describe('3.4 the name-only subject leaves run identity and fingerprint unchanged', () => {
  it('same target, same facts: runId and score_fingerprint do not depend on the path', async () => {
    const dir = makeTarget();
    const events: Array<{ type: string; [k: string]: unknown }> = [];
    for await (const event of runLocalScan(dir)) events.push(event as { type: string; [k: string]: unknown });
    const done = events.find((event) => event.type === 'done');
    expect(done).toBeDefined();
    const facts = (done!.facts as FactRecord[]) ?? [];
    const snapshot = done!.snapshot as Record<string, unknown>;
    const identity = (done as { identity?: unknown }).identity;

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-12T00:00:00.000Z'));
    const subjectSlug = localSlugFromPath(basename(dir));
    const common = {
      facts,
      budgetMs: 0,
      startMs: Date.now(),
      trace: [],
      identity: identity as never,
      subjectSlug,
      env: { LEAPSCORE_SHA: 'fixedsha' },
      execImpl: () => {
        throw new Error('no consumer-tree git');
      },
    };
    const nameOnly = sealScan({ ...common, snapshot, repoUrl: `file://${basename(dir)}` });
    // The pre-change shape: the absolute path sealed as the subject.
    const pathful = sealScan({ ...common, snapshot: { ...snapshot, repo: dir }, repoUrl: `file://${dir}` });

    expect(pathful.meta.repo).toBe(dir);
    expect(nameOnly.meta.repo).toBe(basename(dir));
    expect(nameOnly.runId).toBe(pathful.runId);
    expect(nameOnly.meta.score_fingerprint).toBe(pathful.meta.score_fingerprint);
    expect(nameOnly.runId).toBe(
      buildRunId(subjectSlug, 'fixedsha', normalizeTs(String(snapshot.scanned_at))),
    );
  }, 120_000);
});

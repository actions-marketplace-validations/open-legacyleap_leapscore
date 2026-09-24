import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs, main } from '../bin/scan';
import type { SurfaceRestClient } from '../surface/rest';

function fixtureEnvelope() {
  return {
    report: {
      full_table: [
        {
          id: 'SEC-01',
          name: 'Secrets',
          category_id: 'SEC',
          status: 'measured',
          score: 0,
          reason: 'r',
          evidence: { tool: 't', pointers: [] },
          effort: 'e',
          remediation: { quick_win: 'q', structural: 's', gold_standard: 'g', effort: 'e' },
        },
        {
          id: 'VEL-06',
          name: 'Bus',
          category_id: 'VEL',
          status: 'measured',
          score: 3,
          reason: 'r',
        },
      ],
      gates: [],
    },
    meta: { repo: 'a/b', repoSha: 'sha1', engineSha7: 'eng1' },
  };
}

function fakeFactory(log: string[], opts: { fail?: boolean } = {}) {
  let next = 1;
  const store = new Map<number, { title: string; body: string; labels: string[]; state: 'open' | 'closed' }>();
  const client: SurfaceRestClient = {
    request: async () => {
      throw new Error('unused');
    },
    async listIssues() {
      log.push('list');
      return [...store.entries()].map(([number, i]) => ({ number, title: i.title, body: i.body, state: i.state }));
    },
    async createIssue(_o, _r, input) {
      log.push('create');
      const number = next++;
      store.set(number, { ...input, state: 'open' });
      return { number, title: input.title, body: input.body, state: 'open' as const };
    },
    async updateIssue(_o, _r, number, input) {
      log.push('update');
      const cur = store.get(number)!;
      if (input.state) cur.state = input.state;
      if (input.labels) cur.labels = input.labels;
      if (input.body !== undefined) cur.body = input.body;
      return { number, title: cur.title, body: cur.body, state: cur.state };
    },
    async createComment() {
      log.push('comment');
    },
    async ensureLabel() {
      log.push('label');
    },
    async getRepoPrivate() {
      log.push('repo');
      if (opts.fail) throw Object.assign(new Error('boom: 500'), { status: 500, body: {} });
      return false;
    },
  };
  return (_token: string | undefined) => client;
}

describe('surface CLI flags', () => {
  it('parses space and equals forms', () => {
    expect(parseArgs(['--surface', '--repo-a', 'o/r', '--run-url', 'https://x'])).toMatchObject({
      surface: true,
      repoA: 'o/r',
      runUrl: 'https://x',
    });
    expect(parseArgs(['--surface-from=f.json', '--repo-a=o/r'])).toMatchObject({ surfaceFrom: 'f.json', repoA: 'o/r' });
  });
});

describe('surface main paths (no network)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'surf-cli-'));
  });
  async function run(argv: string[], factory?: (t: string | undefined) => SurfaceRestClient) {
    const out: string[] = [];
    const err: string[] = [];
    const code = await main(argv, { env: {}, stdout: (s) => out.push(s), stderr: (s) => err.push(s), surfaceClientFactory: factory });
    return { code, out, err };
  }
  function envelopeFile(): string {
    const p = join(dir, 'env.json');
    writeFileSync(p, JSON.stringify(fixtureEnvelope()));
    return p;
  }
  it('flag-off parity: missing --out still exits 2', async () => {
    const r = await run(['--repo', 'a/b']);
    expect(r.code).toBe(2);
  });
  it('invalid --repo-a exits 2', async () => {
    const r = await run(['--repo', 'a/b', '--repo-a', 'https://github.com/a/b', '--out', join(dir, 'o.json')]);
    expect(r.code).toBe(2);
    expect(r.err.join('\n')).toMatch(/without https/);
  });
  it('refused scan skips surface (factory never called)', async () => {
    let called = false;
    const r = await run(['--repo', 'a/b', '--sha', 'abc', '--out', join(dir, 'o.json'), '--surface'], () => {
      called = true;
      throw new Error('must not construct');
    });
    expect(r.code).toBe(2);
    expect(called).toBe(false);
  });
  it('--surface-from syncs and leaves the envelope file untouched', async () => {
    const p = envelopeFile();
    const before = readFileSync(p, 'utf8');
    const log: string[] = [];
    const r = await run(['--surface-from', p, '--repo', 'a/b', '--repo-a', 'a/b'], fakeFactory(log));
    expect(r.code).toBe(0);
    expect(r.out.join('\n')).toContain('surface: 1 opened / 0 commented / 0 closed / 0 skipped');
    expect(log).toContain('create');
    expect(readFileSync(p, 'utf8')).toBe(before);
  });
  it('--surface-from derives target from meta.repo when --repo is absent', async () => {
    const p = envelopeFile();
    const log: string[] = [];
    const r = await run(['--surface-from', p], fakeFactory(log));
    expect(r.code).toBe(0);
    expect(r.out.join('\n')).toContain('surface: 1 opened');
  });
  it('warn-only: write failures keep exit 0 with a zero summary', async () => {
    const p = envelopeFile();
    const log: string[] = [];
    const r = await run(['--surface-from', p, '--repo', 'a/b'], fakeFactory(log, { fail: true }));
    expect(r.code).toBe(0);
    expect(r.out.join('\n')).toContain('surface: 0 opened / 0 commented / 0 closed / 0 skipped');
    expect(r.err.join('\n')).toMatch(/surface warn/);
  });
  it('invalid envelope file exits 2', async () => {
    const p = join(dir, 'bad.json');
    writeFileSync(p, '{"nope": true}');
    const r = await run(['--surface-from', p, '--repo', 'a/b'], fakeFactory([]));
    expect(r.code).toBe(2);
    const r2 = await run(['--surface-from', join(dir, 'missing.json'), '--repo', 'a/b'], fakeFactory([]));
    expect(r2.code).toBe(2);
  });
});

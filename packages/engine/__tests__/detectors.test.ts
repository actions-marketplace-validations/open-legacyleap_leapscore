import { describe, it, expect, vi } from 'vitest';
import { detectVel06 } from '../detectors/vel06';
import { detectVel09 } from '../detectors/vel09';
import { detectVel08 } from '../detectors/vel08';
import { detectVel10 } from '../detectors/vel10';
import { detectSec07 } from '../detectors/sec07';
import { detectTest08 } from '../detectors/test08';

function ghFor(map: Record<string, unknown>) {
  return {
    request: vi.fn(async (path: string) => {
      // exact match first
      if (path in map) return map[path];
      // prefix match for workflow list
      for (const [k, v] of Object.entries(map)) if (path.startsWith(k)) return v;
      return [];
    }),
  } as unknown as import('../detector').RateLimitedGhClient;
}

describe('VEL-06 bus factor', () => {
  it('emits vel06.bus_factor_repo with evidence pointer', async () => {
    const commits = Array.from({ length: 10 }, (_, i) => ({ author: { login: i < 6 ? 'alice' : 'bob' }, commit: { author: { name: 'x' } } }));
    const gh = ghFor({ '/repos/o/r/commits': commits });
    const fact = await detectVel06({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    expect(fact.detectorId).toBe('VEL-06');
    expect((fact.facts as unknown as { vel06: { bus_factor_repo: number } }).vel06.bus_factor_repo).toBeDefined();
    expect(fact.evidencePointers[0].endpoint).toBe('/repos/o/r/commits');
    expect(fact.provenance.tool).toBe('gh-api');
  });
});

describe('VEL-09 PR hygiene', () => {
  it('unknown when <10 PRs', async () => {
    const gh = ghFor({ '/repos/o/r/pulls': Array.from({ length: 4 }, () => ({ additions: 10, deletions: 5, user: { login: 'alice' }, merged_at: '2024-01-01', created_at: '2024-01-01' })) });
    const fact = await detectVel09({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    expect(fact.error).toBeDefined();
    expect(fact.truncated).toBe(false);
  });
  it('measured when sampled', async () => {
    const pulls = Array.from({ length: 12 }, () => ({ additions: 100, deletions: 100, user: { login: 'alice' }, merged_at: '2024-01-02', created_at: '2024-01-01' }));
    const gh = ghFor({ '/repos/o/r/pulls': pulls });
    const fact = await detectVel09({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    expect(fact.error).toBeUndefined();
    expect((fact.facts as unknown as { vel09: { review_coverage_pct: number } }).vel09.review_coverage_pct).toBeDefined();
  });
});

describe('VEL-08 manual release', () => {
  it('detects cd chain vs no CI', async () => {
    const yaml = Buffer.from('jobs:\n  build:\n    runs-on: ubuntu\n  deploy:\n    environment: production\n').toString('base64');
    const gh = ghFor({
      '/repos/o/r/contents/.github/workflows': [{ name: 'ci.yml', type: 'file', download_url: 'x' }],
      '/repos/o/r/contents/.github/workflows/ci.yml': { content: yaml, encoding: 'base64' },
    });
    const fact = await detectVel08({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    expect((fact.facts as unknown as { vel08: { cd_chain: { deploy_job: boolean } } }).vel08.cd_chain.deploy_job).toBe(true);
  });
});

describe('VEL-10 branching', () => {
  it('classifies stale branches', async () => {
    const gh = ghFor({ '/repos/o/r/branches': [{ name: 'main' }, { name: 'release/1.0' }] });
    const fact = await detectVel10({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    expect((fact.facts as unknown as { vel10: { branches_total: number } }).vel10.branches_total).toBe(2);
  });
});

describe('SEC-07 patch cadence', () => {
  it('bot-present vs na_when', async () => {
    const yaml = Buffer.from('updates: []').toString('base64');
    const gh = ghFor({
      '/repos/o/r/contents/.github/dependabot.yml': { content: yaml, encoding: 'base64' },
      '/repos/o/r/pulls': [],
      '/repos/o/r/contents': [{ name: 'package.json' }],
    });
    const fact = await detectSec07({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    expect((fact.facts as unknown as { sec07: { bot: { present: boolean } } }).sec07.bot.present).toBe(true);
  });
});

describe('TEST-08 quality gates', () => {
  it('lint-only maps correctly', async () => {
    const yaml = Buffer.from('jobs:\n  lint:\n    runs-on: ubuntu\n    steps: [run: eslint]').toString('base64');
    const gh = ghFor({
      '/repos/o/r/contents/.github/workflows': [{ name: 'ci.yml', type: 'file' }],
      '/repos/o/r/contents/.github/workflows/ci.yml': { content: yaml, encoding: 'base64' },
    });
    const fact = await detectTest08({ owner: 'o', repo: 'r', gh, signal: new AbortController().signal, toolVersions: new Map() });
    const g = (fact.facts as unknown as { test08: { gates: { lint: { present: boolean } } } }).test08.gates.lint.present;
    expect(g).toBe(true);
  });
});

describe('abort degrade', () => {
  it('aborted signal returns cap error', async () => {
    const ac = new AbortController();
    ac.abort(new DOMException('budget-exceeded', 'AbortError'));
    const gh = ghFor({});
    const fact = await detectVel06({ owner: 'o', repo: 'r', gh, signal: ac.signal, toolVersions: new Map() });
    expect(fact.error?.kind).toBe('cap');
    expect(fact.truncated).toBe(true);
  });
});

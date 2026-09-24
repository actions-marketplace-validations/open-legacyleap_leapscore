import { describe, it, expect } from 'vitest';
import { runSurface } from '../surface/sync';
import type { SurfaceRestClient, TrackedIssue } from '../surface/rest';
import type { EnvelopeRow } from '../surface/rows';

/** In-memory GitHub issues stand-in: full SurfaceRestClient, zero network. */
function fakeClient() {
  const issues = new Map<number, { title: string; body: string; labels: string[]; state: 'open' | 'closed' }>();
  const comments = new Map<number, string[]>();
  let next = 1;
  const labels = new Set<string>(['leapscore']);
  const client: SurfaceRestClient = {
    request: async () => {
      throw new Error('no raw requests in fake');
    },
    async listIssues(_o, _r, wanted, _page) {
      return [...issues.entries()]
        .filter(([, i]) => wanted.every((l) => i.labels.includes(l)))
        .map(([number, i]) => ({ number, title: i.title, body: i.body, state: i.state }) as TrackedIssue);
    },
    async createIssue(_o, _r, input) {
      const number = next++;
      issues.set(number, { ...input, state: 'open' });
      return { number, title: input.title, body: input.body, state: 'open' as const };
    },
    async updateIssue(_o, _r, number, input) {
      const cur = issues.get(number)!;
      if (input.state) cur.state = input.state;
      if (input.labels) cur.labels = input.labels;
      if (input.body !== undefined) cur.body = input.body;
      return { number, title: cur.title, body: cur.body, state: cur.state };
    },
    async createComment(_o, _r, number, body) {
      comments.set(number, [...(comments.get(number) ?? []), body]);
    },
    async ensureLabel(_o, _r, name) {
      labels.add(name);
    },
    async getRepoPrivate() {
      return false;
    },
  };
  return { client, issues, comments, labels };
}

function row(id: string, score: number, status = 'measured'): EnvelopeRow {
  return {
    id,
    name: `Name ${id}`,
    category_id: id.split('-')[0],
    status,
    score,
    reason: `reason ${id}`,
    evidence: { tool: 't', pointers: [] },
    effort: 'e',
    remediation: { quick_win: 'q', structural: 's', gold_standard: 'g', effort: 'e' },
  };
}

const meta = { repoSha: 'sha1', engineSha7: 'eng1' };
const runner = { owner: 'o', repo: 'r', private: false };

describe('runSurface end-to-end (in-memory)', () => {
  it('opens once, then dedupes: second identical run opens 0', async () => {
    const { client, comments } = fakeClient();
    const report = { full_table: [row('SEC-01', 0), row('VEL-06', 2)], gates: [] };
    const target = { normalized: 'a/b', slug: 'a-b', private: false };
    const first = await runSurface({ report, meta, runner, target, client, runUrl: 'https://x/1' });
    expect(first.counts.opened).toBe(2);
    expect(first.firstScan).toBe(true);
    expect(first.summaryLine).toBe('surface: 2 opened / 0 commented / 0 closed / 0 skipped');
    expect(first.stepSummary).toContain('First-scan burst');
    const second = await runSurface({ report, meta, runner, target, client, runUrl: 'https://x/2' });
    expect(second.counts.opened).toBe(0);
    expect(second.firstScan).toBe(false);
    expect(second.warnings).toEqual([]);
    expect([...comments.values()].flat().length).toBe(0);
  });
  it('band change comments + closes greens with provenance links', async () => {
    const { client, comments } = fakeClient();
    const target = { normalized: 'a/b', slug: 'a-b', private: false };
    await runSurface({ report: { full_table: [row('SEC-01', 0)], gates: [] }, meta, runner, target, client, runUrl: 'https://x/1' });
    const res = await runSurface({
      report: { full_table: [row('SEC-01', 2), row('VEL-06', 3)], gates: [] },
      meta: { repoSha: 'sha2', engineSha7: 'eng1' },
      runner,
      target,
      client,
      runUrl: 'https://x/2',
    });
    expect(res.counts.commented).toBe(1);
    expect(res.counts.closed).toBe(0);
    const bodies = [...comments.values()].flat().join('\n');
    expect(bodies).toContain('Red→Yellow');
    expect(bodies).toContain('sha2');
    expect(bodies).toContain('https://x/2');
  });
  it('isolates targets sharing one runner repo', async () => {
    const { client, issues } = fakeClient();
    const mkTarget = (t: string, s: string) => ({ normalized: t, slug: s, private: false });
    await runSurface({ report: { full_table: [row('SEC-01', 0)], gates: [] }, meta, runner, target: mkTarget('a/b-c', 'a-b-c'), client });
    await runSurface({ report: { full_table: [row('SEC-01', 0)], gates: [] }, meta, runner, target: mkTarget('a-b/c', 'a-b-c'), client });
    const bodies = [...issues.values()].map((i) => i.body);
    expect(bodies.filter((b) => b.includes('target=a/b-c'))).toHaveLength(1);
    expect(bodies.filter((b) => b.includes('target=a-b/c'))).toHaveLength(1);
  });
  it('guardrail blocks private-target/public-runner with zero writes', async () => {
    const { client, issues } = fakeClient();
    const res = await runSurface({
      report: { full_table: [row('SEC-01', 0)], gates: [] },
      meta,
      runner,
      target: { normalized: 'priv/t', slug: 'priv-t', private: true },
      client,
    });
    expect(res.skippedReason).toBe('private-target/public-runner');
    expect(issues.size).toBe(0);
    expect(res.stepSummary).toContain('surface-skipped: private-target/public-runner');
  });
});

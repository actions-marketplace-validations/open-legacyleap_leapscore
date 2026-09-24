import { describe, it, expect } from 'vitest';
import {
  createSurfaceRestClient,
  throttledWrite,
  isRateLimit,
} from '../surface/rest';
import type { FetchImpl } from '../surface/rest';
import { buildDiscoveryMap } from '../surface/discover';
import { buildToken } from '../surface/identity';

function headersOf(init?: Record<string, string>): Headers {
  return new Headers(init);
}

function stubFetch(handler: (url: string, init: { method?: string; body?: string }) => { status: number; json: unknown }): FetchImpl {
  return (async (url: unknown, init: unknown) => {
    const { status, json } = handler(String(url), init as { method?: string; body?: string });
    return { status, headers: headersOf(), json: async () => json } as unknown as Response;
  }) as FetchImpl;
}

describe('isRateLimit', () => {
  it('flags 429 and abuse/rate 403s only', () => {
    expect(isRateLimit(429, {})).toBe(true);
    expect(isRateLimit(403, { message: 'You have exceeded a secondary rate limit' })).toBe(true);
    expect(isRateLimit(403, { message: 'API rate limit exceeded' })).toBe(true);
    expect(isRateLimit(403, { message: 'Resource not accessible' })).toBe(false);
    expect(isRateLimit(500, {})).toBe(false);
  });
});

describe('surface REST client (2.1)', () => {
  it('lists with label scope + state=all and paginates', async () => {
    const seen: string[] = [];
    const client = createSurfaceRestClient({
      fetchImpl: stubFetch((url, init) => {
        seen.push(`${init.method} ${url}`);
        const u = new URL(url);
        const page = Number(u.searchParams.get('page'));
        return {
          status: 200,
          json: page === 1 ? [{ number: 1, title: 't', body: 'b', state: 'open' }] : [],
        };
      }),
    });
    const issues = await client.listIssues('o', 'r', ['leapscore', 'leapscore:target-a-b'], 1);
    expect(issues).toEqual([{ number: 1, title: 't', body: 'b', state: 'open' }]);
    expect(seen[0]).toContain('/repos/o/r/issues?');
    expect(seen[0]).toContain('state=all');
    expect(seen[0]).toContain('labels=leapscore');
  });
  it('creates/updates/comments with shapes', async () => {
    const calls: Array<{ method?: string; url: string; body?: string }> = [];
    const client = createSurfaceRestClient({
      fetchImpl: stubFetch((url, init) => {
        calls.push({ method: init.method, url, body: init.body });
        return { status: 200, json: { number: 7, title: 't', body: 'b', state: 'open' } };
      }),
    });
    await client.createIssue('o', 'r', { title: 't', body: 'b', labels: ['leapscore'] });
    await client.updateIssue('o', 'r', 7, { state: 'closed', labels: ['leapscore'] });
    await client.createComment('o', 'r', 7, 'hi');
    expect(calls[0].url).toBe('https://api.github.com/repos/o/r/issues');
    expect(JSON.parse(calls[1].body!).state).toBe('closed');
    expect(calls[2].url).toBe('https://api.github.com/repos/o/r/issues/7/comments');
  });
  it('ensureLabel creates on 404 and tolerates 422 races', async () => {
    let posts = 0;
    const mk = (createStatus: number) =>
      createSurfaceRestClient({
        fetchImpl: stubFetch((url, init) => {
          if (init.method === 'GET') return { status: 404, json: { message: 'Not Found' } };
          posts += 1;
          return { status: createStatus, json: {} };
        }),
      });
    await mk(201).ensureLabel('o', 'r', 'leapscore');
    expect(posts).toBe(1);
    await mk(422).ensureLabel('o', 'r', 'leapscore');
    expect(posts).toBe(2);
    await expect(mk(500).ensureLabel('o', 'r', 'leapscore')).rejects.toThrow(/label create failed/);
  });
  it('throws typed errors on failure', async () => {
    const client = createSurfaceRestClient({
      fetchImpl: stubFetch(() => ({ status: 500, json: { message: 'boom' } })),
    });
    await expect(client.listIssues('o', 'r', ['x'], 1)).rejects.toThrow(/list issues failed: 500/);
  });
});

describe('throttledWrite (2.2)', () => {
  it('retries once on 429 then succeeds', async () => {
    let calls = 0;
    const r = await throttledWrite(
      async () => {
        calls += 1;
        if (calls === 1) throw Object.assign(new Error('rate limited: 429'), { status: 429, body: {} });
        return 'ok';
      },
      { backoffBaseMs: 1, sleep: async () => {} },
    );
    expect(r).toEqual({ ok: true, value: 'ok' });
    expect(calls).toBe(2);
  });
  it('records shortfall after retry fails', async () => {
    let calls = 0;
    const r = await throttledWrite(
      async () => {
        calls += 1;
        throw Object.assign(new Error('boom'), { status: 500, body: {} });
      },
      { backoffBaseMs: 1, sleep: async () => {} },
    );
    expect(r.ok).toBe(false);
    expect(calls).toBe(1);
  });
  it('does not retry non-rate errors', async () => {
    let calls = 0;
    const r = await throttledWrite(async () => {
      calls += 1;
      throw Object.assign(new Error('validation failed'), { status: 422, body: {} });
    });
    expect(r.ok).toBe(false);
    expect(calls).toBe(1);
  });
});

function fakeClient(pages: Array<Array<{ number: number; title: string; body: string; state: 'open' | 'closed' }>>) {
  return {
    async listIssues(_o: string, _r: string, _l: string[], page: number) {
      return pages[page - 1] ?? [];
    },
  } as never;
}

describe('buildDiscoveryMap (2.3)', () => {
  const target = 'django/django';
  it('keeps token matches, ignores lookalikes and foreign targets', async () => {
    const client = fakeClient([
      [
        { number: 1, title: 't', body: buildToken(target, 'SEC-01'), state: 'open' },
        { number: 2, title: 'human', body: 'please fix', state: 'open' },
        { number: 3, title: 'other', body: buildToken('flask/flask', 'SEC-01'), state: 'open' },
        { number: 4, title: 'renamed', body: `renamed title\n${buildToken(target, 'SEC-02')}`, state: 'closed' },
      ],
    ]);
    const { map, warnings } = await buildDiscoveryMap(client, 'o', 'r', 'django-django', target);
    expect([...map.keys()]).toEqual(['SEC-01', 'SEC-02']);
    expect(map.get('SEC-01')!.number).toBe(1);
    expect(map.get('SEC-02')!.state).toBe('closed');
    expect(warnings).toEqual([]);
  });
  it('first-match wins on duplicates with a warning', async () => {
    const client = fakeClient([
      [
        { number: 1, title: 'a', body: buildToken(target, 'SEC-01'), state: 'open' },
        { number: 9, title: 'copy', body: buildToken(target, 'SEC-01'), state: 'open' },
      ],
    ]);
    const { map, warnings } = await buildDiscoveryMap(client, 'o', 'r', 'django-django', target);
    expect(map.get('SEC-01')!.number).toBe(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('#1 wins, #9 ignored');
  });
  it('paginates past full pages', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({
      number: i + 1,
      title: `t${i}`,
      body: buildToken(target, `SEC-${String(i + 1).padStart(2, '0')}`),
      state: 'open' as const,
    }));
    const client = fakeClient([full, [{ number: 101, title: 'last', body: buildToken(target, 'VEL-06'), state: 'open' as const }]]);
    const { map } = await buildDiscoveryMap(client, 'o', 'r', 'django-django', target);
    expect(map.size).toBe(101);
    expect(map.get('VEL-06')!.number).toBe(101);
  });
});

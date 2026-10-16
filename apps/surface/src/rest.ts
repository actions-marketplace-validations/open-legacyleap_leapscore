/**
 * apps/surface/src/rest.ts — isolated REST client for issue sync (plan 15 §9).
 *
 * Separate from gh.ts on purpose: scan-reads use gh.ts rate-limit retry tuned for
 * short detector calls; writes need abuse-limit-aware backoff and must not inherit
 * detector timeouts. Transport is injectable (fetchImpl) so unit tests stub it and
 * the detector-isolation check keeps passing.
 */

export type FetchImpl = typeof fetch;

export type RestResponse = {
  status: number;
  json: unknown;
  headers: Headers;
  ok: boolean;
};

export type RestRequest = (method: string, path: string, body?: unknown) => Promise<RestResponse>;

export type RestClientOptions = {
  token?: string;
  /** Injectable transport; defaults to the global fetch. */
  fetchImpl?: FetchImpl;
  userAgent?: string;
};

function apiUrl(path: string): string {
  return `https://api.github.com${path}`;
}

/** True for 429 or 403s carrying a rate/abuse-limit message. */
export function isRateLimit(status: number, json: unknown): boolean {
  if (status === 429) return true;
  if (status !== 403) return false;
  const msg = String((json as { message?: unknown } | null)?.message ?? '').toLowerCase();
  return msg.includes('rate limit') || msg.includes('abuse') || msg.includes('secondary');
}

function retryAfterMs(headers: Headers): number | undefined {
  const v = headers.get('retry-after');
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isNaN(n)) return n * 1000;
  const d = Date.parse(v);
  if (!Number.isNaN(d)) return Math.max(0, d - Date.now());
  return undefined;
}

export function createRestRequest(opts: RestClientOptions = {}): RestRequest {
  const impl: FetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
  const ua = opts.userAgent ?? 'leapscore-surface/1.0';
  return async (method, path, body) => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': ua,
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await impl(apiUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json, headers: res.headers, ok: res.status >= 200 && res.status < 300 };
  };
}

export type TrackedIssue = {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
};

function toTrackedIssue(raw: unknown): TrackedIssue {
  const o = raw as { number: number; title: string; body?: string | null; state: string };
  return { number: o.number, title: o.title ?? '', body: o.body ?? '', state: o.state === 'closed' ? 'closed' : 'open' };
}

export type SurfaceRestClient = {
  request: RestRequest;
  listIssues(owner: string, repo: string, labels: string[], page: number): Promise<TrackedIssue[]>;
  createIssue(owner: string, repo: string, input: { title: string; body: string; labels: string[] }): Promise<TrackedIssue>;
  updateIssue(
    owner: string,
    repo: string,
    number: number,
    input: { state?: 'open' | 'closed'; labels?: string[]; body?: string },
  ): Promise<TrackedIssue>;
  createComment(owner: string, repo: string, number: number, body: string): Promise<void>;
  ensureLabel(owner: string, repo: string, name: string): Promise<void>;
  getRepoPrivate(owner: string, repo: string): Promise<boolean>;
};

export function createSurfaceRestClient(opts: RestClientOptions = {}): SurfaceRestClient {
  const request = createRestRequest(opts);
  return {
    request,
    async listIssues(owner, repo, labels, page) {
      const q = new URLSearchParams({
        labels: labels.join(','),
        state: 'all',
        per_page: '100',
        page: String(page),
        sort: 'created',
        direction: 'asc',
      });
      const res = await request('GET', `/repos/${owner}/${repo}/issues?${q}`);
      if (!res.ok) throw opError('list issues failed', res);
      return (res.json as unknown[]).map(toTrackedIssue);
    },
    async createIssue(owner, repo, input) {
      const res = await request('POST', `/repos/${owner}/${repo}/issues`, input);
      if (!res.ok) throw opError('create issue failed', res);
      return toTrackedIssue(res.json);
    },
    async updateIssue(owner, repo, number, input) {
      const res = await request('PATCH', `/repos/${owner}/${repo}/issues/${number}`, input);
      if (!res.ok) throw opError('update issue failed', res);
      return toTrackedIssue(res.json);
    },
    async createComment(owner, repo, number, body) {
      const res = await request('POST', `/repos/${owner}/${repo}/issues/${number}/comments`, { body });
      if (!res.ok) throw opError('comment failed', res);
    },
    async ensureLabel(owner, repo, name) {
      const existing = await request('GET', `/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`);
      if (existing.ok) return;
      if (existing.status !== 404) {
        throw opError('label lookup failed', existing);
      }
      const created = await request('POST', `/repos/${owner}/${repo}/labels`, { name, color: '0E8A16', description: 'LeapScore tracker' });
      // 422 = raced creation; anything else non-ok is real.
      if (!created.ok && created.status !== 422) {
        throw opError('label create failed', created);
      }
    },
    async getRepoPrivate(owner, repo) {
      const res = await request('GET', `/repos/${owner}/${repo}`);
      if (!res.ok) throw opError('get repo failed', res);
      return Boolean((res.json as { private?: boolean }).private);
    },
  };
}

export type ThrottleOptions = {
  backoffBaseMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

export type ThrottledResult<T> = { ok: true; value: T } | { ok: false; error: string };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function errorDetail(e: unknown): { status?: number; body?: unknown; headers?: Headers; message: string } {
  const err = e as { status?: number; body?: unknown; headers?: Headers; message?: string };
  return { status: err?.status, body: err?.body, headers: err?.headers, message: String(err?.message ?? e) };
}

function opError(message: string, res: RestResponse): Error {
  return Object.assign(new Error(`${message}: ${res.status}`), { status: res.status, body: res.json, headers: res.headers });
}

/**
 * Run one write with a single retry on rate-limit signals, then record the
 * shortfall (warn-only per plan 15 §10 — callers continue the sync).
 */
export async function throttledWrite<T>(fn: () => Promise<T>, opts: ThrottleOptions = {}): Promise<ThrottledResult<T>> {
  const sleep = opts.sleep ?? defaultSleep;
  const base = opts.backoffBaseMs ?? 1000;
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    const d = errorDetail(e);
    if (d.status !== undefined && !isRateLimit(d.status, d.body)) {
      return { ok: false, error: d.message.slice(0, 300) };
    }
    const wait = (d.headers && retryAfterMs(d.headers)) ?? base;
    await sleep(wait);
    try {
      return { ok: true, value: await fn() };
    } catch (e2) {
      return { ok: false, error: errorDetail(e2).message.slice(0, 300) };
    }
  }
}



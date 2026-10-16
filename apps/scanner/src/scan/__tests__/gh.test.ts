import { describe, it, expect, vi } from 'vitest';
import { createGhClient, GhRateLimitError } from '../gh';

function mockFetch(sequence: Array<{ status: number; body: unknown; headers?: Record<string, string> }>) {
  let i = 0;
  return vi.fn(async () => {
    const entry = sequence[i++] ?? sequence[sequence.length - 1];
    const headers = new Headers(entry.headers ?? {});
    return new Response(JSON.stringify(entry.body), { status: entry.status, headers }) as Response;
  });
}

describe('gh client retry-after backoff', () => {
  it('retries 403 rate-limit with Retry-After then succeeds', async () => {
    const fetchImpl = mockFetch([
      { status: 403, body: { message: 'API rate limit exceeded' }, headers: { 'retry-after': '0', 'x-ratelimit-remaining': '0' } },
      { status: 200, body: { id: 1 }, headers: { 'x-ratelimit-remaining': '59' } },
    ]);
    const gh = createGhClient({ fetchImpl: fetchImpl as unknown as typeof fetch, backoffMs: 1, timeoutMs: 5000 });
    const data = await gh.request('/repos/foo/bar');
    expect(data).toEqual({ id: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(gh.lastState().remaining).toBe(59);
  });

  it('retries with exponential backoff when no Retry-After', async () => {
    const fetchImpl = mockFetch([
      { status: 403, body: { message: 'rate limit exceeded for url' }, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 1) } },
      { status: 200, body: { ok: true } },
    ]);
    const gh = createGhClient({ fetchImpl: fetchImpl as unknown as typeof fetch, backoffMs: 2, timeoutMs: 5000 });
    const data = await gh.request('/repos/a/b');
    expect(data).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws GhRateLimitError after max retries', async () => {
    const fetchImpl = mockFetch([
      { status: 403, body: { message: 'rate limit exceeded' }, headers: { 'retry-after': '0' } },
      { status: 403, body: { message: 'rate limit exceeded' }, headers: { 'retry-after': '0' } },
      { status: 403, body: { message: 'rate limit exceeded' }, headers: { 'retry-after': '0' } },
      { status: 403, body: { message: 'rate limit exceeded' }, headers: { 'retry-after': '0' } },
    ]);
    const gh = createGhClient({ fetchImpl: fetchImpl as unknown as typeof fetch, maxRetries: 2, backoffMs: 1, timeoutMs: 5000 });
    await expect(gh.request('/repos/x/y')).rejects.toBeInstanceOf(GhRateLimitError);
  });

  it('respects abort signal', async () => {
    const fetchImpl = vi.fn(async (_url: string, opts: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        opts.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    const gh = createGhClient({ fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 5000 });
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 10);
    await expect(gh.request('/repos/foo/bar', undefined, { signal: ac.signal })).rejects.toThrow();
  });
});

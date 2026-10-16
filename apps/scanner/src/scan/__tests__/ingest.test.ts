import { describe, it, expect, vi } from 'vitest';
import { normalizeRepoUrl, ingestRepoUrl } from '../ingest';

function mockGh(data: unknown, shouldThrow?: Error) {
  return {
    request: vi.fn(async () => {
      if (shouldThrow) throw shouldThrow;
      return data;
    }),
  } as unknown as import('../detector').RateLimitedGhClient;
}

describe('normalizeRepoUrl', () => {
  it('strips tree tail', () => {
    expect(normalizeRepoUrl('https://github.com/vercel/next.js/tree/canary')).toEqual({ owner: 'vercel', repo: 'next.js' });
  });
  it('strips .git and slash', () => {
    expect(normalizeRepoUrl('https://github.com/foo/bar.git/')).toEqual({ owner: 'foo', repo: 'bar' });
    expect(normalizeRepoUrl('github.com/foo/bar')).toEqual({ owner: 'foo', repo: 'bar' });
  });
  it('rejects non-github host', () => {
    expect(normalizeRepoUrl('https://gitlab.com/foo/bar')).toBeNull();
  });
});

describe('ingestRepoUrl', () => {
  it('valid public url normalizes', async () => {
    const gh = mockGh({ private: false, full_name: 'vercel/next.js' });
    const r = await ingestRepoUrl('https://github.com/vercel/next.js/tree/canary', gh);
    expect(r).toEqual({ ok: true, owner: 'vercel', repo: 'next.js', normalized: 'vercel/next.js' });
  });
  it('unsupported host without network call', async () => {
    const gh = mockGh({});
    const r = await ingestRepoUrl('https://gitlab.com/foo/bar', gh);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unsupported_host');
    expect(gh.request).not.toHaveBeenCalled();
  });
  it('private repo refused', async () => {
    const gh = mockGh({ private: true });
    const r = await ingestRepoUrl('https://github.com/org/private', gh);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('private_requires_app');
  });
  it('404 not found', async () => {
    const gh = mockGh(null, new Error('GH 404 /repos/x/y: Not Found'));
    const r = await ingestRepoUrl('https://github.com/x/y', gh);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_found');
  });
  it('invalid url', async () => {
    const gh = mockGh({});
    const r = await ingestRepoUrl('not a url', gh);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_url');
  });
});

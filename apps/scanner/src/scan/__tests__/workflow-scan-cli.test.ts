import { describe, it, expect } from 'vitest';
import { parseArgs, validateRepo, exitCodeForReason, main } from '../../../bin/scan';
import { resolveEngineSha7 } from '../scoring/seal';

describe('parseArgs', () => {
  it('parses space and equals forms', () => {
    expect(parseArgs(['--repo', 'a/b', '--out', 'f.json'])).toMatchObject({ repo: 'a/b', out: 'f.json' });
    expect(parseArgs(['--repo=a/b', '--out=f.json', '--sha=', '--engine-ref=abc1234'])).toMatchObject({
      repo: 'a/b',
      out: 'f.json',
      sha: '',
      engineRef: 'abc1234',
    });
  });
  it('rejects unknown flags', () => {
    expect(() => parseArgs(['--bogus'])).toThrow();
  });
});

describe('validateRepo', () => {
  it('accepts owner/repo', () => {
    expect(validateRepo('vercel/next.js')).toBe('vercel/next.js');
    expect(validateRepo('my-org/my-repo')).toBe('my-org/my-repo');
  });
  it('rejects URL forms with helpful message', () => {
    expect(() => validateRepo('https://github.com/vercel/next.js')).toThrow(/without https/);
    expect(() => validateRepo('vercel/next.js.git')).toThrow(/without \.git/);
    expect(() => validateRepo('not-a-repo')).toThrow(/owner\/repo/);
    expect(() => validateRepo('')).toThrow(/missing --repo/);
  });
});

describe('exitCodeForReason', () => {
  it('maps refusals to 2 and crashes to 1', () => {
    for (const r of ['not_found', 'private_requires_app', 'rate-limited', 'unsupported_host', 'invalid_url', 'missing_repo']) {
      expect(exitCodeForReason(r)).toBe(2);
    }
    expect(exitCodeForReason('crash')).toBe(1);
  });
});

describe('resolveEngineSha7 order', () => {
  const noGit = () => {
    throw new Error('no git');
  };
  it('prefers LEAPSCORE_SHA, then engineRef, then unknown', () => {
    expect(resolveEngineSha7({ env: { LEAPSCORE_SHA: 'abc1234567' }, execImpl: noGit })).toBe('abc1234');
    expect(resolveEngineSha7({ env: {}, engineRef: 'def567890', execImpl: noGit })).toBe('def5678');
    expect(resolveEngineSha7({ env: {}, execImpl: noGit })).toBe('unknown');
  });
});

describe('main arg paths (no network)', () => {
  async function run(argv: string[]) {
    const out: string[] = [];
    const err: string[] = [];
    const code = await main(argv, {
      env: {},
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    return { code, out, err };
  }
  it('--help exits 0', async () => {
    const r = await run(['--help']);
    expect(r.code).toBe(0);
    expect(r.out.join('\n')).toContain('--repo');
  });
  it('non-empty --sha exits 2 without scanning', async () => {
    const r = await run(['--repo', 'a/b', '--sha', 'abc', '--out', '/tmp/never.json']);
    expect(r.code).toBe(2);
    expect(r.err.join('\n')).toMatch(/pinning not yet supported/);
  });
  it('bad repo form exits 2', async () => {
    const r = await run(['--repo', 'https://github.com/a/b', '--out', '/tmp/never.json']);
    expect(r.code).toBe(2);
  });
  it('missing --out exits 2', async () => {
    const r = await run(['--repo', 'a/b']);
    expect(r.code).toBe(2);
  });
});

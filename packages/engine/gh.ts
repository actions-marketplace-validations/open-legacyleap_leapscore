/** packages/engine/gh.ts — Rate-limited GitHub client (spec scan-phase-1: Rate-limited GitHub client) */
// Only file in engine that may call fetch (isolated via check:detector-isolation).

export type GhProvenance = {
  remaining?: number;
  reset?: number;
  retryAfterMs?: number;
};

export type GhRequestOpts = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export type RateLimitedGhClient = {
  /** Generic request — path like "/repos/{owner}/{repo}" or full GH API path without host. */
  request(path: string, params?: Record<string, string>, opts?: GhRequestOpts): Promise<unknown>;
  /** Convenience: GET /repos/{owner}/{repo} */
  getRepo(owner: string, repo: string, opts?: GhRequestOpts): Promise<unknown>;
  /** Low-level fetch for contents / pulls with pagination support */
  fetchJson(path: string, opts?: GhRequestOpts): Promise<{ data: unknown; headers: Headers }>;
  /** Last observed rate-limit state (for provenance) */
  lastState(): GhProvenance;
};

export type GhClientOptions = {
  token?: string;
  baseUrl?: string;
  /** Max retries on 403 rate-limit (default 3) */
  maxRetries?: number;
  /** Base backoff ms for exponential fallback when Retry-After absent (default 1000) */
  backoffMs?: number;
  /** Per-request timeout ms (default 4000, matches design: per-call 4s) */
  timeoutMs?: number;
  /** For testing: inject fetch */
  fetchImpl?: typeof fetch;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }
  });
}

function parseRetryAfter(headers: Headers): number | undefined {
  const v = headers.get('retry-after');
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isNaN(n)) return n * 1000;
  const d = Date.parse(v);
  if (!Number.isNaN(d)) return Math.max(0, d - Date.now());
  return undefined;
}

// Simple token-bucket: serial queue with delay when remaining==0
class TokenBucket {
  private queue: (() => void)[] = [];
  private running = false;
  private resetAt = 0;

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        try {
          const v = await fn();
          resolve(v);
          this.next();
        } catch (e) {
          reject(e);
          this.next();
        }
      };
      if (!this.running && Date.now() >= this.resetAt) {
        this.running = true;
        run();
      } else {
        this.queue.push(() => { this.running = true; run(); });
        if (this.resetAt > Date.now()) {
          setTimeout(() => this.next(), Math.max(0, this.resetAt - Date.now()));
        }
      }
    });
  }

  setReset(ms: number) {
    this.resetAt = Date.now() + ms;
  }

  private next() {
    const fn = this.queue.shift();
    if (fn) setTimeout(fn, 0);
    else this.running = false;
  }
}

export function createGhClient(opts: GhClientOptions = {}): RateLimitedGhClient {
  const baseUrl = (opts.baseUrl ?? 'https://api.github.com').replace(/\/$/, '');
  const fetchImpl: typeof fetch = opts.fetchImpl ?? fetch;
  const maxRetries = opts.maxRetries ?? 3;
  const backoffMs = opts.backoffMs ?? 1000;
  const timeoutMs = opts.timeoutMs ?? 4000;
  const bucket = new TokenBucket();
  let last: GhProvenance = {};

  async function doFetch(path: string, reqOpts?: GhRequestOpts): Promise<{ data: unknown; headers: Headers }> {
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(reqOpts?.headers ?? {}),
    };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (reqOpts?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const combinedSignal = reqOpts?.signal
        ? (() => {
            const ac = new AbortController();
            const onAbort = () => ac.abort((reqOpts.signal as AbortSignal).reason ?? new DOMException('Aborted', 'AbortError'));
            if (reqOpts.signal!.aborted) ac.abort((reqOpts.signal as AbortSignal).reason);
            else reqOpts.signal!.addEventListener('abort', onAbort, { once: true });
            controller.signal.addEventListener('abort', () => ac.abort(controller.signal.reason), { once: true });
            return ac.signal;
          })()
        : controller.signal;

      let res: Response;
      try {
        res = await fetchImpl(url, { headers, signal: combinedSignal });
      } finally {
        clearTimeout(t);
      }

      const remaining = res.headers.get('x-ratelimit-remaining');
      const reset = res.headers.get('x-ratelimit-reset');
      if (remaining !== null) last.remaining = Number(remaining);
      if (reset !== null) last.reset = Number(reset);

      if (res.status === 403) {
        const bodyText = await res.clone().text().catch(() => '');
        const isRateLimit = /rate limit/i.test(bodyText) || remaining === '0' || res.headers.has('retry-after');
        if (isRateLimit && attempt < maxRetries) {
          const retryAfter = parseRetryAfter(res.headers);
          const waitMs = retryAfter ?? backoffMs * Math.pow(2, attempt);
          last.retryAfterMs = waitMs;
          if (remaining === '0' && reset) {
            const resetMs = Number(reset) * 1000 - Date.now();
            bucket.setReset(Math.max(waitMs, resetMs > 0 ? resetMs : waitMs));
          }
          await sleep(waitMs, reqOpts?.signal);
          continue;
        }
        // Return error payload for detectors to map to rate-limit kind
        const body = await res.text().catch(() => '');
        const err = new GhRateLimitError(`GH 403 ${path}: ${body.slice(0, 200)}`, res.headers);
        throw err;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`GH ${res.status} ${path}: ${body.slice(0, 300)}`);
      }
      const data = (await res.json().catch(() => null)) as unknown;
      return { data, headers: res.headers };
    }
    throw new Error(`GH max retries exceeded for ${path}`);
  }

  return {
    async request(path: string, params?: Record<string, string>, opts?: GhRequestOpts) {
      const q = params && Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
      return bucket.enqueue(async () => {
        const { data } = await doFetch(`${path}${q}`, opts);
        return data;
      });
    },
    async getRepo(owner: string, repo: string, opts?: GhRequestOpts) {
      return bucket.enqueue(async () => {
        const { data } = await doFetch(`/repos/${owner}/${repo}`, opts);
        return data;
      });
    },
    async fetchJson(path: string, opts?: GhRequestOpts) {
      return bucket.enqueue(() => doFetch(path, opts));
    },
    lastState() {
      return { ...last };
    },
  };
}

export class GhRateLimitError extends Error {
  headers: Headers;
  constructor(message: string, headers: Headers) {
    super(message);
    this.name = 'GhRateLimitError';
    this.headers = headers;
  }
}

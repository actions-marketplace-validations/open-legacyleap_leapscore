/** engine/queue.ts — worker/queue interface for Phase 2 (swappable to external queue) */
export type QueueJob<T> = {
  id: string;
  run: (signal: AbortSignal) => Promise<T>;
  signal: AbortSignal;
  abort: (reason?: unknown) => void;
};

export type Queue = {
  enqueue<T>(id: string, fn: (signal: AbortSignal) => Promise<T>, opts?: { timeoutMs?: number }): QueueJob<T> & { result: Promise<T> };
  size(): number;
};

export function createQueue(opts: { concurrency?: number } = {}): Queue {
  const concurrency = opts.concurrency ?? 2;
  let active = 0;
  const waiting: Array<() => void> = [];

  function tryRun() {
    if (active < concurrency && waiting.length) {
      const next = waiting.shift()!;
      active++;
      next();
    }
  }

  return {
    size() { return active + waiting.length; },
    enqueue<T>(id: string, fn: (signal: AbortSignal) => Promise<T>, o: { timeoutMs?: number } = {}) {
      const controller = new AbortController();
      if (o.timeoutMs) {
        const t = setTimeout(() => controller.abort(new DOMException('budget-exceeded', 'TimeoutError')), o.timeoutMs);
        if ((t as unknown as { unref?: () => void }).unref) (t as unknown as { unref: () => void }).unref!();
        controller.signal.addEventListener('abort', () => clearTimeout(t), { once: true });
      }
      let resolve!: (v: T) => void, reject!: (e: unknown) => void;
      const result = new Promise<T>((res, rej) => { resolve = res; reject = rej; });

      const run = async () => {
        try {
          const v = await fn(controller.signal);
          resolve(v);
        } catch (e) {
          reject(e);
        } finally {
          active--;
          tryRun();
        }
      };

      waiting.push(run);
      tryRun();

      return {
        id,
        run: fn,
        signal: controller.signal,
        abort: (reason?: unknown) => controller.abort(reason ?? new DOMException('aborted', 'AbortError')),
        result,
      };
    },
  };
}

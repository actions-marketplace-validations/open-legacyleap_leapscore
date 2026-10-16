import type { RawFact } from '../detector';
import { GhRateLimitError } from '../gh';

export function ghErrorKind(e: unknown): RawFact['error'] | undefined {
  if (e instanceof GhRateLimitError) return { kind: 'rate-limit', detail: e.message.slice(0, 300) };
  if (e instanceof DOMException) {
    if (e.name === 'AbortError' || e.name === 'TimeoutError') return { kind: 'cap', detail: e.message.slice(0, 200) };
  }
  if (e instanceof Error) {
    const m = e.message;
    if (m.includes(' 429 ') || /rate limit/i.test(m)) return { kind: 'rate-limit', detail: m.slice(0, 300) };
    if (m.includes('timeout') || m.includes('Abort')) return { kind: 'cap', detail: m.slice(0, 300) };
    if (m.includes('GH 5')) return { kind: 'cap', detail: m.slice(0, 300) };
    return { kind: 'crash', detail: m.slice(0, 300) };
  }
  return { kind: 'crash', detail: String(e).slice(0, 300) };
}

export function makeProvenance(endpoint: string, started: number) {
  return {
    tool: 'gh-api',
    version: 'gh-api/phase1',
    flags: [endpoint],
    durationMs: Date.now() - started,
  };
}

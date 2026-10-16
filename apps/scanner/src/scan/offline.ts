/** apps/scanner/src/scan/offline.ts — strict/offline network posture (spec: scan-local) */
import { ALLOWED_NETWORK_HOSTS, NETWORK_NEVER_SEND_RULE } from '@leapscore/contracts';

export { ALLOWED_NETWORK_HOSTS, NETWORK_NEVER_SEND_RULE };

export const STRICT_OFFLINE_MESSAGE =
  'strict offline mode: network attempt aborted — detectors must use vendored snapshots and emit unknown with a re-run hint where live data would be needed';

export class StrictOfflineError extends Error {
  constructor(detail = '') {
    super(`${STRICT_OFFLINE_MESSAGE}${detail ? ` (${detail})` : ''}`);
    this.name = 'StrictOfflineError';
  }
}

/** A fetch implementation that throws on any call — inject for `--strict` runs. */
export function createStrictFetch(): typeof fetch {
  const throwing = (async () => {
    throw new StrictOfflineError();
  }) as unknown as typeof fetch;
  return throwing;
}

/** Assert a URL's host is on the allowlist (default non-strict posture). */
export function assertAllowlistedUrl(raw: string): void {
  let host = '';
  try {
    host = new URL(raw).host.toLowerCase();
  } catch {
    throw new Error(`refused network URL (unparseable): ${raw.slice(0, 120)}`);
  }
  const ok = (ALLOWED_NETWORK_HOSTS as readonly string[]).some(
    (h) => host === h || host.endsWith(`.${h}`),
  );
  if (!ok) throw new Error(`refused network host ${host} — not on the allowlist`);
}

export const STRICT_RERUN_HINT =
  'live data unavailable (strict offline) — re-run without --strict for allowlisted registry/EOL/vuln lookups';

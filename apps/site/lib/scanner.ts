/**
 * Present-side scanner client config (scan-phase-1 spec).
 * The website never executes a scan; it streams the scanner service's
 * versioned NDJSON scan API cross-origin and renders the terminal frame
 * in place. No same-origin proxy exists.
 */

export function scannerBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SCANNER_URL;
  if (env && env.trim()) return env.trim().replace(/\/$/, "");
  return "http://localhost:4100";
}

export function scannerScanUrl(repo: string): string {
  return `${scannerBaseUrl()}/scan?repo=${encodeURIComponent(repo)}`;
}

export function scannerPermalinkUrl(runId: string): string {
  return `${scannerBaseUrl()}/reports/${encodeURIComponent(runId)}`;
}

const REFUSED_COPY: Record<string, { title: string; body: string }> = {
  unsupported_host: {
    title: "Unsupported host",
    body: "LeapScore scans public GitHub repos. Try a URL like vercel/next.js.",
  },
  not_found: {
    title: "Repo not found",
    body: "The repo is missing or invisible to the scanner. Check the name, or make it public.",
  },
  private_requires_app: {
    title: "Private repo needs access",
    body: "Private repos require app authorization. Try a public repo instead.",
  },
  "rate-limited": {
    title: "Scanner is busy",
    body: "Too many scans at once — the scanner throttled this request. Wait a moment and retry.",
  },
  crash: {
    title: "Scan failed",
    body: "The scanner hit an unexpected error before sealing. Retry the scan.",
  },
  missing_repo: {
    title: "Missing repo",
    body: "Provide ?repo=owner/repo to start a scan.",
  },
};

export function refusedCopy(reason: string): { title: string; body: string } {
  return REFUSED_COPY[reason] ?? { title: `Refused — ${reason}`, body: "The scanner refused this target. Retry or try another repo." };
}

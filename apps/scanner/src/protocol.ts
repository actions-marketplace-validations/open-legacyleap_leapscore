/**
 * Scan wire protocol (scan-api spec): versioned NDJSON frames over HTTP.
 * Vocabulary: meta | progress | trace | report (terminal) | refused (terminal).
 * Every frame carries `v` (protocol version). Exactly one terminal frame per
 * scan; nothing is emitted after it. Clients ignore unknown frame types.
 */
import { PROTOCOL_VERSION, isValidRunId } from "@leapscore/contracts";

export { PROTOCOL_VERSION };

export type FrameType = "meta" | "progress" | "trace" | "report" | "refused";

export type RefusedReason =
  | "unsupported_host"
  | "not_found"
  | "private_requires_app"
  | "rate-limited"
  | "crash"
  | "missing_repo"
  | "invalid_url";

export interface BaseFrame {
  v: number;
  type: string;
}

export function frame(type: FrameType, body: Record<string, unknown> = {}): string {
  return JSON.stringify({ v: PROTOCOL_VERSION, type, ...body }) + "\n";
}

export function refusedFrame(reason: RefusedReason, detail: string, repo?: string): string {
  return frame("refused", { reason, detail: detail.slice(0, 500), repo });
}

/** Parse one NDJSON line; returns null for blank lines. */
export function parseFrameLine(line: string): (BaseFrame & Record<string, unknown>) | null {
  if (!line.trim()) return null;
  return JSON.parse(line) as BaseFrame & Record<string, unknown>;
}

/** Validate a permalink runId before any store access (traversal-safe). */
export function validatePermalinkRunId(raw: string): { ok: true; runId: string } | { ok: false; status: 400 | 404 } {
  let runId: string;
  try {
    runId = decodeURIComponent(raw);
  } catch {
    return { ok: false, status: 400 };
  }
  if (!runId || runId.includes("/") || runId.includes("\\") || runId.includes("..")) {
    return { ok: false, status: 400 };
  }
  if (!isValidRunId(runId)) return { ok: false, status: 404 };
  return { ok: true, runId };
}

export const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

export const NDJSON_HEADERS: Record<string, string> = {
  "content-type": "application/x-ndjson",
  "cache-control": "no-cache, no-store",
  ...CORS_HEADERS,
};

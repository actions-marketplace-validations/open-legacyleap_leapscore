/**
 * Scanner HTTP service: GET /scan (versioned NDJSON), GET /reports/:runId
 * (stable permalink), GET /health. Cross-origin by default; per-client
 * admission control; atomic single-write persistence; disconnect-safe.
 */
import http from "node:http";
import { execSync } from "node:child_process";
import {
  CONTRACT_VERSION,
  normalizeRepoForSlug,
  repoSlugFromUrl,
  resolveEngineSha7,
  type ReportEnvelope,
} from "@leapscore/contracts";
import { runUnifiedScan } from "@leapscore/engine/orchestrator.js";
import { sealScan } from "@leapscore/engine/seal.js";
import type { FactRecord } from "@leapscore/engine/facts.js";
import { AdmissionController } from "./admission.js";
import { CORS_HEADERS, NDJSON_HEADERS, frame, refusedFrame, validatePermalinkRunId } from "./protocol.js";
import { PROTOCOL_VERSION } from "./protocol.js";
import { getStoreDir, readEnvelope, writeEnvelope } from "./store.js";

const admission = new AdmissionController();

export function toScanUrl(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^github\.com\//i.test(t)) return `https://${t}`;
  return `https://github.com/${normalizeRepoForSlug(t)}`;
}

function normalizeKey(raw: string): string {
  return normalizeRepoForSlug(raw).toLowerCase();
}

type SealedResult = {
  report: unknown;
  meta: unknown;
  trace: Array<Record<string, unknown>>;
  budgetMs: number;
  totalCost: number;
};

const inflight = new Map<string, Promise<SealedResult>>();

function clientIp(req: http.IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

function send(res: http.ServerResponse, line: string): boolean {
  return res.write(line);
}

async function handleScan(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
  const repo = url.searchParams.get("repo");
  if (!repo || !repo.trim()) {
    res.writeHead(200, NDJSON_HEADERS);
    res.end(refusedFrame("missing_repo", "missing ?repo=owner/repo"));
    return;
  }

  const ip = clientIp(req);
  if (!admission.tryAdmit(ip)) {
    // Refused before any GH/clone work.
    res.writeHead(200, NDJSON_HEADERS);
    res.end(refusedFrame("rate-limited", "too many scans from this client — retry shortly", repo));
    return;
  }

  const key = normalizeKey(repo);
  const existing = inflight.get(key);
  if (existing) {
    res.writeHead(200, NDJSON_HEADERS);
    try {
      const cached = await existing;
      send(res, frame("meta", { budgetMs: cached.budgetMs, indicatorCount: 31, totalCost: cached.totalCost, milestone: `Coalesced — reusing in-flight scan for ${repo}` }));
      send(res, frame("progress", { pct: 100, elapsedMs: 0, remainingMs: 0, completedCost: cached.totalCost, totalCost: cached.totalCost, completedIds: [] }));
      send(res, frame("report", { report: cached.report, meta: cached.meta, trace: cached.trace }));
    } catch (e) {
      // A refused leader propagates its typed refusal (not a generic crash).
      const refused = (e as { refusedReason?: string; refusedDetail?: string }).refusedReason
        ? e as { refusedReason: string; refusedDetail: string }
        : null;
      if (refused) send(res, refusedFrame(refused.refusedReason as Parameters<typeof refusedFrame>[0], refused.refusedDetail, repo));
      else {
        const detail = e instanceof Error ? e.message : String(e);
        send(res, refusedFrame("crash", detail, repo));
      }
    }
    res.end();
    admission.release(ip);
    return;
  }

  let resolveLeader!: (v: SealedResult) => void;
  let rejectLeader!: (e: unknown) => void;
  const leader = new Promise<SealedResult>((res2, rej) => {
    resolveLeader = res2;
    rejectLeader = rej;
  });
  inflight.set(key, leader);
  // Prevent unhandled rejection when no follower awaits.
  leader.catch(() => {});

  res.writeHead(200, NDJSON_HEADERS);

  const startMs = Date.now();
  const trace: Array<Record<string, unknown>> = [];
  const pushTrace = (label: string, extra: Record<string, unknown> = {}) => {
    const elapsedMs = Date.now() - startMs;
    trace.push({ ts: elapsedMs, elapsedMs, label, ...extra });
  };
  let settled = false;
  const finish = (fn: () => void) => {
    if (settled) return;
    settled = true;
    try {
      fn();
    } finally {
      admission.release(ip);
      setTimeout(() => {
        if (inflight.get(key) === leader) inflight.delete(key);
      }, 5000);
    }
  };

  // Disconnect-safe: the scan runs to seal regardless; persistence is atomic
  // and happens exactly once, so an abort can never leave a partial envelope.
  req.on("close", () => {
    // No-op: intentionally keep running to seal so the run stays permalinkable.
  });

  try {
    pushTrace(`Starting scan — ${repo}`, { type: "start" });
    const scanUrl = toScanUrl(repo);
    const repoSlug = repoSlugFromUrl(repo);
    void repoSlug;
    const gen = runUnifiedScan(scanUrl);
    let finalFacts: FactRecord[] | undefined;
    let snapshot: unknown;
    let scanId: string | undefined;
    let budgetMs = 0;
    let totalCost = 0;
    let lastPct = 0;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let terminalSent = false;

    for await (const evt of gen) {
      if (res.writableEnded) break;
      if (evt.type === "meta") {
        budgetMs = evt.budgetMs ?? 0;
        totalCost = evt.totalCost ?? 0;
        send(res, frame("meta", { budgetMs, indicatorCount: evt.indicatorCount, breakdown: evt.breakdown, totalCost, milestone: evt.milestone }));
        pushTrace(`Budget ${Math.ceil(budgetMs / 1000)}s · ${evt.indicatorCount ?? 0} indicators`, { type: "meta", pct: 0 });
        if (evt.milestone) pushTrace(String(evt.milestone), { type: "milestone" });
        heartbeat = setInterval(() => {
          if (res.writableEnded) return;
          const elapsedMs = Date.now() - startMs;
          const remainingMs = Math.max(0, budgetMs - elapsedMs);
          const pct = Math.min(99, Math.round(((elapsedMs / Math.max(1, budgetMs)) * 100)));
          if (pct > lastPct) lastPct = pct;
          send(res, frame("progress", { pct: lastPct, elapsedMs, remainingMs, completedCost: 0, totalCost, completedIds: [] }));
        }, 2000);
        if (heartbeat && typeof (heartbeat as unknown as { unref?: () => void }).unref === "function") {
          (heartbeat as unknown as { unref: () => void }).unref?.();
        }
        continue;
      }
      if (evt.type === "progress") {
        lastPct = evt.pct ?? lastPct;
        send(res, frame("progress", { pct: evt.pct, elapsedMs: evt.elapsedMs, remainingMs: evt.remainingMs, completedCost: evt.completedCost, totalCost: evt.totalCost, completedIds: evt.completedIds, milestone: evt.milestone }));
        if (evt.milestone) pushTrace(String(evt.milestone), { type: "progress", pct: evt.pct, elapsedMs: evt.elapsedMs, remainingMs: evt.remainingMs, completedIds: evt.completedIds });
        continue;
      }
      if (evt.type === "trace") {
        const label = String(evt.label ?? evt.milestone ?? "");
        send(res, frame("trace", { ts: evt.elapsedMs ?? Date.now() - startMs, elapsedMs: evt.elapsedMs, label, phase: evt.phase, detectorId: evt.detectorId, durationMs: evt.durationMs, status: evt.status, errorKind: evt.errorKind }));
        pushTrace(label, { type: "trace", phase: evt.phase, detectorId: evt.detectorId, durationMs: evt.durationMs, status: evt.status, errorKind: evt.errorKind });
        continue;
      }
      if (evt.type === "refused") {
        if (heartbeat) clearInterval(heartbeat);
        const reason = String(evt.reason ?? "crash") as Parameters<typeof refusedFrame>[0];
        send(res, refusedFrame(reason, String(evt.detail ?? ""), repo));
        terminalSent = true;
        const err = Object.assign(new Error(`${evt.reason}: ${evt.detail}`), {
          refusedReason: String(evt.reason ?? "crash"),
          refusedDetail: String(evt.detail ?? ""),
        });
        rejectLeader(err);
        finish(() => res.end());
        return;
      }
      if (evt.type === "done") {
        finalFacts = evt.facts as FactRecord[];
        snapshot = evt.snapshot;
        scanId = evt.id;
        break;
      }
    }
    if (heartbeat) clearInterval(heartbeat);
    if (!finalFacts) {
      if (!terminalSent && !res.writableEnded) send(res, refusedFrame("crash", "no facts", repo));
      rejectLeader(new Error("no facts"));
      finish(() => res.end());
      return;
    }
    const rawSnapshot = (snapshot as Record<string, unknown>) ?? { repo, scanned_at: new Date().toISOString(), engine_version: "unified/1.0", rubric_version: "docs/rubric/@mvp" };
    const archetypeOverride = url.searchParams.get("archetype");
    const engineRef = process.env.LEAPSCORE_ENGINE_REF;
    const gitExec = (cmd: string): string =>
      execSync(cmd, { encoding: "utf8", timeout: 1500, stdio: ["ignore", "pipe", "ignore"] }).trim();
    const sealed = sealScan({
      facts: finalFacts,
      snapshot: rawSnapshot,
      budgetMs,
      startMs,
      trace: trace as never,
      archetypeOverride,
      engineRef,
      execImpl: gitExec,
      scanId,
      repo,
    });
    const envelope: ReportEnvelope = {
      meta: sealed.meta,
      report: sealed.report,
      trace: sealed.traceToPersist as never,
      contractVersion: CONTRACT_VERSION,
    };
    // Single atomic persist — exactly one envelope per runId.
    try {
      await writeEnvelope(envelope, getStoreDir());
    } catch (e) {
      console.warn("[scanner] persist failed", (e as Error).message);
    }
    const result: SealedResult = {
      report: sealed.report,
      meta: sealed.meta,
      trace: sealed.traceToPersist as unknown as Array<Record<string, unknown>>,
      budgetMs,
      totalCost,
    };
    resolveLeader(result);
    if (!res.writableEnded) {
      const elapsedMs = Date.now() - startMs;
      send(res, frame("progress", { pct: 100, elapsedMs, remainingMs: 0, completedCost: totalCost, totalCost, completedIds: [] }));
      // Terminal frame carries report + meta + ordered trace (self-sufficient;
      // byte-identical to the stored envelope).
      send(res, frame("report", { report: sealed.report, meta: sealed.meta, trace: sealed.traceToPersist }));
    }
    finish(() => res.end());
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    if (!res.writableEnded) send(res, refusedFrame("crash", detail, repo));
    rejectLeader(e);
    finish(() => res.end());
  }
}

async function handlePermalink(_req: http.IncomingMessage, res: http.ServerResponse, runIdRaw: string): Promise<void> {
  const v = validatePermalinkRunId(runIdRaw);
  if (!v.ok) {
    const code = v.status;
    res.writeHead(code, { "content-type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: code === 400 ? "invalid runId" : "not found" }));
    return;
  }
  const env = await readEnvelope(v.runId, getStoreDir());
  if (!env) {
    res.writeHead(404, { "content-type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", ...CORS_HEADERS });
  res.end(JSON.stringify(env));
}

export function createServer(): http.Server {
  return http.createServer((req, res) => {
    const host = req.headers.host ?? "localhost";
    const url = new URL(req.url ?? "/", `http://${host}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }
    if (url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ ok: true, protocol: PROTOCOL_VERSION, contract: CONTRACT_VERSION }));
      return;
    }
    if (url.pathname === "/scan" && req.method === "GET") {
      void handleScan(req, res, url);
      return;
    }
    const m = url.pathname.match(/^\/reports\/(.+)$/);
    if (m && req.method === "GET") {
      void handlePermalink(req, res, m[1]);
      return;
    }
    res.writeHead(404, { "content-type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "not found" }));
  });
}

export function resolveScannerEngineSha7(): string {
  // Explicit-reference path only: LEAPSCORE_ENGINE_REF (or LEAPSCORE_SHA) →
  // scanner checkout commit → literal unknown. Never a consumer directory.
  return resolveEngineSha7({
    env: process.env,
    execImpl: (cmd: string) => execSync(cmd, { encoding: "utf8", timeout: 1500, stdio: ["ignore", "pipe", "ignore"] }).trim(),
  });
}

const port = Number(process.env.SCANNER_PORT ?? 4100);
if (process.env.SCANNER_NO_LISTEN !== "1") {
  const server = createServer();
  server.listen(port, () => {
    console.log(`[scanner] listening on :${port} store=${getStoreDir()} engine=${resolveScannerEngineSha7()}`);
  });
}

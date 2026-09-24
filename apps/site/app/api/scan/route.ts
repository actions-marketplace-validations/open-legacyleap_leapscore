import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Single-flight for StrictMode double-fetch: concurrent GETs for same repo share one scan
// and produce exactly one persisted file. Keyed by normalized repo (owner/repo lowercased).
const inflightServerScans = new Map<string, Promise<{ report: unknown; meta: unknown; trace: import("@/lib/reports").TraceEntry[]; budgetMs: number; totalCost: number }>>();

function normalizeRepoKey(raw: string): string {
  const cleaned = raw.trim().replace(/^https?:\/\//, "").replace(/^github\.com\//i, "").replace(/\.git$/i, "");
  const withoutQuery = cleaned.split(/[?#]/)[0];
  const parts = withoutQuery.split("/").filter(Boolean);
  if (parts.length < 2) return raw.toLowerCase();
  return `${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
}

export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");
  if (!repo) return new Response(JSON.stringify({ type: "refused", reason: "missing_repo", detail: "missing ?repo=owner/repo" }), { status: 400, headers: { "content-type": "application/json" } });
  const key = normalizeRepoKey(repo);
  // Single-flight: if a scan for this repo is already in progress, coalesce to it
  if (inflightServerScans.has(key)) {
    const cachedPromise = inflightServerScans.get(key)!;
    const encoder2 = new TextEncoder();
    const stream2 = new ReadableStream({
      async start(controller2) {
        const send2 = (o: unknown) => controller2.enqueue(encoder2.encode(JSON.stringify(o) + "\n"));
        try {
          const cached = await cachedPromise;
          // Replay minimal events + final report (client will still see progress 100)
          send2({ type: "meta", budgetMs: cached.budgetMs, indicatorCount: 31, totalCost: cached.totalCost, milestone: `Coalesced — reusing in-flight scan for ${repo}` });
          send2({ type: "progress", pct: 100, elapsedMs: Date.now() - Date.now(), remainingMs: 0, completedCost: cached.totalCost, totalCost: cached.totalCost, completedIds: [] });
          send2({ type: "report", report: cached.report, meta: cached.meta, trace: cached.trace });
        } catch (e) {
          const detail = e instanceof Error ? e.message : String(e);
          send2({ type: "refused", reason: "crash", detail: detail.slice(0, 500), repo });
        } finally {
          controller2.close();
        }
      },
    });
    return new Response(stream2, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-cache, no-store" } });
  }

  // Leader: create deferred that followers will await
  let resolveLeader: (v: { report: unknown; meta: unknown; trace: import("@/lib/reports").TraceEntry[]; budgetMs: number; totalCost: number }) => void = () => {};
  let rejectLeader: (e: unknown) => void = () => {};
  const leaderPromise = new Promise<{ report: unknown; meta: unknown; trace: import("@/lib/reports").TraceEntry[]; budgetMs: number; totalCost: number }>((res, rej) => {
    resolveLeader = res;
    rejectLeader = rej;
  });
  inflightServerScans.set(key, leaderPromise);

  const encoder = new TextEncoder();
  // Capture trace of all server events for envelope persistence
  const trace: import("@/lib/reports").TraceEntry[] = [];
  const tracePush = (label: string, extra: Partial<import("@/lib/reports").TraceEntry> = {}) => {
    const elapsedMs = Date.now() - startMsRef.value;
    trace.push({ ts: elapsedMs, elapsedMs, label, ...extra });
  };
  const startMsRef = { value: Date.now() };
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      const startMs = startMsRef.value;
      // abort handling: if client disconnects, stop writing file
      let clientAborted = false;
      req.signal.addEventListener("abort", () => {
        clientAborted = true;
      });
      trace.push({ ts: 0, elapsedMs: 0, label: `Starting scan — ${repo}`, type: "start" });
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let lastPct = 0;
      let metaSent = false;
      let budgetMs = 0;
      let totalCost = 0;
      try {
        const { runUnifiedScan } = await import("../../../../../packages/engine/orchestrator");
        const gen = runUnifiedScan(`https://github.com/${repo}`);
        let finalFacts: import("../../../../../packages/engine/facts").FactRecord[] | undefined;
        let snapshot: unknown;
        let scanId: string | undefined;

        for await (const evt of gen) {
          if (evt.type === 'meta') {
            budgetMs = evt.budgetMs ?? 0;
            totalCost = evt.totalCost ?? 0;
            send({ type: "meta", budgetMs: evt.budgetMs, indicatorCount: evt.indicatorCount, breakdown: evt.breakdown, totalCost, milestone: (evt as { milestone?: string }).milestone });
            metaSent = true;
            tracePush(`Budget ${Math.ceil(budgetMs / 1000)}s · ${evt.indicatorCount ?? 0} indicators`, { type: "meta", pct: 0 });
            if ((evt as { milestone?: string }).milestone) tracePush((evt as { milestone: string }).milestone, { type: "milestone" });
            // heartbeat every 2s to keep proxy alive
            heartbeat = setInterval(() => {
              const elapsedMs = Date.now() - startMs;
              const remainingMs = Math.max(0, (budgetMs ?? 0) - elapsedMs);
              const timePct = budgetMs ? Math.min(elapsedMs / budgetMs, 1) : 0;
              const pct = Math.min(100, Math.round(timePct * 100));
              if (pct > lastPct) lastPct = pct;
              send({ type: "progress", pct: lastPct, elapsedMs, remainingMs, completedCost: 0, totalCost, completedIds: [] });
            }, 2000);
            // yield a heartbeat unref if possible
            if (heartbeat && typeof (heartbeat as unknown as { unref?: () => void }).unref === 'function') (heartbeat as unknown as { unref: () => void }).unref?.();
            continue;
          }
          if (evt.type === 'progress') {
            lastPct = evt.pct ?? lastPct;
            send({ type: "progress", pct: evt.pct, elapsedMs: evt.elapsedMs, remainingMs: evt.remainingMs, completedCost: evt.completedCost, totalCost: evt.totalCost, completedIds: evt.completedIds, milestone: (evt as { milestone?: string }).milestone });
            if ((evt as { milestone?: string }).milestone) tracePush((evt as { milestone: string }).milestone, { type: "progress", pct: evt.pct, elapsedMs: evt.elapsedMs, remainingMs: evt.remainingMs, completedIds: evt.completedIds });
            else if (evt.completedIds && evt.completedIds.length) {
              const ids = evt.completedIds as string[];
              const label = ids.length <= 3 ? `Measured ${ids.join(", ")}` : `Measured ${ids.length} indicators — ${ids.slice(0, 3).join(", ")} …`;
              tracePush(label, { type: "progress", pct: evt.pct, completedIds: ids });
            }
            continue;
          }
          if (evt.type === 'trace') {
            const label = (evt as { label?: string }).label ?? String(evt.milestone ?? "");
            const phase = (evt as { phase?: string }).phase;
            const detectorId = (evt as { detectorId?: string }).detectorId;
            const durationMs = (evt as { durationMs?: number }).durationMs;
            const status = (evt as { status?: string }).status;
            const errorKind = (evt as { errorKind?: string }).errorKind;
            send({ type: "trace", ts: evt.elapsedMs ?? Date.now() - startMs, elapsedMs: evt.elapsedMs, label, phase, detectorId, durationMs, status, errorKind });
            tracePush(label, { type: "trace", phase, detectorId, durationMs, status, errorKind } as Partial<import("@/lib/reports").TraceEntry>);
            continue;
          }
          if (evt.type === 'refused') {
            if (heartbeat) clearInterval(heartbeat);
            send({ type: "refused", reason: evt.reason, detail: evt.detail, repo });
            // Propagate to coalesced followers as rejection so they also get refused
            rejectLeader(new Error(`${evt.reason}: ${evt.detail}`));
            setTimeout(() => inflightServerScans.delete(key), 5000);
            controller.close(); return;
          }
          if (evt.type === 'done') {
            finalFacts = evt.facts as import("../../../../../packages/engine/facts").FactRecord[];
            snapshot = evt.snapshot;
            scanId = evt.id;
            break;
          }
        }
        if (heartbeat) clearInterval(heartbeat);
        if (!finalFacts) {
          send({ type: "refused", reason: "crash", detail: "no facts", repo });
          rejectLeader(new Error("no facts"));
          setTimeout(() => inflightServerScans.delete(key), 5000);
          controller.close(); return;
        }
        const rawSnapshot = (snapshot as Record<string, unknown>) ?? { repo, scanned_at: new Date().toISOString(), engine_version: 'unified/1.0', rubric_version: 'docs/rubric/@mvp' };
        // Single terminal scoring via the shared composer (also used by the workflow CLI)
        const { sealScan } = await import("../../../../../packages/engine/seal");
        const archetypeOverride = req.nextUrl.searchParams.get("archetype");
        const sealed = sealScan({
          facts: finalFacts as never,
          snapshot: rawSnapshot,
          budgetMs,
          startMs,
          trace: trace as never,
          archetypeOverride,
          scanId,
          repo,
        });
        const finalReport: Record<string, unknown> & { headline: { score: number; canonical_score: number; tier: string; ci_band: string }; snapshot: Record<string, unknown> } = sealed.report as typeof finalReport;
        const traceToPersist: import("@/lib/reports").TraceEntry[] = sealed.traceToPersist as unknown as import("@/lib/reports").TraceEntry[];
        // Build meta deterministically before deciding to persist (so client always gets runId)
        let persistedMeta: unknown = sealed.meta;
        try {
          const { writeReportEnvelope } = await import("@/lib/reports");
          if (!clientAborted && !req.signal.aborted) {
            await writeReportEnvelope({ meta: sealed.meta as unknown as import("@/lib/reports").ReportMeta, report: finalReport as unknown as import("@/lib/types").Report, trace: traceToPersist });
          } else {
            console.warn("[scan] client aborted — skipping persist to avoid duplicate file (meta still sent)");
          }
        } catch (e) {
          console.warn("[scan] failed to persist report", (e as Error).message);
        }
        // Ensure 100% progress before terminal report
        const elapsedMs = Date.now() - startMs;
        send({ type: "progress", pct: 100, elapsedMs, remainingMs: 0, completedCost: totalCost, totalCost, completedIds: [] });
        send({ type: "report", report: finalReport, meta: persistedMeta, trace: traceToPersist });
        // Resolve single-flight promise so coalesced followers reuse the same file
        resolveLeader({ report: finalReport, meta: persistedMeta, trace: traceToPersist, budgetMs, totalCost });
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat);
        const detail = e instanceof Error ? e.message : String(e);
        send({ type: "refused", reason: "crash", detail: detail.slice(0,500), repo });
        rejectLeader(e);
      } finally {
        if (heartbeat) clearInterval(heartbeat);
        // Keep single-flight window open for ~5s to coalesce StrictMode double-fetch,
        // then clear so intentional reruns create a fresh scan.
        setTimeout(() => inflightServerScans.delete(key), 5000);
        controller.close();
      }
    }});
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-cache, no-store" } });
}

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
        // Single terminal scoring — no intermediate report (with archetype-aware renormalization)
        const { scoreMvp } = await import("../../../../../packages/engine/scorer/mvp");
        const arch = (rawSnapshot as { archetype?: string }).archetype ?? 'unknown';
        const plane = (rawSnapshot as { planeInventory?: unknown }).planeInventory as { has_server: boolean; has_data: boolean; has_deploy: boolean; has_client: boolean; has_test: boolean } | undefined;
        const archetypeOverride = req.nextUrl.searchParams.get("archetype");
        const effectiveArch = archetypeOverride && ['library','service','cli','infra','docs','agent-skills','mixed','unknown'].includes(archetypeOverride) ? archetypeOverride : arch;
        const mvp = scoreMvp(finalFacts as never, { archetype: effectiveArch, planeInventory: plane });
        // Derive repoSha from snapshot or facts
        const snapSha = (rawSnapshot as { scanned_commit?: string }).scanned_commit;
        const factSha = finalFacts.find((f) => (f as unknown as { commitSha?: string }).commitSha && (f as unknown as { commitSha: string }).commitSha !== 'unknown');
        const repoSha = (snapSha && snapSha !== 'unknown' ? snapSha : (factSha as unknown as { commitSha?: string } | undefined)?.commitSha) ?? 'unknown';
        const normalizedRepo = String((rawSnapshot as { repo?: string }).repo ?? repo);
        const scannedAt = String((rawSnapshot as { scanned_at?: string }).scanned_at ?? new Date().toISOString());
        // Derive top restore levers (recoverable headline points) and deep-dive scope from scored categories/rows
        const deriveTopBlockers = (cats: typeof mvp.categories) => {
          const out: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string }> = [];
          for (const c of cats as unknown as Array<{ id: string; name: string; weight: number; applicable: number; indicator_rows: Array<{ id: string; name: string; status: string; not_applicable?: boolean; score?: number; reason?: string }> }>) {
            if (!c.applicable) continue;
            const pointValue = (100 * c.weight) / (3 * c.applicable) / 100;
            for (const r of c.indicator_rows) {
              if (r.status === 'unknown' || r.not_applicable || r.score == null) continue;
              const lost = 3 - r.score;
              if (lost <= 0) continue;
              out.push({ row: r.id, name: r.name, points_lost: lost, weight_pp: `${(lost * pointValue).toFixed(2)}pp`, summary: r.reason ?? '' });
            }
          }
          out.sort((a, b) => parseFloat(b.weight_pp) - parseFloat(a.weight_pp));
          return out.slice(0, 5);
        };
        const topBlockers = deriveTopBlockers(mvp.categories);
        // Deep-dive: indicators not in the paid set are the remainder of the 102
        // For MVP/tranche the rows are the measured set; unknown for deep-dive is the complement.
        // Build from rubric registry if available, otherwise from mvp rows unknown.
        let deepDiveScope: Array<{ row: string; name: string; what_it_takes: string }> = [];
        try {
          const rubricMod = await import("../../../../../packages/engine/rubric.json", { with: { type: "json" } });
          const rubric = rubricMod.default as { indicators: Array<{ id: string; name: string }> };
          const known = new Set((mvp.rows as Array<{ id: string }>).map(r => r.id));
          const unknownIndicators = rubric.indicators.filter(i => !known.has(i.id));
          // Map to deep-dive scope using a minimal what-it-takes (unknown measure path already on placeholder would be ideal, but use generic)
          deepDiveScope = unknownIndicators.slice(0, 18).map(i => ({ row: i.id, name: i.name, what_it_takes: "Not run in this scan — deep-dive row" }));
          // Prefer any unknown rows that already carry unknown_measure_path (if any)
          const unknownRows = (mvp.rows as Array<{ id: string; name: string; status: string; unknown_measure_path?: string }>).filter(r => r.status === 'unknown');
          if (unknownRows.length) {
            deepDiveScope = unknownRows.slice(0, 18).map(r => ({ row: r.id, name: r.name, what_it_takes: r.unknown_measure_path ?? "Not run" }));
          }
        } catch {}
        const finalReport: Record<string, unknown> & { headline: { score: number; canonical_score: number; tier: string; ci_band: string }; snapshot: Record<string, unknown> } = {
          id: scanId ?? `ls_${Date.now().toString(36)}`,
          snapshot: { ...rawSnapshot, archetype: effectiveArch, scanned_commit: repoSha, repo: normalizedRepo, scanned_at: scannedAt, archetype_source: archetypeOverride ? 'override' : 'auto', archetype_override_from: archetypeOverride ? arch : undefined },
          headline: { score: Math.round(mvp.score*100)/100, canonical_score: Math.round(((mvp as unknown as { canonical_score?: number }).canonical_score ?? mvp.score)*100)/100, tier: mvp.score >=80 ? 'Healthy' : mvp.score >=53 ? 'Moderate' : mvp.score >=27 ? 'High Risk' : 'Critical', ci_band: mvp.status === 'complete' ? 'complete' : 'degraded' },
          categories: mvp.categories,
          coverage: mvp.coverage,
          status: mvp.status,
          gates: mvp.gates,
          provenance: { tool_manifest: [] },
          top_blockers: topBlockers,
          deep_dive_scope: deepDiveScope,
          full_table: mvp.rows,
          report_schema: "1",
          sample: true,
        };
        // trace sealed entry
        tracePush(`Scoring — gates evaluated`, { type: "scoring" });
        const sealedLabel = `Sealed — ${mvp.status} · ${mvp.coverage.measured}/${mvp.coverage.measured + mvp.coverage.unknown + mvp.coverage.estimated} measured`;
        tracePush(sealedLabel, { type: "sealed", pct: 100 });
        // Truncate trace if unbounded (>200) — keep seal last, sentinel first
        let traceToPersist: import("@/lib/reports").TraceEntry[] = trace;
        if (trace.length > 200) {
          const sealIdx = trace.findIndex(t => t.type === "sealed");
          const sealEntry = sealIdx >= 0 ? trace[sealIdx] : null;
          const withoutSeal = sealIdx >= 0 ? trace.filter((_, i) => i !== sealIdx) : trace;
          const toDrop = withoutSeal.length - 199;
          const kept = withoutSeal.slice(toDrop);
          const sentinel: import("@/lib/reports").TraceEntry = { ts: kept[0]?.ts ?? 0, elapsedMs: kept[0]?.elapsedMs ?? 0, label: `… ${toDrop} earlier entries truncated`, phase: "budget" };
          traceToPersist = sealEntry ? [sentinel, ...kept, sealEntry] : [sentinel, ...kept];
        }
        // Build meta deterministically before deciding to persist (so client always gets runId)
        let persistedMeta: unknown = null;
        try {
          const { repoSlugFromUrl, normalizeTs, buildRunId, buildMeta, resolveEngineSha7, writeReportEnvelope } = await import("@/lib/reports");
          const repoSlug = repoSlugFromUrl(normalizedRepo);
          const ranAt = scannedAt;
          const ts = normalizeTs(ranAt);
          const engineSha7 = resolveEngineSha7();
          const runId = buildRunId(repoSlug, engineSha7, ts);
          const durationMs = Date.now() - startMs;
          const meta = buildMeta({
            repo: normalizedRepo,
            repoSlug,
            engineSha7,
            runId,
            ranAt,
            durationMs,
            budgetMs,
            repoSha: String(repoSha),
            report: finalReport as unknown as import("@/lib/types").Report,
          });
          persistedMeta = meta;
          if (!clientAborted && !req.signal.aborted) {
            await writeReportEnvelope({ meta, report: finalReport as unknown as import("@/lib/types").Report, trace: traceToPersist });
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

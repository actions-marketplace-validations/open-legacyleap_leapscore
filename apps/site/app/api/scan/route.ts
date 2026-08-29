import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");
  if (!repo) return new Response(JSON.stringify({ type: "refused", reason: "missing_repo", detail: "missing ?repo=owner/repo" }), { status: 400, headers: { "content-type": "application/json" } });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      const startMs = Date.now();
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
            send({ type: "meta", budgetMs: evt.budgetMs, indicatorCount: evt.indicatorCount, breakdown: evt.breakdown, totalCost });
            metaSent = true;
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
            send({ type: "progress", pct: evt.pct, elapsedMs: evt.elapsedMs, remainingMs: evt.remainingMs, completedCost: evt.completedCost, totalCost: evt.totalCost, completedIds: evt.completedIds });
            continue;
          }
          if (evt.type === 'refused') {
            if (heartbeat) clearInterval(heartbeat);
            send({ type: "refused", reason: evt.reason, detail: evt.detail, repo });
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
          controller.close(); return;
        }
        // Single terminal scoring — no intermediate report
        const { scoreMvp } = await import("../../../../../packages/engine/scorer/mvp");
        const mvp = scoreMvp(finalFacts as never);
        const finalReport = {
          id: scanId ?? `ls_${Date.now().toString(36)}`,
          snapshot: snapshot ?? { repo, scanned_at: new Date().toISOString(), engine_version: 'unified/1.0', rubric_version: 'docs/rubric/@mvp' },
          headline: { score: Math.round(mvp.score*100)/100, tier: mvp.score >=80 ? 'Healthy' : mvp.score >=53 ? 'Moderate' : mvp.score >=27 ? 'High Risk' : 'Critical', ci_band: mvp.status === 'complete' ? 'complete' : 'degraded' },
          categories: mvp.categories,
          coverage: mvp.coverage,
          status: mvp.status,
          gates: mvp.gates,
          provenance: { tool_manifest: [] },
          top_blockers: [],
          deep_dive_scope: [],
          full_table: mvp.rows,
          report_schema: "1",
          sample: true,
        };
        // Ensure 100% progress before terminal report
        const elapsedMs = Date.now() - startMs;
        send({ type: "progress", pct: 100, elapsedMs, remainingMs: 0, completedCost: totalCost, totalCost, completedIds: [] });
        send({ type: "report", report: finalReport });
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat);
        const detail = e instanceof Error ? e.message : String(e);
        send({ type: "refused", reason: "crash", detail: detail.slice(0,500), repo });
      } finally {
        if (heartbeat) clearInterval(heartbeat);
        controller.close();
      }
    }});
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-cache, no-store" } });
}

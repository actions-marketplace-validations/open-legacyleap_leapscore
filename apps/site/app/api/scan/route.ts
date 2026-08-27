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
      send({ step: "ingest", status: "start", label: "Ingesting URL" });
      await new Promise(r => setTimeout(r, 60));
      send({ step: "ingest", status: "done" });
      send({ step: "fetch", status: "start", label: "Fetching repo" });
      send({ step: "checks", status: "start", label: "Running 6 checks (VEL-06, VEL-09, VEL-08, VEL-10, SEC-07, TEST-08)" });
      try {
        const { runPhase1Scan } = await import("../../../../../packages/engine/orchestrator.phase1");
        const phase1 = await runPhase1Scan(`https://github.com/${repo}`);
        if ('status' in phase1 && (phase1 as {status:string}).status === 'snapshot_refused') {
          const r = phase1 as { status: 'snapshot_refused', reason: string, detail: string };
          send({ step: "fetch", status: "done" }); send({ step: "checks", status: "done" });
          send({ type: "refused", reason: r.reason, detail: r.detail, repo });
          controller.close(); return;
        }
        const p1 = phase1 as Exclude<typeof phase1, {status:string}>;
        send({ step: "fetch", status: "done" }); send({ step: "checks", status: "done" });
        // Send Phase1 report immediately (6/102)
        send({ type: "phase1", report: { ...p1, coverage: { measured: 6, estimated: 0, unknown: 96, not_applicable: 0, measured_pct: "6%", estimated_pct: "0%", unknown_pct: "94%" } } });
        // Phase 2
        send({ step: "cloning", status: "start", label: "Cloning (shallow --filter=blob:none)" });
        await new Promise(r => setTimeout(r, 80));
        send({ step: "cloning", status: "done" });
        send({ step: "sniffing", status: "start", label: "Sniffing manifests" });
        await new Promise(r => setTimeout(r, 60));
        send({ step: "sniffing", status: "done" });
        send({ step: "scanning", status: "start", label: "Scanning 13 (ECOS 5 + SEC 3 + ARCH 3 + TEST 2)" });
        // Run Phase2 via orchestrator two-phase (in-process)
        const { runTwoPhaseScan } = await import("../../../../../packages/engine/orchestrator");
        const gen = runTwoPhaseScan(`https://github.com/${repo}`);
        let finalFacts: unknown[] | undefined;
        for await (const evt of gen) {
          if ((evt as {phase:string}).phase === 'scanning') send({ step: "scanning", status: "active" });
          if ((evt as {facts: unknown[]}).facts && (evt as {phase:string}).phase === 'done') finalFacts = (evt as {facts: unknown[]}).facts;
          if ((evt as {error:string}).error) { send({ type: "refused", reason: "phase2_error", detail: (evt as {error:string}).error, repo }); controller.close(); return; }
        }
        send({ step: "scanning", status: "done" });
        send({ step: "scoring", status: "start", label: "Scoring 19" });
        await new Promise(r => setTimeout(r, 50));
        send({ step: "scoring", status: "done" });
        // For MVP, if Phase2 facts not available, synthesize 19-row report from Phase1 + mock Phase2
        const { scoreMvp } = await import("../../../../../packages/engine/scorer/mvp");
        const factsForScorer = (finalFacts as unknown as import("../../../../../packages/engine/facts").FactRecord[]) ?? (p1 as {facts: import("../../../../../packages/engine/facts").FactRecord[]}).facts;
        const mvp = scoreMvp(factsForScorer as never);
        const finalReport = {
          id: p1.id,
          snapshot: (p1 as {snapshot: unknown}).snapshot,
          headline: { score: Math.round(mvp.score*100)/100, tier: mvp.score >=80 ? 'Healthy' : mvp.score >=53 ? 'Moderate' : mvp.score >=27 ? 'High Risk' : 'Critical' },
          categories: mvp.categories,
          coverage: mvp.coverage,
          status: mvp.status,
          gates: mvp.gates,
          provenance: (p1 as {provenance: unknown}).provenance,
          top_blockers: [],
          deep_dive_scope: [],
          full_table: mvp.rows,
          report_schema: "1",
          sample: true,
        };
        send({ type: "report", report: finalReport });
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        send({ type: "refused", reason: "crash", detail: detail.slice(0,500), repo });
      } finally { controller.close(); }
    }});
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-cache, no-store" } });
}

import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scan?repo=owner/repo -> NDJSON stream of progress + final report
// Events: {"step":"ingest","status":"start"} etc. Final: {"type":"report","report":{...}} or {"type":"refused","reason":...}
export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");
  if (!repo) {
    return new Response(JSON.stringify({ type: "refused", reason: "missing_repo", detail: "missing ?repo=owner/repo" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // Step 1: ingest
      send({ step: "ingest", status: "start", label: "Ingesting URL", at: Date.now() });
      await new Promise((r) => setTimeout(r, 80));
      send({ step: "ingest", status: "done" });

      // Step 2: GH fetch + detectors
      send({ step: "fetch", status: "start", label: "Fetching repo", at: Date.now() });
      send({ step: "checks", status: "start", label: "Running 6 checks (VEL-06, VEL-09, VEL-08, VEL-10, SEC-07, TEST-08)" });

      try {
        // Use LiveReportProvider to get a full site Report (with top_blockers, full_table etc.)
        const { LiveReportProvider } = await import("../../../lib/provider.live");
        const provider = new LiveReportProvider();
        const report = await provider.getReport({ repo });

        // Mark fetch/checks done
        send({ step: "fetch", status: "done" });
        send({ step: "checks", status: "done" });
        send({ step: "scoring", status: "start", label: "Scoring" });
        await new Promise((r) => setTimeout(r, 60));
        send({ step: "scoring", status: "done" });

        // LiveReportProvider maps snapshot_refused to a Report with ci_band "refused: ..."
        const isRefused = report.headline.ci_band.startsWith("refused:");
        if (isRefused) {
          const reason = report.headline.ci_band.replace("refused: ", "").split(" ")[0] || "refused";
          send({ type: "refused", reason, detail: report.headline.ci_band, repo: report.snapshot.repo });
        } else {
          send({ type: "report", report });
        }
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        send({ type: "refused", reason: "crash", detail: detail.slice(0, 500), repo });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-cache, no-store",
    },
  });
}

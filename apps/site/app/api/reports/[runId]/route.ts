import { NextRequest } from "next/server";
import { isValidRunId, readReportEnvelope } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId: raw } = await params;
  const runId = decodeURIComponent(raw);
  if (!isValidRunId(runId)) {
    return new Response(JSON.stringify({ error: "invalid runId" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  const env = await readReportEnvelope(runId);
  if (!env) {
    return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify(env, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

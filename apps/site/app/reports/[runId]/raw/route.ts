import { notFound } from "next/navigation";
import { isValidRunId, readReportEnvelope } from "@/lib/reports";

// Site-owned raw envelope for a history entry. The scanner serves no
// permalinks, so shareable raw JSON is a site concern served from
// site-owned history — never from the scanner.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<Response> {
  const { runId: raw } = await params;
  const runId = decodeURIComponent(raw);
  if (!isValidRunId(runId)) notFound();
  const envelope = await readReportEnvelope(runId);
  if (!envelope) notFound();
  return Response.json(envelope, {
    headers: { "cache-control": "no-store" },
  });
}

import {
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  denormalizeTs,
  buildRunId,
  parseRunId,
  repoFromSlug,
  isValidRunId,
  assertContractVersion,
  CONTRACT_VERSION,
  type EnvelopeMeta as ContractReportMeta,
  type ReportEnvelope as ContractEnvelope,
  type TraceEntry as ContractTrace,
} from "@leapscore/contracts";
import sampleEnvelope from "./fixtures/django__django__506fc82__2026-08-12T000000-000Z.json";

export {
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  denormalizeTs,
  buildRunId,
  parseRunId,
  repoFromSlug,
  isValidRunId,
  assertContractVersion,
  CONTRACT_VERSION,
};

// ---------------------------------------------------------------------------
// Site-owned history (reports/run-history-ui).
//
// The scanner holds no store and serves no permalinks: its terminal `report`
// frame is the sole artefact of a scan. History, if any, is owned here. The
// v1 source is deliberately thin — a committed static fixture — until a
// durable backend lands as a follow-up. No filesystem reads, no scanner
// contact, no request-time scan work happens in this module.
// ---------------------------------------------------------------------------

export type ReportMeta = ContractReportMeta;
export type TraceEntry = ContractTrace;
export type ReportEnvelope = ContractEnvelope;

function asEnvelope(raw: unknown): ReportEnvelope | null {
  const env = raw as ReportEnvelope;
  if (!env || !env.meta || !env.report) return null;
  try {
    assertContractVersion(env);
  } catch {
    return null;
  }
  if (!Array.isArray(env.trace)) env.trace = [];
  return env;
}

const FIXTURES: ReportEnvelope[] = [asEnvelope(sampleEnvelope)].filter(
  (e): e is ReportEnvelope => e !== null,
);

export async function readReportEnvelope(runId: string): Promise<ReportEnvelope | null> {
  if (!isValidRunId(runId)) return null;
  return FIXTURES.find((e) => e.meta.runId === runId) ?? null;
}

export async function listReportMetas(): Promise<ReportMeta[]> {
  return FIXTURES.map((e) => e.meta).sort(
    (a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime(),
  );
}

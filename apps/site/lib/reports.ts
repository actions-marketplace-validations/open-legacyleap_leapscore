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
  isDeltaDocument,
  UnsupportedContractVersionError,
  DELTA_DOCUMENT,
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

// ---------------------------------------------------------------------------
// Ingest seam (report-envelope: delta document shape · run-diff D9).
//
// A report directory may hold a sealed envelope and, when the run was
// baselined, the derived `report.delta.json`. Ingest classifies every parsed
// document: envelopes become run rows; a delta document is skipped as a
// non-envelope with the reason recorded and creates no row; envelopes newer
// than the contract are skipped exactly as before, now with the reason
// recorded. `metas` stay the only input a run-history row needs.
// ---------------------------------------------------------------------------

export type IngestSkipReason = "delta-document" | "not-an-envelope" | "unknown-contract-version";

export interface IngestSkip {
  reason: IngestSkipReason;
  /** Human-readable reason, suitable for logs and the history page. */
  detail: string;
}

export interface IngestResult {
  envelopes: ReportEnvelope[];
  metas: ReportMeta[];
  /** Non-envelope documents that produced no run row, with the reason. */
  warnings: IngestSkip[];
}

function ingestDocument(doc: unknown): { envelope: ReportEnvelope } | { warning: IngestSkip } {
  if (isDeltaDocument(doc)) {
    return {
      warning: {
        reason: "delta-document",
        detail: `skipped ${DELTA_DOCUMENT} document: a derived comparison is not a sealed envelope — no run row created`,
      },
    };
  }
  const env = doc as ReportEnvelope;
  if (!env || typeof env !== "object" || !env.meta || !env.report) {
    return {
      warning: { reason: "not-an-envelope", detail: "skipped document: not a sealed report envelope — no run row created" },
    };
  }
  try {
    assertContractVersion(env);
  } catch (err) {
    if (err instanceof UnsupportedContractVersionError) {
      return {
        warning: {
          reason: "unknown-contract-version",
          detail: `skipped envelope: unsupported contract version ${err.found} (supports <= ${err.supported}) — no run row created`,
        },
      };
    }
    throw err;
  }
  if (!Array.isArray(env.trace)) env.trace = [];
  return { envelope: env };
}

function asEnvelope(raw: unknown): ReportEnvelope | null {
  const result = ingestDocument(raw);
  return "envelope" in result ? result.envelope : null;
}

/** Ingest a report directory's parsed documents: fresh envelopes plus the
 *  reasons any document was skipped. Never throws for a skip: a consumer that
 *  wants strictness reads `warnings`. */
export function ingestReportDocuments(documents: readonly unknown[]): IngestResult {
  const envelopes: ReportEnvelope[] = [];
  const warnings: IngestSkip[] = [];
  for (const doc of documents) {
    const result = ingestDocument(doc);
    if ("envelope" in result) envelopes.push(result.envelope);
    else warnings.push(result.warning);
  }
  return { envelopes, metas: sortedMetas(envelopes), warnings };
}

function sortedMetas(envelopes: readonly ReportEnvelope[]): ReportMeta[] {
  return envelopes.map((e) => e.meta).sort(
    (a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime(),
  );
}

const FIXTURES: ReportEnvelope[] = [asEnvelope(sampleEnvelope)].filter(
  (e): e is ReportEnvelope => e !== null,
);

export async function readReportEnvelope(runId: string): Promise<ReportEnvelope | null> {
  if (!isValidRunId(runId)) return null;
  return FIXTURES.find((e) => e.meta.runId === runId) ?? null;
}

export async function listReportMetas(): Promise<ReportMeta[]> {
  return sortedMetas(FIXTURES);
}

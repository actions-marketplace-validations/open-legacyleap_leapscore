/**
 * Build-time sample gallery (design D4, sample-reports).
 *
 * The committed envelopes under `lib/samples/*.json` are the sample set. A
 * build-time script (`scripts/build-samples-manifest.ts`) turns that directory
 * into `lib/generated/samples.ts`, so adding a file is all it takes to make a
 * sample listed and addressable — no route, component, or navigation change.
 *
 * This module validates every committed document (contract version, envelope
 * shape), derives the URL slug from the file name (stable across re-seals,
 * unlike `runId`), and sorts deterministically: sealed `ranAt` descending, then
 * slug. An invalid committed document fails the build instead of silently
 * disappearing from the gallery.
 */
import {
  assertContractVersion,
  isDeltaDocument,
  UnsupportedContractVersionError,
  DELTA_DOCUMENT,
  type ReportEnvelope,
} from "@leapscore/contracts";

import { SAMPLE_FILES } from "./generated/samples";

export interface SampleSource {
  fileName: string;
  document: unknown;
}

export interface CommittedSample {
  slug: string;
  fileName: string;
  envelope: ReportEnvelope;
}

export type SampleIssueReason =
  | "invalid-slug"
  | "delta-document"
  | "not-an-envelope"
  | "unsupported-contract-version";

export interface SampleIssue {
  fileName: string;
  reason: SampleIssueReason;
  detail: string;
}

export interface SampleInspection {
  samples: CommittedSample[];
  issues: SampleIssue[];
}

const SAMPLE_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

/** URL slug for a committed sample file. The file name is the stable identity. */
export function slugFromFileName(fileName: string): string | null {
  return SAMPLE_FILE.test(fileName) ? fileName.slice(0, -".json".length) : null;
}

export function inspectSampleDocuments(
  documents: readonly SampleSource[],
): SampleInspection {
  const samples: CommittedSample[] = [];
  const issues: SampleIssue[] = [];

  for (const { fileName, document } of documents) {
    const slug = slugFromFileName(fileName);
    if (!slug) {
      issues.push({
        fileName,
        reason: "invalid-slug",
        detail:
          "sample file names must be lowercase kebab-case with a .json extension",
      });
      continue;
    }

    if (isDeltaDocument(document)) {
      issues.push({
        fileName,
        reason: "delta-document",
        detail: `skipped ${DELTA_DOCUMENT} document: a derived comparison is not a sealed envelope`,
      });
      continue;
    }

    const envelope = document as ReportEnvelope;
    if (
      !envelope ||
      typeof envelope !== "object" ||
      !envelope.meta ||
      !envelope.report
    ) {
      issues.push({
        fileName,
        reason: "not-an-envelope",
        detail: "document has no sealed report envelope shape (meta + report)",
      });
      continue;
    }

    try {
      assertContractVersion(envelope);
    } catch (error) {
      if (error instanceof UnsupportedContractVersionError) {
        issues.push({
          fileName,
          reason: "unsupported-contract-version",
          detail: `unsupported contract version ${error.found} (supports <= ${error.supported})`,
        });
        continue;
      }
      throw error;
    }

    samples.push({
      slug,
      fileName,
      envelope: {
        ...envelope,
        trace: Array.isArray(envelope.trace) ? envelope.trace : [],
      },
    });
  }

  samples.sort(
    (a, b) =>
      Date.parse(b.envelope.meta.ranAt) - Date.parse(a.envelope.meta.ranAt) ||
      a.slug.localeCompare(b.slug),
  );

  return { samples, issues };
}

/** Every committed sample, ordered deterministically. Throws on an invalid document. */
export function listSamples(
  documents: readonly SampleSource[] = SAMPLE_FILES,
): CommittedSample[] {
  const { samples, issues } = inspectSampleDocuments(documents);
  if (issues.length) {
    throw new Error(
      "invalid committed sample document(s):\n" +
        issues
          .map(
            (issue) =>
              `  - ${issue.fileName}: ${issue.reason} — ${issue.detail}`,
          )
          .join("\n"),
    );
  }
  return samples;
}

export function sampleSlugs(): string[] {
  return listSamples().map((sample) => sample.slug);
}

export function getSample(slug: string): CommittedSample | null {
  return listSamples().find((sample) => sample.slug === slug) ?? null;
}

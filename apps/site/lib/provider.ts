/*
 * ReportProvider seam: the UI consumes exactly the report contract via this
 * interface and never touches the adapter internals.
 *
 * The sample is a real sealed envelope: a v1.0.2 local scan of the checked-in
 * synthetic Maven fixture, committed under `lib/fixtures/`. It carries real
 * engine/rubric versions and real coverage; `report.sample` is true because the
 * target is a demo fixture, not a customer repository. Live reports arrive over
 * HTTP from the scanner service and never pass through this seam.
 */

import sampleEnvelope from "./fixtures/maven-multi-module__bce7fc0__2026-11-12T155107-061Z.json";
import type { Report, ReportQuery } from "@/lib/types";

export interface ReportProvider {
  getReport(query: ReportQuery): Promise<Report>;
}

const SAMPLE_REPORT = (sampleEnvelope as unknown as { report: Report }).report;

export class SampleReportProvider implements ReportProvider {
  async getReport(_query: ReportQuery): Promise<Report> {
    // Fresh copy per caller: a render can never mutate the committed envelope.
    return structuredClone(SAMPLE_REPORT);
  }
}

const sampleProvider: ReportProvider = new SampleReportProvider();

/** Single seam the app pages call. Sample-only: live scans arrive over HTTP
 *  from the scanner service (`LiveReportClient` → scanner scan API), never
 *  through this in-process seam. */
export function getReportProvider(): ReportProvider {
  return sampleProvider;
}

export function getReportProviderForTest(
  query: { live?: string | null },
  opts: { tokenPresent: boolean; liveImpl?: ReportProvider },
): ReportProvider {
  if (query.live === "1" && opts.tokenPresent && opts.liveImpl) return opts.liveImpl;
  return sampleProvider;
}

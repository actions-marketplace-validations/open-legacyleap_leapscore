/*
 * ReportProvider seam (W4): the UI consumes exactly the 06 schema via this
 * interface and never touches the adapter internals. B state serves the seeded
 * mock; the A state swaps in a live adapter that calls the detection engine.
 */

import {
  BASE_WEIGHTS,
  buildDeepDiveScope,
  coverageCounts,
  scoreSystem,
  tierForScore,
  topBlockers,
} from "@/lib/scoring";
import {
  API_ROWS,
  ARCH_ROWS,
  DATA_ROWS,
  DEEP_DIVE_ROWS,
  DOCS_ROWS,
  ECOS_ROWS,
  FE_ROWS,
  GATES,
  PERF_ROWS,
  SEC_ROWS,
  TEST_ROWS,
  VEL_ROWS,
} from "@/lib/sample";
import type { CategoryId } from "@/lib/scoring";
import type { IndicatorRow, Report, ReportQuery } from "@/lib/types";

export interface ReportProvider {
  getReport(query: ReportQuery): Promise<Report>;
}

const CATEGORY_META: { id: CategoryId; name: string }[] = [
  { id: "ECOS", name: "Dependency & Ecosystem Health" },
  { id: "ARCH", name: "Architecture & Code Quality" },
  { id: "TEST", name: "Testing & Quality Engineering" },
  { id: "SEC", name: "Security, Compliance & Vulnerability" },
  { id: "DATA", name: "Data & Schema Evolution" },
  { id: "API", name: "API & Integration Surface" },
  { id: "VEL", name: "Developer Velocity & Operational Drag" },
  { id: "PERF", name: "Performance & Cloud/Infrastructure Fit" },
  { id: "DOCS", name: "Documentation & Knowledge Continuity" },
];

const SCHEDULE: { id: CategoryId; rows: IndicatorRow[] }[] = [
  { id: "ECOS", rows: ECOS_ROWS },
  { id: "ARCH", rows: ARCH_ROWS },
  { id: "TEST", rows: TEST_ROWS },
  { id: "SEC", rows: SEC_ROWS },
  { id: "DATA", rows: DATA_ROWS },
  { id: "API", rows: API_ROWS },
  { id: "VEL", rows: VEL_ROWS },
  { id: "PERF", rows: PERF_ROWS },
  { id: "DOCS", rows: DOCS_ROWS },
];

const CATEGORIES = (): {
  meta: { id: string; name: string; weight: number };
  rows: IndicatorRow[];
}[] =>
  SCHEDULE.map((c) => ({
    meta: {
      id: c.id,
      name: CATEGORY_META.find((m) => m.id === c.id)!.name,
      weight: BASE_WEIGHTS[c.id],
    },
    rows: c.rows,
  }));

/** Normalize a pasted repo string to `owner/name`, tolerating URLs and noise. */
export function normalizeRepo(raw: string | null | undefined): string {
  if (!raw) return "django/django";
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "");
  const parts = cleaned.split(/[/?#]/).filter(Boolean);
  if (parts.length < 2) return "django/django";
  const [owner, name] = parts;
  if (!owner || !name) return "django/django";
  return `${owner}/${name}`;
}

export class SampleReportProvider implements ReportProvider {
  async getReport(query: ReportQuery): Promise<Report> {
    const repo = normalizeRepo(query.repo);
    const categories = CATEGORIES();
    // Scoped to the standard audit (W12): deep-dive + FE rows render in the
    // full "inspect all 102" table but fold into no category denominator.
    const scored = scoreSystem(categories);

    const headers = scored.categories;
    const coverage = coverageCounts([...headers, { indicator_rows: FE_ROWS }]);
    const tier = tierForScore(scored.score);
    const blockers = topBlockers(headers, 5);

    return {
      report_schema: "1",
      id: "ls_rpt_sample_django",
      status: "complete",
      snapshot: {
        repo,
        scanned_at: "2026-08-12T00:00:00Z",
        engine_version:
          "illustrative sample — mock adapter (live engine: coming)",
        rubric_version: "docs/rubric/@planning",
      },
      headline: {
        score: scored.score,
        tier: tier.label,
        ci_band: "±4 (uncertainty from estimated rows)",
      },
      coverage,
      gates: GATES,
      categories: headers,
      top_blockers: blockers,
      deep_dive_scope: [
        ...buildDeepDiveScope(headers),
        ...DEEP_DIVE_ROWS.filter((r) => r.status === "unknown").map((r) => ({
          row: r.id,
          name: r.name,
          what_it_takes:
            r.unknown_measure_path ??
            "Deep-dive — not run in a standard audit.",
        })),
      ],
      full_table: [
        ...categories.flatMap((c) => c.rows),
        ...DEEP_DIVE_ROWS,
        ...FE_ROWS,
      ],
      sample: true,
    };
  }
}

const sampleProvider: ReportProvider = new SampleReportProvider();

/** Single seam the app pages call. A state: return a live scan provider here. */
export function getReportProvider(): ReportProvider {
  return sampleProvider;
}

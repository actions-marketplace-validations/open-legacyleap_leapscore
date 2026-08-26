import type { CoverageCounts } from "@/lib/types";

const SEGMENTS: {
  key: keyof Pick<CoverageCounts, "measured" | "estimated" | "unknown">;
  label: string;
  tone: string;
}[] = [
  { key: "measured", label: "Measured", tone: "bg-foreground" },
  { key: "estimated", label: "Estimated", tone: "bg-muted" },
  { key: "unknown", label: "Unknown", tone: "bg-faint" },
];

export function CoverageStrip({ coverage }: { coverage: CoverageCounts }) {
  const total = coverage.measured + coverage.estimated + coverage.unknown;
  const denom = Math.max(total, 1);

  return (
    <div className="instrument-panel rounded-lg p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-ink">Evidence coverage</h3>
        <span className="font-mono text-xs text-faint">76 indicator rows</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-sm">
        {SEGMENTS.map((s) => (
          <div
            key={s.key}
            className={s.tone}
            style={{ width: `${(coverage[s.key] / denom) * 100}%` }}
            title={`${s.label}: ${coverage[s.key]}`}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SEGMENTS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted">
                <span className={`h-2 w-2 rounded-sm ${s.tone}`} />
                {s.label}
              </span>
              <span className="font-mono text-ink">{coverage[s.key]}</span>
            </div>
            <div className="mt-0.5 text-xs text-faint">
              n·{coverage[s.key]} / {total}
              {s.key === "measured" ? ` · ${coverage.measured_pct}` : ""}
            </div>
          </div>
        ))}
        <div className="text-xs text-faint sm:col-span-3">
          {coverage.not_applicable} rows N/A (no front-end client in this repo)
          — excluded from the score.
        </div>
      </div>
    </div>
  );
}

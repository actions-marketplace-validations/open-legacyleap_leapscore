import type { CoverageCounts } from "@/lib/types";

const SEGMENTS: {
  key: keyof Pick<CoverageCounts, "measured" | "estimated" | "unknown" | "not_applicable" | "not_implemented">;
  label: string;
  tone: string;
  dot: string;
}[] = [
  { key: "measured", label: "Measured", tone: "bg-white", dot: "bg-white" },
  { key: "estimated", label: "Estimated", tone: "bg-amber-400", dot: "bg-amber-400" },
  { key: "unknown", label: "Unknown", tone: "bg-zinc-500", dot: "bg-zinc-500" },
  { key: "not_applicable", label: "Not applicable", tone: "bg-zinc-700", dot: "bg-zinc-700 border border-zinc-600" },
  { key: "not_implemented", label: "Not implemented", tone: "bg-transparent border border-dashed border-zinc-600", dot: "bg-transparent border border-dashed border-zinc-600" },
];

export function CoverageStrip({ coverage }: { coverage: CoverageCounts }) {
  const total = coverage.measured + coverage.estimated + coverage.unknown + coverage.not_applicable + (coverage.not_implemented ?? 0);
  const denom = Math.max(total, 1);

  return (
    <div className="instrument-panel rounded-lg p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-ink">Evidence coverage</h3>
        <span className="font-mono text-xs text-faint">102 indicator rows</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
        {SEGMENTS.map((s) => {
          const pct = (coverage[s.key] / denom) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              className={s.tone}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${coverage[s.key]} / ${total} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
    </div>
  );
}

export const COVERAGE_SEGMENTS = SEGMENTS;

import type { CategoryScore, IndicatorRow } from "@/lib/types";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { tierForScore } from "@/lib/scoring";

function tierBadge(score: number) {
  const t = tierForScore(score);
  const colors: Record<string, string> = {
    healthy: "text-tier-healthy border-tier-healthy/40",
    moderate: "text-tier-moderate border-tier-moderate/40",
    high: "text-tier-high border-tier-high/40",
    critical: "text-tier-critical border-tier-critical/40",
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-xs ${colors[t.color]}`}
    >
      {t.label}
    </span>
  );
}

function RowDetail({ r }: { r: IndicatorRow }) {
  return (
    <div className="space-y-2 text-xs leading-relaxed">
      <p className="text-muted">{r.reason}</p>

      {r.evidence && (
        <div className="rounded border border-hairline bg-background/60 p-2 font-mono text-[11px] text-muted">
          <div>
            <span className="text-faint">detected via</span> {r.evidence.tool}
            {r.evidence.args ? (
              <span className="text-faint"> · {r.evidence.args}</span>
            ) : null}
          </div>
          {r.evidence.pointers.map((p, i) => (
            <div key={i} className="mt-1 truncate text-muted">
              <span className="text-tier-moderate">{p.file ?? "repo"}</span>
              {p.line ? <span className="text-faint">:{p.line}</span> : null}
              {p.detail ? (
                <span className="text-faint"> — {p.detail}</span>
              ) : null}
            </div>
          ))}
          {Object.entries(r.evidence.facts).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Object.entries(r.evidence.facts).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded bg-panel-raised px-1.5 py-0.5 text-faint"
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {r.basis && (
        <div className="rounded border border-hairline bg-background/60 p-2 font-mono text-[11px] text-muted">
          <span className="text-faint">estimated via</span> {r.basis.pattern}
          {r.basis.sample ? (
            <span className="text-faint"> · sample: {r.basis.sample}</span>
          ) : null}
          <span className="text-faint"> · confidence {r.basis.confidence}</span>
        </div>
      )}

      {r.unknown_measure_path && (
        <div className="rounded border border-hairline bg-background/60 p-2 font-mono text-[11px] text-muted">
          <span className="text-faint">to measure:</span>{" "}
          {r.unknown_measure_path}
        </div>
      )}

      {r.remediation && (
        <div className="rounded border border-hairline p-2">
          <div className="text-faint">Remediation</div>
          <div className="mt-1 text-muted">
            <span className="text-ink">Quick win.</span>{" "}
            {r.remediation.quick_win}
          </div>
          <div className="mt-1 text-muted">
            <span className="text-ink">Structural.</span>{" "}
            {r.remediation.structural}
          </div>
          <div className="mt-1 text-muted">
            <span className="text-ink">Gold standard.</span>{" "}
            {r.remediation.gold_standard}
          </div>
        </div>
      )}
    </div>
  );
}

function displayName(r: IndicatorRow): string {
  if (!r.name || r.name === r.id) {
    if (typeof console !== 'undefined' && console.warn) console.warn(`Unknown indicator ${r.id}`);
    return `Unknown indicator (${r.id})`;
  }
  return r.name;
}

function Row({ r }: { r: IndicatorRow }) {
  return (
    <div className="border-b border-hairline last:border-0">
      <Accordion>
        <AccordionItem value={r.id} className="border-0">
          <AccordionTrigger className="gap-3 px-3 py-2.5 hover:no-underline">
            <div className="flex flex-1 items-center gap-3 text-left">
              <span className="w-16 shrink-0 font-mono text-xs text-faint">
                {r.id}
              </span>
              <span className="flex-1 text-sm text-foreground">{displayName(r)}</span>
              {r.score != null ? (
                <span
                  className={`shrink-0 font-mono text-sm ${scoreTone(r.score)}`}
                >
                  {r.score}
                </span>
              ) : (
                <span className="shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[11px] text-faint">
                  not scored
                </span>
              )}
              <span className="hidden shrink-0 text-[11px] text-faint sm:inline">
                {r.effort}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <RowDetail r={r} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function scoreTone(score: number): string {
  switch (score) {
    case 0:
      return "text-tier-critical";
    case 1:
      return "text-tier-high";
    case 2:
      return "text-tier-moderate";
    default:
      return "text-tier-healthy";
  }
}

export function CategorySection({ category }: { category: CategoryScore }) {
  const isEmpty = category.indicator_rows.length === 0 || category.category_score == null;
  return (
    <div className="instrument-panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-panel-raised px-1.5 py-0.5 font-mono text-xs text-faint">
              {category.id}
            </span>
            <h3 className="text-sm font-medium text-foreground">
              {category.name}
            </h3>
          </div>
          <p className="mt-1 text-xs text-faint">
            {category.applicable} rows · weight {category.weight}% · status{" "}
            {statusLabel(category.status_counts)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEmpty ? (
            <>
              <span className="font-mono text-xl font-semibold text-faint tabular-nums">—</span>
              <span className="rounded border border-hairline px-1.5 py-0.5 font-mono text-xs text-faint">Not evaluated</span>
            </>
          ) : (
            <>
              <span className="font-mono text-2xl font-semibold text-foreground tabular-nums">
                {(category.category_score as number).toFixed(0)}
              </span>
              {tierBadge(category.category_score as number)}
            </>
          )}
        </div>
      </div>
      <div>
        {category.indicator_rows.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

function statusLabel(s: CategoryScore["status_counts"]): string {
  return `${s.measured}m / ${s.estimated}e / ${s.unknown}u`;
}

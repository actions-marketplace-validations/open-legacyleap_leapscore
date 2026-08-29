import { useState } from "react";

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

function flattenFactsForDisplay(facts: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(facts);
  if (keys.length === 1) {
    const outer = keys[0];
    const v = (facts as Record<string, unknown>)[outer];
    if (v && typeof v === 'object' && !Array.isArray(v) && /^(docs|perf|ecos|sec|data|vel|arch|test|api)/i.test(outer)) {
      return v as Record<string, unknown>;
    }
  }
  return facts;
}

function formatFactValue(key: string, v: unknown): string {
  if (v == null) return '—';
  if (key === 'breaking_with_migration_guide' && typeof v === 'object' && v !== null) {
    const o = v as { total_breaking?: number; documented?: number };
    return `${o.documented ?? 0}/${o.total_breaking ?? 0} documented`;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return 'none';
    return v.map((x) => (typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x))).join(', ');
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function prettyFactValue(key: string, v: unknown): string {
  if (v == null) return '—';
  if (key === 'breaking_with_migration_guide' && typeof v === 'object' && v !== null) {
    const o = v as { total_breaking?: number; documented?: number };
    return `${o.documented ?? 0}/${o.total_breaking ?? 0} documented`;
  }
  if (Array.isArray(v)) {
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  }
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  }
  return String(v);
}

function FactCell({ k, v }: { k: string; v: unknown }) {
  const str = formatFactValue(k, v);
  const pretty = prettyFactValue(k, v);
  const isLong = str.length > 80 || str.includes('{') || str.includes('[') || str.includes('\n');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!isLong) {
    return (
      <>
        <td className="px-2 py-1 align-top font-medium text-faint break-words">{k}</td>
        <td className="px-2 py-1 align-top text-muted break-all">{str}</td>
      </>
    );
  }
  const truncated = str.length > 80 ? `${str.slice(0, 80)}…` : str;
  return (
    <>
      <td className="px-2 py-1 align-top font-medium text-faint break-words">{k}</td>
      <td className="px-2 py-1 align-top text-muted">
        <span className="break-all">{truncated}</span>{' '}
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 rounded border border-hairline bg-panel-raised px-1 py-0 text-[10px] text-faint hover:text-foreground hover:border-foreground/30"
        >
          view
        </button>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
            <div
              className="flex max-h-[80vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg border border-hairline bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
                <span className="font-mono text-xs text-faint">{k}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(pretty); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
                    }}
                    className="rounded border border-hairline px-2 py-0.5 text-[11px] text-faint hover:text-foreground"
                  >
                    {copied ? 'copied' : 'copy'}
                  </button>
                  <button onClick={() => setOpen(false)} className="rounded bg-foreground px-2 py-0.5 text-[11px] text-background">
                    close
                  </button>
                </div>
              </div>
              <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-muted whitespace-pre-wrap break-all">{pretty}</pre>
            </div>
          </div>
        ) : null}
      </td>
    </>
  );
}

function FactPill({ k, v }: { k: string; v: unknown }) {
  const str = formatFactValue(k, v);
  const pretty = prettyFactValue(k, v);
  const isLong = str.length > 80 || str.includes('{') || str.includes('[');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const label = isLong && str.length > 80 ? `${k}: ${str.slice(0, 80)}…` : `${k}: ${str}`;
  if (!isLong) {
    return <span className="rounded bg-panel-raised px-1.5 py-0.5 text-faint break-all">{label}</span>;
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-panel-raised px-1.5 py-0.5 text-faint hover:text-foreground hover:border hover:border-hairline break-all text-left"
        title={str}
      >
        {label} <span className="underline decoration-dotted">view</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="flex max-h-[80vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg border border-hairline bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
              <span className="font-mono text-xs text-faint">{k}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => { try { await navigator.clipboard.writeText(pretty); setCopied(true); setTimeout(() => setCopied(false), 1200);} catch {} }}
                  className="rounded border border-hairline px-2 py-0.5 text-[11px] text-faint hover:text-foreground"
                >
                  {copied ? 'copied' : 'copy'}
                </button>
                <button onClick={() => setOpen(false)} className="rounded bg-foreground px-2 py-0.5 text-[11px] text-background">close</button>
              </div>
            </div>
            <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-muted whitespace-pre-wrap break-all">{pretty}</pre>
          </div>
        </div>
      ) : null}
    </>
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
            {r.evidence.args ? <span className="text-faint"> · {r.evidence.args}</span> : null}
          </div>
          {r.evidence.pointers.map((p, i) => (
            <div key={i} className="mt-1 break-all text-muted">
              <span className="text-tier-moderate">{p.file ?? "repo"}</span>
              {p.line ? <span className="text-faint">:{p.line}</span> : null}
              {p.detail ? <span className="text-faint"> — {p.detail}</span> : null}
            </div>
          ))}
          {(() => {
            const flat = flattenFactsForDisplay(r.evidence!.facts as Record<string, unknown>);
            const entries = Object.entries(flat).filter(([, v]) => {
              if (v == null) return false;
              if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as Record<string, unknown>).length === 0) return false;
              return true;
            });
            if (entries.length === 0) return null;
            if (entries.length <= 5) {
              return (
                <div className="mt-1.5 overflow-hidden rounded border border-hairline">
                  <table className="w-full table-fixed text-[11px]">
                    <tbody>
                      {entries.map(([k, v]) => (
                        <tr key={k} className="border-b border-hairline last:border-0">
                          <FactCell k={k} v={v} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {entries.map(([k, v]) => (
                  <FactPill key={k} k={k} v={v} />
                ))}
              </div>
            );
          })()}
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

"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { Gate, GateStatus } from "@/lib/types";

const STATUS: Record<GateStatus, { label: string; dot: string; note: string }> = {
  proven: {
    label: "Proven",
    dot: "bg-tier-critical",
    note: "Red flag confirmed — verdict is capped.",
  },
  "needs-verification": {
    label: "Needs verification",
    dot: "bg-tier-moderate",
    note: "Borderline red flag — can't confirm from code alone.",
  },
  "not-proven": {
    label: "Not proven",
    dot: "bg-foreground",
    note: "No red flag — gate does not cap the verdict.",
  },
};

function GroupTable({ gates }: { gates: Gate[] }) {
  return (
    <table className="w-full text-left text-sm">
      <tbody>
        {gates.map((g) => {
          const s = STATUS[g.status];
          return (
            <tr key={g.id} className="border-b border-hairline last:border-0">
              <td className="w-12 px-4 py-3 align-top font-mono text-xs text-faint">{g.id}</td>
              <td className="px-2 py-3 align-top">
                <div className="font-medium text-foreground">{g.name}</div>
                <div className="mt-0.5 text-xs text-muted">{g.note}</div>
                <div className="mt-1 font-mono text-[11px] text-faint">{g.source_rows.join(", ")}</div>
              </td>
              <td className="w-40 px-4 py-3 text-right align-top">
                <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted" title={s.note}>
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  <span className="sr-only">{s.label}: </span>
                  {s.label}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function GatesTable({ gates }: { gates: Gate[] }) {
  const [open, setOpen] = useState(false);
  const proven = gates.filter((g) => g.status === "proven");
  const needs = gates.filter((g) => g.status === "needs-verification");
  const notProven = gates.filter((g) => g.status === "not-proven");

  const provenCount = proven.length;
  const needsCount = needs.length;
  const notProvenCount = notProven.length;

  return (
    <div className="instrument-panel overflow-hidden rounded-lg print:overflow-visible">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Header + summary strip — always visible */}
        <div className="border-b border-hairline px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-ink">Kill-switch gates</h3>
              <p className="mt-0.5 text-xs text-faint">G1–G8 red-flag checks. Any proven gate caps the verdict at High Risk.</p>
            </div>
            <CollapsibleTrigger
              aria-label={open ? "Hide kill-switch gates" : `Show kill-switch gates (${gates.length})`}
              aria-expanded={open}
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-hairline px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none print:hidden"
            >
              <span>{open ? "Collapse" : "Expand"}</span>
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </CollapsibleTrigger>
          </div>

          {/* Summary strip — one line desktop, wraps to two on xs */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${STATUS.proven.dot}`} />
              <span className="sr-only">Proven: </span>
              <span className={provenCount > 0 ? "font-medium text-tier-critical" : "text-muted"}>{provenCount} proven</span>
            </span>
            <span className="text-hairline" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${STATUS["needs-verification"].dot}`} />
              <span className="sr-only">Needs verification: </span>
              <span>{needsCount} needs verification</span>
            </span>
            <span className="text-hairline" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${STATUS["not-proven"].dot}`} />
              <span className="sr-only">Not proven: </span>
              <span>{notProvenCount} clear</span>
            </span>
            {!open && <span className="text-hairline hidden sm:inline" aria-hidden="true">·</span>}
            {!open && <span className="text-faint hidden sm:inline">{gates.length} gates</span>}
          </div>

          {/* Proven peek — visible even when collapsed */}
          {!open && proven.length > 0 && (
            <div className="mt-2 space-y-1">
              {proven.map((g) => (
                <div key={g.id} className="flex items-start gap-1.5 text-xs">
                  <span aria-hidden="true" className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS.proven.dot}`} />
                  <span className="font-mono text-faint">{g.id}</span>
                  <span className="font-medium text-foreground">{g.name}</span>
                  <span className="truncate text-muted" title={g.note}>
                    — {g.note}
                  </span>
                </div>
              ))}
            </div>
          )}
          {!open && proven.length === 0 && (
            <p className="mt-2 text-xs text-faint">No proven gates — verdict not capped.</p>
          )}
        </div>

        {/* Detail — grouped tables */}
        <CollapsibleContent className="motion-reduce:transition-none data-[open]:animate-in data-[closed]:animate-out print:!block print:!h-auto">
          <div className="divide-y divide-hairline">
            {/* Proven — default visible when outer open; if n>0 it's at top so immediately scannable */}
            {proven.length > 0 && (
              <div>
                <div className="bg-panel-raised px-4 py-2 text-xs font-medium tracking-wider text-faint uppercase">
                  Proven ({proven.length}) — verdict capped
                </div>
                <GroupTable gates={proven} />
              </div>
            )}
            {needs.length > 0 && (
              <div>
                <div className="bg-panel-raised px-4 py-2 text-xs font-medium tracking-wider text-faint uppercase">
                  Needs verification ({needs.length})
                </div>
                <GroupTable gates={needs} />
              </div>
            )}
            {notProven.length > 0 && (
              <div>
                <div className="bg-panel-raised px-4 py-2 text-xs font-medium tracking-wider text-faint uppercase">
                  Not proven ({notProven.length})
                </div>
                <GroupTable gates={notProven} />
              </div>
            )}
            {gates.length === 0 && <p className="px-4 py-3 text-xs text-faint">No gates</p>}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Print: force detail visible */}
      <style>{`@media print { [data-slot="collapsible-content"] { display: block !important; height: auto !important; } } @media (prefers-reduced-motion: reduce) { [data-slot="collapsible-content"] { transition: none !important; } }`}</style>
    </div>
  );
}

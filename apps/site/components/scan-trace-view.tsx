"use client";

import { useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { TraceEntry } from "@/lib/reports";

export function ScanTraceView({ trace }: { trace: TraceEntry[] }) {
  const [detectorOpen, setDetectorOpen] = useState(false);
  if (!trace || trace.length === 0) return null;

  const milestoneRows = trace.filter(t => t.phase !== "detector");
  const detectorRows = trace.filter(t => t.phase === "detector");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      <div className="instrument-panel overflow-hidden rounded-lg border border-hairline">
        <div className="px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Scan trace</h2>
          <p className="mt-0.5 text-xs text-faint">{trace.length} steps · persisted with report</p>
        </div>
        <div className="border-t border-hairline px-4 py-3">
          <ol className="space-y-1.5">
            {milestoneRows.map((e, idx) => (
              <li key={`m-${idx}`} className="flex gap-3 font-mono text-xs">
                <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                <span className="text-muted">{e.label}</span>
              </li>
            ))}
          </ol>
          {detectorRows.length > 0 && (
            <Collapsible open={detectorOpen} onOpenChange={setDetectorOpen} className="mt-3">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded border border-hairline px-3 py-2 text-left hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="text-xs font-medium text-ink">Detector trace ({detectorRows.length})</span>
                <span className="text-xs text-faint">{detectorOpen ? "Hide" : "Show"}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ol className="mt-2 max-h-64 space-y-1 overflow-auto pr-1">
                  {detectorRows.map((e, idx) => (
                    <li key={`d-${idx}`} className="flex gap-3 font-mono text-xs">
                      <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                      <span className="text-muted">{e.label}</span>
                      {e.durationMs != null && <span className="text-faint">· {e.durationMs}ms</span>}
                    </li>
                  ))}
                </ol>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import type { IndicatorRow } from "@/lib/types";

/*
 * "Inspect all 102" toggle — a render affordance only (W12). Deep-dive and
 * FE-annex rows below the fold; every row that folds into the score still
 * carries its evidence in the same accordion.
 */

function scoreTone(score: number | undefined): string {
  if (score == null) return "text-faint";
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

export function SampleFullTable({ rows }: { rows: IndicatorRow[] }) {
  const [open, setOpen] = useState(false);

  const standard = rows.filter(
    (r) => r.status !== "unknown" && !r.not_applicable,
  );
  const deepDive = rows.filter(
    (r) => r.status === "unknown" && !r.not_applicable,
  );
  const fe = rows.filter((r) => r.not_applicable);

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">All 102 indicators</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-muted underline underline-offset-2 hover:text-foreground"
          aria-expanded={open}
        >
          {open ? "Collapse" : "Inspect all 102"}
        </button>
      </div>

      {!open ? (
        <p className="inline-flex items-center gap-2 text-xs text-faint">
          <span>{standard.length} scored rows in the total</span>
          <span className="text-hairline">·</span>
          <span>{deepDive.length} deep-dive not run</span>
          <span className="text-hairline">·</span>
          <span>{fe.length} N/A (no FE client)</span>
        </p>
      ) : (
        <div className="instrument-panel divide-y divide-hairline overflow-hidden rounded-lg">
          <Group
            label="Standard audit — scored into the total"
            rows={standard}
          />
          <Group
            label="Deep-dive — not run in a standard audit"
            rows={deepDive}
          />
          <Group label="Front-end annex — N/A for this repo" rows={fe} />
        </div>
      )}
    </div>
  );
}

function Group({ label, rows }: { label: string; rows: IndicatorRow[] }) {
  return (
    <div>
      <div className="bg-panel-raised px-4 py-2 text-xs font-medium tracking-wider text-faint uppercase">
        {label} · {rows.length}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-hairline last:border-0">
              <td className="w-16 px-4 py-2 font-mono text-xs text-faint">
                {r.id}
              </td>
              <td className="px-2 py-2 text-muted">{r.name}</td>
              <td className="hidden px-2 py-2 text-xs text-faint sm:table-cell">
                {r.not_applicable ? "N/A" : r.status}
              </td>
              <td
                className={`w-12 px-4 py-2 text-right font-mono ${scoreTone(r.score)}`}
              >
                {r.score ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

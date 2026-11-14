"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { RubricIndexEntry } from "@/lib/rubric-index";
import { filterRubricIndex, rubricFacets } from "@/lib/rubric-filter";
import { indicatorHref } from "@/lib/rubric-links";

const TIERS = ["A", "B", "C", "D"] as const;
const STATUSES = ["measured", "estimated", "unknown"] as const;

/**
 * The only client component on the rubric index (design D3/D7). It receives the
 * classification payload — never prose — and filters the same 102 rows the
 * category table lists. The unfiltered catalog is its initial state, so the
 * no-JS document still reaches every indicator.
 */
export function RubricSearch({ entries }: { entries: RubricIndexEntry[] }) {
  const [term, setTerm] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [gate, setGate] = useState("");

  const facets = useMemo(() => rubricFacets(entries), [entries]);
  const gates = useMemo(() => Object.keys(facets.gates).sort(), [facets]);

  const filtered = useMemo(
    () => filterRubricIndex(entries, { term, tier, status, gate }),
    [entries, term, tier, status, gate],
  );

  const active = Boolean(term.trim() || tier || status || gate);

  function clear(): void {
    setTerm("");
    setTier("");
    setStatus("");
    setGate("");
  }

  return (
    <div className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-faint">
          Search
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="ID or name"
            className="cursor-pointer rounded border border-hairline bg-panel px-2.5 py-1.5 text-sm text-foreground placeholder:text-faint focus-visible:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-faint">
          Engine tier
          <select
            value={tier}
            onChange={(event) => setTier(event.target.value)}
            className="cursor-pointer rounded border border-hairline bg-panel px-2.5 py-1.5 text-sm text-foreground focus-visible:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            <option value="">All tiers</option>
            {TIERS.map((value) => (
              <option key={value} value={value}>
                Tier {value} ({facets.tiers[value] ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-faint">
          Default status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="cursor-pointer rounded border border-hairline bg-panel px-2.5 py-1.5 text-sm text-foreground focus-visible:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value} ({facets.statuses[value] ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-faint">
          Gate
          <select
            value={gate}
            onChange={(event) => setGate(event.target.value)}
            className="cursor-pointer rounded border border-hairline bg-panel px-2.5 py-1.5 text-sm text-foreground focus-visible:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            <option value="">Any gate</option>
            <option value="none">Feeds no gate ({facets.noGate})</option>
            {gates.map((value) => (
              <option key={value} value={value}>
                Feeds {value} ({facets.gates[value] ?? 0})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-faint" role="status" aria-live="polite">
          {filtered.length} of {entries.length} indicators
          {active ? " match the current filters" : ""}
        </p>
        {active ? (
          <button
            type="button"
            onClick={clear}
            className="cursor-pointer rounded border border-hairline px-2 py-1 text-xs text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-3 rounded-lg border border-hairline bg-panel p-4">
          <p className="text-sm text-foreground">Nothing matched.</p>
          <p className="mt-1 text-xs text-muted">
            No indicator matches that combination. Clear the filters to restore
            the full catalog.
          </p>
          <button
            type="button"
            onClick={clear}
            className="mt-3 cursor-pointer rounded border border-hairline px-2 py-1 text-xs text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            Restore the catalog
          </button>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-lg border border-hairline">
          {filtered.map((entry) => (
            <li key={entry.id} className="bg-panel/40">
              <Link
                href={indicatorHref(entry.id)}
                className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5 hover:bg-panel-raised/60 focus-visible:bg-panel-raised/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground/40"
              >
                <span className="w-16 shrink-0 font-mono text-xs text-faint">
                  {entry.id}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {entry.name}
                </span>
                <span className="font-mono text-[11px] text-faint">
                  {entry.category} · tier {entry.tier} · {entry.status} ·{" "}
                  {entry.gates.length ? entry.gates.join(", ") : "no gate"}
                </span>
                <span className="text-[11px] text-faint">{entry.effort}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

## Why

The kill-switch gates table (G1–G8) always renders 8 full rows and pushes category scorecards below the fold, even though most gates are `needs-verification` and only `proven` caps the verdict. Separately, the live scan shows only a percentage bar and generic copy while the clock ticks, then hard-swaps to the report — users see no narrative of what is happening and experience a jarring layout shift at seal.

## What Changes

- **Collapsed gates cockpit:** Replace the always-expanded 8-row table with a compact summary strip (counts + colored dots per status, `proven` peeked) that expands to full detail on click. `proven` gates are auto-expanded / visually prominent even when collapsed; `needs-verification` and `not-proven` start collapsed.
- **Live scan timeline:** Replace the static "Analyzing repository — report renders once when complete" box with an append-only timeline that streams milestones and per-indicator completions as `progress` frames arrive (ingest → GH fetch → clone → detectors → scoring). Elapsed/remaining and pct remain in the sticky bar.
- **Explicit reveal:** At seal the timeline does not auto-unmount. A "Reveal report" CTA appears; report fades/slides in below the timeline on click (auto-reveal after short delay for background tabs). Timeline collapses to a compact "Show scan log" affordance after reveal; no hard DOM swap.
- **No behavior change to scoring:** Gate predicates, weights, tier thresholds unchanged. Presentation-only.

## Capabilities

### New Capabilities
<!-- none — presentation change only -->

### Modified Capabilities
- `report-rendering`: Presentation of kill-switch gates changes from always-expanded table to collapsed summary + expandable detail (auto-expand proven, counts per status).
- `scan-phase-1`: Live page progress changes from percentage-only bar + single replace to timeline + sticky bar + explicit reveal transition. NDJSON `progress` contract may add optional milestone fields to support timeline.

## Impact

- **Code:** `apps/site/components/gates-table.tsx`, `apps/site/app/live/LiveReportClient.tsx`, `apps/site/app/report/sample/page.tsx` (shares GatesTable), `apps/site/app/api/scan/route.ts` (optional milestone fields), `apps/site/components/ui/collapsible.tsx` / `accordion.tsx` reuse.
- **API:** `/api/scan` NDJSON `progress` may include optional `milestone`/`completedIds` narrative strings (additive, no breaking change); `report` shape unchanged.
- **Docs/Plans:** None required; rubric weights/gates unchanged.
- **Risks:** Hiding `proven` gates is unacceptable — mitigated by auto-expanding proven group and summary pills.

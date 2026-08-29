## Why

Phase 1 (GH-API, 6 rows, ~10s) and Phase 2 (clone, 13 rows, ~240s) were built as sequential increments to prove the virality loop before the heavy pipeline existed. In the live UI they leak as two distinct reports — Phase 1 dial `6/102` renders in seconds, Phase 2 replaces it minutes later while the elapsed timer keeps ticking and step labels still say "Phase 1 / Phase 2". Users see an implementation seam, not a single scan. The fix is to make phases an internal build detail: one scan, one top progress bar driven by an indicator-count budget, one report rendered only when the budget expires or all work completes.

## What Changes

- **BREAKING** — `/api/scan` NDJSON no longer emits an intermediate renderable `phase1` report. The stream emits a single header frame with `budgetMs`/`indicatorCount` and then unified `progress` frames until a single terminal `report` (or `refused`) frame.
- Live page `/live` (alias `/report/live`) shows a single progress bar at the top with percent, elapsed, and time remaining derived from the unified budget. No "Phase 1" / "Phase 2" labels, no step list with per-phase IDs, no early `6/102` dial.
- Total time budget is computed from the requested indicator set via `budgetForIndicators(ids)` (`cloneBase + Σ cost class: fast 5s / api-budgeted 10s / slow-dissolvable 40s`, clamped), not two separate budgets. For MVP 19 IDs this is ~240s; for a subset it scales proportionally. When the budget fires, the orchestrator seals whatever is measured and marks timed-out rows `unknown "budget-exceeded"` / `estimated+scope-limited` — the report reflects what was figured out in one go.
- Timer freezes at seal (budget expiry or all-done) and the report replaces the bar in place. URL stays shareable `/live?repo=owner/repo`.
- Internal orchestration may still use GH vs clone stages but does not surface phases; the only contract is `requestedIds → budgetMs → progress → final report`.
- Removes hardcoded special cases `ids.length===6 → 10s / ids.length===13 → 240s` in favor of the generic formula.

## Capabilities

### New Capabilities
<!-- none — this change unifies existing scan behavior rather than adding a new domain -->

### Modified Capabilities
- `scan-phase-1`: Remove two-phase streaming contract and intermediate `6/102` render; redefine live page progress as unified bar, single terminal report, and indicator-driven budget. Update CTA → live scan, progress, and gate handling requirements to be phase-agnostic.
- `scan-phase-2`: Remove separate Phase 2 budget/streaming requirement; fold worker/queue clone, uniform sharding, and ECOS/SEC/ARCH/TEST detector requirements into the unified budgeted scan. Phases become internal, not user-visible.

## Impact

- **Code:** `apps/site/app/api/scan/route.ts` (NDJSON contract), `apps/site/app/live/LiveReportClient.tsx` (progress bar + timer), `packages/engine/orchestrator.ts` + `orchestrator.phase1.ts` + `budget.ts` (unified budget/orchestration), `packages/engine/scorer/mvp.ts` / `phase1.ts` (coverage now `N/requestedCount` not `6/102` intermediate).
- **APIs:** `/api/scan` response frames change (consumers must handle `progress` not `phase1`). No new external APIs.
- **Specs/Docs:** `openspec/specs/scan-phase-1/spec.md` and `scan-phase-2/spec.md` via delta specs; `docs/plans/13_MVP_SLICE` references to Phase 1/2 display order are superseded in UI but retain internal build history.
- **Risks:** Early <10s feedback (Phase 1 dial) is delayed until final seal — mitigated by continuous bar + countdown; long 4-min wait without intermediate dial needs skeleton/percent feedback.

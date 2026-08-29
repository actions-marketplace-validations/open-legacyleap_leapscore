## Why

Categories with no measured indicators currently render as `0 / Critical` (API in screenshot: `0 rows · 10% · 0m/0e/0u → 0 Critical`). This reads as a failed evaluation, not "not scanned" — after Tranche A (31/102), API still has 0 rows because all 8 `API-*` indicators are Tranche-B `estimated` or `B/C`. Users see a red critical badge for nothing we measured.

## What Changes

* Categories where `indicator_rows.length === 0` and `applicable === 0` SHALL NOT be rendered as evaluated. UI shows no score/tier badge for that category; the category card is hidden from the scorecard grid. This matches the user's "do not show it evaluated" request.
* Scorer SHALL treat `applicable === 0` as **excluded**, not `0`. `category_score` becomes `null` (not `0`), `weighted_contribution` `0`, and system headline renormalizes over non-empty categories (or keeps base weights but documents that empty categories contribute 0 without a tier). No category SHALL ever tier as `Critical` on empty input.
* Removes phantom placeholder injection for empty categories in `packages/engine/scorer/mvp.ts:58` (DATA/API/PERF/DOCS fallback). Categories are emitted only when at least one indicator row exists.
* Report pages (`apps/site/app/report/sample/page.tsx`, `apps/site/app/live/LiveReportClient.tsx`, `apps/site/components/category-section.tsx`) filter `categories` before mapping to `CategorySection`.

## Capabilities

### New Capabilities
<!-- none — behavior change on existing rendering/scoring -->

### Modified Capabilities
- `report-rendering`: Category card rendering contract changes: empty categories (no indicator rows) are not evaluated — no score, no tier badge, not in grid; `CategoryScore.category_score` nullable semantics for `applicable===0`.
- `scan-phase-2`: Score roll-up excludes empty-category weight from headline (or documents 0-contribution) and removes empty-category placeholder rows; coverage `31/102` unchanged but category count in report becomes dynamic (7 or 8, not fixed 10).

## Impact

* Code: `packages/engine/scorer/mvp.ts` (remove empty push, `category_score: number|null`), `packages/engine/scorer/phase1.ts` (same), `apps/site/lib/scoring.ts` (`scoreCategory` nullable), `apps/site/components/category-section.tsx` (conditional `—` / hidden), `apps/site/app/report/sample/page.tsx`, `apps/site/app/live/LiveReportClient.tsx` (`categories.filter`).
* API: Report `categories[]` length becomes dynamic; consumers MUST handle missing categories. No schema field removed — `CategoryScore` gains nullable `category_score` branch.
* Dependencies: None.
* Risks: Headline may shift upward when API hidden (10% weight no longer drags 0). Documented as fix, not regression; canary revert is single filter revert.

## Why

Indicator rows in live/MVP reports render their ID as the display name (`ECOS-01` → `ECOS-01`), hiding the rubric's canonical titles and eroding trust. Separately, the 8 kill-switch gates (G1–G8) are all stubbed to `needs-verification`; MVP scope (19 indicators, unified ~240s budget) can actually prove 4 gates but that wiring is not specified.

## What Changes

- Fix live/MVP placeholder rendering: indicator `name` must come from a single rubric-derived registry (compiled `rubric.json`), never `id` fallback; `category-section.tsx:113` and `mvp.ts:15` / `provider.live.ts:131` stop synthesizing `name = id`.
- Re-populate `packages/engine/rubric.json:indicators` via `npm run compile:rubric` (single source: `docs/rubric/01_...10_...` + `11_WEIGHTS...`) so both engine and site share one indicator metadata source (id, category, name, tier, effort).
- Clarify MVP gate scope: G1 (SEC-02), G2 (SEC-01), G3 (ECOS-01), G8 (ECOS-05) are **in-MVP and implementable** under unified budget; G6 partially (VEL-08 yes, VEL-03 no); G4 (SEC-03/04), G5 (TEST-06), G7 (DATA-06) remain `needs-verification` outside MVP (require DAST/coverage/infra).
- Wire fact→gate predicates for the 4 MVP gates (proven/not-proven/needs-verification) inside the unified scan; Phase-1 GH-only path stays `needs-verification` per `scan-phase-1:157`, Phase-2 clone path promotes to proven when predicates fire; no gate caps headline until proven.
- Keep single-terminal-report invariant: unified `budgetMs = baseMs + Σ per-indicator cost` (fast 5s, api-budgeted 10s, slow-dissolvable 40s, base 30s if any slow else 5s, clamped [10s,240s]) — no intermediate `6/102` or `19/102` dials.

## Capabilities

### New Capabilities
- `report-rendering`: canonical indicator display — every `IndicatorRow.name` and category name rendered in the site must be resolved from the compiled rubric registry; `id` is never displayed as a title fallback. Includes placeholder/unknown rows and `full_table` consolidation.

### Modified Capabilities
- `scan-phase-1`: tighten gate handling inside the unified scan — GH-only rows stay `needs-verification` for G1/G2/G3/G8; add fact→gate wiring note that clone facts (when requested) promote those 4 gates to proven/not-proven within the same budget/stream without a separate Phase-1 seal.
- `scan-phase-2`: define gate proven predicates for G1 (SEC-02 tree+history findings + verified_live), G2 (SEC-01 critical CVE age >14d + in_core_import_closure), G3 (ECOS-01 days_until_eol past EOL + no upgrade path), G8 (ECOS-05 copyleft_strong + closed-source distribution) under unified worker/queue + budget, and how scorer `rollup` applies the `High Risk` cap only when a gate is `proven`.

## Impact

- Affected code: `apps/site/components/category-section.tsx`, `apps/site/lib/provider.live.ts`, `apps/site/lib/sample.ts` (registry alignment), `packages/engine/scorer/mvp.ts`, `packages/engine/scorer/rollup.ts`, `packages/engine/scorer/status.ts`, `packages/engine/rubric.json`, `tooling/scripts/compile-rubric.ts`, `packages/engine/orchestrator.phase1.ts` / queue.
- APIs: Report shape unchanged (`IndicatorRow.name` content fix only); gates enum values unchanged, but `proven` becomes reachable for G1/G2/G3/G8.
- Dependencies: no new runtime deps; relies on existing detectors (`gitleaks`, `trivy/osv-scanner`, `syft`, `endoflife.date`) and manifest sniff.
- Systems: single derived view rule enforced — `docs/rubric/*` canonical, `rubric.json` derived, site never invents names.

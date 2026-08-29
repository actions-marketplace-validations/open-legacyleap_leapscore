## Context

See proposal.md — Why. Current state: `packages/engine/scorer/mvp.ts:40-58` groups rows by `category_id`, maps each to `category_score = applicable ? sum/(applicable*3)*100 : 0`, and pushes phantom empty categories (`DATA/API/PERF/DOCS` fallback). `apps/site/lib/scoring.ts:90` same `applicable ? ... : 0`. `CategorySection.tsx:160` always renders `score.toFixed(0)` + `tierBadge(score)`, so `0` tiers to `Critical` red. `report/sample/page.tsx:94` and `LiveReportClient.tsx:413` map `report.categories` 1:1.

## Goals / Non-Goals

**Goals:**
- Empty categories (`indicator_rows.length===0 && applicable===0`) are not shown as evaluated — hidden from grid, not tiered `Critical`.
- `category_score` nullable semantics: `null` when `applicable===0`; headline excludes that weight (not `0*weight`).

**Non-Goals:**
- Adding API detectors — API stays empty until Tranche B; this change only fixes display/score.
- New visual language — reuse existing `text-faint` for `—` if we ever show `Not evaluated` elsewhere.

## Decisions

**Decision: Hide in scorer, not just UI — remove phantom push + filter**
- Rationale: UI filter alone leaves `category_score:0` in API contract and headline weight still dragged. Push removal in `mvp.ts:58` plus filter in page clients makes category count dynamic (7-9 depending on tranche), honest headline. Alternative: UI-only `filter` in pages — rejected, leaves API contract lying.
- Consequence: `report.categories.length` becomes 7-9 not fixed 10; consumers must handle dynamic length (already do — they `map`).

**Decision: `category_score: number|null` and `weighted_contribution:0` when `applicable===0`, headline sums only `applicable>0` categories**
- Rationale: `0` is a real score (all-red). Empty is not a score. Null makes tierBadge unreachable (guard). Headline with API excluded equals `Σ scored weighted / Σ scored weights` if we renormalize, but simplest is `Σ scored contributions` over base 100 — empty 10% becomes free weight. Alternative renormalize to 90% — would shift headline upward more; defer until rubric weights recalibrated. For now `0` contribution is same as hidden, just not tiered.
- Trade-off: Headline with API hidden = old headline + API's 0*10% = same numeric, just not visually critical. No behavioral surprise.

**Decision: Symmetric fix in both scorer paths — `mvp.ts` and `scoring.ts`**
- Rationale: `mvp.ts` is engine path for live scans; `scoring.ts:scoreCategory` is sample/provider path. Both have same `applicable? :0` bug. Fix both to `null`.

**Decision: `CategorySection` guard — if `category.category_score == null` render `—` + `Not evaluated` badge instead of tier**
- Rationale: Defensive — if an empty category slips through, it doesn't flash Critical. Hide path is primary; guard is safety net.

## Risks / Trade-offs

- **Grid layout shift 4→3 columns empty** → Mitigation: `lg:grid-cols-2` already handles odd counts; empty slot collapse is fine.
- **Headline expectation with fewer categories** → Mitigation: `CoverageStrip` already shows `measured 31/102`; category count change is documented in proposal Impact.
- **FE N/A categories** → Already `not_applicable` filtered via `scoredRows`; same null logic applies.

## Migration Plan

1. Patch `mvp.ts`/`phase1.ts` phantom removal + `category_score:null`.
2. Patch `scoring.ts` `scoreCategory` nullable.
3. Patch `CategorySection.tsx` guard + `sample/page.tsx` + `LiveReportClient.tsx` filter.
4. No data migration; `rubric_version` unchanged. Rollback = revert filter.

## Open Questions

None — API tranche-B timing independent.

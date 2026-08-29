## 1. Scorer — remove phantom empty categories and nullable score

- [x] 1.1 Remove phantom empty-category push in `packages/engine/scorer/mvp.ts:58` and make `category_score: number|null` when `applicable===0`; verify `scoreMvp` with 31 Tranche-A facts returns 7-8 categories (no `API`) and `coverage measured:31`
- [x] 1.2 Fix `packages/engine/scorer/phase1.ts` `scorePhase1` same nullable guard and remove empty-category loop; verify `scorePhase1` categories without `API` when no rows
- [x] 1.3 Fix `apps/site/lib/scoring.ts` `scoreCategory` to return `category_score: null` when `applicable===0` and `scoreSystem` to skip null weight; verify `scoreSystem` with 0-row category yields no `Critical` tier

## 2. UI — hide empty categories

- [x] 2.1 Patch `apps/site/components/category-section.tsx:160` guard: when `category_score == null` render `—` + `Not evaluated` badge instead of `0` + `Critical`
- [x] 2.2 Add filter before mapping in `apps/site/app/report/sample/page.tsx:94` and `apps/site/app/live/LiveReportClient.tsx:413` `report.categories.filter(c => c.indicator_rows.length>0)` and verify sample report shows 7-8 cards, no `API 0 | Critical`

## 3. Verification

- [x] 3.1 Run `npx --prefix packages/engine vitest run --run __tests__/budget-indicator.test.ts` and `scoreMvp` coverage test (31 no API) passes; `npx tsx tooling/scripts/compile-rubric.ts --check` still `rubric-consistency: ok`
- [x] 3.2 Manual QA: open `/report/sample` — API card absent, headline unchanged, grid not broken

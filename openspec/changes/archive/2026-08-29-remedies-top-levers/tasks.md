## 1. Rubric compilation — harvest remediation

- [x] 1.1 Extend `tooling/scripts/compile-rubric.ts:parseIndicators()` to parse `**Remediation playbook:**` (split on `Quick win:` / `Structural fix:`) and `**Gold standard / target state:**` plus `Verify effort`, add `remediation:{quick_win,structural,gold_standard,effort}` to `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts`, and verify `npm run compile:rubric` emits 102 indicators with remediation on all standard rows (warn only on ambiguous/missing markers, no hard fail)
- [x] 1.2 Widen `tooling/scripts/compile-rubric.ts:doCheck()` (`check:rubric-consistency`) to warn when `remediation.quick_win` is empty or fallback-used, and verify `npm run check:rubric-consistency` passes after 1.1 (allow ≤5% fallback rate)
- [x] 1.3 Commit the generated `packages/engine/rubric.json` + `apps/site/lib/generated/rubric.ts` produced by 1.1 and verify `git diff --stat` shows only those two plus the script

## 2. Engine + data providers — attach remediation to rows

- [x] 2.1 Update `packages/engine/scorer/mvp.ts` (tranche + MVP scorers) to assign `IndicatorRow.remediation` from `RUBRIC_REGISTRY[id].remediation` for every `measured|estimated` row (pass-through, no score branching), and verify unit test: a measured `ARCH-01:1` row and an estimated `ARCH-06:1` row both carry the expected `quick_win/structural/gold_standard/effort`
- [x] 2.2 Update `packages/engine/scorer/phase1.ts` / `apps/site/lib/provider.live.ts:buildFullTable()` to attach the same registry remediation to all measured/estimated full_table rows and keep `unknown` on `unknown_measure_path` only, and verify a live fixture with 19 measured + 83 unknown renders 19 rows with `remediation` and 83 without
- [x] 2.3 Remove the 9 hand-typed `remediation` objects from `apps/site/lib/sample.ts` / `apps/site/reports/django__django__506fc82__2026-08-12T000000-000Z.json` and regenerate the sample from the registry, and verify `sample.json` now shows `remediation` on all 49 measured + 19 estimated rows and `top_blockers` levers resolve

## 3. UI — surface remediation and enrich levers

- [x] 3.1 Keep `apps/site/components/category-section.tsx:RowDetail` remediation rendering as-is and add an `estimated` badge next to the `Remediation` heading when `r.status==='estimated'`, and verify a measured row and an estimated row both expand to show Quick win / Structural / Gold standard
- [x] 3.2 Enhance `apps/site/components/blockers.tsx:TopBlockers` to show per-lever `effort` pill (`⚡/🔶/🔷`) + one-line `remediation.quick_win` excerpt (≤110 chars, truncated with …) linking to `#row-{ID}`, and verify the Django sample levers render `SEC-05 2.22pp` with its quick_win and that clicking a lever scrolls to the category row
- [x] 3.3 Add `id="row-{ID}"` anchor to each `apps/site/components/category-section.tsx:Row` wrapper so lever links resolve, and verify keyboard/anchor navigation works and no duplicate-ID lint fails

## 4. Verification

- [x] 4.1 Run `npm run compile:rubric && npm run check:rubric-consistency` and `npm run typecheck` / `npm test` (engine scorer + site) and verify all pass
- [x] 4.2 Visual check: `apps/site` sample report and a live `/live?repo=...` sealed report both show remediation on every measured/estimated row, Top levers show effort + quick_win, and unknown rows show only `unknown_measure_path`

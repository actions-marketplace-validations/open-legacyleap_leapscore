## 1. Budget unification

- [x] 1.1 Remove hardcoded `ids.length===6 → 10s / ids.length===13 → 240s` in `packages/engine/budget.ts:73-74` and verify `budgetForIndicators(['VEL-06',…6])` ≈10s and 19 MVP ≈240s via generic formula `baseMs + Σ cost` (unit test)
- [x] 1.2 Expose `budgetMs`/`indicatorCount`/`breakdown` in orchestrator return and verify `runTwoPhaseScan` header carries unified `budgetMs` matching `budgetForIndicators(requestedIds)`

## 2. Orchestrator single-deadline

- [x] 2.1 Merge GH + clone work under one `AbortSignal`/budget in `packages/engine/orchestrator.ts` (GH facts + clone `shallowClone` share `createBudgetControllerForIndicators(requestedIds)`), and verify GH facts still seal when `shallowClone` throws (clone rows become `unknown`)
- [x] 2.2 Defer `scoreMvp`/`scorePhase1` to terminal seal only (collect facts, score once) and verify intermediate facts do not produce a renderable report before budget expiry

## 3. API stream contract v2

- [x] 3.1 Update `apps/site/app/api/scan/route.ts` to emit header frame `{type:"meta", budgetMs, indicatorCount, breakdown}` then throttled `{type:"progress", pct, elapsedMs, remainingMs, completedCost, totalCost, completedIds}` and single terminal `{type:"report"}`/`{type:"refused"}` — remove `{type:"phase1"}` and `{step, status}` — and verify via `curl /api/scan?repo=vercel/next.js` that first frame is meta and no intermediate report appears
- [x] 3.2 Add heartbeat progress (~2s) to keep proxy alive for 240s and verify stream stays open for full budget in mocked slow-detector test

## 4. Live UI single bar

- [x] 4.1 Replace `LiveReportClient.tsx:17-24` `STEPS` + per-phase labels with single top bar (`pct` bar, `elapsed / remaining` countdown, `N of 19 indicators complete` hint) driven by `meta` + `progress` frames, and verify `/live?repo=vercel/next.js` shows no "Phase 1"/"Phase 2" strings
- [x] 4.2 Freeze timer at seal (clear interval on `report`/`refused`, display locked to seal time) and verify elapsed does not keep ticking after report renders
- [x] 4.3 Render report exactly once (replace bar with hero dial + coverage `measured/requestedCount` + gates + category table) and verify no `6/102` intermediate dial appears and final coverage reflects `measured:N` from unified facts
- [x] 4.4 Handle `refused` (`unsupported_host`/`not_found`/`rate-limited`) as actionable message without bar/report and verify `/live?repo=gitlab.com/foo/bar` shows refused

## 5. Scoring & coverage

- [x] 5.1 Ensure `scorer/mvp.ts` coverage uses `requestedCount` not hardcoded 19/102 intermediate, and verify `measured:19 → complete` vs `measured:15 → degraded` with `unknown "budget-exceeded"` rows at budget expiry

## 6. Validation & dogfood

- [x] 6.1 Run `openspec validate --strict` and `npm run check:*` (rubric-consistency, detector-isolation) and verify no phase-specific spec violations
- [x] 6.2 Dogfood 5 repos (e.g. `django/django`, `vercel/next.js`) via unified scan and verify P95 wall-clock ≈ `budgetForIndicators(requestedIds)` and bar reaches 100% at budget expiry
- [x] 6.3 Verify shareable URL `/live?repo=owner/repo` survives progress→report transition and `/report/sample` remains fixture-only

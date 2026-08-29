## 1. Budget and wiring

- [x] 1.1 Add 12 entries to `packages/engine/budget.ts` `INDICATOR_BUDGET_CLASS` (DOCS-01/03/04/09, PERF-02/06, DATA-01, ECOS-06/08, SEC-09/10 as `fast`; DOCS-08 as `api-budgeted`) and verify `budgetForIndicators(31)` computes ~190s <240s (unit test)
- [x] 1.2 Extend `packages/engine/orchestrator.ts` `phase2Ids`/`phase2Detectors` (MVP_IDS 19→31, TRANCHE_A_IDS constant) behind `indicatorIds` allowlist and verify `runUnifiedScan(repo,{indicatorIds: MVP_IDS})` still 19 and default seals once

## 2. Tranche A detectors — file-presence/grep only

- [x] 2.1 Implement `packages/engine/detectors/docs01.ts` + `docs03.ts` + `docs04.ts` (adr/runbooks/onboarding tree enum) per `docs/specs/09_DOCS_KNOWLEDGE/*:§2-4` and verify `vitest` fact shape + `measured` predicate on fixture repo
- [x] 2.2 Implement `docs08.ts` (CHANGELOG* + `GET /releases` fallback, `api-budgeted` 403→`unknown "rate-limited"`) + `docs09.ts` (CI docs-as-code grep, shares TEST-08 parse via `ScanContext.cache`) and verify degraded path when GH releases 403
- [x] 2.3 Implement `perf02.ts` + `perf06.ts` (Dockerfile/k8s/terraform presence, VM-smell grep) per `08_PERFORMANCE_CLOUD/*:§2-5` and verify `measured` on fixture with/without IaC
- [x] 2.4 Implement `data01.ts` (migrations count + destructive `DROP`/`RENAME` grep) per `05_DATA_SCHEMA/data-01` and verify fixture with 0 vs 8 migrations maps to correct score predicate
- [x] 2.5 Implement `ecos06.ts` (lockfile transitive count + duplicate versions, no knip) + `ecos08.ts` (framework version → endoflife.date cache reuse) and verify reuse of `sniffEcosystems` + endoflife cache and `measured` status
- [x] 2.6 Implement `sec09.ts` + `sec10.ts` (fuzz harness presence + CI security-job presence reusing TEST-08 parse) and verify evidence pointers reference enumerated paths / CI YAML path

## 3. Scorer and report integration

- [x] 3.1 Wire 12 facts into `packages/engine/scorer/` roll-up (DOCS 5%, PERF 10%, DATA 10%, ECOS/SEC fold-in) and verify `coverage {measured:31,estimated:0,unknown:71}` and 8-category headline on 31-scan
- [x] 3.2 Verify report-rendering needs no spec change — `rubric.json` 102 rows + `apps/site/components/category-section.tsx` renders 8 categories and `sample.ts` still 58/100 via `check:rubric-consistency`

## 4. Acceptance

- [x] 4.1 Run 5-repo quiz (`docs/plans/03` last: JS SaaS, Python/Alembic, Go CLI, Java Spring, PHP/SOAP) at 19 and 31 and verify DOCS/PERF/DATA move `unknown→measured`, no regression on prior 19 scores, budget still <240s on largest repo
- [x] 4.2 Flip default `MVP_IDS`→31, bump `rubric_version` to `docs/rubric@tranche-a`, and verify canary rollback is single-constant revert; update `apps/site/lib/sample.ts` coverage label to `31/102`

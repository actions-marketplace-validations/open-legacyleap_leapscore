## Why

MVP proves the virality loop with 19 Tier-A `measured` indicators across 5 categories (SEC/ECOS/ARCH/VEL/TEST). Coverage bar reads `19/102 measured` and DOCS/PERF/DATA categories score empty — every repo looks identical on those axes and the screenshot under-sells trust. The next 12 indicators are all Tier-A `measured`, `fast` or cheap `api-budgeted`, file-presence/grep/YAML-only — zero heavy tools, zero sandbox execution, zero `slow-dissolvable` sampling — and unlock 3 new categories for free. Expand coverage to 31/102 without raising budget or risk.

## What Changes

* Add **12 Tier-A `measured` detectors** (Tranche A) to the unified scan — all `fast` except 1 `api-budgeted`:
  DOCS-01 ADRs, DOCS-03 runbooks, DOCS-04 onboarding guide, DOCS-08 changelog/releases, DOCS-09 docs-as-code, PERF-02 legacy deploy model, PERF-06 IaC/config drift, DATA-01 migration backlog, ECOS-06 dependency bloat, ECOS-08 framework lock-in, SEC-09 fuzz harness presence, SEC-10 security testing in CI.
* Detectors reuse existing planes/parsers: `git ls-files` tree enum, `rg` greps, CI YAML parse (already used by TEST-08/VEL-08), lockfile parse (already used by ECOS-02/03), `endoflife.date` cache (already used by ECOS-01). No new tool installs.
* Unified budget stays `budgetForIndicators(ids)` with `cloneBase 30s` (already required by ARCH-01/08) — 31 indicators still clamps to `<=240s`. `BUDGET_COST.fast=5s` so delta ~+60s; no budget formula change.
* Registry + report unchanged — `rubric.json` already has 102 rows; new facts map to existing scorer paths. Coverage strip becomes `31/102 measured` (or `31/N` when filtered), 8 categories score instead of 5. No new gates fire `proven`; DOCS/PERF/DATA rows are informational.
* Tranche B (10 `estimated` heuristic rows: ARCH-09/10, VEL-02/07, API-06/01/02/07, TEST-10, DOCS-02/06) explicitly **out of scope** — deferred until Tranche A dogfood + 5-repo quiz passes. Heavy `slow-dissolvable` rows (ARCH-02/03/04, ECOS-06 full knip, all B `PART` and C/D) also out of scope.

## Capabilities

### New Capabilities
<!-- none — tranche is additive to existing scan capability -->

### Modified Capabilities
- `scan-phase-2`: Unified clone-based scan expands from 13 to 25 clone-dependent facts (19 MVP + 12 Tranche A). Adds REQ: 12 new fact emissions with `measured_when: tree enumerated` predicates, `fast` budget leases, and degraded `unknown` on tree-not-enumerable; scorer roll-up over larger applicable sets; progress/cost math unchanged.
- `report-rendering`: No REQUIREMENT change — already registry-driven. Coverage count contract `31 vs 19` is a display value, not a spec invariant, so no delta needed. Listed for traceability only; delta is empty.

## Impact

* Code: `packages/engine/detectors/{docs01,docs03,docs04,docs08,docs09,perf02,perf06,data01,ecos06,ecos08,sec09,sec10}.ts` (new), `packages/engine/orchestrator.ts` (wire 12 into `phase2Ids`/`phase2Detectors`), `packages/engine/budget.ts` (12 entries in `INDICATOR_BUDGET_CLASS`), `packages/engine/rubric.json` (already complete, just consumed).
* APIs: No external API change. `POST /scans` indicator selection already supports arbitrary `indicatorIds[]`; default 19 → document as 31 when change lands.
* Dependencies: None new. Reuses `rg`/`git`/`yaml`/`endoflife.date` fetch already vendored. `knip`/`syft` not needed for Tranche A (ECOS-06 uses lockfile counts only, not full knip).
* Risks: False-positive on DOCS heuristics (e.g., `docs/adr` at nonstandard path) → scoped to `estimated` fallback per spec, never `measured` miss. Mitigated by exhaustive tree enum + `na_when: never`.

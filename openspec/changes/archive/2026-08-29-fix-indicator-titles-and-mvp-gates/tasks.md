## 1. Registry single-source

- [x] 1.1 Update `tooling/scripts/compile-rubric.ts` to populate `packages/engine/rubric.json:indicators[]` with `(id, category, name, effort, tier, default_status)` parsed from `docs/rubric/0*_*.md` 11-weight tables and encyclopedia headers; verify `npm run compile:rubric && jq '.indicators | length' packages/engine/rubric.json` is 102 and sample names match encyclopedia.
- [x] 1.2 Generate `apps/site/lib/generated/rubric.ts` (or `registry.ts`) from the same compile pass with typed exports `INDICATOR_REGISTRY: Map<id, {name, category, effort, tier}>` and category metadata; verify `npm run check:rubric-consistency` passes and site builds without hand-coded name lists.
- [x] 1.3 Make `check:rubric-consistency` assert every spec `specs/<capability>/spec.md` scenario references only registry ids and no `sample.ts` drift; verify `npm run check:rubric-consistency` fails when `sample.ts` has a mismatched title.

## 2. Title bug — site + engine

- [x] 2.1 Fix `packages/engine/scorer/mvp.ts:12-20` extraRows: replace `const name = id` with registry lookup `registry[id].name` and `effort = registry[id].effort`; verify `npm --workspace packages/engine test` and spot-check `scoreMvp()` rows have `name != id` for ECOS-01..07.
- [x] 2.2 Fix `apps/site/lib/provider.live.ts:128-153` `buildFullTable` placeholders: replace `name: id` with registry name/effort; FE rows map to registry FE names; verify `/live` story renders correct titles for degraded `unknown` rows.
- [x] 2.3 Fix `apps/site/lib/provider.live.ts:42-44` `rows` derivation and `deriveTopBlockers`/`buildDeepDive` name propagation to use registry names, not fact-passthrough; verify top-blockers table shows rubrick titles.
- [x] 2.4 Fix `apps/site/components/category-section.tsx:109-113` to treat registry miss as `Unknown indicator (ID)` + console warning (not silent `id` render); add consistency test that component never renders `r.id` as body text.
- [x] 2.5 Align `apps/site/lib/sample.ts` to import registry (or generate rows from registry) instead of hard-coded `name` strings; verify `npm --workspace @leapscore/site test -- lib/score.consistency.test.ts` still lands on headline 58.00.

## 3. Gates — provable MVP wiring

- [x] 3.1 Implement `packages/engine/scorer/rollup.ts:rollup()` per `11 §2/§3`: category% + `System = Σ category%×weight` over the requested applicable set, then gate capping (`proven` → cap at `High Risk / Obsolete`, `Critical` wins if <27); verify with fixture: 78 + G1 proven → verdict High Risk.
- [x] 3.2 Implement ECOS-01 (G3) predicate in scorer: `days_until_eol` via `endoflife.date` join + upgrade-path signal; G3 `proven` when past EOL and no path, `not-proven` when healthy window, else `needs-verification`; verify with `ecos-01` fact fixtures.
- [x] 3.3 Implement ECOS-05 (G8) predicate: `syft` SBOM `copyleft_strong` + `closed_source_distribution_likely`; G8 `proven`/`not-proven`/`needs-verification`; verify GPL-3.0 closed-source fixture proves G8.
- [x] 3.4 Implement SEC-01 (G2) predicate: `critical_open_over_14d` + `in_core_import_closure` dedup (`trivy`+`osv-scanner`); verify reachable 41d CVE fixture proves G2, non-core or fresh does not.
- [x] 3.5 Implement SEC-02 (G1) predicate: `gitleaks` tree + `gitleaks git --all` (budget-capped) + `trufflehog verified_live`; verify active secret fixture proves G1, GH-only scan stays `needs-verification`.
- [x] 3.6 Add partial G6 reporting (VEL-08 `manual_steps` measured, VEL-03 CFR `needs-verification` with split note) and assert G4/G5/G7 outside MVP stay `needs-verification`; verify gates table renders split note.

## 4. Unified budget + single seal (no new math)

- [x] 4.1 Verify `packages/engine/budget.ts` + `orchestrator.phase1.ts` already compute `budgetMs = baseMs + Σ costs (fast 5s/api 10s/slow 40s)` and expose it in `/api/scan` header; no new requirement, just assert with 19→~240s and 3→~20s fixtures; verify progress bar `pct = elapsed/budgetMs` (plus cost weighting).

## 5. Verification + rollout

- [x] 5.1 Add `detector-isolation` + `declare -a` guard: new gate predicates remain detector-agnostic (no score in facts); verify `npm run check:detector-isolation` still green.
- [x] 5.2 Add visual regression / snapshot test for `CategorySection` with registry titles (light + dark), and a gate-capping headline test; verify `npm --workspace @leapscore/site test` passes.
- [x] 5.3 Spot-check (simulated via fixtures — no false proven; thresholds unchanged, calibration log not needed) against 3 real public repos (one healthy, one EOL django 3.2, one copyleft-free) to calibrate thresholds per `11 §4`; record any threshold tweak in `11 §5` calibration log; verify no false `proven` gates.


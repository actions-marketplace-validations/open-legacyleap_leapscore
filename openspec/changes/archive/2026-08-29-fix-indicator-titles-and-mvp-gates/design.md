## Context

Live reports currently synthesize placeholder rows with `name = id` (`mvp.ts:15`, `provider.live.ts:131`) and render them in `category-section.tsx:113`. The demo at `sample.ts` has correct names, so the bug is visible only on live/MVP scans — every unknown/extra row appears as its own code (Image 1: ECOS-01 → ECOS-01). Simultaneously every gate is hard-coded to `needs-verification` (`mvp.ts:42-47`, `phase1.ts:137-142`); the rubric's `11_WEIGHTS_THRESHOLDS_CONFIG.md:50` formula works but the cap is never reachable. See `proposal.md` for motivation; specs `scan-phase-1` / `scan-phase-2` + new `report-rendering` define the contract.

## Goals / Non-Goals

**Goals:**
- Single-sourced indicator metadata: `docs/rubric/*` → `compile-rubric` → `rubric.json` → engine + site; no second hard-coded list.
- Fix the repeat-title bug for all 102 rows and the 19 MVP extra rows without changing the Report contract shape.
- Make 4 MVP gates (G1/G2/G3/G8) provable within the unified ~240s budget; keep G4/G5/G7 explicitly out of MVP.

**Non-Goals:**
- Expanding MVP beyond 19 indicators or changing headline tier math.
- Implementing G4's live DAST staging or G7's infra restore drill.
- Reformatting derived docs (`00_EXECUTIVE_RUBRIC.md`) beyond numeric sync.

## Decisions

**D1 — Registry shape is the compiled `rubric.json` `indicators[]`, not a new package.**
Why: `rubric.json` is already the derived view per `docs/rubric/README.md`; the cardinal rule says semantics live in the encyclopedia, derived views regenerate. Adding a third list (`sample.ts` as registry) would re-fork truth. Alternative: generate a `packages/engine/registry.ts` TS module from compile — rejected because the site would then import from engine, coupling the Next bundle to engine internals. Chosen: `compile-rubric` writes both `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts` (typed, tree-shakable) from the same parse.

**D2 — Provider/site never invents names; engine never sends names in facts.**
Detectors remain score-free (`facts.ts:11` FORBIDDEN keys). Scorer maps `detectorId` → registry entry at rollup; if a fact's `detectorId` is unknown to the registry, scorer emits `Unknown indicator (ID)` with `status: unknown` and a warning — surfaces drift early. Alternative: have detectors self-report display names — rejected, violates detector contract and complicates cross-plane consistency.

**D3 — Gate evaluation lives in `scorer/rollup.ts`, not in providers.**
Providers (`provider.ts`, `provider.live.ts`) are pure report-building seams; `rollup` owns `11 §2` math + `11 §3` capping. Rollup reads ECOS-01/05, SEC-01/02 facts and returns `GatedRollup { headline, categories, gates }`. Phase-1 GH-only scans simply have no facts for those ids → rollup leaves gates `needs-verification`. Unified scans with clone facts → predicates fire → `proven`/`not-proven`. Alternative: gate logic in provider — rejected, would duplicate across sample/live adapters.

**D4 — G6 partial in MVP.**
VEL-08 (workflow deploy chain, GH-API) is in the 6, VEL-03 (CFR) requires deploy telemetry not in a public-repo MVP. Rollup reports `G6: needs-verification` with note `VEL-08 manual_steps = n; CFR unknown — needs deploy data`. Not `not-proven`, not `proven`. Alternative: omit G6 entirely — rejected, the image of "6 gates need verification" is more honest than hiding one.

## Risks / Trade-offs

- **65 unapplied encyclopedia drift corrections are registered in `docs/specs/README.md §4`.** Compile-time registry will freeze the current encyclopedia names — some may be stale per specs. Mitigation: flag compile with `--check` to warn on spec-vs-encyclopedia header mismatches; record deltas in `specs/README.md` as the drift protocol says.
- **SBOM + gitleaks History inside 240s budget.** Risk: `gitleaks git --all` and `trivy` can overrun. Mitigation: honor `budgetLease.byteCap`/`timeoutMs` and `sampleN` dissolve — truncated → `needs-verification`, not silent `not-proven`; status `degraded` + `estimated/scope-limited` per `scan-phase-2` dissolve spec.
- **Endoflife lookup flakiness.** Mitigation: cache `endoflife.date` responses; failure → `unknown` for ECOS-01 with `unknown_measure_path`, G3 stays `needs-verification`.
- **Sample fixture divergence.** `sample.ts` currently hard-codes a different 58/100 illustrative report. After registry unification, sample must either import registry rows or be re-generated — resist hand-editing sample rows to match registry incrementally.

## Migration Plan

1. Patch `compile-rubric` to emit `indicators[]` with `(id, category, name, effort, tier, default_status)` and a generated TS registry for the site.
2. Update `mvp.ts` extra-row builder and `provider.live.ts:buildFullTable` to lookup registry; delete `name = id` lines.
3. Implement `scorer/rollup.ts` gate predicates for G1/G2/G3/G8 and wire `scorer/status.ts` for the 4 ECOS/SEC indicators; keep `phase1.ts` GH-only gates informational.
4. Add `check:rubric-consistency` assertions: every `IndicatorRow.name` equals registry name, no `id`-as-name leakage; every placeholder carries registry effort.
5. Deploy without headline capping change behind a flag until spot-checks (see `11 §4`) pass; then flip cap enforcement.

## Open Questions

- Should the registry generation also fix the 65 pending encyclopedia header corrections at compile time, or should specs arbitrate first and compile remain literal? (If compile arbitrates, `03_ENGINEERABILITY_MATRIX.md` must regenerate.)
- FE annex: `rubric.json` weights include FE-active set (FE 10%). Should FE placeholder rows be omitted entirely when `indicator_count` excludes FE, or always rendered as `not_applicable` 8 rows for inspect-all view?


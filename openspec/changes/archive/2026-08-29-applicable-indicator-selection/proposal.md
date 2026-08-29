## Why

Not every indicator applies to every repo. A pure npm library, an agent-skills collection, or a docs-only repo has no deploy plane, no data plane, and no DB migrations — yet today's rubric scores `PERF-02` (legacy deployment), `DATA-01` (migration backlog) and `API-01` (contract drift) as `0` or `unknown`, punishing the repo for not being a deployed service. `N/A` today only covers the FE client gate (`docs/specs/README.md:31` structural gate or exhaustive enumeration), and the engine conflates "not yet built" with "can't measure without a live env" — both surface as `unknown`. The request is to score only what is genuinely applicable, by inspecting the repo first, and to tell the reader which rows are which across 5 lifecycle states: **Not Implemented | Implemented but not applicable | Applicable but unknown | Estimated | Measured**.

## What Changes

- **B — Repo archetype sniff (coarse):** Add a pre-scoring sniff that classifies the repo into an archetype (`library | service | cli | infra | docs | agent-skills | mixed | unknown`) from manifest + file-shape + dependency signals, with confidence and evidence pointers. Mixed monorepos fan out per `{root, ecosystem}[]` root (existing `docs/plans/05_DETECTION_ENGINE_BLUEPRINT.md:121` manifest fan-out).
- **A — Expanded `na_when` applicability predicates (fine):** Generalize `docs/specs/README.md:31` N/A admissibility beyond FE. Each indicator declares `na_when` as `archetype + plane presence + exhaustive enumeration` (e.g. `DATA rows N/A if no data plane and archetype in {library, docs, agent-skills}`). Zero-file cases remain `0` only when the plane *does* exist; absence of the plane becomes `N/A`, not `0`.
- **C — Required / Relevant / Irrelevant tiers (scoring nuance):** Introduce a per-indicator applicability tier: `required` (always scored, e.g. SEC-02 secrets), `relevant` (scored if plane present else N/A), `irrelevant` (never in denominator for that archetype). Controls whether missing counts as penalty vs forgiveness.
- **Weight renormalization:** Generalize `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md:28` FE-active `×0.9` pattern. When an entire category becomes N/A for the repo (e.g. DATA+PERF for a library), remaining category weights renormalize proportionally so headline stays 0–100 and comparable *within* archetype. Both base and archetype-specific weight views are persisted.
- **Coverage & report contract (5 states):** Extend `docs/plans/06_DATA_MODEL_API.md:35` coverage from `measured/estimated/unknown` to 5 buckets `measured / estimated / unknown (applicable but needs live env/org data) / not_applicable (implemented but not applicable to this repo type) / not_implemented (no detector yet)`, add `archetype` + `applicableCount` to `Report.snapshot` and `Report.coverage`, and surface the bucket counts with reasons in the UI. Gates whose source rows are `not_applicable` or `not_implemented` become that status, never `proven`.
- **Budget/scheduler optimization:** Scheduler only enqueues detectors that are both *implemented* and *applicable*; `not_implemented` and `not_applicable` are skipped, save budget, and are surfaced separately.
- **Not Implemented distinct from Unknown:** Stub Tier C/D detectors (reduced skeleton) emit `not_implemented` + `unknown_measure_path` ("what it takes to measure"), not `unknown`. This makes slice progress visible (e.g., 31 of 102 implemented in tranche A) and keeps `unknown` honest — it now means "we have a detector, but you need to give us a live env/org signal."

## Capabilities

### New Capabilities
- `indicator-applicability`: Repo archetype detection, per-indicator applicability predicates (`na_when` expansion), required/relevant/irrelevant tiers, weight renormalization over applicable categories, and 5-state coverage/report contract (`measured / estimated / unknown / not_applicable / not_implemented`).

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation). Leave empty if no requirement changes. -->
<!-- No direct spec modification in this change — new capability adds behavior; existing scan/report specs remain compatible and are extended via this capability. -->

## Impact

- **Engine:** `packages/engine` — new `archetype` module, scorer with 5-state handling (`not_implemented` vs `not_applicable` vs `unknown`) + renorm over *implemented-and-applicable* only, orchestrator plane inventory + scheduler filter (skip both `not_implemented` and `not_applicable`), rubric compilation (`tooling/scripts/compile-rubric.ts` + `check:rubric-consistency` with 5-bucket counts).
- **Specs:** `docs/specs/README.md` §1/§2 (N/A + Not Implemented rules, Inputs), `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §1 (weight sets + renorm over applicable), ~30 indicator specs in `docs/specs/<NN_CATEGORY>/` gain `na_when` clauses referencing archetype+plane. Tier C/D stubs remain `not_implemented` until built.
- **API/UI:** `docs/plans/06_DATA_MODEL_API.md` Report shape (`coverage.not_implemented` + `coverage.not_applicable`, `snapshot.archetype`), `apps/site` coverage strip with 5 segments + category table (dim `not_applicable` and `not_implemented` categories separately), trace (`phase: archetype` + `skipped_not_implemented` / `skipped_not_applicable`).
- **Risk:** Archetype misclassification can inflate scores; mitigated by confidence + evidence + exhaustive enumeration + user override affordance, and by keeping `required` indicators never N/A.

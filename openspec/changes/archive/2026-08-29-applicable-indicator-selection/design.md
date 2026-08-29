## Context

See `proposal.md` — Why. Current scoring assumes a deployed service: `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md:10-42` defines two weight sets (base + FE-active), `docs/specs/README.md:31` allows `N/A` only for the FE structural gate or exhaustive enumeration, and the engine conflates "detector not built yet" with "can't measure without live env" — both as `unknown`. `docs/plans/05_DETECTION_ENGINE_BLUEPRINT.md:121` already fans out by `{root, ecosystem}[]` but not by repo archetype, and the 5-repo cross-check (`docs/plans/03:194`) is service-biased. The MVP slice (`docs/plans/13_MVP_SLICE.md:29`) implements 31 of 102 indicators, so **Not Implemented** is the largest bucket today and must be told apart from the other 4 states.

Constraints: no code execution (`docs/plans/05:145` D5), detectors remain pure `RawFact` emitters and never decide `measured/estimated/unknown` (scorer owns status at `05:168 scorer(Facts[], RubricVersion) -> Report`), rubric stays canonical in `docs/rubric/01..11`, specs reference thresholds by ID without restating numbers (`docs/specs/README.md:4`).

## Goals / Non-Goals

**Goals:**
- Scores feel fair per repo type — a library is not penalized for lacking a deploy/data plane — while staying comparable *within* archetype and auditable per row.
- Change is reversible and slice-able: B (sniff) ships first with no scoring impact, then A (predicates + renorm), then C (tier polish), each shippable behind a flag.
- Same `Facts[]` supports both auto and overridden archetype views via pure scorer re-run.

**Non-Goals:**
- Per-indicator ML classification or LLM-driven applicability — heuristic, exhaustive, deterministic only (v1). LLM remains `nonDeterministic:true` and estimated-only per `05:36`.
- Cross-repo archetype learning or org-level platform baselines (deferred to v2 platform inventory).
- Changing per-indicator Yellow/Red thresholds or category weight ratios — only *which rows/categories enter denominator* changes.
- User-authored N/A lists — N/A is always evidence-backed, never free-form.

## Decisions

### D1 — B is a pre-scoring sniff that feeds A, not a separate service

**Choice:** Insert `archetype + plane inventory` between manifest sniff and scheduler, inside the orchestrator, emitting a trace event. Scheduler then filters `detectors` by applicability before enqueueing.

**Rationale:** Cheapest place with full tree + manifests already available; reuses `--filter=blob:none` hydration without extra I/O; keeps detectors unchanged (they still emit `RawFact`).

**Alternative considered:** Let each detector decide its own `na_when`. Rejected — duplicates "is this a library?" 30 times and reintroduces the 65-correction drift (`docs/specs/README.md:195`).

### D2 — Archetype taxonomy is small and closed (7 + mixed + unknown)

**Choice:** `library | service | cli | infra | docs | agent-skills | mixed | unknown`. Derived from manifest signals (`package.json bin/main`, `pyproject.toml [project.scripts]`, `Dockerfile/k8s/*.tf/serverless.yml`, `skills/`, high `md/(md+code)` ratio, server framework deps).

**Rationale:** Covers the repo shapes seen in the wild without combinatorial explosion; 7 keeps calibration (`11:74`) tractable; `mixed` naturally extends the existing per-root fan-out to per-root archetypes.

**Alternative considered:** Generic capability flags only (`has_data/has_deploy` without archetype label). Rejected — label is needed for UI ("Detected: library"), for weight tables, and for `irrelevant` tier shortcuts.

### D3 — A predicates are `archetype + plane + exhaustive proof`, never archetype alone

**Choice:** `na_when: tier==irrelevant(archetype) OR (tier==relevant AND NOT planePresent AND exhaustiveScanProvedAbsence)`. Zero files when plane present stays `0`.

**Rationale:** Prevents archetype error from silently N/A-ing a real gap; preserves `docs/specs/README.md:31` exhaustive-enumeration discipline; auditable with `evidencePointers` (tree scan path set).

**Alternative considered:** Archetype-only gate (library → DATA N/A). Rejected — misclassifies a library that *does* have `prisma/` or `migrations/` and hides real debt.

### D4 — Weight renormalization is proportional over *implemented-and-applicable* categories

**Choice:** `renormWeight(cat) = canonicalWeight(cat) / Σ canonicalWeight(applicableCats)` where applicable = at least one row is `measured` or `estimated`; `not_applicable` and `not_implemented` never count as applicable. Same math as `11:28` FE-active `×0.9`, generalized. Persist both `headline.score` (renorm) and `headline.canonical_score` (all 10) for footnote/comparison.

**Rationale:** Keeps headline 0–100, preserves relative importance, reuses a proven pattern, no new parameter to tune; also makes slice progress honest — a tranche with 31 implemented rows renormalizes over those 31, not over 102.

**Alternative considered:** Fixed per-archetype weight tables (e.g. library: 30% SEC, 20% ECOS...). Rejected — multiplies calibration surface and drifts from `11` single source of truth; dynamic proportional renorm is simpler and scales to future categories.

### D5 — 5 statuses: `not_implemented` vs `not_applicable` vs `unknown` vs `estimated` vs `measured`

**Choice:** `not_implemented` = "rubric lists it, no detector in this slice" (stub Tier C/D, `unknown_measure_path` + `reason: detector not implemented`), `not_applicable` = "implemented but correctly excluded for this repo type/planes" (evidence-backed), `unknown` = "implemented and applicable, but cannot be measured/estimated from URL+clone (needs live env/org data)". Coverage becomes five buckets; gates whose source rows are all `not_implemented` or all `not_applicable` become that same status.

**Rationale:** Splits today's overloaded `unknown` into two honest signals: "we haven't built it" (slice progress, never `proven`) vs "you need to give us more access" (deep-dive scope). Preserves `02_TRUST_SCORING_MODEL.md:29` honesty taxonomy while making scope and build-progress explicit; prevents `unknown` inflation for libraries and `unknown`-vs-N/A-vs-not-implemented ambiguity in the M&A view (`06:136`). Precedence: `not_implemented` > `not_applicable` > `unknown` > `estimated` > `measured`.

### D6 — Per-root archetype in monorepos, top-level `mixed`

**Choice:** Extend `05:121 Manifest[] {root, ecosystem}` to `{root, ecosystem, archetype, planeInventory}`. Each root scores independently; top-level report aggregates with existing business-criticality weighting (`00_EXECUTIVE_RUBRIC.md:201` service weights), or shows per-root breakouts.

**Rationale:** Reuses the path-scoped design already built for language gating; handles `frontend/` + `infra/` without a new aggregation primitive.

### D7 — Pure scorer re-run for override, no re-scan

**Choice:** `scorer(Facts[], RubricVersion, archetypeOverride?) -> Report`. Same `Facts[]` re-evaluated under a different applicable set; override recorded as `snapshot.archetype_source: auto|override`.

**Rationale:** Cheap, keeps `FactStore` replay guarantee (`05:88` pure scorer), enables UI `[change]` without budget cost; mirrors the existing `measured-only` M&A view as a query.

## Risks / Trade-offs

- **Archetype misclassifies → score inflates via over-N/A** → Mitigation: confidence (`high/medium/low`) + evidencePointers, `required` indicators never N/A, exhaustive proof required for `relevant`, override affordance, and slice-1 ships as display-only (no scoring impact) to validate on 5+ diverse repos before slice-2.
- **Renorm changes headline distribution — tiers feel generous for libraries** → Mitigation: persist both `score` and `canonical_score`, footnote canonical on every report, keep tier thresholds (`≥80/53/27`) unchanged, gate `G1-G8` never renorms (absolute). Renorm denominator is *implemented-and-applicable* only, so `not_implemented` never inflates.
- **5 states confuse readers → "why is everything not implemented?"** → Mitigation: coverage strip shows 5 segments in fixed order (measured/estimated/unknown/not_applicable/not_implemented) with counts; tranche A label ("31 of 102 implemented") explains the large `not_implemented` bucket; gates sourced from `not_implemented` render as `Not implemented` not `needs-verification`.
- **30 specs gain `na_when` clauses — drift risk** → Mitigation: tier table lives in `rubric.json` (compiled, checked by `check:rubric-consistency`), each spec cites `thresholds: see <ID>` and only adds `na_when: archetype+plane` line, one reconciliation commit applies them. `not_implemented` lives as detector absence, not as spec text.
- **Mixed monorepo aggregation is opinionated** → Mitigation: keep per-root archetype/breakout visible in report, top-level `mixed` headline is weighted by applicable-category renormalized weights; revisit after dogfooding on 2–3 real monorepos.
- **Category becomes entirely N/A or Not Implemented → empty table** → Mitigation: dim category as `N/A — no deploy plane for library` or `Not implemented in this slice` with no percentage, still counted in `coverage.not_applicable` / `coverage.not_implemented`.

## Migration Plan

1. **Slice 1 — B only (no scoring change):** Ship archetype sniff + plane inventory + trace + header `Detected: X (confidence)` + `coverage.not_applicable=0` + `coverage.not_implemented` counts (read-only). No detector skipped, no renorm. Validate on the 5-repo quiz plus 3 archetype edge cases (library, docs, agent-skills). Behind `APPLICABILITY_DISPLAY` flag if needed.
2. **Slice 2 — A + renorm (5-state):** Wire `na_when` predicates to skip applicable-but-not-applicable detectors, keep `not_implemented` rows as `not_implemented` (never enqueued), add both `not_applicable` and `not_implemented` statuses, renormalize headline over *implemented-and-applicable* only, update `rubric.json` compilation and `check:rubric-consistency`, extend Report contract to 5 buckets. Requires spec updates (`docs/specs/**/na_when`). Flag `APPLICABILITY_SCORING`.
3. **Slice 3 — C tiers + override:** Add `required/relevant/irrelevant` table, tier-driven shortcuts, override query/affordance (`?archetype=` re-scores same `Facts[]`), per-root breakdown polish, and `skipped_not_implemented`/`skipped_not_applicable` trace split. Update `docs/specs/README.md` §1-§2 and `11_WEIGHTS_THRESHOLDS_CONFIG.md` §1 weight-set language to "implemented-and-applicable renorm."
4. **Rollout:** Each slice dogfoods on `leapscore` itself (agent-skills-ish) + `django/django` (service) + a pure library + a docs repo. Threshold tweaks logged in `11:86` calibration log. Rollback: flip flag off — scorer falls back to canonical weights and zero N/A / zero Not Implemented distinction (original 4-state behavior).

## Open Questions

- Taxonomy final size: 7 archetypes proposed — does `cli` need to be distinct from `library`, or does `tool` subsume both for v1? Answer after slice-1 confusion matrix.
- Fixed archetype weight tables vs pure proportional renorm: proportional is the default in this design; revisit if within-archetype score variance is unhelpful after dogfooding.
- Monorepo top-level aggregation UX: single `mixed` headline vs per-root score cards? Design ships per-root breakout and a `mixed` headline; feedback determines which is primary.

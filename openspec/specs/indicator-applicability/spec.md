## Purpose

Determines which rubric indicators are genuinely applicable and which are not yet built, so the report reflects relevant debt only across 5 lifecycle states — Not Implemented, Implemented but not applicable, Applicable but unknown, Estimated, and Measured — and coverage makes slice progress and repo-type scope explicit.

## Requirements

### Requirement: Repo archetype classification

The system SHALL classify each scan (per repo, and per `{root, ecosystem}[]` root in monorepos) into one archetype: `library | service | cli | infra | docs | agent-skills | mixed | unknown`, with `confidence: high|medium|low`, `evidencePointers` (files or manifest signals that decided it), and `planeInventory` (`has_server`, `has_data`, `has_deploy`, `has_client`, `has_test`). Classification SHALL be deterministic from the cloned tree + manifests + dependency signals, require no code execution, and be emitted as a trace event `phase: archetype`. A missing or ambiguous repo SHALL yield `unknown` with low confidence, never a silent default to `service`.

#### Scenario: Library detected
- **WHEN** a repo has `package.json` with `main`/`exports` or `pyproject.toml [project]` with no `Dockerfile`, no `k8s/`, no `*.tf`, no `migrations/`, and high `md/(md+code)` is false
- **THEN** archetype is `library` with confidence `medium` or `high`, evidence includes `package.json:main`, and `has_deploy=false`, `has_data=false`

#### Scenario: Agent-skills collection detected
- **WHEN** a repo has `skills/` or `agents/` with `*.md` prompts, no `Dockerfile`, no `k8s/`, no server deps (`express`, `fastapi`, `django`), and no `migrations/`
- **THEN** archetype is `agent-skills` with `has_server=false`, `has_data=false`, `has_deploy=false`

#### Scenario: Mixed monorepo fans out per root
- **WHEN** a monorepo has `frontend/package.json` (client) and `infra/*.tf` (deploy) and `api/pyproject.toml` (server)
- **THEN** the system emits per-root archetypes (`frontend→client-ish library`, `infra→infra`, `api→service`) and a top-level `mixed`, each with its own `planeInventory` and evidence

#### Scenario: Ambiguous repo yields unknown
- **WHEN** a repo has no recognizable manifest and no dominant plane signal
- **THEN** archetype is `unknown`, confidence `low`, and all categories remain applicable (no N/A granted)

### Requirement: Plane inventory

The system SHALL compute a per-scan (and per-root) plane inventory by exhaustive tree enumeration, without execution: `has_server` (server framework dep in lockfile/manifest or `server.*` entrypoint; .NET web signatures `Microsoft.NET.Sdk.Web`, `System.Web`, `.asmx`/`.svc`/`.aspx`; Java servlet/JSP signatures), `has_data` (presence of `migrations/`, `schema.sql`, `prisma/schema.prisma`, Alembic, or DB driver in lockfile; Entity Framework/Hibernate declarations; `.sqlproj`), `has_deploy` (`Dockerfile`|`docker-compose`|`k8s/`|`*.tf`|`serverless.yml`|`Chart.yaml`), `has_client` (framework client `react`/`vue`/`svelte` or `src/components` density; desktop UI files: WinForms/WPF/VB6/Delphi-VCL form files), `has_test` (`__tests__`/`tests/` case-tolerant and `*.test.*`/`*.spec.*`, `*Tests` project files, or `jest`/`pytest`/JUnit/MSTest/NUnit/xUnit markers). Each flag SHALL carry evidence pointers and be exhaustively derived — absence means the scan enumerated the tree and found no match.

#### Scenario: No data plane proven exhaustive
- **WHEN** a repo has no `migrations/`, no `schema.sql`, no `prisma/`, and no DB driver in parsed lockfile
- **THEN** `has_data=false` with evidence `tree scan: 0 matches for {migrations/, schema.sql, prisma/, db-drivers}`

#### Scenario: Has data plane from lockfile driver
- **WHEN** `package-lock.json` contains `pg` or `prisma` in direct or transitive deps
- **THEN** `has_data=true` with evidence `lockfile: pg@8.11`

#### Scenario: .NET web and data signatures set planes with evidence
- **WHEN** a .NET project references `System.Web` and Entity Framework
- **THEN** `has_server=true` and `has_data=true` with those declarations as evidence pointers

#### Scenario: Desktop client sets the client plane
- **WHEN** a repository contains WinForms/WPF or VB6/Delphi-VCL form files
- **THEN** `has_client=true` with those files as evidence (FE rows remain unimplemented; no score is fabricated from the flag)

#### Scenario: Case-variant test directory is recognized
- **WHEN** a repository contains a capitalized `Tests/` directory with MSTest/NUnit/xUnit markers
- **THEN** `has_test=true` with those files as evidence rather than a false exhaustively-absent test plane

### Requirement: Applicability predicates (A layer)

The system SHALL evaluate per-indicator `na_when` using `archetype + planeInventory + exhaustive enumeration` and mark the indicator `not_applicable` (status `not_applicable`, distinct from `unknown`) when the predicate fires. The predicate SHALL be recorded in the row's `reason` with evidence. `required` indicators (SEC-02 secrets, SEC-01 vulns, ECOS-05 license, ECOS-01 runtime EOL when runtime present) SHALL never be `not_applicable` regardless of archetype. Zero-file cases SHALL be `not_applicable` only when the corresponding plane is absent; when the plane is present, zero files SHALL be scored `0`.

#### Scenario: DATA rows N/A for agent-skills
- **WHEN** archetype `agent-skills` and `has_data=false` (exhaustive) and `has_deploy=false`
- **THEN** `DATA-01..DATA-10` rows are `not_applicable` with reason `no data plane detected (no migrations/ nor DB driver, archetype agent-skills)` and carry evidence pointers

#### Scenario: PERF rows N/A for pure library
- **WHEN** archetype `library` and `has_deploy=false` and `has_server=false`
- **THEN** `PERF-02`, `PERF-05` and other deploy-dependent PERF rows are `not_applicable`; `PERF-06` (IaC) is `not_applicable` only if no `*.tf`/`pulumi`/`cloudformation` present

#### Scenario: Zero tests when test plane exists is 0 not N/A
- **WHEN** `has_test=false` is false (i.e. test plane exists — test config files found) but `TEST-05` finds zero skipped tests (or zero coverage files for TEST-01 proxy)
- **THEN** the row is scored `0` or estimated, not `not_applicable`

#### Scenario: Required indicator never N/A
- **WHEN** archetype `docs` and repo contains `package-lock.json` with deps
- **THEN** `SEC-02` (secrets) and `SEC-01` (vulns) remain applicable even though `has_deploy=false`

### Requirement: Required / Relevant / Irrelevant tiers (C layer)

The system SHALL assign each indicator an applicability tier per archetype: `required` (always applicable; missing = 0), `relevant` (applicable iff its plane is present; else `not_applicable`), `irrelevant` (never applicable for that archetype). The tier table SHALL be compiled from `docs/rubric` `Scope/overlaps` + `docs/specs` `na_when` and emitted in `rubric.json` alongside thresholds. Default for any unlisted indicator/archetype pair SHALL be `relevant`.

#### Scenario: Tier drives N/A for docs repo
- **WHEN** archetype `docs` and indicator `API-01` (contract drift) has tier `irrelevant` for `docs`
- **THEN** `API-01` is `not_applicable` without needing a separate plane check, reason `irrelevant for docs archetype`

#### Scenario: Relevant tier respects plane
- **WHEN** archetype `service` and `DATA-01` tier is `relevant` and `has_data=false`
- **THEN** `DATA-01` is `not_applicable`; when `has_data=true` it is applicable and scored

### Requirement: Weight renormalization over implemented-and-applicable categories

The system SHALL renormalize category weights to sum to 100% over the *implemented-and-applicable* categories only (those with at least one row that is `measured` or `estimated`; `not_applicable` and `not_implemented` rows do not count as applicable). Renormalization SHALL be proportional to the canonical weights in `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md:10-42` (same as FE-active `×0.9` pattern, generalized). Both the canonical weighted headline and the renormalized headline SHALL be persisted; the renormalized headline is the primary display, the canonical headline is footnoted. A category with zero implemented-and-applicable rows SHALL be omitted or shown dimmed as `N/A` / `Not implemented` with no percentage.

#### Scenario: Library excludes DATA+PERF
- **WHEN** archetype `library` yields DATA and PERF categories with zero applicable rows
- **THEN** remaining 8 categories renormalize proportionally (e.g. SEC 20% → 25%, ARCH 15% → 18.75%, etc. over the 80% applicable base), headline recomputed, and `coverage.not_applicable` increments by the count of N/A rows

#### Scenario: All categories applicable
- **WHEN** archetype `service` with `has_server=true`, `has_data=true`, `has_deploy=true`, `has_client=true`
- **THEN** no renormalization occurs; headline equals the canonical `Σ category% × weight`

#### Scenario: Both headlines persisted
- **WHEN** a report is sealed for a `library` archetype
- **THEN** `report.headline.score` is the renormalized score, `report.headline.canonical_score` is the score over all 10 categories, and `report.coverage` distinguishes `not_applicable` from `unknown`

### Requirement: Indicator lifecycle — 5 states

The system SHALL model every indicator row in one of 5 mutually exclusive states:

1. **Not Implemented** — rubric lists the indicator but no detector is enqueued/implemented yet (stub Tier C/D, future slice). The row SHALL be `not_implemented`, excluded from numerator/denominator, and carry `unknown_measure_path` ("what it takes to measure") plus `reason: "detector not implemented in this slice"`.
2. **Implemented but not applicable** — detector exists but `na_when` fires for this repo (archetype+plane, exhaustive proof, or `irrelevant` tier). The row SHALL be `not_applicable`, excluded, with `reason`+`evidencePointers` proving plane absence or tier rule.
3. **Applicable but unknown** — detector exists and is applicable, but cannot be measured or estimated from the target tree, git history, and the vendored offline snapshots (it needs live env/org data, e.g., `SEC-03` DAST, `DATA-05` lock contention, or an analyzer the release does not ship). The row SHALL be `unknown` with `unknown_measure_path`.
4. **Estimated** — pattern/heuristic inference only, where the indicator's own spec defines a clamped heuristic (explicitly labeled, clamped).
5. **Measured** — fact-backed: the payload was produced by a named producer that ran over this target during this scan, and the row carries that producer as its evidence. Enumerating the target (existence, counts, paths) counts as measuring; a graded magnitude the detector did not derive from the target does not — such a row is `estimated` or `unknown`, never `measured`. Grading a row from a hardcoded magnitude SHALL NOT occur.

If multiple conditions apply, precedence is: `not_implemented` > `not_applicable` > `unknown` > `estimated` > `measured`. `not_implemented` and `not_applicable` SHALL never be `proven`; gates sourced solely from them SHALL be that same status.

#### Scenario: Not Implemented vs Applicable-but-unknown are distinct
- **WHEN** `SEC-03` (Missing web security controls, Tier C) is scanned in tranche A (31 implemented of 102)
- **THEN** the row is `not_implemented` with `reason: "detector not implemented in this slice"` and `unknown_measure_path: "Deploy or point at staging; run ZAP/DAST"`, not `unknown`

#### Scenario: Implemented but not applicable vs Applicable-but-unknown
- **WHEN** `DATA-01` on an `agent-skills` repo with `has_data=false` and `DATA-01` is implemented
- **THEN** the row is `not_applicable` with `reason: "no data plane"`; when the same `DATA-01` is applicable on a `service` but needs a live DB probe, the row is `unknown`

#### Scenario: Measured requires a producing tool
- **WHEN** an applicable row's fact payload is a constant, a bracketed placeholder, or names an evidence producer that did not run for this scan
- **THEN** the row is `unknown` with `unknown_measure_path` — or `estimated` only where the indicator's spec defines a heuristic clamp — and is never `measured`

### Requirement: Coverage and report contract

The system SHALL extend the Report contract (`docs/plans/06_DATA_MODEL_API.md:35`) with `coverage.not_implemented: number`, `coverage.not_applicable: number`, `snapshot.archetype`, `snapshot.planeInventory`, and per-row `status: measured|estimated|unknown|not_applicable|not_implemented` plus `reason` for the last two. `unknown` remains "cannot measure from URL even though applicable and implemented"; `not_applicable` means "correctly excluded for this repo type/planes"; `not_implemented` means "rubric lists it, engine hasn't built it yet." Gates whose sole source rows are `not_applicable` or `not_implemented` SHALL be that same status (not `proven`/`needs-verification`). The `measured-only` M&A view (`06:136`) SHALL continue to map `estimated→unknown`; `not_applicable` and `not_implemented` rows SHALL stay that status in that view.

#### Scenario: Coverage strip shows five buckets
- **WHEN** a library scan in tranche A yields `measured 17, estimated 4, unknown 12, not_applicable 18, not_implemented 51` over 102
- **THEN** the report renders `Coverage: 17 measured · 4 estimated · 12 unknown · 18 not applicable · 51 not implemented` and the expandable row table groups `not_applicable` and `not_implemented` separately with per-row reason (`no data plane …` vs `detector not implemented`)

#### Scenario: Gate not applicable / not implemented when source rows N/A
- **WHEN** archetype `docs` makes `DATA-06` (G7 source) `not_applicable`, or tranche A has no `DATA-06` detector (`not_implemented`)
- **THEN** gate `G7` is that same status with reason `no data plane — gate not evaluable for this repo type` or `detector not implemented in this slice`, not `needs-verification`

#### Scenario: Archetype surfaced in header and provenance
- **WHEN** a report is sealed
- **THEN** header shows `Detected: library (confidence medium)` with a `[change]` affordance, and `provenance` records `archetype`, `archetype_confidence`, `planeInventory`, and `rubric_version`

### Requirement: Scheduler respects implementation and applicability

The scheduler SHALL enqueue only detectors that are both *implemented* in this slice and *applicable* to the repo. `not_implemented` indicators SHALL never be enqueued; their rows are emitted directly as `not_implemented`. `not_applicable` ( `na_when` fired) SHALL also be skipped. Skipped detectors SHALL emit no fact, no truncated error, and SHALL not consume wall-clock budget or `sampleN`. The trace SHALL include summary events `skipped_not_implemented: [IDs]` and `skipped_not_applicable: [IDs]` per phase.

#### Scenario: Agent-skills skips deploy-dependent detectors
- **WHEN** archetype `agent-skills` makes `PERF-02`, `DATA-01`, `API-03` not applicable (and tranche A has not yet implemented `DATA-05`)
- **THEN** those detector IDs are not enqueued, budget is cheaper, and trace shows `skipped_not_applicable: ["PERF-02", "DATA-01", "API-03"]` and `skipped_not_implemented: ["DATA-05"]`

### Requirement: Override and auditability

The system SHALL allow an explicit `archetype_override` query param or report affordance (`?archetype=service`) to re-score the same `Facts[]` under a different archetype without re-scanning (pure scorer re-run at `engine/scorer`). The override SHALL be recorded in `report.snapshot.archetype_source: auto|override` and `report.provenance`. Every `not_applicable` row SHALL carry `evidencePointers` proving the plane absence (exhaustive tree scan) or tier rule, never a bare assertion. Every `not_implemented` row SHALL carry `reason: "detector not implemented in this slice"` and `unknown_measure_path`, never a bare blank.

#### Scenario: Override re-renders without re-scan
- **WHEN** a user views a `library` report and selects `archetype: service`
- **THEN** the system re-scores the same `Facts[]` with service-applicable set, updates headline/coverage/gates, persists the overridden view as a derived report, and shows `Archetype: service (overridden from library — medium)` with original evidence still visible


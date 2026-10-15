## Purpose

Clone-based Phase 2 that scores the remaining 13 MVP indicators (ECOS 5 + SEC 3 + ARCH 3 + TEST 2) via local tools in a 4-min worker/queue budget, completing the 19-row MVP with proven gates.

## Requirements

### Requirement: Worker/queue clone pipeline
The system SHALL, when the requested indicator set includes any clone-dependent detector, clone the repo shallow (`--filter=blob:none`) within the unified budget via a worker/queue job executed inside the scanner service, run manifest sniff per `{root, ecosystem}[]`, and expose the clone via read-only `readFile` to detectors. The clone SHALL NOT execute in the website process, and the website SHALL have no clone capability. No repo code SHALL be executed. When no clone-dependent indicator is requested, the clone step SHALL be skipped and budget SHALL omit `cloneBaseMs`. The clone step SHALL NOT be surfaced as a separate "Phase 2" in UI or API.

#### Scenario: Shallow clone succeeds
- **WHEN** a unified scan for `https://github.com/vercel/next.js` with 19 requested indicators enqueues work under the ~240s unified budget
- **THEN** worker clones with `--filter=blob:none`, sniff finds `package-lock.json` at `/`, selects JS adapters, and detectors read via `readFile`, all within the same unified budget that also covers GH-API detectors

#### Scenario: No manifest falls back to agnostic plane
- **WHEN** no `package-lock.json`/`pyproject.toml`/`go.mod` found
- **THEN** ECOS/ARCH language-gated rows emit `unknown` with `unknown_measure_path`; scan still seals once at unified deadline with GH-API + file-presence rows

#### Scenario: Clone skipped when not needed
- **WHEN** requested IDs are GH-only (e.g. 6 VEL/SEC/TEST indicators)
- **THEN** scan omits clone, budget uses `base 5s` (not `cloneBase 30s`), and report seals without clone progress

#### Scenario: Clone runs in the scanner service
- **WHEN** a clone-dependent indicator set is scanned and the website process is inspected
- **THEN** the clone is created and read only inside the scanner service, and no clone work, temp directory, or filesystem read occurs in the website
### Requirement: Indicator-count-driven budget with uniform sharding
The system SHALL compute the wall-clock budget from the **requested indicator list** as a single unified value: `budgetMs = baseMs + Σ per-indicator cost` where `fast=5s`, `api-budgeted=10s`, `slow-dissolvable=40s`, `baseMs = 30s` if any `slow-dissolvable` requested else `5s`, clamped to `[10s, 240s]` for MVP (scales to larger for v1). The special-case mapping `6→10s / 13→240s` SHALL be removed; the generic formula SHALL govern. It SHALL enforce per-detector `timeoutMs`/`byteCap`, compute `budgetLease.sampleN` via uniform file-tree sharding on dissolve, and set `truncated=true` → `estimated+scope-limited` or `unknown` for `api-budgeted` exhaustion. Progress bar pct SHALL be derived from `elapsed/budgetMs` and completed cost, not from per-phase milestones. For the canonical 19 MVP indicators the result remains ~240s.

#### Scenario: Budget scales with list
- **WHEN** requested IDs = 19 MVP (mix of fast/api/slow with clone base)
- **THEN** `budgetMs` ≈ `30 + Σ costs ≈ 240s`; when requested IDs = 3 fast only → `~20s` (`5 + 3*5`)

#### Scenario: Dissolve triggers sampled run
- **WHEN** `jscpd` exceeds its per-detector slice and `sampleN` is set via sharding
- **THEN** detector honors `sampleN` + `abort`, returns `truncated=true`, scorer marks `estimated` + `scope-limited`, and final unified report includes that status

#### Scenario: Budget exceeded seals degraded report
- **WHEN** unified budget expires with `ARCH-01` still running
- **THEN** orchestrator seals once with completed rows `measured` and timed-out rows `unknown "budget-exceeded"`, status `degraded`, and `provenance` records `budgetMs` + `indicatorCount`; no intermediate report was emitted

#### Scenario: Progress reflects unified budget
- **WHEN** scan runs with 19 indicators and budget ~240s
- **THEN** progress bar advances monotonically with `elapsed/budgetMs` and remaining = `budgetMs - elapsed`, reaching 100% at budget expiry regardless of how many clone vs GH detectors remain
### Requirement: ECOS-01 runtime EOL fact (clone)

The system SHALL emit ECOS-01 from version-manager files, manifests, `Dockerfile` `FROM`, and CI matrices, mapping to `endoflife.date` and computing `days_until_eol`.

#### Scenario: Supported runtime
- **WHEN** `.nvmrc` pins `20.11` with EOL 2026-04
- **THEN** fact `days_until_eol` > 0 and status `measured` per `ecos-01_runtime-language-eol.md:49`

#### Scenario: Past-EOL runtime with no path proves G3
- **WHEN** `Dockerfile FROM python:3.6` with EOL 2021-12 and no upgrade PR/branch found
- **THEN** `days_until_eol` negative and G3 `proven`; healthy window with upgrade path yields `not-proven`, truncated or ambiguous state yields `needs-verification` and G3 stays informational until proven

### Requirement: ECOS-02 major drift fact
The system SHALL emit ECOS-02 by comparing direct deps in manifests against registry latest, computing majors behind and `pct_behind` per `ecos-02_major-package-drift.md`.

#### Scenario: Drift detected
- **WHEN** `django` latest 5.x but pinned `3.2` (2 majors behind) and 12% of direct deps ≥1 major behind
- **THEN** fact `pct_behind_1plus_major` and `core_framework_gaps` drive score 1 per ECOS-02 predicate

### Requirement: ECOS-03 abandoned libraries fact
The system SHALL emit ECOS-03 from lockfile closure (capped 300) via registry last-release + GH archived flag, marking `abandoned` when `months_since_release > R` or archived.

#### Scenario: Abandoned load-bearing dep
- **WHEN** `siphashc` last release 30 months ago, in core path
- **THEN** fact `abandoned=[{name:"siphashc", months_since_release:30, in_core_path:true}]` and score maps to 0

### Requirement: ECOS-05 license risk fact (G8)

The system SHALL emit ECOS-05 via `syft` SBOM + license classifier, marking `copyleft_strong` and `closed_source_distribution_likely`, driving G8.

#### Scenario: Copyleft in closed distribution
- **WHEN** `syft` finds `GPL-3.0` in transitive closure and packaging indicates closed distribution
- **THEN** fact `copyleft_strong=[{license:"GPL-3.0"}]` and G8 `proven`

#### Scenario: Clean SBOM clears G8
- **WHEN** SBOM attested `copyleft_strong=[]`, `unknown_licenses=0` with `closed-source` packaging absent
- **THEN** G8 is `not-proven`; otherwise if SBOM failed or truncated G8 is `needs-verification`; proven G8 caps verdict to at least `High Risk / Obsolete` per `11_WEIGHTS_THRESHOLDS_CONFIG.md` gate override

### Requirement: ECOS-07 lockfile reproducibility fact
The system SHALL emit ECOS-07 via `git ls-files` lockfile presence, pin ratio, staleness vs manifest mtime, and CI immutable install (`npm ci` vs `npm install`).

#### Scenario: Reproducible lockfile
- **WHEN** `package-lock.json` present, `pin_ratio` 96%, `ci_immutable_install.enforced=true`
- **THEN** fact drives score 3 per ECOS-07 predicate

### Requirement: SEC-01 unpatched vulns fact (G2)

The system SHALL emit SEC-01 via `trivy` + `osv-scanner` over lockfiles, deduped by CVE, with `age_days` and `in_core_import_closure`, driving G2.

#### Scenario: Critical CVE >14d on core path
- **WHEN** `CVE-2025-1234` on `urllib3` age 41d, `in_core_import_closure=true`
- **THEN** fact `critical_open_over_14d=1` and G2 `proven` when reachable, else `needs-verification`

#### Scenario: Critical CVE isolated or recent does not prove G2
- **WHEN** open critical age 5d or `in_core_import_closure=false` or scan truncated
- **THEN** G2 remains `not-proven` (severity still reflected in SEC-01 score 2 vs 0 per encyclopedia Y/R) or `needs-verification` if evidence incomplete

### Requirement: SEC-06 transitive chains fact
The system SHALL emit SEC-06 via `osv-scanner` depth≥2 chains plus import-closure reachability, distinguishing from SEC-01 depth≤1.

#### Scenario: Vulnerable transitive reachable
- **WHEN** `minimist@1.2.0` depth 4 via `mkdirp`, `reachable_from_core=true`
- **THEN** fact `vulnerable_transitive` includes that entry and score maps to 0 when reachable

### Requirement: SEC-02 secrets fact (G1)

The system SHALL emit SEC-02 via `gitleaks` tree + `--all` history (budgeted `--max-depth`), marking `verified_live` via trufflehog, driving G1.

#### Scenario: Active secret in tree
- **WHEN** `gitleaks` finds `aws-access-token` in `config/prod.py` current tree
- **THEN** fact `tree_findings=[{rule:"aws-access-token"}]` and G1 `proven`

#### Scenario: No tree/history scan stays needs-verification
- **WHEN** SEC-02 detector has not run (GH-only scan) or scan truncated with no findings
- **THEN** G1 is `needs-verification` with note `needs live secrets scan`; clean measured tree+history yields `not-proven`

### Requirement: ARCH-01 complexity fact
The system SHALL emit ARCH-01 via `lizard` (+ `radon` for Python) over non-vendored source, computing `pct_over_Y` and `god_classes`, joined to core-path.

#### Scenario: God class in core
- **WHEN** `app/orders.py::process` `ccn` 38, `loc` 912, in core path
- **THEN** fact `god_classes` includes it and score maps to 0 when `core_offenders_ratio > R`

### Requirement: ARCH-08 duplication fact
The system SHALL emit ARCH-08 via `jscpd` (min-tokens 50) over non-vendored source, computing `duplication_pct` and `security_critical_dup`, supporting dissolve via `sampleN`.

#### Scenario: Duplication in core
- **WHEN** `jscpd` reports `duplication_pct` 14.2 with cross-service cluster in core
- **THEN** fact drives score 0 per ARCH-08 predicate

### Requirement: ARCH-05 churn hotspots fact
The system SHALL emit ARCH-05 via `git log --name-only` churn + bugfix regex (`fix|bug|hotfix`) per file, computing `churn_top10_share` and `hotspots` joined to core.

#### Scenario: Hotspot in core
- **WHEN** `auth/session.py` rank 1 churn and 2 defect, `in_core_path=true`
- **THEN** fact `hotspots` includes it and score maps to 0

### Requirement: TEST-03 pyramid inversion fact
The system SHALL emit TEST-03 via test-file classifier (path + framework markers), computing `unit/integration/e2e` counts and `e2e_share_est`; `never auto-measured`, `estimated` only.

#### Scenario: Inverted pyramid
- **WHEN** `e2e` 88, `unit` 210, `e2e_share_est` 0.41
- **THEN** fact `e2e_share_est=0.41` and score maps to 1 (estimated clamp [1,2])

### Requirement: TEST-05 skipped tests fact
The system SHALL emit TEST-05 via marker grep (`test.skip`, `xit`, `pytest.mark.skip`, etc.) + `git blame` age, computing `skip_ratio`.

#### Scenario: Aged skips
- **WHEN** `31/344` tests skipped (`9%`) with `age_days` 233 in core
- **THEN** fact `skip_ratio` 0.09 drives score 1 per TEST-05 predicate

### Requirement: Budget and rollup gating

The system SHALL include gate evaluation in the scorer `rollup` step: category% and headline are computed canonically (`Category% = Σ applicable / (applicable×3) ×100`; `System = Σ category%×weight` over the requested applicable set), then gates are applied: if any of G1/G2/G3/G8 is `proven`, verdict is capped to at least `High Risk / Obsolete` (score remains informational unless <27, then `Critical`). G6 (VEL-03+VEL-08) MAY be reported as partial in MVP: VEL-08 `manual_steps` is measured, VEL-03 CFR is `needs-verification` without deploy data — G6 is `needs-verification` with split note. G4/G5/G7 outside MVP SHALL stay `needs-verification`.

#### Scenario: Proven G1 caps a healthy numeric total
- **WHEN** headline computes 78 (Moderate) but SEC-02 proves G1
- **THEN** reported verdict is `High Risk / Obsolete`, headline numeric 78 shown as informational, top blocker lists `SEC-02` as the reason

#### Scenario: Partial G6 stays needs-verification in MVP
- **WHEN** unified scan measures VEL-08 `manual_steps=1` but VEL-03 CFR is `unknown` (no deploy data)
- **THEN** G6 is `needs-verification` with note `VEL-08 manual_steps=1; CFR unknown — needs deploy data`, not `proven` or `not-proven`

### Requirement: Tranche-A scored rows emit human evidence and predicates — all indicators at once

The system SHALL, for every tranche-A measured indicator (DOCS-01/03/04/08/09, PERF-02/06, DATA-01, ECOS-06/08, SEC-09/10) and every Phase-1 GH-API measured indicator (VEL-06/08/09/10, SEC-07, TEST-08) — i.e. all live-scorable indicators in the current MVP/Tranche-A set, with no indicator deferred — produce an `IndicatorRow` with `score` from the indicator's spec §5 predicate (not a hardcoded `2`), `reason` as a human sentence that explicitly includes the encyclopedia flag rationale for the scored band (ID-free, score-band named, rationale-citing), and `evidence` whose `tool` matches the detector provenance and whose `facts` are flat primitives per the spec §8 evidence string template. No tranche-A indicator SHALL remain on the generic `reason: "${id} measured via ${tool}"` stub after this change.

#### Scenario: DOCS-03 no-runbooks scores 0 with narrative and rationale
- **WHEN** `docs03` detector returns `{count: 0, runbook_dir: null, restore_doc_present: false}`
- **THEN** the scorer maps to `score 0` per `docs-03:§5` (zero operational docs on a service with deploy footprint) and `reason` like `No runbooks — searched docs/runbooks, runbooks, docs/operations etc.; zero files found — per DOCS-03 Red flag: incidents recovered by heroics, every lesson repeated` and `evidence.facts` flat `{count: 0, runbook_dir: null, restore_doc_present: false, newest_days: 9999}` with `evidence.pointers: [{detail: "no runbooks"}]`.

#### Scenario: DOCS-08 no-changelog scores from predicate
- **WHEN** `docs08` detector returns `{changelog_present: false, with_notes_pct: 0, releases_sampled: 0}`
- **THEN** the scorer maps per `docs-08:§5` (no changelog ∧ empty release notes → 0) and `reason` narrates `No CHANGELOG.md at any of 6 candidate paths; 0% of sampled releases carry notes — release communication absent` with flat facts.

#### Scenario: DOCS-04 no-onboarding scores 0
- **WHEN** `docs04` detector returns `{docs_present: [], stages_missing: ["setup","run","test"], last_verified_days: 9999}`
- **THEN** the scorer maps to `0` per `docs-04:§5` and `reason` lists missing docs and stages, with flat facts.

#### Scenario: Tranche-A runbooks with partial coverage scores 2
- **WHEN** `docs03` returns `{count: 3, topics_covered: ["deploy","oncall"], restore_doc_present: false}`
- **THEN** the scorer maps to `2` per `docs-03:§5` (partial coverage, core classes present but restore missing) and `reason` reflects partial coverage.

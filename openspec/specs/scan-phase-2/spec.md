## Purpose

Clone-based Phase 2 that scores the remaining 13 MVP indicators (ECOS 5 + SEC 3 + ARCH 3 + TEST 2) via local tools in a 4-min worker/queue budget, completing the 19-row MVP with proven gates.

## Requirements

### Requirement: Worker/queue clone pipeline
The system SHALL clone the repo shallow (`--filter=blob:none`) via a worker/queue job (in-process queue for MVP, swappable to external queue), run manifest sniff per `{root, ecosystem}[]`, and expose the clone via read-only `readFile` to detectors. No repo code SHALL be executed.

#### Scenario: Shallow clone succeeds
- **WHEN** `runPhase2Scan` enqueues `https://github.com/vercel/next.js` with a 4-min lease
- **THEN** worker clones with `--filter=blob:none`, sniff finds `package-lock.json` at `/`, selects JS adapters, and detectors read via `readFile`

#### Scenario: No manifest falls back to agnostic plane
- **WHEN** no `package-lock.json`/`pyproject.toml`/`go.mod` found
- **THEN** ECOS/ARCH language-gated rows emit `unknown` with `unknown_measure_path`; scan still seals with GH-API + file-presence rows

### Requirement: Indicator-count-driven budget with uniform sharding
The system SHALL compute the wall-clock budget from the **requested indicator list**: `budgetMs = cloneBaseMs (30s) + Σ per-indicator cost` where `fast=5s`, `api-budgeted=10s`, `slow-dissolvable=40s`, clamped to `[min 30s, max 4-min for MVP]` (scales to larger for v1). It SHALL enforce per-detector `timeoutMs`/`byteCap`, compute `budgetLease.sampleN` via uniform file-tree sharding on dissolve, and set `truncated=true` → `estimated+scope-limited` or `unknown` for `api-budgeted` exhaustion. For the canonical 13 MVP Phase-2 list this yields `~240s`; for a 6-row Phase-1 list `~10s`.

#### Scenario: Budget scales with list
- **WHEN** requested IDs = 13 MVP Phase-2 (5 fast + 5 api-budgeted + 3 slow)
- **THEN** `budgetMs` ≈ `30 + 5*5 + 5*10 + 3*40 = 225s` → clamped `240s`; when requested IDs = 3 fast only → `~45s`

#### Scenario: Dissolve triggers sampled run
- **WHEN** `jscpd` exceeds its per-detector slice and `sampleN` is set via sharding
- **THEN** detector honors `sampleN` + `abort`, returns `truncated=true`, scorer marks `estimated` + `scope-limited`

#### Scenario: Budget exceeded seals degraded report
- **WHEN** indicator-driven budget expires with `ARCH-01` still running
- **THEN** orchestrator seals with completed rows `measured` and timed-out rows `unknown "budget-exceeded"`, status `degraded`, and `provenance` records `budgetMs` + `indicatorCount`

### Requirement: ECOS-01 runtime EOL fact (clone)
The system SHALL emit ECOS-01 from version-manager files, manifests, `Dockerfile` `FROM`, and CI matrices, mapping to `endoflife.date` and computing `days_until_eol`.

#### Scenario: Supported runtime
- **WHEN** `.nvmrc` pins `20.11` with EOL 2026-04
- **THEN** fact `days_until_eol` > 0 and status `measured` per `ecos-01_runtime-language-eol.md:49`

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

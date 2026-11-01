## Purpose

Clone-based Phase 2 that scores the remaining 13 MVP indicators (ECOS 5 + SEC 3 + ARCH 3 + TEST 2) via local tools in a 4-min worker/queue budget, completing the 19-row MVP with proven gates, extended by 12 Tranche-A file-presence detectors (31-indicator default).

## Requirements

### Requirement: Worker/queue clone pipeline
The system SHALL, when the requested indicator set includes any clone-dependent detector AND the subject is remote (`--repo`), clone the repo shallow (`--filter=blob:none`) within the unified budget via a worker/queue job executed inside the scanner service, run manifest sniff per `{root, ecosystem}[]`, and expose the clone via read-only `readFile` to detectors. For local subjects (`scan <path>`) the clone step SHALL be skipped entirely and detectors SHALL read directly from the given path via the same read-only `readFile` with identical traversal guards and byte caps. The clone SHALL NOT execute in the website process, and the website SHALL have no clone capability. No repo code SHALL be executed. When no clone-dependent indicator is requested, the clone step SHALL be skipped and budget SHALL omit `cloneBaseMs`. The clone step SHALL NOT be surfaced as a separate "Phase 2" in UI or API. `ScanContext.gh` SHALL be optional: local scans run with no GH client and GH-touching detectors are excluded from the local set.

#### Scenario: Shallow clone succeeds
- **WHEN** a unified scan for `https://github.com/vercel/next.js` with 19 requested indicators enqueues work under the ~240s unified budget
- **THEN** worker clones with `--filter=blob:none`, sniff finds `package-lock.json` at `/`, selects JS adapters, and detectors read via `readFile`, all within the same unified budget that also covers GH-API detectors

#### Scenario: Local path skips clone
- **WHEN** a scan runs as `leapscore scan ./app` with clone-dependent indicators requested
- **THEN** no `git clone` runs, detectors read from `./app` directly, and the report seals with the same row shapes as the remote path

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
The system SHALL bound scan work deterministically from the **requested indicator list and the target file tree**: `sampleN` SHALL be derived from the sorted file count via uniform file-tree sharding and threaded through every slow detector's lease before fan-out, so all slow detectors shard identically on any machine. Per-detector byte budgets SHALL be partitioned, never drawn from a shared running counter. The wall-clock budget SHALL NOT degrade rows to `unknown` and SHALL NOT trigger a degraded seal: it is a pathological-repo killer only, and when it fires the run SHALL fail loudly (crash semantics) with no partial headline. Deterministic bound hits (`sampleN` truncation, per-detector byte cap) SHALL yield `truncated=true` → `unknown` with "what it takes", and progress pct SHALL derive from completed deterministic work plus completed cost, not from `elapsed/budgetMs` against a deadline.

#### Scenario: Budget scales with list
- **WHEN** requested IDs = 19 MVP (mix of fast/api/slow with clone base)
- **THEN** deterministic bounds are computed from the indicator set and file count; the killer timeout is a fixed generous constant independent of the list

#### Scenario: Dissolve triggers sampled run
- **WHEN** `jscpd` exceeds its deterministic shard and `sampleN` was set from the file count
- **THEN** detector honors `sampleN`, returns `truncated=true`, scorer marks `unknown` with "what it takes", and the headline treats it per the frozen-denominator policy

#### Scenario: Budget exceeded seals degraded report
- **WHEN** the wall-clock killer fires with `ARCH-01` still running
- **THEN** the orchestrator does not seal a degraded report; the run fails loudly with exit `1` and a `budget-exceeded` run-failure reason, and no headline is written (this scenario replaces the former degraded-seal behavior)

#### Scenario: Progress reflects unified budget
- **WHEN** scan runs with 19 indicators over a large tree
- **THEN** progress advances monotonically with completed detectors and completed shard cost, reaching 100% when deterministic work completes

#### Scenario: Killer timeout fails the run
- **WHEN** the wall-clock killer fires with `ARCH-01` still running
- **THEN** the orchestrator does not seal; the CLI exits `1` with a `budget-exceeded` run-failure reason and writes no headline

#### Scenario: Progress reflects deterministic work
- **WHEN** scan runs with 19 indicators over a large tree
- **THEN** progress advances monotonically with completed detectors and completed shard cost, reaching 100% when deterministic work completes

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
- **THEN** G8 is `not-proven`; otherwise if SBOM failed or truncated G8 is `needs-verification`; proven G8 caps verdict to at least `High Risk / Obsolete` per the `docs/rubric/model/config.md` gate override

### Requirement: ECOS-07 lockfile reproducibility fact
The system SHALL emit ECOS-07 via `git ls-files` lockfile presence, pin ratio, staleness vs manifest mtime, and CI immutable install (`npm ci` vs `npm install`).

#### Scenario: Reproducible lockfile
- **WHEN** `package-lock.json` present, `pin_ratio` 96%, `ci_immutable_install.enforced=true`
- **THEN** fact drives score 3 per ECOS-07 predicate

### Requirement: SEC-01 unpatched vulns fact (G2)

The system SHALL emit SEC-01 by resolving locked dependency versions against a reference advisory source — the vendored offline snapshot by default, `trivy` + `osv-scanner` when online — deduped by CVE, with `age_days` and `in_core_import_closure`, driving G2. A dependency with no entry in the reference source SHALL be reported as unscanned for that dependency, never as clean.

#### Scenario: Critical CVE >14d on core path
- **WHEN** `CVE-2025-1234` on `urllib3` age 41d, `in_core_import_closure=true`
- **THEN** fact `critical_open_over_14d=1` and G2 `proven` when reachable, else `needs-verification`

#### Scenario: Critical CVE isolated or recent does not prove G2
- **WHEN** open critical age 5d or `in_core_import_closure=false` or scan truncated
- **THEN** G2 remains `not-proven` (severity still reflected in SEC-01 score 2 vs 0 per encyclopedia Y/R) or `needs-verification` if evidence incomplete

#### Scenario: Offline snapshot resolves without network
- **WHEN** a locked dependency has an advisory in the vendored snapshot and the scan runs offline
- **THEN** SEC-01 measures it, names the advisory identifier, and opens no socket

#### Scenario: Dependency without an advisory entry is unscanned, not clean
- **WHEN** a locked dependency has no entry in the reference advisory source
- **THEN** it is reported as unscanned and does not contribute a clean result to SEC-01 or G2

### Requirement: SEC-06 transitive chains fact

The system SHALL emit SEC-06 from depth≥2 chains resolved out of the lockfile against the reference advisory source, plus import-closure reachability, distinguishing it from SEC-01's depth≤1. Where the release does not ship a transitive resolver, the row SHALL be `unknown` with a what-it-takes note, never a placeholder.

#### Scenario: Vulnerable transitive reachable
- **WHEN** `minimist@1.2.0` depth 4 via `mkdirp`, `reachable_from_core=true`
- **THEN** fact `vulnerable_transitive` includes that entry and score maps to 0 when reachable

#### Scenario: No resolver shipped yields unknown
- **WHEN** the running release ships no transitive-chain resolver
- **THEN** SEC-06 is `unknown` with `unknown_measure_path` naming the resolver, never a constant score

### Requirement: SEC-02 secrets fact (G1)

The system SHALL emit SEC-02 by scanning the target with the built-in, documented secret rule set — the tree always, git history where available — driving G1, and MAY widen or verify results with `gitleaks`/`trufflehog` when those tools are present. Findings SHALL name the rule that matched. Where history was not scanned, the report SHALL state that history is unscanned rather than presenting the result as clean.

#### Scenario: Active secret in tree
- **WHEN** the built-in rule set matches an `aws-access-token` pattern in `config/prod.py` in the current tree
- **THEN** fact `tree_findings=[{rule:"aws-access-token"}]` and G1 `proven`

#### Scenario: No tree/history scan stays needs-verification
- **WHEN** the SEC-02 detector has not run (GH-only scan) or the scan truncated with no findings
- **THEN** G1 is `needs-verification` with note `needs live secrets scan`; a clean measured tree with history scanned yields `not-proven`

#### Scenario: Unscanned history is disclosed, not assumed clean
- **WHEN** only the tree was scanned and history was not
- **THEN** the report states history is unscanned and G1 is not `proven` on the strength of the tree scan alone

### Requirement: ARCH-01 complexity fact
The system SHALL emit ARCH-01 from a complexity analyzer run over non-vendored source, computing `pct_over_Y` and `god_classes`, joined to core-path. Where the release ships no analyzer (a zero-dependency offline build), the row SHALL be `unknown` with a what-it-takes note naming the analyzer — never a placeholder score.

#### Scenario: God class in core
- **WHEN** an analyzer reports `app/orders.py::process` `ccn` 38, `loc` 912, in core path
- **THEN** fact `god_classes` includes it and score maps to 0 when `core_offenders_ratio > R`

#### Scenario: No analyzer shipped yields unknown
- **WHEN** the running release ships no complexity analyzer
- **THEN** ARCH-01 is `unknown` with `unknown_measure_path` naming the analyzer, never a constant score

### Requirement: ARCH-08 duplication fact
The system SHALL emit ARCH-08 from a token-based duplication analyzer (min-tokens 50) run over non-vendored source, computing `duplication_pct` and `security_critical_dup`, supporting dissolve via `sampleN`. Where the release ships no analyzer, the row SHALL be `unknown` with a what-it-takes note — never a placeholder.

#### Scenario: Duplication in core
- **WHEN** the duplication analyzer reports `duplication_pct` 14.2 with a cross-service cluster in core
- **THEN** fact drives score 0 per ARCH-08 predicate

#### Scenario: No analyzer shipped yields unknown
- **WHEN** the running release ships no duplication analyzer
- **THEN** ARCH-08 is `unknown` with `unknown_measure_path` naming the analyzer, never a constant score

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

### Requirement: Tranche A file-presence detectors (12 Tier-A measured, fast)
The system SHALL emit 12 additional clone-lane facts using only static-src planes (tree enumeration, greps, YAML/JSON parse, lockfile parse, and a vendored offline end-of-life snapshot) with `fast` budget class (DOCS-08 `api-budgeted` for optional releases API). A fact derived by enumerating or parsing the target — presence, counts, paths, parsed manifest values — SHALL be reported `measured`; any residual magnitude the detector did not derive from the target SHALL NOT be reported as `measured` (it is `estimated` where the indicator's spec defines a clamp, else `unknown`). A detector SHALL report `unknown` when the tree is not enumerable (or `unknown "rate-limited"` for DOCS-08 on GH 403), and never `N/A` for scored repos; evidence pointers SHALL reference enumerated paths, and evidence producers SHALL name the tool that actually ran.

#### Scenario: DOCS-01 ADR inventory measured
- **WHEN** scan reads a repo with an ADR directory holding 14 ADRs (`0001-record.md` and 13 more), newest 40 days old, sampled majors documented
- **THEN** `docs01` fact `{adr_dir:"docs/adr", adr_count:14, newest_adr_days:40}` status `measured` and score maps per `docs-01_*.md §5` (candidate 3)

#### Scenario: DOCS-03 runbooks presence measured
- **WHEN** the target tree contains runbook files `deploy.md` and `incident.md` under its runbook directory
- **THEN** `docs03` fact marks presence/coverage and maps to `measured` score per spec

#### Scenario: DOCS-04 onboarding guide measured
- **WHEN** `CONTRIBUTING.md` exists with setup steps and `GETTING_STARTED.md` absent but README has dev section
- **THEN** `docs04` fact records `contributing_present=true` and maps to `measured` per spec

#### Scenario: DOCS-08 changelog + releases measured, API fallback
- **WHEN** `CHANGELOG.md` present current and `GET /repos/{o}/{r}/releases` shows 12 releases with 42% having notes
- **THEN** `docs08` fact `{changelog_present:true, with_notes_pct:0.42}` status `measured`; when GH releases 403 after retries, detector emits `unknown "rate-limited"` (api-budgeted) and DOCS category still scores on DOCS-01/03/04/09

#### Scenario: DOCS-09 docs-as-code measured
- **WHEN** CI YAML contains `docs build`/`link-check`/`vale` step
- **THEN** `docs09` fact `{docs_ci_present:true}` status `measured`

#### Scenario: PERF-02 deploy model measured
- **WHEN** `Dockerfile` + `k8s/deployment.yaml` present and no VM smells
- **THEN** `perf02` fact `{model:"container-orchestrated"}` status `measured`

#### Scenario: PERF-06 IaC coverage measured
- **WHEN** `terraform/*.tf` present covering infra and no VM drift smells
- **THEN** `perf06` fact `{iac_present:true, coverage:"partial"}` status `measured` per spec (inference → estimated clamp only when drift proof missing, but presence is measured)

#### Scenario: DATA-01 migration backlog measured
- **WHEN** `migrations/` has 8 files, none pending, no destructive `DROP`/`RENAME`
- **THEN** `data01` fact `{migration_count:8, destructive_ops:0}` status `measured` and maps to score 3

#### Scenario: ECOS-06 bloat via lockfile counts measured
- **WHEN** `package-lock.json` parses to `transitive_total=142, pct_direct_unused=null` (no unused-dep tool run) and duplicates empty
- **THEN** `ecos06` fact carries those counts, provenance `tool:"lockfile-parse"`, status `measured` (counts exhaustive); scorer treats missing `pct_direct_unused` as absent signal, not `estimated` downgrade

#### Scenario: ECOS-08 framework lock-in measured via endoflife cache
- **WHEN** `package.json` pins `react 18.2` and the vendored snapshot returns active support
- **THEN** `ecos08` fact `{framework:"react", support_status:"active"}` status `measured`, reusing the ECOS-01 snapshot

#### Scenario: SEC-09 fuzz harness presence measured
- **WHEN** tree contains ` fuzz/` harness or `cargo-fuzz` config
- **THEN** `sec09` fact `{harness_present:true}` status `measured`

#### Scenario: SEC-10 security testing in CI measured
- **WHEN** CI YAML has a vulnerability/secret-scanning job with `continue-on-error:false`
- **THEN** `sec10` fact `{sast_present:true, blocking:true}` status `measured` per spec, sharing parse cache with TEST-08

#### Scenario: Residual magnitude is not measured
- **WHEN** a Tranche A detector would report a magnitude it did not derive from the target (for example a literal "newest 40 days" with no timestamp read)
- **THEN** the fact omits it or the row is `unknown` with `unknown_measure_path`, never `measured` on a placeholder

#### Scenario: Missing repo tree degrades to unknown
- **WHEN** clone step succeeded but tree not enumerable for DOCS detectors (e.g., shallow filter omitted docs)
- **THEN** each affected fact emits `unknown` with `unknown_measure_path` from its per-indicator spec, never a scored guess

### Requirement: Unified budget and progress include Tranche A
The system SHALL compute `budgetMs` via the existing generic formula `baseMs + Σ costs` (`fast=5s`, `api-budgeted=10s`, `cloneBase 30s` when any `slow-dissolvable` in set) for the expanded 31-indicator default set; progress pct SHALL derive from `elapsed/budgetMs` + completed cost as before; clamping `[10s,240s]` SHALL still hold for 31 (computed ~ `30 + 11*5 + 1*10 + existing ≈ 180-200s` <240s). No budget formula change.

#### Scenario: 31-indicator budget still under cap
- **WHEN** `indicatorIds` is the 31 default (19 MVP + 12 Tranche A, only 2 slow-dissolvable ARCH-01/08 + ECOS-05)
- **THEN** `budgetMs` is the formula result (≈190s) and scan seals once at that deadline with same `provenance: {budgetMs, indicatorCount:31}`

#### Scenario: Partial selection scales down
- **WHEN** caller requests only the 12 Tranche A IDs
- **THEN** `budgetMs` = `5s base + 11*5 + 1*10 = ~70s` (no slow, so base 5s) and progress reaches 100% at 70s, not 240s

### Requirement: Coverage and roll-up over 8 categories
The system SHALL include the 12 new facts in category roll-ups (`DOCS` grows 0→5, `PERF` 0→2, `DATA` 0→1, `ECOS` 5→7, `SEC` 4→6) per `docs/rubric/model/config.md` §2 (`Category% = Σ scores ÷ applicable×3 ×100`), and SHALL compute coverage from the rows actually measured, estimated, and unknown — not a fixed expectation. Rows demoted by measurement honesty count as `unknown`, so the historical expectation of 31 measured rows no longer holds; consumers SHALL read coverage from the report rather than assume a count. Tier thresholds (`docs/rubric/model/config.md` §3) and gate caps (`G1/G2/G3/G8 proven` only) SHALL be unchanged.

#### Scenario: Report roll-up with Tranche A
- **WHEN** scan completes with measured DOCS rows
- **THEN** DOCS category % = sum(DOCS-01/03/04/08/09 scores)÷(applicable×3)×100, and headline = Σ(category% × base weight) over the non-empty categories (DOCS 5%, PERF/PERF folded at base weights); `coverage` reports the measured/estimated/unknown split actually produced

#### Scenario: MVP-only request preserves old shape
- **WHEN** `indicatorIds` is 19 MVP
- **THEN** coverage reports the MVP measured count and DOCS/PERF/DATA rows are `unknown` placeholders as before — no regression

#### Scenario: Demotion is reflected in coverage, not hidden
- **WHEN** measurement honesty demotes a row that a previous release graded measured
- **THEN** coverage's measured count drops and unknown rises by the same amount, and no fixed coverage constant is asserted anywhere

### Requirement: Empty-category categories are excluded from roll-up
The system SHALL NOT emit a `CategoryScore` for a category that has zero indicator rows. `scoreMvp` SHALL group rows by `category_id` only from `allRows` and SHALL NOT inject phantom empty categories (`DATA/API/PERF/DOCS` fallback). When `applicable === 0` for a category (no `measured`/`estimated` rows), the category SHALL be omitted from `categories[]` and its weight SHALL NOT be applied as `0% * weight`; `weighted_contribution` is `0` and headline is sum over emitted categories.

#### Scenario: 31-indicator API empty is omitted
- **WHEN** `facts` contain 31 Tranche-A ids (no `API-*`) and `allRows` has no `API` rows
- **THEN** `scoreMvp` returns `categories` without `API` (length 7-8, not 9-10), `coverage {measured:31, unknown:71}`, and headline is not depressed by `API 0% *10%`

#### Scenario: All 10 categories present when tranche B adds API
- **WHEN** `facts` later include `API-01`/`API-02` and `allRows` has `API` rows
- **THEN** `scoreMvp` includes `API` with `applicable>0` and `category_score` computed normally

#### Scenario: Degraded status still based on measured count
- **WHEN** scan has `measured:31` vs `31` requested
- **THEN** `status` is `complete`; empty `API` does not cause `degraded`

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

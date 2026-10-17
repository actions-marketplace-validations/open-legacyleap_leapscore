## MODIFIED Requirements

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

### Requirement: Tranche A file-presence detectors (12 Tier-A measured, fast)
The system SHALL emit 12 additional clone-lane facts using only static-src planes (tree enumeration, greps, YAML/JSON parse, lockfile parse, and a vendored offline end-of-life snapshot) with `fast` budget class (DOCS-08 `api-budgeted` for optional releases API). A fact derived by enumerating or parsing the target — presence, counts, paths, parsed manifest values — SHALL be reported `measured`; any residual magnitude the detector did not derive from the target SHALL NOT be reported as `measured` (it is `estimated` where the indicator's spec defines a clamp, else `unknown`). A detector SHALL report `unknown` when the tree is not enumerable (or `unknown "rate-limited"` for DOCS-08 on GH 403), and never `N/A` for scored repos; evidence pointers SHALL reference enumerated paths, and evidence producers SHALL name the tool that actually ran.

#### Scenario: DOCS-01 ADR inventory measured
- **WHEN** scan reads a repo with `docs/adr/0001-record.md` and 14 ADRs, newest 40 days old, sampled majors documented
- **THEN** `docs01` fact `{adr_dir:"docs/adr", adr_count:14, newest_adr_days:40}` status `measured` and score maps per `docs-01_*.md §5` (candidate 3)

#### Scenario: DOCS-03 runbooks presence measured
- **WHEN** tree contains `docs/runbooks/deploy.md` and `docs/runbooks/incident.md`
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
- **WHEN** tree contains a `fuzz/` harness or `cargo-fuzz` config
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

### Requirement: Coverage and roll-up over 8 categories
The system SHALL include the 12 new facts in category roll-ups (`DOCS` grows 0→5, `PERF` 0→2, `DATA` 0→1, `ECOS` 5→7, `SEC` 4→6) per `11_WEIGHTS_THRESHOLDS_CONFIG.md §2` (`Category% = Σ scores ÷ applicable×3 ×100`), and SHALL compute coverage from the rows actually measured, estimated, and unknown — not a fixed expectation. Rows demoted by measurement honesty count as `unknown`, so the historical expectation of 31 measured rows no longer holds; consumers SHALL read coverage from the report rather than assume a count. Tier thresholds (`11 §3`) and gate caps (`G1/G2/G3/G8 proven` only) SHALL be unchanged.

#### Scenario: Report roll-up with Tranche A
- **WHEN** scan completes with measured DOCS rows
- **THEN** DOCS category % = sum(DOCS-01/03/04/08/09 scores)÷(applicable×3)×100, and headline = Σ(category% × base weight) over the non-empty categories (DOCS 5%, PERF/PERF folded at base weights); `coverage` reports the measured/estimated/unknown split actually produced

#### Scenario: MVP-only request preserves old shape
- **WHEN** `indicatorIds` is 19 MVP
- **THEN** coverage reports the MVP measured count and DOCS/PERF/DATA rows are `unknown` placeholders as before — no regression

#### Scenario: Demotion is reflected in coverage, not hidden
- **WHEN** measurement honesty demotes a row that a previous release graded measured
- **THEN** coverage's measured count drops and unknown rises by the same amount, and no fixed coverage constant is asserted anywhere

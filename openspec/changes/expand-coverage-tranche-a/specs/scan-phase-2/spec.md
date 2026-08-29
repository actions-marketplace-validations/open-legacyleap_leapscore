## ADDED Requirements

### Requirement: Tranche A file-presence detectors (12 Tier-A measured, fast)
The system SHALL emit 12 additional clone-lane facts using only static-src planes (tree enumeration, `rg` greps, YAML/JSON parse, lockfile parse, and a cached `endoflife.date` lookup) with `fast` budget class (DOCS-08 `api-budgeted` for optional releases API). Each detector SHALL report `measured` when the tree is enumerable, `unknown` when not enumerable (or `unknown "rate-limited"` for DOCS-08 on GH 403), and never `N/A` for scored repos; evidence pointers SHALL reference enumerated paths or the GH endpoint used.

#### Scenario: DOCS-01 ADR inventory measured
- **WHEN** scan clones a repo with `docs/adr/0001-record.md` and 14 ADRs, newest 40 days old, sampled majors documented
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
- **WHEN** `package-lock.json` parses to `transitive_total=142, pct_direct_unused=null` (no knip run) and duplicates empty
- **THEN** `ecos06` fact carries those counts, provenance `tool:"lockfile+rg"`, status `measured` (counts exhaustive); scorer treats missing `pct_direct_unused` as absent signal, not `estimated` downgrade

#### Scenario: ECOS-08 framework lock-in measured via endoflife cache
- **WHEN** `package.json` pins `react 18.2` and `endoflife.date` returns active support
- **THEN** `ecos08` fact `{framework:"react", support_status:"active"}` status `measured`, reusing ECOS-01 cache

#### Scenario: SEC-09 fuzz harness presence measured
- **WHEN** tree contains ` fuzz/` harness or `cargo-fuzz` config
- **THEN** `sec09` fact `{harness_present:true}` status `measured`

#### Scenario: SEC-10 security testing in CI measured
- **WHEN** CI YAML has `trivy`/`gitleaks` job with `continue-on-error:false`
- **THEN** `sec10` fact `{sast_present:true, blocking:true}` status `measured` per spec, sharing parse cache with TEST-08

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
The system SHALL include the 12 new facts in category roll-ups (`DOCS` grows 0→5, `PERF` 0→2, `DATA` 0→1, `ECOS` 5→7, `SEC` 4→6) per `11_WEIGHTS_THRESHOLDS_CONFIG.md §2` (`Category% = Σ scores ÷ applicable×3 ×100`), and SHALL report `coverage {measured:31, estimated:0, unknown:71}` for the default 31 scan (and `measured:19` when MVP-only requested). Tier thresholds (`11 §3`) and gate caps (`G1/G2/G3/G8 proven` only) SHALL be unchanged.

#### Scenario: Report roll-up with Tranche A
- **WHEN** scan completes 31 measured rows
- **THEN** DOCS category % = sum(DOCS-01/03/04/08/09 scores)÷15×100, and headline = Σ(category% × base weight) over the 8 non-empty categories (DOCS 5%, PERF/PERF folded at base weights); `coverage` shows `31/102 measured`

#### Scenario: MVP-only request preserves old shape
- **WHEN** `indicatorIds` is 19 MVP
- **THEN** coverage reports `19/102 measured` and DOCS/PERF/DATA rows are `unknown` placeholders as before — no regression


## MODIFIED Requirements

### Requirement: ECOS-05 license risk fact (G8)

The system SHALL emit ECOS-05 via `syft` SBOM + license classifier, marking `copyleft_strong` and `closed_source_distribution_likely`, driving G8.

#### Scenario: Copyleft in closed distribution
- **WHEN** `syft` finds `GPL-3.0` in transitive closure and packaging indicates closed distribution
- **THEN** fact `copyleft_strong=[{license:"GPL-3.0"}]` and G8 `proven`

#### Scenario: Clean SBOM clears G8
- **WHEN** SBOM attested `copyleft_strong=[]`, `unknown_licenses=0` with `closed-source` packaging absent
- **THEN** G8 is `not-proven`; otherwise if SBOM failed or truncated G8 is `needs-verification`; proven G8 caps verdict to at least `High Risk / Obsolete` per `11_WEIGHTS_THRESHOLDS_CONFIG.md` gate override

### Requirement: SEC-01 unpatched vulns fact (G2)

The system SHALL emit SEC-01 via `trivy` + `osv-scanner` over lockfiles, deduped by CVE, with `age_days` and `in_core_import_closure`, driving G2.

#### Scenario: Critical CVE >14d on core path
- **WHEN** `CVE-2025-1234` on `urllib3` age 41d, `in_core_import_closure=true`
- **THEN** fact `critical_open_over_14d=1` and G2 `proven` when reachable, else `needs-verification`

#### Scenario: Critical CVE isolated or recent does not prove G2
- **WHEN** open critical age 5d or `in_core_import_closure=false` or scan truncated
- **THEN** G2 remains `not-proven` (severity still reflected in SEC-01 score 2 vs 0 per encyclopedia Y/R) or `needs-verification` if evidence incomplete

### Requirement: SEC-02 secrets fact (G1)

The system SHALL emit SEC-02 via `gitleaks` tree + `--all` history (budgeted `--max-depth`), marking `verified_live` via trufflehog, driving G1.

#### Scenario: Active secret in tree
- **WHEN** `gitleaks` finds `aws-access-token` in `config/prod.py` current tree
- **THEN** fact `tree_findings=[{rule:"aws-access-token"}]` and G1 `proven`

#### Scenario: No tree/history scan stays needs-verification
- **WHEN** SEC-02 detector has not run (GH-only scan) or scan truncated with no findings
- **THEN** G1 is `needs-verification` with note `needs live secrets scan`; clean measured tree+history yields `not-proven`

### Requirement: ECOS-01 runtime EOL fact (clone)

The system SHALL emit ECOS-01 from version-manager files, manifests, `Dockerfile` `FROM`, and CI matrices, mapping to `endoflife.date` and computing `days_until_eol`.

#### Scenario: Supported runtime
- **WHEN** `.nvmrc` pins `20.11` with EOL 2026-04
- **THEN** fact `days_until_eol` > 0 and status `measured` per `ecos-01_runtime-language-eol.md:49`

#### Scenario: Past-EOL runtime with no path proves G3
- **WHEN** `Dockerfile FROM python:3.6` with EOL 2021-12 and no upgrade PR/branch found
- **THEN** `days_until_eol` negative and G3 `proven`; healthy window with upgrade path yields `not-proven`, truncated or ambiguous state yields `needs-verification` and G3 stays informational until proven

## ADDED Requirements

### Requirement: Budget and rollup gating

The system SHALL include gate evaluation in the scorer `rollup` step: category% and headline are computed canonically (`Category% = Σ applicable / (applicable×3) ×100`; `System = Σ category%×weight` over the requested applicable set), then gates are applied: if any of G1/G2/G3/G8 is `proven`, verdict is capped to at least `High Risk / Obsolete` (score remains informational unless <27, then `Critical`). G6 (VEL-03+VEL-08) MAY be reported as partial in MVP: VEL-08 `manual_steps` is measured, VEL-03 CFR is `needs-verification` without deploy data — G6 is `needs-verification` with split note. G4/G5/G7 outside MVP SHALL stay `needs-verification`.

#### Scenario: Proven G1 caps a healthy numeric total
- **WHEN** headline computes 78 (Moderate) but SEC-02 proves G1
- **THEN** reported verdict is `High Risk / Obsolete`, headline numeric 78 shown as informational, top blocker lists `SEC-02` as the reason

#### Scenario: Partial G6 stays needs-verification in MVP
- **WHEN** unified scan measures VEL-08 `manual_steps=1` but VEL-03 CFR is `unknown` (no deploy data)
- **THEN** G6 is `needs-verification` with note `VEL-08 manual_steps=1; CFR unknown — needs deploy data`, not `proven` or `not-proven`


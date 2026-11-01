# ECOS-05 — License Compliance Risk

> **Category:** [Dependency & Ecosystem Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-05 |
| Name | License Compliance Risk |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | B |
| Default status | measured |
| v1 flag | YES |
| Gates fed | **G8** — copyleft in closed-source distribution |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | 🔶 ~2–4 h — SBOM generation + classification, or 🔷 if the graph is deep. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Dependency licenses are unknown, ambiguous, or incompatible with how the codebase is distributed — with special danger from copyleft licenses (GPL/AGPL) in proprietary closed-source software.
- **Why it signals obsolescence:** Licensing problems are a *quiet* form of debt that surfaces only at acquisition, audit, or legal review — the worst possible time. An obsolete codebase often has an undisciplined dependency history, which is exactly how unknown-license and copyleft packages sneak in.
- **Where it manifests:** `package.json`/lockfiles with no `license` field, libraries with custom/unclear licenses (WTFPL, CC-BY-NC, "BSD without notice"), GPL/AGPL-licensed packages in a closed-source product, vendored code with licenses stripped, missing `NOTICE`/`THIRD_PARTY_LICENSES` files.
- **Objective metric:** `% of packages with unknown/missing license`; count of copyleft (GPL/AGPL) packages; whether an SBOM/attribution file exists and is regenerated in CI.
- **Yellow flag (warning):** Unknown or ambiguous licenses present in transitive dependencies; no SBOM generated. *(Rationale: mostly discoverable and fixable, but the discovery tooling is missing — that's the warning.)*
- **Red flag (critical):** Copyleft licenses (GPL/AGPL) detected in a proprietary, closed-source distribution, or vendored copyleft code without notice. *(Rationale: this can force source release or trigger legal exposure — an exit-blocking defect.)*
- **Example symptom:** "Acquisition due diligence asks for an SBOM. We don't have one. Three weeks of scraping later, we find a GPL-3.0 image-processing library compiled into our closed-source binary since 2019. Legal goes cold."
- **Blast radius:** Legal/commercial deals, ability to distribute, enterprise sales (procurement asks for license reports), compliance audits.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = SBOM + compliant; 2 = no SBOM but licenses look clean; 1 = unknown licenses or a copyleft dep in peripheral code; 0 = copyleft/unknown in distributed closed-source product.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: generate an SBOM (`syft . > sbom.json`), wire it into CI, publish attribution files. Structural fix: add a license gate to CI (fail on GPL in closed-source), replace copyleft deps, retire unknown-license packages, review vendored code for stripped notices.
- **Gold standard / target state:** SBOM generated and attested on every release; license policy enforced in CI; zero unknown licenses; copyleft list reviewed quarterly and signed off.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** direct-dep license resolution from the vendored package-metadata table (registry-derived `license` field; part of the eol snapshot); repo surfacing checks (SBOM file presence, CI license-gate grep, packaging/Dockerfile posture). The SBOM-scanner path (`syft` etc.) is out of scope for the offline release — a transitive-license surface needs a scanner this build does not run.
- **Rate-cost:** none (offline; license table pinned per scan)
- **Ecosystems:** agnostic with lockfile-priority parsing; legacy-stacks adds NuGet (`packages.config`, `PackageReference`, `packages.lock.json`)
- **Applicability:** `na_when: ECOS-02 clause-b fired` (no manifests → nothing to license). Else applicable.

## 6. Detection recipe

- **Detection method:** SBOM generation (`syft`, `bom`, `cyclonedx-cli`) + license scanning (`fossa`, `snyk`, `license-checker`, `pip-licenses`), `github/licensee`, `npx license-checker-rseidelsohn`. Generate an SBOM, classify each license, flag unknown/missing/copyleft.

1. Parse the manifest/lockfile surface; select direct deps (prod scope first).
2. Classify each dep's license from the vendored table: `copyleft_strong`, `copyleft_weak`, `permissive`, `unknown`; a dep the table does not cover is counted `license_unknown_count` and named in `license_unknown_names` — never guessed.
3. Detect distribution posture hints: packaging configs (`package.json#bin`, `pyproject` build-system, Dockerfile `FROM scratch` copies) → `closed_source_distribution_likely` unless the repo's own LICENSE is copyleft.
4. Repo surfacing sweep: SBOM file presence, CI license-gate step, vendored-code license headers.

Preconditions: none beyond tree enumeration.

## 7. Fact schema

```json
{"ecos05": {
  "packages_total": 412, "license_unknown_count": 9,
  "license_unknown_names": ["internal-billing-client"],
  "copyleft_strong": [{"name": "libfoo", "version": "1.2", "license": "GPL-3.0", "direct": true}],
  "copyleft_weak_count": 2,
  "sbom_present_in_repo": false, "ci_license_gate_present": false,
  "closed_source_distribution_likely": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  an SBOM-class scan completes over the enumerated tree and packages_total > 0   # not reachable in the offline release (direct-dep table only)
estimated_when: direct-dep license table with >=1 license classified                            # clamp [1,2], confidence low; the release's default
unknown_when:   zero packages discovered in a tree that has source files, or none of the direct deps covered by the table
na_when:        applicability fired
clamp:          [1,2]
confidence:     low (direct-dep surface only; transitive licenses need the unshipped SBOM path)
scope_limited:  license_unknown_count > 0 -> estimated + scope-limited
```

### Score mapping predicates

Thresholds/criteria: see §3.

- `3`: `license_unknown_count == 0` ∧ `copyleft_strong.len == 0` ∧ `sbom_present_in_repo`
- `2`: clean licenses ∧ `sbom_present_in_repo == false`
- `1`: `license_unknown_count > 0` ∨ copyleft only in dev/peripheral scope
- `0`: `any(copyleft_strong ∧ closed_source_distribution_likely)` → also drives G8

## 9. Gate, failure, and budget behavior

### Gate hooks

- `proven`: `any(copyleft_strong ∧ closed_source_distribution_likely ∧ direct-or-linked-scope)`
- `not-proven`: no strong copyleft anywhere
- `needs-verification`: copyleft found ∧ distribution posture ambiguous

### Failure and budget semantics

- Budget class: `slow-dissolvable` — in the offline release the dissolved path IS the shipped path: direct-dep license table only, confidence low
- Classifier DB load failure → abort row to `unknown`; never guess licenses

## 10. Evidence and output

### Evidence string

```
evidence: "lockfile-parse: {n} direct deps; {u} unknown licenses; strong copyleft in {names} ({paths})"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

License classification and SBOM content; provenance/attestation is ECOS-10.

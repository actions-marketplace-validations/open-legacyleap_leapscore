# ECOS-05 — License Compliance Risk — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (tier arbitrated; encyc said B) |
| v1 flag | YES |
| Gates fed | **G8** — copyleft in closed-source distribution |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | 🔶 ~2–4 h (engine automates the ⚡-class core) |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-05 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** `syft >= 0.100` (dir mode, no container build) → SBOM/CycloneDX; `licensee`-class classifier or `scancode` license DB; `pip-licenses` fallback for Python-only trees
- **Rate-cost:** none (local; license DB shipped with engine, pinned version)
- **Ecosystems:** agnostic (syft catalogers) with lockfile-priority parsing
- **Applicability:** `na_when: ECOS-02 clause-b fired` (no manifests → nothing to license). Else applicable.

## 2. Detection recipe

1. `syft scan dir:{clone} --scope all-layers -o cyclonedx-json` (file-mode; never builds/never runs repo code).
2. Normalize package licenses via classifier; mark `unknown` when absent/custom.
3. Classify: `copyleft_strong` (GPL-2/3, AGPL), `copyleft_weak` (LGPL, MPL), `permissive`, `unknown`.
4. Detect distribution posture hints: packaging configs (pyproject wheel/build, pkg binary targets, Dockerfile FROM scratch copies) → `closed_source_distribution_likely` unless LICENSE states AGPL-compatible OSS release.
5. Vendored-code sweep: dirs lacking upstream license headers adjacent to manifest-absence.

Preconditions: none beyond tree enumeration.

## 3. Fact schema

```json
{"ecos05": {
  "packages_total": 412, "license_unknown_count": 9,
  "copyleft_strong": [{"name": "libfoo", "version": "1.2", "license": "GPL-3.0", "direct": false}],
  "copyleft_weak_count": 2,
  "sbom_present_in_repo": false, "ci_license_gate_present": false,
  "closed_source_distribution_likely": true}}
```

## 4. Statusing rules

```yaml
measured_when:  syft completed and packages_total > 0
estimated_when: syft partial failure but >=1 lockfile parsed manually   # clamp [1,2], confidence low
unknown_when:   zero packages discovered in a tree that has source files
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive SBOM surface)
scope_limited:  vendored-dir exclusion -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §ECOS-05.

- `3`: `license_unknown_count == 0` ∧ `copyleft_strong.len == 0` ∧ `sbom_present_in_repo`
- `2`: clean licenses ∧ `sbom_present_in_repo == false`
- `1`: `license_unknown_count > 0` ∨ copyleft only in dev/peripheral scope
- `0`: `any(copyleft_strong ∧ closed_source_distribution_likely)` → also drives G8

## 6. Gate hooks (G8)

- `proven`: `any(copyleft_strong ∧ closed_source_distribution_likely ∧ direct-or-linked-scope)`
- `not-proven`: no strong copyleft anywhere
- `needs-verification`: copyleft found ∧ distribution posture ambiguous

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (dissolve → lockfile-direct-deps license lookup only + confidence low)
- Classifier DB load failure → abort row to `unknown`; never guess licenses

## 8. Evidence string

```
evidence: "syft {ver}: {n} packages; {u} unknown licenses; GPL-3.0 in {names} ({paths})"
```

## 9. Scope/overlaps echo

License classification and SBOM content; provenance/attestation is ECOS-10.

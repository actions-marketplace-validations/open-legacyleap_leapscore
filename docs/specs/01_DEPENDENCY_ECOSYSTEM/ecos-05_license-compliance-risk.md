# ECOS-05 — License Compliance Risk — Implementation Spec

> **Authority:** This file defines the ECOS-05 implementation contract. The [ECOS rubric category](../../rubric/01_DEPENDENCY_ECOSYSTEM.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

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
- **Tools:** direct-dep license resolution from the vendored package-metadata table (registry-derived `license` field; part of the eol snapshot); repo surfacing checks (SBOM file presence, CI license-gate grep, packaging/Dockerfile posture). The SBOM-scanner path (`syft` etc.) is out of scope for the offline release — a transitive-license surface needs a scanner this build does not run.
- **Rate-cost:** none (offline; license table pinned per scan)
- **Ecosystems:** agnostic with lockfile-priority parsing; legacy-stacks adds NuGet (`packages.config`, `PackageReference`, `packages.lock.json`)
- **Applicability:** `na_when: ECOS-02 clause-b fired` (no manifests → nothing to license). Else applicable.

## 2. Detection recipe

1. Parse the manifest/lockfile surface; select direct deps (prod scope first).
2. Classify each dep's license from the vendored table: `copyleft_strong`, `copyleft_weak`, `permissive`, `unknown`; a dep the table does not cover is counted `license_unknown_count` and named in `license_unknown_names` — never guessed.
3. Detect distribution posture hints: packaging configs (`package.json#bin`, `pyproject` build-system, Dockerfile `FROM scratch` copies) → `closed_source_distribution_likely` unless the repo's own LICENSE is copyleft.
4. Repo surfacing sweep: SBOM file presence, CI license-gate step, vendored-code license headers.

Preconditions: none beyond tree enumeration.

## 3. Fact schema

```json
{"ecos05": {
  "packages_total": 412, "license_unknown_count": 9,
  "license_unknown_names": ["internal-billing-client"],
  "copyleft_strong": [{"name": "libfoo", "version": "1.2", "license": "GPL-3.0", "direct": true}],
  "copyleft_weak_count": 2,
  "sbom_present_in_repo": false, "ci_license_gate_present": false,
  "closed_source_distribution_likely": true}}
```

## 4. Statusing rules

```yaml
measured_when:  an SBOM-class scan completes over the enumerated tree and packages_total > 0   # not reachable in the offline release (direct-dep table only)
estimated_when: direct-dep license table with >=1 license classified                            # clamp [1,2], confidence low; the release's default
unknown_when:   zero packages discovered in a tree that has source files, or none of the direct deps covered by the table
na_when:        applicability fired
clamp:          [1,2]
confidence:     low (direct-dep surface only; transitive licenses need the unshipped SBOM path)
scope_limited:  license_unknown_count > 0 -> estimated + scope-limited
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

- Budget class: `slow-dissolvable` — in the offline release the dissolved path IS the shipped path: direct-dep license table only, confidence low
- Classifier DB load failure → abort row to `unknown`; never guess licenses

## 8. Evidence string

```
evidence: "lockfile-parse: {n} direct deps; {u} unknown licenses; strong copyleft in {names} ({paths})"
```

## 9. Scope/overlaps echo

License classification and SBOM content; provenance/attestation is ECOS-10.

# TEST-08 — Quality Gates in CI — Implementation Spec

> **Authority:** This file defines the TEST-08 implementation contract. The [TEST rubric category](../../rubric/03_TESTING_QUALITY.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ human · engine: CI config audit |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-08 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** CI YAML parsers: `.github/workflows/*`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`, `.circleci/config.yml`, `bitbucket-pipelines.yml`
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A. Zero CI configs (clause-b over enumerated tree) → score-0 measured, not N/A.

## 2. Detection recipe

1. Enumerate + parse CI configs; list jobs and steps.
2. Gate inventory per stage class: lint, static-analysis/SAST, coverage threshold (`--coverage --coverage-threshold`, `fail_under`, jacoco check rules), type-check, security scans.
3. Blocking semantics: step in required/serial path vs advisory (`continue-on-error: true`, `|| true`, report-only modes).
4. Branch-protection cross-check via GH API when available (required checks).

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"test08": {
  "ci_files": [".github/workflows/ci.yml"],
  "gates": {"lint": {"present": true, "blocking": true},
             "typecheck": {"present": false},
             "coverage_gate": {"present": true, "blocking": true, "threshold": 70},
             "sast": {"present": false}},
  "advisory_only_sites": 1,
  "branch_protection_known": false}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                  # presence/absence is fully decidable
estimated_when: CI configs exist but unparseable (rare)   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §TEST-08.

- `3`: lint ∧ typecheck ∧ coverage ∧ SAST all present ∧ blocking
- `2`: lint-only or partial gates; coverage gate absent
- `1`: gates present but advisory-only on main path
- `0`: no SAST/static analysis stage at all ∨ zero CI configs

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Malformed YAML → parse-error fact; all-malformed → estimated + scope-limited

## 8. Evidence string

```
evidence: "ci-audit {files}: gates L/T/C/S = {l}/{t}/{c}/{s}; blocking={b}; advisory sites={a}"
```

## 9. Scope/overlaps echo

Quality-gate presence/blocking; security-job specifics are SEC-10's row (orchestrator shares the parsed configs).

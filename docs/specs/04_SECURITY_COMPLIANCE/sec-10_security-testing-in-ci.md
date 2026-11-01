# SEC-10 — Security Testing in CI — Implementation Spec

> **Authority:** This file defines the SEC-10 implementation contract. The [SEC rubric category](../../rubric/04_SECURITY_COMPLIANCE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | ⚡ human · engine: CI config audit (shared parse with TEST-08) |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-10 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** CI YAML parsers (shared fact base with TEST-08 — orchestrator parses once); security-job matchers: SAST (`semgrep`, `codeql`, `sonarqube`), secret scan (`gitleaks`, `trufflehog` steps), dependency scan (`trivy`, `dependabot` workflow, `osv-scanner`), container/image scan, DAST schedule presence, `permissions:` hardening block
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A. Zero CI configs → measured score-0 (clause-b evidence).

## 2. Detection recipe

1. Reuse parsed CI job graph.
2. Classify security jobs by class + trigger context (every-push vs weekly cron vs manual).
3. Blocking check: fail-on-find vs report-only (`continue-on-error`, `|| true`, `severity: --exit-code` flags).
4. Diff-context coverage: scans pinned to PRs vs only default-branch crons.

Preconditions: TEST-08 parse available.

## 3. Fact schema

```json
{"sec10": {
  "security_jobs": [{"name": "semgrep", "class": "sast", "trigger": "push", "blocking": true}],
  "classes_present": ["sast", "deps"],
  "secret_scan_covers_history": false,
  "image_scan_on_build": false,
  "workflow_permissions_hardened": true}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                  # job inventory decidable statically
estimated_when: configs unparseable              # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §SEC-10.

- `3`: SAST ∧ secret-scan(history) ∧ deps ∧ image classes present ∧ blocking on push/PR
- `2`: core classes present, partial blocking or partial triggers
- `1`: single advisory-only class
- `0`: no security jobs at all

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Parse failure → estimated + scope-limited (never a false 0)

## 8. Evidence string

```
evidence: "ci-security: classes={list}; blocking={k}/{n}; history-secret-scan={bool}; perms-hardened={bool}"
```

## 9. Scope/overlaps echo

Security-job inventory/blocking in CI; the gates' quality-gate siblings are TEST-08; actual findings come from SEC-01/02.

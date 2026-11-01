# TEST-08 — Quality Gates in CI

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for TEST-08. Edit this file; the legacy path [test-08_quality-gates-in-ci.md](../../../specs/03_TESTING_QUALITY/test-08_quality-gates-in-ci.md) is a compatibility alias.
> **Category:** [Testing & Quality Engineering](../../03_TESTING_QUALITY.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/03_TESTING_QUALITY/TEST-08_quality-gates-in-ci.md`

## 1. Identity

| field | value |
|---|---|
| ID | TEST-08 |
| Name | Quality Gates in CI |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ ≤ 30 min — CI config read. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There are no automated quality gates — no static analysis (SAST/lint), no coverage threshold, no complexity budget, no security scan — blocking or reporting on the merge path. Quality relies entirely on human review.
- **Why it signals obsolescence:** Gates are the difference between a *process* that maintains quality and a *hope* that it does. A codebase without gates is one where every quality debt is discovered by incident or by argument. It's also a signal the CI was built in an era before quality tooling, or that the team has given up on enforcement.
- **Where it manifests:** CI that only builds and runs tests (or not even that), no lint step, no SAST (Semgrep/SonarQube/CodeQL), no coverage gate, no `knip`/complexity check, "reviewers are the gate" as the whole policy.
- **Objective metric:** `# of quality tool stages in CI`; `% of mergeable PRs blocked by a gate`; `# of bypassed/admin merges per month`; `existence of coverage & lint & SAST gates`.
- **Yellow flag (warning):** Linting only; no coverage or SAST gate; quality relies on review. *(Rationale: warning — some guard exists but it's toothless on the important axes.)*
- **Red flag (critical):** No static analysis or quality gates of any kind on the merge path. *(Rationale: every quality defect is discovered downstream — the process has no immune system either.)*
- **Example symptom:** "The CI 'pipeline' is build + test. A `console.log(process.env.AWS_SECRET)` gets merged behind an admin bypass because the 'reviewer was busy.' Nothing ran to catch it."
- **Blast radius:** Secret leakage, dead code, security debt, coverage decay, quality disputes, refactor safety.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full gates enforced; 2 = lint-only, review as gate; 1 = gates exist but bypassable/comment-only; 0 = no gates at all.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add lint + SAST (Semgrep/CodeQL/SonarQube) as failing stages, add a coverage gate on core, block admin bypass (require justification audit). Structural fix: define the quality bar in code (lint rules, complexity budgets, coverage thresholds, security checks) and let CI enforce it; tie all gates to the same config the team reviews.
- **Gold standard / target state:** CI fails on lint, SAST, coverage, complexity, and security findings; bypasses are impossible or audited; the gates' config is itself reviewed.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** CI YAML parsers: `.github/workflows/*`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`, `.circleci/config.yml`, `bitbucket-pipelines.yml`
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A. Zero CI configs (clause-b over enumerated tree) → score-0 measured, not N/A.

## 6. Detection recipe

- **Detection method:** CI config audit — read the pipeline (GitHub Actions/`.gitlab-ci.yml`/Jenkinsfile): list jobs; check for lint/static-analysis/coverage/security stages; check if gates fail the build or just comment; count of merges that bypassed CI (admin merges).

1. Enumerate + parse CI configs; list jobs and steps.
2. Gate inventory per stage class: lint, static-analysis/SAST, coverage threshold (`--coverage --coverage-threshold`, `fail_under`, jacoco check rules), type-check, security scans.
3. Blocking semantics: step in required/serial path vs advisory (`continue-on-error: true`, `|| true`, report-only modes).
4. Branch-protection cross-check via GH API when available (required checks).

Preconditions: tree enumerated.

## 7. Fact schema

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

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                  # presence/absence is fully decidable
estimated_when: CI configs exist but unparseable (rare)   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: lint ∧ typecheck ∧ coverage ∧ SAST all present ∧ blocking
- `2`: lint-only or partial gates; coverage gate absent
- `1`: gates present but advisory-only on main path
- `0`: no SAST/static analysis stage at all ∨ zero CI configs

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Malformed YAML → parse-error fact; all-malformed → estimated + scope-limited

## 10. Evidence and output

### Evidence string

```
evidence: "ci-audit {files}: gates L/T/C/S = {l}/{t}/{c}/{s}; blocking={b}; advisory sites={a}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Quality-gate presence/blocking; security-job specifics are SEC-10's row (orchestrator shares the parsed configs).

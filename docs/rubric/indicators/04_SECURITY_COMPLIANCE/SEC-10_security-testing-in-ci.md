# SEC-10 — Security Testing in CI

> **Category:** [Security, Compliance & Vulnerability](../../04_SECURITY_COMPLIANCE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | SEC-10 |
| Name | Security Testing in CI |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔷 ~1–2 days — CI audit + coverage analysis. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Security tooling (SAST, secret scanning, dependency scanning, container scanning, and periodic DAST/pentest) is absent from CI or performed ad hoc — meaning security is found downstream, by incidents and audits, rather than caught at merge time.
- **Why it signals obsolescence:** "Shift-left" security (gates in CI) is the modern baseline. A codebase without it is relying on human reviewers for security, which — as every breach analysis shows — is not a strategy. This indicator measures whether the *process* is modern even when today's findings are clean.
- **Where it manifests:** CI with no SAST job (Semgrep/CodeQL/SonarQube), no secret scan step, no dependency scan (or run only weekly), no container image scan, no `trivy` step, pentests done "when someone remembers," no threat modelling artifacts.
- **Objective metric:** `# of security job categories in CI (SAST, secrets, deps, image, DAST)`; `% of recent PRs covered by those jobs`; `mean time to remediate a CI-found finding`; `pentest/DAST cadence (months)`.
- **Yellow flag (warning):** One or two scan types in CI (e.g., secrets + deps), SAST missing or comment-only, DAST quarterly at best. *(Rationale: warning — you catch the cheap stuff, not everything.)*
- **Red flag (critical):** No security tooling in CI at all, or scans exist but can't fail the build (always green), or findings have no owner/tracking. *(Rationale: every security defect ships to the field and is discovered by the next user or attacker.)*
- **Example symptom:** "The only 'security scan' is a monthly Trivy run the SRE pastes into a ticket. CodeQL was half-configured three years ago and 'still isn't blocking.' A findbug-grade credential leak merged last week wasn't caught by anything."
- **Blast radius:** Defect-in-field rate for security, audit outcomes, breach likelihood, remediation cost (security bugs found late cost 100×).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = full toolchain gating; 2 = partial toolchain, no block; 1 = minimal coverage, no tracking; 0 = zero security tooling in CI.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add Semgrep/CodeQL failing gates, secret scan on history + CI, TRIVY on images — this week. Structural fix: a security-as-quality pipeline (SAST, deps, secrets, container, DAST on staging, threat modelling for new features), a findings tracking loop (owner, SLA, retest), and a hard "no gate-less merge" rule.
- **Gold standard / target state:** Five scan categories failing in CI, findings tracked to closure within SLA, DAST regularly scheduled, threat modelling on all new boundaries.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** CI YAML parsers (shared fact base with TEST-08 — orchestrator parses once); security-job matchers: SAST (`semgrep`, `codeql`, `sonarqube`), secret scan (`gitleaks`, `trufflehog` steps), dependency scan (`trivy`, `dependabot` workflow, `osv-scanner`), container/image scan, DAST schedule presence, `permissions:` hardening block
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A. Zero CI configs → measured score-0 (clause-b evidence).

## 6. Detection recipe

- **Detection method:** CI config audit — inventory security jobs; check they fail the build (not comment-only) and scan all diff contexts; check secret scan covers history; check container/image scanning on every build; check DAST/pentest cadence records; verify findings have an owner+tracking (not just printed).

1. Reuse parsed CI job graph.
2. Classify security jobs by class + trigger context (every-push vs weekly cron vs manual).
3. Blocking check: fail-on-find vs report-only (`continue-on-error`, `|| true`, `severity: --exit-code` flags).
4. Diff-context coverage: scans pinned to PRs vs only default-branch crons.

Preconditions: TEST-08 parse available.

## 7. Fact schema

```json
{"sec10": {
  "security_jobs": [{"name": "semgrep", "class": "sast", "trigger": "push", "blocking": true}],
  "classes_present": ["sast", "deps"],
  "secret_scan_covers_history": false,
  "image_scan_on_build": false,
  "workflow_permissions_hardened": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                  # job inventory decidable statically
estimated_when: configs unparseable              # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: SAST ∧ secret-scan(history) ∧ deps ∧ image classes present ∧ blocking on push/PR
- `2`: core classes present, partial blocking or partial triggers
- `1`: single advisory-only class
- `0`: no security jobs at all

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Parse failure → estimated + scope-limited (never a false 0)

## 10. Evidence and output

### Evidence string

```
evidence: "ci-security: classes={list}; blocking={k}/{n}; history-secret-scan={bool}; perms-hardened={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Security-job inventory/blocking in CI; the gates' quality-gate siblings are TEST-08; actual findings come from SEC-01/02.

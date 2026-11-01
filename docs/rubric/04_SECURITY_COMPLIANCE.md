# 04 — Security, Compliance & Vulnerability

> **Canonical category index.** Base weight: 20% · FE-active weight: 18% · Standard indicators: SEC-01–SEC-10 · Deep-dive indicators: none
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** Security debt is the only debt that can end the company. A codebase that treats security as an afterthought is obsolete in the most literal sense — it belongs to an era we no longer permit.
**Category summary:** The highest-weight category (20%). Scores the system's vulnerability posture, credential hygiene, security controls, auth, auditability, supply-chain safety, patch cadence, and compliance standing. Four gating kill-switches (G1, G2, G4) live here — more than any other category — because security Red Flags cap the modernization verdict.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| SEC-01 | Unpatched Vulnerabilities | A | measured | YES | **G2** — critical CVE > 14d unpatched on exposed path | standard · folds into SEC category % | 🔶 ~2–4 h | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-01_unpatched-vulnerabilities.md) |
| SEC-02 | Hardcoded Secrets & Credentials | A | measured | YES | **G1** — credential exposure | standard · folds into SEC category % | ⚡ ≤30 min | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-02_hardcoded-secrets-credentials.md) |
| SEC-03 | Missing Web Security Controls | B | estimated | NO | **G4** (with SEC-04) — as `needs-verification` in v1, never `proven` from URL | standard · folds into SEC category % | 🔶 ~2–4 h | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-03_missing-web-security-controls.md) |
| SEC-04 | Authentication & Authorization Weaknesses | B | unknown | PART (estimated-only; low-confidence label mandatory) | **G4** (with SEC-03) | standard · folds into SEC category % | 🔶 ~2–4 h | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-04_authentication-authorization-weaknesses.md) |
| SEC-05 | Audit Logging Deficits | B | unknown | NO | none | standard · folds into SEC category % | 🔶 ~2–4 h | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-05_audit-logging-deficits.md) |
| SEC-06 | Insecure Transitive Chains | B | measured | YES | none (confirmed malware cross-references ECOS-10 evidence) | standard · folds into SEC category % | 🔶 ~2–4 h | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-06_insecure-transitive-chains.md) |
| SEC-07 | Patch Cadence & Update Workflow | A | measured | YES | none | standard · folds into SEC category % | ⚡ ≤30 min | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-07_patch-cadence-update-workflow.md) |
| SEC-08 | Compliance Drift | D | unknown | NO | none | standard · folds into SEC category % | 🔶 ~2–4 h | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-08_compliance-drift.md) |
| SEC-09 | Input Robustness & Fuzzing | B | unknown | YES (presence-only caveat mandatory) | none | standard · folds into SEC category % | 🔷 ~1–2 days | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-09_input-robustness-fuzzing.md) |
| SEC-10 | Security Testing in CI | A | measured | YES | none | standard · folds into SEC category % | 🔷 ~1–2 days | [unified](./indicators/04_SECURITY_COMPLIANCE/SEC-10_security-testing-in-ci.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.

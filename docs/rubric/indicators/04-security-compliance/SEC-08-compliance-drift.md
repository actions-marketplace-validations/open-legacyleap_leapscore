# SEC-08 — Compliance Drift

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-08 |
| Name | Compliance Drift |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | D |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 ~2–4 h — control inventory + evidence check. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system is out of alignment with the compliance frameworks it must meet (SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, or internal policy controls) — evidence collection is manual, control mapping is stale or nonexistent, and required safeguards (encryption in transit/at rest, data retention, right-to-erasure, attestation) are missing.
- **Why it signals obsolescence:** Compliance is a contract with the market — customers, regulators, insurers. Drift means the codebase is no longer *certifiable*, which blocks sales, renewals, and funding, and signals the security program itself is under-resourced (all SEC indicators correlate).
- **Where it manifests:** Missing encryption at rest, no data-retention/erasure flows (GDPR), controls without evidence (SOC2), audit findings closed as "accepted risk" en masse, no data classification, PII stored in unencrypted logs or denormalized blobs, outdated policy docs vs. actual behavior.
- **Objective metric:** `% of required controls implemented + evidenced`; `# of controls with manual-only evidence`; `encryption-at-rest coverage %`; `retention/erasure automation %`; `# of 'accepted risk' audit findings`.
- **Yellow flag (warning):** Partial control mapping, manual evidence collection, a few accepted-risk findings, some unencrypted stores. *(Rationale: warning — manageable, but auditors will flag it.)*
- **Red flag (critical):** No mapping or evidence to required frameworks, no encryption at rest, no retention/erasure capability, or audit findings closed without remediation. *(Rationale: the system cannot be certified or defended — a business blocker.)*
- **Example symptom:** "A SOC2 renewal is 6 weeks out. The control evidence is a wiki link from 2021. PII lives in an unencrypted analytics DB. 'We'll note it as accepted risk' was the answer three quarters running."
- **Blast radius:** Sales/renewals, funding, insurance, regulatory fines, customer trust, breach liability.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = mapped + auto-evidenced; 2 = partial mapping, manual evidence; 1 = no evidence automation, accepted risks growing; 0 = unmapable to frameworks, no core safeguards.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: map the top 10 required controls to evidence today, automate the biggest evidence gaps (logs, backups, review reports). Structural fix: continuous compliance automation (CSPM tools, evidence pipelines), close the accepted-risk list to a bounded, tracked set, encryption at rest everywhere, retention/erasure as engineering backlog items.
- **Gold standard / target state:** Controls auto-evidenced, near-zero accepted-risk, encryption + retention/erasure automated, audit-ready at any moment.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- Control-mapping, retention/encryption evidence, access reviews — org/process plane. No URL signal exists.

## 6. Detection recipe

- **Detection method:** Control-mapping audit — inventory the required control set, verify each against implementation (encryption config, retention jobs, erasure endpoints, log retention, access reviews); check evidence-generation (is it automated or a manual spreadsheet?); review recent audit findings and acceptances. Tools: compliance scanners (e.g., CSPM/Vanta/Drata evidence), manual walkthrough.

None in v1. Static hints (SOC2 badge in README, `compliance/` dir) are explicitly **not** scored — presence marketing ≠ control evidence; recorded as emission-text context only.

## 7. Fact schema

```json
{"sec08": {"status": "unknown", "reason": "control mapping requires human audit against a framework scope"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never
estimated_when: never                            # compliance guesses are reputation-fatal
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs a scoped control-mapping audit (SOC2/GDPR/HIPAA); see deep-dive checklist"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Control-framework drift; technical controls that feed it (backups, logging) live in DATA-06/SEC-05.

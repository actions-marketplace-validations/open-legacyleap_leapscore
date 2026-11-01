# SEC-05 — Audit Logging Deficits

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for SEC-05. Edit this file; the legacy path [sec-05_audit-logging-deficits.md](../../../specs/04_SECURITY_COMPLIANCE/sec-05_audit-logging-deficits.md) is a compatibility alias.
> **Category:** [Security, Compliance & Vulnerability](../../04_SECURITY_COMPLIANCE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/04_SECURITY_COMPLIANCE/SEC-05_audit-logging-deficits.md`

## 1. Identity

| field | value |
|---|---|
| ID | SEC-05 |
| Name | Audit Logging Deficits |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | B |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 ~2–4 h — config audit + end-to-end trace test. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system has no (or inadequate) audit trail: administrative actions, PII access/modification, authentication events, and permission changes are not logged — or logs are unstructured, tamperable, or not retained.
- **Why it signals obsolescence:** Audit logs are how you learn what happened — required for every serious incident, every compliance framework (SOC2, HIPAA, GDPR' accountability), and every post-mortem. Their absence means the system is un-forensic: if (when) something happens, you will not know the who/when/what. Modern systems log events as a first-class, structured, append-only concern.
- **Where it manifests:** Admin endpoints with no logging, no auth-event log, PII read/modify paths without access records, logs that get wiped on deploy, unstructured ad-hoc `console.log`, no retention policy, no tamper protection.
- **Objective metric:** `# of admin/PII/auth events with audit logging`; `% of sensitive actions traceable end-to-end`; `log retention days`; `tamper protection present?`; `log format structured?`.
- **Yellow flag (warning):** Unstructured logs or missing request correlation IDs; partial coverage (some sensitive actions logged, some not). *(Rationale: warning — reconstruction is hard but possible.)*
- **Red flag (critical):** Zero audit trails for administrative access, PII modification, or authentication events. *(Rationale: you cannot investigate — regulatory and forensic dead-end.)*
- **Example symptom:** "After a blast-radius incident, the team tries to reconstruct who exported 40k customer records. The admin tool logs nothing; deploy containers wipe `/var/log`. 'We can't tell you who did it' is the honest answer."
- **Blast radius:** Incident forensics, regulatory non-compliance, breach liability, insider-threat detection, user-trust litigation.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = complete, structured, retained; 2 = partial coverage, unstructured; 1 = major gaps in sensitive paths; 0 = no audit trail at all.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add audit logging to the top admin/PII/auth paths with a structured schema, ship logs to an external durable sink, set retention. Structural fix: treat audit as a compliance requirement — append-only/crypto-chained where needed, centralized log platform, automated test asserting every sensitive action produces an audit event.
- **Gold standard / target state:** Every admin/PII/auth event logged structured (actor, action, target, time, request ID), durable, retained per policy, and tamper-evident; an automated coverage test exists.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- Runtime log sinks/retention/content — org/runtime plane. Not derivable from URL.

## 6. Detection recipe

- **Detection method:** Log/config audit — check log sinks, retention, and content; automation: review the auth module and admin APIs for audit statements; check audit trail survives redeploy (external sink vs. local fs); check log schema (structured JSON with event type, actor, target, timestamp, request ID); run an action and confirm it's traceable end-to-end.

1. Enumerate audit-event emission sites in auth/admin/PII modules.
2. Verify sink survives redeploy (external sink config) and retention settings.
3. Schema check: structured events with actor/action/target.

**v1 behavior:** `unknown` + emission text. Logging *library* presence is PERF-01's instrumentation fact — not duplicated here as a score.

## 7. Fact schema

```json
{"sec05": {"status": "unknown",
            "reason": "audit-trail content/retention needs runtime + sink audit"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # presence-of-logging-library proves nothing about audit coverage
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
emission: "unknown — requires auditing auth/admin/PII event emission against external sinks (deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Audit-trail deficits; observability instrumentation generally is PERF-01.

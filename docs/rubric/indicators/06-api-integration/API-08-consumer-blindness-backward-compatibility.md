# API-08 — Consumer Blindness & Backward Compatibility

> **Category:** [API & Integration Surface](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | API-08 |
| Name | Consumer Blindness & Backward Compatibility |
| Category | API — API & Integration Surface |
| Engine tier | B |
| Default status | estimated |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: API` |
| Verify effort | 🔶 ~2–4 h — telemetry audit + consumer interview. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The team doesn't know its API consumers — no consumer registry, no usage telemetry on endpoints/fields, no deprecation communication channel, and breaking changes are discovered via angry emails rather than design.
- **Why it signals obsolescence:** An API you can't see is an API you can't manage. Modern API platforms know their consumers (who calls what, which fields, which versions), so changes are rational. Legacy APIs are usually blind — grief-driven, reactive, and hostile to change, which freezes the whole platform.
- **Where it manifests:** No consumer registry, no endpoint analytics, "who uses this?" → "some client from 2017 maybe," no changelog/deprecation announcements, consumer teams discovered when they break, no rate-limit/usage data per client.
- **Objective metric:** `% of endpoints with consumer-usage visibility`; `# of consumers registered/tracked`; `field-level usage tracked?`; `deprecation channel exists + used?`; `consumer-breakage incidents (last 12 mo)`.
- **Yellow flag (warning):** Some analytics (API keys, traffic per endpoint), no full consumer registry, deprecation ad hoc. *(Rationale: warning — awareness is partial.)*
- **Red flag (critical):** Zero consumer visibility, changes shipped without any ability to know who's affected, or repeated consumer-breakage incidents. *(Rationale: the API is unowned — every change is a blind shot.)*
- **Example symptom:** "A 'cleanup' removes a field used by exactly one partner for a compliance submission — discovered a week later, in their angry ticket. 'How would we have known?' is the honest question, and the answer is nothing in the platform tracks it."
- **Blast radius:** Consumer trust, integration reliability, change confidence, API growth, partner/sales exposure.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full visibility + registry; 2 = partial analytics; 1 = analytics silo'd, no registry; 0 = blind changes, repeated breakage.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add per-consumer API keys + endpoint analytics (who, what, how often), start a consumer registry doc. Structural fix: full usage telemetry (endpoint + field level), a deprecation communication channel (changelog + consumer mailer + status page), consumer onboarding/registration as standard, usage dashboards for product decisions.
- **Gold standard / target state:** Every consumer known + registered, endpoint/field usage visible, deprecations announced with migration guides, zero surprise consumer breakage.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Endpoint analytics, consumer registry, deprecation-announcement channels — org/telemetry plane. Not derivable from URL.

## 6. Detection recipe

- **Detection method:** Telemetry/inventory — is there endpoint analytics (each client's call voland field usage)? A consumer registry or at least API-key/credential per consumer? Deprecation announcement channel (changelog, emails, status page)? Interview: can the team answer "which external systems call endpoint X"? Measure breach incidents of the last year.

None in v1. In-repo hints (per-consumer API keys in config templates, changelog announcement sections) are emission context only.

## 7. Fact schema

```json
{"api08": {"status": "unknown",
            "reason": "field-usage/consumer inventory requires telemetry or registry access"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never
estimated_when: never                            # key-in-config hints prove registration exists, not awareness quality
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
emission: "unknown — needs per-consumer call-volume/field telemetry (deep scan with org access)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Consumer-awareness gap; the versioning mechanics that serve them are API-02.

# VEL-12 — Incident Recovery / MTTR

> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | VEL-12 |
| Name | Incident Recovery / MTTR |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | B |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: VEL` |
| Verify effort | 🔷 ~1–2 days — incident data mining + runbook audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Recovery from incidents is slow and manual — mean time to restore is hours-plus, runbooks are absent or wrong, rollback is manual, diagnosis relies on a few experts, and the same failure mode repeats because no systemic fix follows.
- **Why it signals obsolescence:** MTTR is the operational output of the whole diagnosis chain (observability PERF-01, error semantics API-07, runbooks DOCS-03, deploy safety VEL-03). A system that fails and takes half a day to bring back is, from the business's point of view, half a day dead — and it's the standard legacy profile.
- **Where it manifests:** On-call "heroics," no runbooks (or stale), diagnosis by `ssh` + `grep`, manual rollback scripts, repeated incidents of the same class, no blameless postmortens, no incident metrics tracked at all.
- **Objective metric:** `MTTR (P50/P90)`; `incident-class repetition rate`; `runbook coverage % of incident types`; `rollback time P90`; `% of postmortem actions actually shipped`.
- **Yellow flag (warning):** MTTR 1–2 h, runbooks partial, rollback mostly manual, some repetition. *(Rationale: warning — under professional norms is achievable, currently over.)*
- **Red flag (critical):** MTTR > 4–6 h, no runbooks, rollback is a manual nightmare, or the same incident recurs quarterly. *(Rationale: hours of absolute downtime + a fix that never happens = business-critical failure.)*
- **Example symptom:** "Tuesday 3am: queue backlog gone. On-call pings three people, greps 40 log files, finds a dead worker 2 hours in, restarts manually via SSH (the runbook was written for a different topology), back at 6:30am. Same incident happened in March."
- **Blast radius:** Availability, revenue, on-call burnout, compliance (availability SLAs), trust — and it's the compounding output of everything in this category.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = MTTR < 30 min, drill-proven; 2 = 1–2 h, runbooks partial; 1 = > 4 h, manual; 0 = half-day incidents, recurring, no runbooks.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: write the top 5 runbooks (drill them), enable fast rollback (VEL-03), add the observability slices that made diagnosis slow (PERF-01). Structural fix: incident-on-call excellence — accurate runbooks, ephemeral-infra-friendly rollback, self-healing where possible, every incident gets a blameless postmortem whose actions you actually fund, MTTR tracked as an SLO.
- **Gold standard / target state:** MTTR < 30 min majority, runbook-based recovery, rollback automated, no incident class repeats, postmortem actions all shipped.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- PagerDuty/incident-tool MTTR, incident records, rollback timings — org/runtime plane.

## 6. Detection recipe

- **Detection method:** Incident analytics — PagerDuty/incident-tool MTTR and MTTD, incident-class repetition (same cause ≥ 2×/quarter), rollback time measurement, runbook coverage/currency audit, postmortem quality (actions taken?) and backlog closure rate.

None in v1. In-repo hints (postmortem files, `runbooks/` links, oncall schedules in IaC) are emission context only; runbook *presence* is DOCS-03's row and is not double-scored here.

## 7. Fact schema

```json
{"vel12": {"status": "unknown", "reason": "MTTR requires incident tooling history"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never
estimated_when: never
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
emission: "unknown — needs incident-tool MTTR/MTTD history + rollback timing (org access)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Recovery-time outcomes; the runbook artifacts that support recovery are DOCS-03.

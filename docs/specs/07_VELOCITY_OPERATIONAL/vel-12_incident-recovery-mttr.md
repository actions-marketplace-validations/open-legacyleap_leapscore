# VEL-12 — Incident Recovery / MTTR — Implementation Spec *(deep-dive — folds into VEL when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** (tier arbitrated; encyc said B — incident data is org plane) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: VEL` |
| Verify effort | 🔷 human (incident tooling audit) |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-12 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- PagerDuty/incident-tool MTTR, incident records, rollback timings — org/runtime plane.

## 2. Detection recipe

None in v1. In-repo hints (postmortem files, `runbooks/` links, oncall schedules in IaC) are emission context only; runbook *presence* is DOCS-03's row and is not double-scored here.

## 3. Fact schema (v1)

```json
{"vel12": {"status": "unknown", "reason": "MTTR requires incident tooling history"}}
```

## 4. Statusing rules

```yaml
measured_when:  never
estimated_when: never
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs incident-tool MTTR/MTTD history + rollback timing (org access)"
```

## 9. Scope/overlaps echo

Recovery-time outcomes; the runbook artifacts that support recovery are DOCS-03.

# PERF-09 — Cost Efficiency / FinOps — Implementation Spec *(deep-dive — folds into PERF when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: PERF` |
| Verify effort | 🔷 human (bill + attribution audit) |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-09 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Cloud bills, resource-level cost attribution, tagging audits — org/cloud-account plane.

## 2. Detection recipe

None in v1. In-repo hints (tagging policies in IaC, budget-alert configs) are emission context only.

## 3. Fact schema (v1)

```json
{"perf09": {"status": "unknown", "reason": "requires cloud-bill + utilization join"}}
```

## 4. Statusing rules

```yaml
measured_when:  never
estimated_when: never                            # tag-policy greps prove nothing about spend
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
emission: "unknown — needs resource-level cost data + P95-utilization join (org access)"
```

## 9. Scope/overlaps echo

Spend efficiency; the capacity/scaling configs that drive it are PERF-05.

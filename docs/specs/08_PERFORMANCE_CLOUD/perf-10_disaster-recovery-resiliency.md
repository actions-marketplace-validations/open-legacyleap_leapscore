# PERF-10 — Disaster Recovery & Resiliency — Implementation Spec *(deep-dive — folds into PERF when run)*

> **Authority:** This file defines the PERF-10 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** |
| v1 flag | NO |
| Gates fed | none (complements DATA-06's G7 on the backup half; DR-drill half stays human) |
| Rollup / deep-dive | deep-dive · `folds_into: PERF` |
| Verify effort | 🔷 human (failover drills) |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-10 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- RTO/RPO docs, multi-region topology, drill history — infra/org plane.

## 2. Detection recipe

None in v1. In-repo hints (multi-region blocks in IaC, replication configs, runbook references) are emission context; backup/restore evidence is DATA-06's row — no double-scoring.

## 3. Fact schema (v1)

```json
{"perf10": {"status": "unknown",
             "reason": "DR provable only via drills and infra audit",
             "context": {"multi_region_iac_blocks": 0}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # IaC hints ≠ drilled capability either way
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none (DATA-06 owns the data-rescue gate).

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs documented RTO/RPO + last successful failover drill (deep scan)"
```

## 9. Scope/overlaps echo

Failover/resiliency drills; backup/restore lifecycle is DATA-06.

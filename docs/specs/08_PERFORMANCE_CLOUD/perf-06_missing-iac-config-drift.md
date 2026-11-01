# PERF-06 — Missing IaC / Config Drift — Implementation Spec

> **Authority:** This file defines the PERF-06 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured — true drift needs cloud creds) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 human · engine: IaC coverage inventory |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-06 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** IaC inventory: Terraform (`*.tf`, state backend configs), Pulumi, CloudFormation templates, Ansible playbooks; coverage heuristic: resource classes implied by deploy artifacts (PERF-02 facts) vs declared in IaC; config-change audit trail markers (plan/apply CI jobs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: PERF-02 shows fully serverless-managed model with zero infra surface` (reason recorded). Else applicable — including zero-IaC trees (that's score signal).; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Inventory IaC frameworks + module breadth (network/compute/data-store classes).
2. Coverage heuristic: cross-reference services in compose/K8s manifests against declared resources.
3. Drift-check automation: `terraform plan` in CI as gate; drift-detection schedules.
4. Live-state diffing requires cloud creds → emission text.

Preconditions: deploy inventory available.

## 3. Fact schema

```json
{"perf06": {
  "iac_frameworks": ["terraform"],
  "resource_classes_declared": ["db", "compute", "dns"],
  "classes_implied_by_deploy": ["db", "compute", "cdn"],
  "ci_plan_gate": {"present": false},
  "undeclared_classes": ["cdn"]}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # coverage ratio is heuristic vs implied needs
estimated_when: >=1 deploy artifact inventoried   # clamp [1,2]; confidence medium with multi-class IaC present
unknown_when:   no deploy/config artifacts
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when both sides of the coverage join parsed cleanly
scope_limited:  partial repo coverage -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §PERF-06. Estimated ⇒ score ∈ {1,2}:

- `2`: IaC present covering most implied classes; plan-gate optional
- `1`: IaC absent ∨ major implied class undeclared ∨ hand-edited console-culture signals
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "iac-inventory: {frameworks}; declared={classes}; undeclared-implied={list}; plan-gate={bool}"
```

## 9. Scope/overlaps echo

IaC coverage posture; deployment model is PERF-02, env-parity VEL-07.

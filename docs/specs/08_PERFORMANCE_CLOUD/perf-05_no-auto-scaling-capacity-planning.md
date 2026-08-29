# PERF-05 — No Auto-Scaling / Capacity Planning — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (HPA/ASG presence proof only; matrix C·unknown, `docs/plans/04` §5 ships the IaC proxy) |
| v1 flag | PART |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 human · engine: IaC scaling-config scan |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-05 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** scaling-config matchers: K8s `HorizontalPodAutoscaler`, ECS service autoscaling policies, ASG blocks in Terraform/CloudFormation, serverless concurrency configs; capacity-review artifacts (load-test scripts in repo, forecasting docs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: PERF-02 shows serverless-only model` (scaling inherent — reason recorded). `unknown_when: no IaC/deploy manifests in repo` (managed elsewhere). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Enumerate scaling policies across IaC + deploy manifests.
2. Classify: policy-backed autoscaling / static-instance only / undeclared.
3. Utilization history and spike-response analysis are telemetry plane → emission text.

Preconditions: deploy artifacts present.

## 3. Fact schema

```json
{"perf05": {
  "hpa_or_asg_present": true,
  "policies": [{"kind": "hpa", "path": "k8s/api-hpa.yaml", "min_max": [2, 10]}],
  "capacity_review_artifacts": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # presence ≠ correct sizing under real load
estimated_when: >=1 deploy artifact enumerated # clamp [1,2]; confidence medium when policy params visible
unknown_when:   no infra manifests (clause: managed elsewhere)
na_when:        serverless-only model
clamp:          [1,2]
confidence:     low without policy parameters ("presence proof only" caveat mandatory per docs/plans/04 §5)
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §PERF-05. Estimated ⇒ score ∈ {1,2}:

- `2`: autoscaling declared on primary services
- `1`: static-capacity-only declarations ∨ no scaling config for a multi-instance model
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "scaling-scan: {kind}@{path} min={a} max={b}; capacity-artifacts={bool} [presence-only]"
```

## 9. Scope/overlaps echo

Scaling-policy posture; deployment model is PERF-02, live contention DATA-05.

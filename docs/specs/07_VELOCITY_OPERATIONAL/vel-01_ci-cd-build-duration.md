# VEL-01 — CI/CD Build Duration — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** |
| v1 flag | PART (`docs/plans/04` §5) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ proxy human |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-01 |

## 1. Inputs

- **Planes:** gh-api (Actions runs), static-src (workflow parse)
- **Tools:** `GET /repos/{o}/{r}/actions/runs` → `run_duration_ms`; stage attribution from job names (install/build/test split where jobs separate); GitLab/Jenkins equivalents when configs indicate them (public data only for GH-hosted CI in v1)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero CI workflows` → N/A? No — zero CI is scored 0 territory of TEST-08/VEL rows generally; here N/A is admissible only if repo has no build at all (docs-only). Otherwise unknown.

## 2. Detection recipe

1. Identify build/push-triggered workflows; pull last K successful runs' durations.
2. Median + p95 push-to-green; stage split when multi-job.
3. Serial-stage smell detection from workflow graph.

Preconditions: public Actions or App token.

## 3. Fact schema

```json
{"vel01": {
  "workflow": "ci.yml", "runs_sampled": 25,
  "median_min": 11.4, "p95_min": 26.0,
  "stage_split_known": true,
  "serial_bottleneck_job": "e2e"}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1                      # elapsed wall-time ≠ instrumented stage timing
estimated_when: >=5 runs sampled                 # clamp [1,2]; confidence low ("elapsed signal" caveat mandatory)
unknown_when:   <5 runs / no CI
na_when:        no-build tree
clamp:          [1,2]
confidence:     low by rule
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §VEL-01. Estimated ⇒ score ∈ {1,2}:

- `2`: `p95 < R_MIN`
- `1`: `p95 >= R_MIN` ∨ serial-bottleneck job dominating median
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limit → fewer samples; <5 → unknown "rate-limited"

## 8. Evidence string

```
basis: "actions n={k}: push-to-green median {m}m, p95 {p}m (elapsed signal)"
```

## 9. Scope/overlaps echo

End-to-end build latency; test-suite duration specifically is TEST-04 (stage attribution separates).

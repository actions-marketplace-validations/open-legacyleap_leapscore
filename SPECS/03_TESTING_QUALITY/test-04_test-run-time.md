# TEST-04 — Test Run Time — Implementation Spec

## 0. Identity

| field | value |  |
|---|---|---|
| Tier / default status | B · **estimated** (Actions-duration proxy; encyc said measured) |
| v1 flag | PART (`PLANS/04` §5) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ proxy human |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-04 |

## 1. Inputs

- **Planes:** gh-api (Actions runs), static-src (workflow parse)
- **Tools:** `GET /repos/{o}/{r}/actions/runs?status=success` → `run_duration_ms` for test-named workflows; workflow YAML job graph (serial/parallel shape)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no test jobs in CI AND zero test files` → N/A (no suite to time). Zero-CI repos → unknown.

## 2. Detection recipe

1. Identify test workflows by name/step matchers (`test`, `pytest`, `jest`, `go test`).
2. Pull last K successful run durations; take median + p95.
3. No CI: static estimate from test-file count × language-typical per-file cost — only as basis text, never a number presented as measured.

Preconditions: public repo or App token.

## 3. Fact schema

```json
{"test04": {
  "workflow": "ci.yml", "runs_sampled": 20,
  "median_min": 14.2, "p95_min": 27.8,
  "source": "actions-durations"}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1                      # elapsed CI time ≠ instrumented suite timing
estimated_when: >=5 runs sampled                 # clamp [1,2]; confidence low (04 §5 caveat mandatory)
unknown_when:   <5 runs or no CI
na_when:        applicability fired
clamp:          [1,2]
confidence:     low by rule ("not full CI history" caveat)
```

## 5. Score mapping (predicates)

Y/R values (10–30 / >30 min): see encyclopedia §TEST-04. Estimated ⇒ score ∈ {1,2}:

- `2`: `Y_MIN <= p95 < R_MIN`
- `1`: `p95 >= R_MIN` ∨ tests serially blocking every deploy (job-graph check)
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limited → fewer samples; <5 → unknown "rate-limited"

## 8. Evidence string

```
basis: "actions-durations n={k}: median {m}m, p95 {p}m (elapsed-time signal)"
```

## 9. Scope/overlaps echo

Suite duration trend; build/install duration is VEL-01 — stage attribution separates them.

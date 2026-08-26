# TEST-01 — Code Coverage Degradation — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (tier arbitrated; encyc said A·measured — running coverage = execution, forbidden per D5) |
| v1 flag | PART (static proxy per `PLANS/04` §5) |
| Gates fed | none (feeds TEST-06 contextually) |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ proxy human · true coverage needs suite run |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-01 |

## 1. Inputs

- **Planes:** static-src + gh-api (Actions logs/artifacts)
- **Tools:** Actions log fetch (`GET /repos/{o}/{r}/actions/runs` → logs); coverage-artifact patterns (`coverage/lcov.info`, `htmlcov/`, `jacoco.xml`, `coverage.xml`) in tree; coverage-runner config presence (`c8`, `jest --coverage`, `pytest-cov`, `JaCoCo` plugin)
- **Rate-cost:** api-budgeted (latest N runs' log tails only)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files AND zero test config` → unknown, not N/A. Else applicable.

## 2. Detection recipe

1. Tree probe: committed coverage reports/artifacts (with mtime staleness check).
2. CI probe: workflow steps invoking coverage runners; `--coverage` flags; artifact upload steps for coverage dirs.
3. Log probe: tail latest successful test-run logs for summary lines (`Coverage: NN%`, `TOTAL... NN%`, table parsers).
4. Trend: compare across last K runs where available.

Preconditions: repo public or App token with actions:read (M&A plane).

## 3. Fact schema

```json
{"test01": {
  "committed_report": {"found": false},
  "ci_runner_configured": true,
  "log_observed_pct": {"branch": null, "line": 63.5, "source": "run#1234 log", "observed_at": "2026-08-01"},
  "trend_available": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1                      # lineage of any observed number is unverified
estimated_when: any pct signal observed          # clamp [1,2]; confidence low always (04 §5 caveat mandatory)
unknown_when:   no artifact/config/log signal
na_when:        never
clamp:          [1,2]
confidence:     low by rule; report copy carries "seen in CI artifacts; lineage unverified"
scope_limited:  logs unavailable -> unknown "rate-limited" if API exhausted
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §TEST-01. Estimated ⇒ score ∈ {1,2}:

- `2`: `Y_COV <= observed_pct < R_COV`
- `1`: `observed_pct < R_COV` ∨ coverage configured but no observable number anywhere
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Log fetch failure/deletion (90-day retention) → fall through to tree/CI probes; all-miss → unknown

## 8. Evidence string

```
basis: "actions-log run#{id}: line {p}% (artifact lineage unverified)"
```

## 9. Scope/overlaps echo

Coverage level/trend; which core paths lack tests is TEST-06 — not this row.

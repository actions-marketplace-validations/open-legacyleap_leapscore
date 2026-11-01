# TEST-01 — Code Coverage Degradation

> **Category:** [Testing & Quality Engineering](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | TEST-01 |
| Name | Code Coverage Degradation |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | A |
| Default status | measured |
| v1 flag | PART (static proxy per the catalog conventions) |
| Gates fed | none (feeds TEST-06 contextually) |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ ≤ 30 min — CI coverage report read. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Coverage of the highest-criticality logic has fallen below a working threshold — either never measured, measured only on trivial code, or measurably dropping over time.
- **Why it signals obsolescence:** Coverage isn't a goal in itself, but it's the cheapest proxy for "can we refactor this safely?" Below ~50% branch coverage, refactoring the core is close to gambling. A coverage trend that's *falling* is a leading indicator that the suite is being abandoned while production grows.
- **Where it manifests:** CI coverage reports (Istanbul/JaCoCo/coverage.py reports), coverage dashboards, modules with notoriously no tests, "we skip tests to ship" patterns, coverage gate absent or set to 0.
- **Objective metric:** `branch coverage % per module`; `coverage-weighted-by-criticality`; `Δ coverage over 4 quarters`; `existence of a coverage gate in CI`.
- **Yellow flag (warning):** 50–70% branch coverage, or coverage falling > 5 points/quarter in core modules, or gate absent. *(Rationale: below this line refactors get risky; falling coverage means it's getting worse.)*
- **Red flag (critical):** < 50% branch coverage on core services, or zero coverage on a newly shipped critical path, or the coverage gate is absent *and* the trend is down. *(Rationale: the immune system can't catch the damage refactors will cause.)*
- **Example symptom:** "JaCoCo says the billing module sits at 34% branch coverage. The CI 'coverage gate' is a comment-only step that never fails. A refactor last month changed a refund boundary and the bug lived in prod for three weeks."
- **Blast radius:** Refactor safety, regression rate, incident rate, modernization feasibility, compliance evidence.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = > 80% core coverage, gate on; 2 = 50–70% with gate; 1 = < 50% on isolated paths; 0 = core untested or gate absent with falling trend.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add a real coverage gate (fail below threshold) on core modules only, and instrument the trend. Structural fix: invest in testing the highest-churn/highest-risk modules first (correlate with ARCH-05), write tests as part of every bug fix (see coverage climb), make coverage a tracked product metric.
- **Gold standard / target state:** Branch coverage > 80% on core modules; coverage gate enforced in CI; coverage trend visible on a dashboard and rising or stable.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + gh-api (Actions logs/artifacts)
- **Tools:** Actions log fetch (`GET /repos/{o}/{r}/actions/runs` → logs); coverage-artifact patterns (`coverage/lcov.info`, `htmlcov/`, `jacoco.xml`, `coverage.xml`) in tree; coverage-runner config presence (`c8`, `jest --coverage`, `pytest-cov`, `JaCoCo` plugin)
- **Rate-cost:** api-budgeted (latest N runs' log tails only)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files AND zero test config` → unknown, not N/A. Else applicable.

## 6. Detection recipe

- **Detection method:** Coverage runners — `c8`/`istanbul` (JS), `JaCoCo` (Java), `coverage.py`/`pytest-cov` (Python), `dotnet test --collect`, `go test -cover`; view by module, weight by criticality (core domain vs. peripheral). Track the trend over last 4 quarters.

1. Tree probe: committed coverage reports/artifacts (with mtime staleness check).
2. CI probe: workflow steps invoking coverage runners; `--coverage` flags; artifact upload steps for coverage dirs.
3. Log probe: tail latest successful test-run logs for summary lines (`Coverage: NN%`, `TOTAL... NN%`, table parsers).
4. Trend: compare across last K runs where available.

Preconditions: repo public or App token with actions:read (M&A plane).

## 7. Fact schema

```json
{"test01": {
  "committed_report": {"found": false},
  "ci_runner_configured": true,
  "log_observed_pct": {"branch": null, "line": 63.5, "source": "run#1234 log", "observed_at": "2026-08-01"},
  "trend_available": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1                      # lineage of any observed number is unverified
estimated_when: any pct signal observed          # clamp [1,2]; confidence low always (04 §5 caveat mandatory)
unknown_when:   no artifact/config/log signal
na_when:        never
clamp:          [1,2]
confidence:     low by rule; report copy carries "seen in CI artifacts; lineage unverified"
scope_limited:  logs unavailable -> unknown "rate-limited" if API exhausted
```

### Score mapping predicates

Thresholds/criteria: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: `Y_COV <= observed_pct < R_COV`
- `1`: `observed_pct < R_COV` ∨ coverage configured but no observable number anywhere
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Log fetch failure/deletion (90-day retention) → fall through to tree/CI probes; all-miss → unknown

## 10. Evidence and output

### Evidence string

```
basis: "actions-log run#{id}: line {p}% (artifact lineage unverified)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Coverage level/trend; which core paths lack tests is TEST-06 — not this row.

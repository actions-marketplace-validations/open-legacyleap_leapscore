# TEST-04 — Test Run Time

> **Category:** [Testing & Quality Engineering](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | TEST-04 |
| Name | Test Run Time |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | B |
| Default status | measured |
| v1 flag | PART (catalog conventions) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ ≤ 30 min — CI pipeline metrics. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The full test suite takes so long that it throttles delivery — minutes of feedback on every commit, or so long that tests are skipped, split, or gamed.
- **Why it signals obsolescence:** Feedback latency is the core of engineering speed. Long suites push people to skip tests locally, to not run the suite before merge, and to treat CI as the "slow lane." It's both a symptom of test bloat (from the pyramid inversion, dead code, over-heavy E2E) and a cause of quality decay.
- **Where it manifests:** CI pipeline metrics (suite duration trend), `pytest --durations`, Jest timings, "tests take too long" complaints, people committing without running tests, "we split CI and hope" configurations.
- **Objective metric:** `test-stage duration (P50/P95)`; `P95 feedback loop time`; `# of tests in the "slow" tail`; `tests skipped because of time`.
- **Yellow flag (warning):** 10–30 min suite, tests usually run before merge, slow tail known. *(Rationale: warning — still survivable, but the tax is real.)*
- **Red flag (critical):** > 30 min suite, or tests routinely not run locally, or CI times out and tests are dropped to keep deploy green. *(Rationale: at this speed the suite stops being run — it's ceremonial, not protective.)*
- **Example symptom:** "The full suite takes 52 minutes. Engineers run a 20-test subset locally. CI runs everything, so merges queue behind a queue. Someone suggests 'running tests only on release day.' The room goes quiet."
- **Blast radius:** Merge velocity, refactor willingness, CI cost, flake exposure, deploy frequency.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 10 min; 2 = 10–30 min; 1 = > 30 min or split-and-hope; 0 = tests not part of the merge loop.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: parallelize across shards/workers, move slow E2E out of the merge gate (nightly), fix the slowest 10 tests. Structural fix: attack root causes — pyramid rebalance (TEST-03), hermetic fast tests, caching, and a runtime budget with a gate.
- **Gold standard / target state:** Suite < 10 min P95; every engineer runs the suite before merge; a runtime budget enforced in CI.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** gh-api (Actions runs), static-src (workflow parse)
- **Tools:** `GET /repos/{o}/{r}/actions/runs?status=success` → `run_duration_ms` for test-named workflows; workflow YAML job graph (serial/parallel shape)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no test jobs in CI AND zero test files` → N/A (no suite to time). Zero-CI repos → unknown.

## 6. Detection recipe

- **Detection method:** CI analytics — pipeline duration per stage, test-stage duration trend over quarters; per-test timing reports (`--durations=20`, Jest `--verbose`); measure P95 feedback loop (commit → test result).

1. Identify test workflows by name/step matchers (`test`, `pytest`, `jest`, `go test`).
2. Pull last K successful run durations; take median + p95.
3. No CI: static estimate from test-file count × language-typical per-file cost — only as basis text, never a number presented as measured.

Preconditions: public repo or App token.

## 7. Fact schema

```json
{"test04": {
  "workflow": "ci.yml", "runs_sampled": 20,
  "median_min": 14.2, "p95_min": 27.8,
  "source": "actions-durations"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1                      # elapsed CI time ≠ instrumented suite timing
estimated_when: >=5 runs sampled                 # clamp [1,2]; confidence low (04 §5 caveat mandatory)
unknown_when:   <5 runs or no CI
na_when:        applicability fired
clamp:          [1,2]
confidence:     low by rule ("not full CI history" caveat)
```

### Score mapping predicates

Y/R values (10–30 / >30 min): see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: `Y_MIN <= p95 < R_MIN`
- `1`: `p95 >= R_MIN` ∨ tests serially blocking every deploy (job-graph check)
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limited → fewer samples; <5 → unknown "rate-limited"

## 10. Evidence and output

### Evidence string

```
basis: "actions-durations n={k}: median {m}m, p95 {p}m (elapsed-time signal)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Suite duration trend; build/install duration is VEL-01 — stage attribution separates them.

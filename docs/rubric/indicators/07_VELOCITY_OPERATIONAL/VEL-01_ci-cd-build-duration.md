# VEL-01 — CI/CD Build Duration

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for VEL-01. Edit this file; the legacy path [vel-01_ci-cd-build-duration.md](../../../specs/07_VELOCITY_OPERATIONAL/vel-01_ci-cd-build-duration.md) is a compatibility alias.
> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/07_VELOCITY_OPERATIONAL/VEL-01_ci-cd-build-duration.md`

## 1. Identity

| field | value |
|---|---|
| ID | VEL-01 |
| Name | CI/CD Build Duration |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART (catalog conventions) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ ≤ 30 min — CI analytics read. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The time from push to mergeable feedback — build, lint, tests, quality gates — in CI is measured in many minutes to hours, occasionally times out, and has been drifting upward for quarters.
- **Why it signals obsolescence:** CI feedback latency is *the* throttle on delivery: the longer it is, the less often it runs, the more it's skipped, and the more merge queues and context-switching cost. DORA research is unambiguous — throughput tracks feedback speed. A growing build time is also a proxy for test bloat and unowned pipelines.
- **Where it manifests:** CI analytics (pipeline duration trend), "Merge queue is full" symptoms, engineers running subsets locally ("I won't trigger the full build"), build timeouts, weekend batch CI runs.
- **Objective metric:** `P95 feedback-loop time`; `median full-pipeline duration`; `Δ over 4 quarters`; `# of timeouts/month`; `% of pipeline serial time`.
- **Yellow flag (warning):** 15–30 min feedback loop; growing; partial parallelization. *(Rationale: warning — above modern norms, still survivable, tax is compound.)*
- **Red flag (critical):** > 30 min loop or regular timeouts, or tests so slow they're split/dropped (connects TEST-04), or the trend is steeply up. *(Rationale: the loop has broken — CI is no longer a feedback tool, it's a queuing tax.)*
- **Example symptom:** "The full build takes 41 minutes: 12 of serial test time, 6 for install of 1,400 packages no one pruned, a coffee-break job that 'should've been cached.' The team merges 3 PRs a day because queuing eats everyone."
- **Blast radius:** Merge throughput, deploy frequency, context-switching cost, CI spend, engineer patience (leads to skipping).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 10 min; 2 = 15–30 min; 1 = > 30 min or split/hope; 0 = loop so slow it's routinely skipped.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: turn on caching, parallelize shards, drop the slow E2E from the merge path (TEST-04), float the slowest 10 tests once. Structural fix: a CI budget (SLO on feedback time), dependency pruning (ECOS-06), test-suite redesign (TEST-03), and monitoring of pipeline trend.
- **Gold standard / target state:** P95 feedback < 10 min; trend flat/declining; no timeouts; every engineer runs the pipeline before merge by habit.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** gh-api (Actions runs), static-src (workflow parse)
- **Tools:** `GET /repos/{o}/{r}/actions/runs` → `run_duration_ms`; stage attribution from job names (install/build/test split where jobs separate); GitLab/Jenkins equivalents when configs indicate them (public data only for GH-hosted CI in v1)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero CI workflows` → N/A? No — zero CI is scored 0 territory of TEST-08/VEL rows generally; here N/A is admissible only if repo has no build at all (docs-only). Otherwise unknown.

## 6. Detection recipe

- **Detection method:** Pipeline analytics — GitHub Actions/GitLab/Jenkins duration stats per stage, P95 push-to-feedback, trend over 6–12 months; breakdown by stage (install/build/test/quality); check what's serial vs. parallel.

1. Identify build/push-triggered workflows; pull last K successful runs' durations.
2. Median + p95 push-to-green; stage split when multi-job.
3. Serial-stage smell detection from workflow graph.

Preconditions: public Actions or App token.

## 7. Fact schema

```json
{"vel01": {
  "workflow": "ci.yml", "runs_sampled": 25,
  "median_min": 11.4, "p95_min": 26.0,
  "stage_split_known": true,
  "serial_bottleneck_job": "e2e"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1                      # elapsed wall-time ≠ instrumented stage timing
estimated_when: >=5 runs sampled                 # clamp [1,2]; confidence low ("elapsed signal" caveat mandatory)
unknown_when:   <5 runs / no CI
na_when:        no-build tree
clamp:          [1,2]
confidence:     low by rule
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: `p95 < R_MIN`
- `1`: `p95 >= R_MIN` ∨ serial-bottleneck job dominating median
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limit → fewer samples; <5 → unknown "rate-limited"

## 10. Evidence and output

### Evidence string

```
basis: "actions n={k}: push-to-green median {m}m, p95 {p}m (elapsed signal)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

End-to-end build latency; test-suite duration specifically is TEST-04 (stage attribution separates).

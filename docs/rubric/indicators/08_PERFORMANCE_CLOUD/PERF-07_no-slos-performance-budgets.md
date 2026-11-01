# PERF-07 — No SLOs / Performance Budgets

> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | PERF-07 |
| Name | No SLOs / Performance Budgets |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | C |
| Default status | unknown |
| v1 flag | PART (candidate) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 ~2–4 h — SLO inventory + baseline availability. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system has no service-level objectives, no latency/availability budgets, no performance regression gates, and no load-testing baseline — "fast enough" means "nobody complained loudly today."
- **Why it signals obsolescence:** SLOs are how performance stops being a mood. Their absence means performance debt is invisible until users revolt, and every "is it OK now?" is a vibes check. Modern practice (latency budgets, error budgets, load-test baselines, perf regression gates in CI) turns performance into a verifiable property. A system without budgets can't even *see* that it's obsolete.
- **Where it manifests:** No latency targets, no error-budget tracking, p95 unknown, "it got slower" with no baseline, no load test in CI, perf regressions discovered by user complaints, "SPOF acceptable" undocumented.
- **Objective metric:** `services with documented+measured SLOs %`; `error-budget burn alerting?`; `perf gate in CI (load/synthetic)?`; `latency baseline exists + tracked`; `perf-regression incidents found by users (last 12 mo)`.
- **Yellow flag (warning):** Informal latency targets for some services, no error budgets or CI gate, no perf baseline. *(Rationale: warning — performance is a feeling, not a number yet.)*
- **Red flag (critical):** No SLOs or budgets anywhere, no perf gate or baseline, and perf regressions reach users undetected. *(Rationale: performance decay is structurally invisible — the system quietly gets worse and nobody can say no.)*
- **Example symptom:** "CTO: 'the app feels slow lately.' Nobody can quote a number — p95 was never captured. A feature shipped that added 400ms on the hot path; no baseline-run caught it. 'Feels slow' is the only fault-reporting mechanism."
- **Blast radius:** User experience decay, growth (perf is a growth lever), cost (perf bugs manifest as infra spend), incident severity, trust.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = SLOs everywhere + gates; 2 = some services measured; 1 = informal targets; 0 = no numbers at all, drift by feeling.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: define SLOs for the top 3 services (latency p95 + availability), measure them with the metrics you added (PERF-01), add a synthetic check for the money path. Structural fix: error budgets + burn alerts, a CI perf gate (load-test baseline run on PRs), latency regression reports in the deploy loop, SLO review as a ritual.
- **Gold standard / target state:** Every service has an SLO, measured and burned-alerted; CI catches perf regressions; latency baselines are historical and trusted.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** SLO-artifact matchers: `slo/`/`slo.yaml`-class files, error-budget policy configs, burn-rate alert rules in IaC (`prometheus` rules with `slo:` labels), load-test harnesses wired to CI gates (`k6`, `locust` CI steps failing on threshold), synthetic-check configs; baseline-latency docs
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored services; library-only repos → clause-b N/A.

## 6. Detection recipe

- **Detection method:** SLO inventory — documented latency/availability SLOs per service? Are they *measured* (dashboards alert on budget burn)? Is there a perf regression gate in CI (load test on every PR? synthetic checks)? Baseline latency chart available? Error budgets defined and traded?

1. Inventory SLO declarations and their measurement wiring (dashboard/alert-as-code referencing the SLO).
2. Perf-regression gate detection: CI steps running load/synthetic suites with fail-on-threshold.
3. Measured-SLO proof (burn alerts actually firing on real traffic) is runtime plane → emission text.

Preconditions: service surface present.

## 7. Fact schema

```json
{"perf07": {
  "slo_files": ["slo/api.yaml"],
  "burn_rate_alerts": false,
  "ci_perf_gate": {"present": true, "tool": "k6", "blocking": false},
  "synthetic_checks": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # declared ≠ measured/budgeted in practice
estimated_when: >=2 of {slo-files, alerts, ci-gate} probes computed   # clamp [1,2]
unknown_when:   no service surface
na_when:        applicability fired (no runnable service)
clamp:          [1,2]
confidence:     medium when artifacts + wiring both seen
scope_limited:  none typical
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: SLOs declared ∧ at least one enforcement wire (alert or CI gate)
- `1`: no SLO artifacts ∨ declared-but-unwired only
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "slo-scan: files={list}; burn-alerts={bool}; ci-gate={tool}(blocking={b}) [declared≠measured]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

SLO/budget posture; observability plumbing is PERF-01, runtime latency truth PERF-08.

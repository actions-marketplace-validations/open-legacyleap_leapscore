# PERF-07 — No SLOs / Performance Budgets — Implementation Spec

> **Authority:** This file defines the PERF-07 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (presence proxies; tier arbitrated; encyc said C·unknown) |
| v1 flag | PART (candidate) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 human · engine: SLO-artifact scan |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-07 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** SLO-artifact matchers: `slo/`/`slo.yaml`-class files, error-budget policy configs, burn-rate alert rules in IaC (`prometheus` rules with `slo:` labels), load-test harnesses wired to CI gates (`k6`, `locust` CI steps failing on threshold), synthetic-check configs; baseline-latency docs
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored services; library-only repos → clause-b N/A.

## 2. Detection recipe

1. Inventory SLO declarations and their measurement wiring (dashboard/alert-as-code referencing the SLO).
2. Perf-regression gate detection: CI steps running load/synthetic suites with fail-on-threshold.
3. Measured-SLO proof (burn alerts actually firing on real traffic) is runtime plane → emission text.

Preconditions: service surface present.

## 3. Fact schema

```json
{"perf07": {
  "slo_files": ["slo/api.yaml"],
  "burn_rate_alerts": false,
  "ci_perf_gate": {"present": true, "tool": "k6", "blocking": false},
  "synthetic_checks": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # declared ≠ measured/budgeted in practice
estimated_when: >=2 of {slo-files, alerts, ci-gate} probes computed   # clamp [1,2]
unknown_when:   no service surface
na_when:        applicability fired (no runnable service)
clamp:          [1,2]
confidence:     medium when artifacts + wiring both seen
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §PERF-07. Estimated ⇒ score ∈ {1,2}:

- `2`: SLOs declared ∧ at least one enforcement wire (alert or CI gate)
- `1`: no SLO artifacts ∨ declared-but-unwired only
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "slo-scan: files={list}; burn-alerts={bool}; ci-gate={tool}(blocking={b}) [declared≠measured]"
```

## 9. Scope/overlaps echo

SLO/budget posture; observability plumbing is PERF-01, runtime latency truth PERF-08.

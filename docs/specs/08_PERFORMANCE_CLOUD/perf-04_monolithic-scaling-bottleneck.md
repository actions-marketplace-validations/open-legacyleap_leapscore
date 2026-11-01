# PERF-04 — Monolithic Scaling Bottleneck — Implementation Spec

> **Authority:** This file defines the PERF-04 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (encyc said B·estimated — per-add throughput needs load tests) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔷 human (load experiment) |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-04 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Scale-curve data from k6/Locust runs; DB analysis — runtime plane.

## 2. Detection recipe (v2/deep-scan sketch)

1. Load test with increasing instance count; measure marginal throughput.
2. Horizontal-readiness static facts (stateless session config, externalized state) are recorded as context — they inform, not score.

**v1 behavior:** `unknown` + emission text.

## 3. Fact schema (v1)

```json
{"perf04": {"status": "unknown",
             "reason": "scaling ceiling provable only under load",
             "context": {"externalized_sessions": true}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # readiness hints ≠ scaling truth either way
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs incremental-instance load test (deep scan); readiness hints as context"
```

## 9. Scope/overlaps echo

Scale-curve behavior; deployment model is PERF-02, autoscaling config PERF-05.

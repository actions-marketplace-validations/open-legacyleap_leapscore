# PERF-04 — Monolithic Scaling Bottleneck — Implementation Spec

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

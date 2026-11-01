# PERF-08 — Runtime Waste & Startup Latency — Implementation Spec

> **Authority:** This file defines the PERF-08 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (encyc said B·measured — startup profiling is runtime) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 human (instrumented startup) |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-08 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Process-start→first-request timing, idle RSS, profiler breakdowns — runtime plane.

## 2. Detection recipe (v2/deep-scan sketch)

1. Timed cold/warm starts in container.
2. Startup profiler breakdown; image-size audit (buildable facts, but only meaningful with the timing).

**v1 behavior:** `unknown`. Static context only: eager-import density, greedy init patterns recorded as hints, never scored.

## 3. Fact schema (v1)

```json
{"perf08": {"status": "unknown",
             "reason": "startup cost requires instrumented runs",
             "static_hints": {"eager_init_sites": 9}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never
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
emission: "unknown — needs timed container start + profiler breakdown (deep scan)"
```

## 9. Scope/overlaps echo

Startup/runtime waste; deployment packaging is PERF-02's row.

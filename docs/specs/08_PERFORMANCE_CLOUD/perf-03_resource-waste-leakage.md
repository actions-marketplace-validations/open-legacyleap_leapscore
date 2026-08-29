# PERF-03 — Resource Waste / Leakage — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔷 human (profiling over time) |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-03 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Heap growth curves, connection-leak telemetry, GC logs — runtime plane only.

## 2. Detection recipe (v2/deep-scan sketch)

1. Profile under sustained load; snapshot pre/post intervals.
2. Memory-growth linearity analysis; unclosed-resource audit via runtime tracing.

**v1 behavior:** `unknown`. Static hints (missing `close`/`finally` around acquired connections, unbounded caches) recorded as emission context, never scored.

## 3. Fact schema (v1)

```json
{"perf03": {"status": "unknown",
             "reason": "leakage provable only under runtime profiling",
             "static_hints": {"unbounded_cache_sites": 2}}}
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
emission: "unknown — needs load-sustained profiling + heap/connection snapshots (deep scan)"
```

## 9. Scope/overlaps echo

Runtime resource behavior; ORM query waste is DATA-07's row.

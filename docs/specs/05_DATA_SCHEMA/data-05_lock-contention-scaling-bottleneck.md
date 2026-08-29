# DATA-05 — Lock Contention & Scaling Bottleneck — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔷 human (live profiling/load test) |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-05 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Live DB telemetry (`pg_stat_activity`, slow-query logs, lock-wait graphs), load tests — runtime plane only.

## 2. Detection recipe (v2/deep-scan sketch)

1. Peak-window `pg_stat_activity` histogram; lock-wait sampling.
2. `EXPLAIN` on p95 queries from slow-log.
3. Load-test per-add throughput curve.

**v1 behavior:** static hints (`SELECT ... FOR UPDATE` density, missing-index-shaped queries) are recorded as emission context, never scored — query-plan truth requires the engine.

## 3. Fact schema (v1)

```json
{"data05": {"status": "unknown",
             "reason": "contention provable only under live load",
             "static_hints": {"for_update_sites": 7}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # plan/lock behavior cannot be inferred from text reliably either way
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
emission: "unknown — needs peak-window profiling + EXPLAIN on p95 queries (deep scan)"
```

## 9. Scope/overlaps echo

Runtime DB contention; ORM patterns that *invite* it are DATA-07's row.

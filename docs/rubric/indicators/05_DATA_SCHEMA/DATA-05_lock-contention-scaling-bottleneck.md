# DATA-05 — Lock Contention & Scaling Bottleneck

> **Category:** [Data & Schema Evolution](../../05_DATA_SCHEMA.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | DATA-05 |
| Name | Lock Contention & Scaling Bottleneck |
| Category | DATA — Data & Schema Evolution |
| Engine tier | B |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔷 ~1–2 days — profiling + load test. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The database cannot scale with load because of lock contention — hot rows, table-level locks, un-indexed joins, full-table scans under traffic, or a single-instance design that caps throughput. "Vertical scaling required for traffic spikes."
- **Why it signals obsolescence:** Scalability is where the data layer reveals its design era. Tables designed before concurrency, engines with table locks (MyISAM), innefficient indexes, and single-writer assumptions all cap the system at current traffic — and die on spikes. It's also the hidden cost: you buy vertical upgrades instead of fixing the schema.
- **Where it manifests:** `LOCK WAIT` entries in DB logs, slow-query logs with full-table scans at p95, hot-row contention (a single row updated by every request, e.g., a global counter), table-level locks from old engines, index-less foreign keys, "we upgraded the instance twice this year."
- **Objective metric:** `max lock-wait time / wait count at peak`; `p95 query duration`; `# of full-table scans at peak`; `seq-scan-ratio`; `concurrency ceiling (from load test)`; `# of hot-row contention events`.
- **Yellow flag (warning):** Occasional lock waits and a few full-table scans; vertical scaling used for the last spike. *(Rationale: warning — the ceiling exists and was brushed up against.)*
- **Red flag (critical):** Hot-row or table-level lock contention under *standard* load, or the only scaling lever is a bigger instance, or lock waits cause user-visible stalls. *(Rationale: the design caps throughput — the next spike is a downtime.)*
- **Example symptom:** "Black Friday starts and the order flow stalls. `pg_stat_activity` shows 300 connections in `LOCK WAIT` on one row: the 'order sequence' counter. Last year's fix was a 2× instance. Nobody has touched the table since 2015."
- **Blast radius:** Peak-time downtime, cost (vertical scaling), degraded UX under load, expansion failure, DBA on-call.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no contention at 3× peak; 2 = occasional waits, mitigated; 1 = contention under spikes; 0 = blocked from scaling, vertical-only.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: index the exploitable gaps that full-table scans reveal, split the hot row (counter → per-shard), add read replicas for read-heavy load. Structural fix: bounded-context data design (DATA-02), remove the contention points (sequence/counter patterns rewritten), tuned isolation levels where safe, load tests with concurrency in CI, capacity per feature, not per "make it bigger."
- **Gold standard / target state:** Lock waits near zero at peak, index strategy documented and maintained, scaling via standard horizontal levers, load tests show headroom > 3×.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Live DB telemetry (`pg_stat_activity`, slow-query logs, lock-wait graphs), load tests — runtime plane only.

## 6. Detection recipe

- **Detection method:** Profiling/data — `SHOW PROCESSLIST`/`pg_stat_activity` histogram during peak, slow-query log analysis (`pt-digest`), `EXPLAIN` on p95 queries (seq scans, missing index scans), lock-wait graphs (Percona, Datadog DB), load testing with concurrency ramp (k6/pgbench) to find the throughput ceiling.

1. Peak-window `pg_stat_activity` histogram; lock-wait sampling.
2. `EXPLAIN` on p95 queries from slow-log.
3. Load-test per-add throughput curve.

**v1 behavior:** static hints (`SELECT ... FOR UPDATE` density, missing-index-shaped queries) are recorded as emission context, never scored — query-plan truth requires the engine.

## 7. Fact schema

```json
{"data05": {"status": "unknown",
             "reason": "contention provable only under live load",
             "static_hints": {"for_update_sites": 7}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # plan/lock behavior cannot be inferred from text reliably either way
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs peak-window profiling + EXPLAIN on p95 queries (deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Runtime DB contention; ORM patterns that *invite* it are DATA-07's row.

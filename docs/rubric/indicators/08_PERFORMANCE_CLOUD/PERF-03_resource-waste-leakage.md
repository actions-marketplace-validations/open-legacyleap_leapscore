# PERF-03 — Resource Waste / Leakage

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for PERF-03. Edit this file; the legacy path [perf-03_resource-waste-leakage.md](../../../specs/08_PERFORMANCE_CLOUD/perf-03_resource-waste-leakage.md) is a compatibility alias.
> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/08_PERFORMANCE_CLOUD/PERF-03_resource-waste-leakage.md`

## 1. Identity

| field | value |
|---|---|
| ID | PERF-03 |
| Name | Resource Waste / Leakage |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔷 ~1–2 days — profiling + memory monitoring. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system leaks or wastes resources as routine — memory leaks that force scheduled restarts, unbounded caches, connection/thread sprawl, oversized instances, or processes that degrade until reboot.
- **Why it signals obsolescence:** Leaks are the runtime's passive decay: the system gets worse the longer it runs, and the fix ("restart it weekly") is a maintenance ritual, not an engineering answer. Bounded caches and clean resource handling are baseline expectations; their absence points to code that predates memory hygiene and to infrastructure tuned by folklore.
- **Where it manifests:** Scheduled restarts to "clear memory," unbounded in-memory caches/`HashMap` growth, connection-pool leaks, goroutine/thread sprawl, restarts-of-record in the on-call runbook, "memory looks weird" tickets, oversized instances rented so a leak fits.
- **Objective metric:** `mean time-to-OOM (if restart-driven)`; `heap growth slope per hour`; `% of restarts attributed to memory`; `unbounded-cache count`; `instance utilization % (waste)`.
- **Yellow flag (warning):** Scheduled off-peak restarts to manage memory, some unbounded caches, moderate waste. *(Rationale: warning — the manifest ritual is in place; the leak is real but managed.)*
- **Red flag (critical):** Process crashes under *standard* load due to memory leaks, or leaks that no one knows are leaks (restart-on-cron as tradition). *(Rationale: availability is being bought with restarts — the runtime is decaying in plain sight.)*
- **Example symptom:** "The rule is 'restart the order worker at 2am Tuesday.' The team can't remember why; the log shows OOM kills weekly. A `pprof` snapshot shows a cache keyed by customer session that never expires — 40 GB of yesterday's sessions."
- **Blast radius:** Availability (OOM crashes), cost (oversized instances), on-call rituals, latency degradation with uptime, data integrity (crashed mid-write).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no leak, high utilization; 2 = restart ritual in place; 1 = leaks under spikes; 0 = regular crashes at standard load.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: profile to find the leak(s), bound the caches (TTL + size limit), fix the top 3 resource leaks, enable heap diagnostics. Structural fix: memory discipline as a code review concern, load tests that run > 24h to expose slow leaks, resource limits + monitoring (RSS trend), right-size instances to reality.
- **Gold standard / target state:** No restart ritual; heap flat over weeks; caches bounded and sized deliberately; utilization reviewed; no OOM under 3–5× load.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Heap growth curves, connection-leak telemetry, GC logs — runtime plane only.

## 6. Detection recipe

- **Detection method:** Profiling — py-spy/`pprof`/JVM heap + GC logs/`dotnet` diagnostics over time (grab snapshots pre/post "fixing restartus"), memory-graph growth analysis (heap grows linearly until OOM?), cache-size inspection, connection pool metrics, restart logs correlated with memory; cloud cost analysis for instance oversizing.

1. Profile under sustained load; snapshot pre/post intervals.
2. Memory-growth linearity analysis; unclosed-resource audit via runtime tracing.

**v1 behavior:** `unknown`. Static hints (missing `close`/`finally` around acquired connections, unbounded caches) recorded as emission context, never scored.

## 7. Fact schema

```json
{"perf03": {"status": "unknown",
             "reason": "leakage provable only under runtime profiling",
             "static_hints": {"unbounded_cache_sites": 2}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never
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
emission: "unknown — needs load-sustained profiling + heap/connection snapshots (deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Runtime resource behavior; ORM query waste is DATA-07's row.

# PERF-08 — Runtime Waste & Startup Latency

> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | PERF-08 |
| Name | Runtime Waste & Startup Latency |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | measured |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 ~2–4 h — startup profiling. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The runtime itself is heavy — minutes-long cold starts, huge memory footprints at idle, no lazy initialization, heavy boot-time work in every process, or a runtime chosen for era reasons that makes every action expensive.
- **Why it signals obsolescence:** Startup latency/footprint is a direct cost of era-technical choices: it kills autoscaling value (cold adds take too long), wastes money at idle, and makes interactive tooling sluggish. It's a *micro*symptom that compounds into *macro*costs, and it's typical of "framework-everything" legacy builds.
- **Where it manifests:** Cold start > 60s–minutes, idle footprint > 1+ GB per worker, everything initialized at boot (JIT-heavy, DI everything, loading 400 classes), no lazy loading, containers that take too long to be useful, "the app takes forever to restart" on deploy.
- **Objective metric:** `cold-start time P50/P95`; `idle RSS per process`; `startup-time breakdown (top items)`; `image/size and fixed init work`; `time-to-scale (adding an instance from cold)`.
- **Yellow flag (warning):** Cold start 30–60s, idle footprint notable, lazy init partial. *(Rationale: warning — model cost, tolerable at low scale.)*
- **Red flag (critical):** Minutes-long cold starts (kills autoscaling), or huge idle footprints (bankrupt-on-scale players), or restart is so slow deploys are painful. *(Rationale: the runtime tax is bigger than the code it carries.)*
- **Example symptom:** "Every new instance takes 3 minutes to become useful; scaling for a burst is pointless — by 3 minutes the burst is over. Idle JRockit-era app sits at 2.1 GB doing nothing. Autoscaling was 'tried' and abandoned."
- **Blast radius:** Autoscaling viability, idle cost, deploy pain, image size, dev inner loop (VEL-11), marginal perf of every cold action.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = lean startup; 2 = moderate (30–60s); 1 = minutes + heavy idle; 0 = minute-scale cold starts blocking scaling.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: lazy-init the greedy startup work, trim the boot-time DI/registrations, enable JVM/cache warmup layers. Structural fix: runtime modernization (container-native runtimes, startup budget with a gate, deferred-cost architecture), image size budgets, "cold start < 10s" as an autoscaling prerequisite.
- **Gold standard / target state:** Cold start < 10–15s, idle footprint proportional to need, autoscaling actually scales because instances become useful fast, zero "startup work" that could be lazy.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Process-start→first-request timing, idle RSS, profiler breakdowns — runtime plane.

## 6. Detection recipe

- **Detection method:** Startup profiling — time from process start to first request served (with and without warm cache), memory snapshot at idle (RSS), profiler breakdown of startup time (what initialized? greedy scans? JIT?), container/image size and init work, comparison vs. a lean baseline.

1. Timed cold/warm starts in container.
2. Startup profiler breakdown; image-size audit (buildable facts, but only meaningful with the timing).

**v1 behavior:** `unknown`. Static context only: eager-import density, greedy init patterns recorded as hints, never scored.

## 7. Fact schema

```json
{"perf08": {"status": "unknown",
             "reason": "startup cost requires instrumented runs",
             "static_hints": {"eager_init_sites": 9}}}
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
emission: "unknown — needs timed container start + profiler breakdown (deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Startup/runtime waste; deployment packaging is PERF-02's row.

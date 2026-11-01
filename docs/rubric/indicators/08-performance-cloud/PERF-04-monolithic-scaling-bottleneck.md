# PERF-04 — Monolithic Scaling Bottleneck

> **Category:** [Performance & Cloud/Infrastructure Fit](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | PERF-04 |
| Name | Monolithic Scaling Bottleneck |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | estimated |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔷 ~1–2 days — load-test scale experiment. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system can only scale vertically — the DB or the app can't split, shard, or go horizontal, so traffic growth means bigger instances and eventually a wall, with lock/content/state preventing distribution.
- **Why it signals obsolescence:** A single point that must get bigger is an architectural ceiling: it caps growth at the size of one machine and makes spikes a purchasing problem. Modern scale is *distribution* (horizontal + sharding + decompositions); the inability to distribute is the design signature of a pre-scale era — and of a system that has spent its "scale budget" (DATA-05 is the DB half).
- **Where it manifests:** "We scaled to 64 vCPU, 256 GB," vertical-only guidance, state in-memory that can't be shared, a DB lock/statelessness wall, sharding "impossible because of joins," a single writer bottleneck, load tests that hit a wall at N instances.
- **Objective metric:** `throughput gain per additional instance (horizontal efficiency %)`; `max horizontal scale factor`; `DB dependents (single-writer env: read replicas/sharding possible?)`; `instance count ceiling`.
- **Yellow flag (warning):** Horizontal scaling partially works (e.g., Iapplication scales, DB replica path limited, spikes absorbed vertically). *(Rationale: warning — a wall exists ahead, not yet hit.)*
- **Red flag (critical):** Only way to grow is a bigger instance; adding instances adds nothing (stateful app or DB bottleneck); or the largest available instance is approaching. *(Rationale: a hard ceiling on growth — the next spike is a purchase or a collapse.)*
- **Example symptom:** "Black Friday prep: load test says the app tops out at 2 instances — a shared session cache and one DB writer flatten everything after that. The 'solution' is to rent a 128 vCPU box for the week. The budget line is real."
- **Blast radius:** Growth ceiling, spike discounts/capacity purchases, cost, availability under load, feature velocity (every scale fix is architectural).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = horizontally efficient; 2 = partially horizontal, vertical safety valve; 1 = wall visible, vertical-only for spikes; 0 = instance-size ceiling, growth ≈ new hardware.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: statelessness fixes (move session/key state to a distributed store), add read replicas + a cache tier to lift the DB ceiling, shard the hottest table. Structural fix: the scalability roadmap — decompose the hot path (bounded contexts, API/events per DATA-02), sharding strategy, and a horizontal-efficiency load-test gate (new instance must add value).
- **Gold standard / target state:** Adding instances scales throughput linearly past the previous wall; vertical spending is an exception not a norm; load tests prove horizontal efficiency.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Scale-curve data from k6/Locust runs; DB analysis — runtime plane.

## 6. Detection recipe

- **Detection method:** Scale experiment — load test with increasing instance count (k6/Locust/artillery) and measure per-add throughput; check for horizontal levers (stateless app? read replicas? sharding? caching?). DB analysis (DATA-05), in-memory session/state audit (what would need to change to run 2 instances?), auto-scale feasibility.

1. Load test with increasing instance count; measure marginal throughput.
2. Horizontal-readiness static facts (stateless session config, externalized state) are recorded as context — they inform, not score.

**v1 behavior:** `unknown` + emission text.

## 7. Fact schema

```json
{"perf04": {"status": "unknown",
             "reason": "scaling ceiling provable only under load",
             "context": {"externalized_sessions": true}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # readiness hints ≠ scaling truth either way
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
emission: "unknown — needs incremental-instance load test (deep scan); readiness hints as context"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Scale-curve behavior; deployment model is PERF-02, autoscaling config PERF-05.

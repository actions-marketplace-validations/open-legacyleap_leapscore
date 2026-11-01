# PERF-01 — Observability Gaps

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for PERF-01. Edit this file; the legacy path [perf-01_observability-gaps.md](../../../specs/08_PERFORMANCE_CLOUD/perf-01_observability-gaps.md) is a compatibility alias.
> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/08_PERFORMANCE_CLOUD/PERF-01_observability-gaps.md`

## 1. Identity

| field | value |
|---|---|
| ID | PERF-01 |
| Name | Observability Gaps |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 ~2–4 h — instrumentation audit + timed diagnosis. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system cannot answer basic questions about its own runtime — no structured metrics (RED/USE), no distributed tracing (or tracing only in the new corner), no meaningful logging conventions, and debugging is done by SSH-ing and tailing raw output.
- **Why it signals obsolescence:** Observability is the feedback loop of operations — "what is the system doing right now?" A system without it is run by flashlight. Modern practice (OpenTelemetry, metrics, logs, traces + SLOs) is a baseline; its absence forces archaeology on every incident and every performance question, and it silently blocks most modernization (you can't improve what you can't measure).
- **Where it manifests:** No metrics endpoint/agent, `print`/`console.log` as the observability layer, no correlation between request and logs, no distributed tracing across services, debugging prod by `ssh` + `tail -f`, "why is it slow" answered by screenshots.
- **Objective metric:** `metrics/logs/traces coverage % (service × [m,l,t])`; `log correlation coverage %`; `time-to-answer a latency question`; `OpenTelemetry adoption %`.
- **Yellow flag (warning):** Logs exist but unstructured/poorly correlated; metrics partial; tracing missing across microservices. *(Rationale: warning — you can see something, not everything.)*
- **Red flag (critical):** No structured metrics at all; debugging prod requires SSH + raw log tailing; latency/errors invisible to any dashboard. *(Rationale: you are operating blind — every incident is archaeology and every perf fix is a guess.)*
- **Example symptom:** "The paging service is 'slow today.' No dashboard shows it. An engineer SSH's in, `tail`s a log file written with `console.log`, greps a timestamp, and 'maybe' finds the answer 40 minutes later. Rinse, repeat, weekly."
- **Blast radius:** Incident MTTR, performance diagnosis, capacity planning, SLOs (impossible without metrics), modernization decision data, security visibility.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = OTel-standard full coverage; 2 = partial; 1 = logs-only, no metrics/tracing; 0 = blind operational flashlight.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add structured logging + request IDs everywhere (framework middleware), stand up a metrics endpoint with RED/U; USE basics, emit the top 6 metrics. Structural fix: OpenTelemetry adoption (auto-instrumentation), tracing across services, an SLO + error-budget loop, observability as a deployment requirement (no deploy without instrumentation).
- **Gold standard / target state:** Every service emits metrics/logs/traces standardly, requests are correlated end-to-end, dashboards answer latency/errors/capacity in seconds, and "why is it slow" never requires SSH.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** instrumentation matchers: OTel/StatsD/Prometheus deps + SDK init code, structured-logging config (`structlog`, `pino`, `logrus` JSON mode), request-ID middleware (API-07 reuse), tracing propagation headers, health/metrics endpoints in route tables, dashboard-as-code (`grafana/` dirs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no runnable service surface` (library-only repo, clause-b).; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Instrumentation audit — is the app emitting metrics/logs/traces via a standard (OpenTelemetry/SLf4j/Prometheus)? Are logs structured (JSON), correlated (request IDs)? Is tracing present across service boundaries? Time a "why is this slow" question end-to-end and count how long it takes to answer with current tooling.

1. Inventory metric/log/trace emission surfaces from deps + init sites.
2. Structured-log config check; correlation-ID wiring.
3. Cross-service trace coverage is runtime plane → emission text ("what it takes": instrumented canary + trace join).

Preconditions: service surface detected.

## 7. Fact schema

```json
{"perf01": {
  "metrics": {"sdk": "prometheus-client", "endpoint": true},
  "structured_logging": true,
  "request_correlation": true,
  "tracing": {"otel": false},
  "dashboards_as_code": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # coverage/correlation quality is runtime truth
estimated_when: >=2 of {metrics, logs, correlation} probes computed   # clamp [1,2]
unknown_when:   no service surface parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when three-pillar probes all ran
scope_limited:  sampled modules -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: metrics ∧ structured logs present; tracing absent
- `1`: unstructured logging ∨ single-pillar coverage on a multi-service core
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "observability-inventory: metrics={sdk}; logs-structured={bool}; correlation={bool}; otel={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Instrumentation posture; audit-trail adequacy is SEC-05, error contracts API-07.

# PERF-01 — Observability Gaps — Implementation Spec

> **Authority:** This file defines the PERF-01 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B·measured / matrix C·estimated) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 human · engine: instrumentation inventory |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-01 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** instrumentation matchers: OTel/StatsD/Prometheus deps + SDK init code, structured-logging config (`structlog`, `pino`, `logrus` JSON mode), request-ID middleware (API-07 reuse), tracing propagation headers, health/metrics endpoints in route tables, dashboard-as-code (`grafana/` dirs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no runnable service surface` (library-only repo, clause-b).; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Inventory metric/log/trace emission surfaces from deps + init sites.
2. Structured-log config check; correlation-ID wiring.
3. Cross-service trace coverage is runtime plane → emission text ("what it takes": instrumented canary + trace join).

Preconditions: service surface detected.

## 3. Fact schema

```json
{"perf01": {
  "metrics": {"sdk": "prometheus-client", "endpoint": true},
  "structured_logging": true,
  "request_correlation": true,
  "tracing": {"otel": false},
  "dashboards_as_code": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # coverage/correlation quality is runtime truth
estimated_when: >=2 of {metrics, logs, correlation} probes computed   # clamp [1,2]
unknown_when:   no service surface parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when three-pillar probes all ran
scope_limited:  sampled modules -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §PERF-01. Estimated ⇒ score ∈ {1,2}:

- `2`: metrics ∧ structured logs present; tracing absent
- `1`: unstructured logging ∨ single-pillar coverage on a multi-service core
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "observability-inventory: metrics={sdk}; logs-structured={bool}; correlation={bool}; otel={bool}"
```

## 9. Scope/overlaps echo

Instrumentation posture; audit-trail adequacy is SEC-05, error contracts API-07.

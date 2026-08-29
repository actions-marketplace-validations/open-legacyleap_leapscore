# API-07 — Error Handling & API Observability Semantics — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured — per-endpoint semantics need runtime) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 human · engine: error-contract sweep |
| Thresholds & 0–3 criteria | see encyclopedia §API-07 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** shared-error-schema detection (RFC7807 `problem+json`, error DTO classes, centralized exception handlers); request-ID/correlation middleware presence; status-code usage audit (static sample: bare 500s, 200-with-error-body patterns); error-tracking SDK presence (`sentry`, `bugsnag` deps — cross-ref PERF-01 instrumentation facts recomputed inline)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** API-01 clause-b. Else applicable.

## 2. Detection recipe

1. Detect central error-mapping layer vs ad-hoc catch sites (ARCH-12 fact reuse).
2. Correlation middleware inventory.
3. Static status-code sample: handlers returning success wrappers around failures, generic 500 rethrows.
4. Live response sampling is runtime plane → emission text.

Preconditions: handler parse.

## 3. Fact schema

```json
{"api07": {
  "error_contract": {"rfc7807": false, "central_handler": true, "schema_file": "errors.py"},
  "request_id_middleware": true,
  "static_smells": {"catch_all_500": 12, "success_wrapped_errors": 3},
  "tracker_sdk": "sentry"}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # semantic correctness needs observed responses
estimated_when: >=2 of {contract, correlation, smells} probes ran   # clamp [1,2]
unknown_when:   handlers unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when contract+correlation both present/absent cleanly
scope_limited:  sampled handlers -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-07. Estimated ⇒ score ∈ {1,2}:

- `2`: central contract ∧ correlation present; minor smell count
- `1`: no shared schema ∨ no correlation IDs ∨ pervasive catch-all-500 pattern
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "error-semantics: contract={kind}; correlation={bool}; smells {k} ({classes}); tracker={sdk}"
```

## 9. Scope/overlaps echo

Error-contract semantics; duplicated handling infrastructure is ARCH-12, log infrastructure quality is PERF-01.

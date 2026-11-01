# API-07 — Error Handling & API Observability Semantics

> **Category:** [API & Integration Surface](../../06_API_INTEGRATION.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | API-07 |
| Name | Error Handling & API Observability Semantics |
| Category | API — API & Integration Surface |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 ~2–4 h — response sampling + error-log audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The API surface has poor error semantics — generic 500s swallowing root causes, unstructured error bodies, no standard error contract, no request IDs/correlation, clients can't distinguish retriable/permanent/validation errors, and errors are invisible in logs.
- **Why it signals obsolescence:** Error contracts are the API's exception handling contract: they tell clients *what to do*. Absent them, every failure is a mystery, debugging is archaeology (no request ID to trace), and consumer code is a basket of string greps. Modern APIs define errors structurally (RFC 7807-style, typed codes, correlation IDs).
- **Where it manifests:** Bare 500s with HTML error pages, `{"error": "something went wrong"}`, no `requestId`/trace id in responses, no error-code taxonomy, validation errors that differ per endpoint, logs of errors without the request context, monitoring that can't tell retriable from fatal.
- **Objective metric:** `% of endpoints with a structured error contract`; `% of 500s that are actually expected 4xx (misclassified)`; `request-ID coverage % of error logs`; `# of distinct ad-hoc error body shapes`.
- **Yellow flag (warning):** Inconsistent error bodies and some misclassified status codes, request IDs partial. *(Rationale: warning — debugging is slow, not impossible.)*
- **Red flag (critical):** Generic 500s (or worse, HTML error pages) as normal practice, no request correlation anywhere, or error logs that can't reconstruct a single failing request. *(Rationale: every incident is archaeology — MTTR structurally high.)*
- **Example symptom:** "A payment endpoint returns `500` for a card-that's-expired. The client retries blind, double-charges the customer, and support gets 'the app is broken' with no request ID to trace. The engineers find the error in logs only by grepping a timestamp and the username."
- **Blast radius:** Debugging MTTR, consumer behavior correctness (retry/duplicate risk), integration bugs, monitoring quality, GDPR/PII in error surfaces.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = structured + correlated; 2 = partial/inconsistent; 1 = mostly generic, no correlation; 0 = 500s + HTML + zero correlation.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: standardize an error contract (RFC 7807 or a JSON schema: code, message, correlationId, retriable flag), add request IDs everywhere, fix the worst misclassifications. Structural fix: framework-level error middleware (single source of truth), typed error taxonomy, API-monitoring that segments by error class, error payloads free of PII.
- **Gold standard / target state:** Every endpoint returns structured, typed, correlated errors; 4xx/5xx semantics correct; a failing request is traceable in seconds; clients can act on errors programmatically.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** shared-error-schema detection (RFC7807 `problem+json`, error DTO classes, centralized exception handlers); request-ID/correlation middleware presence; status-code usage audit (static sample: bare 500s, 200-with-error-body patterns); error-tracking SDK presence (`sentry`, `bugsnag` deps — cross-ref PERF-01 instrumentation facts recomputed inline)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** API-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Error-contract audit — sample responses (curl status codes + bodies), check status-code semantics (4xx/5xx correctness), look for a shared error schema/framework, check request IDs in headers/logs; check error tracking (correlated stack traces per endpoint); verify monitoring can segment error classes.

1. Detect central error-mapping layer vs ad-hoc catch sites (ARCH-12 fact reuse).
2. Correlation middleware inventory.
3. Static status-code sample: handlers returning success wrappers around failures, generic 500 rethrows.
4. Live response sampling is runtime plane → emission text.

Preconditions: handler parse.

## 7. Fact schema

```json
{"api07": {
  "error_contract": {"rfc7807": false, "central_handler": true, "schema_file": "errors.py"},
  "request_id_middleware": true,
  "static_smells": {"catch_all_500": 12, "success_wrapped_errors": 3},
  "tracker_sdk": "sentry"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # semantic correctness needs observed responses
estimated_when: >=2 of {contract, correlation, smells} probes ran   # clamp [1,2]
unknown_when:   handlers unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when contract+correlation both present/absent cleanly
scope_limited:  sampled handlers -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: central contract ∧ correlation present; minor smell count
- `1`: no shared schema ∨ no correlation IDs ∨ pervasive catch-all-500 pattern
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "error-semantics: contract={kind}; correlation={bool}; smells {k} ({classes}); tracker={sdk}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Error-contract semantics; duplicated handling infrastructure is ARCH-12, log infrastructure quality is PERF-01.

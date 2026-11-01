# API-09 — Idempotency & Retry Semantics — Implementation Spec *(deep-dive — folds into API when run)*

> **Authority:** This file defines the API-09 implementation contract. The [API rubric category](../../rubric/06_API_INTEGRATION.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B·unknown) |
| v1 flag | YES (deep-dive tier; sprint 2 per `docs/plans/04` §4) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: API` |
| Verify effort | 🔶 human · engine: design-pattern sweep |
| Thresholds & 0–3 criteria | see encyclopedia §API-09 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** matchers over state-changing routes: idempotency-key handling (`Idempotency-Key`/`X-Request-ID` reads, dedup tables, unique-constraint upserts), client_ref patterns; retry-policy declarations in outbound clients (API-04 reuse); replay-test execution is runtime plane → emission text
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** API-01 clause-b. Else applicable.

## 2. Detection recipe

1. Enumerate POST/PUT/PATCH handlers touching persistence.
2. Per handler: idempotency mechanism present? (key header consumed ∧ dedupe store referenced).
3. Outbound retry configs: do they pair with server-side idempotency (retry-safe)?
4. Double-submit behavioral test is runtime plane → "what it takes".

Preconditions: handler parse.

## 3. Fact schema

```json
{"api09": {
  "state_changing_routes": 26,
  "idempotent_by_design": 8,
  "dedupe_store_present": true,
  "outbound_retries_without_idempotency": [{"client": "payment-svc", "route": "POST /charge"}]}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # enforcement proof needs a replay test
estimated_when: route set enumerated           # clamp [1,2]; confidence medium when dedupe-store evidence clear
unknown_when:   handlers unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium
scope_limited:  sampled routes -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-09. Estimated ⇒ score ∈ {1,2}:

- `2`: most state-changing core routes idempotent-by-design; minor gaps
- `1`: retries configured against non-idempotent endpoints ∨ no idempotency machinery at all on payment-class flows
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "idempotency-probe: {k}/{n} state-changers idempotent-by-design; unsafe retry pairs={list}"
```

## 9. Scope/overlaps echo

Idempotency/retry semantics; generic error handling is API-07, sync-coupling shape API-04.

# API-09 — Idempotency & Retry Semantics

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for API-09. Edit this file; the legacy path [api-09_idempotency-retry-semantics.md](../../../specs/06_API_INTEGRATION/api-09_idempotency-retry-semantics.md) is a compatibility alias.
> **Category:** [API & Integration Surface](../../06_API_INTEGRATION.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/06_API_INTEGRATION/API-09_idempotency-retry-semantics.md`

## 1. Identity

| field | value |
|---|---|
| ID | API-09 |
| Name | Idempotency & Retry Semantics |
| Category | API — API & Integration Surface |
| Engine tier | B |
| Default status | unknown |
| v1 flag | YES (deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: API` |
| Verify effort | 🔷 ~1–2 days — design audit + replay tests. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The API has no idempotency guarantees or retry contract — clients cannot retry safely; duplicate submissions double-charge/duplicate records, and there's no `Idempotency-Key`/`idempotency` mechanism or documented retry policy.
- **Why it signals obsolescence:** In a network world, retries are inevitable — a retryable-without-idempotency API converts network blips into business-correctness bugs (double payments, duplicate orders). Modern API design treats idempotency as a first-class guarantee for state-changing operations. Its absence is a correctness-era artifact.
- **Where it manifests:** Payment/order/import endpoints without idempotency keys, no deduplication keys, timeouts without conflict-surfacing, docs silent on retry behavior, "we had a double-charge issue last month" incidents.
- **Objective metric:** `% of state-changing endpoints with idempotency support`; `idempotency tests passing`; `duplicate-process incidents (last 12 mo)`; `retry policy documented?`.
- **Yellow flag (warning):** Most state-changing endpoints lack idempotency; retry/duplicate incidents occasional and manually reconciled. *(Rationale: warning — currently handled by reconciliation heroics.)*
- **Red flag (critical):** Core money/mutation endpoints have no idempotency and no dedupe, and duplicate side effects have already cost money/duplicated records. *(Rationale: this is a standing correctness breach for the money path.)*
- **Example symptom:** "A network timeout on checkout makes the client retry. Two charges hit the card, one order created, a support ticket, a manual refund. The API has no `Idempotency-Key` and the team 'just checks manually' when it happens."
- **Blast radius:** Double-charge/double-record risk, customer trust, reconciliation load, partner integrations (they *will* retry), audit correctness.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = all state-changing enlistments idempotent; 2 = most, gaps in peripheral; 1 = money/mutation flows lack it; 0 = duplicates have already occurred.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add an idempotency key + response-replay on the top money flows, add a unique constraint (order/client_ref) as a backstop. Structural fix: idempotency as a platform primitive (framework middleware, key storage, replay store), document retry semantics, idempotency tests in CI for all mutation endpoints.
- **Gold standard / target state:** All state-changing endpoints idempotent + tested, retry policy documented, duplicate side effects impossible.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** matchers over state-changing routes: idempotency-key handling (`Idempotency-Key`/`X-Request-ID` reads, dedup tables, unique-constraint upserts), client_ref patterns; retry-policy declarations in outbound clients (API-04 reuse); replay-test execution is runtime plane → emission text
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** API-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Design audit of all state-changing endpoints — idempotency mechanism (`Idempotency-Key` header, `client_ref`, unique constraints) present and enforced; retry policy documented; test the behavior (replay same payload twice; check duplicate side effects); incident history for duplicate-processing.

1. Enumerate POST/PUT/PATCH handlers touching persistence.
2. Per handler: idempotency mechanism present? (key header consumed ∧ dedupe store referenced).
3. Outbound retry configs: do they pair with server-side idempotency (retry-safe)?
4. Double-submit behavioral test is runtime plane → "what it takes".

Preconditions: handler parse.

## 7. Fact schema

```json
{"api09": {
  "state_changing_routes": 26,
  "idempotent_by_design": 8,
  "dedupe_store_present": true,
  "outbound_retries_without_idempotency": [{"client": "payment-svc", "route": "POST /charge"}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # enforcement proof needs a replay test
estimated_when: route set enumerated           # clamp [1,2]; confidence medium when dedupe-store evidence clear
unknown_when:   handlers unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium
scope_limited:  sampled routes -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: most state-changing core routes idempotent-by-design; minor gaps
- `1`: retries configured against non-idempotent endpoints ∨ no idempotency machinery at all on payment-class flows
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "idempotency-probe: {k}/{n} state-changers idempotent-by-design; unsafe retry pairs={list}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Idempotency/retry semantics; generic error handling is API-07, sync-coupling shape API-04.

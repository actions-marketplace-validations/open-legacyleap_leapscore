# API-04 — Synchronous Coupling & Chatty Interfaces — Implementation Spec

> **Authority:** This file defines the API-04 implementation contract. The [API rubric category](../../rubric/06_API_INTEGRATION.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 human (traces) · engine: call-shape sweep |
| Thresholds & 0–3 criteria | see encyclopedia §API-04 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** AST matchers: sequential-await chains in request handlers (`await` depth ≥ Y_DEPTH within one handler), N+1-of-services shapes (client calls inside loops), resilience-machinery presence (circuit breakers, timeouts, retries config: `polly`, `resilience4j`, `tenacity`, `backoff` deps), queue/event-bus presence for core flows
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java · Go
- **Applicability:** API-01 clause-b (needs a request-handling surface). Else applicable.

## 2. Detection recipe

1. For each route handler: compute await/blocking-call chain depth; flag deep serial chains.
2. Loop-wrapped outbound calls → chatty-interface suspects.
3. Resilience inventory: breaker/timeout/retry configs bound to which clients.
4. Async-alternative presence: queue publishes adjacent to the same flows.
5. Distributed-trace confirmation is runtime plane → emission text.

Preconditions: handler parse.

## 3. Fact schema

```json
{"api04": {
  "deep_serial_handlers": [{"route": "POST /checkout", "await_depth": 6}],
  "loop_outbound_calls": 3,
  "resilience": {"breaker": false, "timeouts": true, "retry": true},
  "queue_alternatives_present": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # hop-count truth needs traces
estimated_when: >=2 of {chain-depth, loop-calls, resilience} probes ran   # clamp [1,2]
unknown_when:   handlers unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all three ran on supported framework
scope_limited:  sampled routes -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-04. Estimated ⇒ score ∈ {1,2}:

- `2`: moderate serial chains, resilience present
- `1`: deep chains on core routes ∧ no breaker ∨ loop-outbound patterns present
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Async frameworks blur await-depth signal → confidence low note

## 8. Evidence string

```
basis: "sync-shape: {d} deep-serial handlers ({worst} depth={x}); loop-calls {l}; breaker={bool}"
```

## 9. Scope/overlaps echo

Sync coupling shape in code; integration inventory is API-03, runtime latency is PERF's plane.

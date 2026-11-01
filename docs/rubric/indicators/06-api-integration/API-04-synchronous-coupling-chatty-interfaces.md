# API-04 — Synchronous Coupling & Chatty Interfaces

> **Category:** [API & Integration Surface](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | API-04 |
| Name | Synchronous Coupling & Chatty Interfaces |
| Category | API — API & Integration Surface |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 ~2–4 h — tracing waterfall + resilience audit. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Core flows string many synchronous calls end-to-end — one request fans out into a chain of blocking HTTP calls where any slow/failing dependency is paid by the user, with no async boundaries, no bulkheads, no circuit breakers, no timeouts/SLOs per hop.
- **Why it signals obsolescence:** Synchronous fan-out turns every downstream dependency into your p99 and your outage — "the slowest link owns your product." Modern architecture truncates these chains with async/eventing, bulkheads, and resilience patterns. It's also why legacy systems are so hard to modernize: the failure mode is coupled to latency, not correctness.
- **Where it manifests:** A checkout/onboarding flow instrumented as 8 sequential HTTP calls, no message queue anywhere, no circuit breaker/timeout config, a service that blocks on an ETL's endpoint, "the third-party is slow today so the app is slow."
- **Objective metric:** `max sync hops in core flows`; `% of core traffic dependent on > 3 live dependencies`; `<presence of bulkheads/circuit breakers>`; `p95 latency contribution of the longest sync chain`.
- **Yellow flag (warning):** Long sync chains in non-core flows; a couple of hot paths with fragile timeouts. *(Rationale: warning — the pattern exists but isn't load-bearing everywhere yet.)*
- **Red flag (critical):** Core flows block on chains of slow/unreliable sync dependencies with no async escape, or an outage in one dependency takes down the primary flow (no bulkheads). *(Rationale: the product's latency and uptime are hostage to the weakest link.)*
- **Example symptom:** "Checkout calls pricing (2s), which calls loyalty (1.5s), which calls the ad-hoc excel service (4s). Total: 7.5s of synchronous waiting, twice. The excel service has a bad day once a week and checkout fails — then 'sales went down because of the ad-hoc excel service.'"
- **Blast radius:** p95 latency, cascade outages, third-party dependency risk, mobile/web parts, incident chains, modernization sequencing.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = minimal live deps, resilient; 2 = sync chains outside core; 1 = fragile chains in core with no fallback; 0 = primary flow hostage to one dependency.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add timeouts + circuit breakers on the fragile hops, cache the slow reads. Structural fix: slice the sync chain with events/async (compute off-path, return fast), bulkhead partitions by dependency, SLO-per-hop, degrade gracefully.
- **Gold standard / target state:** Core flows touch the minimum live dependencies; slow work is async; circuit-broken fallbacks in place; the weakest link cannot sink the product.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** AST matchers: sequential-await chains in request handlers (`await` depth ≥ Y_DEPTH within one handler), N+1-of-services shapes (client calls inside loops), resilience-machinery presence (circuit breakers, timeouts, retries config: `polly`, `resilience4j`, `tenacity`, `backoff` deps), queue/event-bus presence for core flows
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java · Go
- **Applicability:** API-01 clause-b (needs a request-handling surface). Else applicable.

## 6. Detection recipe

- **Detection method:** Trace analysis — distributed tracing (from PERF-01) to count hops and N+1-of-services per request, temporal latency waterfall; code review of core flows for `await`/blocking chains; presence of queues/event bus; resilience config audit (timeouts, retries, circuit breakers, batching).

1. For each route handler: compute await/blocking-call chain depth; flag deep serial chains.
2. Loop-wrapped outbound calls → chatty-interface suspects.
3. Resilience inventory: breaker/timeout/retry configs bound to which clients.
4. Async-alternative presence: queue publishes adjacent to the same flows.
5. Distributed-trace confirmation is runtime plane → emission text.

Preconditions: handler parse.

## 7. Fact schema

```json
{"api04": {
  "deep_serial_handlers": [{"route": "POST /checkout", "await_depth": 6}],
  "loop_outbound_calls": 3,
  "resilience": {"breaker": false, "timeouts": true, "retry": true},
  "queue_alternatives_present": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # hop-count truth needs traces
estimated_when: >=2 of {chain-depth, loop-calls, resilience} probes ran   # clamp [1,2]
unknown_when:   handlers unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all three ran on supported framework
scope_limited:  sampled routes -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: moderate serial chains, resilience present
- `1`: deep chains on core routes ∧ no breaker ∨ loop-outbound patterns present
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Async frameworks blur await-depth signal → confidence low note

## 10. Evidence and output

### Evidence string

```
basis: "sync-shape: {d} deep-serial handlers ({worst} depth={x}); loop-calls {l}; breaker={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Sync coupling shape in code; integration inventory is API-03, runtime latency is PERF's plane.

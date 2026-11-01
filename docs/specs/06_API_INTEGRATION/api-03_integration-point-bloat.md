# API-03 — Integration Point Bloat — Implementation Spec

> **Authority:** This file defines the API-03 implementation contract. The [API rubric category](../../rubric/06_API_INTEGRATION.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (in-repo edge enumeration; matrix said C·unknown) |
| v1 flag | PART (candidate) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔷 human · engine: config-graph pass |
| Thresholds & 0–3 criteria | see encyclopedia §API-03 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** integration-edge extractors: outbound HTTP client configs (`base_url` env refs, SDK deps), message-broker topics/queues (`kafka`, `rabbitmq`, `sqs` config), service-discovery references, webhook routes, DB/queue connection strings (shared with DATA-02 sweep)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero outbound integrations and single-service layout` (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Enumerate edges from the repo's configs/code: `{target, protocol, config_site}`.
2. Dedupe by logical target; count per node (the repo itself) + fan-out.
3. Gateway/registry presence: API gateway config, service mesh, central client library.
4. System-wide topology beyond repo → emission text (org plane).

Preconditions: ≥1 config surface parseable.

## 3. Fact schema

```json
{"api03": {
  "outbound_edges": [{"target": "stripe-api", "protocol": "https", "abstracted": true}],
  "queue_bindings": ["orders.created"],
  "fan_out_total": 17,
  "gateway_present": false,
  "unabstracted_direct_clients": 9}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # bloat judgment over partial graph is inferential
estimated_when: >=1 config surface enumerated  # clamp [1,2]; confidence medium in monorepos
unknown_when:   no configs found in an integration-suspected tree
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when env templates + manifests both parsed
scope_limited:  multi-repo topology -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-03. Estimated ⇒ score ∈ {1,2}:

- `2`: moderate fan-out, most clients abstracted
- `1`: high unabstracted fan-out ∨ duplicate bindings to same target via different protocols
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Env-injected-only endpoints (no templates) → undercount risk noted in evidence

## 8. Evidence string

```
basis: "integration-graph: {n} outbound edges ({u} direct/unabstracted); queues {list}; gateway={bool}"
```

## 9. Scope/overlaps echo

Integration-point inventory; sync-vs-async shape is API-04, vendor risk per dependency is API-05, DB edges are DATA-02.

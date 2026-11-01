# API-06 — Protocol & Data-Format Legaciness — Implementation Spec

> **Authority:** This file defines the API-06 implementation contract. The [API rubric category](../../rubric/06_API_INTEGRATION.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (status arbitrated; encyc said estimated — inventory is exhaustive-surface fact) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 human · engine: protocol inventory |
| Thresholds & 0–3 criteria | see encyclopedia §API-06 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** protocol matchers: SOAP/WSDL (`*.wsdl`, `soap` deps, `zeep`/`suds`), XML-RPC, CORBA/IIOP refs, binary legacy formats (BSON-in-rest, custom TCP framing), EDI/X12 files; modern markers: OpenAPI/gRPC proto files, GraphQL schemas, JSON:API conventions; message formats on queues (avro/proto/json-schema registry presence)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no integration surface at all` (API-01 clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Inventory wire protocols across clients/servers/configs over the enumerated tree.
2. Classify each: modern-norm / aging / legacy per per-language era table.
3. Core-share: fraction of core-flow modules touching legacy protocols.
4. Format registry hygiene for async messages.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"api06": {
  "protocols": [{"kind": "soap", "evidence": ["wsdl/partner.wsdl", "zeep in requirements"], "legacy": true}],
  "modern_share": 0.7,
  "core_legacy_touch": true,
  "schema_registry_present": false}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # inventory + classification is deterministic given era table
estimated_when: era-table gaps for exotic protocols   # clamp [1,2], confidence low
unknown_when:   no parseable surface
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium
scope_limited:  vendored client libs excluded -> noted
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-06.

- `3`: all-modern inventory
- `2`: legacy protocols present but zero core-touch
- `1`: legacy in isolated core-adjacent paths
- `0`: legacy protocol carrying core flows ∨ removed-standard protocols still active

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Era-table miss → protocol listed unclassified → estimated branch

## 8. Evidence string

```
evidence: "protocol-inventory {n}: legacy={list} ({k} core-touching); modern share={p}%"
```

## 9. Scope/overlaps echo

Wire-protocol/format choices; the endpoints' contract currency is API-01, vendor lifecycle is API-05.

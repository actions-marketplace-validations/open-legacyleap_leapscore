# DOCS-07 — Missing API Documentation — Implementation Spec

> **Authority:** This file defines the DOCS-07 implementation contract. The [DOCS rubric category](../../rubric/09_DOCS_KNOWLEDGE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** presence-only |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ human · engine: docs-inventory pass |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-07 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** API-docs inventory: OpenAPI/Swagger UI hosting config (redoc, swagger-ui static), generated-reference configs (`typedoc`, `jsdoc`, `sphinx-autodoc`, `godoc` conventions), per-endpoint doc annotations (`@operationId`, docstrings on handlers), docs-portal linkage; stranger-integrability is judgment → emission text
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no HTTP/API surface` (API-01 clause-b).

## 2. Detection recipe

1. Inventory spec files + rendering/generation tooling.
2. Per-endpoint annotation coverage share (docstrings/annotations over route set — API-01 route facts reused).
3. Generated-vs-hand-written distinction recorded.

Preconditions: route enumeration.

## 3. Fact schema

```json
{"docs07": {
  "spec_present": true, "ui_hosting": false,
  "generator_config": ["typedoc"],
  "endpoint_doc_coverage_pct": 0.38}}
```

## 4. Statusing rules

```yaml
measured_when:  route set enumerated           # presence + coverage share are facts
estimated_when: annotation-parse partial       # clamp [1,2], confidence low
unknown_when:   routes unparseable
na_when:        applicability fired
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DOCS-07.

- `3`: spec ∧ hosted/generated reference ∧ high endpoint-doc coverage
- `2`: spec present, generation/hosting missing or coverage middling
- `1`: sparse annotations, no spec
- `0`: zero API documentation surface of any kind

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
evidence: "api-docs: spec={bool}; ui/gen={list}; endpoint coverage {p}%"
```

## 9. Scope/overlaps echo

Developer-facing API documentation; the contract itself is API-01's row.

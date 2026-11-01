# DOCS-07 — Missing API Documentation

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-07. Edit this file; the legacy path [docs-07_missing-api-documentation.md](../../../specs/09_DOCS_KNOWLEDGE/docs-07_missing-api-documentation.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-07_missing-api-documentation.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-07 |
| Name | Missing API Documentation |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 ~2–4 h — docs inventory + stranger-integration test. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The API has no consumer-facing documentation — no OpenAPI/spec (from API-01), no reference docs, no examples, no guides — so consumers (internal or external) learn by reading code or probing endpoints.
- **Why it signals obsolescence:** Undocumented APIs are un-sellable, un-boardable, and un-debuggable. For any multi-team or external surface, docs are the interface; their absence forces every consumer to reverse-engineer, producing integration bugs and support load. (Related to but distinct from API-01's *contract*: docs of a contract is what consumers actually read.)
- **Where it manifests:** No developer portal/docs page, no usage examples, no auth/endpoint reference, "check the code, the naming's obvious," docs that only exist in a colleague's head, support tickets answering "how do I use X endpoint."
- **Objective metric:** `% of endpoints with consumer-facing reference + examples`; `time for a stranger to integrate a given endpoint`; `"how-to-use" support volume`; `portal/spec-published existence`.
- **Yellow flag (warning):** Some endpoints documented, others skeletal; docs partial/mixed-quality. *(Rationale: warning — documentation exists, coverage is patchy.)*
- **Red flag (critical):** No consumer-facing API documentation at all, or it's so stale it misleads (DOCS-02 applies), consumers reverse-engineer everything. *(Rationale: what isn't documented isn't accessible — the API is effectively a private contract wearing public clothes.)*
- **Example symptom:** "The partner wants to integrate. They ask for docs. The answer is a link to a code file. Three integrations later, support's inbox is 30% 'how do I use this' tickets — the docs deficit is now a support headcount."
- **Blast radius:** Integration velocity, external ecosystem, support load, sales/partner friction, debugging, onboarding.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = current generated docs; 2 = partial; 1 = sparse/misleading; 0 = no docs; consumers reverse-engineer.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: publish the OpenAPI/spec with a generated reference (Swagger UI/Redoc), add examples for the top 10 endpoints, write an auth quickstart. Structural fix: docs generated from contract in CI (spec is source, docs are output — DOCS-09), consumer guides for the top use cases, updated with each contract change, "docs in same PR" rule.
- **Gold standard / target state:** Every endpoint has a current, generated reference with examples; a stranger self-serves; docs update with the contract in the same change.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** API-docs inventory: OpenAPI/Swagger UI hosting config (redoc, swagger-ui static), generated-reference configs (`typedoc`, `jsdoc`, `sphinx-autodoc`, `godoc` conventions), per-endpoint doc annotations (`@operationId`, docstrings on handlers), docs-portal linkage; stranger-integrability is judgment → emission text
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no HTTP/API surface` (API-01 clause-b).

## 6. Detection recipe

- **Detection method:** Docs inventory — a developer-facing doc/test for each endpoint exists (examples, params, responses)? Can a stranger integrate without asking a human? Check tooling (Swagger UI/ReDoc/portal generation tied to the contract), support-ticket analysis for "how do I use /" volume.

1. Inventory spec files + rendering/generation tooling.
2. Per-endpoint annotation coverage share (docstrings/annotations over route set — API-01 route facts reused).
3. Generated-vs-hand-written distinction recorded.

Preconditions: route enumeration.

## 7. Fact schema

```json
{"docs07": {
  "spec_present": true, "ui_hosting": false,
  "generator_config": ["typedoc"],
  "endpoint_doc_coverage_pct": 0.38}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  route set enumerated           # presence + coverage share are facts
estimated_when: annotation-parse partial       # clamp [1,2], confidence low
unknown_when:   routes unparseable
na_when:        applicability fired
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: spec ∧ hosted/generated reference ∧ high endpoint-doc coverage
- `2`: spec present, generation/hosting missing or coverage middling
- `1`: sparse annotations, no spec
- `0`: zero API documentation surface of any kind

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
evidence: "api-docs: spec={bool}; ui/gen={list}; endpoint coverage {p}%"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Developer-facing API documentation; the contract itself is API-01's row.

# API-01 — API Contract Drift — Implementation Spec

> **Authority:** This file defines the API-01 implementation contract. The [API rubric category](../../rubric/06_API_INTEGRATION.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured — spec-vs-route matching is heuristic) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 human · engine: contract-vs-route inventory |
| Thresholds & 0–3 criteria | see encyclopedia §API-01 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** OpenAPI/Swagger file discovery + parse (`openapi: 3`, `swagger: 2`); route enumeration per framework (Express/Django/FastAPI/Spring/Flask/Gin annotations); validator-middleware presence (`@openapi/validator`, `pydantic` response models, drf-spectacular); client-gen artifacts (`/generated`, openapi-generator configs)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java · Go
- **Applicability:** `na_when: no HTTP server surface detected` (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Parse spec file(s): endpoint+method set with schema refs; record `spec_mtime`.
2. Enumerate actual routes from framework decorators/routers.
3. Match sets: covered / spec-only (ghost endpoints) / route-only (undocumented). Fuzzy path matching (`{param}` vs `<int:pk>`).
4. Enforcement probe: is a validation middleware wired to the spec in the app bootstrap.

Preconditions: ≥1 route parseable.

## 3. Fact schema

```json
{"api01": {
  "spec_present": true, "spec_endpoints": 41, "route_total": 58,
  "undocumented": 19, "ghost": 2,
  "validator_middleware": false,
  "match_confidence": "medium"}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # live responses never observed
estimated_when: routes enumerable              # clamp [1,2]; confidence medium when both sets parsed cleanly
unknown_when:   routes unparseable and no spec found
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium; low if <70% fuzzy-match confidence
scope_limited:  multi-service monorepo -> aggregate + scope-limited if truncated
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-01. Estimated ⇒ score ∈ {1,2}:

- `2`: spec present, drift below Yellow share, enforcement optional
- `1`: no spec ∧ routes exist ∨ drift above Yellow ∨ spec stale (>R_DAYS older than last route commit)
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Multiple specs → per-spec scoring, worst-of aggregated with note

## 8. Evidence string

```
basis: "contract-inventory: {u}/{n} undocumented, {g} ghost; validator wired={bool}"
```

## 9. Scope/overlaps echo

Spec-vs-route currency; versioning discipline is API-02, evolution process is API-10.

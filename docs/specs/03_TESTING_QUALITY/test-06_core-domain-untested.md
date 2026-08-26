# TEST-06 — Core Domain Untested — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (static proximity proxy; true coverage needs execution) |
| v1 flag | PART (`docs/plans/04` §5) |
| Gates fed | **G5** — untested core |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 human · engine: proximity heuristic |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-06 |

## 1. Inputs

- **Planes:** static-src (+ TEST-01 signals when available)
- **Tools:** core-path set (engine-computed); test-proximity matcher: co-located test files, import-graph reference from any test file; coverage join when TEST-01 observed a number (never executed locally)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no source parsed`. Zero tests anywhere is score signal here, not N/A.

## 2. Detection recipe

1. Take computed core module set (money/auth/PII/compliance reachability).
2. Per core module: `has_direct_test` (co-located) ∨ `has_import_ref_test` (any test imports it).
3. Proximity % = covered modules / core modules.
4. Business-criticality weighting beyond the global core definition is unavailable from URL → recorded as caveat.

Preconditions: core-path computation done.

## 3. Fact schema

```json
{"test06": {
  "core_modules": 22,
  "with_any_test": 9,
  "proximity_pct": 0.41,
  "untested_core_sample": ["billing/refund.py", "auth/session.py"]}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1                      # proximity ≠ coverage
estimated_when: core set non-empty               # clamp [1,2]; confidence low always
unknown_when:   core-path computation failed
na_when:        never
clamp:          [1,2]
confidence:     low by rule ("business map missing" caveat mandatory per docs/plans/04 §5)
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §TEST-06. Estimated ⇒ score ∈ {1,2}:

- `2`: partial (`proximity >= Y_PROX`)
- `1`: `proximity < Y_PROX`
- `3`/`0` unreachable by construction

## 6. Gate hooks (G5)

- `proven`: exhaustive enumeration shows zero test files repo-wide ∧ zero CI test jobs ∧ ≥1 core module exists (positive absence over complete surfaces)
- `not-proven`: `proximity >= Y_PROX`
- `needs-verification`: everything between — the common case; surfaced as top deep-dive item per `docs/plans/04` §6

## 7. Failure & budget semantics

- Budget class: `fast`
- Import graph unavailable → co-location-only proximity → confidence stays low

## 8. Evidence string

```
basis: "core-proximity: {k}/{n} core modules have adjacent/referenced tests ({p}%); untested e.g. {files}"
```

## 9. Scope/overlaps echo

Whether core paths are tested; overall suite shape is TEST-03, coverage level TEST-01.

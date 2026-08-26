# ARCH-12 — Duplicated Cross-Cutting Concerns — Implementation Spec *(deep-dive — folds into ARCH when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES (deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: ARCH` |
| Verify effort | 🔷 human · engine: pattern counts |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-12 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** AST-grep matcher packs: manual auth checks (session/permission guards at function tops) vs middleware/interceptor registrations; duplicated error-mapping catch blocks (same mapping body token-hash); transaction boilerplate per service method; validation hand-rolling per endpoint
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java (framework-aware: Express/Nest, Django DRF, Spring); Go heuristic low
- **Applicability:** `na_when: no HTTP/route surface detected` (pure CLI/batch repo, clause-b).

## 2. Detection recipe

1. Enumerate route/endpoint definitions; detect framework middleware chain presence.
2. Count manual guard sites inside handlers vs middleware-covered routes.
3. Token-hash catch/error-mapping blocks → duplicate clusters.
4. Transaction begin/commit boilerplate frequency in service methods.

Preconditions: route enumeration parseable.

## 3. Fact schema

```json
{"arch12": {
  "endpoints": 84,
  "middleware_coverage_pct": 61.9,
  "manual_auth_sites": [{"file": "controllers/admin.js", "endpoint": "/admin/x"}],
  "dup_error_mappers": 7,
  "tx_boilerplate_methods": 22}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # coverage-gap judgment is inferential
estimated_when: >=2 of {middleware-coverage, auth-sites, error-mapper} probes ran   # clamp [1,2]
unknown_when:   routes unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all three probes ran on a supported framework
scope_limited:  sampled endpoint set -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §ARCH-12. Estimated ⇒ score ∈ {1,2}:

- `2`: mostly centralized (`coverage_pct >= Y_COV`), few manual sites outside core
- `1`: manual security checks in core-route set ∨ `coverage_pct < Y_COV`
- `3`/`0` unreachable by construction

## 6. Gate hooks

none (missed-coverage breach risk stays with SEC-04's row).

## 7. Failure & budget semantics

- Budget class: `fast`
- Unrecognized framework → middleware detection heuristic-only → confidence low

## 8. Evidence string

```
basis: "crosscut-probe: middleware covers {p}% of {n} endpoints; manual auth sites {k}; dup mappers {m}"
```

## 9. Scope/overlaps echo

Shared-infrastructure duplication; auth-*coverage* gaps are SEC-04, error-*semantics* are API-07.

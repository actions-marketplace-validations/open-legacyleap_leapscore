# ECOS-06 — Dependency Bloat — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (status arbitrated; encyc said estimated) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-06 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** lockfile graph parsers (native, no install); `knip >= 5` (JS/TS), `vulture >= 2` + `deptry` (Python), `go mod why`-equivalent via graph parse (Go), `mvn dependency:analyze` config-read only (Java)
- **Rate-cost:** none
- **Ecosystems:** npm/pnpm/yarn · pip/poetry/uv · go · Maven/Gradle
- **Applicability:** ECOS-02 clause-b. Else applicable.

## 2. Detection recipe

1. Parse lockfile → transitive count, duplicate-version map (`{name: [versions...]}`).
2. Run dead-dep detector for the ecosystem (config-only invocation).
3. Compute `% unused direct`, duplicate security-critical pairs (intersect crypto/auth/http client allowlist).
4. Orphan detection heuristic: deps referenced by no source import AND no CI/script reference.

Preconditions: parsed lockfile; source tree enumerated.

## 3. Fact schema

```json
{"ecos06": {
  "transitive_total": 1403,
  "direct_unused": ["left-pad-shim", "moment"],
  "pct_direct_unused": 14.3,
  "duplicates": [{"name": "lodash", "versions": ["4.17.15", "4.17.21"]}],
  "duplicate_security_critical": true}}
```

## 4. Statusing rules

```yaml
measured_when:  lockfile parsed and dead-dep tool ran clean
estimated_when: dead-dep tool unavailable for ecosystem -> transitive counts stand, unused-% absent   # clamp [1,2], confidence low
unknown_when:   no lockfile
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive lockfile surface)
scope_limited:  monorepo workspace truncation -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Thresholds Y/R: see encyclopedia §ECOS-06.

- `3`: `transitive_total < Y_TRANS` ∧ `direct_unused.len == 0` ∧ duplicates none
- `2`: Yellow band (`Y_TRANS <= transitive <= R_TRANS` ∨ `pct_direct_unused > Y_UNUSED`)
- `1`: `transitive > R_TRANS` ∨ heavy duplication without security-critical overlap
- `0`: `duplicate_security_critical == true` ∧ unremovable orphans detected

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (knip-full dissolves to manifest-level unused check; counts remain measured)
- Malformed lockfile → `unknown`

## 8. Evidence string

```
evidence: "lockfile+knip: {t} transitives; {u}% direct unused; {d} duplicate versions"
```

## 9. Scope/overlaps echo

Dependency graph size/dupes; unused code in modules is ARCH-04, supply-chain exposure is ECOS-10.

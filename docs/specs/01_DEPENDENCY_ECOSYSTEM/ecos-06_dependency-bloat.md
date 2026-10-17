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
- **Tools:** lockfile graph parsers (native, no install) — transitive counts, per-package version sets, cross-lockfile duplicate aggregation. The dead-dep analyser path (`knip`, `depcheck`, `vulture`, `mvn dependency:analyze`) is not shipped in the offline release: the unused-direct sub-signal is absent (`null`), never estimated.
- **Rate-cost:** none
- **Ecosystems:** npm/pnpm/yarn · pip/poetry/uv · go · Maven/Gradle · NuGet (`packages.lock.json`; classic `packages.config` has no lockfile mechanism → `unknown` per ECOS-07's rule)
- **Applicability:** ECOS-02 clause-b. Else applicable.

## 2. Detection recipe

1. Parse lockfiles → transitive total, per-package version sets (a package at distinct versions within or across lockfiles is a duplicate).
2. Aggregate the duplicate set across ALL parsed lockfiles (not per-lockfile) — the duplicate signal is scoped across the estate so cross-project repeats in a legacy solution are caught.
3. Intersect duplicates with the security-critical family list (crypto/auth/http-client) → `duplicate_security_critical`.
4. Unused-direct: no dead-dep analyser runs in this build → `direct_unused: []`, `pct_direct_unused: null` (absent signal, never a placeholder value).

Preconditions: parsed lockfile; source tree enumerated.

## 3. Fact schema

```json
{"ecos06": {
  "transitive_total": 1403,
  "direct_unused": [],
  "pct_direct_unused": null,
  "duplicates": [{"name": "lodash", "versions": ["4.17.15", "4.17.21"]}],
  "duplicate_security_critical": true,
  "lockfiles_parsed": 2}}
```

## 4. Statusing rules

```yaml
measured_when:  >=1 lockfile parsed            # transitive totals + duplicate version sets are exhaustive parsed facts
estimated_when: never in this build            # the unshipped unused-direct sub-signal is reported null, not estimated
unknown_when:   no lockfile (transitive counts unknowable)
na_when:        applicability fired
clamp:          [1,2]                          # n/a — measured-only row in this build
confidence:     medium (exhaustive lockfile surface)
scope_limited:  no trigger in this build (the lockfile surface has no read bound)
```

## 5. Score mapping (predicates)

Thresholds Y/R: see encyclopedia §ECOS-06.

- `3`: `transitive_total < Y_TRANS` ∧ `duplicates.len == 0`
- `2`: Yellow band (`Y_TRANS <= transitive <= R_TRANS`); the unused-direct fraction cannot contribute in this build (sub-signal absent, `null`)
- `1`: `transitive > R_TRANS` ∨ heavy duplication without security-critical overlap
- `0`: `duplicate_security_critical == true`

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast` in this build (lockfile parse only; the knip-full path is not shipped — unused-direct stays `null`)
- Malformed lockfile → `unknown`

## 8. Evidence string

```
evidence: "lockfile-parse: {t} transitives across {k} lockfiles; {d} duplicate package versions"
```

## 9. Scope/overlaps echo

Dependency graph size/dupes; unused code in modules is ARCH-04, supply-chain exposure is ECOS-10.

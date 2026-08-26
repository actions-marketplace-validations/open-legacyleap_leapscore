# ARCH-08 — Duplication Debt — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: clone-detector run |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-08 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** `jscpd >= 4` (multi-language, min-tokens 50), PMD-CPD (Java), `dupl` (Go)
- **Rate-cost:** none
- **Ecosystems:** agnostic via jscpd
- **Applicability:** `na_when: < 10 source files` (clone ratio meaningless below floor, clause-b).

## 2. Detection recipe

1. Run jscpd with engine defaults over non-vendored source; capture `clones` report JSON.
2. Compute duplication % = cloned lines / total lines; cluster count.
3. Cross-service duplication: same-token clusters spanning >1 service root (monorepo).
4. Security-critical duplication flag: clusters touching auth/crypto allowlist symbols.
5. Join largest clusters to core-path set.

Preconditions: ≥10 files.

## 3. Fact schema

```json
{"arch08": {
  "duplication_pct": 14.2,
  "clusters": [{"tokens": 380, "files": ["a/pay.py", "b/pay.py"], "cross_service": true}],
  "security_critical_dup": true,
  "lines_analyzed": 84200}}
```

## 4. Statusing rules

```yaml
measured_when:  jscpd exit clean and lines_analyzed >= MIN_LINES
estimated_when: sampled subset (budget dissolve)              # clamp [1,2], confidence low
unknown_when:   no supported language
na_when:        applicability fired (< MIN_FILES)
clamp:          [1,2]
confidence:     medium (deterministic token model)
scope_limited:  file-count cap -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values (10–20% / >25%): see encyclopedia §ARCH-08.

- `3`: `duplication_pct < Y_PCT`
- `2`: Yellow band, peripheral clusters only
- `1`: duplication in core logic within one service
- `0`: `security_critical_dup` ∨ core business rules duplicated cross-service (`cross_service ∧ in_core_path ∧ tokens > R_TOKENS`)

## 6. Gate hooks

none. (G6 uses VEL-03+VEL-08 only.)

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` — the canonical dissolve example per `PLANS/05` §4
- Pathological token blowups → output cap → estimated + scope-limited

## 8. Evidence string

```
evidence: "jscpd {ver}: {p}% across {n} lines; worst cluster {t} tokens ({files}); sec-crit={bool}"
```

## 9. Scope/overlaps echo

Clone ratio within/across modules; duplicated data access driving coupling is DATA-02/API-03.

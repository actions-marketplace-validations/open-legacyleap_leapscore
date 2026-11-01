# ARCH-01 — Cognitive Complexity & God Classes — Implementation Spec

> **Authority:** This file defines the ARCH-01 implementation contract. The [ARCH rubric category](../../rubric/02_ARCHITECTURE_CODE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h human · engine: automated analyzer run |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-01 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** `lizard >= 1.7` (multi-language CC/LOC), `radon >= 6` (Python), `eslint` `complexity` + `max-lines-per-function` rules (JS/TS). SonarQube-class tools optional enrichment.
- **Rate-cost:** none
- **Ecosystems:** agnostic via lizard; language analyzers add precision
- **Applicability:** `na_when: zero source files in any supported language` (clause-b, enumerated tree). Else applicable.

## 2. Detection recipe

1. Run lizard over the clone with default cognitive-complexity model; exclude vendored/generated dirs (engine exclusion list: `vendor/`, `node_modules/`, `*.min.js`, lockfiles).
2. Python supplement: `radon cc -s -a` per module.
3. JS/TS supplement: eslint complexity rule run (config-only).
4. Compute per-method complexity distribution, per-class LOC; join file paths against computed core-path set.

Preconditions: tree enumerated; language adapters selected.

## 3. Fact schema

```json
{"arch01": {
  "methods_analyzed": 4820,
  "pct_over_Y": 4.2,
  "top_offenders": [{"file": "app/orders.py", "fn": "process", "ccn": 38, "loc": 912}],
  "god_classes": [{"file": "OrderManager.java", "loc": 2340}],
  "file_loc_p95": 480}}
```

## 4. Statusing rules

```yaml
measured_when:  methods_analyzed >= MIN_SAMPLE (50) and analyzer exit clean
estimated_when: sampled subset only (budget dissolve)          # clamp [1,2], confidence low
unknown_when:   no supported-language source parsed
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (full deterministic static pass)
scope_limited:  >MAX_FILES truncated -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values (complexity 15/30, class LOC 500/2000): see encyclopedia §ARCH-01.

- `3`: `pct_over_Y <= Y_PCT` ∧ no god classes
- `2`: offenders present, all outside core paths
- `1`: god-class or >R-complexity method touching an isolated core path
- `0`: core domain logic dominated by R-band units (`core_offenders_ratio > R_RATIO`)

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (dissolve → largest-N files by LOC + scope-limited)
- Analyzer crash on pathological files → skip-file count recorded; >10% skipped → estimated

## 8. Evidence string

```
evidence: "lizard {ver}: {k} methods >{Y}; worst {file}:{fn} ccn={c}; {g} god classes"
```

## 9. Scope/overlaps echo

Pure size/complexity of units; duplication that inflates size is scored under ARCH-08 — only shape counted here.

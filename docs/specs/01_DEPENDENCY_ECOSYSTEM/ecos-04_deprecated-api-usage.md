# ECOS-04 — Deprecated API Usage — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-04 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** JS/TS: `eslint` + deprecation rule set (`>= 8`) with type-aware run; Python: `flake8` + deprecation plugin set, `ast` grep against curated removal lists; Go: `staticcheck` config presence + `grep` of stdlib-deprecated list; Java: compiler-flag scan only (no compile → grep `@Deprecated` call sites via import graph)
- **Rate-cost:** none (local)
- **Ecosystems:** JS/TS · Python · Go (partial) · Java (weak)
- **Applicability:** `na_when: no source files of any gated language detected in an enumerated tree`. Else applicable.

## 2. Detection recipe

1. Run the ecosystem's static deprecation lint over the clone (config-only invocation, no repo scripts executed).
2. Collect warning sites: `{file, line, symbol, deprecated_since?}`.
3. Join sites against computed core-path set.
4. Curated removal-list grep: match calls to APIs removed in the next LTS of the detected framework version.

Preconditions: language adapter selected by detect-ecosystem.

## 3. Fact schema

```json
{"ecos04": {
  "warning_total": 213,
  "warnings_in_core": 41,
  "removed_api_hits": [{"symbol": "django.utils.functional.allow_tags", "file": "app/views.py"}],
  "lint_ran": true, "tool_version": "eslint 8.57"}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # signal quality is ecosystem-dependent -> always labeled inference
estimated_when: lint_ran == true               # clamp [1,2], confidence medium if type-aware run, else low
unknown_when:   lint could not run (language unsupported or parse failure)
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when type-aware analysis completed; low for grep-class runs
scope_limited:  output cap hit -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Threshold values: see encyclopedia §ECOS-04. Estimated ⇒ score ∈ {1,2} only:

- `2`: `warning_total > 0` ∧ `warnings_in_core == 0`
- `1`: `warnings_in_core > 0` ∨ `removed_api_hits.len > 0` (next-LTS breakage risk)
- `3`/`0` unreachable by construction (certainty claims not allowed on estimated rows)

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (type-aware lint is the expensive form; dissolve → grep-class run + confidence low)
- Parse-catastrophe (malformed tree) → `unknown` + error field

## 8. Evidence string

```
basis: "eslint-deprecation: {n} warnings ({k} in core); {m} next-LTS removal hits"
```

## 9. Scope/overlaps echo

Deprecated API calls in code; version drift is ECOS-02, framework support status is ECOS-08.

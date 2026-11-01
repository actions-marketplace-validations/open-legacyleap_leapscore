# FE-01 — UI Framework / Stack EOL & Deprecation — Implementation Spec

> **Authority:** This file defines the FE-01 implementation contract. The [FE rubric category](../../rubric/10_FRONTEND_CLIENT.md) owns its definition, thresholds, scoring criteria, and conditional applicability; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (status arbitrated; encyc said estimated — lifecycle lookup is fact) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % (category conditional on client detection) |
| Verify effort | ⚡ human · engine: manifest + lifecycle lookup |
| Thresholds & 0–3 criteria | see encyclopedia §FE-01 |

## 1. Inputs

- **Planes:** static-src + ecosystem (`endoflife.date`, framework status tables)
- **Tools:** FE-framework detection in package manifests (`react`, `vue`, `angular`, `svelte`, `next`, `nuxt`, plus legacy markers: `angular@1`/`angularjs`, `backbone`, `ember`, jQuery-class UI deps); build-toolchain compatibility table
- **Rate-cost:** api-budgeted
- **Ecosystems:** JS/TS-gated; mobile via separate detectors when present
- **Applicability:** **category gate:** `na_when: no user-facing client detected` (C1/OQ5 — entire FE category skipped). Per-row: never additionally N/A within an active FE category.

## 2. Detection recipe

1. Detect UI framework(s) + versions from manifests/lockfiles.
2. Lifecycle lookup per framework major (endoflife.date slug or static status table).
3. Toolchain-compat probe: does the pinned build toolchain support the pinned framework version?
4. Community-signal greps are context only (not scored).

Preconditions: client detected.

## 3. Fact schema

```json
{"fe01": {
  "frameworks": [{"name": "react", "version": "16.8", "support_status": "maintenance", "eol_date": null}],
  "toolchain_compat": {"bundler": "webpack4", "supports_framework": false}}}
```

## 4. Statusing rules

```yaml
measured_when:  frameworks.len > 0 and lookup succeeded
estimated_when: lookup partial / niche framework unmapped   # clamp [1,2], confidence low
unknown_when:   client detected but no framework identifiable (custom stack)
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §FE-01.

- `3`: all frameworks current ∧ toolchain compatible
- `2`: maintenance-mode framework with migration evidence
- `1`: EOL framework confined to non-core views ∨ toolchain mismatch without EOL
- `0`: EOL/retired framework carrying core UI

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Slug-table miss → that framework unknown; row estimated on remainder

## 8. Evidence string

```
evidence: "fe-lifecycle: react 16.8 {status}; toolchain compat={bool}"
```

## 9. Scope/overlaps echo

UI framework lifecycle; runtime/language EOL is ECOS-01's row.

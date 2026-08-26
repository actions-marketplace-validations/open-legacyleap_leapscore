# FE-07 — Internationalization / Localization Debt — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said unknown — static density scan is automatable) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 human · engine: i18n-surface sweep |
| Thresholds & 0–3 criteria | see encyclopedia §FE-07 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** hardcoded-string density in UI components (string literals in JSX/template text nodes); i18n framework presence (`react-intl`, `i18next`, `vue-i18n`, `gettext`); locale-file inventory + key coverage; extraction-pipeline configs; RTL/locale-switch markers; ICU-plural usage share
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated
- **Applicability:** FE category gate. Within active FE: never N/A (absence of i18n machinery is the signal).

## 2. Detection recipe

1. Hardcoded-UX-string density per component tree (exclude test/dev strings).
2. i18n lib + locale files: count locales, missing-key ratio vs used keys.
3. Extraction automation presence; runtime locale-switch verification is render plane → emission text.

Preconditions: client detected.

## 3. Fact schema

```json
{"fe07": {
  "i18n_lib": null, "locale_files": [],
  "hardcoded_string_density_pct": 0.92,
  "extraction_pipeline_present": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # debt judgment over density is inferential
estimated_when: >=2 of {density, lib, locales} probes ran   # clamp [1,2]
unknown_when:   no parseable UI surface
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §FE-07. Estimated ⇒ score ∈ {1,2}:

- `2`: i18n machinery present with partial coverage
- `1`: near-total hardcoding ∨ no i18n machinery despite multi-locale signals in product copy
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "i18n-sweep: lib={bool}; locales={n}; hardcoded {p}% of UI strings"
```

## 9. Scope/overlaps echo

Localization posture; platform-support drift is FE-04.

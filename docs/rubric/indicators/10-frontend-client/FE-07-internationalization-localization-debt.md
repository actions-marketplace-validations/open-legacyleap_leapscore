# FE-07 — Internationalization / Localization Debt

> **Category:** [Frontend & Client Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | FE-07 |
| Name | Internationalization / Localization Debt |
| Category | FE — Frontend & Client Health |
| Engine tier | A |
| Default status | unknown |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔷 ~1–2 days — hardcoded-string scan + RTL/plural/format tests. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client either hardcodes one language with no i18n framework, or has i18n but a truncated practical reality — tokens only for headers, plurals/grammar wrong, right-to-left unhandled, dates/numbers sorted in English, timezone assumptions — so the product can't actually address the markets its distribution claims.
- **Why it signals obsolescence:** i18n is an era marker as much as a feature: modern clients are locale-aware from the first screen. A hardcoded, English-assuming client was built when "one market, one language" was the product's horizon — a horizon that no longer matches a globalizing distribution. It also compounds every other FE debt (a full a11y pass on one locale has to be repeated for each).
- **Where it manifests:** String literals in components, no i18n library / no extraction pipeline, no locale switch, RTL layouts broken or text truncated, hardcoded date/currency formats, English-first sort/case logic, "It works in English" as the QA bar, translations owned by nobody in the repo.
- **Objective metric:** `hardcoded UI string count`; `i18n lib + extraction present?`; `supported locales`; `full-string translation coverage %`; `RTL-capable?`; `locale-aware date/number formatting?`.
- **Yellow flag (warning):** i18n framework exists, some locales work, but plurals/RTL/formatting are shims and token coverage is partial. *(Rationale: the rails exist; the train is half-stocked — expanding = broken UX in the half that's fake.)*
- **Red flag (critical):** No i18n at all (or English-only hardcode) and the market reality is multilingual; or claimed markets ship with broken RTL/plural/formatting. *(Rationale: distribution and product reality have separated — the client is a single-locale artifact in a multi-market world.)*
- **Example symptom:** "The app technically ships to three markets, but the German UI is a Google-translated token dump, Arabic users get a left-to-right nightmare, and dates are 'mm/dd/yyyy' everywhere. 'We'll do i18n properly after the rewrite' — four rewrites later."
- **Blast radius:** Market reach, revenue in non-EN markets, accessibility duplication cost, RTL usability, regulatory/language requirements, every future FE-migration's scope.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full i18n, per-locale fidelity, RTL ok; 2 = framework + partial locales, shims remain; 1 = English-only core journeys, one tokenized surface; 0 = hardcoded single-locale, markets claiming it are fiction.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: adopt an i18n framework + extraction automation, move strings to tokens, ship locale toggling, fix the top market's dates/plurals. Structural fix: locale as a first-class runtime concept (RTL, pluralization via ICU, locale-aware formatting/sorting), full-fidelity QA per shipped locale, prune markets served with fake translations until real ones are ready.
- **Gold standard / target state:** All UI strings extracted, ICU-correct plurals per locale, RTL fully supported, dates/numbers locale-aware, per-locale QA completeness, new code requires tokens (lint-enforced).

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** hardcoded-string density in UI components (string literals in JSX/template text nodes); i18n framework presence (`react-intl`, `i18next`, `vue-i18n`, `gettext`); locale-file inventory + key coverage; extraction-pipeline configs; RTL/locale-switch markers; ICU-plural usage share
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated
- **Applicability:** FE category gate. Within active FE: never N/A (absence of i18n machinery is the signal).

## 6. Detection recipe

- **Detection method:** Source audit — hardcoded-string density in UI components, i18n framework/lib + extraction pipeline present?, locale switching works + RTL check, plural/keyword (ICU) correctness sample, date/number/timezone handling test, translation-file completeness per supported market.

1. Hardcoded-UX-string density per component tree (exclude test/dev strings).
2. i18n lib + locale files: count locales, missing-key ratio vs used keys.
3. Extraction automation presence; runtime locale-switch verification is render plane → emission text.

Preconditions: client detected.

## 7. Fact schema

```json
{"fe07": {
  "i18n_lib": null, "locale_files": [],
  "hardcoded_string_density_pct": 0.92,
  "extraction_pipeline_present": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # debt judgment over density is inferential
estimated_when: >=2 of {density, lib, locales} probes ran   # clamp [1,2]
unknown_when:   no parseable UI surface
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: i18n machinery present with partial coverage
- `1`: near-total hardcoding ∨ no i18n machinery despite multi-locale signals in product copy
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "i18n-sweep: lib={bool}; locales={n}; hardcoded {p}% of UI strings"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Localization posture; platform-support drift is FE-04.

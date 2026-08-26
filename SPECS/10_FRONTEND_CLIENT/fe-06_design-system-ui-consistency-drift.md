# FE-06 — Design System / UI Consistency Drift — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said C·unknown — token/grep audit is static) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 human · engine: consistency greps |
| Thresholds & 0–3 criteria | see encyclopedia §FE-06 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** design-token inventory (CSS custom properties, theme files, token packages); hardcoded-value greps (`#[0-9a-f]{3,6}`, `rgb(`, px literals in style blocks) vs token references; component-library duplication (multiple button/modal/input implementations by dir); UI-kit dependency presence
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated
- **Applicability:** FE category gate.

## 2. Detection recipe

1. Token-surface inventory; adoption ratio = token refs / (token + literal) style values.
2. Duplicate-primitive detection: per primitive class (button/input/modal), count distinct implementations.
3. Visual-benchmark experiments are render plane → emission text.

Preconditions: client detected.

## 3. Fact schema

```json
{"fe06": {
  "token_files": ["theme/tokens.css"], "hardcoded_color_sites": 412,
  "token_adoption_pct": 0.31,
  "primitive_duplicates": {"button": 5, "modal": 3}}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # consistency drift is a judgment over proxies
estimated_when: >=2 of {tokens, hardcodes, duplicates} probes ran   # clamp [1,2]
unknown_when:   no styles parseable
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium when token surface parsed cleanly
scope_limited:  sampled dirs -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §FE-06. Estimated ⇒ score ∈ {1,2}:

- `2`: token system present, adoption middling, few duplicate primitives
- `1`: no tokens ∨ heavy hardcoded-value density ∨ multiple core primitives duplicated
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "ui-consistency: adoption {p}%; hardcoded colors {n}; button impls={k}"
```

## 9. Scope/overlaps echo

UI consistency posture; client architecture is FE-05.

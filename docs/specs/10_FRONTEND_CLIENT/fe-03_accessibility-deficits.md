# FE-03 — Accessibility Deficits — Implementation Spec

> **Authority:** This file defines the FE-03 implementation contract. The [FE rubric category](../../rubric/10_FRONTEND_CLIENT.md) owns its definition, thresholds, scoring criteria, and conditional applicability; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (encyc said B·measured — axe/Lighthouse need a rendered client) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 human (axe + keyboard walkthrough) |
| Thresholds & 0–3 criteria | see encyclopedia §FE-03 |

## 1. Inputs

- Rendered-DOM accessibility tree — render plane, forbidden in v1.

## 2. Detection recipe

None in v1. Static hints as emission context: `eslint-plugin-jsx-a11y` config presence, alt-text attribute density greps, semantic-landmark usage counts. These prove linting intent at best.

## 3. Fact schema (v1)

```json
{"fe03": {"status": "unknown",
           "reason": "accessibility violations observable only on rendered DOM",
           "static_hints": {"a11y_lint_configured": false}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs axe-core scan + keyboard walkthrough on rendered flows (deep scan)"
```

## 9. Scope/overlaps echo

Rendered accessibility; UI stack currency is FE-01.

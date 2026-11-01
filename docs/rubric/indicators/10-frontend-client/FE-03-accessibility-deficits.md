# FE-03 — Accessibility Deficits

> **Category:** [Frontend & Client Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | FE-03 |
| Name | Accessibility Deficits |
| Category | FE — Frontend & Client Health |
| Engine tier | B |
| Default status | measured |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 ~2–4 h — axe run + keyboard walkthrough. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client fails accessibility basics — no semantic markup, missing ARIA/labels, keyboard-unusable controls, contrast failures, no focus management, no a11y testing — and there's no accessibility standard or enforcement.
- **Why it signals obsolescence:** Accessibility is both a legal liability (ADA/WCAG/EN 301 549 — suits are real) and a *product reach* issue (roughly a fifth of users). Its absence marks a client built before accessibility became a baseline, and it's a rare case where the "modernization" is strictly additive — a cheap, high-return fix. Also a regulatory gate: WCAG 2.1 AA is legally required in many markets.
- **Where it manifests:** Lighthouse a11y < 70, div-spam instead of semantic elements, unlabeled inputs, modals without focus traps/dismiss, color-only status indicators, no keyboard order, no a11y lint or automated checks, screen-reader users unreachable.
- **Objective metric:** `Lighthouse a11y score`; `axe critical-serious violations count`; `keyboard-navigable coverage % of flows`; `a11y CI gate present?`; `contrast failures count`.
- **Yellow flag (warning):** Score 70–90, some serious violations on secondary flows, no a11y gate. *(Rationale: warning — functional but non-compliant risk remains.)*
- **Red flag (critical):** Score < 70, critical flows keyboard-unusable, or no automated a11y checking at all with visible violations. *(Rationale: legal exposure + an unusable-product class is excluded — dual liability.)*
- **Example symptom:** "The search/booking flow is a maze of unstyled divs and unlabeled selects. A screen-reader evaluation: 'I can't tell what anything is, and focus jumps around.' Legal risk registers the audit; revenue records the lost users."
- **Blast radius:** Legal action (accessibility suits), market reach, public-sector procurement eligibility, brand, UX quality (a11y fixes help everyone).

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (annex) 3 = ≥ 95, enforced; 2 = 70–90, some violations; 1 = < 70 on part of app; 0 = unusable-by-keyboard, no checks, legal exposure.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run axe, fix the top serious/critical violations (labels, semantics, focus, contrast), add a11y lint to CI. Structural fix: a11y standards + automated gate (axe in CI failing new violations), keyboard/contrast reviews, component-library a11y defaults, screen-reader smoke tests on core journeys.
- **Gold standard / target state:** a11y score ≥ 95, zero critical/serious violations, keyboard + screen-reader flows pass in review, a11y gate enforced in CI.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- Rendered-DOM accessibility tree — render plane, forbidden in v1.

## 6. Detection recipe

- **Detection method:** Automated a11y scan (axe-core, Lighthouse, WAVE, linting), manual keyboard walkthrough (tab through a critical flow), screen-reader smoke (VoiceOver/NVDA on core journeys), contrast checks (axe color-contrast), check for automated a11y checks in CI.

None in v1. Static hints as emission context: `eslint-plugin-jsx-a11y` config presence, alt-text attribute density greps, semantic-landmark usage counts. These prove linting intent at best.

## 7. Fact schema

```json
{"fe03": {"status": "unknown",
           "reason": "accessibility violations observable only on rendered DOM",
           "static_hints": {"a11y_lint_configured": false}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs axe-core scan + keyboard walkthrough on rendered flows (deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Rendered accessibility; UI stack currency is FE-01.

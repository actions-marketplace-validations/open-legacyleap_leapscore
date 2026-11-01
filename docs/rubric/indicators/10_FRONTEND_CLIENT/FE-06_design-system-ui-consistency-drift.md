# FE-06 — Design System / UI Consistency Drift

> **Category:** [Frontend & Client Health](../../10_FRONTEND_CLIENT.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | FE-06 |
| Name | Design System / UI Consistency Drift |
| Category | FE — Frontend & Client Health |
| Engine tier | C |
| Default status | unknown |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 ~2–4 h — duplication audit + consistency sample. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client has no (effective) design system — every screen hand-styles controls, colors/typography/spacing vary by feature, duplicated component implementations, no shared tokens — so "just another screen" always implies custom styling and visual drift.
- **Why it signals obsolescence:** A design system is the client's shared language; without it, the UI is a "many separate clients story," accessible-ish by accident, and each feature pays a full styling tax. Its absence signals a client that grew by addition before design-systems discipline — a marker of the same era as FE-01's framework.
- **Where it manifests:** Duplicated button/input/modal implementations, hardcoded color hexes scattered, no design tokens, no component library (or an abandoned one), docs/wireframes vs. shipped UI mismatch, "which button should we use? build one."
- **Objective metric:** `# of implementations of core primitives (button/input/modal)`; `design-token coverage %`; `hardcoded-color count`; `component library adoption % of screens`; `visual-consistency score (audit)`.
- **Yellow flag (warning):** 2–3 implementations of primitives, some tokens, ad hoc styles in places. *(Rationale: warning — inconsistency is compounding feature cost.)*
- **Red flag (critical):** No design system, 5+ ways to render a button, zero tokens — every feature re-invents the UI. *(Rationale: the client has no shared foundation — velocity and consistency are both structural losers.)*
- **Example symptom:** "There are six date pickers in the app, three of them hand-rolled, each with its own error UX. The design team emails a Figma spec; engineers hand-implement it differently every time. A brand refresh would be months of texture edits."
- **Blast radius:** Feature velocity (every screen restyled), UX quality, a11y (inconsistent controls), brand integrity, QA load, FE-01 migration (DS is the anchor).

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (annex) 3 = system + tokens; 2 = partial library; 1 = duplicates common; 0 = no shared foundation, reinvented per screen.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: build a token layer (design tokens → styled primitives), consolidate the top 2 duplicate controls, adopt one primitive set for new work. Structural fix: a small living component library (owned, versioned), tokens adopted across screens, "no new hand-rolled primitive" rule, design ↔ engineering parity checks.
- **Gold standard / target state:** One primitive set, tokens everywhere, new screens composed not styled, visual parity across the app by construction.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** design-token inventory (CSS custom properties, theme files, token packages); hardcoded-value greps (`#[0-9a-f]{3,6}`, `rgb(`, px literals in style blocks) vs token references; component-library duplication (multiple button/modal/input implementations by dir); UI-kit dependency presence
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated
- **Applicability:** FE category gate.

## 6. Detection recipe

- **Detection method:** Duplication audit — grep for repeated styles/colors/components, count component implementations per UI element, check design tokens (CSS variables/theme) adoption %, Figma/DS link usage, a "time to clone a button" benchmark, visual consistency audit on a few screens.

1. Token-surface inventory; adoption ratio = token refs / (token + literal) style values.
2. Duplicate-primitive detection: per primitive class (button/input/modal), count distinct implementations.
3. Visual-benchmark experiments are render plane → emission text.

Preconditions: client detected.

## 7. Fact schema

```json
{"fe06": {
  "token_files": ["theme/tokens.css"], "hardcoded_color_sites": 412,
  "token_adoption_pct": 0.31,
  "primitive_duplicates": {"button": 5, "modal": 3}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # consistency drift is a judgment over proxies
estimated_when: >=2 of {tokens, hardcodes, duplicates} probes ran   # clamp [1,2]
unknown_when:   no styles parseable
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium when token surface parsed cleanly
scope_limited:  sampled dirs -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: token system present, adoption middling, few duplicate primitives
- `1`: no tokens ∨ heavy hardcoded-value density ∨ multiple core primitives duplicated
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "ui-consistency: adoption {p}%; hardcoded colors {n}; button impls={k}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

UI consistency posture; client architecture is FE-05.

# 10 — Frontend & Client Health (conditional rubric module)

> **Category charter.** Standard indicators: FE-01–FE-07 · Deep-dive indicators: FE-08
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** The frontend is the product's face — and a client that predates its era shows the same decay class as the backend, plus its own: bundles the size of satellites, accessibility scored in single digits, and a framework the ecosystem left behind.
**Category summary:** This module is scored **only if the system has a user-facing client** (web app, mobile, desktop, or embedded UI). If none exists, skip entirely — it is an annex score recorded separately. When a client exists, its ten-indicator score (FE-01…07 × FE-08 deep-dive) carries a separate 10% in the FE-active system rollup while the other nine categories scale ×0.9 (see `model/config.md`). Covers the UI's framework health, performance, accessibility, platform currency, client architecture, design consistency, run-time adaptation, and internationalization.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| FE-01 | UI Framework / Stack EOL & Deprecation | A | estimated | YES | none | standard · folds into FE category % (category conditional on client detection) | ⚡ ≤30 min | [unified](./FE-01-ui-framework-stack-eol-deprecation.md) |
| FE-02 | Bundle Size & Load Performance | A | measured | NO | none | standard · folds into FE category % | 🔶 ~2–4 h | [unified](./FE-02-bundle-size-load-performance.md) |
| FE-03 | Accessibility Deficits | B | measured | NO | none | standard · folds into FE category % | 🔶 ~2–4 h | [unified](./FE-03-accessibility-deficits.md) |
| FE-04 | Browser / Platform Support Drift | B | measured | YES | none | standard · folds into FE category % | 🔶 ~2–4 h | [unified](./FE-04-browser-platform-support-drift.md) |
| FE-05 | Client-Side Architecture Debt | B | estimated | YES | none | standard · folds into FE category % | 🔶 ~2–4 h | [unified](./FE-05-client-side-architecture-debt.md) |
| FE-06 | Design System / UI Consistency Drift | C | unknown | YES | none | standard · folds into FE category % | 🔶 ~2–4 h | [unified](./FE-06-design-system-ui-consistency-drift.md) |
| FE-07 | Internationalization / Localization Debt | A | unknown | YES | none | standard · folds into FE category % | 🔷 ~1–2 days | [unified](./FE-07-internationalization-localization-debt.md) |
| FE-08 | Mobile / Responsive Adaptation & Offline Support | C | unknown | NO | none | deep-dive · `folds_into: FE` | 🔷 ~1–2 days | [unified](./FE-08-mobile-responsive-adaptation-offline-support.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).

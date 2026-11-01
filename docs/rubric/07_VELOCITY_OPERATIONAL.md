# 07 — Developer Velocity & Operational Drag

> **Canonical category index.** Base weight: 10% · FE-active weight: 9% · Standard indicators: VEL-01–VEL-10 · Deep-dive indicators: VEL-11–VEL-12
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** Velocity is where modernization debt pays out every single day — in build time, deploy failures, and the gap between "how we work" and "how we say we work." Slow pipelines aren't a pain point; they're a diagnostic.
**Category summary:** Scores the delivery and operational machinery around the code — CI/CD speed and reliability, deploy frequency and failure rate, local dev reproducibility, onboarding friction, knowledge concentration, review discipline, branch strategy, and how much of the release path is automated vs. heroic. DORA-aligned where measurable.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| VEL-01 | CI/CD Build Duration | B | estimated | PART (catalog conventions) | none | standard · folds into VEL category % | ⚡ ≤30 min | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-01_ci-cd-build-duration.md) |
| VEL-02 | Local Dev Setup Time & Friction | A | estimated | YES | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-02_local-dev-setup-time-friction.md) |
| VEL-03 | Deployment Failure Rate (CFR) | B | unknown | NO (v2) | **G6** jointly with VEL-08 (`G6*`) — CFR half unprovable from URL in v1, so G6 proven-state requires both halves; see hooks | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-03_deployment-failure-rate.md) |
| VEL-04 | Deployment Frequency & Lead Time | B | estimated | PART | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-04_deployment-frequency-lead-time.md) |
| VEL-05 | Onboarding Lead Time to First Production PR | D | unknown | NO | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-05_onboarding-lead-time-to-first-production-pr.md) |
| VEL-06 | Bus Factor / Knowledge Concentration | A | measured | YES | none | standard · folds into VEL category % | ⚡ ≤30 min | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-06_bus-factor-knowledge-concentration.md) |
| VEL-07 | Environment Reproducibility / Works-on-My-Machine | A | estimated | YES | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-07_environment-reproducibility-works-on-my-machine.md) |
| VEL-08 | Manual Release Steps & Operability | A | measured | YES | **G6** (with VEL-03) — manual-deploy half | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-08_manual-release-steps-operability.md) |
| VEL-09 | PR & Code-Review Hygiene | A | measured | YES | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-09_pr-code-review-hygiene.md) |
| VEL-10 | Branching & Monorepo Strategy Legacy | A | measured | YES | none | standard · folds into VEL category % | ⚡ ≤30 min | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-10_branching-monorepo-strategy-legacy.md) |
| VEL-11 | Developer Experience Tooling | B | estimated | PART (candidate; deep-dive tier) | none | deep-dive · `folds_into: VEL` | 🔷 ~1–2 days | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-11_developer-experience-tooling.md) |
| VEL-12 | Incident Recovery / MTTR | B | unknown | NO | none | deep-dive · `folds_into: VEL` | 🔷 ~1–2 days | [unified](./indicators/07_VELOCITY_OPERATIONAL/VEL-12_incident-recovery-mttr.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.

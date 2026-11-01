# 07 — Developer Velocity & Operational Drag

> **Category charter.** Standard indicators: VEL-01–VEL-10 · Deep-dive indicators: VEL-11–VEL-12
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** Velocity is where modernization debt pays out every single day — in build time, deploy failures, and the gap between "how we work" and "how we say we work." Slow pipelines aren't a pain point; they're a diagnostic.
**Category summary:** Scores the delivery and operational machinery around the code — CI/CD speed and reliability, deploy frequency and failure rate, local dev reproducibility, onboarding friction, knowledge concentration, review discipline, branch strategy, and how much of the release path is automated vs. heroic. DORA-aligned where measurable.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| VEL-01 | CI/CD Build Duration | B | estimated | PART (catalog conventions) | none | standard · folds into VEL category % | ⚡ ≤30 min | [unified](./VEL-01-ci-cd-build-duration.md) |
| VEL-02 | Local Dev Setup Time & Friction | A | estimated | YES | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-02-local-dev-setup-time-friction.md) |
| VEL-03 | Deployment Failure Rate (CFR) | B | unknown | NO (v2) | **G6** jointly with VEL-08 (`G6*`) — CFR half unprovable from URL in v1, so G6 proven-state requires both halves; see hooks | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-03-deployment-failure-rate.md) |
| VEL-04 | Deployment Frequency & Lead Time | B | estimated | PART | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-04-deployment-frequency-lead-time.md) |
| VEL-05 | Onboarding Lead Time to First Production PR | D | unknown | NO | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-05-onboarding-lead-time-to-first-production-pr.md) |
| VEL-06 | Bus Factor / Knowledge Concentration | A | measured | YES | none | standard · folds into VEL category % | ⚡ ≤30 min | [unified](./VEL-06-bus-factor-knowledge-concentration.md) |
| VEL-07 | Environment Reproducibility / Works-on-My-Machine | A | estimated | YES | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-07-environment-reproducibility-works-on-my-machine.md) |
| VEL-08 | Manual Release Steps & Operability | A | measured | YES | **G6** (with VEL-03) — manual-deploy half | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-08-manual-release-steps-operability.md) |
| VEL-09 | PR & Code-Review Hygiene | A | measured | YES | none | standard · folds into VEL category % | 🔶 ~2–4 h | [unified](./VEL-09-pr-code-review-hygiene.md) |
| VEL-10 | Branching & Monorepo Strategy Legacy | A | measured | YES | none | standard · folds into VEL category % | ⚡ ≤30 min | [unified](./VEL-10-branching-monorepo-strategy-legacy.md) |
| VEL-11 | Developer Experience Tooling | B | estimated | PART (candidate; deep-dive tier) | none | deep-dive · `folds_into: VEL` | 🔷 ~1–2 days | [unified](./VEL-11-developer-experience-tooling.md) |
| VEL-12 | Incident Recovery / MTTR | B | unknown | NO | none | deep-dive · `folds_into: VEL` | 🔷 ~1–2 days | [unified](./VEL-12-incident-recovery-mttr.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).

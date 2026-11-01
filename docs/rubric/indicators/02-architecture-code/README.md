# 02 — Architecture & Code Quality

> **Category charter.** Standard indicators: ARCH-01–ARCH-10 · Deep-dive indicators: ARCH-11–ARCH-12
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** Architecture debt is the shape of the code disagreeing with what the code now needs to do. When the shape is wrong, every future feature is a fight.
**Category summary:** Scores the internal structure of the codebase — complexity, coupling, boundaries, dead code, churn hot spots, architectural era, state hygiene, agentic operability, and config/flag discipline. The highest-weight *engineering* category (15%; 13.5% when the Frontend module is active) because architecture determines whether a system can be modernized incrementally at all — by humans *or* by AI tooling — or must be treated as a rewrite candidate.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| ARCH-01 | Cognitive Complexity & God Classes | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-01-cognitive-complexity-god-classes.md) |
| ARCH-02 | Coupling & Cohesion | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-02-coupling-cohesion.md) |
| ARCH-03 | Layer & Boundary Violations | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-03-layer-boundary-violations.md) |
| ARCH-04 | Dead & Orphaned Code | A | measured | YES | none | standard · folds into ARCH category % | ⚡ ≤30 min | [unified](./ARCH-04-dead-orphaned-code.md) |
| ARCH-05 | Code Churn vs. Defect Hot Spots | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-05-code-churn-vs-defect-hot-spots.md) |
| ARCH-06 | Architectural Era / Framework Generation | A | estimated | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-06-architectural-era-framework-generation.md) |
| ARCH-07 | Global Mutable State & Hidden Dependencies | A | estimated | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-07-global-mutable-state-hidden-dependencies.md) |
| ARCH-08 | Duplication Debt | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-08-duplication-debt.md) |
| ARCH-09 | Agentic Operability (AI/LLM Codebase-Readiness) | A | estimated | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./ARCH-09-agentic-operability.md) |
| ARCH-10 | Feature-Flag & Configuration Debt | A | estimated | YES | none | standard · folds into ARCH category % | ⚡ ≤30 min | [unified](./ARCH-10-feature-flag-configuration-debt.md) |
| ARCH-11 | Nullable/Untyped Code & Runtime Error Density | A | estimated | YES (deep-dive tier: runs in deep audits / sprint 2+) | none | deep-dive · `folds_into: ARCH` | 🔷 ~1–2 days | [unified](./ARCH-11-nullable-untyped-code-runtime-error-density.md) |
| ARCH-12 | Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions) | A | estimated | YES (deep-dive tier) | none | deep-dive · `folds_into: ARCH` | 🔷 ~1–2 days | [unified](./ARCH-12-duplicated-cross-cutting-concerns.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).

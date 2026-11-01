# 02 — Architecture & Code Quality

> **Canonical category index.** Base weight: 15% · FE-active weight: 13.5% · Standard indicators: ARCH-01–ARCH-10 · Deep-dive indicators: ARCH-11–ARCH-12
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** Architecture debt is the shape of the code disagreeing with what the code now needs to do. When the shape is wrong, every future feature is a fight.
**Category summary:** Scores the internal structure of the codebase — complexity, coupling, boundaries, dead code, churn hot spots, architectural era, state hygiene, agentic operability, and config/flag discipline. The highest-weight *engineering* category (15%; 13.5% when the Frontend module is active) because architecture determines whether a system can be modernized incrementally at all — by humans *or* by AI tooling — or must be treated as a rewrite candidate.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| ARCH-01 | Cognitive Complexity & God Classes | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-01_cognitive-complexity-god-classes.md) |
| ARCH-02 | Coupling & Cohesion | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-02_coupling-cohesion.md) |
| ARCH-03 | Layer & Boundary Violations | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-03_layer-boundary-violations.md) |
| ARCH-04 | Dead & Orphaned Code | A | measured | YES | none | standard · folds into ARCH category % | ⚡ ≤30 min | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-04_dead-orphaned-code.md) |
| ARCH-05 | Code Churn vs. Defect Hot Spots | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-05_code-churn-vs-defect-hot-spots.md) |
| ARCH-06 | Architectural Era / Framework Generation | A | estimated | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-06_architectural-era-framework-generation.md) |
| ARCH-07 | Global Mutable State & Hidden Dependencies | A | estimated | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-07_global-mutable-state-hidden-dependencies.md) |
| ARCH-08 | Duplication Debt | A | measured | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-08_duplication-debt.md) |
| ARCH-09 | Agentic Operability (AI/LLM Codebase-Readiness) | A | estimated | YES | none | standard · folds into ARCH category % | 🔶 ~2–4 h | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-09_agentic-operability.md) |
| ARCH-10 | Feature-Flag & Configuration Debt | A | estimated | YES | none | standard · folds into ARCH category % | ⚡ ≤30 min | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-10_feature-flag-configuration-debt.md) |
| ARCH-11 | Nullable/Untyped Code & Runtime Error Density | A | estimated | YES (deep-dive tier: runs in deep audits / sprint 2+) | none | deep-dive · `folds_into: ARCH` | 🔷 ~1–2 days | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-11_nullable-untyped-code-runtime-error-density.md) |
| ARCH-12 | Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions) | A | estimated | YES (deep-dive tier) | none | deep-dive · `folds_into: ARCH` | 🔷 ~1–2 days | [unified](./indicators/02_ARCHITECTURE_CODE/ARCH-12_duplicated-cross-cutting-concerns.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.

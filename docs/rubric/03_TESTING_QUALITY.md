# 03 — Testing & Quality Engineering

> **Canonical category index.** Base weight: 10% · FE-active weight: 9% · Standard indicators: TEST-01–TEST-10 · Deep-dive indicators: TEST-09
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** The test suite is the codebase's immune system. When it weakens, every change becomes a gamble — and the codebase stops being safely modifiable at all.
**Category summary:** Scores the health of the quality engineering function — coverage, reliability, shape (pyramid), speed, and gates. A degraded suite is both a *cause* of modernization difficulty (you can't refactor what you can't verify) and a *symptom* of it (tests decay exactly like production code when unowned).

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| TEST-01 | Code Coverage Degradation | A | measured | PART (static proxy per the catalog conventions) | none (feeds TEST-06 contextually) | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./indicators/03_TESTING_QUALITY/TEST-01_code-coverage-degradation.md) |
| TEST-02 | Flaky Test Rate | B | measured | NO — v2 deep scan | none | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./indicators/03_TESTING_QUALITY/TEST-02_flaky-test-rate.md) |
| TEST-03 | Test Pyramid Inversion | A | estimated | YES | none | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./indicators/03_TESTING_QUALITY/TEST-03_test-pyramid-inversion.md) |
| TEST-04 | Test Run Time | B | measured | PART (catalog conventions) | none | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./indicators/03_TESTING_QUALITY/TEST-04_test-run-time.md) |
| TEST-05 | Skipped / Disabled Tests | A | measured | YES | none | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./indicators/03_TESTING_QUALITY/TEST-05_skipped-disabled-tests.md) |
| TEST-06 | Core Domain Untested | B | estimated | PART (catalog conventions) | **G5** — untested core | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./indicators/03_TESTING_QUALITY/TEST-06_core-domain-untested.md) |
| TEST-07 | Test Isolation & Hermeticity | B | estimated | NO — v2 deep scan | none | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./indicators/03_TESTING_QUALITY/TEST-07_test-isolation-hermeticity.md) |
| TEST-08 | Quality Gates in CI | A | measured | YES | none | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./indicators/03_TESTING_QUALITY/TEST-08_quality-gates-in-ci.md) |
| TEST-09 | Mutation Testing Score | B | estimated | NO — v2 deep scan | none | deep-dive · `folds_into: TEST` | 🔷 ~1–2 days | [unified](./indicators/03_TESTING_QUALITY/TEST-09_mutation-testing-score.md) |
| TEST-10 | Test Maintenance Burden | B | estimated | YES | none | standard · folds into TEST category % | 🔷 ~1–2 days | [unified](./indicators/03_TESTING_QUALITY/TEST-10_test-maintenance-burden.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.

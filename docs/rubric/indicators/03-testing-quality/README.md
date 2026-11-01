# 03 — Testing & Quality Engineering

> **Category charter.** Standard indicators: TEST-01–TEST-10 · Deep-dive indicators: TEST-09
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** The test suite is the codebase's immune system. When it weakens, every change becomes a gamble — and the codebase stops being safely modifiable at all.
**Category summary:** Scores the health of the quality engineering function — coverage, reliability, shape (pyramid), speed, and gates. A degraded suite is both a *cause* of modernization difficulty (you can't refactor what you can't verify) and a *symptom* of it (tests decay exactly like production code when unowned).

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| TEST-01 | Code Coverage Degradation | A | measured | PART (static proxy per the catalog conventions) | none (feeds TEST-06 contextually) | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./TEST-01-code-coverage-degradation.md) |
| TEST-02 | Flaky Test Rate | B | measured | NO — v2 deep scan | none | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./TEST-02-flaky-test-rate.md) |
| TEST-03 | Test Pyramid Inversion | A | estimated | YES | none | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./TEST-03-test-pyramid-inversion.md) |
| TEST-04 | Test Run Time | B | measured | PART (catalog conventions) | none | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./TEST-04-test-run-time.md) |
| TEST-05 | Skipped / Disabled Tests | A | measured | YES | none | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./TEST-05-skipped-disabled-tests.md) |
| TEST-06 | Core Domain Untested | B | estimated | PART (catalog conventions) | **G5** — untested core | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./TEST-06-core-domain-untested.md) |
| TEST-07 | Test Isolation & Hermeticity | B | estimated | NO — v2 deep scan | none | standard · folds into TEST category % | 🔶 ~2–4 h | [unified](./TEST-07-test-isolation-hermeticity.md) |
| TEST-08 | Quality Gates in CI | A | measured | YES | none | standard · folds into TEST category % | ⚡ ≤30 min | [unified](./TEST-08-quality-gates-in-ci.md) |
| TEST-09 | Mutation Testing Score | B | estimated | NO — v2 deep scan | none | deep-dive · `folds_into: TEST` | 🔷 ~1–2 days | [unified](./TEST-09-mutation-testing-score.md) |
| TEST-10 | Test Maintenance Burden | B | estimated | YES | none | standard · folds into TEST category % | 🔷 ~1–2 days | [unified](./TEST-10-test-maintenance-burden.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).

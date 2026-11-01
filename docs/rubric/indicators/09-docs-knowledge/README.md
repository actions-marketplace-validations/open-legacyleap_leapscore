# 09 — Documentation & Knowledge Continuity

> **Category charter.** Standard indicators: DOCS-01–DOCS-09 · Deep-dive indicators: DOCS-10
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** Documentation is the difference between a codebase that *is* and a codebase that *can be learned*. In an obsolete system, every question is answered by one person, one memory, or one archaeology session.
**Category summary:** Scores the written knowledge around the codebase — decisions (ADRs), operations (runbooks), onboarding, API surface, changelogs/release communication, and the balance between code comments and self-documenting code. Weighted lowest (5%) because it's amplifyable rather than causal — but it's the category that makes every other debt *discoverable*.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| DOCS-01 | Missing Architectural Decision Records (ADRs) | A | measured | YES | none | standard · folds into DOCS category % | 🔶 ~2–4 h | [unified](./DOCS-01-missing-architectural-decision-records.md) |
| DOCS-02 | Stale / Drifted Documentation | B | estimated | YES | none | standard · folds into DOCS category % | ⚡ ≤30 min | [unified](./DOCS-02-stale-drifted-documentation.md) |
| DOCS-03 | Missing Runbooks & Operational Docs | B | unknown | YES | none | standard · folds into DOCS category % | 🔶 ~2–4 h | [unified](./DOCS-03-missing-runbooks-operational-docs.md) |
| DOCS-04 | No Onboarding Guide / Developer Setup Docs | B | estimated | YES | none | standard · folds into DOCS category % | ⚡ ≤30 min | [unified](./DOCS-04-no-onboarding-guide-developer-setup-docs.md) |
| DOCS-05 | Tribal Knowledge & Oral Tradition | D | unknown | NO | none | standard · folds into DOCS category % | 🔶 ~2–4 h | [unified](./DOCS-05-tribal-knowledge-oral-tradition.md) |
| DOCS-06 | Comment Debt & Self-Documenting Code Imbalance | A | estimated | YES | none | standard · folds into DOCS category % | 🔶 ~2–4 h | [unified](./DOCS-06-comment-debt-self-documenting-code-imbalance.md) |
| DOCS-07 | Missing API Documentation | A | estimated | YES | none | standard · folds into DOCS category % | 🔶 ~2–4 h | [unified](./DOCS-07-missing-api-documentation.md) |
| DOCS-08 | No Release Communication / Changelog | B | measured | YES | none | standard · folds into DOCS category % | 🔶 ~2–4 h | [unified](./DOCS-08-no-release-communication-changelog.md) |
| DOCS-09 | Docs-as-Code & Automation | A | estimated | YES | none | standard · folds into DOCS category % | 🔷 ~1–2 days | [unified](./DOCS-09-docs-as-code-automation.md) |
| DOCS-10 | Knowledge Exit & Documentation Ownership | D | unknown | NO | none | deep-dive · `folds_into: DOCS` | 🔷 ~1–2 days | [unified](./DOCS-10-knowledge-exit-documentation-ownership.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).

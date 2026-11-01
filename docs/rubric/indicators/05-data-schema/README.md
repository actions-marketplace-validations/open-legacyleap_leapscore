# 05 — Data & Schema Evolution

> **Category charter.** Standard indicators: DATA-01–DATA-10 · Deep-dive indicators: DATA-09
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** Data is the one thing a legacy codebase can't throw away. When the schema is a museum and the database is a fortress, the code is just the tip of the iceberg — and the data is where modernization gets expensive.
**Category summary:** Scores the data layer's evolvability — migration discipline, database coupling, integrity, storage technology, locking/scaling behavior, lifecycle management, query performance, and model design. A system can have clean code and a *blighted* data layer; this category catches that.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| DATA-01 | Schema Migration Backlog / "Migration Hell" | A | measured | YES | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./DATA-01-schema-migration-backlog-migration-hell.md) |
| DATA-02 | Database Coupling & Hidden Dependencies | B | estimated | PART (candidate; reconciled against the catalog conventions at completion) | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./DATA-02-database-coupling-hidden-dependencies.md) |
| DATA-03 | Data Integrity & Constraint Degradation | A | measured | PART (candidate; reconciled at completion) | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./DATA-03-data-integrity-constraint-degradation.md) |
| DATA-04 | Legacy Storage Technology | B | unknown | PART (candidate) | none | standard · folds into DATA category % | 🔷 ~1–2 days | [unified](./DATA-04-legacy-storage-technology.md) |
| DATA-05 | Lock Contention & Scaling Bottleneck | B | unknown | NO | none | standard · folds into DATA category % | 🔷 ~1–2 days | [unified](./DATA-05-lock-contention-scaling-bottleneck.md) |
| DATA-06 | Data Lifecycle Management Deficits | B | unknown | PART (candidate) | **G7** — data-rescue risk (as needs-verification in v1) | standard · folds into DATA category % | ⚡ ≤30 min | [unified](./DATA-06-data-lifecycle-management-deficits.md) |
| DATA-07 | ORM / Query Performance Smells | A | estimated | YES | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./DATA-07-orm-query-performance-smells.md) |
| DATA-08 | Schema Overfitting & Model Rigidity | B | estimated | YES | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./DATA-08-schema-overfitting-model-rigidity.md) |
| DATA-09 | Event Sourcing / Audit Readiness | B | unknown | YES (deep-dive tier) | none | deep-dive · `folds_into: DATA` | 🔷 ~1–2 days | [unified](./DATA-09-event-sourcing-audit-readiness.md) |
| DATA-10 | Environment Schema Drift | A | measured | NO | none | standard · folds into DATA category % | 🔷 ~1–2 days | [unified](./DATA-10-environment-schema-drift.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).

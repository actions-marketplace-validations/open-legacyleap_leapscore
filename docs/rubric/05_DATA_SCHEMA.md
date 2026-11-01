# 05 — Data & Schema Evolution

> **Canonical category index.** Base weight: 10% · FE-active weight: 9% · Standard indicators: DATA-01–DATA-10 · Deep-dive indicators: DATA-09
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** Data is the one thing a legacy codebase can't throw away. When the schema is a museum and the database is a fortress, the code is just the tip of the iceberg — and the data is where modernization gets expensive.
**Category summary:** Scores the data layer's evolvability — migration discipline, database coupling, integrity, storage technology, locking/scaling behavior, lifecycle management, query performance, and model design. A system can have clean code and a *blighted* data layer; this category catches that.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| DATA-01 | Schema Migration Backlog / "Migration Hell" | A | measured | YES | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./indicators/05_DATA_SCHEMA/DATA-01_schema-migration-backlog-migration-hell.md) |
| DATA-02 | Database Coupling & Hidden Dependencies | B | estimated | PART (candidate; reconciled against the catalog conventions at completion) | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./indicators/05_DATA_SCHEMA/DATA-02_database-coupling-hidden-dependencies.md) |
| DATA-03 | Data Integrity & Constraint Degradation | A | measured | PART (candidate; reconciled at completion) | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./indicators/05_DATA_SCHEMA/DATA-03_data-integrity-constraint-degradation.md) |
| DATA-04 | Legacy Storage Technology | B | unknown | PART (candidate) | none | standard · folds into DATA category % | 🔷 ~1–2 days | [unified](./indicators/05_DATA_SCHEMA/DATA-04_legacy-storage-technology.md) |
| DATA-05 | Lock Contention & Scaling Bottleneck | B | unknown | NO | none | standard · folds into DATA category % | 🔷 ~1–2 days | [unified](./indicators/05_DATA_SCHEMA/DATA-05_lock-contention-scaling-bottleneck.md) |
| DATA-06 | Data Lifecycle Management Deficits | B | unknown | PART (candidate) | **G7** — data-rescue risk (as needs-verification in v1) | standard · folds into DATA category % | ⚡ ≤30 min | [unified](./indicators/05_DATA_SCHEMA/DATA-06_data-lifecycle-management-deficits.md) |
| DATA-07 | ORM / Query Performance Smells | A | estimated | YES | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./indicators/05_DATA_SCHEMA/DATA-07_orm-query-performance-smells.md) |
| DATA-08 | Schema Overfitting & Model Rigidity | B | estimated | YES | none | standard · folds into DATA category % | 🔶 ~2–4 h | [unified](./indicators/05_DATA_SCHEMA/DATA-08_schema-overfitting-model-rigidity.md) |
| DATA-09 | Event Sourcing / Audit Readiness | B | unknown | YES (deep-dive tier) | none | deep-dive · `folds_into: DATA` | 🔷 ~1–2 days | [unified](./indicators/05_DATA_SCHEMA/DATA-09_event-sourcing-audit-readiness.md) |
| DATA-10 | Environment Schema Drift | A | measured | NO | none | standard · folds into DATA category % | 🔷 ~1–2 days | [unified](./indicators/05_DATA_SCHEMA/DATA-10_environment-schema-drift.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.

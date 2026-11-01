# DATA-01 — Schema Migration Backlog / "Migration Hell"

> **Category:** [Data & Schema Evolution](../../05_DATA_SCHEMA.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | DATA-01 |
| Name | Schema Migration Backlog / "Migration Hell" |
| Category | DATA — Data & Schema Evolution |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 ~2–4 h — migration inventory + env drift comparison. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Database schema changes have accumulated into an unmanageable backlog — dozens of unapplied migrations, long-running one-off migration jobs, destructive or manual schema changes, or a schema that's been mutated directly with no migration history at all.
- **Why it signals obsolescence:** Migration discipline is the data layer's version control. When migrations are lost, batched, or manual, the schema drifts from the code's expectations, every deployment becomes a coin-flip, and the team's fear of touching the schema freezes all feature work. It's the single most common reason legacy systems *can't* be modernized in place.
- **Where it manifests:** Migration folder with 400+ files, `db:schema:load` instead of migrations, manual `ALTER TABLE` statements in runbooks, "schema drift" warnings in CI, a migration that "takes 6 hours to run," migrations modifying prod directly from a laptop, no migration from empty schema for a new environment.
- **Objective metric:** `migration backlog (# unapplied)`; `schema-drift count across environments`; `# of destructive/non-reversible migrations`; `max migration runtime`; `CI schema-rebuild success rate from clean`.
- **Yellow flag (warning):** 10+ pending migrations or one long-running (> 30 min) migration pending; a little env drift. *(Rationale: warning — friction is rising, deployments start to be scary.)*
- **Red flag (critical):** Schema changed ad hoc/manually in prod, or migrations are destructive/lossy as normal practice, or a fresh environment cannot be built from migrations. *(Rationale: the schema is no longer reproducible — the data layer is beyond migration discipline and needs reconstitution.)*
- **Example symptom:** "The new hire tries to spin up a local DB. `db:migrate` says 'no pending migrations' but 30 tables called `_old` exist. Prod schemas differ from the repo by 19 columns. Nobody runs migrations anymore — the DBA 'applies them by hand' on Fridays."
- **Blast radius:** Deployment reliability, feature velocity, on-call load, data loss risk, modernization feasibility.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = migrations only, clean builds; 2 = backlog/tolerable drift; 1 = long-running or partially manual migrations; 0 = manual/destructive schema mutation, irreproducible.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: bring migrations under tooling (alembic/flyway/prisma), reconcile the drift between envs with a verified baseline, add a CI "fresh build from migrations" check. Structural fix: adopt expand-contract migration practice (expanding then contracting changes, reversible when possible), split long migrations into batched incremental jobs, freeze manual-DDL policy, build from migrations as the only path to a new env.
- **Gold standard / target state:** Migrations are the only way the schema changes; environments provably identical from clean builds; migrations are reversible and fast; zero manual DDL.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** migration-dir detectors + parsers: Alembic (`versions/`), Django migrations, Prisma, Rails `db/migrate`, Flyway/Liquibase layouts, EF/Knex/TypeORM; destructive-op grep (`DROP TABLE|COLUMN`, `RENAME`, `DELETE FROM` without WHERE) over migration bodies
- **Rate-cost:** none
- **Ecosystems:** agnostic (per-tool adapters)
- **Applicability:** `na_when: exhaustive enumeration shows no persistence layer at all` — zero migration dirs ∧ zero DB drivers in parsed manifests ∧ zero schema files (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Migration inventory — count migration files vs. applied versions in each env (`prisma migrate status`, `alembic heads`, Rails version table, Flyway report); check for drift between environments (compare `schema.rb`/`schema.sql` vs. actual DB); look for destructive operations in migration history (`DROP`, `RENAME` without backfill); measure time and safety of latest migrations (are they reversible?).

1. Detect migration framework(s); enumerate migration files with timestamps.
2. Backlog proxy: unapplied set is not knowable from repo → use **pending-style signals**: files newer than last release tag touching non-migration code, squash/amend markers, `down_revision` graph cycles.
3. Destructive ops per migration file; manual-SQL share (raw `op.execute`/`run_sql` ratio).
4. Fresh-build-ability proxy: can the chain replay linearly from empty (graph connectivity check, no missing parents).

Preconditions: ≥1 migration dir or ORM manifest.

## 7. Fact schema

```json
{"data01": {
  "framework": "alembic", "migration_count": 214,
  "chain_replayable": true,
  "destructive_ops": [{"file": "0203_drop_legacy.py", "ops": ["DROP TABLE"]}],
  "raw_sql_share": 0.31,
  "graph_cycles": 0}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  framework detected and >=1 migration parsed     # inventory facts only
estimated_when: raw-SQL-heavy chains where op semantics unparseable   # clamp [1,2], confidence low
unknown_when:   persistence suspected (DB driver present) but zero migration artifacts -> cannot distinguish "schemaless" from "invisible"
na_when:        clause-b fired (no persistence layer)
clamp:          [1,2]
confidence:     medium
scope_limited:  multi-framework monorepo -> per-root aggregation + scope-limited if truncated
```

### Score mapping predicates

Y/R values: see §3.

- `3`: linear replayable chain ∧ no destructive ops ∧ low raw-SQL share
- `2`: backlog pressure signals (recent pile-up), chain still clean
- `1`: destructive/manual ops present outside core tables ∨ partial graph gaps
- `0`: unreplayable chain (missing parents/cycles) ∧ destructive ops on core tables

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Mixed frameworks → aggregate counts; >3 frameworks → scope-limited note

## 10. Evidence and output

### Evidence string

```
evidence: "migrations({fw}): {n} files; replayable={bool}; destructive={k} ({files}); raw-sql {p}%"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Migration mechanics/backlog; schema shape debt is DATA-08, cross-env drift is DATA-10.

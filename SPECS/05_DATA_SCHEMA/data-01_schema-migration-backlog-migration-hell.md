# DATA-01 — Schema Migration Backlog / "Migration Hell" — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human · engine: migration inventory pass |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-01 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** migration-dir detectors + parsers: Alembic (`versions/`), Django migrations, Prisma, Rails `db/migrate`, Flyway/Liquibase layouts, EF/Knex/TypeORM; destructive-op grep (`DROP TABLE|COLUMN`, `RENAME`, `DELETE FROM` without WHERE) over migration bodies
- **Rate-cost:** none
- **Ecosystems:** agnostic (per-tool adapters)
- **Applicability:** `na_when: exhaustive enumeration shows no persistence layer at all` — zero migration dirs ∧ zero DB drivers in parsed manifests ∧ zero schema files (clause-b). Else applicable.

## 2. Detection recipe

1. Detect migration framework(s); enumerate migration files with timestamps.
2. Backlog proxy: unapplied set is not knowable from repo → use **pending-style signals**: files newer than last release tag touching non-migration code, squash/amend markers, `down_revision` graph cycles.
3. Destructive ops per migration file; manual-SQL share (raw `op.execute`/`run_sql` ratio).
4. Fresh-build-ability proxy: can the chain replay linearly from empty (graph connectivity check, no missing parents).

Preconditions: ≥1 migration dir or ORM manifest.

## 3. Fact schema

```json
{"data01": {
  "framework": "alembic", "migration_count": 214,
  "chain_replayable": true,
  "destructive_ops": [{"file": "0203_drop_legacy.py", "ops": ["DROP TABLE"]}],
  "raw_sql_share": 0.31,
  "graph_cycles": 0}}
```

## 4. Statusing rules

```yaml
measured_when:  framework detected and >=1 migration parsed     # inventory facts only
estimated_when: raw-SQL-heavy chains where op semantics unparseable   # clamp [1,2], confidence low
unknown_when:   persistence suspected (DB driver present) but zero migration artifacts -> cannot distinguish "schemaless" from "invisible"
na_when:        clause-b fired (no persistence layer)
clamp:          [1,2]
confidence:     medium
scope_limited:  multi-framework monorepo -> per-root aggregation + scope-limited if truncated
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §DATA-01.

- `3`: linear replayable chain ∧ no destructive ops ∧ low raw-SQL share
- `2`: backlog pressure signals (recent pile-up), chain still clean
- `1`: destructive/manual ops present outside core tables ∨ partial graph gaps
- `0`: unreplayable chain (missing parents/cycles) ∧ destructive ops on core tables

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Mixed frameworks → aggregate counts; >3 frameworks → scope-limited note

## 8. Evidence string

```
evidence: "migrations({fw}): {n} files; replayable={bool}; destructive={k} ({files}); raw-sql {p}%"
```

## 9. Scope/overlaps echo

Migration mechanics/backlog; schema shape debt is DATA-08, cross-env drift is DATA-10.

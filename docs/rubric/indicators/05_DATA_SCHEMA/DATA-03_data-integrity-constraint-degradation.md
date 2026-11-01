# DATA-03 — Data Integrity & Constraint Degradation

> **Category:** [Data & Schema Evolution](../../05_DATA_SCHEMA.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | DATA-03 |
| Name | Data Integrity & Constraint Degradation |
| Category | DATA — Data & Schema Evolution |
| Engine tier | A |
| Default status | measured |
| v1 flag | PART (candidate; reconciled at completion) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 ~2–4 h — catalog audit + integrity probe queries. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The schema lacks integrity guards — missing foreign keys, no `NOT NULL`/`CHECK` constraints, no uniqueness, untyped or loose-typed columns — so the database silently accepts invalid, duplicate, and orphaned data.
- **Why it signals obsolescence:** Constraints are the DB's own test suite. Their absence means the data degrades silently, every query becomes an "is the data even valid?" compromise, and application code must re-defend against garbage that should've been impossible. Integrity debt is a leading driver of "we can't trust the numbers."
- **Where it manifests:** Tables without FKs (often from the era before InnoDB FKs), columns storing `"true"`/`"false"` strings, nullable columns that every code path treats as required, duplicate identity rows, orphaned children, no unique index on natural keys, `"0.00"` price strings.
- **Objective metric:** `% of cross-table relationships with FKs`; `# of orphaned/duplicate rows`; `# of string/loose-typed columns`; `# of nullable-but-required columns`; `constraint coverage %`.
- **Yellow flag (warning):** Missing constraints in non-core tables; occasional orphaned rows; some loose-typed columns. *(Rationale: warning — data is 95% fine, the guard is just patchy.)*
- **Red flag (critical):** No FKs/constraints in core tables, silent data corruption patterns (duplicate identities, orphaned money rows), or app code compensating with cleanup jobs as a permanent state. *(Rationale: the database has no integrity guarantee at all — "cleanup scripts" are the sound of it failing.)*
- **Example symptom:** "The `payments` and `invoices` tables have no FK. A dedupe job runs nightly to delete 'duplicate' invoices. The CFO asks why the sum on two dashboards differs. Because nothing on Earth guarantees an invoice belongs to one payment."
- **Blast radius:** Reporting accuracy, money bugs, reconciliation work, migration risk (bad data breaks schema changes), trust in the product.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = constraints high, probes green; 2 = gaps in non-core tables; 1 = core gaps with cleanup-job compensation; 0 = no integrity guarantee, silent corruption.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add the missing FKs/unique indexes (backfill orphans first, then constraint), fix the top data-quality violations. Structural fix: constraints-when-shipping policy, data-quality probes as recurring CI/data checks, typed columns everywhere, a data steward owns integrity.
- **Gold standard / target state:** FKs + constraints close to 100%, integrity probes green, zero known duplicate/orphan patterns, cleanup jobs retired.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** schema-definition parsers: migration chains (DATA-01 reuse), `schema.rb`/`structure.sql`, Prisma schema, SQLAlchemy models, Django models; constraint extractors (`FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`, ORM-level `ForeignKey`/`unique`)
- **Rate-cost:** none
- **Ecosystems:** agnostic via adapters
- **Applicability:** DATA-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Schema audit — query the SQL catalog for FK/constraint coverage (`information_schema`), run integrity probes (find orphaned rows: `SELECT * FROM child LEFT JOIN parent ... WHERE parent IS NULL`), check for duplicate natural keys, check column types vs. code expectations; DB lint tools (e.g., `sqllint`, custom SQL); compare the schema's promises to the ORM's assumptions.

1. Reconstruct latest declared schema state from migration chain replay or snapshot schema file.
2. Per table: FK coverage of reference-shaped columns (`*_id`), UNIQUE on natural keys, CHECK density, NOT NULL share.
3. Orphan-risk heuristic: child tables with `*_id` columns lacking any declared FK.
4. Live-catalog verification + orphan-row probes are runtime plane → "what it takes" emission.

Preconditions: reconstructable schema state.

## 7. Fact schema

```json
{"data03": {
  "tables": 48,
  "fk_coverage_pct": 62.0,
  "ref_cols_without_fk": [{"table": "orders", "cols": ["customer_id"]}],
  "check_constraints_total": 9,
  "not_null_share": 0.71}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # declared ≠ enforced; drift possible
estimated_when: >=80% of tables reconstructed # clamp [1,2]; confidence medium iff full chain replayable
unknown_when:   schema state unreconstructable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium with complete replay; low from partial snapshots
scope_limited:  sampled table set -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: constraints mostly present (`fk_coverage >= Y_FK`), gaps in non-core tables
- `1`: `fk_coverage < Y_FK` ∨ core-table ref-columns without FK
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Snapshot-only repos (no migrations): parse `schema.rb`/`structure.sql` directly, confidence low

## 10. Evidence and output

### Evidence string

```
basis: "declared-schema {n} tables: FK {p}%; missing FK e.g. {examples}; checks {c} [declared≠enforced]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Integrity constraint posture; the coupling those schemas create is DATA-02; shape rigidity is DATA-08.

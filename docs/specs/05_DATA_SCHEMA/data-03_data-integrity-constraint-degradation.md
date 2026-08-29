# DATA-03 — Data Integrity & Constraint Degradation — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (declared-constraints proxy from migrations/schema files; encyc said A·measured — live catalog unreachable) |
| v1 flag | PART (candidate; reconciled at completion) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human (live probes) · engine: declared-schema audit |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-03 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** schema-definition parsers: migration chains (DATA-01 reuse), `schema.rb`/`structure.sql`, Prisma schema, SQLAlchemy models, Django models; constraint extractors (`FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`, ORM-level `ForeignKey`/`unique`)
- **Rate-cost:** none
- **Ecosystems:** agnostic via adapters
- **Applicability:** DATA-01 clause-b. Else applicable.

## 2. Detection recipe

1. Reconstruct latest declared schema state from migration chain replay or snapshot schema file.
2. Per table: FK coverage of reference-shaped columns (`*_id`), UNIQUE on natural keys, CHECK density, NOT NULL share.
3. Orphan-risk heuristic: child tables with `*_id` columns lacking any declared FK.
4. Live-catalog verification + orphan-row probes are runtime plane → "what it takes" emission.

Preconditions: reconstructable schema state.

## 3. Fact schema

```json
{"data03": {
  "tables": 48,
  "fk_coverage_pct": 62.0,
  "ref_cols_without_fk": [{"table": "orders", "cols": ["customer_id"]}],
  "check_constraints_total": 9,
  "not_null_share": 0.71}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # declared ≠ enforced; drift possible
estimated_when: >=80% of tables reconstructed # clamp [1,2]; confidence medium iff full chain replayable
unknown_when:   schema state unreconstructable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium with complete replay; low from partial snapshots
scope_limited:  sampled table set -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §DATA-03. Estimated ⇒ score ∈ {1,2}:

- `2`: constraints mostly present (`fk_coverage >= Y_FK`), gaps in non-core tables
- `1`: `fk_coverage < Y_FK` ∨ core-table ref-columns without FK
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Snapshot-only repos (no migrations): parse `schema.rb`/`structure.sql` directly, confidence low

## 8. Evidence string

```
basis: "declared-schema {n} tables: FK {p}%; missing FK e.g. {examples}; checks {c} [declared≠enforced]"
```

## 9. Scope/overlaps echo

Integrity constraint posture; the coupling those schemas create is DATA-02; shape rigidity is DATA-08.

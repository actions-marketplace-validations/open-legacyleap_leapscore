# DATA-07 — ORM / Query Performance Smells — Implementation Spec

> **Authority:** This file defines the DATA-07 implementation contract. The [DATA rubric category](../../rubric/05_DATA_SCHEMA.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; matrix said C) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human (query logs) · engine: pattern sweep |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-07 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** ORM-aware matcher packs: N+1 shapes (query call inside loop over relation results; `all()` then per-item lazy loads), missing-select-related hints (`prefetch_related`/`select_related`/`includes` absence in serializers), raw-SQL string interpolation, unbounded `.all()` result materialization, index-hint absence on hot-path filters (declared-index cross-check from DATA-03 schema state)
- **Rate-cost:** none
- **Ecosystems:** Django/Rails/Hibernate/EF/Prisma/Knex adapters
- **Applicability:** `na_when: no ORM or query-building code detected` (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Detect ORM(s) from imports/config.
2. Run N+1-shape matchers over query-call sites; join to core-path set.
3. Cross-reference filter columns against declared indexes (DATA-03 fact recomputed inline if absent).
4. Query-log confirmation is runtime plane → "what it takes" emission.

Preconditions: ORM adapter available.

## 3. Fact schema

```json
{"data07": {
  "orm": "django", "n1_suspects": [{"file": "api/views.py", "shape": "loop .filter"}],
  "n1_in_core": 6,
  "unindexed_hot_filters": [{"model": "Order", "col": "status"}],
  "raw_sql_interpolation_sites": 3}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # N+1 confirmation needs execution
estimated_when: >=1 ORM pack ran               # clamp [1,2]; confidence medium when schema cross-check joined
unknown_when:   no supported ORM parsed
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium with index cross-check; low without
scope_limited:  sampled modules -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §DATA-07. Estimated ⇒ score ∈ {1,2}:

- `2`: smell sites exist outside core paths only
- `1`: N+1-able patterns in core request paths ∨ unindexed hot filters on core tables
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Multiple ORMs → aggregate; >2 → scope-limited

## 8. Evidence string

```
basis: "orm-scan({orm}): {k} N+1 suspects ({c} core); {u} unindexed hot filters [static shapes]"
```

## 9. Scope/overlaps echo

Query-shape smells in code; live contention is DATA-05, coupling via shared schemas DATA-02.

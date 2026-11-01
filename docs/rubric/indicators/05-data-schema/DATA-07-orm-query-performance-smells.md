# DATA-07 — ORM / Query Performance Smells

> **Category:** [Data & Schema Evolution](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | DATA-07 |
| Name | ORM / Query Performance Smells |
| Category | DATA — Data & Schema Evolution |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 ~2–4 h — ORM logging + EXPLAIN session. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The ORM layer generates bad queries — N+1 races, lazy-loading storms, implicit projection of entire rows, missing eager loading, cartesian products from bad fetches — and there's no index/query strategy to compensate. Application code triggers data-layer crashes under real use.
- **Why it signals obsolescence:** ORM abuse is the classic "the code works on the test fixtures" trap: SQL looks fine, then dies at 10× data. It's a sign the data layer was written without a performance understanding, then never revisited — two generations of schema and data growth later, it's a query minefield.
- **Where it manifests:** N+1 in list endpoints (1 query + N queries per row), lazy loads in loops, giant `SELECT *`, fetch bypassing indexes, unused indexes, missing indexes on query-adjacent columns, "works in dev, dies in prod," SQL in logs showing 4,000 queries per request.
- **Objective metric:** `queries per request (p50/p95)`; `N+1 count (repeated identical queries)`; `avg row width fetched vs. needed`; `# of missing indexes on hot paths`; `unused index ratio`.
- **Yellow flag (warning):** N+1 and wide fetches in non-critical endpoints; query counts 2–5× reasonable. *(Rationale: warning — slow but not on fire.)*
- **Red flag (critical):** N+1/implicit queries in core flows causing timeouts under moderate data, or no index strategy at all while slow-query logs show the same misses daily. *(Rationale: the data layer degrades linearly with growth — a time bomb.)*
- **Example symptom:** "Loading the customer list fires 3,000 SQL statements: one for the page, then 2,999 to lazy-load each address. In dev it's snappy with 10 customers. The sales team's 40k-customer search spins for 40 seconds and times out."
- **Blast radius:** Latency, timeout incidents, DB CPU, user experience, p99 blowups, cost.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = query budgets + clean; 2 = smells in non-core; 1 = core smells, timeouts occasionally; 0 = core N+1 storms / no index strategy.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: fix the top 10 N+1s with eager loading/joins, add the missing indexes on the hot path, reduce column projection. Structural fix: query budget per endpoint (assert queries-per-request in tests), index strategy documented and reviewed, offload heavy reads (search, aggregates) to appropriate engines, performance tests with realistic data volume in CI.
- **Gold standard / target state:** Query counts per endpoint budgeted and tested, N+1 class eliminated, index strategy current, p95 latency flat as data grows 10×.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** ORM-aware matcher packs: N+1 shapes (query call inside loop over relation results; `all()` then per-item lazy loads), missing-select-related hints (`prefetch_related`/`select_related`/`includes` absence in serializers), raw-SQL string interpolation, unbounded `.all()` result materialization, index-hint absence on hot-path filters (declared-index cross-check from DATA-03 schema state)
- **Rate-cost:** none
- **Ecosystems:** Django/Rails/Hibernate/EF/Prisma/Knex adapters
- **Applicability:** `na_when: no ORM or query-building code detected` (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** ORM query analysis — enable query logging (Django debug toolbar, Rails logger SQL, Hibernate stats, Entity Framework SQL log), count queries per endpoint, look for N+1 patterns (same query × N), use perf tooling (Bullet gem, django-silk, SQLAlchemy `echo`), `EXPLAIN` on generated SQL, index-usage stats (`pg_stat_user_indexes`, Percona).

1. Detect ORM(s) from imports/config.
2. Run N+1-shape matchers over query-call sites; join to core-path set.
3. Cross-reference filter columns against declared indexes (DATA-03 fact recomputed inline if absent).
4. Query-log confirmation is runtime plane → "what it takes" emission.

Preconditions: ORM adapter available.

## 7. Fact schema

```json
{"data07": {
  "orm": "django", "n1_suspects": [{"file": "api/views.py", "shape": "loop .filter"}],
  "n1_in_core": 6,
  "unindexed_hot_filters": [{"model": "Order", "col": "status"}],
  "raw_sql_interpolation_sites": 3}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # N+1 confirmation needs execution
estimated_when: >=1 ORM pack ran               # clamp [1,2]; confidence medium when schema cross-check joined
unknown_when:   no supported ORM parsed
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium with index cross-check; low without
scope_limited:  sampled modules -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: smell sites exist outside core paths only
- `1`: N+1-able patterns in core request paths ∨ unindexed hot filters on core tables
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Multiple ORMs → aggregate; >2 → scope-limited

## 10. Evidence and output

### Evidence string

```
basis: "orm-scan({orm}): {k} N+1 suspects ({c} core); {u} unindexed hot filters [static shapes]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Query-shape smells in code; live contention is DATA-05, coupling via shared schemas DATA-02.

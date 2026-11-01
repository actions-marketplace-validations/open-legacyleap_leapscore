# DATA-02 — Database Coupling & Hidden Dependencies — Implementation Spec

> **Authority:** This file defines the DATA-02 implementation contract. The [DATA rubric category](../../rubric/05_DATA_SCHEMA.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (in-repo config enumeration only; encyc B·estimated, matrix C·unknown) |
| v1 flag | PART (candidate; reconciled against `docs/plans/04` §5 at completion) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human · engine: connection-config sweep |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-02 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** connection-string/env-template enumeration (`DATABASE_URL`-class vars across service roots, docker-compose services, `settings/*.py`, `application*.yml`); cross-schema JOIN grep (`JOIN <other_schema>.`); stored-proc inventory (`CREATE PROCEDURE/FUNCTION` in migrations/sql dirs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: DATA-01 clause-b fired` (no persistence layer). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Build in-repo DB inventory: logical DB names from connection configs per service root.
2. Shared-DB detection: same logical DB referenced by ≥2 service roots (monorepo; cross-repo sharing is org plane → emission text).
3. Cross-context table access: schema/table-family names referenced outside their owning module's dir convention.
4. Stored-proc count + business-logic heuristic (proc bodies > N lines with control flow).

Preconditions: ≥1 service root with DB config.

## 3. Fact schema

```json
{"data02": {
  "logical_dbs": ["orders", "billing"],
  "shared_db_services": [{"db": "orders", "roots": ["api", "worker", "reports"]}],
  "cross_context_joins": 3,
  "stored_procs": {"count": 12, "logic_heavy": 5}}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # coupling judgment over partial topology is inferential
estimated_when: >=1 service root with DB configs enumerated   # clamp [1,2]; confidence medium in monorepo
unknown_when:   DB configs live outside repo (env-injected only, no templates)
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium monorepo / low single-root
scope_limited:  multi-repo system -> estimated + scope-limited ("system topology beyond repo")
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DATA-02. Estimated ⇒ score ∈ {1,2}:

- `2`: shared DBs or occasional cross-joins detected, no proc logic
- `1`: shared DB ∧ logic-heavy procs ∨ pervasive cross-context joins
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Secrets-shaped values in connection strings are not read (SEC-02's row); only identifiers parsed

## 8. Evidence string

```
basis: "db-coupling: {d} logical DBs; shared by {s} roots ({worst}); procs {p} (logic-heavy {h})"
```

## 9. Scope/overlaps echo

DB-level coupling between services; intra-repo module import coupling is ARCH-02, integration-point count is API-03.

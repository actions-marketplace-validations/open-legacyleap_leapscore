# DATA-02 — Database Coupling & Hidden Dependencies

> **Category:** [Data & Schema Evolution](../../05_DATA_SCHEMA.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | DATA-02 |
| Name | Database Coupling & Hidden Dependencies |
| Category | DATA — Data & Schema Evolution |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART (candidate; reconciled against the catalog conventions at completion) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 ~2–4 h — connection/config audit + query scan. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The "system" is really one shared database — services write to the same tables, stored procedures contain business logic, foreign keys and joins reach across bounded contexts, and schema changes to one domain break another.
- **Why it signals obsolescence:** DB coupling is how microservice-shaped codebases secretly remain monoliths. It defeats independent deployment (one team migrates, everyone breaks), ties all teams to one bottleneck, and makes any modernization a single point. It's the data-layer echo of ARCH-02/ARCH-03.
- **Where it manifests:** Multiple services connecting to one DB, cross-service `SELECT` and `JOIN`s, stored procedures with business rules, shared tables across contexts, no enforced ownership boundaries, migrations affecting other teams' services.
- **Objective metric:** `# of services sharing a DB`; `# of cross-context joins/queries`; `# of stored procedures containing business logic`; `schema ownership: single vs. per-service`.
- **Yellow flag (warning):** Several services share a DB but write mostly to separate tables; some cross-context reads. *(Rationale: warning — coupling exists, still manageable with discipline.)*
- **Red flag (critical):** Services share tables write-path, business logic lives in stored procedures, or any service queries another's tables directly as normal practice. *(Rationale: the seas are one body — no independent change is possible.)*
- **Example symptom:** "Billing rewrites their `invoice` table. The reporting service's nightly job — which reads that exact table — breaks. Nobody knew it depended on it. 'The system is one big database wearing services as clothes.'"
- **Blast radius:** Independent deployability, team autonomy, schema-change blast radius, scaling (single DB bottleneck), modernization sequencing.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = owned schemas, API/event boundaries; 2 = shared DB, separate tables; 1 = cross-context reads/joins; 0 = shared write-path or proc-based logic.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: document all cross-service DB reads/writes (the hidden map), move the worst cross-read behind an API or event. Structural fix: bounded-context data ownership with a public API/event boundary per service, migrate stored-proc logic into application code, run schema ownership checks in CI.
- **Gold standard / target state:** Each service owns its tables; cross-context access is via API/events only; zero business logic in stored procedures; a change to one context can't break another.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** connection-string/env-template enumeration (`DATABASE_URL`-class vars across service roots, docker-compose services, `settings/*.py`, `application*.yml`); cross-schema JOIN grep (`JOIN <other_schema>.`); stored-proc inventory (`CREATE PROCEDURE/FUNCTION` in migrations/sql dirs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: DATA-01 clause-b fired` (no persistence layer). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Query/connection analysis — enumerate DB connections per service from configs; inspect schemas for cross-context tables; grep for `JOIN` across table families; check stored-procedure counts and whether logic lives in them; look at who owns the schema (single DBA? a team?). Tools: DB schema diagrams, `pg_stat_activity` connection mapping, code search for cross-service table names.

1. Build in-repo DB inventory: logical DB names from connection configs per service root.
2. Shared-DB detection: same logical DB referenced by ≥2 service roots (monorepo; cross-repo sharing is org plane → emission text).
3. Cross-context table access: schema/table-family names referenced outside their owning module's dir convention.
4. Stored-proc count + business-logic heuristic (proc bodies > N lines with control flow).

Preconditions: ≥1 service root with DB config.

## 7. Fact schema

```json
{"data02": {
  "logical_dbs": ["orders", "billing"],
  "shared_db_services": [{"db": "orders", "roots": ["api", "worker", "reports"]}],
  "cross_context_joins": 3,
  "stored_procs": {"count": 12, "logic_heavy": 5}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # coupling judgment over partial topology is inferential
estimated_when: >=1 service root with DB configs enumerated   # clamp [1,2]; confidence medium in monorepo
unknown_when:   DB configs live outside repo (env-injected only, no templates)
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium monorepo / low single-root
scope_limited:  multi-repo system -> estimated + scope-limited ("system topology beyond repo")
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: shared DBs or occasional cross-joins detected, no proc logic
- `1`: shared DB ∧ logic-heavy procs ∨ pervasive cross-context joins
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Secrets-shaped values in connection strings are not read (SEC-02's row); only identifiers parsed

## 10. Evidence and output

### Evidence string

```
basis: "db-coupling: {d} logical DBs; shared by {s} roots ({worst}); procs {p} (logic-heavy {h})"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

DB-level coupling between services; intra-repo module import coupling is ARCH-02, integration-point count is API-03.

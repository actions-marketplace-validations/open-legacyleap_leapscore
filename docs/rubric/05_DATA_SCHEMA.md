# 05 — Data & Schema Evolution

> **Weight:** 10% base · 9% FE-active · **Standard:** DATA-01…08 · **Deep-dive:** DATA-09, 10
>
> **One-line thesis:** Data is the one thing a legacy codebase can't throw away. When the schema is a museum and the database is a fortress, the code is just the tip of the iceberg — and the data is where modernization gets expensive.

**Category summary:** Scores the data layer's evolvability — migration discipline, database coupling, integrity, storage technology, locking/scaling behavior, lifecycle management, query performance, and model design. A system can have clean code and a *blighted* data layer; this category catches that.

---

## Standard indicators

### DATA-01 — Schema Migration Backlog / "Migration Hell"
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** migration backlog and reversibility; environment drift is DATA-10.
- **Definition:** Database schema changes have accumulated into an unmanageable backlog — dozens of unapplied migrations, long-running one-off migration jobs, destructive or manual schema changes, or a schema that's been mutated directly with no migration history at all.
- **Why it signals obsolescence:** Migration discipline is the data layer's version control. When migrations are lost, batched, or manual, the schema drifts from the code's expectations, every deployment becomes a coin-flip, and the team's fear of touching the schema freezes all feature work. It's the single most common reason legacy systems *can't* be modernized in place.
- **Where it manifests:** Migration folder with 400+ files, `db:schema:load` instead of migrations, manual `ALTER TABLE` statements in runbooks, "schema drift" warnings in CI, a migration that "takes 6 hours to run," migrations modifying prod directly from a laptop, no migration from empty schema for a new environment.
- **Detection method:** Migration inventory — count migration files vs. applied versions in each env (`prisma migrate status`, `alembic heads`, Rails version table, Flyway report); check for drift between environments (compare `schema.rb`/`schema.sql` vs. actual DB); look for destructive operations in migration history (`DROP`, `RENAME` without backfill); measure time and safety of latest migrations (are they reversible?).
- **Objective metric:** `migration backlog (# unapplied)`; `schema-drift count across environments`; `# of destructive/non-reversible migrations`; `max migration runtime`; `CI schema-rebuild success rate from clean`.
- **Yellow flag (warning):** 10+ pending migrations or one long-running (> 30 min) migration pending; a little env drift. *(Rationale: warning — friction is rising, deployments start to be scary.)*
- **Red flag (critical):** Schema changed ad hoc/manually in prod, or migrations are destructive/lossy as normal practice, or a fresh environment cannot be built from migrations. *(Rationale: the schema is no longer reproducible — the data layer is beyond migration discipline and needs reconstitution.)*
- **Example symptom:** "The new hire tries to spin up a local DB. `db:migrate` says 'no pending migrations' but 30 tables called `_old` exist. Prod schemas differ from the repo by 19 columns. Nobody runs migrations anymore — the DBA 'applies them by hand' on Fridays."
- **Blast radius:** Deployment reliability, feature velocity, on-call load, data loss risk, modernization feasibility.
- **Remediation playbook:** Quick win: bring migrations under tooling (alembic/flyway/prisma), reconcile the drift between envs with a verified baseline, add a CI "fresh build from migrations" check. Structural fix: adopt expand-contract migration practice (expanding then contracting changes, reversible when possible), split long migrations into batched incremental jobs, freeze manual-DDL policy, build from migrations as the only path to a new env.
- **Gold standard / target state:** Migrations are the only way the schema changes; environments provably identical from clean builds; migrations are reversible and fast; zero manual DDL.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = migrations only, clean builds; 2 = backlog/tolerable drift; 1 = long-running or partially manual migrations; 0 = manual/destructive schema mutation, irreproducible.
- **Verify effort:** 🔶 ~2–4 h — migration inventory + env drift comparison.

### DATA-02 — Database Coupling & Hidden Dependencies
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** cross-service ownership boundaries; code-level coupling is ARCH-02, layer leaks are ARCH-03.
- **Definition:** The "system" is really one shared database — services write to the same tables, stored procedures contain business logic, foreign keys and joins reach across bounded contexts, and schema changes to one domain break another.
- **Why it signals obsolescence:** DB coupling is how microservice-shaped codebases secretly remain monoliths. It defeats independent deployment (one team migrates, everyone breaks), ties all teams to one bottleneck, and makes any modernization a single point. It's the data-layer echo of ARCH-02/ARCH-03.
- **Where it manifests:** Multiple services connecting to one DB, cross-service `SELECT` and `JOIN`s, stored procedures with business rules, shared tables across contexts, no enforced ownership boundaries, migrations affecting other teams' services.
- **Detection method:** Query/connection analysis — enumerate DB connections per service from configs; inspect schemas for cross-context tables; grep for `JOIN` across table families; check stored-procedure counts and whether logic lives in them; look at who owns the schema (single DBA? a team?). Tools: DB schema diagrams, `pg_stat_activity` connection mapping, code search for cross-service table names.
- **Objective metric:** `# of services sharing a DB`; `# of cross-context joins/queries`; `# of stored procedures containing business logic`; `schema ownership: single vs. per-service`.
- **Yellow flag (warning):** Several services share a DB but write mostly to separate tables; some cross-context reads. *(Rationale: warning — coupling exists, still manageable with discipline.)*
- **Red flag (critical):** Services share tables write-path, business logic lives in stored procedures, or any service queries another's tables directly as normal practice. *(Rationale: the seas are one body — no independent change is possible.)*
- **Example symptom:** "Billing rewrites their `invoice` table. The reporting service's nightly job — which reads that exact table — breaks. Nobody knew it depended on it. 'The system is one big database wearing services as clothes.'"
- **Blast radius:** Independent deployability, team autonomy, schema-change blast radius, scaling (single DB bottleneck), modernization sequencing.
- **Remediation playbook:** Quick win: document all cross-service DB reads/writes (the hidden map), move the worst cross-read behind an API or event. Structural fix: bounded-context data ownership with a public API/event boundary per service, migrate stored-proc logic into application code, run schema ownership checks in CI.
- **Gold standard / target state:** Each service owns its tables; cross-context access is via API/events only; zero business logic in stored procedures; a change to one context can't break another.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = owned schemas, API/event boundaries; 2 = shared DB, separate tables; 1 = cross-context reads/joins; 0 = shared write-path or proc-based logic.
- **Verify effort:** 🔶 ~2–4 h — connection/config audit + query scan.

### DATA-03 — Data Integrity & Constraint Degradation
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** FK/constraint coverage; semantic model fit is DATA-08.
- **Definition:** The schema lacks integrity guards — missing foreign keys, no `NOT NULL`/`CHECK` constraints, no uniqueness, untyped or loose-typed columns — so the database silently accepts invalid, duplicate, and orphaned data.
- **Why it signals obsolescence:** Constraints are the DB's own test suite. Their absence means the data degrades silently, every query becomes an "is the data even valid?" compromise, and application code must re-defend against garbage that should've been impossible. Integrity debt is a leading driver of "we can't trust the numbers."
- **Where it manifests:** Tables without FKs (often from the era before InnoDB FKs), columns storing `"true"`/`"false"` strings, nullable columns that every code path treats as required, duplicate identity rows, orphaned children, no unique index on natural keys, `"0.00"` price strings.
- **Detection method:** Schema audit — query the SQL catalog for FK/constraint coverage (`information_schema`), run integrity probes (find orphaned rows: `SELECT * FROM child LEFT JOIN parent ... WHERE parent IS NULL`), check for duplicate natural keys, check column types vs. code expectations; DB lint tools (e.g., `sqllint`, custom SQL); compare the schema's promises to the ORM's assumptions.
- **Objective metric:** `% of cross-table relationships with FKs`; `# of orphaned/duplicate rows`; `# of string/loose-typed columns`; `# of nullable-but-required columns`; `constraint coverage %`.
- **Yellow flag (warning):** Missing constraints in non-core tables; occasional orphaned rows; some loose-typed columns. *(Rationale: warning — data is 95% fine, the guard is just patchy.)*
- **Red flag (critical):** No FKs/constraints in core tables, silent data corruption patterns (duplicate identities, orphaned money rows), or app code compensating with cleanup jobs as a permanent state. *(Rationale: the database has no integrity guarantee at all — "cleanup scripts" are the sound of it failing.)*
- **Example symptom:** "The `payments` and `invoices` tables have no FK. A dedupe job runs nightly to delete 'duplicate' invoices. The CFO asks why the sum on two dashboards differs. Because nothing on Earth guarantees an invoice belongs to one payment."
- **Blast radius:** Reporting accuracy, money bugs, reconciliation work, migration risk (bad data breaks schema changes), trust in the product.
- **Remediation playbook:** Quick win: add the missing FKs/unique indexes (backfill orphans first, then constraint), fix the top data-quality violations. Structural fix: constraints-when-shipping policy, data-quality probes as recurring CI/data checks, typed columns everywhere, a data steward owns integrity.
- **Gold standard / target state:** FKs + constraints close to 100%, integrity probes green, zero known duplicate/orphan patterns, cleanup jobs retired.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = constraints high, probes green; 2 = gaps in non-core tables; 1 = core gaps with cleanup-job compensation; 0 = no integrity guarantee, silent corruption.
- **Verify effort:** 🔶 ~2–4 h — catalog audit + integrity probe queries.

### DATA-04 — Legacy Storage Technology
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** storage technology and vendor EOL; query performance is DATA-07.
- **Definition:** Core data lives in storage technologies that are unmaintained, hard to query, or impossible to evolve — flat files, XML blobs, legacy NoSQL with no maintenance, file-based state, mainframe-adjacent stores, object graphs hand-rolled on top of file systems, or databases long off the vendor's support matrix.
- **Why it signals obsolescence:** Storage is the deepest lock-in a codebase has. When the *format/technology* is EOL, the code's options collapse: every feature is a fight with a dead file layout, and migrations out are expensive and risky. This is the data-layer version of ECOS-01.
- **Where it manifests:** XML/flat-file/CSV stores for core records, proprietary binary formats, a database version supported no longer (e.g., ancient MySQL), file-system blobs with indexes in code, abandoned document stores, "the data is in the files on `//oldfs`", archived formats no tool reads.
- **Detection method:** Storage inventory — enumerate the systems of record (DBs, file stores, queues, archives), check vendor support/lifecycle for each (endoflife for DB versions), inspect the formats of the files (headers, extensions, queryability), measure share of critical data in unqueryable/unmaintained stores.
- **Objective metric:** `# of systems-of-record on EOL/unsupported technology`; `% of critical data in non-queryable/unmaintainable stores`; `# of legacy-format file stores`; `vendor support status per store`.
- **Yellow flag (warning):** Some non-core data in legacy formats/stores; a supported-but-old DB version; filesystem blobs with an index layer. *(Rationale: warning — friction but not crisis.)*
- **Red flag (critical):** Core data (money, identity, compliance) in an unsupported/unmaintainable store, or a proprietary format whose tooling has vanished. *(Rationale: the data can't be queried, migrated, or secured — a locked vault with no key.)*
- **Example symptom:** "Customer history lives in 4 TB of XML files written by a Java 1.4 app 'decommissioned' in 2016. Search is a full-disk `grep`. The compliance team needs to produce a customer record for a court order. It takes three days."
- **Blast radius:** Query/analytics capability, compliance ability (produce records), feature velocity on legacy data, migration cost ceiling, egress/security.
- **Remediation playbook:** Quick win: stand up a read side (index the files into a modern store, keep legacy as archive), build the extraction utilities. Structural fix: a data-migration program — move systems of record to maintained technology one store at a time (strangler pattern for data), keep legacy read-only during migration, archive what's truly dead.
- **Gold standard / target state:** All systems-of-record on maintained technology; legacy formats readable/exportable or archived with access paths; critical data queryable with modern tooling.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = all stores supported; 2 = legacy in non-core; 1 = legacy reads in core; 0 = core of record unmaintainable.
- **Verify effort:** 🔷 ~1–2 days — storage inventory + support lifecycle check.

### DATA-05 — Lock Contention & Scaling Bottleneck
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** runtime lock/scaling behavior; query shape is DATA-07, storage choice is DATA-04.
- **Definition:** The database cannot scale with load because of lock contention — hot rows, table-level locks, un-indexed joins, full-table scans under traffic, or a single-instance design that caps throughput. "Vertical scaling required for traffic spikes."
- **Why it signals obsolescence:** Scalability is where the data layer reveals its design era. Tables designed before concurrency, engines with table locks (MyISAM), innefficient indexes, and single-writer assumptions all cap the system at current traffic — and die on spikes. It's also the hidden cost: you buy vertical upgrades instead of fixing the schema.
- **Where it manifests:** `LOCK WAIT` entries in DB logs, slow-query logs with full-table scans at p95, hot-row contention (a single row updated by every request, e.g., a global counter), table-level locks from old engines, index-less foreign keys, "we upgraded the instance twice this year."
- **Detection method:** Profiling/data — `SHOW PROCESSLIST`/`pg_stat_activity` histogram during peak, slow-query log analysis (`pt-digest`), `EXPLAIN` on p95 queries (seq scans, missing index scans), lock-wait graphs (Percona, Datadog DB), load testing with concurrency ramp (k6/pgbench) to find the throughput ceiling.
- **Objective metric:** `max lock-wait time / wait count at peak`; `p95 query duration`; `# of full-table scans at peak`; `seq-scan-ratio`; `concurrency ceiling (from load test)`; `# of hot-row contention events`.
- **Yellow flag (warning):** Occasional lock waits and a few full-table scans; vertical scaling used for the last spike. *(Rationale: warning — the ceiling exists and was brushed up against.)*
- **Red flag (critical):** Hot-row or table-level lock contention under *standard* load, or the only scaling lever is a bigger instance, or lock waits cause user-visible stalls. *(Rationale: the design caps throughput — the next spike is a downtime.)*
- **Example symptom:** "Black Friday starts and the order flow stalls. `pg_stat_activity` shows 300 connections in `LOCK WAIT` on one row: the 'order sequence' counter. Last year's fix was a 2× instance. Nobody has touched the table since 2015."
- **Blast radius:** Peak-time downtime, cost (vertical scaling), degraded UX under load, expansion failure, DBA on-call.
- **Remediation playbook:** Quick win: index the exploitable gaps that full-table scans reveal, split the hot row (counter → per-shard), add read replicas for read-heavy load. Structural fix: bounded-context data design (DATA-02), remove the contention points (sequence/counter patterns rewritten), tuned isolation levels where safe, load tests with concurrency in CI, capacity per feature, not per "make it bigger."
- **Gold standard / target state:** Lock waits near zero at peak, index strategy documented and maintained, scaling via standard horizontal levers, load tests show headroom > 3×.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no contention at 3× peak; 2 = occasional waits, mitigated; 1 = contention under spikes; 0 = blocked from scaling, vertical-only.
- **Verify effort:** 🔷 ~1–2 days — profiling + load test.

### DATA-06 — Data Lifecycle Management Deficits
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** backups/restores/retention; ops runbooks are DOCS-03, fresh-schema build is DATA-01.
- **Definition:** No coherent data lifecycle — retention is unmanaged ("keep everything forever" or "deleting is terrifying"), archival doesn't exist, backups are untested, PII has no expiry, and restore is a rumor.
- **Why it signals obsolescence:** Lifecycle management is a modern compliance/ops baseline. Its absence means: storage costs grow unbounded, GDPR/CIPA/retention obligations are unmet, and — the worst failure mode — the system has no *verified* recovery path. A database you've never restored doesn't actually protect anything. This is also a legal/liability liability that compounds with every passing year.
- **Where it manifests:** No retention policy documentation, prod data copied everywhere (dev DBs full of PII), backups run but never restore-tested, no archival tier, GDPR deletion requests "manually handled," data shuffling "just in case."
- **Detection method:** Audit — retention policy docs vs. actual jobs; backup logs and *restore test evidence* (last successful restore drill); PII copy map (which envs/dumps hold production PII); storage growth vs. retention trend; erasure feature exists and is exercised in tests.
- **Objective metric:** `last successful restore drill (days ago)`; `% of prod data with a retention rule`; `restore time/RTO vs. target`; `# of envs holding prod PII without need`; `erasure capability exercised in tests?`.
- **Yellow flag (warning):** Backups run but restore untested (> 90 days), no retention policy, some prod-data sprawl to dev. *(Rationale: warning — the pounce path is unverified.)*
- **Red flag (critical):** No backups at all, or restore never successfully performed/untestable, or retention/erasure legally required and absent. *(Rationale: you cannot recover the data you legally must manage — operational and compliance failure.)*
- **Example symptom:** "The 'backup' is `mysqldump > file if cron feels like it`. Nobody has ever executed a restore. The GDPR erasure request arrives; the answer is 14 days of DBA archaeology across 5 dumps. And the CFO asks why storage is up 40% YoY."
- **Blast radius:** Data loss, RTO/RPO failures, regulatory fines, storage cost, breach liability (retention of unnecessary PII).
- **Remediation playbook:** Quick win: prove restore works this week (schedule a drill), set retention tiers, stop seeding dev with PII. Structural fix: automated backup verification, retention/archival jobs, PII minimization (anonymization in non-prod), erasure workflow as software, RTO/RPO SLOs with drills scheduled.
- **Gold standard / target state:** Restore drills quarterly and green, retention automated, zero PII sprawl in dev, erasure request fully exercisable, RTO/RPO met.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = restore-verified, retention automated; 2 = backups untested/retention partial; 1 = no restore evidence, retention absent; 0 = no backups or no legal capability.
- **Verify effort:** ⚡ ≤ 30 min to inspect; 🔷 for a real restore drill.

### DATA-07 — ORM / Query Performance Smells
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** ORM/query shape; contention under traffic is DATA-05.
- **Definition:** The ORM layer generates bad queries — N+1 races, lazy-loading storms, implicit projection of entire rows, missing eager loading, cartesian products from bad fetches — and there's no index/query strategy to compensate. Application code triggers data-layer crashes under real use.
- **Why it signals obsolescence:** ORM abuse is the classic "the code works on the test fixtures" trap: SQL looks fine, then dies at 10× data. It's a sign the data layer was written without a performance understanding, then never revisited — two generations of schema and data growth later, it's a query minefield.
- **Where it manifests:** N+1 in list endpoints (1 query + N queries per row), lazy loads in loops, giant `SELECT *`, fetch bypassing indexes, unused indexes, missing indexes on query-adjacent columns, "works in dev, dies in prod," SQL in logs showing 4,000 queries per request.
- **Detection method:** ORM query analysis — enable query logging (Django debug toolbar, Rails logger SQL, Hibernate stats, Entity Framework SQL log), count queries per endpoint, look for N+1 patterns (same query × N), use perf tooling (Bullet gem, django-silk, SQLAlchemy `echo`), `EXPLAIN` on generated SQL, index-usage stats (`pg_stat_user_indexes`, Percona).
- **Objective metric:** `queries per request (p50/p95)`; `N+1 count (repeated identical queries)`; `avg row width fetched vs. needed`; `# of missing indexes on hot paths`; `unused index ratio`.
- **Yellow flag (warning):** N+1 and wide fetches in non-critical endpoints; query counts 2–5× reasonable. *(Rationale: warning — slow but not on fire.)*
- **Red flag (critical):** N+1/implicit queries in core flows causing timeouts under moderate data, or no index strategy at all while slow-query logs show the same misses daily. *(Rationale: the data layer degrades linearly with growth — a time bomb.)*
- **Example symptom:** "Loading the customer list fires 3,000 SQL statements: one for the page, then 2,999 to lazy-load each address. In dev it's snappy with 10 customers. The sales team's 40k-customer search spins for 40 seconds and times out."
- **Blast radius:** Latency, timeout incidents, DB CPU, user experience, p99 blowups, cost.
- **Remediation playbook:** Quick win: fix the top 10 N+1s with eager loading/joins, add the missing indexes on the hot path, reduce column projection. Structural fix: query budget per endpoint (assert queries-per-request in tests), index strategy documented and reviewed, offload heavy reads (search, aggregates) to appropriate engines, performance tests with realistic data volume in CI.
- **Gold standard / target state:** Query counts per endpoint budgeted and tested, N+1 class eliminated, index strategy current, p95 latency flat as data grows 10×.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = query budgets + clean; 2 = smells in non-core; 1 = core smells, timeouts occasionally; 0 = core N+1 storms / no index strategy.
- **Verify effort:** 🔶 ~2–4 h — ORM logging + EXPLAIN session.

### DATA-08 — Schema Overfitting & Model Rigidity
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** domain-vs-implementation modeling; event/audit history is DATA-09.
- **Definition:** The schema bakes in business decisions rather than business facts — columns named after UI features, one-off statuses, booleans like `use_new_pricing_v2`, meanings encoded in column values, and no room for the domain to evolve — making every product change a migration.
- **Why it signals obsolescence:** Data should model the *domain* (durable facts), not the *implementation* (transient decisions). Overfit schemas freeze the product: each rule change needs a schema change, and after years the schema is a fossil of every abandoned experiment. It's the data-layer version of ARCH-01's god-object thinking.
- **Where it manifests:** Columns like `migration_batch_84`, `is_v2_enabled`, `old_tax_rounding_v1`, status values that spool dozens of variants, data copied into new columns rather than normalized, events never recorded (only current state), business rules hidden in trigger/constraint names.
- **Detection method:** Schema archaeology — review table/column names (grep for version words, `old_`, boolean flags, feature names); count of "append-only garbage columns"; check whether the schema would support an unanticipated product change (a "ergonomic test": add a new price type — how many tables/columns move?); look for a noconcepts-of-the-domain (customers stored as `users.type`), no event/audit structures.
- **Objective metric:** `# of versioned/feature-named columns`; `# of schema elements proving implementation-era (old_, v2, batch)`; `time-to-implement a trivial domain change` (ergonomic test); `% of domain facts modeled as mutable state vs. durable events`.
- **Yellow flag (warning):** Some versioned/flag columns and historical cruft, mostly non-core. *(Rationale: warning — the museum is forming but isn't load-bearing.)*
- **Red flag (critical):** Core domain is modeled around implementation history, or every product change requires a schema migration, or the schema has no way to represent domain evolution (no events/effective-dating). *(Rationale: the model is an anchor — product velocity is now a schema project.)*
- **Example symptom:** "Adding 'invoice discount vs. credit note' — a simple domain concept — touches 12 tables and three one-off columns. The data architect finds a column literally named `refund_workaround_aug` from a hotfix five years ago that nobody will delete."
- **Blast radius:** Feature velocity, migration frequency, data quality drift, rigid APIs, onboarding confusion, modernization cost.
- **Remediation playbook:** Quick win: kill the obvious versioned/flags columns behind an additive migration, document the domain model properly. Structural fix: remodel around domain facts — normalize flags into real entities, adopt effective-dating/event structures for changeable rules (see DATA-09), a domain model owned by the team, schema reviewed as domain design not storage plumbing.
- **Gold standard / target state:** Schema expresses domain facts; product rule changes land without schema surgery; events/snapshots support evolution; archaeology columns gone.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = domain-fact schema; 2 = cruft in non-core columns; 1 = core partially overfit; 0 = implementation-fossil schema, every feature is a migration.
- **Verify effort:** 🔶 ~2–4 h — schema archaeology + ergonomic test.

---

## Deep-dive indicators

### DATA-09 — Event Sourcing / Audit Readiness
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** event/audit trail for changes; current-state integrity is DATA-03, security audit logs are SEC-05.
- **Definition:** The system records only current state, has no event/audit trail of changes, and cannot answer "what happened and why" — no append-only log, no effective dating, no immutable history. Business rules are re-run to reconstruct states rather than queried from records.
- **Why it signals obsolescence:** Immutable, append-only history is how modern systems handle audit, time-travel debugging, replay, and compliance. Its absence makes "what did the customer see on X date" a reverse-engineering project, makes reconciliation impossible, and blocks compliance and analytics (this connects to SEC-05's audit logging at the domain level).
- **Where it manifests:** No history tables, no event store, state mutated in place (`UPDATE` overwrites), "we can't tell you what changed," reconciliation by re-running old code, audit requests answered with spreadsheets, effective-dating absent for changeable data.
- **Detection method:** Model audit — check for history/version tables, event/audit columns (`updated_by`, versions), an event log or outbox; test an "as-of" query (what was the state on date X? — if impossible without backups/time-travel, it's absent); review whether domain changes create durable records or just update a row; look for immutable/mutable split.
- **Objective metric:** `% of core aggregates with a history/audit mechanism`; `as-of-query feasibility (yes/no)`; `# of in-place UPDATEs of state that should be evented`; `event/outbox presence`.
- **Yellow flag (warning):** Some history/audit exists for core aggregates; as-of queries possible for some domains; events for a few flows. *(Rationale: warning — partial readiness, gap is known.)*
- **Red flag (critical):** No history or events at all for core business facts, as-of reconstruction impossible, and compliance/analytics depend on it. *(Rationale: the past is provably unrecoverable — a systemic blind spot.)*
- **Example symptom:** "The regulator asks: 'what did the customer's plan look like on March 3?' The team spends a week rebuilding it from backups and half-remembered cron runs. The answer is 'best effort, probably.'"
- **Blast radius:** Audit/compliance, time-travel debugging, replay/reconciliation, analytics correctness, regulatory outcomes.
- **Remediation playbook:** Quick win: add an append-only event/audit log for the top 3 core aggregates going forward (capture authoritative mutation events, not screenshots). Structural fix: eventing strategy for core facts (outbox, event store, or time-boxed history), as-of query support, replay/drills, compliance-backed retention of the history.
- **Gold standard / target state:** Core aggregates are fully evented with versioned state; as-of queries are routine and tested; history feeds audit and analytics directly.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = full eventing; 2 = partial (some aggregates); 1 = history ad hoc/backup-based; 0 = no history, reconstruction impossible.
- **Verify effort:** 🔷 ~1–2 days — model audit + as-of test.

### DATA-10 — Environment Schema Drift
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** env-vs-baseline drift; migration disorder is DATA-01, config drift is VEL-07.
- **Definition:** Dev/test/staging/prod schemas have drifted from each other and from the migration baseline — fixtures that no longer match, environments built by hand, migrations applied differently per environment, and "works in test, breaks in prod" as a normal condition.
- **Why it signals obsolescence:** Drift means the environments are not the same product — every deployment is a gamble on the gap between what was tested and what exists. It invalidates the entire QA pipeline and is usually the companion of DATA-01's migration disorder at the environment level.
- **Where it manifests:** Staging misses 12 tables that prod has; dev DBs differ per engineer; test fixtures fail after migrations; "the bug only reproduces on prod," schema comparison tools run manually; env-specific migrations; rotation/persist scripts per env.
- **Detection method:** Schema diff — run a schema-diff tool (mysqldiff, pg-diff, `schema-diff`, Liquibase `diff`) between dev→staging→prod and the migration baseline; check fixture strategy (are fixtures migration-generated or hand-maintained?); compare CI's fresh-env build against prod; measure the "time to stand up a prod-like env."
- **Objective metric:** `schema diff count dev→staging, staging→prod`; `fresh-env build time vs. prod`; `# of env-specific hotfix migrations`; `fixture/migration mismatch count`; `test failures only-at-prod rate`.
- **Yellow flag (warning):** Small diffs between environments, mostly non-critical columns; fresh env build mostly works. *(Rationale: warning — the crack exists, prod-only bugs are appearing.)*
- **Red flag (critical):** Meaningful schema drift between all environments, or fresh envs can't be built from migrations, or "prod-only bug" is a standing category. *(Rationale: test results don't transfer to prod — the QA function is invalid.)*
- **Example symptom:** "QA approves a release because staging is green. In prod the new column exists but with a different type; the migration silently failed six months ago. 'Works on staging, breaks in prod' is a known meme."
- **Blast radius:** Release safety, QA validity, debugging time, migration trust, onboarding (broken local DBs), incident frequency.
- **Remediation playbook:** Quick win: run diffs, reconcile to the migration baseline, rebuild staging from migrations. Structural fix: migrations-as-only-path for every env, fresh-env CI per PR, schema-diff check in CI (fail on env drift), fixture strategy generated from migrations.
- **Gold standard / target state:** Zero diffs between baseline and any env; fresh environments reproducible; "prod-only bug" eliminated as a category.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = zero drift, reproducible; 2 = minor drift, quick to reconcile; 1 = meaningful drift, prod-only bugs; 0 = environments are not the same product.
- **Verify effort:** 🔷 ~1–2 days — diff runs + fresh-build measurement.
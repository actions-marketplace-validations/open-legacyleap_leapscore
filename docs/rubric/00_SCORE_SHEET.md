# 00 — Score Sheet *(generated)*

> **GENERATED FILE — do not hand-edit.** Written by `tooling/scripts/compile-rubric.ts`
> (`npm run compile:rubric`) from `docs/rubric/indicators/**` and
> `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md`. `npm run check:rubric-consistency` fails on any hand edit.

Print this sheet and write on it. Each row echoes its canonical file's §2 Yellow and Red flag
verbatim, with only the parenthetical rationale removed — no paraphrase, no truncation. The 0–3
scale and the core-path taxonomy live in [`00_EXECUTIVE_RUBRIC.md`](./00_EXECUTIVE_RUBRIC.md);
weights, formulas, bands, and the gate roster are canonical in
[`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md).

**Rows:** 102 indicators (87 standard · 15 deep-dive) · **Gates:** 8 · **Bands:** 4

---

## Part A — Gate roster (G1–G8)

Restated from [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md) §3, which also
carries the trigger text and the escalation semantics.

| # | Gate | Red Flag trigger | Source indicator |
|---|------|------------------|--------------------|
| G1 | Credential exposure | Active plaintext secrets/credentials in source, history, or config | SEC-02 |
| G2 | Critical vuln exposure | Any Critical CVE > 14 days unpatched on an internet-exposed path | SEC-01 |
| G3 | Runtime EOL, no path out | Core domain logic on EOL runtime/language with no upgrade path | ECOS-01 |
| G4 | OWASP Top-10 reachable | SQLi / RCE / broken auth reachable in core flows | SEC-03, SEC-04 |
| G5 | Untested core | Zero test coverage in the highest-criticality service | TEST-06 |
| G6 | Delivery is on fire | CFR > 30% AND deployments require manual intervention | VEL-03, VEL-08 |
| G7 | Data-rescue risk | No backups, or restore never successfully performed / untestable, in a system holding critical data | DATA-06 |
| G8 | Copyleft in closed-source distribution | GPL/AGPL (or equivalent copyleft) detected in a proprietary, closed-source distribution | ECOS-05 |

---

## Part B — Bands

Thresholds and verdict guidance are canonical in
[`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md) §3.

| Tier | Score | Verdict |
|------|-------|---------|
| Low | ≥ 80% | Maintain continuous refactoring & incremental updates |
| Moderate | 53–79% | Dedicated refactoring sprints; fix security & EOL first |
| High | 27–52% | Modernization initiative required; isolate core domain behind a facade |
| Critical | < 27% | Immediate modernization mandatory; system impedes business continuity |

---

## Part C — Indicator criteria (all rows, grouped by category)

Headings show the base and FE-active weights; use the FE-active column when the repo has a client.

### 1. Dependency & Ecosystem Health — weight 10% (FE-active 9%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| ECOS-01 | Runtime/Language EOL ⚡ | standard | Active version within 6 months of EOL, or on EOL but with a funded, resourced upgrade path already started. | Past official EOL with extended/vendor-only support (or none), and no upgrade in progress. |
| ECOS-02 | Major Package Drift ⚡ | standard | > 30% of direct deps are 1–2 majors behind. | > 50% of direct deps ≥ 2 majors behind, or the core framework is more than one major behind current with no upgrade project. |
| ECOS-03 | Abandoned / Unmaintained Libraries ⚡ | standard | Unmaintained for 12–24 months, or single-maintainer bus-factor-1 libraries, in peripheral modules. | Unmaintained > 24 months, or repo archived, or package revoked/unpublished, in *core* logic or on the auth/data path. |
| ECOS-04 | Deprecated API Usage ⚡ | standard | Deprecated APIs used in non-critical modules, with warnings suppressed or ignored. | Core business logic depends on deprecated or already-removed APIs, or calls APIs removed in the *next* LTS version of the framework. |
| ECOS-05 | License Compliance Risk 🔶 | standard | Unknown or ambiguous licenses present in transitive dependencies; no SBOM generated. | Copyleft licenses (GPL/AGPL) detected in a proprietary, closed-source distribution, or vendored copyleft code without notice. |
| ECOS-06 | Dependency Bloat ⚡ | standard | 100–300 transitive deps, or > 20% unused direct deps, in a mostly-clean graph. | > 300 transitive deps, or orphaned deps that can't be removed (feature flagged forever), or duplicated versions of security-critical libs. |
| ECOS-07 | Build Reproducibility & Lockfile Integrity ⚡ | standard | Lockfile present but stale/partial, or immutable-install not enforced in CI. | No lockfile at all, floating ranges in prod-critical deps, or CI installs mutably from a live registry with no integrity pins. |
| ECOS-08 | Framework Lock-in & Monoculture Risk ⚡ | standard | Framework in maintenance mode, or community clearly migrating, while the org still has a migration path. | Framework is EOL, vendor-retired, or license-change-foreclosed, with core logic coupled to it and no viable migration path. |
| ECOS-09 | Version Skew Across Services 🔷 | deep-dive | 2–3 majors of a core dependency in flight, with a shared upgrade backlog. | Core dependency at 3+ distinct majors, or runtimes so varied that shared tooling/CI can't support them. |
| ECOS-10 | Supply-Chain: Typosquatting, Malware, & Registry Risk 🔷 | deep-dive | Scorecard 5–7, no malware found, but no provenance verification and actions pinned to tags. | Known malware/hijacked package in the lockfile, or scorecard < 5 with zero supply-chain scanning anywhere. |

### 2. Architecture & Code Quality — weight 15% (FE-active 13.5%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| ARCH-01 | Cognitive Complexity & God Classes 🔶 | standard | Method complexity 15–30, classes 500–2,000 LOC, complexity concentrated in a few known files. | Method complexity > 30, classes > 2,000 LOC, or God Classes in core domain logic. |
| ARCH-02 | Coupling & Cohesion 🔶 | standard | Cyclic dependencies present between submodules; a growing central hub; several modules with fan-out > 20. | Circular dependencies across bounded contexts, or services sharing DBs/tables directly, or one omnipresent "everything" module everyone imports. |
| ARCH-03 | Layer & Boundary Violations 🔶 | standard | Occasional boundary crossings that reviewers miss; no architecture tests enforcing rules. | System-wide boundary erosion — UI/controllers do persistence, business rules live in stored procedures, or no architecture enforcement exists *and* the drift is visible in a quick tour. |
| ARCH-04 | Dead & Orphaned Code ⚡ | standard | 10–20% of functions unreferenced, or a handful of zero-traffic endpoints, or flags on for > 1 year. | > 20% dead code, or unreferenced endpoints live in production exposing attack surface, or the dead-code report has grown two quarters in a row. |
| ARCH-05 | Code Churn vs. Defect Hot Spots 🔶 | standard | Top 5% churned files show moderate bug frequency; churn is concentrated but defects not yet correlated. | Top 10% churned files account for > 50% of production incident fixes, or a single file is both #1 churn and #1 defect. |
| ARCH-06 | Architectural Era / Framework Generation 🔶 | standard | One generation behind — some seams exist but testing requires a live stack for many paths. | Two+ generations behind — no DI, no module seams, tests require the full stack, or the architecture style (e.g., EJB 2-era) has no modern tooling support. |
| ARCH-07 | Global Mutable State & Hidden Dependencies 🔶 | standard | Globals/singletons present in non-core paths, or a handful of hidden-dependency calls; tests currently pass serially. | Shared mutable state in core business flows, or hidden time/IO in core logic, or parallel/randomized test runs fail. |
| ARCH-08 | Duplication Debt 🔶 | standard | Duplication 10–20%, mostly within a module, mostly peripheral. | > 25% duplication, or the same core business logic duplicated across services (where a bug in one copy costs money), or duplicated security/auth logic. |
| ARCH-09 | Agentic Operability (AI/LLM Codebase-Readiness) 🔶 | standard | Partial navigation aids, < 60% test-to-code proximity in core, seams exist but inner loop slow — an agent can act but slowly and with drift risk. | No navigation aids, core logic not constructible in a test without live infrastructure, no single-command harness — an agent cannot complete a scoped task reliably from a fresh clone. |
| ARCH-10 | Feature-Flag & Configuration Debt ⚡ | standard | Flags/config hardcoded in non-core modules; some long-lived flags without owners; env config partially hand-edited. | Core logic driven by hardcoded toggles/baked config; prod config stored in the repo; flags used as emergency switches with no retirement path. |
| ARCH-11 | Nullable/Untyped Code & Runtime Error Density 🔷 | deep-dive | Some typed coverage, strict mode partially on, null-crash share 5–10% of incidents. | Core paths untyped, strict mode off, null/undefined errors a top incident cause (> 15%). |
| ARCH-12 | Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions) 🔷 | deep-dive | Some duplication of cross-cutting code; manual auth in a few non-critical routes. | Manual security checks in core routes (with known coverage gaps), or no centralized error/logging infrastructure at all. |

### 3. Testing & Quality Engineering — weight 10% (FE-active 9%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| TEST-01 | Code Coverage Degradation ⚡ | standard | 50–70% branch coverage, or coverage falling > 5 points/quarter in core modules, or gate absent. | < 50% branch coverage on core services, or zero coverage on a newly shipped critical path, or the coverage gate is absent *and* the trend is down. |
| TEST-02 | Flaky Test Rate 🔶 | standard | 5–10% flaky, or a few notorious flaky tests causing weekly reruns. | > 10% flaky, or flaky tests routinely disabled/deleted to keep CI green, or the team's reflex is "rerun it" for > 50% of failures. |
| TEST-03 | Test Pyramid Inversion 🔶 | standard | E2E-heavy (E2E count ≥ unit count, or E2E runtime > 50% of suite time) in places. | Test pyramid fully inverted — no meaningful unit layer, all behavior tested through UI/full-stack, E2E suite hours long and frequently failing. |
| TEST-04 | Test Run Time ⚡ | standard | 10–30 min suite, tests usually run before merge, slow tail known. | > 30 min suite, or tests routinely not run locally, or CI times out and tests are dropped to keep deploy green. |
| TEST-05 | Skipped / Disabled Tests ⚡ | standard | 5–10% skipped, or skips concentrated in a few modules, some recent. | > 10% skipped, or skips aged > 6 months with no ticket, or skips added to force a release through. |
| TEST-06 | Core Domain Untested 🔶 | standard | Core paths partially tested (some journeys covered, gaps in edge cases), or tests exist but are E2E-only. | Zero tests on the highest-criticality service or core journey (triggers G5). |
| TEST-07 | Test Isolation & Hermeticity 🔶 | standard | Some shared fixtures/order-dependence in peripheral suites; parallel run mostly passes. | Suite requires single-threaded serial execution or shared live DBs to pass, or random-order runs fail broadly. |
| TEST-08 | Quality Gates in CI ⚡ | standard | Linting only; no coverage or SAST gate; quality relies on review. | No static analysis or quality gates of any kind on the merge path. |
| TEST-09 | Mutation Testing Score 🔷 | deep-dive | 60–80% mutation score; some survivors in edge cases; assertions weak in peripheral tests. | < 60% mutation score on the core module, or surviving mutants in security/pricing/correctness logic. |
| TEST-10 | Test Maintenance Burden 🔷 | standard | 10–20% of commits are test maintenance; snapshot churn noticeable; tests coupled to infra details. | > 25% of commits are test maintenance, or tests break on every infra/rename change (coupled to internals not behavior), or the team actively dreads the suite. |

### 4. Security, Compliance & Vulnerability — weight 20% (FE-active 18%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| SEC-01 | Unpatched Vulnerabilities 🔶 | standard | 1–5 High CVEs open > 30 days, or any Critical open ≤ 14 days but already in the patch queue. | Any Critical CVE > 14 days on an internet-exposed path (triggers **G2**), or High CVEs accumulating with no patch process. |
| SEC-02 | Hardcoded Secrets & Credentials ⚡ | standard | Secrets in commit history that are already revoked/rotated; a few live tokens in non-prod configs. | Active, valid credentials in source, config, or history — especially in core/prod paths (triggers **G1**). |
| SEC-03 | Missing Web Security Controls 🔶 | standard | Missing headers, outdated TLS (1.1 tolerated), input validation incomplete on non-critical paths. | Reachable SQLi/RCE/broken auth/SSRF in core flows, or no input validation at all at any entry point (triggers **G4**). |
| SEC-04 | Authentication & Authorization Weaknesses 🔶 | standard | Weak session policy (long expiry, no rotation), coarse RBAC (all-or-nothing admin), no MFA on some privileged paths, some IDOR-able endpoints. | Default/known credentials, unauthenticated admin/internal paths, org-level broken authN (session hijackable), or authorization enforced only client-side in core flows. |
| SEC-05 | Audit Logging Deficits 🔶 | standard | Unstructured logs or missing request correlation IDs; partial coverage (some sensitive actions logged, some not). | Zero audit trails for administrative access, PII modification, or authentication events. |
| SEC-06 | Insecure Transitive Chains 🔶 | standard | Vulnerabilities only reachable through deep chains (depth > 5) into unmaintained packages, without likely exploit reachability. | Known malware/hijacked package confirmed in the lockfile, or a reachable critical vuln that only lives in the transitive graph and has no patch (see also ECOS-10). |
| SEC-07 | Patch Cadence & Update Workflow ⚡ | standard | Manual patch process, patches within 30–90 days, automation absent but SLA roughly met. | No automation, patches routinely > 90 days or deferred for releases, or "we can't patch because the build breaks" (unpatched = systemic). |
| SEC-08 | Compliance Drift 🔶 | standard | Partial control mapping, manual evidence collection, a few accepted-risk findings, some unencrypted stores. | No mapping or evidence to required frameworks, no encryption at rest, no retention/erasure capability, or audit findings closed without remediation. |
| SEC-09 | Input Robustness & Fuzzing 🔷 | standard | Sanitizer builds and some validation exist, but no fuzz harnesses; a couple of untrusted parsers unhardened. | Untrusted-input parsers (especially any memory-unsafe language or complex format) with no fuzzing *and* no validation hardening — or known parser CVEs unaddressed. |
| SEC-10 | Security Testing in CI 🔷 | standard | One or two scan types in CI (e.g., secrets + deps), SAST missing or comment-only, DAST quarterly at best. | No security tooling in CI at all, or scans exist but can't fail the build (always green), or findings have no owner/tracking. |

### 5. Data & Schema Evolution — weight 10% (FE-active 9%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| DATA-01 | Schema Migration Backlog / "Migration Hell" 🔶 | standard | 10+ pending migrations or one long-running (> 30 min) migration pending; a little env drift. | Schema changed ad hoc/manually in prod, or migrations are destructive/lossy as normal practice, or a fresh environment cannot be built from migrations. |
| DATA-02 | Database Coupling & Hidden Dependencies 🔶 | standard | Several services share a DB but write mostly to separate tables; some cross-context reads. | Services share tables write-path, business logic lives in stored procedures, or any service queries another's tables directly as normal practice. |
| DATA-03 | Data Integrity & Constraint Degradation 🔶 | standard | Missing constraints in non-core tables; occasional orphaned rows; some loose-typed columns. | No FKs/constraints in core tables, silent data corruption patterns (duplicate identities, orphaned money rows), or app code compensating with cleanup jobs as a permanent state. |
| DATA-04 | Legacy Storage Technology 🔷 | standard | Some non-core data in legacy formats/stores; a supported-but-old DB version; filesystem blobs with an index layer. | Core data (money, identity, compliance) in an unsupported/unmaintainable store, or a proprietary format whose tooling has vanished. |
| DATA-05 | Lock Contention & Scaling Bottleneck 🔷 | standard | Occasional lock waits and a few full-table scans; vertical scaling used for the last spike. | Hot-row or table-level lock contention under *standard* load, or the only scaling lever is a bigger instance, or lock waits cause user-visible stalls. |
| DATA-06 | Data Lifecycle Management Deficits ⚡ | standard | Backups run but restore untested (> 90 days), no retention policy, some prod-data sprawl to dev. | No backups at all, or restore never successfully performed/untestable, or retention/erasure legally required and absent. |
| DATA-07 | ORM / Query Performance Smells 🔶 | standard | N+1 and wide fetches in non-critical endpoints; query counts 2–5× reasonable. | N+1/implicit queries in core flows causing timeouts under moderate data, or no index strategy at all while slow-query logs show the same misses daily. |
| DATA-08 | Schema Overfitting & Model Rigidity 🔶 | standard | Some versioned/flag columns and historical cruft, mostly non-core. | Core domain is modeled around implementation history, or every product change requires a schema migration, or the schema has no way to represent domain evolution (no events/effective-dating). |
| DATA-09 | Event Sourcing / Audit Readiness 🔷 | deep-dive | Some history/audit exists for core aggregates; as-of queries possible for some domains; events for a few flows. | No history or events at all for core business facts, as-of reconstruction impossible, and compliance/analytics depend on it. |
| DATA-10 | Environment Schema Drift 🔷 | standard | Small diffs between environments, mostly non-critical columns; fresh env build mostly works. | Meaningful schema drift between all environments, or fresh envs can't be built from migrations, or "prod-only bug" is a standing category. |

### 6. API & Integration Surface — weight 10% (FE-active 9%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| API-01 | API Contract Drift 🔶 | standard | Spec exists but stale/partial; some endpoints undocumented; clients hand-written. | No contracts at all (or contracts so stale they're misleading), and/or breaking response changes ship freely. |
| API-02 | Versioning & Breaking-Change Discipline ⚡ | standard | Versioned, but breaking changes slip into minors occasionally; deprecation communicated informally. | No versioning at all, breaking changes ship without announcement, or consumers broke in the last 12 months as a result. |
| API-03 | Integration Point Bloat 🔶 | standard | Dense point-to-point graph (5–10 edges/service), growing, but documented; a registry/gateway is absent. | Every service talks to every other / shared DBs are the integration bus, the graph is undocumented, or a deployment integral to another service is routinely discovered by incident. |
| API-04 | Synchronous Coupling & Chatty Interfaces 🔶 | standard | Long sync chains in non-core flows; a couple of hot paths with fragile timeouts. | Core flows block on chains of slow/unreliable sync dependencies with no async escape, or an outage in one dependency takes down the primary flow (no bulkheads). |
| API-05 | Third-Party & Vendor API Dependency Risk 🔶 | standard | Some external calls unabstracted/non-critical; vendor deprecations vaguely watched; no fallback for most. | Core flows directly coupled to a deprecated/unmaintained vendor API with no abstraction and no fallback, or a single vendor is a silent single point of failure for revenue. |
| API-06 | Protocol & Data-Format Legaciness 🔶 | standard | Some legacy-protocol integrations in non-core corners (a partner still on SOAP/EDI), modern formats available for the rest. | Core flows bind on SOAP/XML/binary/proprietary protocols with no modern alternate, or the middleware that speaks them is itself EOL. |
| API-07 | Error Handling & API Observability Semantics 🔶 | standard | Inconsistent error bodies and some misclassified status codes, request IDs partial. | Generic 500s (or worse, HTML error pages) as normal practice, no request correlation anywhere, or error logs that can't reconstruct a single failing request. |
| API-08 | Consumer Blindness & Backward Compatibility 🔶 | deep-dive | Some analytics (API keys, traffic per endpoint), no full consumer registry, deprecation ad hoc. | Zero consumer visibility, changes shipped without any ability to know who's affected, or repeated consumer-breakage incidents. |
| API-09 | Idempotency & Retry Semantics 🔷 | deep-dive | Most state-changing endpoints lack idempotency; retry/duplicate incidents occasional and manually reconciled. | Core money/mutation endpoints have no idempotency and no dedupe, and duplicate side effects have already cost money/duplicated records. |
| API-10 | Contract Schema Evolution Process 🔷 | deep-dive | Additive-change culture informally, no registry or gate, breaking merges rare but possible. | Breaking contract changes merge regularly with consumer breakage, or event schemas change with no consumer awareness, and no registry/gate/culture exists. |

### 7. Developer Velocity & Operational Drag — weight 10% (FE-active 9%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| VEL-01 | CI/CD Build Duration ⚡ | standard | 15–30 min feedback loop; growing; partial parallelization. | > 30 min loop or regular timeouts, or tests so slow they're split/dropped (connects TEST-04), or the trend is steeply up. |
| VEL-02 | Local Dev Setup Time & Friction 🔶 | standard | 1–2 days depending on custom local steps. | > 3 days, or requires shared remote staging DBs / a single human's credentials / a "provision me" ticket. |
| VEL-03 | Deployment Failure Rate (CFR) 🔶 | standard | CFR 15–30%, or rollbacks concentrated in specific release types. | CFR > 30%, or deployments *requiring* manual intervention as standard, or rollback ceremony itself is an incident (triggers **G6**). |
| VEL-04 | Deployment Frequency & Lead Time 🔶 | standard | Weekly deploy cadence (or biweekly), lead time 1–5 days, some coordination required. | Monthly-or-less cadence, lead time > a week, or every release is a coordinated multi-service event with a named human "release manager". |
| VEL-05 | Onboarding Lead Time to First Production PR 🔶 | standard | 2–4 weeks to ship first PR; onboarding partially documented. | > 4 weeks for most hires, or onboarding is oral/tribal with no written path. |
| VEL-06 | Bus Factor / Knowledge Concentration ⚡ | standard | Single author responsible for > 50% of a critical module; a couple of know-it-all dependencies. | A single author owns > 80% of an entire codebase (or every critical service is Paul), zero documentation, zero shared context. |
| VEL-07 | Environment Reproducibility / Works-on-My-Machine 🔶 | standard | Some config/version divergence between envs, occasional prod-only bugs. | Reproducing prod locally is routinely impossible, or configs are maintained per-env by hand with no source of truth. |
| VEL-08 | Manual Release Steps & Operability 🔶 | standard | Some manual release steps (a couple of hand SQL/migrations, config push), automated enough to be "mostly CI." | Deploys *only* happen via manual scripts on prod hosts, or prod is routinely edited by hand (triggers **G6**). |
| VEL-09 | PR & Code-Review Hygiene 🔶 | standard | Review coverage < 80% or rubber-stamp for some modules; median PR 500–1,000 LOC; review latency days. | Reviews effectively absent — admin merges / direct pushes as normal practice, or core-path changes ship unreviewed, or median PRs > 1,000 LOC so reviews are theater by construction. |
| VEL-10 | Branching & Monorepo Strategy Legacy ⚡ | standard | GitFlow-style ceremony with mostly-short branches; occasional month-long branches; a couple of forced merge windows; multi-repo changes needing coordination. | Release branches weeks old with accumulating divergence, trunk routinely broken, mandatory merge windows/freezes as policy, or a monorepo/multi-repo shape that makes every change a coordination event. |
| VEL-11 | Developer Experience Tooling 🔷 | deep-dive | Inner loop 5–15 min, some tooling but no scaffolding, DX tax noticeable. | Inner loop > 15 min (cold builds, manual steps), no task runner of record, no generator for boilerplate, and modern tooling/AI integration effectively impossible/agonizing. |
| VEL-12 | Incident Recovery / MTTR 🔷 | deep-dive | MTTR 1–2 h, runbooks partial, rollback mostly manual, some repetition. | MTTR > 4–6 h, no runbooks, rollback is a manual nightmare, or the same incident recurs quarterly. |

### 8. Performance & Cloud/Infrastructure Fit — weight 10% (FE-active 9%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| PERF-01 | Observability Gaps 🔶 | standard | Logs exist but unstructured/poorly correlated; metrics partial; tracing missing across microservices. | No structured metrics at all; debugging prod requires SSH + raw log tailing; latency/errors invisible to any dashboard. |
| PERF-02 | Legacy Deployment Model 🔶 | standard | Partial containerization/IaC; some VMs still configured by scripts; a couple of snowflakes. | Bare-metal/VM with manual stateful modifications as the standard; scale = "buy a bigger server." |
| PERF-03 | Resource Waste / Leakage 🔷 | standard | Scheduled off-peak restarts to manage memory, some unbounded caches, moderate waste. | Process crashes under *standard* load due to memory leaks, or leaks that no one knows are leaks (restart-on-cron as tradition). |
| PERF-04 | Monolithic Scaling Bottleneck 🔷 | standard | Horizontal scaling partially works (e.g., Iapplication scales, DB replica path limited, spikes absorbed vertically). | Only way to grow is a bigger instance; adding instances adds nothing (stateful app or DB bottleneck); or the largest available instance is approaching. |
| PERF-05 | No Auto-Scaling / Capacity Planning 🔶 | standard | Some HPA/ASG; manual ceiling for critical services; capacity reviews ad hoc. | No autoscaling at all, capacity is a manual sizing decision, or a peak load event caught the system flat-footed in the last 12 months. |
| PERF-06 | Missing IaC / Config Drift 🔶 | standard | Partial IaC (core resources coded), some console drift, rebuild needs a helping hand. | No IaC for most resources, environments only explainable by the person who clicked them, or a rebuild is effectively impossible. |
| PERF-07 | No SLOs / Performance Budgets 🔶 | standard | Informal latency targets for some services, no error budgets or CI gate, no perf baseline. | No SLOs or budgets anywhere, no perf gate or baseline, and perf regressions reach users undetected. |
| PERF-08 | Runtime Waste & Startup Latency 🔶 | standard | Cold start 30–60s, idle footprint notable, lazy init partial. | Minutes-long cold starts (kills autoscaling), or huge idle footprints (bankrupt-on-scale players), or restart is so slow deploys are painful. |
| PERF-09 | Cost Efficiency / FinOps 🔷 | deep-dive | Some waste (over-sized instances, always-on dev), attribution partial, rare reviews. | No cost visibility or attribution at all, massive always-on idle waste, or the bill has grown faster than usage for multiple quarters with no one able to explain it. |
| PERF-10 | Disaster Recovery & Resiliency 🔷 | deep-dive | Single/limited redundancy, no drills in > 6 months, RTO/RPO undocumented-but-roughly-implied. | No DR plan/doc, no drills ever, single-region single-point-of-failure for the whole system, and no cross-region data path. |

### 9. Documentation & Knowledge Continuity — weight 5% (FE-active 4.5%)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| DOCS-01 | Missing Architectural Decision Records (ADRs) 🔶 | standard | Some design docs exist, ADR convention unofficial or partial, several big decisions undocumented. | No decision records anywhere; consequential choices (datastore, architecture, integration) only live in heads/historical memory. |
| DOCS-02 | Stale / Drifted Documentation ⚡ | standard | Some docs outdated, diluted maintenance, trust mostly intact. | Docs widely contradict code — no one trusts them, setup/runbooks are known-wrong, README is "historical artifact." |
| DOCS-03 | Missing Runbooks & Operational Docs 🔶 | standard | Runbooks for some incident types, others improvised; runbook vs. infra drift. | No runbooks at all (or runbooks so wrong they're harmful); incidents are recovered by heroics every time. |
| DOCS-04 | No Onboarding Guide / Developer Setup Docs ⚡ | standard | Setup doc exists but incomplete/stale; much onboarding is still oral. | No onboarding guide at all (or it's known-wrong — DOCS-02), every hire learns the setup from a human. |
| DOCS-05 | Tribal Knowledge & Oral Tradition 🔶 | standard | A few critical modules are oral-only; several "ask Dave" dependencies. | The system as a whole is maintained by oral tradition — most decisions/behaviors have no written record and the primary carriers are 1–2 people. |
| DOCS-06 | Comment Debt & Self-Documenting Code Imbalance 🔶 | standard | TODO-rot present, some cryptic naming, some redundant/paraphrase comments. | Code is cryptic and comments are required to decode it — or comments actively contradict the code, and the standard is "trust the comment? trust the code? flip a coin." |
| DOCS-07 | Missing API Documentation 🔶 | standard | Some endpoints documented, others skeletal; docs partial/mixed-quality. | No consumer-facing API documentation at all, or it's so stale it misleads (DOCS-02 applies), consumers reverse-engineer everything. |
| DOCS-08 | No Release Communication / Changelog 🔶 | standard | Changelog exists but irregular/manual, migration notes sometimes written, announcements ad hoc. | No changelog or release notes at all, breaking changes ship unannounced, consumers/users learn from failures. |
| DOCS-09 | Docs-as-Code & Automation 🔷 | standard | Some generated docs (spec → reference), no docs CI pipeline, freshness unguarded. | All docs hand-maintained, nothing generated/verified/tested, no docs CI — docs will rot and the team knows it. |
| DOCS-10 | Knowledge Exit & Documentation Ownership 🔷 | deep-dive | Some docs owned, offboarding capture partial, a couple of knowledge-loss incidents. | No ownership, no offboarding capture, and knowledge leaves visibly (recent incidents post-departure). |

### 10. Frontend & Client Health — conditional · FE-active weight 10% (no base weight)

| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |
|----|-----------|--------|----------------------|------------------|
| FE-01 | UI Framework / Stack EOL & Deprecation ⚡ | standard | Framework in maintenance mode / one generation back, with an upgrade path underway. | Framework EOL (or vendor-end-of-life) with no migration in progress, or security patches unavailable. |
| FE-02 | Bundle Size & Load Performance 🔶 | standard | Bundle 500 KB–1.5 MB initial, LCP 3–4s on mobile, splitting partial. | > 1.5 MB initial, LCP > 4s, no code splitting, no measurement at all — "the app is slow" shows up in churn/refunds. |
| FE-03 | Accessibility Deficits 🔶 | standard | Score 70–90, some serious violations on secondary flows, no a11y gate. | Score < 70, critical flows keyboard-unusable, or no automated a11y checking at all with visible violations. |
| FE-04 | Browser / Platform Support Drift 🔶 | standard | Stale matrix or partial responsive; polyfill cruft; mobile tested sporadically. | Desktop-only/fixed-width (or a matrix that excludes where users are), or no matrix at all with recurring "breaks in my browser" reports. |
| FE-05 | Client-Side Architecture Debt 🔶 | standard | Some god-components, 1–3 global stores, prop drilling in places; light component tests. | 5+ unmanaged globals, 2,000-line components as normal, no component tests, unmappable data flow — "the frontend can't be reasoned about." |
| FE-06 | Design System / UI Consistency Drift 🔶 | standard | 2–3 implementations of primitives, some tokens, ad hoc styles in places. | No design system, 5+ ways to render a button, zero tokens — every feature re-invents the UI. |
| FE-07 | Internationalization / Localization Debt 🔷 | standard | i18n framework exists, some locales work, but plurals/RTL/formatting are shims and token coverage is partial. | No i18n at all (or English-only hardcode) and the market reality is multilingual; or claimed markets ship with broken RTL/plural/formatting. |
| FE-08 | Mobile / Responsive Adaptation & Offline Support 🔷 | deep-dive | Some offline/progressive features exist, mobile perf over budget, occasional data-loss on network blips. | No offline capability for a product users depend on in real connectivity, data loss on common navigation/refresh, mobile experience broken/unweighted. |

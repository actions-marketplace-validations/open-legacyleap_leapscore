# SPECS — Per-Indicator Implementation Specifications

> **Canonical for implementation** (Decision F1, `../PLANS/00_MASTER_INDEX.md`): inputs, detection recipes, fact schemas, statusing predicates, score-mapping predicates, gate hooks, failure/budget semantics for all 102 indicators of `../CODEDEBT_AUDIT_RUBRIC/`.
> **Not canonical for semantics/thresholds:** definitions, Yellow/Red numbers, weights, gate rules stay canonical in the encyclopedia (`01_…`–`10_…`) + `11_WEIGHTS_THRESHOLDS_CONFIG.md`. Specs **reference** thresholds by ID; they never restate numbers.
>
> One file per indicator: `<NN_CATEGORY>/<ID>_<slug>.md`, all following the skeleton below.

---

## 1. File skeleton (mandatory)

| § | Section | Content |
|---|---------|---------|
| 0 | Identity | ID · name · tier · default status · v1 flag · gates fed · rollup (standard/deep-dive) · verify-effort tag |
| 1 | Inputs | data planes (git / gh-api / ecosystem / static-src) · tools + min versions · GH endpoints + rate-cost · ecosystems · **Applicability:** `na_when <predicate>` |
| 2 | Detection recipe | exact commands / API calls / flags, ordered, with preconditions |
| 3 | Fact schema | JSON emitted to the fact-store; snake_case, units in field names |
| 4 | Statusing rules | `measured_when / estimated_when / unknown_when` · scope_limited triggers · clamp · confidence hook |
| 5 | Score mapping | fact predicates realizing the encyclopedia's 0–3 criteria (`thresholds: see <ID>`) |
| 6 | Gate hooks | proven / not-proven / needs-verification conditions (or none) |
| 7 | Failure & budget semantics | timeout / cap / crash / rate-limit → degraded status; dissolve behavior |
| 8 | Evidence string | template rendered into the report row |
| 9 | Scope/overlaps echo | one line copied from the encyclopedia |

Deep-dive rows additionally declare `folds_into: <category>` (rubric B4). Tier C/D rows ship a reduced skeleton (Identity + Emission text + Scope echo) — their report output is `unknown` + "what it takes to measure" drawn from the encyclopedia.

## 2. Cross-cutting conventions (normative — cited by every spec)

1. **Statuses:** `measured` / `estimated` / `unknown`; modifier `scope-limited` (`PLANS/02` §2, `PLANS/05` §8). `estimated` clamps to [1,2], carries `confidence: low|medium`.
2. **Confidence rule:** `medium` iff ≥2 independent surfaces agree or surface is exhaustive-by-construction; otherwise `low`. Never above `medium`.
3. **N/A admissibility:** `na_when` fires only on (a) structural category gates (e.g., no user-facing client → FE rows) or (b) exhaustive-surface enumeration proving the subject absent (parsed lockfile, full file tree). Non-exhaustive absence → `unknown`, never N/A. Zero test files / zero CI configs are score-0 facts.
4. **Budget classes:** `fast` · `slow-dissolvable` (sampled under budget → `estimated` + `scope-limited`) · `api-budgeted` (rate-limit exhausted → `unknown` "rate-limited").
5. **Tool pinning:** specs pin tool + minimum major (`gitleaks >= 8`); exact executed version + flags recorded per fact record (`PLANS/05` §7).
6. **Fact naming:** `{ecos01: {...}}` indicator-namespaced, snake_case, units embedded (`days_until_eol`). Predicates reference same-spec facts only.
7. **Evidence grammar:** `evidence:` = `<tool>: <key-fact> (<path-or-endpoint>)`; `basis:` for estimated rows. Exactly one of the two per row (`PLANS/02` §4).
8. **No execution:** no detector runs target-repo code (D5, `PLANS/05` §5). Execution-shaped recipes degrade to their static proxy or `unknown`.
9. **v1 flags:** A→`YES` · B-with-static-proxy→`PART` (candidate; reconciled against `PLANS/04` §5 at completion) · else `NO`.

## 3. Master list — all 102 indicators

Legend: v1 `YES/PART/NO` per convention 9. Gates: G6* = VEL-03 feeds G6 jointly with VEL-08.

### ECOS — Dependency & Ecosystem Health — weight 10% / 9% FE-active

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| ECOS-01 | Runtime/Language EOL | A | measured | YES | G3 |  | [`ecos-01_runtime-language-eol.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-01_runtime-language-eol.md) |
| ECOS-02 | Major Package Drift | A | measured | YES | — |  | [`ecos-02_major-package-drift.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-02_major-package-drift.md) |
| ECOS-03 | Abandoned / Unmaintained Libraries | A | measured | YES | — |  | [`ecos-03_abandoned-unmaintained-libraries.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-03_abandoned-unmaintained-libraries.md) |
| ECOS-04 | Deprecated API Usage | A | estimated | YES | — |  | [`ecos-04_deprecated-api-usage.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-04_deprecated-api-usage.md) |
| ECOS-05 | License Compliance Risk | A | measured | YES | G8 |  | [`ecos-05_license-compliance-risk.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-05_license-compliance-risk.md) |
| ECOS-06 | Dependency Bloat | A | measured | YES | — |  | [`ecos-06_dependency-bloat.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-06_dependency-bloat.md) |
| ECOS-07 | Build Reproducibility & Lockfile Integrity | A | measured | YES | — |  | [`ecos-07_build-reproducibility-lockfile-integrity.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-07_build-reproducibility-lockfile-integrity.md) |
| ECOS-08 | Framework Lock-in & Monoculture Risk | A | measured | YES | — |  | [`ecos-08_framework-lock-in-monoculture-risk.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-08_framework-lock-in-monoculture-risk.md) |
| ECOS-09 | Version Skew Across Services | B | estimated | PART | — | yes | [`ecos-09_version-skew-across-services.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-09_version-skew-across-services.md) |
| ECOS-10 | Supply-Chain: Typosquatting, Malware, & Registry Risk | A | measured | YES | — | yes | [`ecos-10_supply-chain-typosquatting-malware-registry-risk.md`](./01_DEPENDENCY_ECOSYSTEM/ecos-10_supply-chain-typosquatting-malware-registry-risk.md) |

### ARCH — Architecture & Code Quality — 15% / 13.5%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| ARCH-01 | Cognitive Complexity & God Classes | A | measured | YES | — |  | [`arch-01_cognitive-complexity-god-classes.md`](./02_ARCHITECTURE_CODE/arch-01_cognitive-complexity-god-classes.md) |
| ARCH-02 | Coupling & Cohesion | A | measured | YES | — |  | [`arch-02_coupling-cohesion.md`](./02_ARCHITECTURE_CODE/arch-02_coupling-cohesion.md) |
| ARCH-03 | Layer & Boundary Violations | A | measured | YES | — |  | [`arch-03_layer-boundary-violations.md`](./02_ARCHITECTURE_CODE/arch-03_layer-boundary-violations.md) |
| ARCH-04 | Dead & Orphaned Code | A | measured | YES | — |  | [`arch-04_dead-orphaned-code.md`](./02_ARCHITECTURE_CODE/arch-04_dead-orphaned-code.md) |
| ARCH-05 | Code Churn vs. Defect Hot Spots | A | measured | YES | — |  | [`arch-05_code-churn-vs-defect-hot-spots.md`](./02_ARCHITECTURE_CODE/arch-05_code-churn-vs-defect-hot-spots.md) |
| ARCH-06 | Architectural Era / Framework Generation | A | estimated | YES | — |  | [`arch-06_architectural-era-framework-generation.md`](./02_ARCHITECTURE_CODE/arch-06_architectural-era-framework-generation.md) |
| ARCH-07 | Global Mutable State & Hidden Dependencies | A | estimated | YES | — |  | [`arch-07_global-mutable-state-hidden-dependencies.md`](./02_ARCHITECTURE_CODE/arch-07_global-mutable-state-hidden-dependencies.md) |
| ARCH-08 | Duplication Debt | A | measured | YES | — |  | [`arch-08_duplication-debt.md`](./02_ARCHITECTURE_CODE/arch-08_duplication-debt.md) |
| ARCH-09 | Agentic Operability (AI/LLM Codebase-Readiness) | A | estimated | YES | — |  | [`arch-09_agentic-operability.md`](./02_ARCHITECTURE_CODE/arch-09_agentic-operability.md) |
| ARCH-10 | Feature-Flag & Configuration Debt | A | estimated | YES | — |  | [`arch-10_feature-flag-configuration-debt.md`](./02_ARCHITECTURE_CODE/arch-10_feature-flag-configuration-debt.md) |
| ARCH-11 | Nullable/Untyped Code & Runtime Error Density | A | estimated | YES | — | yes | [`arch-11_nullable-untyped-code-runtime-error-density.md`](./02_ARCHITECTURE_CODE/arch-11_nullable-untyped-code-runtime-error-density.md) |
| ARCH-12 | Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions) | A | estimated | YES | — | yes | [`arch-12_duplicated-cross-cutting-concerns.md`](./02_ARCHITECTURE_CODE/arch-12_duplicated-cross-cutting-concerns.md) |

### TEST — Testing & Quality Engineering — 10% / 9%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| TEST-01 | Code Coverage Degradation | B | estimated | PART | — |  | [`test-01_code-coverage-degradation.md`](./03_TESTING_QUALITY/test-01_code-coverage-degradation.md) |
| TEST-02 | Flaky Test Rate | B | unknown | NO | — |  | [`test-02_flaky-test-rate.md`](./03_TESTING_QUALITY/test-02_flaky-test-rate.md) |
| TEST-03 | Test Pyramid Inversion | A | estimated | YES | — |  | [`test-03_test-pyramid-inversion.md`](./03_TESTING_QUALITY/test-03_test-pyramid-inversion.md) |
| TEST-04 | Test Run Time | B | estimated | PART | — |  | [`test-04_test-run-time.md`](./03_TESTING_QUALITY/test-04_test-run-time.md) |
| TEST-05 | Skipped / Disabled Tests | A | measured | YES | — |  | [`test-05_skipped-disabled-tests.md`](./03_TESTING_QUALITY/test-05_skipped-disabled-tests.md) |
| TEST-06 | Core Domain Untested | B | estimated | PART | G5 |  | [`test-06_core-domain-untested.md`](./03_TESTING_QUALITY/test-06_core-domain-untested.md) |
| TEST-07 | Test Isolation & Hermeticity | B | unknown | NO | — |  | [`test-07_test-isolation-hermeticity.md`](./03_TESTING_QUALITY/test-07_test-isolation-hermeticity.md) |
| TEST-08 | Quality Gates in CI | A | measured | YES | — |  | [`test-08_quality-gates-in-ci.md`](./03_TESTING_QUALITY/test-08_quality-gates-in-ci.md) |
| TEST-09 | Mutation Testing Score | B | unknown | NO | — | yes | [`test-09_mutation-testing-score.md`](./03_TESTING_QUALITY/test-09_mutation-testing-score.md) |
| TEST-10 | Test Maintenance Burden | A | estimated | YES | — | yes | [`test-10_test-maintenance-burden.md`](./03_TESTING_QUALITY/test-10_test-maintenance-burden.md) |

### SEC — Security, Compliance & Vulnerability — 20% / 18%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| SEC-01 | Unpatched Vulnerabilities | A | measured | YES | G2 |  | [`sec-01_unpatched-vulnerabilities.md`](./04_SECURITY_COMPLIANCE/sec-01_unpatched-vulnerabilities.md) |
| SEC-02 | Hardcoded Secrets & Credentials | A | measured | YES | G1 |  | [`sec-02_hardcoded-secrets-credentials.md`](./04_SECURITY_COMPLIANCE/sec-02_hardcoded-secrets-credentials.md) |
| SEC-03 | Missing Web Security Controls | C | unknown | NO | G4 |  | [`sec-03_missing-web-security-controls.md`](./04_SECURITY_COMPLIANCE/sec-03_missing-web-security-controls.md) |
| SEC-04 | Authentication & Authorization Weaknesses | B | estimated | PART | G4 |  | [`sec-04_authentication-authorization-weaknesses.md`](./04_SECURITY_COMPLIANCE/sec-04_authentication-authorization-weaknesses.md) |
| SEC-05 | Audit Logging Deficits | C | unknown | NO | — |  | [`sec-05_audit-logging-deficits.md`](./04_SECURITY_COMPLIANCE/sec-05_audit-logging-deficits.md) |
| SEC-06 | Insecure Transitive Chains | A | measured | YES | — |  | [`sec-06_insecure-transitive-chains.md`](./04_SECURITY_COMPLIANCE/sec-06_insecure-transitive-chains.md) |
| SEC-07 | Patch Cadence & Update Workflow | A | measured | YES | — |  | [`sec-07_patch-cadence-update-workflow.md`](./04_SECURITY_COMPLIANCE/sec-07_patch-cadence-update-workflow.md) |
| SEC-08 | Compliance Drift | D | unknown | NO | — |  | [`sec-08_compliance-drift.md`](./04_SECURITY_COMPLIANCE/sec-08_compliance-drift.md) |
| SEC-09 | Input Robustness & Fuzzing | A | measured | YES | — | yes | [`sec-09_input-robustness-fuzzing.md`](./04_SECURITY_COMPLIANCE/sec-09_input-robustness-fuzzing.md) |
| SEC-10 | Security Testing in CI | A | measured | YES | — | yes | [`sec-10_security-testing-in-ci.md`](./04_SECURITY_COMPLIANCE/sec-10_security-testing-in-ci.md) |

### DATA — Data & Schema Evolution — 10% / 9%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| DATA-01 | Schema Migration Backlog / "Migration Hell" | A | measured | YES | — |  | [`data-01_schema-migration-backlog-migration-hell.md`](./05_DATA_SCHEMA/data-01_schema-migration-backlog-migration-hell.md) |
| DATA-02 | Database Coupling & Hidden Dependencies | B | estimated | PART | — |  | [`data-02_database-coupling-hidden-dependencies.md`](./05_DATA_SCHEMA/data-02_database-coupling-hidden-dependencies.md) |
| DATA-03 | Data Integrity & Constraint Degradation | B | estimated | PART | — |  | [`data-03_data-integrity-constraint-degradation.md`](./05_DATA_SCHEMA/data-03_data-integrity-constraint-degradation.md) |
| DATA-04 | Legacy Storage Technology | B | estimated | PART | — |  | [`data-04_legacy-storage-technology.md`](./05_DATA_SCHEMA/data-04_legacy-storage-technology.md) |
| DATA-05 | Lock Contention & Scaling Bottleneck | C | unknown | NO | — |  | [`data-05_lock-contention-scaling-bottleneck.md`](./05_DATA_SCHEMA/data-05_lock-contention-scaling-bottleneck.md) |
| DATA-06 | Data Lifecycle Management Deficits | B | estimated | PART | G7 |  | [`data-06_data-lifecycle-management-deficits.md`](./05_DATA_SCHEMA/data-06_data-lifecycle-management-deficits.md) |
| DATA-07 | ORM / Query Performance Smells | A | estimated | YES | — |  | [`data-07_orm-query-performance-smells.md`](./05_DATA_SCHEMA/data-07_orm-query-performance-smells.md) |
| DATA-08 | Schema Overfitting & Model Rigidity | A | estimated | YES | — |  | [`data-08_schema-overfitting-model-rigidity.md`](./05_DATA_SCHEMA/data-08_schema-overfitting-model-rigidity.md) |
| DATA-09 | Event Sourcing / Audit Readiness | A | measured | YES | — | yes | [`data-09_event-sourcing-audit-readiness.md`](./05_DATA_SCHEMA/data-09_event-sourcing-audit-readiness.md) |
| DATA-10 | Environment Schema Drift | C | unknown | NO | — | yes | [`data-10_environment-schema-drift.md`](./05_DATA_SCHEMA/data-10_environment-schema-drift.md) |

### API — API & Integration Surface — 10% / 9%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| API-01 | API Contract Drift | A | estimated | YES | — |  | [`api-01_api-contract-drift.md`](./06_API_INTEGRATION/api-01_api-contract-drift.md) |
| API-02 | Versioning & Breaking-Change Discipline | A | estimated | YES | — |  | [`api-02_versioning-breaking-change-discipline.md`](./06_API_INTEGRATION/api-02_versioning-breaking-change-discipline.md) |
| API-03 | Integration Point Bloat | B | estimated | PART | — |  | [`api-03_integration-point-bloat.md`](./06_API_INTEGRATION/api-03_integration-point-bloat.md) |
| API-04 | Synchronous Coupling & Chatty Interfaces | A | estimated | YES | — |  | [`api-04_synchronous-coupling-chatty-interfaces.md`](./06_API_INTEGRATION/api-04_synchronous-coupling-chatty-interfaces.md) |
| API-05 | Third-Party & Vendor API Dependency Risk | A | estimated | YES | — |  | [`api-05_third-party-vendor-api-dependency-risk.md`](./06_API_INTEGRATION/api-05_third-party-vendor-api-dependency-risk.md) |
| API-06 | Protocol & Data-Format Legaciness | A | measured | YES | — |  | [`api-06_protocol-data-format-legaciness.md`](./06_API_INTEGRATION/api-06_protocol-data-format-legaciness.md) |
| API-07 | Error Handling & API Observability Semantics | A | estimated | YES | — |  | [`api-07_error-handling-api-observability-semantics.md`](./06_API_INTEGRATION/api-07_error-handling-api-observability-semantics.md) |
| API-08 | Consumer Blindness & Backward Compatibility | D | unknown | NO | — |  | [`api-08_consumer-blindness-backward-compatibility.md`](./06_API_INTEGRATION/api-08_consumer-blindness-backward-compatibility.md) |
| API-09 | Idempotency & Retry Semantics | A | estimated | YES | — | yes | [`api-09_idempotency-retry-semantics.md`](./06_API_INTEGRATION/api-09_idempotency-retry-semantics.md) |
| API-10 | Contract Schema Evolution Process | A | estimated | YES | — | yes | [`api-10_contract-schema-evolution-process.md`](./06_API_INTEGRATION/api-10_contract-schema-evolution-process.md) |

### VEL — Developer Velocity & Operational Drag — 10% / 9%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| VEL-01 | CI/CD Build Duration | B | estimated | PART | — |  | [`vel-01_ci-cd-build-duration.md`](./07_VELOCITY_OPERATIONAL/vel-01_ci-cd-build-duration.md) |
| VEL-02 | Local Dev Setup Time & Friction | A | estimated | YES | — |  | [`vel-02_local-dev-setup-time-friction.md`](./07_VELOCITY_OPERATIONAL/vel-02_local-dev-setup-time-friction.md) |
| VEL-03 | Deployment Failure Rate (CFR) | B | unknown | NO | G6* |  | [`vel-03_deployment-failure-rate.md`](./07_VELOCITY_OPERATIONAL/vel-03_deployment-failure-rate.md) |
| VEL-04 | Deployment Frequency & Lead Time | B | estimated | PART | — |  | [`vel-04_deployment-frequency-lead-time.md`](./07_VELOCITY_OPERATIONAL/vel-04_deployment-frequency-lead-time.md) |
| VEL-05 | Onboarding Lead Time to First Production PR | D | unknown | NO | — |  | [`vel-05_onboarding-lead-time-to-first-production-pr.md`](./07_VELOCITY_OPERATIONAL/vel-05_onboarding-lead-time-to-first-production-pr.md) |
| VEL-06 | Bus Factor / Knowledge Concentration | A | measured | YES | — |  | [`vel-06_bus-factor-knowledge-concentration.md`](./07_VELOCITY_OPERATIONAL/vel-06_bus-factor-knowledge-concentration.md) |
| VEL-07 | Environment Reproducibility / Works-on-My-Machine | A | estimated | YES | — |  | [`vel-07_environment-reproducibility-works-on-my-machine.md`](./07_VELOCITY_OPERATIONAL/vel-07_environment-reproducibility-works-on-my-machine.md) |
| VEL-08 | Manual Release Steps & Operability | A | measured | YES | G6 |  | [`vel-08_manual-release-steps-operability.md`](./07_VELOCITY_OPERATIONAL/vel-08_manual-release-steps-operability.md) |
| VEL-09 | PR & Code-Review Hygiene | A | measured | YES | — |  | [`vel-09_pr-code-review-hygiene.md`](./07_VELOCITY_OPERATIONAL/vel-09_pr-code-review-hygiene.md) |
| VEL-10 | Branching & Monorepo Strategy Legacy | A | measured | YES | — |  | [`vel-10_branching-monorepo-strategy-legacy.md`](./07_VELOCITY_OPERATIONAL/vel-10_branching-monorepo-strategy-legacy.md) |
| VEL-11 | Developer Experience Tooling | B | estimated | PART | — | yes | [`vel-11_developer-experience-tooling.md`](./07_VELOCITY_OPERATIONAL/vel-11_developer-experience-tooling.md) |
| VEL-12 | Incident Recovery / MTTR | D | unknown | NO | — | yes | [`vel-12_incident-recovery-mttr.md`](./07_VELOCITY_OPERATIONAL/vel-12_incident-recovery-mttr.md) |

### PERF — Performance & Cloud/Infra Fit — 10% / 9%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| PERF-01 | Observability Gaps | A | estimated | YES | — |  | [`perf-01_observability-gaps.md`](./08_PERFORMANCE_CLOUD/perf-01_observability-gaps.md) |
| PERF-02 | Legacy Deployment Model | A | measured | YES | — |  | [`perf-02_legacy-deployment-model.md`](./08_PERFORMANCE_CLOUD/perf-02_legacy-deployment-model.md) |
| PERF-03 | Resource Waste / Leakage | C | unknown | NO | — |  | [`perf-03_resource-waste-leakage.md`](./08_PERFORMANCE_CLOUD/perf-03_resource-waste-leakage.md) |
| PERF-04 | Monolithic Scaling Bottleneck | C | unknown | NO | — |  | [`perf-04_monolithic-scaling-bottleneck.md`](./08_PERFORMANCE_CLOUD/perf-04_monolithic-scaling-bottleneck.md) |
| PERF-05 | No Auto-Scaling / Capacity Planning | B | estimated | PART | — |  | [`perf-05_no-auto-scaling-capacity-planning.md`](./08_PERFORMANCE_CLOUD/perf-05_no-auto-scaling-capacity-planning.md) |
| PERF-06 | Missing IaC / Config Drift | A | estimated | YES | — |  | [`perf-06_missing-iac-config-drift.md`](./08_PERFORMANCE_CLOUD/perf-06_missing-iac-config-drift.md) |
| PERF-07 | No SLOs / Performance Budgets | B | estimated | PART | — |  | [`perf-07_no-slos-performance-budgets.md`](./08_PERFORMANCE_CLOUD/perf-07_no-slos-performance-budgets.md) |
| PERF-08 | Runtime Waste & Startup Latency | C | unknown | NO | — |  | [`perf-08_runtime-waste-startup-latency.md`](./08_PERFORMANCE_CLOUD/perf-08_runtime-waste-startup-latency.md) |
| PERF-09 | Cost Efficiency / FinOps | D | unknown | NO | — | yes | [`perf-09_cost-efficiency-finops.md`](./08_PERFORMANCE_CLOUD/perf-09_cost-efficiency-finops.md) |
| PERF-10 | Disaster Recovery & Resiliency | D | unknown | NO | — | yes | [`perf-10_disaster-recovery-resiliency.md`](./08_PERFORMANCE_CLOUD/perf-10_disaster-recovery-resiliency.md) |

### DOCS — Documentation & Knowledge Continuity — 5% / 4.5%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| DOCS-01 | Missing Architectural Decision Records (ADRs) | A | measured | YES | — |  | [`docs-01_missing-architectural-decision-records.md`](./09_DOCS_KNOWLEDGE/docs-01_missing-architectural-decision-records.md) |
| DOCS-02 | Stale / Drifted Documentation | A | estimated | YES | — |  | [`docs-02_stale-drifted-documentation.md`](./09_DOCS_KNOWLEDGE/docs-02_stale-drifted-documentation.md) |
| DOCS-03 | Missing Runbooks & Operational Docs | A | measured | YES | — |  | [`docs-03_missing-runbooks-operational-docs.md`](./09_DOCS_KNOWLEDGE/docs-03_missing-runbooks-operational-docs.md) |
| DOCS-04 | No Onboarding Guide / Developer Setup Docs | A | measured | YES | — |  | [`docs-04_no-onboarding-guide-developer-setup-docs.md`](./09_DOCS_KNOWLEDGE/docs-04_no-onboarding-guide-developer-setup-docs.md) |
| DOCS-05 | Tribal Knowledge & Oral Tradition | D | unknown | NO | — |  | [`docs-05_tribal-knowledge-oral-tradition.md`](./09_DOCS_KNOWLEDGE/docs-05_tribal-knowledge-oral-tradition.md) |
| DOCS-06 | Comment Debt & Self-Documenting Code Imbalance | A | estimated | YES | — |  | [`docs-06_comment-debt-self-documenting-code-imbalance.md`](./09_DOCS_KNOWLEDGE/docs-06_comment-debt-self-documenting-code-imbalance.md) |
| DOCS-07 | Missing API Documentation | A | measured | YES | — |  | [`docs-07_missing-api-documentation.md`](./09_DOCS_KNOWLEDGE/docs-07_missing-api-documentation.md) |
| DOCS-08 | No Release Communication / Changelog | A | measured | YES | — |  | [`docs-08_no-release-communication-changelog.md`](./09_DOCS_KNOWLEDGE/docs-08_no-release-communication-changelog.md) |
| DOCS-09 | Docs-as-Code & Automation | A | measured | YES | — | yes | [`docs-09_docs-as-code-automation.md`](./09_DOCS_KNOWLEDGE/docs-09_docs-as-code-automation.md) |
| DOCS-10 | Knowledge Exit & Documentation Ownership | D | unknown | NO | — | yes | [`docs-10_knowledge-exit-documentation-ownership.md`](./09_DOCS_KNOWLEDGE/docs-10_knowledge-exit-documentation-ownership.md) |

### FE — Frontend & Client Health — conditional 10%

| ID | Indicator | Tier | Status | v1 | Gates | Deep | Spec file |
|----|-----------|------|--------|----|-------|------|-----------|
| FE-01 | UI Framework / Stack EOL & Deprecation | A | measured | YES | — |  | [`fe-01_ui-framework-stack-eol-deprecation.md`](./10_FRONTEND_CLIENT/fe-01_ui-framework-stack-eol-deprecation.md) |
| FE-02 | Bundle Size & Load Performance | C | unknown | NO | — |  | [`fe-02_bundle-size-load-performance.md`](./10_FRONTEND_CLIENT/fe-02_bundle-size-load-performance.md) |
| FE-03 | Accessibility Deficits | C | unknown | NO | — |  | [`fe-03_accessibility-deficits.md`](./10_FRONTEND_CLIENT/fe-03_accessibility-deficits.md) |
| FE-04 | Browser / Platform Support Drift | A | estimated | YES | — |  | [`fe-04_browser-platform-support-drift.md`](./10_FRONTEND_CLIENT/fe-04_browser-platform-support-drift.md) |
| FE-05 | Client-Side Architecture Debt | A | estimated | YES | — |  | [`fe-05_client-side-architecture-debt.md`](./10_FRONTEND_CLIENT/fe-05_client-side-architecture-debt.md) |
| FE-06 | Design System / UI Consistency Drift | A | estimated | YES | — |  | [`fe-06_design-system-ui-consistency-drift.md`](./10_FRONTEND_CLIENT/fe-06_design-system-ui-consistency-drift.md) |
| FE-07 | Internationalization / Localization Debt | A | estimated | YES | — |  | [`fe-07_internationalization-localization-debt.md`](./10_FRONTEND_CLIENT/fe-07_internationalization-localization-debt.md) |
| FE-08 | Mobile / Responsive Adaptation & Offline Support | C | unknown | NO | — | yes | [`fe-08_mobile-responsive-adaptation-offline-support.md`](./10_FRONTEND_CLIENT/fe-08_mobile-responsive-adaptation-offline-support.md) |

## 4. Drift corrections (Q5 protocol)

Specs arbitrate via each entry's own Definition + Detection text. Every divergence from either source is recorded here; at completion one commit applies these back to encyclopedia header lines and regenerates `PLANS/03`.

| ID | Encyclopedia said | Matrix 03 said | Spec rules as | Rationale |
|----|------------------|----------------|---------------|-----------|
| API-01 | A·estimated | A·measured | **A·estimated** | spec-vs-route matching across static inventories is heuristic alignment |
| API-02 | A·estimated | A·measured | **A·estimated** | version-marker presence is fact; discipline/breakage judgment inferred from history |
| API-03 | B·estimated | C·unknown | **B·estimated** | in-repo edge enumeration from configs; system topology beyond repo unknown |
| API-04 | B·estimated | A·estimated | **A·estimated** | await-chain shape + queue presence greppable (tier fix) |
| API-05 | B·unknown | A·estimated | **A·estimated** | host/key greps + abstraction-layer presence; vendor-risk judgment inferred |
| API-06 | A·estimated | A·measured | **A·measured** | protocol inventory over enumerated clients/servers = fact |
| API-07 | A·estimated | A·measured | **A·estimated** | error-schema/middleware presence factual; per-endpoint status semantics needs runtime sampling |
| API-08 | B·estimated | D·unknown | **D·unknown** | consumer telemetry/registry = org data |
| API-09 | B·unknown | A·estimated | **A·estimated** | idempotency-key middleware presence static (tier fix); enforcement proof needs replay test |
| API-10 | A·measured | D·unknown | **A·estimated** | compat-gate/registry presence in CI = facts; process maturity = inference |
| ARCH-11 | A·estimated | A·measured | **A·estimated** | type-coverage facts are static, but red-flag criterion needs incident share (unavailable) -> inference |
| DATA-02 | B·estimated | C·unknown | **B·estimated** | connection configs enumerable in-repo; cross-service sharing inferred; org topology unknown |
| DATA-03 | A·measured | C·unknown | **B·estimated** | live catalog unreachable; declared constraints in migrations/schema files = proxy inference |
| DATA-04 | B·unknown | C·unknown | **B·estimated** | storage inventory from compose/IaC/connection strings; vendor lifecycle lookup; weak |
| DATA-05 | B·unknown | C·unknown | **C·unknown** | (field-level rationale in spec §0) |
| DATA-06 | B·unknown | C·unknown | **B·estimated** | backup-job presence in CI/IaC observable; restore-drill evidence never is -> G7 stays needs-verification |
| DATA-07 | A·estimated | C·estimated | **A·estimated** | ORM-pattern greps static (tier fix); N+1 confirmation is inference |
| DATA-08 | B·estimated | A·estimated | **A·estimated** | migration/schema-file archaeology static |
| DATA-09 | B·unknown | A·measured | **A·measured** | history/outbox/audit-column presence over enumerated models = fact (presence-only) |
| DATA-10 | A·measured | C·unknown | **C·unknown** | cross-env schema diff impossible from one repo |
| DOCS-02 | B·estimated | A·estimated | **A·estimated** | doc-vs-code mtimes + removed-symbol grep computable from clone (tier fix) |
| DOCS-03 | B·unknown | A·measured | **A·measured** | docs/runbooks presence over enumerated tree = fact (presence-only) |
| DOCS-04 | B·estimated | A·measured | **A·measured** | CONTRIBUTING/setup-doc structure = fact (command dry-run excluded, no execution) |
| DOCS-07 | A·estimated | A·measured | **A·measured** | spec/generated-reference/docs-CI presence = facts (presence-only) |
| DOCS-08 | B·measured | A·measured | **A·measured** | CHANGELOG + GH releases API = facts |
| DOCS-09 | A·estimated | A·measured | **A·measured** | docs-CI step presence = fact |
| ECOS-01 | A·estimated | A·measured | **A·measured** | pin read (.nvmrc/Dockerfile/engines) -> endoflife.date lookup is a fact |
| ECOS-02 | A·estimated | A·measured | **A·measured** | registry/lockfile compare yields computed percentages; framework-gap classification mechanical |
| ECOS-03 | B·estimated | A·measured | **A·measured** | last-release date + archived flag per dep via registry APIs = facts (Socket optional) |
| ECOS-04 | B·estimated | A·estimated | **A·estimated** | static deprecation lints runnable, but signal uneven across ecosystems (Py warnings need execution) |
| ECOS-05 | B·measured | A·measured | **A·measured** | syft SBOM + licensee classification from lockfiles = static facts |
| ECOS-06 | A·estimated | A·measured | **A·measured** | lockfile transitive counts + knip/depcheck unused-direct counts = tool facts |
| ECOS-08 | A·estimated | A·measured | **A·measured** | framework support status via endoflife.date = fact; coupling-share secondary, still static |
| ECOS-09 | A·estimated | B·unknown | **B·estimated** | skew needs multi-service manifests; measurable only within a monorepo, else unknown |
| ECOS-10 | B·measured | A·measured | **A·measured** | Scorecard/osv/actions-pinning audit all remote-static |
| FE-01 | A·estimated | A·measured | **A·measured** | framework version -> endoflife.date = fact |
| FE-02 | A·measured | C·unknown | **C·unknown** | bundle measurement needs building/rendering = executing repo scripts (forbidden) |
| FE-03 | B·measured | C·unknown | **C·unknown** | axe/Lighthouse need render; lint-config presence too weak to score |
| FE-04 | B·measured | A·estimated | **A·estimated** | browserslist presence+currency = fact; support-judgment inferred |
| FE-05 | B·estimated | A·measured | **A·estimated** | LOC/store distributions static; seam/testability judgment inferred |
| FE-06 | C·unknown | A·estimated | **A·estimated** | token-adoption + hardcoded-color greps static (tier fix) |
| FE-07 | A·unknown | A·unknown | **A·estimated** | hardcoded-string density + i18n-lib presence static; thresholds uncalibrated |
| PERF-01 | B·measured | C·estimated | **A·estimated** | instrumentation deps/config presence static (tier fix); coverage/correlation quality inferred |
| PERF-02 | B·estimated | A·measured | **A·measured** | manifest presence (Dockerfile/k8s/tf) + VM-script smell = static facts |
| PERF-03 | B·unknown | C·unknown | **C·unknown** | (field-level rationale in spec §0) |
| PERF-04 | B·estimated | C·unknown | **C·unknown** | load experiment required |
| PERF-05 | B·estimated | C·unknown | **B·estimated** | HPA/ASG blocks in committed IaC = presence proof only; no-IaC repos stay unknown |
| PERF-06 | A·estimated | A·measured | **A·estimated** | IaC presence/coverage heuristic factual; true drift needs cloud creds -> inference |
| PERF-07 | C·unknown | C·estimated | **B·estimated** | SLO/dashboard-as-code/load-gate files greppable (tier fix); measured-SLO proof needs runtime |
| PERF-08 | B·measured | C·unknown | **C·unknown** | startup profiling = runtime |
| PERF-09 | B·unknown | D·unknown | **D·unknown** | (field-level rationale in spec §0) |
| SEC-03 | B·estimated | C·unknown | **C·unknown** | headers/TLS/DAST need a deployed target; nothing provable from URL |
| SEC-04 | B·unknown | C·estimated | **B·estimated** | grep-class static proxies (default-creds, client-side role checks) exist; weak -> estimated low |
| SEC-05 | B·unknown | C·unknown | **C·unknown** | log content/retention adequacy not judgeable statically |
| SEC-06 | B·measured | A·measured | **A·measured** | deep SCA over parsed lockfiles = static fact chain |
| SEC-09 | B·unknown | A·measured | **A·measured** | fuzz-harness/sanitizer-config presence over enumerated tree = fact (presence-only) |
| TEST-01 | A·measured | B·estimated | **B·estimated** | running coverage = test execution, forbidden (D5); CI-artifact/log proxy only |
| TEST-02 | B·measured | B·unknown | **B·unknown** | rerunning suites forbidden; Actions-history flake mining deferred to v2 deep scan |
| TEST-03 | A·estimated | A·measured | **A·estimated** | pyramid-tier assignment per file is a classification heuristic, not a fact |
| TEST-04 | B·measured | B·estimated | **B·estimated** | Actions job durations = elapsed-time signal only, not instrumented timing |
| TEST-07 | B·estimated | B·unknown | **B·unknown** | isolation provable only by executing suite (random/parallel); static greps too weak to score |
| TEST-09 | B·estimated | B·unknown | **B·unknown** | mutation testing executes repo code -> v2 deep scan only |
| TEST-10 | B·estimated | A·estimated | **A·estimated** | git archaeology fully automatable from clone (tier fix); commit-classification heuristic -> estimated |
| VEL-11 | B·estimated | B·measured | **B·estimated** | tooling inventory factual; cold-start timing needs execution |
| VEL-12 | B·unknown | D·unknown | **D·unknown** | incident tooling data = org plane |


---

## 5. Progress

- [ ] README (this file)
- [x] 01 ECOS ×10
- [x] 02 ARCH ×12
- [x] 03 TEST ×10
- [x] 04 SEC ×10
- [x] 05 DATA ×10
- [x] 06 API ×10
- [x] 07 VEL ×12
- [x] 08 PERF ×10
- [x] 09 DOCS ×10
- [x] 10 FE ×8
- [ ] Reconciliation pass: apply §4 corrections to encyclopedias, regenerate `PLANS/03`, add pointers in `03`/`05`.

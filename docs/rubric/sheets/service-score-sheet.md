# Service Score Sheet — <Service Name>

> **GENERATED FILE — do not hand-edit.** Written by `tooling/scripts/compile-rubric.ts`
> (`npm run compile:rubric`) from `docs/rubric/indicators/**` and
> `docs/rubric/model/config.md`. `npm run check:rubric-consistency` fails on any hand edit.

**System:** ______ · **Service:** ______ · **Criticality:** ☐ Critical path (×3) ☐ Supporting (×1) · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen ☐ Standard ☐ Deep

**Scoring legend:** 3 = Healthy (no flags) · 2 = Minor debt (yellow in non-core paths) · 1 = Severe debt (yellow in core OR red in isolated paths) · 0 = Critical (red in core OR across multiple paths) · **N/A** = not applicable (reason recorded; excluded) · **Unknown** = applicable but unmeasurable (unscored; included in the frozen denominator) · **Not implemented** = no detector in this scanner release (excluded).

**Core-path rule:** core = files reachable from public entry points touching money / auth / PII / compliance (global taxonomy — [`model/scale.md`](../model/scale.md) §2). Per-indicator criteria live in its canonical file under [`indicators/`](../indicators/).

**Category %** is the frozen-denominator formula in [`model/config.md`](../model/config.md) §2a: unknown rows add denominator without numerator points; N/A and not-implemented rows are excluded; deep-dive rows fold in only when run and applicable.

When a row is applicable but cannot be measured, leave its score blank and record `Unknown` in Notes/Evidence; include it in the applicable count. Record `Not implemented` distinctly and exclude it from the count.

---

## 1. Dependency & Ecosystem Health (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| ECOS-01 | Runtime/Language EOL | | |
| ECOS-02 | Major Package Drift | | |
| ECOS-03 | Abandoned / Unmaintained Libraries | | |
| ECOS-04 | Deprecated API Usage | | |
| ECOS-05 | License Compliance Risk | | |
| ECOS-06 | Dependency Bloat | | |
| ECOS-07 | Build Reproducibility & Lockfile Integrity | | |
| ECOS-08 | Framework Lock-in & Monoculture Risk | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: ECOS-09 ☐ score __ · ECOS-10 ☐ score __ *— folded in when run*

---

## 2. Architecture & Code Quality (weight 15% / 13.5% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| ARCH-01 | Cognitive Complexity & God Classes | | |
| ARCH-02 | Coupling & Cohesion | | |
| ARCH-03 | Layer & Boundary Violations | | |
| ARCH-04 | Dead & Orphaned Code | | |
| ARCH-05 | Code Churn vs. Defect Hot Spots | | |
| ARCH-06 | Architectural Era / Framework Generation | | |
| ARCH-07 | Global Mutable State & Hidden Dependencies | | |
| ARCH-08 | Duplication Debt | | |
| ARCH-09 | Agentic Operability (AI/LLM Codebase-Readiness) | | |
| ARCH-10 | Feature-Flag & Configuration Debt | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: ARCH-11 ☐ score __ · ARCH-12 ☐ score __ *— folded in when run*

---

## 3. Testing & Quality Engineering (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| TEST-01 | Code Coverage Degradation | | |
| TEST-02 | Flaky Test Rate | | |
| TEST-03 | Test Pyramid Inversion | | |
| TEST-04 | Test Run Time | | |
| TEST-05 | Skipped / Disabled Tests | | |
| TEST-06 | Core Domain Untested | | |
| TEST-07 | Test Isolation & Hermeticity | | |
| TEST-08 | Quality Gates in CI | | |
| TEST-10 | Test Maintenance Burden | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: TEST-09 ☐ score __ *— folded in when run*

---

## 4. Security, Compliance & Vulnerability (weight 20% / 18% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| SEC-01 | Unpatched Vulnerabilities | | |
| SEC-02 | Hardcoded Secrets & Credentials | | |
| SEC-03 | Missing Web Security Controls | | |
| SEC-04 | Authentication & Authorization Weaknesses | | |
| SEC-05 | Audit Logging Deficits | | |
| SEC-06 | Insecure Transitive Chains | | |
| SEC-07 | Patch Cadence & Update Workflow | | |
| SEC-08 | Compliance Drift | | |
| SEC-09 | Input Robustness & Fuzzing | | |
| SEC-10 | Security Testing in CI | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: none — this category has no deep-dive rows.

---

## 5. Data & Schema Evolution (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| DATA-01 | Schema Migration Backlog / "Migration Hell" | | |
| DATA-02 | Database Coupling & Hidden Dependencies | | |
| DATA-03 | Data Integrity & Constraint Degradation | | |
| DATA-04 | Legacy Storage Technology | | |
| DATA-05 | Lock Contention & Scaling Bottleneck | | |
| DATA-06 | Data Lifecycle Management Deficits | | |
| DATA-07 | ORM / Query Performance Smells | | |
| DATA-08 | Schema Overfitting & Model Rigidity | | |
| DATA-10 | Environment Schema Drift | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: DATA-09 ☐ score __ *— folded in when run*

---

## 6. API & Integration Surface (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| API-01 | API Contract Drift | | |
| API-02 | Versioning & Breaking-Change Discipline | | |
| API-03 | Integration Point Bloat | | |
| API-04 | Synchronous Coupling & Chatty Interfaces | | |
| API-05 | Third-Party & Vendor API Dependency Risk | | |
| API-06 | Protocol & Data-Format Legaciness | | |
| API-07 | Error Handling & API Observability Semantics | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: API-08 ☐ score __ · API-09 ☐ score __ · API-10 ☐ score __ *— folded in when run*

---

## 7. Developer Velocity & Operational Drag (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| VEL-01 | CI/CD Build Duration | | |
| VEL-02 | Local Dev Setup Time & Friction | | |
| VEL-03 | Deployment Failure Rate (CFR) | | |
| VEL-04 | Deployment Frequency & Lead Time | | |
| VEL-05 | Onboarding Lead Time to First Production PR | | |
| VEL-06 | Bus Factor / Knowledge Concentration | | |
| VEL-07 | Environment Reproducibility / Works-on-My-Machine | | |
| VEL-08 | Manual Release Steps & Operability | | |
| VEL-09 | PR & Code-Review Hygiene | | |
| VEL-10 | Branching & Monorepo Strategy Legacy | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: VEL-11 ☐ score __ · VEL-12 ☐ score __ *— folded in when run*

---

## 8. Performance & Cloud/Infrastructure Fit (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| PERF-01 | Observability Gaps | | |
| PERF-02 | Legacy Deployment Model | | |
| PERF-03 | Resource Waste / Leakage | | |
| PERF-04 | Monolithic Scaling Bottleneck | | |
| PERF-05 | No Auto-Scaling / Capacity Planning | | |
| PERF-06 | Missing IaC / Config Drift | | |
| PERF-07 | No SLOs / Performance Budgets | | |
| PERF-08 | Runtime Waste & Startup Latency | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: PERF-09 ☐ score __ · PERF-10 ☐ score __ *— folded in when run*

---

## 9. Documentation & Knowledge Continuity (weight 5% / 4.5% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| DOCS-01 | Missing Architectural Decision Records (ADRs) | | |
| DOCS-02 | Stale / Drifted Documentation | | |
| DOCS-03 | Missing Runbooks & Operational Docs | | |
| DOCS-04 | No Onboarding Guide / Developer Setup Docs | | |
| DOCS-05 | Tribal Knowledge & Oral Tradition | | |
| DOCS-06 | Comment Debt & Self-Documenting Code Imbalance | | |
| DOCS-07 | Missing API Documentation | | |
| DOCS-08 | No Release Communication / Changelog | | |
| DOCS-09 | Docs-as-Code & Automation | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: DOCS-10 ☐ score __ *— folded in when run*

---

## 10. Frontend & Client Health *(annex — FE-active only · weight 10%)*

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| FE-01 | UI Framework / Stack EOL & Deprecation | | |
| FE-02 | Bundle Size & Load Performance | | |
| FE-03 | Accessibility Deficits | | |
| FE-04 | Browser / Platform Support Drift | | |
| FE-05 | Client-Side Architecture Debt | | |
| FE-06 | Design System / UI Consistency Drift | | |
| FE-07 | Internationalization / Localization Debt | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: FE-08 ☐ score __ *— folded in when run*

---

## Service rollup

| Category | Category % | Weight (base / FE-active) | Weighted |
|----------|-----------:|:-------------------------:|---------:|
| Dependency & Ecosystem Health | __% | 10% / 9% | __% |
| Architecture & Code Quality | __% | 15% / 13.5% | __% |
| Testing & Quality Engineering | __% | 10% / 9% | __% |
| Security, Compliance & Vulnerability | __% | 20% / 18% | __% |
| Data & Schema Evolution | __% | 10% / 9% | __% |
| API & Integration Surface | __% | 10% / 9% | __% |
| Developer Velocity & Operational Drag | __% | 10% / 9% | __% |
| Performance & Cloud/Infrastructure Fit | __% | 10% / 9% | __% |
| Documentation & Knowledge Continuity | __% | 5% / 4.5% | __% |
| Frontend & Client Health *(FE-active only)* | __% | — / 10% | __% |
| **Service weighted score** | | | **__%** |

> ✓ pick the weight column matching whether this system has a client.

**Gates triggered by this service:** ☐ none ☐ G1 Credential exposure ☐ G2 Critical vuln exposure ☐ G3 Runtime EOL, no path out ☐ G4 OWASP Top-10 reachable ☐ G5 Untested core ☐ G6 Delivery is on fire ☐ G7 Data-rescue risk ☐ G8 Copyleft in closed-source distribution

**Top 3 modernization blockers found in this service:**
1. ______
2. ______
3. ______

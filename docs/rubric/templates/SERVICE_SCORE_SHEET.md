# Service Score Sheet — <Service Name>

**System:** ______ · **Service:** ______ · **Criticality:** ☐ Critical path (×3) ☐ Supporting (×1) · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen ☐ Standard ☐ Deep

**Scoring legend:** 3 = Healthy (no flags) · 2 = Minor debt (yellow in non-core paths) · 1 = Severe debt (yellow in core OR red in isolated paths) · 0 = Critical (red in core OR across multiple paths) · **N/A** = not applicable to this system (score blank, marked N/A with a reason — excluded from the denominator).

**Core-path rule:** core = files reachable from public entry points touching money / auth / PII / compliance (global taxonomy — `00` Part 1). Per-indicator criteria live in the encyclopedia entry.

**Category % = (Σ applicable scores ÷ applicable count × 3) × 100.** Mark N/A rows and do not count them in the denominator. Deep-dive rows (last line of each category) are run in deep audits only and fold into the applicable set.

---

## 1. Dependency & Ecosystem Health (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| ECOS-01 | Runtime/Language EOL | | |
| ECOS-02 | Major package drift | | |
| ECOS-03 | Abandoned libraries | | |
| ECOS-04 | Deprecated API usage | | |
| ECOS-05 | License compliance risk | | |
| ECOS-06 | Dependency bloat | | |
| ECOS-07 | Build reproducibility | | |
| ECOS-08 | Framework lock-in risk | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: ECOS-09 ☐ score __ · ECOS-10 ☐ score __ *— folded in when run*

---

## 2. Architecture & Code Quality (weight 15% / 13.5% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| ARCH-01 | Cognitive complexity / God classes | | |
| ARCH-02 | Coupling / low cohesion | | |
| ARCH-03 | Layer violations | | |
| ARCH-04 | Dead & orphaned code | | |
| ARCH-05 | Churn vs. defect hot spots | | |
| ARCH-06 | Framework generation shift | | |
| ARCH-07 | Global mutable state | | |
| ARCH-08 | Duplication debt | | |
| ARCH-09 | AI/LLM codebase-readiness | | |
| ARCH-10 | Feature-flag & config debt | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: ARCH-11 ☐ score __ · ARCH-12 ☐ score __ *— folded in when run*

---

## 3. Testing & Quality Engineering (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| TEST-01 | Branch coverage | | |
| TEST-02 | Flaky test rate | | |
| TEST-03 | Test pyramid inversion | | |
| TEST-04 | Test run time | | |
| TEST-05 | Skipped/disabled tests | | |
| TEST-06 | Core domain untested | | |
| TEST-07 | Test isolation | | |
| TEST-08 | Quality gates in CI | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: TEST-09 ☐ score __ · TEST-10 ☐ score __ *— folded in when run*

---

## 4. Security, Compliance & Vulnerability (weight 20% / 18% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| SEC-01 | Unpatched vulnerabilities | | |
| SEC-02 | Hardcoded secrets | | |
| SEC-03 | Missing web security controls | | |
| SEC-04 | AuthN/AuthZ weaknesses | | |
| SEC-05 | Audit logging deficits | | |
| SEC-06 | Insecure transitive chains | | |
| SEC-07 | Patch cadence | | |
| SEC-08 | Compliance drift | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: SEC-09 ☐ score __ · SEC-10 ☐ score __ *— folded in when run*

---

## 5. Data & Schema Evolution (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| DATA-01 | Migration backlog | | |
| DATA-02 | DB coupling | | |
| DATA-03 | Data integrity | | |
| DATA-04 | Legacy storage | | |
| DATA-05 | Lock contention | | |
| DATA-06 | Data lifecycle | | |
| DATA-07 | ORM/query smells | | |
| DATA-08 | Schema overfitting | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: DATA-09 ☐ score __ · DATA-10 ☐ score __ *— folded in when run*

---

## 6. API & Integration Surface (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| API-01 | Contract drift | | |
| API-02 | Versioning discipline | | |
| API-03 | Integration bloat | | |
| API-04 | Sync coupling | | |
| API-05 | Third-party API risk | | |
| API-06 | Protocol legaciness | | |
| API-07 | Error handling | | |
| API-08 | Consumer blindness | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: API-09 ☐ score __ · API-10 ☐ score __ *— folded in when run*

---

## 7. Developer Velocity & Operational Drag (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| VEL-01 | CI/CD build duration | | |
| VEL-02 | Local setup friction | | |
| VEL-03 | Deployment failure rate | | |
| VEL-04 | Lead time / deploy freq | | |
| VEL-05 | Onboarding lead time | | |
| VEL-06 | Bus factor | | |
| VEL-07 | Environment reproducibility | | |
| VEL-08 | Manual release steps | | |
| VEL-09 | PR & code-review hygiene | | |
| VEL-10 | Branching/monorepo strategy legacy | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: VEL-11 ☐ score __ · VEL-12 ☐ score __ *— folded in when run*

---

## 8. Performance & Cloud/Infrastructure Fit (weight 10% / 9% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| PERF-01 | Observability gaps | | |
| PERF-02 | Legacy deployment model | | |
| PERF-03 | Resource waste/leakage | | |
| PERF-04 | Monolithic scaling | | |
| PERF-05 | No autoscaling/capacity | | |
| PERF-06 | Missing IaC / config drift | | |
| PERF-07 | No SLOs/perf budgets | | |
| PERF-08 | Runtime waste | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: PERF-09 ☐ score __ · PERF-10 ☐ score __ *— folded in when run*

---

## 9. Documentation & Knowledge Continuity (weight 5% / 4.5% FE-active)

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| DOCS-01 | Missing ADRs | | |
| DOCS-02 | Stale/drifted docs | | |
| DOCS-03 | Missing runbooks | | |
| DOCS-04 | No onboarding guide | | |
| DOCS-05 | Tribal knowledge | | |
| DOCS-06 | Comment debt | | |
| DOCS-07 | Missing API docs | | |
| DOCS-08 | No release communication | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: DOCS-09 ☐ score __ · DOCS-10 ☐ score __ *— folded in when run*

---

## 10. Frontend & Client Health *(annex in standard audits; folded into the system total when the system has a client)*

| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |
|----|-----------|:-----------------:|------------------|
| FE-01 | UI framework EOL | | |
| FE-02 | Bundle size & load perf | | |
| FE-03 | Accessibility deficits | | |
| FE-04 | Browser/platform support drift | | |
| FE-05 | Client architecture debt | | |
| FE-06 | Design system / UI consistency | | |
| FE-07 | i18n / localization debt | | |
| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |

Deep-dive: FE-08 ☐ score __ *— folded in as an FE applicable row when run*

---

## Service rollup

| Category | Category % | Weight (base / FE-active) | Weighted |
|----------|-----------:|:-------------------------:|---------:|
| Dependency & Ecosystem | __% | __% / __% | __% |
| Architecture & Code Quality | __% | __% / __% | __% |
| Testing & Quality | __% | __% / __% | __% |
| Security, Compliance & Vulnerability | __% | __% / __% | __% |
| Data & Schema | __% | __% / __% | __% |
| API & Integration | __% | __% / __% | __% |
| Developer Velocity & Operational | __% | __% / __% | __% |
| Performance & Cloud/Infrastructure | __% | __% / __% | __% |
| Documentation & Knowledge | __% | __% / __% | __% |
| Frontend & Client *(FE-active only)* | __% | — / 10% | __% |
| **Service weighted score** | | | **__%** |

> ✓ pick the weight column matching whether this system has a client.

**Gates triggered by this service:** ☐ none ☐ G1 secrets ☐ G2 crit-CVE ☐ G3 runtime EOL ☐ G4 OWASP reachable ☐ G5 core untested ☐ G6 CFR+manual deploys ☐ G7 data-rescue ☐ G8 copyleft

**Top 3 modernization blockers found in this service:**
1. ______
2. ______
3. ______
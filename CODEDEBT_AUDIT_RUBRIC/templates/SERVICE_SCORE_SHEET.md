# Service Score Sheet — <Service Name>

**System:** ______ · **Service:** ______ · **Criticality:** ☐ Critical path (×3) ☐ Supporting (×1) · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen ☐ Standard ☐ Deep

**Scoring legend:** 3 = Healthy (no flags) · 2 = Minor debt (yellow in non-critical paths) · 1 = Severe debt (yellow in core OR red in isolated paths) · 0 = Critical (red in core OR across multiple paths)

Score each row 0–3. Category % = (sum of 8 rows ÷ 24) × 100. Deep-dive rows are optional (deep audits only).

---

## 1. Dependency & Ecosystem Health (weight 10%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| ECOS-01 | Runtime/Language EOL | | |
| ECOS-02 | Major package drift | | |
| ECOS-03 | Abandoned libraries | | |
| ECOS-04 | Deprecated API usage | | |
| ECOS-05 | License compliance risk | | |
| ECOS-06 | Dependency bloat | | |
| ECOS-07 | Build reproducibility | | |
| ECOS-08 | Framework lock-in risk | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: ECOS-09 ☐ score __ · ECOS-10 ☐ score __

---

## 2. Architecture & Code Quality (weight 15%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| ARCH-01 | Cognitive complexity / God classes | | |
| ARCH-02 | Coupling / low cohesion | | |
| ARCH-03 | Layer violations | | |
| ARCH-04 | Dead & orphaned code | | |
| ARCH-05 | Churn vs. defect hot spots | | |
| ARCH-06 | Framework generation shift | | |
| ARCH-07 | Global mutable state | | |
| ARCH-08 | Duplication debt | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: ARCH-09 ☐ score __ · ARCH-10 ☐ score __

---

## 3. Testing & Quality Engineering (weight 10%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| TEST-01 | Branch coverage | | |
| TEST-02 | Flaky test rate | | |
| TEST-03 | Test pyramid inversion | | |
| TEST-04 | Test run time | | |
| TEST-05 | Skipped/disabled tests | | |
| TEST-06 | Core domain untested | | |
| TEST-07 | Test isolation | | |
| TEST-08 | Quality gates in CI | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: TEST-09 ☐ score __ · TEST-10 ☐ score __

---

## 4. Security, Compliance & Vulnerability (weight 20%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| SEC-01 | Unpatched vulnerabilities | | |
| SEC-02 | Hardcoded secrets | | |
| SEC-03 | Missing web security controls | | |
| SEC-04 | AuthN/AuthZ weaknesses | | |
| SEC-05 | Audit logging deficits | | |
| SEC-06 | Insecure transitive chains | | |
| SEC-07 | Patch cadence | | |
| SEC-08 | Compliance drift | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: SEC-09 ☐ score __ · SEC-10 ☐ score __

---

## 5. Data & Schema Evolution (weight 10%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| DATA-01 | Migration backlog | | |
| DATA-02 | DB coupling | | |
| DATA-03 | Data integrity | | |
| DATA-04 | Legacy storage | | |
| DATA-05 | Lock contention | | |
| DATA-06 | Data lifecycle | | |
| DATA-07 | ORM/query smells | | |
| DATA-08 | Schema overfitting | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: DATA-09 ☐ score __ · DATA-10 ☐ score __

---

## 6. API & Integration Surface (weight 10%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| API-01 | Contract drift | | |
| API-02 | Versioning discipline | | |
| API-03 | Integration bloat | | |
| API-04 | Sync coupling | | |
| API-05 | Third-party API risk | | |
| API-06 | Protocol legaciness | | |
| API-07 | Error handling | | |
| API-08 | Consumer blindness | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: API-09 ☐ score __ · API-10 ☐ score __

---

## 7. Developer Velocity & Operational Drag (weight 10%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| VEL-01 | CI/CD build duration | | |
| VEL-02 | Local setup friction | | |
| VEL-03 | Deployment failure rate | | |
| VEL-04 | Lead time / deploy freq | | |
| VEL-05 | Onboarding lead time | | |
| VEL-06 | Bus factor | | |
| VEL-07 | Environment reproducibility | | |
| VEL-08 | Manual release steps | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: VEL-09 ☐ score __ · VEL-10 ☐ score __

---

## 8. Performance & Cloud/Infrastructure Fit (weight 10%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| PERF-01 | Observability gaps | | |
| PERF-02 | Legacy deployment model | | |
| PERF-03 | Resource waste/leakage | | |
| PERF-04 | Monolithic scaling | | |
| PERF-05 | No autoscaling/capacity | | |
| PERF-06 | Missing IaC / config drift | | |
| PERF-07 | No SLOs/perf budgets | | |
| PERF-08 | Runtime waste | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: PERF-09 ☐ score __ · PERF-10 ☐ score __

---

## 9. Documentation & Knowledge Continuity (weight 5%)

| ID | Indicator | Score (0–3) | Notes / Evidence |
|----|-----------|:-----------:|------------------|
| DOCS-01 | Missing ADRs | | |
| DOCS-02 | Stale/drifted docs | | |
| DOCS-03 | Missing runbooks | | |
| DOCS-04 | No onboarding guide | | |
| DOCS-05 | Tribal knowledge | | |
| DOCS-06 | Comment debt | | |
| DOCS-07 | Missing API docs | | |
| DOCS-08 | No release communication | | |
| | **Subtotal** | **___ / 24** | **Category % = ___%** |

Deep-dive: DOCS-09 ☐ score __ · DOCS-10 ☐ score __

---

## Service rollup

| Category | Category % | Weight | Weighted |
|----------|-----------:|-------:|---------:|
| Dependency & Ecosystem | __% | 10% | __% |
| Architecture & Code Quality | __% | 15% | __% |
| Testing & Quality | __% | 10% | __% |
| Security, Compliance & Vulnerability | __% | 20% | __% |
| Data & Schema | __% | 10% | __% |
| API & Integration | __% | 10% | __% |
| Developer Velocity & Operational | __% | 10% | __% |
| Performance & Cloud/Infrastructure | __% | 10% | __% |
| Documentation & Knowledge | __% | 5% | __% |
| **Service weighted score** | | | **__%** |

Frontend module (annex, not in total): ☐ N/A ☐ scored __% in `10_FRONTEND_CLIENT.md`

**Gates triggered by this service:** ☐ none ☐ G1 secrets ☐ G2 crit-CVE ☐ G3 runtime EOL ☐ G4 OWASP reachable ☐ G5 core untested ☐ G6 CFR+manual deploys

**Top 3 modernization blockers found in this service:**
1. ______
2. ______
3. ______

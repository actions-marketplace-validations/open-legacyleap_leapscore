# System Score Sheet — <System Name>

**System:** ______ · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen (1 day) ☐ Standard (2–3 days) ☐ Deep (1–2 weeks)

**Scoring legend:** 3 = Healthy · 2 = Minor debt · 1 = Severe debt · 0 = Critical. Category % = (row sum ÷ 24) × 100. Deep-dive rows are optional.

**Instructions:** Fill one `SERVICE_SCORE_SHEET.md` per service. Enter each service's weighted score and criticality below, then compute the system rollup.

---

## Part A — Gate check (read first, decide first)

| # | Gate | Red Flag? | Evidence |
|---|------|:---------:|----------|
| G1 | Credential exposure (SEC-02) | ☐ Y ☐ N | |
| G2 | Critical CVE > 14 days exposed (SEC-01) | ☐ Y ☐ N | |
| G3 | Runtime EOL, no path out (ECOS-01) | ☐ Y ☐ N | |
| G4 | OWASP Top-10 reachable (SEC-03/04) | ☐ Y ☐ N | |
| G5 | Core domain untested (TEST-06) | ☐ Y ☐ N | |
| G6 | CFR > 30% + manual deploys (VEL-03/08) | ☐ Y ☐ N | |

> Any ☐ Y → verdict capped at **High Risk / Obsolete** (unless the numeric score is already below 27%, then Critical).

---

## Part B — Per-service scores

| Service | Criticality (×3 / ×1) | Weighted score % | Weighted score × criticality |
|---------|:---------------------:|:----------------:|:---------------------------:|
| 1. ______ | ☐ 3 ☐ 1 | __% | __ |
| 2. ______ | ☐ 3 ☐ 1 | __% | __ |
| 3. ______ | ☐ 3 ☐ 1 | __% | __ |
| 4. ______ | ☐ 3 ☐ 1 | __% | __ |
| 5. ______ | ☐ 3 ☐ 1 | __% | __ |
| 6. ______ | ☐ 3 ☐ 1 | __% | __ |
| 7. ______ | ☐ 3 ☐ 1 | __% | __ |
| 8. ______ | ☐ 3 ☐ 1 | __% | __ |
| **Totals** | Σ weights = ____ | | **Σ weighted = ____** |

> **Note:** If you scored categories per-service, roll up **per category** instead (use the category % columns from each service sheet): System category% = Σ(service category% × service criticality) ÷ Σ weights. Then apply Part C weights.

---

## Part C — System rollup

**Option 1 — category-level rollup (preferred when services were scored per category):**

| Category | System category % | Weight | Weighted |
|----------|:-----------------:|:------:|:--------:|
| Dependency & Ecosystem | __% | 10% | __% |
| Architecture & Code Quality | __% | 15% | __% |
| Testing & Quality | __% | 10% | __% |
| Security, Compliance & Vulnerability | __% | 20% | __% |
| Data & Schema | __% | 10% | __% |
| API & Integration | __% | 10% | __% |
| Developer Velocity & Operational | __% | 10% | __% |
| Performance & Cloud/Infrastructure | __% | 10% | __% |
| Documentation & Knowledge | __% | 5% | __% |
| **SYSTEM SCORE** | | | **____%** |

**Option 2 — service-level rollup (quick):** System score = Σ weighted ÷ Σ criticality weights (from Part B) = **____%**

**Frontend annex (separate, not in total):** ☐ N/A ☐ FE module score = **__%** (from `10_FRONTEND_CLIENT.md`)

---

## Part D — Verdict

| Tier | Threshold | Result |
|------|-----------|:------:|
| Healthy | ≥ 80% | ☐ |
| Moderate Technical Debt | 53–79% | ☐ |
| High Risk / Obsolete | 27–52% | ☐ |
| Critical Risk / Legacy Failure | < 27% | ☐ |
| **Gate override** (any G1–G6 Red Flag → cap at High Risk) | | ☐ Applied ☐ Not applicable |

**FINAL VERDICT:** ______

---

## Part E — Modernization decision

- ☐ **Maintain:** continuous refactoring + incremental dependency updates.
- ☐ **Refactor:** dedicated sprints; priority = security + EOL dependencies + highest-risk gates.
- ☐ **Modernize (isolate + rebuild):** facade around core domain; migrate module-by-module; treat as initiative.
- ☐ **Rewrite / Rescue:** critical risk; scope a rescue or containment strategy; freeze new debt.

**Recommended first 90 days (top blockers, one line each):**
1. ______
2. ______
3. ______

**Required before next audit (verification):** ______

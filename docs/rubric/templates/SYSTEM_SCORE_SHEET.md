# System Score Sheet — <System Name>

**System:** ______ · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen (1 day) ☐ Standard (2–3 days) ☐ Deep (1–2 weeks)

**Scoring legend:** 3 = Healthy · 2 = Minor debt · 1 = Severe debt · 0 = Critical · N/A = not applicable (excluded, reason in notes) · Unknown = applicable but unmeasurable (unscored, included in the frozen denominator) · Not implemented = no detector in this scanner release (excluded). Category % = (Σ measured and estimated scores ÷ ((measured + estimated + applicable unknown count) × 3)) × 100. Deep-dive rows are recorded on the service sheets and fold into category % when run and applicable. Weights come from `11_WEIGHTS_THRESHOLDS_CONFIG.md` — use the **FE-active** column if the system has a client.

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
| G7 | Data-rescue risk, restore never proven (DATA-06) | ☐ Y ☐ N | |
| G8 | Copyleft in closed-source distribution (ECOS-05) | ☐ Y ☐ N | |

> Any ☐ Y → verdict capped at **High** (unless the numeric score is already below 27%, then Critical).

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

**Weights:** from `11_WEIGHTS_THRESHOLDS_CONFIG.md`. Mark which set applies: ☐ Base (no client) ☐ FE-active (client present → FE 10%, others ×0.9).

| Category | System category % | Weight | Weighted |
|----------|:-----------------:|:------:|:--------:|
| Dependency & Ecosystem | __% | __% | __% |
| Architecture & Code Quality | __% | __% | __% |
| Testing & Quality | __% | __% | __% |
| Security, Compliance & Vulnerability | __% | __% | __% |
| Data & Schema | __% | __% | __% |
| API & Integration | __% | __% | __% |
| Developer Velocity & Operational | __% | __% | __% |
| Performance & Cloud/Infrastructure | __% | __% | __% |
| Documentation & Knowledge | __% | __% | __% |
| Frontend & Client *(FE-active only)* | __% | __% | __% |
| **SYSTEM SCORE** | | | **____%** |

**Option 2 — service-level rollup (quick):** System score = Σ weighted ÷ Σ criticality weights (from Part B) = **____%** *(approximation; ignores FE renormalization)*.

---

## Part D — Verdict

Band labels follow the canonical `11` §3 (Low / Moderate / High / Critical).

| Tier | Threshold | Result |
|------|-----------|:------:|
| Low | ≥ 80% | ☐ |
| Moderate | 53–79% | ☐ |
| High | 27–52% | ☐ |
| Critical | < 27% | ☐ |
| **Gate override** (any G1–G8 Red Flag → cap at High) | | ☐ Applied ☐ Not applicable |

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

**Calibration feedback:** ☐ Any threshold here misclassified reality? If so, record it in `11_WEIGHTS_THRESHOLDS_CONFIG.md` §5.

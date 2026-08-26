# 11 — Weights & Thresholds Config (canonical)

> **Status:** canonical configuration. Every weight, tier threshold, and gate rule in the rubric is defined *here* and referenced from the derived views (`00_EXECUTIVE_RUBRIC.md`, `templates/*`). Change the numbers here, never in the derived views.
>
> **Governance:** any change to this file updates the single source of truth; a consistency check (see README §Consistency) verifies the derived views still match. Weights and thresholds are **v1 asserted defaults** — calibrated on the schedule defined in §4 below.

---

## 1 — Category weights

### Base weight set (repo has no user-facing client → FE rows are N/A)

| Category | Weight |
|----------|--------|
| Security, Compliance & Vulnerability | 20% |
| Architecture & Code Quality | 15% |
| Dependency & Ecosystem Health | 10% |
| Testing & Quality Engineering | 10% |
| Data & Schema Evolution | 10% |
| API & Integration Surface | 10% |
| Developer Velocity & Operational Drag | 10% |
| Performance & Cloud/Infrastructure Fit | 10% |
| Documentation & Knowledge Continuity | 5% |
| **Total** | **100%** |

### FE-active weight set (repo has a user-facing client → FE rows apply)

When at least one FE indicator is applicable, FE becomes a 10% category and the nine base categories scale **proportionally by ×0.9** so the set still sums to 100%:

| Category | Weight (FE-active) |
|----------|--------------------|
| Security, Compliance & Vulnerability | 18% |
| Architecture & Code Quality | 13.5% |
| Dependency & Ecosystem Health | 9% |
| Testing & Quality Engineering | 9% |
| Data & Schema Evolution | 9% |
| API & Integration Surface | 9% |
| Developer Velocity & Operational Drag | 9% |
| Performance & Cloud/Infrastructure Fit | 9% |
| Documentation & Knowledge Continuity | 4.5% |
| Frontend & Client Health | 10% |
| **Total** | **100%** |

**Parameter note:** the FE weight (10%) is a parameter, not a law — adjust it here and the derived views regenerate. Proportional ×0.9 scaling keeps the *relative* importance of the nine base categories constant.

---

## 2 — Category scoring formula

```
Category% = (sum of applicable row scores ÷ applicable row count × 3) × 100
```

- Every indicator ships an explicit 4-level scoring criteria (score 3 / 2 / 1 / 0) in its encyclopedia entry — see each `XX-NN` entry.
- A row that does not apply to the audited system is marked **N/A** and excluded from *both* numerator and denominator, with the reason recorded (applicability rules per indicator live in the encyclopedia entry).
- **Deep-dive rows fold into the category** when a deep audit runs them: applicable row count = standard rows + the deep-dive rows actually executed. A standard audit therefore produces an honest *approximation* of the category; a deep audit a more *trustworthy* number. The two are not expected to be equal.
- A category may hold a **variable number of standard rows** (e.g., ARCH has 10, ECOS has 8). The formula is row-count agnostic by construction.

---

## 3 — Tier thresholds & gate override

| Tier | Score | Verdict |
|------|-------|---------|
| Healthy | ≥ 80% | Maintain continuous refactoring & incremental updates |
| Moderate Technical Debt | 53–79% | Dedicated refactoring sprints; fix security & EOL first |
| High Risk / Obsolete | 27–52% | Modernization initiative required; isolate core domain behind a facade |
| Critical Risk / Legacy Failure | < 27% | Immediate modernization mandatory; system impedes business continuity |

**Gate override:** if any gating kill-switch (see `00_EXECUTIVE_RUBRIC.md` Part 0; G1–G8) is Red Flag, the verdict is capped at **High Risk / Obsolete** — the numeric score is informational only, unless it is already < 27%, in which case **Critical Risk / Legacy Failure** wins.

---

## 4 — Calibration schedule & log

Weights, tier thresholds, and per-indicator Yellow/Red thresholds are **asserted until calibrated**. Calibration is a scheduled, evidence-driven activity, not a one-time event:

1. **Pre-v1 A-tier spot-check:** before the LeapScore engine cuts over, run every A-tier indicator with a mechanical threshold against 5–10 diverse real public repos (the cross-check quiz in `docs/plans/03`). Adjust thresholds that misclassify; record every adjustment in §5.
2. **Post-audit calibration:** after every N completed audits (target: 20), fit the tier thresholds and category weights against the collected `score-vs-outcome` data (audit score vs. subsequent incident/refactor/velocity observations). Re-visit any threshold that classifies a known-good or known-bad system the wrong way.
3. **Review cadence:** quarterly review of this file; every change lands here first and propagates to derived views.

---

## 5 — Threshold Calibration Log

> One row per adjusted threshold. Evidence = how the current value was validated (spot-check repo, audit sample, incident history).

| Date | ID | Field | Old | New | Evidence / rationale |
|------|----|-------|-----|-----|----------------------|
| _ | _ | _ | _ | _ | _ |
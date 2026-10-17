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

### Generalized applicable-category renormalization (new — indicator-applicability)

When an entire category becomes not applicable for the repo (e.g., DATA + PERF for a `library`, or all API/DATA/PERF for `docs`/`agent-skills`), the headline is renormalized **proportionally over the applicable categories only**: `renormWeight(cat) = canonicalWeight(cat) / Σ canonicalWeight(applicableCats)`, so the sum stays 100% and relative importance is preserved. This generalizes the FE-active `×0.9` pattern. Both the renormalized headline (`headline.score`) and the canonical headline (`headline.canonical_score`, over all 10 categories) are persisted; the renormalized headline is the primary display and the canonical is footnoted. A category with zero applicable rows is omitted or shown dimmed as `N/A` with no percentage and counted in `coverage.not_applicable`. Applicable-category determination uses `archetype + planeInventory` (`has_server/has_data/has_deploy/has_client/has_test`) via exhaustive tree enumeration; see `indicator-applicability` spec.

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
| Low | ≥ 80% | Maintain continuous refactoring & incremental updates |
| Moderate | 53–79% | Dedicated refactoring sprints; fix security & EOL first |
| High | 27–52% | Modernization initiative required; isolate core domain behind a facade |
| Critical | < 27% | Immediate modernization mandatory; system impedes business continuity |

> **Band naming (one release only):** the Low band shipped previously as "Healthy" and the High band as "High Risk / Obsolete"; thresholds are unchanged (80/53/27). The legacy names survive **only** as machine aliases carried in the sealed envelope (`headline.tier_legacy`: Low→Healthy, High→High Risk) and are never displayed as band labels.

**Gate override:** if any gating kill-switch (see `00_EXECUTIVE_RUBRIC.md` Part 0; G1–G8) is Red Flag, the verdict is capped at **High** — the numeric score is informational only, unless it is already < 27%, in which case **Critical** wins.

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
| 2026-10-17 | `dotnetfx` | EOL snapshot lifecycle framing (drives `is_past_eol` / ECOS-01) | absent from the vendored EOL dataset (resolve → `unknown`) | OS-bound component lifecycle encoded per cycle: 4.5/4.5.1/4.6/4.6.1 lineages past (2016-01-12 · 2022-04-26), 4.6.2–4.8.1 in support with `eol: null` (no date claim) | legacy-stacks design D4 — .NET Framework ships as a Windows component; a blanket EOL would be a false claim. Vendor lifecycle records curated in `tooling/scripts/snapshot-data.ts`; framing asserted in `apps/scanner/src/scan/__tests__/legacy-stacks.test.ts` (3.1/3.3) |
| 2026-10-17 | `vb6` | EOL snapshot lifecycle framing (drives `is_past_eol` / ECOS-01) | absent from the vendored EOL dataset (resolve → `unknown`) | single cycle `6.0`, `eol: 2008-04-08` — *toolchain* end-of-life with an OS-bound runtime; the dataset source note says exactly that | design D4 — the claim is the toolchain, not the deployed runtime. Date = VB6 mainstream-support end; `EOL_SNAPSHOT_SOURCE` carries the framing and is asserted in the 3.3 tests |
| 2026-10-17 | `delphi` | EOL snapshot lifecycle framing (drives `is_past_eol` / ECOS-01) | absent from the vendored EOL dataset (resolve → `unknown`) | version-graded Embarcadero release cycles (6 → 12, current `eol: null`) with **exact-cycle matching only** — an unmappable project version resolves to `null` → `unknown`, never to a lower cycle | design D4 — Delphi release lineages are not semver-ordered (XE2/XE8/10.2/…); nearest-lower fallback would imply dead. `exact_cycles` honored in `snapshots.ts`; tested with 99.0/XE10 → `null`; the 4.1 `.dproj` ProjectVersion table maps onto these labels |
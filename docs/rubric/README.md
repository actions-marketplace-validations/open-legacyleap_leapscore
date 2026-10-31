# Codebase Modernization Audit Rubric — Master Catalog

An exhaustive, layered catalog of indicators that signal a codebase is obsolete, maintainability-deficient, or due for modernization. Built to be run against **any** arbitrary codebase — from a portfolio screen (1 day) to a full modernization deep dive (2 weeks). Serves **both** human auditors (printable sheets) **and** the LeapScore engine (operationalized criteria it can execute).

## Layered structure (two layers + config, one catalog)

| Layer | File | Purpose |
|-------|------|---------|
| **Config (canonical)** | `11_WEIGHTS_THRESHOLDS_CONFIG.md` | The single place that defines category weights (base + FE-active), scoring formula, tier thresholds, gate override, and the calibration schedule/log. |
| **Executive Rubric** | `00_EXECUTIVE_RUBRIC.md` | The **derived** scoring template. Gating kill-switches (G1–G8), the scoring sheet, and rollup math. Print it, score it, compare codebases. |
| **Encyclopedia (canonical)** | `01_…`–`10_…` | The full catalog. Every indicator expanded to 14+ fields: definition, why it matters, detection, metric, thresholds, blast radius, remediation, gold standard, **4-level scoring criteria (0–3)**, **core-path bound**, **engine tier / default status**, **scope/overlaps**, and verify effort. |

Each scoring sheet row links to its encyclopedia entry by ID (e.g., `SEC-03`).

> **Single source of truth:** the encyclopedia (`01_…`–`10_…`) + the config (`11`) are canonical. The executive rubric and both templates are **derived views** — regenerate them from the canonical files; never edit a number in a sheet that belongs in the encyclopedia or config. A consistency check (IDs, names, thresholds, weights, verify-effort tags) runs across the catalog to flag drift.

## Indicator counts (v2)

| File / Category | Standard | Deep-Dive | Base weight | FE-active weight |
|------|----------|-----------|-------------|------------------|
| `01_DEPENDENCY_ECOSYSTEM.md` | ECOS-01…08 | ECOS-09, 10 | 10% | 9% |
| `02_ARCHITECTURE_CODE.md` | ARCH-01…10 | ARCH-11, 12 | 15% | 13.5% |
| `03_TESTING_QUALITY.md` | TEST-01…08 | TEST-09, 10 | 10% | 9% |
| `04_SECURITY_COMPLIANCE.md` | SEC-01…08 | SEC-09, 10 | 20% | 18% |
| `05_DATA_SCHEMA.md` | DATA-01…08 | DATA-09, 10 | 10% | 9% |
| `06_API_INTEGRATION.md` | API-01…08 | API-09, 10 | 10% | 9% |
| `07_VELOCITY_OPERATIONAL.md` | VEL-01…10 | VEL-11, 12 | 10% | 9% |
| `08_PERFORMANCE_CLOUD.md` | PERF-01…08 | PERF-09, 10 | 10% | 9% |
| `09_DOCS_KNOWLEDGE.md` | DOCS-01…08 | DOCS-09, 10 | 5% | 4.5% |
| `10_FRONTEND_CLIENT.md` *(conditional)* | FE-01…07 | FE-08 | — | 10% |

**Totals:** 76 standard + 18 deep-dive = **94 core indicators** + 8 conditional Frontend (7 standard + 1 deep) = **102 encyclopedia entries**.

## How to run an audit

1. **Screen (1 day, portfolio-level).** Run only the standard indicators cheap to verify (marked ⚡). Skip deep-dive entries. Score 0–3 per row (or mark N/A with reason). Compute the weighted total. Compare across the portfolio.
2. **Standard audit (2–3 days, one system).** Score all standard rows per service, roll up per-service sheets by business criticality, compute the system total, check the gates.
3. **Deep dive (1–2 weeks, one system).** Add the deep-dive indicators — which **fold into the category scores** and produce a more trustworthy total than the standard audit. These cover the expensive-to-verify debt (mutation testing, DR drills, FinOps, fuzzing) that a standard audit can only guess at.

## Score model summary

- Each indicator: **0–3** (3 = healthy, 0 = critical) per its **explicit 4-level scoring criteria** (see `11` §2 and each encyclopedia entry). The historically fuzzy "core vs non-core" axis is settled by the **global core-path taxonomy** — core = files reachable from public entry points that touch money / auth / PII / compliance-sensitive behavior. The engine computes core-path membership once and every indicator inherits it.
- Each row is scored, **N/A'd** (excluded from both numerator and denominator), or left blank for deep-dive rows not run.
- **Category score** = Σ(applicable row scores) ÷ (applicable count × 3), expressed as a percentage.
- **System score** = Σ (category % × category weight). Category weights come from `11_WEIGHTS_THRESHOLDS_CONFIG.md` — the base set normally, the **FE-active set** (FE 10%, others ×0.9) when the repo has a user-facing client.
- **Gating kill-switches (G1–G8)** cap the verdict regardless of total (any Red Flag gate = verdict never higher than "High").
- **Deep-dive rows count.** In a deep audit, executed deep-dive rows join their category's applicable set, changing the category % honestly. The deep-audit number is not the standard-audit number with extra rows bolted on.

## Tiers

Band labels follow the canonical `11` §3 (Low / Moderate / High / Critical); thresholds are unchanged.

| Tier | Score | Verdict |
|------|-------|---------|
| Low | ≥ 80% | Maintain continuous refactoring & incremental updates |
| Moderate | 53–79% | Schedule dedicated refactoring sprints; fix security & EOL first |
| High | 27–52% | Modernization initiative required; isolate core domain behind a facade before rewriting |
| Critical | < 27% | Immediate modernization mandatory; system impedes business continuity |

> **Gate override:** if any gating kill-switch (G1–G8) is Red Flag, the verdict is capped at "High" even if the numeric score says otherwise.

Weights and thresholds are **asserted defaults subject to calibration** — see `11` §4 (calibration schedule) and §5 (calibration log).

## Templates

- `templates/SYSTEM_SCORE_SHEET.md` — blank printable system-level scoring sheet
- `templates/SERVICE_SCORE_SHEET.md` — blank printable per-service scoring sheet

## Scoring legend (used throughout)

| Score | Meaning |
|-------|---------|
| **3 — Healthy** | Complies with modern standards; no flags |
| **2 — Minor Debt** | Manageable debt; meets Yellow Flag criteria in non-core paths |
| **1 — Severe Debt** | Yellow Flag in core logic, or Red Flag in isolated paths |
| **0 — Critical** | Red Flag in core logic, or across multiple paths |
| **N/A** | Indicator not applicable to this system (excluded from scoring, reason recorded) |

## Verification-effort legend (used in every entry)

| Tag | Meaning |
|-----|---------|
| ⚡ ≤ 30 min | Cheap to verify — a lead or tool can confirm quickly |
| 🔶 ~2–4 h | Moderate — requires some setup, log/CI inspection |
| 🔷 ~1–2 days | Expensive — requires instrumentation, load tests, or interviews |

## Engine fields (used by LeapScore)

Every encyclopedia entry also carries the automation taxonomy absorbed from the old engineerability matrix:

| Field | Meaning |
|-------|---------|
| **Engine tier** | A = automatable from repo + GitHub API + local tools · B = needs deeper perms / sandbox execution · C = needs a live environment · D = needs humans/org data |
| **Default status** | `measured` / `estimated` / `unknown` when the engine first computes the row (no blank rows, no scored guesses on C/D rows — unknown rows emit "what it takes to measure" text) |
| **Scope/overlaps** | How this indicator's evidence is bounded so it never double-counts a sibling indicator's evidence |

## Consistency check

The catalog is single-sourced: encyclopedia + config canonical, executive rubric + sheets derived. The enforced check is `npm run check:rubric-consistency` from the repo root (= `tooling/scripts/compile-rubric.ts --check`): it asserts `apps/scanner/src/scan/scoring/rubric.json` + `apps/site/lib/generated/rubric.ts` match the encyclopedia (IDs, names, effort tags, remediation coverage). Regenerate with `npm run compile:rubric`; never hand-edit the generated files. Detector isolation (`npm run check:detector-isolation`) additionally bans raw `fetch`/`fs`/`child_process` in detectors. (`tooling/checks/rubric-consistency.ts` and `tooling/checks/schemas.ts` are stubs; the live checks are the two npm scripts above.)
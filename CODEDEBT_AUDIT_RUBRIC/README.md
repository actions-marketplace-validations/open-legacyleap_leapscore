# Codebase Modernization Audit Rubric — Master Catalog

An exhaustive, layered catalog of indicators that signal a codebase is obsolete, maintainability-deficient, or due for modernization. Built to be run against **any** arbitrary codebase — from a portfolio screen (1 day) to a full modernization deep dive (2 weeks).

## Layered structure (two layers, one catalog)

| Layer | File | Purpose |
|-------|------|---------|
| **Executive Rubric** | `00_EXECUTIVE_RUBRIC.md` | The reusable scoring template. Gating kill-switches, a 72-row scoring sheet, category weights, and rollup math. Print it, score it, compare codebases. |
| **Encyclopedia** | `01_…`–`10_…` | The full catalog. Every indicator expanded to 14 fields: definition, why it matters, detection method, objective metric, thresholds, blast radius, remediation, gold standard, scoring guidance, and verify effort. |

Each scoring sheet row links to its encyclopedia entry by ID (e.g., `SEC-03`).

## File index

| File | Category | Standard | Deep-Dive | Weight |
|------|----------|----------|-----------|--------|
| `01_DEPENDENCY_ECOSYSTEM.md` | Dependency & Ecosystem Health | ECOS-01…08 | ECOS-09, 10 | 10% |
| `02_ARCHITECTURE_CODE.md` | Architecture & Code Quality | ARCH-01…08 | ARCH-09, 10 | 15% |
| `03_TESTING_QUALITY.md` | Testing & Quality Engineering | TEST-01…08 | TEST-09, 10 | 10% |
| `04_SECURITY_COMPLIANCE.md` | Security, Compliance & Vulnerability | SEC-01…08 | SEC-09, 10 | 20% |
| `05_DATA_SCHEMA.md` | Data & Schema Evolution | DATA-01…08 | DATA-09, 10 | 10% |
| `06_API_INTEGRATION.md` | API & Integration Surface | API-01…08 | API-09, 10 | 10% |
| `07_VELOCITY_OPERATIONAL.md` | Developer Velocity & Operational Drag | VEL-01…08 | VEL-09, 10 | 10% |
| `08_PERFORMANCE_CLOUD.md` | Performance & Cloud/Infrastructure Fit | PERF-01…08 | PERF-09, 10 | 10% |
| `09_DOCS_KNOWLEDGE.md` | Documentation & Knowledge Continuity | DOCS-01…08 | DOCS-09, 10 | 5% |
| `10_FRONTEND_CLIENT.md` | Frontend & Client Health *(conditional)* | FE-01…06 | FE-07 | — |

**Totals:** 72 standard + 18 deep-dive = **90 core indicators** + 7 conditional (Frontend) = **97 encyclopedia entries**.

## How to run an audit

1. **Screen (1 day, portfolio-level).** Run only the *standard* indicators that are cheap to verify (marked ⚡ in the rubric). Skip deep-dive entries. Score 0–3 per row. Compute the weighted total. Compare across the portfolio.
2. **Standard audit (2–3 days, one system).** Score all 72 standard rows per service, roll up per-service sheets by business criticality, compute the system total, check the gates.
3. **Deep dive (1–2 weeks, one system).** Add the 18 deep-dive indicators. These cover the expensive-to-verify debt (mutation testing, fuzzing readiness, DR drills, FinOps) that a standard audit can only guess at.

## Score model summary

- Each indicator: **0–3** (3 = healthy, 0 = critical failure) — see the scoring guide in `00_EXECUTIVE_RUBRIC.md`.
- Category score = average of standard indicator scores, expressed as a percentage of max.
- System score = Σ (category % × category weight).
- **Gating kill-switches** cap the verdict regardless of total (a single Red Flag gate = verdict never higher than "High Risk / Obsolete").

## Tiers

| Tier | Score | Verdict |
|------|-------|---------|
| Healthy | ≥ 80% | Maintain continuous refactoring & incremental updates |
| Moderate Technical Debt | 53–79% | Schedule dedicated refactoring sprints; fix security & EOL first |
| High Risk / Obsolete | 27–52% | Modernization initiative required; isolate core domain behind a facade before rewriting |
| Critical Risk / Legacy Failure | < 27% | Immediate modernization mandatory; system impedes business continuity |

> **Gate override:** if any gating kill-switch is Red Flag, the verdict is capped at "High Risk / Obsolete" even if the numeric score says otherwise.

## Templates

- `templates/SYSTEM_SCORE_SHEET.md` — blank printable system-level scoring sheet
- `templates/SERVICE_SCORE_SHEET.md` — blank printable per-service scoring sheet

## Scoring legend (used throughout)

| Score | Meaning |
|-------|---------|
| **3 — Healthy** | Complies with modern standards; no flags |
| **2 — Minor Debt** | Manageable debt; meets Yellow Flag criteria in non-critical paths |
| **1 — Severe Debt** | Yellow Flag in core logic, or Red Flag in isolated paths |
| **0 — Critical** | Red Flag in core logic, or across multiple paths |

## Verification-effort legend (used in every entry)

| Tag | Meaning |
|-----|---------|
| ⚡ ≤ 30 min | Cheap to verify — a lead or tool can confirm quickly |
| 🔶 ~2–4 h | Moderate — requires some setup, log/CI inspection |
| 🔷 ~1–2 days | Expensive — requires instrumentation, load tests, or interviews |

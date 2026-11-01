# 00 — Executive Rubric *(authored guide)*

The reusable scoring model. Print the generated [`00_SCORE_SHEET.md`](./00_SCORE_SHEET.md) to score rows and check gates; read this guide to understand the scale, the rollup, and how to plan the audit.

> **Authored guide:** this file carries only material that cannot be derived — the 0–3 meanings, the core-path taxonomy, the rollup mechanics, and audit planning. Weights, formulas, band thresholds, and the G1–G8 gate rules are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md); per-indicator criteria and the gate roster are restated for printing in the generated [`00_SCORE_SHEET.md`](./00_SCORE_SHEET.md). Never restate those values here — `npm run check:rubric-consistency` fails on a duplicate.

**Companion files:** README (catalog guide) · `01_…`–`10_…` (category indexes) · `indicators/` (canonical indicator files) · `11_…` (canonical config) · `00_SCORE_SHEET.md` (generated criteria, gates, bands) · `templates/` (generated blank score sheets)

---

## Part 1 — Scoring guide

Score each applicable, measurable standard indicator **0–3**; mark N/A (with reason) when a row does not apply. An applicable but unmeasurable row is `unknown`: disclose it as unscored and keep it in the category denominator. A detector not implemented in this scanner release is `not_implemented` and is excluded from the denominator. Every indicator's exact 4-level criteria live in its unified indicator file; its Yellow and Red flag criteria are restated in the generated sheet.

| Score | Meaning |
|-------|---------|
| **3 — Healthy** | Complies with modern standards; no flags |
| **2 — Minor Debt** | Manageable debt; meets Yellow Flag criteria in non-core paths |
| **1 — Severe Debt** | Yellow Flag in core logic, or Red Flag in isolated paths |
| **0 — Critical** | Red Flag in core logic, or across multiple paths |
| **N/A** | Not applicable to this system; excluded from the category denominator (reason recorded) |
| **Unknown** | Applicable but not measurable; no score, disclosed, and included in the frozen denominator |
| **Not implemented** | No detector in this scanner release; disclosed and excluded from the denominator |

**Core-path taxonomy (global, computed once):** every 1-vs-0 and 2-vs-1 call uses the *global* core-path definition — core = files reachable from public entry points that touch **money / auth / PII / compliance-sensitive behavior**. Where an entry scopes itself differently, its unified file's `Scope/overlaps` section says so. The engine computes membership once; human auditors use the same rule.

**Deep-dive indicators:** the catalog also carries deep-dive rows, scored only in deep audits. When a deep audit runs them they **fold into their category's applicable set** and change that category % (see `11` §2) — a deep-audit total is *not* a standard-audit total plus footnote.

---

## Part 2 — Derived material (linked, never restated here)

| You need | Canonical home | Generated restatement |
|---|---|---|
| Category weights, base and FE-active sets | [`11` §1](./11_WEIGHTS_THRESHOLDS_CONFIG.md) | category headings in the score sheet and both templates |
| Category, service-rollup, and system formulas | [`11` §2](./11_WEIGHTS_THRESHOLDS_CONFIG.md) | service and system templates |
| Band thresholds and verdict guidance | [`11` §3](./11_WEIGHTS_THRESHOLDS_CONFIG.md) | score-sheet bands; system-sheet verdict |
| Gate roster G1–G8, triggers, source indicators, escalation | [`11` §3](./11_WEIGHTS_THRESHOLDS_CONFIG.md) | score-sheet gate roster; system-sheet gate check |
| Per-indicator Yellow and Red flags | `indicators/<NN_CATEGORY>/<ID>_*.md` §2 | [`00_SCORE_SHEET.md`](./00_SCORE_SHEET.md) Part C |
| Per-indicator 0–3 criteria | `indicators/<NN_CATEGORY>/<ID>_*.md` §3 | — |

---

## Part 3 — Rollup math

### 3a. Per-service → category scores

For each service, score the applicable standard rows in each category (mark N/A with reason). The category % is the frozen-denominator formula defined in `11` §2a: measured and estimated row scores form the numerator; applicable unknown rows stay in the denominator as disclosed-unscored; not-applicable and not-implemented rows are excluded from both sides. Deep-dive rows fold into the denominator only when run. The renormalized score is reference-only and never replaces the frozen-denominator headline.

### 3b. Service → system rollup

Weight each service by **business criticality** (not LOC):

| Criticality | Weight | Example |
|-------------|--------|---------|
| Critical path | 3× | Revenue-generating, user-facing, compliance-touching |
| Supporting | 1× | Internal tools, batch jobs, non-critical backends |

The per-category rollup across services is defined in `11` §2b.

### 3c. System total

The system total weights each category % by the canonical category weight set: the **base set** when the repo has no client, the **FE-active set** when it does. Both sets and the formula are defined in `11` §1 and §2c — do not hardcode either here.

---

## Part 4 — Audit planning cheat-sheet

| Audit type | Duration | Scope | What to run |
|------------|----------|-------|-------------|
| Portfolio screen | 1 day | All repos | ⚡-tagged standard rows only; skip the delivery and core-coverage gates |
| Standard audit | 2–3 days | One system | All standard rows + all gates; FE rows folded in if a client exists |
| Deep dive | 1–2 weeks | One system | All standard + deep-dive rows (folded into categories) + FE module if applicable |

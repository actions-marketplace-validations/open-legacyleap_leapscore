# 01 — Product Specification

> Companion to `00_MASTER_INDEX.md` (decisions log). Depends on: `02_TRUST_SCORING_MODEL.md` for how scores are trusted; `04_V1_SCOPE.md` for what ships first.

---

## 1. One-line product

A scoring engine that takes a repository (a GitHub URL stands in for "any repo") and returns:

1. A **score** for the codebase's maintainability / modernization readiness,
2. **Every reason behind that score** — per-indicator, evidence-backed, traceable,
3. **Remediation recommendations** to raise the score.

Built on the existing 97-indicator catalog in `../CODEDEBT_AUDIT_RUBRIC/`, which is the single source of truth for scoring semantics, thresholds, weights, gates, and remediation text.

---

## 2. The core promise (what makes it credible)

> **"Every point you lose, we can show you the evidence for — and tell you exactly how to earn it back."**

This is deliberately stronger than "we scan your repo." Competitors score *something* (vulnerabilities, single metrics). LeapScore answers the three questions a stakeholder actually asks:

- **How bad is it?** → the headline score.
- **Why that number?** → per-indicator reasons with provenance (which file/scanner produced it, not a vibe).
- **What's it cost to fix?** → remediation recommendations mapped from the rubric's existing playbooks.

The third-tier status taxonomy (D2–D4) is what makes the promise non-lying. See `02_TRUST_SCORING_MODEL.md`.

---

## 3. Buyers and the two front doors

### 3a. Freemium public SaaS (acquisition + data-moat door)

| Attribute | Definition |
|---|---|
| **Entry** | Any visitor pastes a public GitHub repo URL |
| **What they get free** | A full report: score, coverage bar (measured/estimated/unknown), per-indicator reasons, remediations |
| **Why it exists** | Distribution, brand ("run any repo"), and a **data moat** — every scanned public repo teaches the engine language/ecosystem patterns, edge cases, and detector calibrations. The free tier is the training loop |
| **Constraint** | Must be safe to run unattended on *untrusted public repos*. No code execution in v1 (D5). No hallucinated certainty (D2) |
| **Constraint that creates the upsell** | Free reports are `measured`+`estimated` only, capped per D3/D4; deep-scan options (test-execution, live-environment rows) are paid |

### 3b. Private-repo M&A screening (revenue door)

| Attribute | Definition |
|---|---|
| **Entry** | A due-diligence team installs a GitHub App on the target org (install-time scoping) |
| **What they get** | The same engine on private repos plus M&A-specific outputs: hard falsifiable gates, an `unknown`-list that is literally the deep-dive checklist, and `measured`-only tallies if they demand them (OQ2) |
| **Why it exists** | The money. M&A firms will pay for credible reasons + gates + a scoped follow-up work program, not for a marketing score |
| **Constraint** | Least-privilege by design: differential scope per repo, no token on broker machines, no data retention of secrets (see `08_SECURITY_ACCESS_MODEL.md`) |

Both doors run **the same engine** (D1). The engine is a library/contract; the doors are UX shells.

---

## 4. User stories (MVP truth-tables)

1. **Freemium visitor:** pastes `https://github.com/org/repo` → getcons a score + coverage bar + per-row reasons within a configurable budget of minutes.
2. **M&A analyst:** installs app on target org → batch-scores every repo in the org → exports a per-repo table (score, gate flags, top blockers, required deep-dive scope).
3. **Engineering lead:** sees the report for their own repo → expands an indicator to see evidence, and the exact remediation steps to close the gap.
4. **Deep-dive need**: user has no live environment but wants SEC-03 / PERF-* scores → report marks them `unknown` with "what it takes to measure this" (see task on D2/D3) — never a guessed number.

---

## 5. Non-functional requirements (drafted, to be priced in `09_MONETIZATION_TIERS.md`)

| NFR | Draft target | Reason |
|---|---|---|
| Per-scan budget (freemium, public repo) | TBD (OQ4), target order ~1–5 min wall-clock | Freemium economics + loneliness risk |
| Report delivery | Web app + API + exportable HTML/PDF (v1: web + API) | See OQ3 |
| Correctness bar | Zero false `measured`; `estimated` always labeled; `unknown` never scored | The promise in §2 |
| Data retention (private) | Delete-after-delivery default; report artifacts retained, raw scan data not | M&A security (see 08) |
| Language coverage | v1: JS/TS + Python; then Go + Java; manifest-sniffed fallback for others (D6, D8) | See `04_V1_SCOPE.md` |

---

## 6. What this deliberately does NOT include (until roadmap says so)

- Writing bespoke code analyzers (v1 orchestrates OSS tools — D7).
- Executing any repo's test suite (v1 scans statically, D5).
- Scoring live-deployed systems (`unknown` for Tier C rows by design).
- Training/LLM-generated remediation that contradicts the rubric (rubric text is canonical, D-principle 3).

---

## 7. Deliverable form factor (evidence standard for every report)

A report is a schema-compliant document:

- **Headline**: score (0–100 or tiered band — open OQ1) + verdict per rubric Part D.
- **Coverage bar**: `measured` / `estimated` / `unknown` counts per category.
- **Indicator rows**: id, name, category, weight, status, score (0–3), evidence pointer, remediation text.
- **Gates (G1–G6)**: proven / not-proven / needs-verification, from the rubric Part 0.
- **Top blockers + recommended 90-day plan**: derived from the rubric's remediation playbooks.

Full field-level shape in `06_DATA_MODEL_API.md`.
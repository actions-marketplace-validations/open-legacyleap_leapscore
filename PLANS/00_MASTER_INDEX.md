# LeapScore — Master Index & Decisions Log

> **Project:** LeapScore — a scoring engine that takes a repository (minimum: a GitHub URL) and returns a legacy/maintainability score, the reason behind every point of that score, and remediation recommendations to raise it.
> **Base knowledge base:** `../CODEDEBT_AUDIT_RUBRIC/` (97 indicators: 72 standard + 18 deep-dive + 7 frontend annex).
> **Status:** Planning only. No implementation until this catalog is agreed.

---

## Documents

| # | File | Purpose |
|---|------|---------|
| 00 | [`00_MASTER_INDEX.md`](00_MASTER_INDEX.md) | This index + decisions log |
| 01 | [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) | Product definition, buyers, dual-front-door (public freemium + private M&A) |
| 02 | [`02_TRUST_SCORING_MODEL.md`](02_TRUST_SCORING_MODEL.md) | Three-tier `measured`/`estimated`/`unknown` taxonomy, headline score, coverage bar, provenance |
| 03 | [`03_ENGINEERABILITY_MATRIX.md`](03_ENGINEERABILITY_MATRIX.md) | Every indicator mapped to automation tier (A/B/C/D) and the OSS tool that measures it |
| 04 | [`04_V1_SCOPE.md`](04_V1_SCOPE.md) | v1 vertical slice: indicator set, ecosystems, execution model, gating rule |
| 05 | [`05_DETECTION_ENGINE_BLUEPRINT.md`](05_DETECTION_ENGINE_BLUEPRINT.md) | Engine architecture: manifest sniffing, tool orchestrator, adapters, GitHub API, sandbox |
| 06 | [`06_DATA_MODEL_API.md`](06_DATA_MODEL_API.md) | Score output schema, report model, per-indicator row shape |
| 07 | [`07_COMPETITIVE_LANDSCAPE.md`](07_COMPETITIVE_LANDSCAPE.md) | Existing OSS/freemium/paid tools and the gap LeapScore fills |
| 08 | [`08_SECURITY_ACCESS_MODEL.md`](08_SECURITY_ACCESS_MODEL.md) | GitHub App scopes, private-repo M&A flow, sandbox security model |
| 09 | [`09_MONETIZATION_TIERS.md`](09_MONETIZATION_TIERS.md) | Freemium-to-paid ladder and the M&A offering |
| 10 | [`10_ROADMAP.md`](10_ROADMAP.md) | Phased delivery plan + open decisions |

**Order of dependency:** you cannot read 04 (v1 scope) without 03 (what's measurable); you cannot read 05 without 04; 06–09 all depend on 04/05. 10 is a summary of the rest.

---

## Decisions Log

Format: `#` · Decision · Source rule / rationale · Status

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| D1 | One engine, two front doors: public freemium SaaS (any public repo URL) + internal private-repo M&A screening via GitHub App | Freemium gives distribution + a data moat; M&A is the revenue path | **AGREED** (grill Q1) |
| D2 | Every indicator row carries a status: `measured` / `estimated` / `unknown` | ~35 of 97 indicators are provably unmeasurable from a URL; scoring them blindly destroys trust | **AGREED** (grill Q2) |
| D3 | Headline score is computed over `measured` + `estimated` only; `unknown` rows are surfaced, not hidden | Honesty is the product's credibility; unknown rows double as the M&A deep-dive shopping list | **AGREED** (grill Q2) |
| D4 | `estimated` rows are capped/banded (≤ 1 point ceiling, explicit confidence tag) so guesses cannot dominate the headline | Prevents a heap of weak inferences from moving the single number | **AGREED** (grill Q2) |
| D5 | v1 is static-analysis + GitHub API only. No test-suite execution in a sandbox | Test-execution buys ~4 indicators at the price of a security review + container sandbox + scan-time explosion; belongs in a later paid "deep scan" | **AGREED** (grill Q3) |
| D6 | Every repo scores on day 1 regardless of ecosystem; language-gated indicators report `unknown` honestly | Manifest sniffing + language-agnostic scans (git, CI, docs, dependabot) run for all repos | **AGREED** (grill Q3) |
| D7 | Detection engine orchestrates existing OSS tools (gitleaks, trivy, osv-scanner, jscpd, knip, dependency-cruiser, Scorecard, …); v1 does not write analyzers from scratch | Build cost is orchestration + rubric mapping, not analysis | **AGREED** (grill Q3) |
| D8 | First ecosystem gate: JS/TS (npm) + Python. Then Go + Java (Maven/Gradle). Ruby/PHP/C#/Rust later | Coverage vs. cost per language | **AGREED** (grill Q3) |

---

## Principles (the non-negotiables that survive any future change)

1. **No silent guesses.** Every number in a report is traceable to evidence (`measured`), an explicitly-labeled inference (`estimated`), or nothing (`unknown`). No exception.
2. **Every repo gets a score.** Exotic or unsupported ecosystems still produce a partial-but-honest report with `unknown` rows explaining what's missing and how to get it measured.
3. **The rubric is the single source of truth.** Scoring language, weights, gates, and remediation text all come from `CODEDEBT_AUDIT_RUBRIC/`. The engine maps detection → rubric rows; it never invents new scoring semantics.
4. **The free tier must be safe to launch.** No sandboxed code execution on untrusted public repos in v1; no reputation-damaging guesswork.
5. **M&A's `unknown` list is a feature, not a shortfall.** It is the automatically-generated deep-dive scope.

---

## Open questions (tracked here until resolved)

- OQ1: Headline number format — single 0–100, banded tier (Healthy/Moderate/High/Critical), or radar? (Tied to D3/D4; unresolved.)
- OQ2: Whether `estimated` affects the M&A verdict or is excluded entirely from gated B2B reports. (M&A buyers may want `measured`-only tallies.)
- OQ3: Report delivery form — web app, API, PDF, HTML packet? (Blocked on product spec review.)
- OQ4: Cost-per-scan budget target for the freemium tier (affects which indicators stay in the free path). (Fee link to 04/09.)
- OQ5: Where `frontend annex` (FE-01…07) lands — packaged as an optional module or folded into the main + scored for repos with a client? (Rubric says annex-only today.)
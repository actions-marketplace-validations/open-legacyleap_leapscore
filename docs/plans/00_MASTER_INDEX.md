# LeapScore — Master Index & Decisions Log

> **Project:** LeapScore — a scoring engine that takes a repository (minimum: a GitHub URL) and returns a legacy/maintainability score, the reason behind every point of that score, and remediation recommendations to raise it.
> **Base knowledge base:** `../rubric/` (102 indicators: 76 standard + 18 deep-dive + 8 frontend annex).
> **Status:** Planning only. No implementation until this catalog is agreed.

---

## Documents

| # | File | Purpose |
|---|------|---------|
| 00 | [`00_MASTER_INDEX.md`](00_MASTER_INDEX.md) | This index + decisions log |
| 01 | [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) | Product definition, buyers, dual-front-door (public freemium + private M&A) |
| 02 | [`02_TRUST_SCORING_MODEL.md`](02_TRUST_SCORING_MODEL.md) | Three-tier `measured`/`estimated`/`unknown` taxonomy, headline score, coverage bar, provenance |
| 03 | [`03_ENGINEERABILITY_MATRIX.md`](03_ENGINEERABILITY_MATRIX.md) | Derived view of every indicator's automation tier (A/B/C/D), default status, and measuring tool — canonical fields live on the encyclopedia rows |
| 04 | [`04_V1_SCOPE.md`](04_V1_SCOPE.md) | v1 vertical slice: indicator set, ecosystems, execution model, gating rule |
| 05 | [`05_DETECTION_ENGINE_BLUEPRINT.md`](05_DETECTION_ENGINE_BLUEPRINT.md) | Engine architecture: manifest sniffing, tool orchestrator, adapters, GitHub API, sandbox |
| 06 | [`06_DATA_MODEL_API.md`](06_DATA_MODEL_API.md) | Score output schema, report model, per-indicator row shape |
| 07 | [`07_COMPETITIVE_LANDSCAPE.md`](07_COMPETITIVE_LANDSCAPE.md) | Existing OSS/freemium/paid tools and the gap LeapScore fills |
| 08 | [`08_SECURITY_ACCESS_MODEL.md`](08_SECURITY_ACCESS_MODEL.md) | GitHub App scopes, private-repo M&A flow, sandbox security model |
| 09 | [`09_MONETIZATION_TIERS.md`](09_MONETIZATION_TIERS.md) | Freemium-to-paid ladder and the M&A offering |
| 10 | [`10_ROADMAP.md`](10_ROADMAP.md) | Phased delivery plan + open decisions |
| 11 | [`11_WEBSITE_SPEC.md`](11_WEBSITE_SPEC.md) | Marketing/demo website (B→A): routes, anatomy, copy, demo data governance |
| 12 | [`12_GITHUB_SURFACE_PLAN.md`](12_GITHUB_SURFACE_PLAN.md) | GitHub check/PR surface for reports (check run, PR comment, badge) |
| 13 | [`13_MVP_SLICE.md`](13_MVP_SLICE.md) | Lean MVP cut — 19 indicators, dual headline, two-phase scan (was `mvp/README.md`) |

**Order of dependency:** you cannot read 04 (v1 scope) without 03 (what's measurable); you cannot read 05 without 04; 06–09 all depend on 04/05. 10 is a summary of the rest.

---

## Decisions Log

Format: `#` · Decision · Source rule / rationale · Status

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| D1 | One engine, two front doors: public freemium SaaS (any public repo URL) + internal private-repo M&A screening via GitHub App | Freemium gives distribution + a data moat; M&A is the revenue path | **AGREED** (grill Q1) |
| D2 | Every indicator row carries a status: `measured` / `estimated` / `unknown` | ~36 of 102 indicators are provably unmeasurable from a URL; scoring them blindly destroys trust | **AGREED** (grill Q2) |
| D3 | Headline score is computed over `measured` + `estimated` only; `unknown` rows are surfaced, not hidden | Honesty is the product's credibility; unknown rows double as the M&A deep-dive shopping list | **AGREED** (grill Q2) |
| D4 | `estimated` rows are capped/banded (≤ 1 point ceiling, explicit confidence tag) so guesses cannot dominate the headline | Prevents a heap of weak inferences from moving the single number | **AGREED** (grill Q2) |
| D5 | v1 is static-analysis + GitHub API only. No test-suite execution in a sandbox | Test-execution buys ~4 indicators at the price of a security review + container sandbox + scan-time explosion; belongs in a later paid "deep scan" | **AGREED** (grill Q3) |
| D6 | Every repo scores on day 1 regardless of ecosystem; language-gated indicators report `unknown` honestly | Manifest sniffing + language-agnostic scans (git, CI, docs, dependabot) run for all repos | **AGREED** (grill Q3) |
| D7 | Detection engine orchestrates existing OSS tools (gitleaks, trivy, osv-scanner, jscpd, knip, dependency-cruiser, Scorecard, …); v1 does not write analyzers from scratch | Build cost is orchestration + rubric mapping, not analysis | **AGREED** (grill Q3) |
| D8 | First ecosystem gate: JS/TS (npm) + Python. Then Go + Java (Maven/Gradle). Ruby/PHP/C#/Rust later | Coverage vs. cost per language | **AGREED** (grill Q3) |

---

## Decisions Log — CODEDEBT rubric redesign (grill A1–E1)

Format: `#` · Decision · Rationale · Status

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| A1 | Every rubric row serves both human auditors and the LeapScore engine | One catalog, two consumers; the human writes the audit, the engine automates the measurable subset | **AGREED** |
| B1 | Each entry carries 4-level scoring criteria (0–3) per global core-path taxonomy | The `core` (files reachable from public entry points touching money/auth/PII/compliance) is the scoring lens everywhere | **AGREED** |
| B2 | Global computed core-path taxonomy replaces per-category gets | Consistent, engine-computable, explainable core definition | **AGREED** |
| B3 | `N/A` state + applicable-row denominator; Category% = (Σ row scores ÷ applicable×3) × 100 | Rows that don't apply aren't penalized or padded (kills the old fixed "8 rows ÷ 24" framing) | **AGREED** |
| B4 | Deep-dive rows fold into the category score when a deep audit runs | Deeper data makes the total more trustworthy, not a separate number | **AGREED** |
| B5 | Uniform means within a category; importance expressed via gates, not weights | Keeps weights few and calibratable; gates carry the absolute must-not-be-red rules | **AGREED** |
| B6 | Weights/thresholds parameterized in `11_WEIGHTS_THRESHOLDS_CONFIG.md` + calibration schedule | Single editable config; pre-v1 spot-check, post-audit fit after 20 audits, quarterly review | **AGREED** |
| C1 | FE gets 10% weight when a client exists; other nine categories scale ×0.9 | Clients matter but must not crowd out backend risk; weights stay normalized | **AGREED** |
| C2 | +5 indicators: ARCH-09 (agentic operability), ARCH-10 (config debt), VEL-09 (PR hygiene), VEL-10 (branching), FE-07 (i18n) | Five real 2026-era decay classes the catalog missed | **AGREED** |
| C3 | Variable row counts per category (contiguous renumber: standards 01…N, deep-dives N+1…) | Catalog grows honestly; no fake parity | **AGREED** |
| C4 | +G7 (DATA-06 red) and +G8 (ECOS-05 red) gates | Data-rescue and copyleft risks are portfolio-gating | **AGREED** |
| D1 | Engineerability matrix absorbed into the encyclopedia (`Engine tier` / `Default status` / `Scope/overlaps` per entry); matrix is a derived view | One canonical place for automation taxonomy + measurability | **AGREED** |
| D2 | Scope/overlap boundaries documented per entry | Disambiguates which row owns a signal; engine maps detection → one row | **AGREED** |
| D3 | Encyclopedia is canonical; consistency check validates rows against templates | Prevents drift between catalog, templates, and engine | **AGREED** |
| E1 | Pre-v1 A-tier threshold spot-check + calibration log | Validates green/yellow/red cutoffs on 5–10 real repos before shipping | **AGREED** |
| F1 | `docs/specs/` is canonical for implementation: per-indicator inputs, detection recipes, fact schemas, statusing predicates, gate hooks, failure/budget semantics (one file per indicator under `docs/specs/<NN_CATEGORY>/`) | Encyclopedia stays canonical for semantics/thresholds (specs reference, never restate); specs arbitrate encyclopedia-vs-matrix drift via each entry's own Definition+Detection text, logging every correction in `docs/specs/README.md` §4 for one reconciliation commit at completion | **AGREED** (grill Q1–Q6) |
| D9 | MVP = 19 Tier-A `measured` indicators across 5 categories (SEC 4 + ECOS 5 + ARCH 3 + VEL 4 + TEST 3); dual headline (MVP-normalized + honest-partial + coverage bar); two-phase scan (Phase 1 GH API <10s + Phase 2 clone 4-min). Gates G1/G2/G3/G8 proven else `needs-verification` | Minimal eng, max screenshot variance, zero `unknown` apologies on measured set; preserves full 102-indicator product; spec is `docs/plans/13_MVP_SLICE.md` | **AGREED** (mvp grill → 13) |

---

## Decisions Log — website (grill W1–W12)

Format: `#` · Decision · Rationale · Status · Source (grill Q)

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| W1 | Website is a marketing/demo site first, architected so the freemium product front door can grow into it: landing page + hand-crafted sample report; live scanning swapped in later | The "beautiful report" trailer is the marketing artifact; B→A means the seam (URL param → report shell) is product-shaped from day 1 | **AGREED** (Q1) |
| W2 | Primary persona: engineering lead scoring their own repo; single conversion action = paste URL → watch report → share the evidence | The report is the marketing; CTO/portfolio angle is a secondary section; M&A stays off this site | **AGREED** (Q2) |
| W3 | Sample report scores a real, famous repo in the Moderate band with full honesty UI (coverage bar, gates, expandable rows) + prominent "illustrative sample" label | Recognition punch + believable debt; honesty branding demands the numbers stay derivable and labelled | **AGREED** (Q3, Q7) |
| W4 | Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; demo data behind a `ReportProvider` interface mirroring `06_DATA_MODEL_API.md` | Product-shaped SSR/SEO + auth path; the seam makes B→A a provider swap, not a rewrite | **AGREED** (Q4) |
| W5 | Aesthetic: dark "instrument panel"; tier colors (≥80/53–79/27–52/<27) are the only color language; Inter for UI, mono for evidence | Native to the IDE-dwelling persona; equal-form-is-equal-meaning without decoration | **AGREED** (Q5) |
| W6 | Three routes: `/` (hero + URL box + proof strip + tier tease), `/report/sample` (full report), `/method` (scoring model). Report gets its own route = the future `/r/[owner]/[repo]` | The report is the product and must not be scroll-squeezed; `/method` does the honesty trust-work | **AGREED** (Q6) |
| W7 | Hero URL box is a *working* component: submit → `/report/sample?repo=X`, header echoes X, persistent sample-disclaimer banner above the report | The box is the wiring test for A (same param feeds a live scan later); a dismissible disclaimer on fabricated data is the one move the brand forbids | **AGREED** (Q8) |
| W8 | Keep **LeapScore** name (not LegacyScore); logo = dial/gauge mark (one arc, one needle, tier-colored), domain `leapscore.dev` | Name stability > momentary descriptiveness; the mark reads as an instrument, matching W5 | **AGREED** (Q9) |
| W9 | Website lives in this repo under `apps/site/`; session deliverable = this spec (`11_WEBSITE_SPEC.md`) + decision log; code is a later session | Rubric is `docs/rubric/` canonical source the mock data references; no code until catalog agreed applies to the engine, not to marketing artifacts | **AGREED** (Q10) |
| W10 | Report anatomy: header dial → coverage strip → gate table (cockpit board) → category table w/ 1 expanded row + "inspect all 102" toggle → bottom URL-box CTA | Density kills beauty; default view gorgeous, full depth one click away; renders the real `06` schema with seeded values | **AGREED** (Q11) |
| W11 | Tone = "audit-grade, not advertising-grade": terse declaratives, second person, one honest number per claim; never claim a capability the live site lacks | Same voice as the docs; hides-nothing is the differentiator and must extend to the site's own claims | **AGREED** (Q12) |
| W12 | Demo data governable by rubric: `django/django` ≈58/100 (Moderate, top of band), coverage 65/25/10 measured/estimated/unknown, one heavy near-miss gate, no fired gate | Numbers must survive an engineer recomputing from the rubric; the demo is a render of the real schema, not free-form decoration | **AGREED** (Q7) |
| W13 | Homepage grows to six blocks (hero fold, report teaser, proof strip, who-it's-for band, credibility band, waitlist CTA) and a new `/product` route carries the full product story; header/footer nav extended with Product + Rubric links; M&A stays off-site | "All of it" product content, hybrid placement: compact bands on the funnel, depth routed — W5 density preserved; the credibility band makes the public rubric checkable from the front door | **AGREED** (grill) |
| W14 | Product copy uses an artifact-present register: present tense only for renderable artifacts (report, rubric, method); the live engine and Deep Scan stay future-gated ("coming" + waitlist) | W11 applied forward: no claim the live site lacks; the honesty model is the pitch, so present tense is reserved for what is demonstrably rendered | **AGREED** (grill) |

---

## Open website decisions (deferred to the code session)

- W-OPEN-1: Waitlist mechanics (email capture → where it lands; newsletter tool).
- W-OPEN-2: Exact seeded indicator rows for the Django sample (top blockers + remediation text pulled from rubric encyclopedias).
- W-OPEN-3: `apps/site/` bootstrap — repo-local page/component tree, lint/format setup to match repo conventions (none exist yet; site establishes them).

---

## Principles (the non-negotiables that survive any future change)

1. **No silent guesses.** Every number in a report is traceable to evidence (`measured`), an explicitly-labeled inference (`estimated`), or nothing (`unknown`). No exception.
2. **Every repo gets a score.** Exotic or unsupported ecosystems still produce a partial-but-honest report with `unknown` rows explaining what's missing and how to get it measured.
3. **The rubric is the single source of truth.** Scoring language, weights, gates, and remediation text all come from `docs/rubric/`. The engine maps detection → rubric rows; it never invents new scoring semantics.
4. **The free tier must be safe to launch.** No sandboxed code execution on untrusted public repos in v1; no reputation-damaging guesswork.
5. **M&A's `unknown` list is a feature, not a shortfall.** It is the automatically-generated deep-dive scope.

---

## Open questions (tracked here until resolved)

- OQ1: Headline number format — single 0–100, banded tier (Healthy/Moderate/High/Critical), or radar? (Tied to D3/D4; unresolved.)
- OQ2: Whether `estimated` affects the M&A verdict or is excluded entirely from gated B2B reports. (M&A buyers may want `measured`-only tallies.)
- OQ3: Report delivery form — web app, API, PDF, HTML packet? (Blocked on product spec review.)
- OQ4: Cost-per-scan budget target for the freemium tier (affects which indicators stay in the free path). (Fee link to 04/09.)
- OQ5: ~~Where `frontend annex` (FE-01…07) lands~~ **RESOLVED** in rubric redesign (C1): when a client exists, FE-01…07 + FE-08 deep-dive get a separate 10% and the other nine categories scale ×0.9; when no client exists, FE is skipped entirely.
- OQ6: Coverage-display rounding. W12 fixes the canonical counts 49 measured / 19 estimated / 8 unknown over 76 rows; exact-to-nearest display is 64/25/11, but W12 text says "65/25/10". Counts are canonical and asserted in `apps/site/lib/score.consistency.test.ts`; the site displays the computed rounded values (64/25/11). Decide whether to adopt the computed rounding or legislate a display convention so text and render can't diverge again.
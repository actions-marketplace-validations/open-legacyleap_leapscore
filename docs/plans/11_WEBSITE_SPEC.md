# 11 — Website Specification (historical proposal)

> **Status:** Historical website and presentation design. Route plans, copy, sample values, provider assumptions, and the B→A rollout below record the original design, not the current site contract. The site is now implemented; current site and scan boundaries are specified in [site-shell](../../openspec/specs/site-shell/spec.md), [scan-api](../../openspec/specs/scan-api/spec.md), and [report-rendering](../../openspec/specs/report-rendering/spec.md). The scanner is stateless; it does not provide a canonical report store or run permalinks. Original decision references: W1–W14 in `00_MASTER_INDEX.md`; product context: `01`, `02`, `06`, and `09`.

---

## 1. What it is

A three-route site whose centerpiece is a fully-rendered sample report. The report is the marketing: it demonstrates the three-part promise (score / why / cost-to-fix) and the honesty model (measured/estimated/unknown, gates), and it is what gets screenshotted and forwarded.

- **B state:** no live scanning. The sample report is seeded, derivable data behind a `ReportProvider` interface. Prominent "illustrative sample" labeling at all times.
- **A state (later):** same routes and shell, the provider now calls the engine; `/report/sample?repo=X` becomes `/r/[owner]/[repo]`.

**Hard constraint:** never claim a capability the live site lacks. No "we scan your repo" until the engine exists — always "coming" + waitlist (W11).

---

## 2. Audience & conversion

| | |
|---|---|
| Primary persona | Engineering lead scoring their **own** repo |
| Conversion action | Paste URL → watch report → share the evidence |
| Secondary | Curious dev (seeds data moat); CTO/portfolio angle as a section, not a distraction |
| Explicitly off-site | M&A door (private UX shell, `01` §3b / D1) |

Hero copy: *"Code is a balance sheet. LeapScore reads it."* Subhead: *"Paste any GitHub repo. Get a maintainability score, the evidence behind every point, and the exact remediation to raise it."*

---

## 3. Routes

| Route | Purpose |
|---|---|
| `/` | Hero (promise line → URL box → dial teaser → proof strip → who-it's-for band → credibility band → waitlist CTA). See §3.1 |
| `/product` | The product story: deliverable triad, the 10 categories, who it's for, the trust model, what it is not, honest roadmap, CTA. Depth destination for the homepage's credibility band (W13) |
| `/method` | The scoring model explained: taxonomy, coverage, gates, N/A rule, formula — "you have nothing to hide" is the differentiator |
| `/rubric` | Interactive catalog: browse/search the 102 indicators by category, confirming transparency |
| `/report/sample` | The full report; future live shell is `/r/[owner]/[repo]` (W6) |

Footer links the actual rubric (`../rubric/README.md`) so "built on a real 102-indicator rubric you can read" is checkable.

### 3.1 Homepage anatomy (W13)

Six blocks, compact — the homepage stays a funnel, the depth routes carry the density:

1. **Hero fold** — pill ("Live scanning: coming"), H1, subhead, paragraph, URL box.
2. **Report teaser** — dial + repo echo + top blockers (the "score is the marketing" proof).
3. **Proof strip** — the differentiator triad (evidence per point / one number 102 inputs / remediation ordered).
4. **Who-it's-for band** — persona line ("for the engineer who owns the repo"), text only.
5. **Credibility band** — "Built on a written 102-indicator rubric — not a black box" with three links: Rubric (file), `/method`, `/product`.
6. **Waitlist CTA** — headline + form; one honest rationale line: free reports stay free, Deep Scan is the only way to convert `unknown` → `measured`.

### 3.2 Product route + claim register (W13/W14)

`/product` is the explainer: what you get (score/evidence/fix plan), what it reads (10 categories, weights via `CATEGORIES`), who it's for (engineer + curious dev), why the number can be trusted (`measured`/`estimated`/`unknown` + gates), what it is not (links to `/method` for arithmetic), where we are (today/next/later, no dates).

**Claim register (W14):** present tense only for renderable artifacts — the report, the rubric, the method. The *only* future-gated claim is the engine that turns a live URL into a report ("coming" + waitlist). M&A stays off this site entirely (W2) — `/product` does not describe the private door.

### 3.3 The URL box (W7)

- Working component, not a fake. Submit → `/report/sample?repo=<input>`; header echoes the typed repo ("Score for `org/repo`").
- **Persistent, non-dismissible sample-disclaimer banner** sits above the report: *"Illustrative sample — built on the real rubric. Live scoring is coming; join the waitlist."*
- The `?repo` param is the wiring test for A: the same param later feeds a live scan.

### 3.4 The Rubric browser (`/rubric`)

- **Interactive index:** a list of all 10 categories, expandable into the 102 indicators.
- **Search:** live filter by name, ID, or keyword.
- **Deep-dive indicators:** clearly labeled as such, indicating they fold into category totals in a full audit.
- **Purpose:** establishes transparency; demonstrates the exhaustive rubric rather than abstract marketing claims.

---

## 4. Report anatomy (`/report/sample`), top-down (W10)

1. **Header band** — echoed repo, headline score as the **dial gauge mark** (needle at ~58), tier label "Moderate", sample banner.
2. **Coverage strip** — `measured`/`estimated`/`unknown` counts per category; segmented bar whose encoding *is* the honesty model; "N/A rows excluded" note.
3. **Gate table G1–G8** — flight-cockpit status board: proven / not-proven / needs-verification per gate.
4. **Category breakdown** — 10 category percentages + weights, one fully-expanded indicator row as proof-of-depth, **"inspect all 102" toggle** for the dense full table.
5. **Bottom CTA band** — "This could be *your* repo" → URL box again (waitlist).

Renders the real `06_DATA_MODEL_API.md` schema with seeded values. All numbers derivable from the rubric (W12).

---

## 5. Demo data (W12)

| Field | Value | Source |
|---|---|---|
| Repo | `django/django` | Recognition + Python (v1 ecosystem, D8) |
| Score | ≈58/100, **Moderate band** (53–79 top end) | Believable debt, not crisis |
| Coverage | 65% `measured` / 25% `estimated` / 10% `unknown` | Honest story: famous repo, partly unprovable from URL |
| Gates | none fired; one *heavy near-miss* | Gate table reads as an instrument, not all-green |
| Label | "Illustrative sample — built on the real rubric. Live scoring is coming." | Never implies the real scan |

**Governance:** every row, category %, and the headline must recompute from `11_WEIGHTS_THRESHOLDS_CONFIG.md` formula (Catalog % = (Σ applicable ÷ applicable×3)×100; System = Σ(cat%×weight)). An engineer expanding a row and summing must land on 58. No free-form numbers (W12).

---

## 6. Stack & codebase conventions

| Concern | Decision |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Primitives | shadcn/ui (tabs, tooltips, collapsibles — design effort goes to bespoke score visuals, not a11y boilerplate) |
| Data seam | `ReportProvider` interface mirroring `06` schema; mock adapter seeded; later a live adapter. UI never touches the provider contract |
| Location | this repo `apps/site/` (rubric is `docs/rubric/`, the canonical source the mock references) |
| Tooling | none exists; `apps/site/` establishes lint/format (W-OPEN-3) |
| Deployment topology (W15) | Produce/present split: `apps/scanner` (produce — scan execution, GH-token custody, canonical report store, versioned NDJSON scan API + per-runId permalinks) and `apps/site` (present — statically prerendered, no engine import, no token, no request-time reads; `/reports` ingested via explicit sync). Shared boundary: `packages/contracts` (envelope + runId grammar + `CONTRACT_VERSION`). Historical change record: `openspec/changes/archive/2026-10-16-leapscore-scanner`; the store/permalink design was superseded by stateless scan requirements. |

---

## 7. Aesthetic (W5)

- Dark **instrument panel**: near-black base, hairline borders, subtle dot-grid texture.
- **Only color language = tier bands**: ≥80 Healthy (green), 53–79 Moderate (amber), 27–52 High Risk (red), <27 Critical (deep red). Equal color = equal meaning.
- Typography: **Inter** (UI/display) with **mono** for evidence pointers, scores, file paths.
- No scanline bevels, no fake terminal cursors. Precision and density, not ornament — "a Bloomberg terminal for code debt."

## 8. Identity (W8)

- **Name:** LeapScore (keep; not LegacyScore).
- **Mark:** dial/gauge glyph — one arc, one needle, tier-colored.
- **Domain:** `leapscore.dev` (`.com` later).
- Tagline words do the descriptive work: *"How bad is your codebase — and what's it cost to fix?"*

---

## 9. Tone / copy rules (W11)

- "Audit-grade, not advertising-grade": terse declaratives, second person, one honest number per claim.
- Proof strip: "Every point traceable · `measured`/`estimated`/`unknown` never conflated · built on a 102-indicator rubric you can read."
- CTA vocabulary: hero → "Score a repo"; report bottom → "This could be your repo — get early access."
- The one non-negotiable: **never write a claim the site can't currently do.**

---

## 10. Deferred to code session (see `00` W-OPEN-1…3)

- Waitlist mechanics (capture tool, landing).
- Exact seeded indicator rows + remediation text for the Django sample (pulled from rubric encyclopedias).
- `apps/site/` bootstrap: page/component tree, lint/format.

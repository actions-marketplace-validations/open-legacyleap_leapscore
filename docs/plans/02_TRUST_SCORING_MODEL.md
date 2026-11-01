# 02 — Trust & Scoring Model (historical proposal)

> **Status:** Historical scoring-model proposal. Its rationale and decision trail are retained, but its headline denominator, band labels, gate model, and open questions may be superseded. Current scoring behavior is specified in [OpenSpec](../../openspec/specs/deterministic-scoring/spec.md), [measurement honesty](../../openspec/specs/measurement-honesty/spec.md), and the [canonical rubric configuration](../rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md). Original companion plans: `01_PRODUCT_SPEC.md` (§2, §7) and `03_ENGINEERABILITY_MATRIX.md` (derived automation view).

---

## 1. The problem this solves

~35 of 102 indicators (Tiers C/D) are **provably unmeasurable from a repository URL**:

- Need a live/deployed environment: SEC-03 (reachable OWASP), DATA-05 (lock contention), PERF-01/03/04/05/08, FE-02/03/08…
- Need humans/org data/interviews: SEC-08 (compliance), VEL-05 (onboarding), VEL-12 (MTTR), PERF-09/10, DOCS-05/10…

Two wrong responses:
1. **Score them anyway** → hallucinated numbers poison the whole product. M&A buyers will verify and find the lie.
2. **Measured-only clean total** → structurally underweights SEC (20%), PERF, VEL — every corporate repo scores artificially healthy.

The right response is a **status taxonomy** — because the *honest* number is actually a product feature ("here is what we can prove, and here is the scoped plan to measure the rest").

---

## 2. The taxonomy

Every indicator row in a report carries exactly one status:

| Status | Meaning | Typical data source | Price of being wrong |
|---|---|---|---|
| `measured` | Auto-detected from real, in-repo/API evidence | Lockfile, git log, CI YAML, scanner output (gitleaks, trivy, osv…) | None — it is a fact about the repo |
| `estimated` | Pattern/heuristic inference, **explicitly labeled low confidence** | grep patterns, config shims, LLM-assisted reading, thresholds guessed from norms | They are guesses; must never masquerade as proof |
| `unknown` | Not scoreable from a URL. **Never scored.** | — | None — by construction |

Banding rule for `estimated`: an `estimated` row can **never** score a 0 or a 3 (the extremes — "proven dead" or "proven healthy" are claims of certainty). It is clamped to a 1–2 range and carries a `confidence` field (`low|medium`). This keeps guesses from moving the headline number by more than ±a bounded amount (D4).

---

## 3. How the score is computed

Three numbers are always reported *together*:

1. **Headline score** — computed over `measured` + `estimated` rows ONLY, using the rubric's weighted rollup math exactly as in `00_EXECUTIVE_RUBRIC.md` Part 3 (category % → weighted sum → tier verdict). `unknown` rows contribute nothing to the numerator or denominator.
2. **Coverage bar** — `measured` / `estimated` / `unknown` counts (and % of the 72 standard rows) per category. This tells the reader how much of the score is fact vs. inference, per category.
3. **Unknown list** — every `unknown` row with: what it would take to make it `measured` (drawn from the encyclopedia's *where it manifests* + *verify effort* + *detection method* fields — nearly free to emit), and its impact on confidence if filled in.

**M&A option (OQ2):** for B2B reports a buyer may ask for a `measured`-only tally, where `estimated` rows are dropped to `unknown`. Both views must be computable from the same underlying event data.

### Example headline rendering

```
LeapScore: 41 / 100  →  Tier 3 · High Risk / Obsolete     [gate: G2 proven]

Coverage: 62 of 72 standard rows scored
  measured   47 (65%)
  estimated  15 (21%)   ← capped contribution, labeled
  unknown    10 (14%)   ← see "What it takes to measure" appendix

Top blockers: SEC-01 (10 pts lost, measured), ECOS-01 (7, estimated)…
Gates: G1 proven · G2 needs-verification · G3 not-proven · …
```

---

## 4. Provenance (the evidence trail)

Every `measured` row must be able to answer: *"show me the thing that made you say that."*

| Field | Meaning |
|---|---|
| `evidence` | Path/line/link. e.g. `git log --author` output, `package-lock.json:142`, `Dependabot PR #431`, `trivy.json → CVE-6201-…`, `.github/workflows/ci.yml` line 9 |
| `tool` | The scanner/commander that produced the signal (or `manual`+`source` for API-derived) |
| `asserted_by` | Process/version of the detection run (reproducibility) |
| `facts` | The raw extracted numbers: counts, versions, dates, scores (e.g. Scorecard 0–10, gitleaks finding ids) |

For `estimated`, `evidence` is replaced by `basis` (the pattern matched / model used) and `confidence`. The UI rule is hard: no indicator leaves a report with neither `evidence` nor `basis`.

---

## 5. Gates (G1–G6)

The rubric's gating kill-switches get a fourth value beyond their binary:

| Value | Meaning |
|---|---|
| `proven` | Evidence-backed red flag (e.g. verified live secret found in-tree → G1 proven) |
| `not-proven` | Evidence of the absence (e.g. scanner run, nothing found) |
| `needs-verification` | Cannot confirm from URL; requires a deep-dive (e.g. SEC-03 reachable SQLi — needs a live env) |

The rubric's *rule* (any proven gate → verdict capped at "High Risk / Obsolete") only fires on `proven`. A `needs-verification` gate is surfaced prominently as **the #1 thing a deep-dive must check** — this is the M&A upsell engine.

---

## 6. Sales-translation (why this model is the pitch)

- To the **freemium user**: "We don't guess. If we couldn't prove it, we told you what to stand up to prove it."
- To the **M&A analyst**: "We give you a score, the evidence for every point, and a machine-generated deep-dive scope for the 10–40% we couldn't reach from code — priced into your diligence instead of discovered during it."
- To the **IC/engineering lead**: "Every lost point has a fix, straight from our rubric playbooks."

---

## 7. Open / follow-up items

- OQ1: headline number format (0–100 vs tiered band vs radar) — this doc assumes 0–100 + tier.
- OQ2: `estimated` handling in gated B2B reports — this doc supports a `measured`-only switch.
- Calibration question: which indicators get the `estimated` cap of 1–2 vs. 1–only? (Defaults in `03`.)
- Coverage as a UI/API first-class citizen: whether a report with < X% `measured` can even produce a "verdict" (a **minimum-coverage floor** decision for M&A reports).

## Why

A sealed report ranks deductions by magnitude (`report.top_blockers`, computed in `apps/site/lib/scoring.ts` as recoverable percentage points) but names no destination. The reader learns which single row would recover the most points; they do not learn what each recovery costs, nor whether the recoverable points are enough to leave the current band. Bands are the public vocabulary every surface already speaks (`release-funnel` fixes Low/Moderate/High/Critical as the rendered set), so "what does it take to reach Moderate" is the question a report reader actually asks — and the report cannot answer it.

Every input needed to answer it already ships: per-row `effort` (⚡ ≤30 min · 🔶 2–4 h · 🔷 1–2 days) and `remediation` (`quick_win` / `structural` / `gold_standard`) from the compiled registry, recoverable `weight_pp` from the scorer, and the band thresholds `80 / 53 / 27` from the contract. The raw material exists; only the composition is missing.

## What Changes

- Derive a **path to the next band** at seal time: destination band, its threshold, `points_needed` from the sealed score, and an ordered set of candidate steps carrying row id, name, `effort`, cost class, recoverable `weight_pp`, and a running cumulative total.
- Class candidate steps into the vocabulary rows already carry — **sprint** (⚡), **quarter** (🔶), **structural** (🔷) — and state explicitly which classes cross the threshold, including the honest case where no reachable class crosses.
- Count only rows that were actually graded (`measured` or `estimated`) at score 0–2. `unknown`, `not_applicable`, and `not_implemented` rows contribute nothing recoverable and SHALL be named as such rather than silently omitted.
- Carry the derived path in the sealed report so one derivation serves every surface; the site report views, CLI `report.html`, `report.md`, and stdout all render it.
- Render the path where the deduction ranking renders today when a next band exists; the deduction ranking remains for the terminal band.
- Add a **band-native CI gate**, `--fail-under-band <critical|high|moderate|low>`, alongside the existing numeric `--fail-under <0-100>`, so the gate speaks the same vocabulary as the report it gates. Exit semantics stay in the existing family (`3` = threshold trip).
- Expose the band gate as a GitHub Action input so the workflow can gate on a band without hardcoding a number.

**Non-goals.** This change does not alter scoring: no threshold, weight, formula, gate, or rubric artifact changes, and `npm run check:rubric-consistency` is expected to be untouched. The path is a derived view over an already-sealed score — it never feeds back into the score.

## Capabilities

### New Capabilities

- `band-path`: derives the cost-weighted path from a sealed score to the next band — destination and distance arithmetic, step candidacy and cost classification, cumulative arrival, the no-reachable-path case, and the gate flag that speaks band vocabulary.

### Modified Capabilities

- `report-envelope`: the sealed report carries the derived path as a declared field, so the derivation happens once at seal time and no consumer re-derives it from row scores.
- `report-rendering`: every report surface (site views, CLI HTML, CLI Markdown, stdout) renders the path block from the sealed field, preserving the existing requirement that the band-specific next step and the positioning line close the document.
- `scan-local`: the CLI accepts `--fail-under-band` and applies the same post-seal evaluation, report-writing, and exit-code semantics it already applies to `--fail-under`.
- `workflow-scan`: the thin CLI contract enumerates the new flag and the action exposes a band-gate input.

## Impact

- `packages/contracts` — one additive `Report` field; existing readers are unaffected because no reader rejects unknown fields and the envelope's closed-field rule governs reads, not presence.
- `packages/engine` / `apps/scanner` — path derivation at seal time; `--fail-under-band` parsing and evaluation; stdout path line.
- `apps/site` — report views consume the sealed field; the sample fixture path must be produced the same way.
- `action/` — one new input, one new pass-through flag.
- Unchanged: `docs/rubric/**`, `docs/specs/**`, scoring, detectors, gates, position of the positioning line and tracked assessment URL.

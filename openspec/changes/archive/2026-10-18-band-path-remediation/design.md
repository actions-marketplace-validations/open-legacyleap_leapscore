## Context

See `proposal.md` — Why. The design-relevant facts:

- The sealed report is a closed contract (`report-envelope`): every field a consumer reads is declared, and a second definition of any grammar is forbidden. Four surfaces render a report (site views, CLI `report.html`, CLI `report.md`, stdout), so any derivation not persisted at seal time is a duplicated-grammar risk.
- Rows already carry the needed inputs: `effort` is present on measured, estimated, and placeholder rows (`report-rendering`); `remediation` is present on `measured` and `estimated` rows where the encyclopedia defines a playbook and deliberately absent on `unknown` / `not_applicable`.
- Band thresholds are contract-owned (`packages/contracts` exports `TIER_THRESHOLDS` = 80/53/27). `release-funnel` requires the public band vocabulary to be single-sourced and forbids changing threshold values.
- Category scoring is `(Σ applicable row scores ÷ (applicable × 3)) × 100` per category, summed as `Σ(category % × weight)` over non-empty categories (`indicator-applicability` defines the renormalization). Applicability is decided by archetype and plane inventory, not by row scores.
- Prior art: the "To reach L3: sensors ≥ 60%; ci ≥ 50%" line from `paladini/harness-score` — the observed property that a report which names the next milestone and its blocking requirement is more actionable than one that ranks only by magnitude. This design takes the *destination-first framing*, not the maturity-ladder mechanics.

## Goals / Non-Goals

**Goals:**
- One derivation, persisted at seal time, consumed unchanged by every surface.
- Exact arithmetic: the recoverable-points figures are computed, not estimated.
- Honest arrival reporting: state plainly when graded deductions cannot reach the destination.
- A CI gate that speaks the same band vocabulary the report renders.

**Non-Goals:**
- Changing any score, threshold, weight, gate, or rubric artifact; the path is a derived view and never feeds back into sealing.
- Replacing the existing deduction ranking; it remains the ordering for a terminal-band report.
- Prescribing remediation execution, effort estimation beyond the rubric's own `effort` tag, or sequencing across releases.
- Touching funnel grammar: the tracked assessment URL remains the final stdout token and `release-funnel` requirements are unchanged.

## Decisions

### D1 — Persist the path in the sealed report rather than deriving per consumer

**Chosen:** derive once at seal time, carry it as a declared contract field. **Alternatives:** (a) each surface derives from row scores — rejected: four independent derivations would drift, defeating `report-envelope`'s no-duplicated-grammar rule; (b) the CLI derives and injects at render time — rejected: the site has no CLI in its path, and persisted runs are re-rendered from stored envelopes long after seal.

### D2 — Additive field, no contract version bump

**Chosen:** add the field without changing `CONTRACT_VERSION`. **Rationale:** `assertContractVersion` rejects envelopes *newer* than the reader understands, so a bump would make every already-deployed reader reject every new envelope for a purely additive change. The closed-field rule constrains what a consumer *reads*, not which fields may exist, so older readers are unaffected. **Alternative:** bump and gate the render on version — rejected as a breaking change with no consumer benefit.

### D3 — Cost classes come from the verify-effort tag, not the remediation playbook

**Chosen:** ⚡ → sprint, 🔶 → quarter, 🔷 → structural. **Rationale:** `effort` is present on every row including placeholders, is the encyclopedia's own cost statement, and is already registry-compiled. `remediation` is absent by design on `unknown` / `not_applicable` rows, which would make the classification silently unavailable for part of the table. Remediation text rides along on steps where it exists, as description rather than classification.

### D4 — Band thresholds resolve through the contract

**Chosen:** the destination threshold and the band gate both resolve from the contract's band vocabulary. **Rationale:** a second threshold table would violate `release-funnel`'s single-source requirement and create a drift path exactly where the product's public labels live. **Alternative:** a CLI-local mapping — rejected.

### D5 — The path excludes ungraded rows and discloses how many it excluded

**Chosen:** only `measured` / `estimated` rows scoring 0–2 are candidates; the count of unreached rows is reported alongside. **Rationale:** `measurement-honesty` forbids presenting a graded magnitude the engine did not derive. Treating an `unknown` row as recoverable points would invent a measurement. Disclosing the count keeps "ungraded" from reading as "fine".

### D6 — Numeric and band thresholds are mutually exclusive in one invocation

**Chosen:** refuse both together (exit `2`, no work). **Rationale:** the two gates would produce two threshold states on one stdout line and ambiguous exit semantics, and the conjunction is always just the stricter of the two, so the combination carries no expressive power. **Alternative:** allow both with AND semantics — rejected as redundant and confusing.

### D7 — The stdout path clause sits between status fields and the next-step sentence

**Chosen:** status fields → compact path clause → band sentence → tracked URL as final token. **Rationale:** `release-funnel` fixes the URL as the final token appearing exactly once, and `report-rendering` fixes the sentence as following the status fields. Inserting the clause between two existing anchors preserves both orderings, so no funnel requirement changes.

### D8 — The recoverable-points arithmetic is exact, and the path says what it assumes

Applicable counts are score-independent (D-context: `indicator-applicability` derives them from archetype and planes), and each category's score is linear in its row scores, so a row's recoverable points are exactly `lost × category_point_value` and contributions across rows are additive and independent. The one way this breaks is a fix that changes a plane — adding a `Dockerfile` sets `has_deploy` and can change which rows are applicable, which changes denominators. **Chosen:** state in the block that the path assumes applicability is unchanged, and leave cross-run attribution to the `run-diff` capability rather than modelling plane drift here.

### D9 — The sample fixture's path is derived from its own rows

**Chosen:** the authored sample report gains its path by running the same derivation over its authored rows; no hand-written path is committed. **Rationale:** `report-envelope` forbids a second definition, and an authored path would be the most likely place for the sample to drift from real output. The sample remains marked `sample: true`.

## Risks / Trade-offs

- [The path reads as a promise that fixing these rows reaches the band] → the block states recoverable-at-max per row and reports arrival honestly, including the no-reachable-path case; the sentence for a not-reached destination says so plainly.
- [Block outranks the deduction ranking and clutters a short report] → the block renders after top risks, is present only when a next band exists, and its per-class lists collapse when they exceed a handful of steps.
- [Excluding ungraded rows makes the path look shorter than the debt] → the unreached-row count is a required part of the block, not optional chrome.
- [A plane-changing fix invalidates the arithmetic between runs] → D8's stated assumption; `run-diff` is the intended place to attribute applicability transitions, and it is deliberately out of scope here.
- [Two gates on one CLI invite operator error] → D6 refuses the combination before any work.
- [Additive contract field desynchronizes a long-lived site build from a newer scanner] → older readers ignore the field and render no block, which is the same degradation path already specified for absent trace.

## Migration Plan

1. Contract field is additive; no envelope is invalidated and no `fingerprint_version` bump is required because the field is derived and excluded from the fingerprint.
2. Envelopes sealed before the field exists continue to render (no block). Persisted runs do not need re-sealing.
3. The band gate ships with an empty default in the Action, so existing workflows are unaffected until an operator sets it.
4. Rollback is deletion of the field and the block; because the field is excluded from the fingerprint and never scored, no persisted artifact becomes unreadable and no stored score changes meaning.

## Open Questions

- The compact stdout grammar for the path clause (for example, a `next:` token carrying destination, distance, and the crossing class) is left to implementation; the requirement fixes its position and content, not its syntax.
- Whether the block's per-class step lists should default expanded or collapsed is a presentation choice with no spec consequence and can be settled during implementation.

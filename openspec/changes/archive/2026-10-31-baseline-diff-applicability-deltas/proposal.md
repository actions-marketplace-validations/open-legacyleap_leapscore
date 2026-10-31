## Why

LeapScore coverage grows by design: tranche A measures 31 of 102 indicators (`report-rendering` scenarios cite a `31/102` coverage strip), and later tranches raise it. Nothing in the system compares two runs of the same target, and nothing classifies *why* a sealed number moved between them. The failure mode is quiet and serious: when coverage grows, more rows become graded, the headline moves, and the report offers no way to tell whether the codebase changed or the measurement did. A naive diff reads model growth as codebase decay; a naive refusal reads every coverage expansion as incomparable.

The hard part is already built. `deterministic-scoring` computes `score_fingerprint` over sorted facts with timings normalized out, `fingerprint_version` names the era, `score_policy` records which headline policy sealed the run, and `report-envelope` carries both. All three exist and nothing consumes them across runs. The one latent hazard is that the fingerprint is **report-level**: any coverage change alters it, so fingerprint equality is currently the only available signal — and it answers the wrong question. Two runs whose requested indicator sets differ are still comparable *row by row* for every row both measured, and that is the comparison a maintainer actually wants.

## What Changes

- Add **row-wise comparability** as the primary rule: two sealed runs are comparable per row when the row was graded in both; a report-level "comparable" verdict additionally requires an identical fingerprint and an identical subject.
- Classify every difference into an attributable delta kind: `scored-change` (same row, same applicability, score moved), `coverage-change` (a row entered or left the graded set without a code change), `applicability-change` (`became-applicable` / `became-not-applicable`, driven by archetype or plane and recorded with its reason), `implementation-change` (`became-implemented`, a detector arriving in a later tranche), and `model-change` (rubric, engine, detector, or fingerprint era differs).
- **Decompose the headline delta** into the part attributable to code and the part attributable to coverage, so a rising score from newly measured rows is never presented as improvement. Where the decomposition cannot be attributed, say so rather than guessing.
- Refuse report-level comparison across fingerprint eras, naming the mismatched input, instead of printing a delta a reader would misread.
- Add `--baseline <report.json>` to the CLI, producing a derived **delta document** (never a second sealed report) and a stdout summary line.
- Add a ratchet affordance so a team can gate on *not regressing* rather than on an absolute number.
- Include the delta's first-class transition set so an applicability or coverage transition is never rendered as a score movement.

**Non-goals.** This change does not alter sealed scoring, the fingerprint inputs, or the meaning of `fingerprint_version`; it consumes them. It does not add a site compare view — the delta document and CLI are the primary surface, and a web consumer can follow as its own change. It does not retro-fit already-written envelopes, which lack the explicit comparability inputs; those compare only where the inputs can be reconstructed or not at all.

## Capabilities

### New Capabilities

- `run-diff`: compares a sealed run against a baseline envelope and emits an attributable delta document — comparability verdicts at report and row level, the delta-kind taxonomy, headline decomposition, transition reporting, and the ratchet gate semantics.

### Modified Capabilities

- `deterministic-scoring`: comparability is refined from a single report-level fingerprint-equality rule to row-wise comparability plus a report-level verdict, with an explicit rule that a coverage or era difference is classified rather than silently compared.
- `report-envelope`: the envelope exposes the comparability inputs a differ needs (requested indicator set, archetype, fingerprint version, rubric and engine versions) as declared fields instead of leaving them recoverable only by recomputing facts, and the delta document's shape is defined once in the contract.
- `scan-local`: the CLI accepts `--baseline <report.json>` and defines its own exit and report-writing semantics, keeping sealed reports unchanged.
- `workflow-scan`: the thin CLI contract enumerates the new flag and the action exposes a ratchet input.

## Impact

- `packages/contracts` — the delta document type, plus comparability inputs on the envelope; no change to `score_fingerprint` inputs or its version.
- `packages/engine` / `apps/scanner` — differ over two sealed reports; `--baseline` parsing; stdout delta line.
- `action/` — ratchet input wired to the new gate.
- Unchanged: scoring, detectors, the fingerprint itself, existing envelopes' validity, `docs/rubric/**`.
- Deliberately deferred: a site compare surface (`reports/run-history-ui`), which reads the delta document when it is built.

## Context

See `proposal.md` — Why. The design-relevant facts:

- `deterministic-scoring` defines `score_fingerprint` over sorted facts with per-run timings normalized out, plus `fingerprint_version` as the scheme era, and states that fingerprints from different eras SHALL NOT be treated as comparable.
- The fingerprint's inputs include the rubric version, engine version, per-detector tool versions, vendored snapshot versions, `--strict`, the requested indicator set, and the archetype. Engine identity is therefore a fingerprint input, and `engineSha7` changes on every release.
- `report-envelope` classifies fields as scored (fingerprinted) or run-scoped (excluded), forbids a second definition of any envelope grammar, and requires unknown-version envelopes to be rejected rather than partially rendered. The site's ingest step already skips an unknown-version envelope with a recorded warning.
- `measurement-honesty` requires every graded row's evidence producer to name the tool that actually produced the fact with its version from a per-producer registry, and the envelope to carry a `tool_manifest` listing those producers. Per-row producer identity and version are therefore already persisted — the material attribution needs.
- `indicator-applicability` defines the five lifecycle states and requires `reason` on `not_applicable` and `not_implemented` rows, so a transition can be reported with its cause rather than as a bare state flip.
- `report.headline` carries `score`, `canonical_score`, `renormalized_score`, `score_policy`, `suppressed`, `verdict`, and `tier`; unknown rows sit in a frozen denominator, so a row becoming measured raises the headline without any code changing.
- Prior art: `paladini/harness-score`'s `--diff` flags `maturityModelChanged` so a baseline is never silently misread when the model changed, and treats a check moving between applicable and not applicable as its own delta kind rather than a pass/fail flip. This design adopts both ideas and adds per-row producer attribution, which that tool has no equivalent of because it has no per-check producers.

## Goals / Non-Goals

**Goals:**
- Make a cross-run comparison defensible: state what was held constant, classify every difference, and refuse rather than hedge.
- Attribute movement to code, coverage, or model so a rising score is never read as improvement.
- Make the ratchet practical in CI despite engine releases changing `engineSha7`.
- Add the capability without invalidating a single stored envelope or fingerprint.

**Non-Goals:**
- Changing the score fingerprint's inputs, its computation, or the meaning of `fingerprint_version`.
- Re-sealing or rewriting historical envelopes; they are compared only where their inputs are present or reconstructable.
- A site compare surface. `reports/run-history-ui` reads the delta document when it is built, as its own change.
- Trend storage, alerting, or time-series aggregation beyond a single baseline-vs-current comparison.

## Decisions

### D1 — The comparison basis is era, rubric version, subject, and per-row producer versions — not engine identity

**Chosen:** two runs are comparable when the subject matches, the fingerprint scheme era matches, the rubric version matches, and the producing tool version matches per row. **Rationale:** a row's meaning is fixed by the rubric that asked the question and the producer that answered it. `engineSha7` is the release that orchestrated them; requiring it to match would invalidate every baseline on every release and make the ratchet unusable, while adding no protection that per-row producer versions do not already provide. **Alternative:** require full fingerprint equality for any comparison — rejected as both too strict (every coverage change and every release blocks) and too weak in the wrong place (a fingerprint mismatch is a single bit with no attribution).

### D2 — Keep the fingerprint report-level; add a row-level comparability layer beside it

**Chosen:** add row-wise comparability as a new rule rather than shrinking or altering the fingerprint's inputs. **Rationale:** the fingerprint legitimately answers "is this the same measurement"; a coverage change genuinely falsifies that, so its current inputs are correct for its job. Changing them would invalidate every stored fingerprint and force an era bump — the most expensive change available for the least gain. **Alternative:** remove the requested indicator set from fingerprint inputs — rejected: it would make the fingerprint claim two runs are the same measurement when one measured less.

### D3 — The requested indicator set is a classified difference, not a blocker, and is reconstructable

**Chosen:** treat a requested-set difference as a coverage classification and keep comparing shared rows. For envelopes written before the field is recorded, reconstruct the set from the full table's statuses — a row is requested precisely when it is not `not_implemented`. **Rationale:** reconstruction is exact rather than heuristic, because `not_implemented` already means "the rubric lists it and this slice does not build it". This lets every already-stored envelope participate instead of becoming dead weight. **Alternative:** refuse any envelope lacking the field — rejected as discarding history for no correctness gain.

### D4 — Producer-version difference wins attribution over score movement

**Chosen:** a row whose producing tool version differs between runs is classified `model-change`, even when its score also moved. **Rationale:** a detector bump can legitimately change a score; calling that a code change would be a false attribution, which is the single failure this capability exists to prevent. Precedence is `model-change` over `scored-change`, evaluated per row. **Alternative:** classify by score movement and note the version difference as metadata — rejected: the note would be ignorable and the classification is what gates the ratchet.

### D5 — The delta is an additional artifact, never a replacement

**Chosen:** a baselined run writes the same three sealed files with the same bytes plus `report.delta.json`, and prints the same sealed-run stdout line plus one delta summary line after it. **Rationale:** the sealed trio is what every downstream consumer, ingest step, and funnel contract already agrees on; changing its content to accommodate a comparison would push diff concerns into scoring. **Alternative:** merge the delta into `report.json` — rejected: it would make the sealed report depend on a second run, breaking the property that a sealed report describes exactly one scan.

### D6 — Incomparable refuses; it never passes

**Chosen:** a ratchet gate on an `incomparable` verdict exits in the usage-or-refused family naming the cause. **Rationale:** a gate that cannot evaluate must not silently pass, matching the existing rule that a suppressed headline never satisfies a threshold and the site's refusal to publish an incomplete snapshot's outputs. **Alternative:** warn and pass — rejected: it converts an unknown into an implicit approval.

### D7 — The ratchet gates the code-attributable part, not the raw score

**Chosen:** trip on a code-attributable regression beyond tolerance; default tolerance is zero and is configurable. **Rationale:** gating the raw score would make the gate fire on coverage shrinkage and stay silent on nothing useful, and would punish the coverage growth the roadmap is actively pursuing. **Alternative:** gate raw score with a tolerance band — rejected: a tolerance wide enough to absorb coverage swings would also absorb real regressions.

### D8 — Decompose the headline and disclose the residual

Per-row contributions partition by delta kind into code-attributable, coverage-attributable, and model-attributable parts, which are summed against the observed headline movement. Rounding and any unattributable remainder are disclosed as their own figure. **Rationale:** `measurement-honesty`'s posture applied across runs — an unexplained remainder is reported, not absorbed into a named part to make the arithmetic look clean.

### D9 — Ingest must skip the delta explicitly

**Chosen:** the delta document is contract-shaped as a non-envelope and the ingest step's skip is a tested behavior, not an incidental consequence. **Rationale:** the report directory now conditionally contains a fourth JSON file, and the ingest step's existing unknown-version path was written for envelopes, not for a different document class. **Alternative:** write the delta outside the report directory — rejected: the directory is the unit CI uploads and restores, so the baseline and its delta should travel together.

## Risks / Trade-offs

- [Ratchet friction after an engine release] → D1 makes engine identity non-blocking; a detector or rubric change still blocks or excludes rows, which is correct because those genuinely change row meaning.
- [A stale baseline produces a large, uninteresting delta] → the delta always names both run references including their timestamps and commits, so age is visible in the artifact; re-baselining is a workflow choice.
- [Decomposition does not sum exactly] → D8 discloses a residual rather than absorbing it, and the spec requires the parts to sum within rounding.
- [Pre-field envelopes reconstruct incorrectly] → reconstruction reads `not_implemented` statuses exactly; when the requested set cannot be reconstructed the verdict is `incomparable` with `missing-comparability-inputs` rather than a guess.
- [A reader treats an `incomparable` delta's absent numbers as "no change"] → the delta documents the blocking cause prominently and carries no delta fields at all, so absence cannot be misread as zero.
- [New envelope `meta` fields drift from fingerprint inputs] → the fields are a declared view of already-fingerprinted inputs; a consistency check that `meta` agrees with the fingerprint's recorded inputs is a task-level verification, and disagreement fails loudly rather than silently.
- [Fourth file in the report directory breaks a downstream consumer that globs `*.json`] → D9 makes the skip an explicit tested behavior, and the Action uploads the directory as before.

## Migration Plan

1. Contract and CLI are additive: without a baseline the system behaves exactly as today, and the Action's new inputs default to empty.
2. Envelopes already stored participate through reconstruction (D3); no re-seal, no fingerprint invalidation, no era bump.
3. Adoption order: contract and comparability inputs first, then the differ, then the CLI and Action surfaces, then the ingest skip test.
4. Rollback removes the flag and the inputs; because the delta is never sealed and never fingerprinted, no persisted artifact becomes unreadable and no stored score changes meaning.

## Open Questions

- Whether a future revision should persist deltas as first-class history (a stored chain of comparisons) rather than recomputing from two envelopes is deferred; the current design recomputes, which keeps the delta a pure function of two sealed inputs.
- Whether the ratchet should also support gating on a specific indicator set rather than the whole report is deferred; the whole-report gate is the one the CI path needs, and the delta document already carries per-row detail for a later refinement.

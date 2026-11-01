## Context

See `proposal.md` for motivation and scope. `docs/` contains a mixed corpus: canonical rubric semantics, 102 canonical implementation recipes, derived presentations, historical plans, a stale product overview, and examples. `AGENTS.md` and `docs/specs/README.md` define ownership and semantic constraints. Tooling consumes paths under `docs/rubric/`, `docs/specs/`, and selected `docs/plans/` files. OpenSpec is current for post-MVP behavior and is outside this rewrite.

## Goals / Non-Goals

**Goals:**
- Rewrite every authored prose document in `docs/` for clarity, consistency, discoverability, and accurate authority/status cues.
- Preserve the meaning of canonical indicator entries, implementation recipes, historical decisions, and normative conventions, except for the explicitly authorized correction aligning the headline denominator in `11_WEIGHTS_THRESHOLDS_CONFIG.md` with current frozen-denominator behavior.
- Use current authoritative sources to correct stale present-tense descriptions without turning historical plans into current commitments.
- Keep tooling-consumed paths stable and remove temporary planning aids from the final user-facing docs set.

**Non-Goals:**
- Change runtime behavior, rubric weights/thresholds/gates, indicator predicates/criteria, implementation recipes, or report/scan requirements. The authorized rubric formula correction documents existing runtime behavior and does not alter it.
- Edit `openspec/`, `AGENTS.md`, application code, tooling, helper scripts, images, or generated outputs.
- Recreate or hand-edit derived data where no canonical generation path exists.

## Decisions

1. **Rewrite in authority order.** Treat `AGENTS.md` and `docs/specs/README.md` as constraints; use OpenSpec for current post-MVP behavior, the rubric encyclopedia/config for scoring semantics, and the per-indicator specs for implementation recipes. Rewrite summaries only after checking these authorities. This avoids making the clearest prose into an accidental but incorrect source of truth.

2. **Apply editorial changes without semantic drift, with one authorized scoring correction.** Preserve indicator IDs/counts, thresholds, weights, gate conditions, applicability, fact schemas, status/score predicates, budget/failure semantics, and required spec sections. Correct the canonical headline denominator and its derived explanations to the frozen-denominator policy already required by `AGENTS.md` and implemented by the scorer: applicable `unknown` rows remain in the denominator but not the numerator; `not_applicable` and `not_implemented` rows are excluded; renormalized scoring remains reference-only. No thresholds, weights, gates, indicator criteria, or runtime code change. Any other suspected semantic defect is a separate follow-up.

3. **Rewrite history as history.** Retain plan dates, rationale, and decision outcomes; add clear lifecycle/status framing and links to current authorities. Correct misleading present-tense claims only by identifying them as superseded or replacing current-state summaries with verified facts; do not rewrite the historical record to imply it was always current.

4. **Preserve stable paths and derived outputs.** Keep canonical directory/file paths used by code, tooling, or references. Update the executive rubric and score-sheet instructions only to reflect the authorized denominator/unknown-row policy; do not alter derived indicator values, thresholds, weights, or `plans/03` matrix data. Leave scripts and image assets untouched. Convert the brief to a clearly dated Markdown archival edition using the DOCX blob in Git history as its source. The DOCX's current working-tree deletion is an existing user change and must remain; do not restore it. The two existing release-readiness note deletions also remain out of scope.

5. **Use a complete rewrite matrix and staged batches.** Use the existing inventory to track every authored document, then rewrite entry points/product overview, historical plans, rubric material, per-indicator specs by category, and sample/archive documentation. The inventory is a temporary work aid, not the final deliverable; fold useful navigation into `docs/README.md` and remove the inventory when the rewrite is complete.

6. **Validate meaning and navigation independently.** Check structural requirements and links for each batch. Run rubric consistency and path-wiring checks at the end; those checks validate existing rules but do not authorize changes outside `docs/`.

## Risks / Trade-offs

- [A prose rewrite could change an indicator's scoring or implementation contract unintentionally] → Preserve contract-bearing fields, compare IDs and semantic values before/after, verify each indicator retains the required skeleton, and run the rubric consistency check.
- [Historical decisions may be mistaken for live requirements] → Keep dates and decision outcomes, label lifecycle, and link to current sources instead of silently rewriting history.
- [A stale current-state summary could be “corrected” from an incomplete source] → Verify claims against the relevant OpenSpec requirement and implementation/docs source; phrase unresolved claims as unknown or omit them rather than inventing behavior.
- [Full-corpus rewriting may introduce broken links or path churn] → Keep known consumer paths stable, update links batch-by-batch, and verify all local Markdown references at completion.
- [Derived docs cannot safely be rewritten as ordinary prose] → Preserve generated/derived values; update only safe framing or defer regeneration to an authorized canonical workflow.
- [The OpenSpec `indicator-applicability` spec still states that the renormalized headline is primary, while current root guidance, `measurement-honesty`, and scorer code use the frozen-denominator headline] → Apply the user's explicit authorization to correct the canonical rubric and derived docs; leave OpenSpec specifications untouched per the agreed boundary and surface the remaining spec mismatch for a separate follow-up.

## Migration Plan

1. Review the existing inventory and approve the full-rewrite map before broad edits; add any missing prose document to the map and identify non-prose files as excluded. The user approved the map with a scope adjustment: retain the three existing tracked deletions, and source the brief's Markdown archival edition from the committed DOCX blob without restoring the DOCX.
2. Finalize the writing/authority rules in `docs/README.md`, then rewrite the product overview and section entry points against current sources.
3. Rewrite historical plans in batches, preserving decision history and adding current-authority links.
4. Rewrite rubric documentation; align the canonical denominator formula and its unknown-row explanation with current frozen-denominator behavior; propagate only that rule to the derived executive view and score-sheet instructions, preserving all numeric values and other derived-view boundaries.
5. Rewrite all 102 indicator specs by category, preserving IDs, required skeleton, facts, predicates, evidence, status, budget, and scope semantics.
6. Produce the dated Markdown archival edition of the open-source brief from its committed DOCX source, leaving the DOCX deleted in the working tree; rewrite sample-report guidance; remove the temporary inventory once its useful navigation has been incorporated.
7. Verify links, per-file coverage, spec skeleton/indicator coverage, `npm run check:rubric-consistency`, and `npm run check:bin-wiring`; inspect the final diff to prove the docs-only and semantic-preservation boundaries.

Rollback is file-level through version control, in bounded batches. Restore only affected documentation files and their prior links; no runtime or data migration is involved.

## Open Questions

None. The rewrite scope and semantic-preservation boundary were confirmed by the user.

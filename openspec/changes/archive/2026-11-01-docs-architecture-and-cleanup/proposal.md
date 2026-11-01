## Why

LeapScore's documentation is spread across current-facing explanations, canonical rubric and implementation references, and historical plans, with stale and contradictory descriptions of shipped behavior. A full, source-grounded rewrite of the authored prose in `docs/` is needed so contributors and users can trust the guidance without changing indicator semantics or duplicating OpenSpec. One authorized exception aligns the canonical rubric's headline denominator with the already-shipped frozen-denominator policy.

## What Changes

- Establish the `docs/` taxonomy, ownership rules, and navigation from the completed inventory; use the inventory as a work aid, not as the final deliverable.
- Rewrite all authored prose documentation under `docs/`, including the product overview, plans/history, rubric documentation, all 102 indicator implementation specs, templates, section indexes, and sample-report guidance. Convert the dated open-source brief into a readable Markdown archival edition based on the committed DOCX source; preserve the existing working-tree deletion of the DOCX, whose source remains available in Git history.
- Correct stale current-state claims against the repository's current sources. Clearly label historical proposals and decisions as historical; preserve their meaning and decision record.
- Preserve all indicator-level rubric and implementation-spec semantics, including IDs, definitions, thresholds, weights, gates, criteria, predicates, schemas, evidence, and budget/status rules. **Authorized scoring correction:** update the canonical headline denominator in `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` to match the frozen-denominator policy already specified by `AGENTS.md` and current scoring behavior; propagate that formula and unknown-row treatment to derived rubric views and score-sheet instructions. Do not change score values, weights, band thresholds, gates, or indicator criteria.
- Keep documentation paths stable where tooling, generated outputs, or established references depend on them; update links and navigation. Remove the temporary inventory from the final docs set or fold any useful navigation into the landing page.
- Keep implementation changes inside `docs/`. Do not modify OpenSpec specifications, root guidance, application code, tooling, scripts, images, generated artifacts, or runtime behavior. This change's planning artifacts may be updated to record the user's approved scope adjustment; the pre-existing deletions of the DOCX and two release-readiness notes remain untouched.

## Capabilities

### New Capabilities

None. This is a documentation-only editorial rewrite, not a new product capability.

### Modified Capabilities

None. No runtime or user-facing product requirements change; OpenSpec remains managed by OpenSpec and is not rewritten.

## Impact

- Affected files: authored prose under `docs/`, including existing Markdown documentation, an authorized formula/documentation alignment in the canonical scoring configuration and its derived views, and a Markdown archival edition of the DOCX brief.
- Excluded: OpenSpec content, `AGENTS.md`, application/tooling code, helper scripts, images, generated outputs, and APIs/dependencies.
- The rewrite must follow the canonical ownership and documentation rules in `AGENTS.md` and `docs/specs/README.md`; the frozen-denominator alignment is the sole authorized scoring-model correction, and detector meaning remains unchanged.

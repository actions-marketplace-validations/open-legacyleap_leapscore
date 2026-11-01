## Why

The documentation cleanup is complete, but the repository still has two problems that the cleanup intentionally left in place: a retired planning corpus remains spread across `docs/plans/`, and every indicator is split between a human-facing rubric entry and a separate implementation contract. That split makes contributors cross-reference two sources, permits semantic drift, and leaves the next implementation change unclear about where an indicator is actually owned. Now that the scanner and report surfaces are nearly implemented, the repository should move from planning-era documents to a compact, implementation-oriented documentation model.

## What Changes

- Retire the authored `docs/plans/` corpus rather than treating historical plans as a maintained documentation layer. Migrate any still-current guidance into the appropriate current documentation or OpenSpec location; do not preserve obsolete planning prose as a second source of truth.
- Introduce one canonical file for each of the 102 indicators, combining the current rubric semantics and implementation contract: identity, definition, rationale, detection inputs/recipe, fact schema, status and score predicates, applicability, gates, failure/budget behavior, evidence, remediation, scoring criteria, effort, and scope/overlap.
- Keep shared scoring configuration and cross-indicator conventions separate from indicator files, with clear ownership and generated/derived boundaries.
- Replace category encyclopedias and standalone per-indicator implementation specs with navigable category indexes plus the unified indicator files; update the rubric compiler, consistency checks, detector/schema references, and documentation links to read the new source.
- Leave compatibility aliases at established `docs/rubric/*`, `docs/specs/*`, and required `docs/plans/*` paths where consumers or external links depend on them. Aliases contain no competing content and point to the unified source or its replacement.
- Preserve all current indicator IDs, meanings, thresholds, weights, gates, applicability rules, fact schemas, status/score semantics, evidence grammar, and generated outputs. This is a documentation/source-layout migration, not a scoring-model or runtime behavior change.

## Capabilities

### New Capabilities

None. This is a documentation and source-layout migration; it does not introduce product behavior.

### Modified Capabilities

None. No runtime or user-facing product requirement changes. This change intentionally uses `skip_specs: true` because OpenSpec capability specs describe product behavior, while this change consolidates documentation and tooling inputs.

## Impact

- Affected documentation: `docs/plans/`, `docs/rubric/`, `docs/specs/`, `docs/README.md`, and related contributor/readme references.
- Affected tooling: rubric compilation, rubric-consistency/schema/path checks, and any scripts that enumerate rubric or implementation-spec files.
- Affected generated artifacts: regenerated rubric JSON/TypeScript and the committed action bundle only when the source migration proves their contents unchanged.
- Affected implementation references: detector manifests, scanner/site documentation, OpenSpec cross-references, and compatibility links; no scanner, site, API, report, or scoring behavior changes.

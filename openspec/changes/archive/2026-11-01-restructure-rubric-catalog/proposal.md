## Why

`docs/rubric/` mixes seven distinct purposes in one flat namespace, and the numeric prefixes that separate them (`00`, `01`–`10`, `11`) encode historical insertion order rather than anything meaningful. Nothing in the tree says which layer a document belongs to, so a reader cannot tell the measured set (indicators) from the instrument built on it (the rubric) from the forms that instrument produces (sheets). The word "rubric" is claimed by four files that each do a different job, and no file owns the sentence that defines it.

The consequence is not cosmetic: one category exists in three places, the category table is hardcoded in three consumers, the site runs a third prose parser over the same files the compiler already parses, and generated artifacts sit beside hand-edited sources with only an in-file banner distinguishing them.

## What Changes

- Restructure `docs/rubric/` into three layer directories that state their role: `indicators/` (the measured set), `model/` (how grades compose into a score), and `sheets/` (the generated instrument).
- Replace the flat numbered files with role-named documents: `README.md` (ontology and reading order), `model/scale.md` (0–3 axis + core-path rule), `model/config.md` (weights, formulas, bands, gates, calibration).
- Move each category index into its own category folder as `indicators/<NN-slug>/README.md`, so a category has one home instead of a filename and a directory that duplicate each other.
- Rename indicator files from `<ID>_<slug>.md` to `<ID>-<slug>.md`; the ID prefix is retained as identity, the underscore/kebab mix is not.
- **BREAKING** — indicator and category paths change. Category order is carried by the `NN-` folder prefix and by nothing else; indicator identity is carried by the `<ID>` filename prefix and by nothing else.
- Derive the category table from the tree (folder prefix, `README.md` H1, ID prefix) in the compiler and the structure check, instead of hardcoding it in each.
- Move category weights out of the category index prose into `model/config.md`; regenerate them into `apps/site/lib/generated/rubric.ts` so the site reads structure rather than re-parsing prose.
- Mark the two halves of each indicator file (rubric semantics §1–§4, detector contract §5–§10) explicitly, without splitting the file.
- Preserve all 102 IDs, meanings, thresholds, weights, gates, applicability rules, fact schemas, status/score semantics, evidence grammar, and generated artifact contents, apart from the source-path provenance strings those artifacts embed. This is a documentation-layout change, not a scoring or runtime change.

## Capabilities

### New Capabilities

None. The change introduces no product behavior.

### Modified Capabilities

- `documentation-structure`: the canonical-path requirement changes from `docs/rubric/indicators/<NN_CATEGORY>/<ID>_<slug>.md` plus root-level `<NN_CATEGORY>.md` indexes to the layered grammar (`indicators/<NN-slug>/README.md`, `indicators/<NN-slug>/<ID>-<slug>.md`, `model/*`, `sheets/*`); the category index requirement moves inside the category folder; a new requirement binds "generated" to a directory rather than an in-file banner.

## Impact

- Affected documentation: all of `docs/rubric/` (102 indicator files, 10 category indexes, the catalog README, the executive rubric, the shared configuration, three generated sheets), plus every inbound link from `docs/README.md`, `docs/PRODUCT.md`, `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and workspace READMEs.
- Affected tooling: `tooling/scripts/compile-rubric.ts` (path derivation, sheet output paths, link emission), `tooling/checks/documentation-structure.ts` (canonical path grammar, index location), `tooling/checks/rubric-consistency.ts`, `tooling/checks/schemas.ts` (ID → file resolution).
- Affected site: `apps/site/lib/parse-rubric.ts` (reads the tree directly today; moves to the generated registry), `apps/site/lib/generated/rubric.ts` (gains category weights).
- Affected generated artifacts: `apps/site/lib/generated/rubric.ts`, `apps/scanner/src/scan/scoring/rubric.json`, `docs/rubric/sheets/*`, and the committed Action dist only if the compiled registry content changes.
- Affected specifications: `openspec/specs/documentation-structure/spec.md` (path grammar and index location).
- Not affected: scanner detection, scoring math, report envelope, CLI, Action, issue surfacing, or any sealed output. Public site URLs stay `/rubric/<NN>` so no external link churns.

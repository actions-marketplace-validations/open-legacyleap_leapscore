## 1. Foundations

- [x] 1.1 Create `docs/rubric/model/` and move `00_EXECUTIVE_RUBRIC.md` → `model/scale.md`, keeping only the 0–3 scale and the core-path taxonomy; verify the file contains no weight, band, or gate value (`npm run check:rubric-consistency`).
- [x] 1.2 Move `11_WEIGHTS_THRESHOLDS_CONFIG.md` → `model/config.md` and verify the compiler still parses the gate roster and band table from it (`npm run compile:rubric -- --check`).
- [x] 1.3 Create `docs/rubric/sheets/` and move the three generated artifacts there (`score-sheet.md`, `service-score-sheet.md`, `system-score-sheet.md`); update `OUT_SCORE_SHEET`, `OUT_SERVICE_TEMPLATE`, `OUT_SYSTEM_TEMPLATE` in `tooling/scripts/compile-rubric.ts` and verify `npm run compile:rubric` regenerates them at the new paths.
- [x] 1.4 Rewrite `docs/rubric/README.md` as the ontology: what an indicator is, the rubric as a composition of indicators, what the rubric is not, the reading order per audience, links to all three layers, and the audit-planning table moved out of the old executive rubric; verify every link resolves.
- [x] 1.5 Resolve the open question from `design.md`: keep set-level conventions (tiers, statuses, full/reduced form, cross-indicator rules) in the rubric entry README or add `indicators/README.md`; record the choice in the entry README's layer description.

## 2. Category migrations

- [x] 2.1 Move `01_DEPENDENCY_ECOSYSTEM.md` → `indicators/01-dependency-ecosystem/README.md`, move and rename its 10 indicator files to `<ID>-<slug>.md`, drop the weight line from the charter, add the §1–§4 / §5–§10 half-boundary preamble to each full-form file, and fix intra-category links; verify `npm run check:documentation-structure` and `npm run compile:rubric` pass.
- [x] 2.2 Migrate `02_ARCHITECTURE_CODE.md` and its 12 indicator files the same way; verify both checks pass.
- [x] 2.3 Migrate `03_TESTING_QUALITY.md` and its 10 indicator files; verify both checks pass.
- [x] 2.4 Migrate `04_SECURITY_COMPLIANCE.md` and its 10 indicator files; verify both checks pass.
- [x] 2.5 Migrate `05_DATA_SCHEMA.md` and its 10 indicator files; verify both checks pass.
- [x] 2.6 Migrate `06_API_INTEGRATION.md` and its 10 indicator files; verify both checks pass.
- [x] 2.7 Migrate `07_VELOCITY_OPERATIONAL.md` and its 12 indicator files; verify both checks pass.
- [x] 2.8 Migrate `08_PERFORMANCE_CLOUD.md` and its 10 indicator files; verify both checks pass.
- [x] 2.9 Migrate `09_DOCS_KNOWLEDGE.md` and its 10 indicator files; verify both checks pass.
- [x] 2.10 Migrate `10_FRONTEND_CLIENT.md` and its 8 indicator files; verify both checks pass.
- [x] 2.11 Confirm the rubric root holds no `NN_*.md` file and `indicators/` holds exactly ten directories with 102 indicator files: verify `find docs/rubric -name '*.md' | wc -l` and the canonical count reported by `npm run check:documentation-structure`.

## 3. Derivation and checks

- [x] 3.1 Replace `CATEGORY_FILES` in `tooling/scripts/compile-rubric.ts` with a derivation from `readdirSync(indicators/)`: order from the `NN-` prefix, category code from the leading ID token, label from the charter H1; verify `npm run compile:rubric -- --check` still byte-matches every generated artifact.
- [x] 3.2 Replace `CATEGORIES` in `tooling/checks/documentation-structure.ts` with the same derivation; verify `npm run check:documentation-structure` passes.
- [x] 3.3 Add the tree-shape assertions: exactly ten directories, contiguous `01`–`10`, each with a charter and at least one indicator, one category prefix per directory, kebab-case after the numeric prefix; verify each assertion fails as expected against a temporary malformed fixture and passes on the real tree.
- [x] 3.4 Add the layer assertions: `indicators/`, `model/`, `sheets/` all exist and are linked from the rubric README; nothing generated outside `sheets/`; nothing hand-edited inside it; every full-form indicator declares its half boundary; verify a deliberate violation of each fails the check.
- [x] 3.5 Extend `check:rubric-consistency` so a weight, band, or gate value restated in a category charter or the rubric README fails, matching the existing rule for the authored guide; verify by temporarily adding a weight line to one charter.

## 4. Site and generated artifacts

- [x] 4.1 Emit `CATEGORY_WEIGHTS` from `model/config.md` into `apps/site/lib/generated/rubric.ts`; verify the values match `model/config.md` §1 for both weight sets.
- [x] 4.2 Repoint `apps/site/lib/parse-rubric.ts` at the generated registry for category order, label, weight, and membership; remove the category-index prose regex and the `split("_")` identity derivation; verify `/rubric` and `/rubric/01` render the same categories, indicators, and weights as before.
- [x] 4.3 Regenerate `apps/scanner/src/scan/scoring/rubric.json`, `apps/site/lib/generated/rubric.ts`, and `docs/rubric/sheets/*`; confirm the diff is provenance-comment and `CATEGORY_WEIGHTS` only, with no indicator content change.
- [x] 4.4 Rebuild the Action bundle and verify `npm run check:dist` passes with the regenerated registry.

## 5. Documentation and specification alignment

- [x] 5.1 Update every inbound reference to the old rubric paths — `docs/README.md`, `docs/PRODUCT.md`, root `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and workspace READMEs — and verify the link check reports zero broken local links.
- [x] 5.2 Amend `openspec/specs/documentation-structure/spec.md` with the delta from this change; verify `openspec validate restructure-rubric-catalog --strict` passes and every path cited by a current spec resolves.
- [x] 5.3 Run the full gate set from a clean install — `npm run compile:rubric`, `check:rubric-consistency`, `check:schemas`, `check:documentation-structure`, `check:detector-isolation`, `check:site-boundary`, `check:bin-wiring`, `check:dist`, `npm test` — and verify all pass.

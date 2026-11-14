## 1. Compiler emits the browser's contract (design D2)

- [x] 1.1 Emit the already-parsed identity extras (`v1`, `rollup`, `gates`) in `tooling/scripts/compile-rubric.ts` → `apps/site/lib/generated/rubric.ts`. Verify the generated file carries all three for all 102 entries and `npm run check:rubric-consistency` still passes.
- [x] 1.2 Extract and emit the semantics fields (`definition`, `why`, `manifests`, `detection`, yellow/red flags plus their trailing rationale, `criteria: {3,2,1,0}`, `scope`) from §2–§4. Verify a spot-check of ARCH-02 renders four distinct levels and both rationales, and that the compiler fails naming the indicator when a level or rationale is missing.
- [x] 1.3 Extract and emit the contract fields (`applicability`, `statusing`, `score_mapping`, `fact_schema`, `budget_class`, `evidence`) from §5, §8–§10. Verify the ARCH-02 entry carries the JSON fact schema and the budget class verbatim from the canonical file.
- [x] 1.4 Emit `CATEGORY_CHARTERS` (`thesis`, `summary`) read from each category `README.md`. Verify all ten entries are non-empty and match the charter lines character-for-character.
- [x] 1.5 Add a compiler assertion that every indicator yields exactly four criteria levels and non-empty flag rationales; verify it fails on a deliberately malformed fixture and passes on the current tree. Run `npm run compile:rubric` and confirm `git status` shows only the expected generated files changed.

## 2. Coverage and evidence indices (design D5, D6)

- [x] 2.1 Add `apps/site/scripts/build-coverage-manifest.ts` that maps `apps/scanner/src/scan/detectors/*.ts` to indicator IDs, reads the engine version from `apps/scanner/package.json`, and writes `apps/site/lib/generated/coverage.ts` deterministically. Verify it yields 31 IDs and fails loudly when pointed at a missing directory.
- [x] 2.2 Wire the script into the site `prebuild` and add the `coverageClaim()` helper with the version-equals-manifest assertion. Verify a mismatched claim version fails the build naming both versions.
- [x] 2.3 Extend `apps/site/scripts/build-samples-manifest.ts` to emit `SAMPLE_ROW_INDEX` (`indicatorId → [{slug, anchor}]`) from the committed envelopes. Verify every graded row in the committed sample appears in the index and the generated file is deterministic across two runs.
- [x] 2.4 Add unit tests for the coverage manifest and the row index. Verify `npm test --workspace @leapscore/site` passes and the tests fail if a detector file is renamed.

## 3. Link helper (design D8)

- [x] 3.1 Add `apps/site/lib/rubric-links.ts` with `categoryHref(code)` and `indicatorHref(id)` deriving the `NN` prefix from `CATEGORY_ORDER`. Verify a test covers all 102 IDs, asserts the padded category prefix, and asserts no component contains a literal `/rubric/` path.

## 4. Routes

- [x] 4.1 Rewrite `apps/site/app/rubric/page.tsx` as the index: ten category rows with weight, row count, tier mix, and default-status mix, plus the coverage strip. Verify the no-JS document contains all ten rows and the four status counts.
- [x] 4.2 Add the search/filter client island receiving only the index payload. Verify filtering by term, tier, status, and gate narrows the list, clearing restores it, an empty result states itself, and the serialized payload contains no prose field.
- [x] 4.3 Replace the accordion in `apps/site/app/rubric/[categoryId]/page.tsx` with a server-rendered table (ID, name, tier, status, effort, gates, rollup) whose rows link via `indicatorHref`. Verify every row is in the no-JS document and keyboard-activatable.
- [x] 4.4 Add `apps/site/app/rubric/[categoryId]/[indicatorId]/page.tsx` with `generateStaticParams` over the registry, `dynamicParams = false`, the criteria ladder, flags with rationale, remediation trio, statusing, fact schema, evidence, and scope, plus prev/next and the in-page contents rail. Verify 102 documents are exported and an unknown ID renders the not-found document.
- [x] 4.5 Delete `apps/site/app/rubric/rubric-browser.tsx`, replace the sidebar with index navigation, and remove `apps/site/lib/parse-rubric.ts` once no route imports it. Verify `npm run lint --workspace @leapscore/site` reports no unused module and the site builds without the markdown parse.
- [x] 4.6 Link report rows to their rubric entry from `components/category-section.tsx`, `components/blockers.tsx`, and `components/report-view.tsx` using the helper. Verify a rendered sample links each graded row to its exact indicator document.
- [x] 4.7 Link a rubric document to a committed sample row from `SAMPLE_ROW_INDEX` when one exists. Verify an indicator present in the sample set renders the evidence link, and one absent from it renders none.

## 5. Boundary, palette, and release gates

- [x] 5.1 Close the `from "fs"` gap in `tooling/checks/site-boundary.ts` so every filesystem/child-process import form is caught outside a declared exemption. Verify the check passes on the current tree and fails on a fixture that adds `import fs from "fs"` to a served module.
- [x] 5.2 Remove the `amber-50`/`red-50` cards from the category page and render the flag pair with neutral panels. Verify no rubric surface uses a color outside the neutral tokens and the four band-tier tokens (assert in a test or a grep gate).
- [x] 5.3 Verify interaction affordances: pointer cursor and visible keyboard focus on every row link, filter control, and contents-rail link. Assert in the existing affordance test.
- [x] 5.4 Update `apps/site/README.md` for the new route, the retired parser, the two generated indices, and the rubric-links module. Verify `npm run check:documentation-structure` passes and the README route list matches `app/rubric/`.
- [x] 5.5 Run the full verification set from the repository root: `npm run compile:rubric -- --check`, `npm run check:site-boundary`, `npm run check:dist`, `npm test --workspace @leapscore/site`, and `npm run build --workspace @leapscore/site`. Verify all pass and `check:export` reports no failed document.

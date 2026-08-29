## 1. Scorer — flatten facts + human reasons (all indicators at once)

- [x] 1.1 Implement `flattenFact(facts, id)` helper in `packages/engine/scorer/mvp.ts` that unwraps detector-keyed nesting (`{docs08: {...}}` → flat) and verify via unit test that `docs03/docs04/docs08` examples from `docs/specs/09_DOCS_KNOWLEDGE/*:§3` produce flat `evidence.facts` with no `docs08` key.
- [x] 1.2 Replace hardcoded `score: 2` + generic `reason: "${id} measured via ${tool}"` for **all tranche-A indicators at once** (DOCS-01/03/04/08/09, PERF-02/06, DATA-01, ECOS-06/08, SEC-09/10) with per-indicator `reasonFor*` builders implementing `§5` predicates; each `reason` SHALL explicitly include the encyclopedia flag rationale for the scored band (e.g. `— per DOCS-03 Red flag: incidents recovered by heroics, every lesson repeated`) and be ID-free; verify each scores 0 on the "absent" fixture and 3 on the healthy fixture via scorer unit tests.
- [x] 1.3 Apply the same flatten + rationale-citing reason fix in `packages/engine/scorer/phase1.ts:76-107` for all 6 GH-API rows (VEL-06/08/09/10, SEC-07, TEST-08) — remove `${id}` prefix from `reasonFor`, ensure `evidence.facts` flat, and include rationale clause; verify `factsToRows` test asserts `reason` contains `per ... flag` and no leading `VEL-`/`SEC-` and no nested object in facts.

## 2. Renderer — defensive display (table vs pills)

- [x] 2.1 Patch `apps/site/components/category-section.tsx:28-63` `RowDetail` facts loop: introduce `formatFactValue(v)` — primitives → `String(v)`, objects/arrays → `JSON.stringify(v)` (special-case `breaking_with_migration_guide` → `"k/t documented"`), filter empty/null facts; when `Object.keys(facts).length <= 5` render as a compact key:value table, when `> 5` render as pills with truncation at 80 chars + `title` hover; verify via component test that `{docs08: {changelog_present: false}}` (legacy nested) and `{changelog_present: false}` (new flat) both render without `[object Object]`, and that 3-fact DOCS row uses table while 7-fact ECOS row uses pills.
- [x] 2.2 Remove duplicate indicator-code subtitle from `RowDetail`/`reason` display so the ID appears only in the left mono column (`Row:118`) and `reason` is ID-free with rationale; keep single `detected via <tool>` line with `args` once; verify screenshot no longer shows `DOCS-08 measured via ...` line under `DOCS-08` header and that every `reason` contains a rationale citation.

## 3. Verification

- [x] 3.1 Add `packages/engine/scorer/mvp.test.ts` (or extend `detector.contract.test.ts`) covering all tranche-A + Phase-1 absent vs healthy vs partial fixtures per spec scenarios; verify `evidence.facts` flatness, score mapping, and `reason` includes rationale.
- [x] 3.2 Manual smoke: `npm run dev` → visit `/live?repo=achalaggarwal/legacyleap` (or any public repo with no changelog/runbooks) and confirm no `[object Object]`, every expanded row shows rationale-citing `reason`, facts use table (≤5) vs pills (>5), and scores reflect predicates (0 for absent runbooks/changelog).
- [x] 3.3 Run existing suites `npm run check:rubric-consistency` and site/engine `vitest` and confirm no regressions in `report-rendering` canonical-name checks.

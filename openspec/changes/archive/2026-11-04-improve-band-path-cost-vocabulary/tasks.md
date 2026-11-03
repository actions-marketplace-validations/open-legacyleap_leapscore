## 1. Contract vocabulary

- [x] 1.1 Replace the `Sprint` / `Quarter` / `Structural` labels in `BAND_PATH_CLASS_META` with a tag identity (`⚡` / `🔶` / `🔷`) plus per-step verification framing (`Verify in ≤30 min` / `Verify in 2–4 h` / `Verify in 1–2 days`), drop the `{label, effort}` duration pair, and carry both fields onto `BandPathBlockClass` — verified by `npm test -w packages/contracts` and a typecheck
- [x] 1.2 Rewrite the three arrival sentences to `These rows alone reach <band>` / `These rows cross only with the classes before it` / `These rows stay short of <band>`, and frame every step's effort as `Verify effort: <tag>` on `BandPathBlockStep` — verified by contract unit tests asserting all three arrival states and the verify-framed step label
- [x] 1.3 Add the exported `verifyEffortLabel(effort)` helper (verify framing, `unknown` when the tag is absent) to `packages/contracts/src/index.ts` so every surface speaks one framing — verified by unit tests for a present tag and for absent/blank input
- [x] 1.4 Change `formatBandPathClause()` to name the crossing class by its tag identity (`via ⚡`, `via ⚡+🔶`) instead of the persisted enum key — verified by updated clause tests and the unchanged unreachable/terminal clauses
- [x] 1.5 Update the existing contract wording assertions to the new vocabulary and add a guard test that no arrival sentence or class label contains `Sprint`, `Quarter`, `Structural`, or a calendar noun — verified by `npm test -w packages/contracts`

## 2. CLI emitters

- [x] 2.1 Update `renderPathHtml` and `renderPathMarkdown` in `apps/scanner/src/scan/render.ts` to render the class tag plus verify framing, and to separate the step's verify tag from its quick-win prose with an explicit remediation label — verified by the CLI band-path tests asserting the rendered string
- [x] 2.2 Update the wording-pinning assertions in `apps/scanner/src/scan/__tests__/band-path-cli.test.ts` and keep the derivation assertions in `bandpath.test.ts` unchanged — verified by `npm test -w apps/scanner`

## 3. Site surfaces

- [x] 3.1 Render the class tag and verify framing in `apps/site/components/band-path.tsx`, label each step's tag as verification effort, and label its quick win as remediation prose — verified by `apps/site/components/band-path.test.tsx`
- [x] 3.2 Remove the `⚡ ≤30 min` fallback in `apps/site/components/blockers.tsx` and render `verifyEffortLabel(reg?.effort)` so an absent registry entry reads as unknown — verified by a component test rendering a blocker with no registry effort
- [x] 3.3 Frame the row-header chip and the row-detail remediation chip in `apps/site/components/category-section.tsx` with the same `verifyEffortLabel` helper — verified by a component test asserting the verify framing and no bare effort tag beside the `Remediation` heading
- [x] 3.4 Add site assertions that the rendered class heading carries the tag and verification framing and that no surface emits `Sprint`, `Quarter`, or `Structural` — verified by `npm test -w apps/site`

## 4. Full verification

- [x] 4.1 Run the root test suite plus `npm run lint`, `npm run check:rubric-consistency`, `npm run check:schemas`, and `npm run check:dist`, confirming scoring, rubric artifacts, the sealed envelope, and the committed fixture are untouched — verified by every command exiting 0

## 1. Repair the citations before the paths disappear

- [x] 1.1 Rewrite `openspec/specs/indicator-applicability/spec.md:73` so the applicability tier table is compiled from each indicator's §5 `na_when` predicate under `docs/rubric/indicators/`, not from `docs/specs` (which contains zero `na_when` occurrences); verify `rg -n "docs/specs" openspec/specs` returns no hit for this line and the requirement still describes the compiled `rubric.json` output.
- [x] 1.2 Replace the `docs/plans/06_DATA_MODEL_API.md:35` citation at `openspec/specs/indicator-applicability/spec.md:125` with the live `openspec/specs/report-envelope/spec.md` requirement that defines the report contract; verify the cited path and line exist.
- [x] 1.3 Replace the `docs/plans/05:54` citation at `openspec/specs/scan-phase-1/spec.md:112` with `openspec/specs/report-envelope/spec.md`; verify `rg -n "docs/plans" openspec/specs` returns no hits.
- [x] 1.4 Resolve `openspec/changes/release-packaging/proposal.md:43`, which references the already-deleted `docs/notes/`: if `release-packaging` has landed, confirm the reference is gone; otherwise replace it with the current home of the release-readiness items; verify the path resolves.
- [x] 1.5 Add the citation resolver to `tooling/checks/documentation-structure.ts` per design D4 — backticked repository paths under `openspec/specs/**` must resolve, a `:NN` suffix must not exceed the file's line count, root-prefix allowlist only, fenced blocks skipped, `openspec/changes/archive/**` exempt; verify it reports zero violations on the repaired tree and fails when a citation is temporarily pointed at a missing path.

## 2. Remove the catalog's back-references

- [x] 2.1 Delete banner line 3 (the "canonical unified indicator contract / legacy path is a compatibility alias" line) and line 5 (the self-referential `Canonical path:` line) from all 102 files under `docs/rubric/indicators/`, keeping the H1 and the category/shared-config/catalog link line; verify `git diff --stat` shows exactly 102 files changed with 204 deletions and 0 insertions, and `npm run compile:rubric --check` still passes (the compiled registry must be byte-identical).
- [x] 2.2 Rewrite `docs/rubric/README.md`: drop the `docs/specs/` and `docs/plans/` rows from Source ownership, collapse the "Canonical path, index, and alias map" to the paths that still exist, and state once (here, not in 102 files) that the indicator file is the only editable source; verify every local link resolves and no mention of aliases or plan stubs remains (`rg -n "alias|docs/plans|docs/specs" docs/rubric/README.md` returns nothing).
- [x] 2.3 Rewrite `docs/README.md`: remove the compatibility-guide and retired-plan rows, remove the ownership rows that point at the deleted trees, and keep the map to rubric / OpenSpec / PRODUCT / sample-report / archive-if-kept; verify every link resolves and the page names no deleted path.

## 3. Delete the redirect trees

- [x] 3.1 Delete `docs/specs/**` (103 files) and `docs/plans/**` (18 files); verify `find docs -type d -name 'specs' -o -type d -name 'plans'` returns nothing and `find docs -type f | wc -l` drops from 246 to 125 or fewer.
- [x] 3.2 Delete `docs/archive/2026-10-15-opensource-brief.md` per design D7; verify no surviving document links to it and `rg -n "opensource-brief" .` (excluding `node_modules` and `openspec/changes/archive`) returns nothing.
- [x] 3.3 Confirm the unique content is preserved: the 65-row arbitration record is present verbatim in `openspec/changes/retire-redirect-docs/design.md` Appendix A, with the 11 verified-as-absorbed IDs and the 54-row divergence breakdown recorded in the same appendix; verify by diffing the appendix table against `git show HEAD:docs/specs/README.md` lines 46–112.

## 4. Narrow the gates

- [x] 4.1 Remove §3 (alias grammar, count, canonical-target resolution) and §4 (plan stub roster, retirement markers, line cap) from `tooling/checks/documentation-structure.ts`, along with the `SPECS`/`PLANS` constants, `PLAN_STUBS`, `ALIAS_FORBIDDEN`, and the alias/stub counts in the summary line; verify the check still fails when an indicator file loses a skeleton section or a category index drops a link.
- [x] 4.2 Add the redirect-grammar guard per design D3: fail on a Markdown file that declares both `^ID: <ID>$` and `^Canonical target:`, or whose heading marks a retired path stub; verify it fails when a sample alias file is recreated under `docs/` and passes on the cleaned tree.
- [x] 4.3 Remove the dormant `docs/specs` alias resolver (`aliasTarget`, the `SPECS` constant, and the legacy-directory validation block) from `tooling/checks/schemas.ts`; verify `npm run check:schemas` still matches all detector schemas to their canonical §7 fact schemas.
- [x] 4.4 Drop `docs/plans/14_WORKFLOW_SCAN_V1.md` and `docs/plans/15_PROJECT_SURFACE_V1.md` from `INVOCATION_SITES` in `tooling/checks/bin-wiring.ts` and update the adjacent comment; verify `npm run check:bin-wiring` passes, which proves `apps/scanner/README.md` and `apps/surface/README.md` still satisfy the D4 rule for `leapscore-scan` and `surface`.

## 5. De-duplicate the policy prose

- [x] 5.1 Update `AGENTS.md`: remove the `docs/specs/`, `docs/plans/`, and phantom `docs/notes/` layout rows; remove the "Compatibility paths" section and the alias/plan-stub sentences in the cardinal-rule and CI-boundary sections; keep the cardinal rule's canonical-vs-derived statement and the OpenSpec authority statement; verify no mention of aliases, plan stubs, or `docs/notes` remains and the documented commands still exist in `package.json`.
- [x] 5.2 Update `CONTRIBUTING.md:19` to drop the "do not edit the compatibility aliases or retired stubs" clause while keeping the canonical-file, shared-config, and generated-artifact rules; verify the sentence names only paths that exist.
- [x] 5.3 Update `tooling/README.md:16` so the documentation-structure row describes the checks that remain (skeleton, index coverage, link integrity, citation resolution, no redirect-only paths); verify it matches the check's actual behaviour.

## 6. Verify the whole change

- [x] 6.1 Run `npm run check:documentation-structure`, `npm run check:schemas`, `npm run check:bin-wiring`, `npm run check:rubric-consistency`, and `npm run compile:rubric --check`; verify all pass and the generated `rubric.json` / `rubric.ts` are unchanged from `HEAD`.
- [x] 6.2 Run `npm test`, `npm run lint`, and `npm run build`; verify no workspace fails.
- [x] 6.3 Verify the tree shape: `docs/` holds only `README.md`, `PRODUCT.md`, `rubric/`, `sample-report/`, and the canonical catalog still contains exactly 102 indicator files with 102 category-index links.
- [x] 6.4 Verify no surviving document references a removed path: `rg -n "docs/specs|docs/plans|docs/notes|opensource-brief" --glob '!node_modules' --glob '!openspec/changes/archive/**' .` returns only archived changes and this change's own artifacts.

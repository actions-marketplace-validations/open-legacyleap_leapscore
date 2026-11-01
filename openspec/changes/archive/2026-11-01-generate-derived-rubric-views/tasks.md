## 1. Move the gate rules to their canonical home

- [x] 1.1 Move the G1–G8 table (gate, red-flag trigger, source indicator) verbatim from `00_EXECUTIVE_RUBRIC.md` Part 0 into `11_WEIGHTS_THRESHOLDS_CONFIG.md` §3, and replace `11` §3's "see `00_EXECUTIVE_RUBRIC.md` Part 0" pointer with the table itself; verify `11` carries all eight rows with their source indicators and `rg -n "00_EXECUTIVE" docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` returns no gate pointer.
- [x] 1.2 Delete Part 0 from `00_EXECUTIVE_RUBRIC.md` and replace it with a link to `11` §3 and the generated sheet; verify the escalation semantics survive in exactly one place and no gate row remains in `00`.

## 2. Emit the generated documents

- [x] 2.1 Add the §2 criteria parser to `tooling/scripts/compile-rubric.ts`: extract the single `- **Yellow flag (warning):**` and `- **Red flag (critical):**` bullets, strip only the trailing italicised `*(Rationale: …)*` aside, and fail the compile if any canonical file yields zero or two of either; verify all 102 files parse and `ECOS-01`'s Yellow flag retains both the "within 6 months of EOL" and "on EOL but with a funded upgrade path" clauses.
- [x] 2.2 Add the gate-table reader for `11` §3 and derive each gate's source indicators from the indicators' §1 `Gates fed` rows; verify the derived set matches the table's source column for all eight gates, and that a mismatch fails the compile.
- [x] 2.3 Emit `docs/rubric/00_SCORE_SHEET.md` with the gate roster, the 102-row criteria table grouped by category (base and FE-active weights in each heading), and the band table; verify it contains 102 indicator rows, 8 gate rows, 10 category headings, and 4 band rows.
- [x] 2.4 Emit `templates/SERVICE_SCORE_SHEET.md` and `templates/SYSTEM_SCORE_SHEET.md` from the registry, preserving the blank-cell structure and deriving row lists, names, weights, deep-dive splits, and the gate checklist; verify each template lists every standard and deep-dive row its current hand-written version lists, in the same category order.
- [x] 2.5 Verify generation is deterministic: run `npm run compile:rubric` twice and confirm the three documents are byte-identical between runs.

## 3. Trim the authored guide

- [x] 3.1 Reduce `00_EXECUTIVE_RUBRIC.md` to Parts 1 (0–3 scale and core-path taxonomy), 3a–3c (rollup mechanics), and 4 (audit planning), with links to `11` for weights/formula/bands/gates and to the generated sheet for the criteria table; verify no indicator rows, weight percentages, band threshold literals, gate roster rows, or formula block remain in the file.
- [x] 3.2 Verify the guide's remaining content has no canonical home elsewhere: every number it still states (the ×3 criticality weights, the 0–3 meanings) appears in no canonical or generated document.

## 4. Gate the generated set

- [x] 4.1 Replace the `00` gate-roster comparison in `compile-rubric --check` with the `11` §3 table comparison, so the roster is verified against its canonical source; verify the check fails when a gate row is removed from `11`.
- [x] 4.2 Add byte-equality comparison for the three generated documents to `--check`, reporting the file and first differing line; verify a one-character hand edit to each document fails the check and reverting passes.
- [x] 4.3 Add the duplicate rules from design D6 to `--check` for `00_EXECUTIVE_RUBRIC.md` (indicator-ID table rows, category weight percentages, band threshold literals, gate roster rows, formula block); verify each rule fires on a deliberately reintroduced duplicate.
- [x] 4.4 Verify propagation end to end: add a clause to one indicator's §2 Yellow flag, run `npm run compile:rubric`, and confirm the clause appears in the generated sheet and that the check passes only after regeneration.

## 5. Declare the generated set

- [x] 5.1 Update `docs/rubric/README.md` so Source ownership lists `00_SCORE_SHEET.md` and both templates as generated artifacts with the compiler as their only writer, and `00_EXECUTIVE_RUBRIC.md` as authored; verify every row names a file that exists.
- [x] 5.2 Update the generated-artifact lists in `AGENTS.md` and `CONTRIBUTING.md` so the "never hand-edit" rule names `00_SCORE_SHEET.md` and the templates alongside `rubric.json` and `rubric.ts`; verify the named paths resolve.

## 6. Verify the whole change

- [x] 6.1 Run `npm run compile:rubric --check`, `npm run check:rubric-consistency`, `npm run check:documentation-structure`, `npm run check:schemas`, and `npm run check:bin-wiring`; verify all pass.
- [x] 6.2 Run `npm test`, `npm run lint`, and `npm run build`; verify no workspace fails.
- [x] 6.3 Verify the shipped artifact is untouched: `git diff --stat` shows no change to `apps/scanner/src/scan/scoring/rubric.json`, `apps/site/lib/generated/rubric.ts`, or `apps/scanner/dist/leapscore-scan.mjs`, and the bundle size is unchanged.
- [x] 6.4 Verify the derived-value duplication is gone: `rg -n "^\| [A-Z]+-\d+ \|" docs/rubric/00_EXECUTIVE_RUBRIC.md` returns nothing, and the formula, tier table, and weight sets each appear in exactly one canonical file plus their generated restatements.

## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `compile-rubric.ts` already parses every canonical indicator, builds a payload, writes `rubric.json` + `apps/site/lib/generated/rubric.ts`, and in `--check` mode compares derived values: weights and tiers in `11`, the gate roster in `00` (`:338–343`). The parsing and comparison machinery exists; only the document emitters are missing.
- `rubric.json` is 82 KB and is inlined into `apps/scanner/dist/leapscore-scan.mjs` (510 KB). Every byte added to the registry ships.
- All 102 canonical files carry exactly one `- **Yellow flag (warning):**` and one `- **Red flag (critical):**` bullet, and there are zero reduced-form rows, so §2 parsing is total — no fallback path is needed today.
- Each indicator's §1 `Gates fed` row names the gates it feeds (`**G3** — Runtime EOL, no path out`), so gate→source mapping is derivable; the gate *trigger* text is not.
- `00_EXECUTIVE_RUBRIC.md` mixes four kinds of content: derived tables (Parts 0, 2, 3d), authored semantics (Part 1), authored mechanics (Parts 3a–3c), and authored planning guidance (Part 4).

## Goals / Non-Goals

**Goals:**

- One writer per file: generated documents have exactly one author (the compiler), authored documents have exactly one author (a human).
- Byte-equality as the gate, matching how `rubric.ts` is already protected.
- Zero growth of the shipped artifact.
- Remove the circular canonical→derived reference for gate rules.

**Non-Goals:**

- Changing what any indicator measures, or any weight, threshold, band, or gate.
- Emitting the per-indicator 0–3 criteria into the sheet (they stay in each canonical §3; see Open Questions).
- Touching `rubric.json`, `rubric.ts`, the bundle, or the site.

## Decisions

### D1 — Split the authored guide from the generated sheet

Chosen: `00_EXECUTIVE_RUBRIC.md` keeps Parts 1, 3a–3c, and 4; a new generated `00_SCORE_SHEET.md` carries the gate roster, the 102-row criteria table, and the band table.

Alternatives: fully generated `00` with the authored prose embedded in the generator (rejected — puts ~120 lines of human-facing guidance inside a TypeScript script, where it will be edited by people who do not think of it as documentation); authored file with `<!-- BEGIN GENERATED -->` regions (rejected — introduces a marker convention the repo does not use, and leaves two authors on one file).

The split also matches how the two audiences already differ: an auditor prints the sheet and writes on it; a reader opens the guide to understand the scale.

### D2 — Echo the criteria; strip only the rationale aside

The generator takes the §2 bullet text and removes the trailing italicised `*(Rationale: …)*` parenthetical. Nothing else is transformed.

Alternatives: truncate to a fixed width (rejected — arbitrary, and truncation is what produced the lossy sheet); add a hand-authored short form per indicator (rejected — 102 edits that create a second authored copy of a rule that already exists, which is the duplication being removed).

Consequence: cells are wider than today's. That is the point — `ECOS-01`'s second clause survives.

### D3 — Flags do not enter `rubric.json`

Chosen: parse §2 inside the compiler and write documentation only.

Alternative: add `yellow_flag` / `red_flag` to each indicator record. Rejected — 102 × 2 strings is roughly 30 KB, about 6% of the shipped bundle, for data no runtime consumer reads. If a future consumer needs the criteria, they can be added then; the parser will already exist.

### D4 — Gate rules move to `11` §3

Chosen: the G1–G8 trigger table moves verbatim into `11_WEIGHTS_THRESHOLDS_CONFIG.md` §3, which already declares itself the canonical home for gate rules; the sheet renders it from there; `00` drops Part 0 entirely and links both.

Alternatives: leave the roster in `00` and reclassify `00` as partly canonical (rejected — contradicts its derived label and the cardinal rule, and leaves the "never hand-edit" instruction ambiguous); derive the roster from each indicator's §1 `Gates fed` alone (rejected — source indicators are derivable but the trigger text has no other home, so the sheet would lose the reason a gate fires).

This decision fixes a live circularity: `11` currently says gate rules are defined "here" and then defers to the derived file for them.

### D5 — Byte-equality replaces the roster-only check

`compile-rubric --check` compares the three generated documents to fresh output and fails on the first differing line. The existing `00` gate-roster comparison is replaced by the `11` table comparison (same intent, canonical source).

Alternative: a separate docs-freshness script. Rejected — a second generator is a second source of truth for the same transform.

### D6 — Duplicate detection in the authored guide is rule-based

The check fails if `00_EXECUTIVE_RUBRIC.md` contains: a table row beginning with an indicator ID, a category weight percentage, a band threshold literal (80 / 53 / 27), a `G1`–`G8` roster row, or a rollup formula block. Each rule targets a specific thing that has a canonical home.

Alternative: free-form review. Rejected — the drift that motivated this change survived review for months.

### D7 — Templates are generated whole

Both score sheets are ~90% derived rows (IDs, names, weights, deep-dive splits, gate checklist); the remaining 10% is fixed blank-cell scaffolding. Whole-file generation is simpler than protecting regions and keeps ownership unambiguous.

## Risks / Trade-offs

- **The criteria table becomes much wider, and wide Markdown cells are hard to scan.** → Accepted: truth over compactness. If it proves unreadable, the fix is a formatting change inside the generator (one row per indicator, Yellow/Red as sub-rows), not a return to compression.
- **Every indicator edit now requires regeneration, so the check fails more often.** → Intended: that is the mechanism working. `npm run compile:rubric` is already the documented flow for any catalog edit.
- **Moving gate trigger text risks losing wording.** → The move is verbatim and reviewed as a diff; the `11` table is then the single copy.
- **Rule-based duplicate detection could false-positive on prose.** → Rules are narrow and anchored to table rows, percentages, and gate IDs; each is listed in the check's header comment so a failure explains itself.
- **`00_SCORE_SHEET.md` is a new numbered file in a directory whose numbering is meaningful.** → It sorts beside `00_EXECUTIVE_RUBRIC.md`, is named for what it is, and is listed in `docs/rubric/README.md` with its generated status.

## Migration Plan

Single commit; `rubric.json` is untouched, so there is no runtime or fingerprint impact.

1. Move the G1–G8 table into `11` §3 verbatim; remove the pointer to `00`; delete Part 0 from `00`.
2. Add §2 parsing, the `11` gate-table reader, and the three emitters; generate the documents.
3. Trim `00` to Parts 1, 3a–3c, and 4; link the sheet and `11`.
4. Replace the `00` roster check with the `11` table check plus byte-equality and duplicate rules.
5. Update `docs/rubric/README.md`, `AGENTS.md`, `CONTRIBUTING.md`; run `check:rubric-consistency`, `check:documentation-structure`, `check:schemas`, `npm test`.

Rollback: `git revert`; the generated documents are inert outside documentation.

## Open Questions

- Whether the sheet should also emit each indicator's §3 0–3 criteria alongside its Yellow/Red flags. Deferrable: it changes neither the specs nor the task breakdown, and Part 1's generic scale plus each canonical §3 already cover the need.

## Why

Half of `docs/` is a redirect layer with no substance: 121 of 246 files exist only to say "the real file is over there" — 102 compatibility aliases under `docs/specs/`, 17 retirement stubs under `docs/plans/`, and two policy pages that explain the other 119. They hold 109 KB and zero contract content. Worse, they are not inert: `openspec/specs/indicator-applicability:125` cites `docs/plans/06_DATA_MODEL_API.md:35`, which is line 35 of a 9-line stub; `scan-phase-1:112` cites `docs/plans/05:54` the same way; and `indicator-applicability:73` claims applicability compiles from `docs/specs` `na_when`, which appears zero times in that tree (it lives in each indicator's §5). Those citations are code spans, not links, so no check has ever walked them — the "current truth" documents already point at text that stopped existing when the stubs were written.

The layer is not accidental either: `tooling/checks/documentation-structure.ts:237` fails the build unless exactly 102 aliases exist, and `:245–276` requires all 17 stubs. So the tree is a consequence of a gate, and removing the files means removing the invariant that mandated them. The invariant worth keeping — 102 IDs, one canonical file each, all linked from their category index — survives untouched; the invariant worth dropping is "each ID also has a redirect file," which proves nothing about content.

One file in the tree carries something unique: `docs/specs/README.md`'s 65-row legacy arbitration record. Checked against the shipped §1 identity in each indicator, 11 rows agree and 54 diverge (16 tier-only, 17 status-only, 21 both) — a documented-but-unresolved scoring backlog ("reconciliation... remains a separate, future change", `docs/specs/README.md:44`). Deleting the tree without preserving that record would destroy the only copy of it.

## What Changes

- **Delete the redirect trees** — `docs/specs/**` (103 files), `docs/plans/**` (18 files), and the dated `docs/archive/2026-10-15-opensource-brief.md`. **BREAKING** for any external bookmark of a per-indicator spec path; verified to have no in-repo consumer (see Impact).
- **Strip the back-references** — all 102 canonical indicator files drop banner line 3 (which links the alias being deleted) and line 5 (which states the file's own path back to itself): 58,898 bytes of boilerplate across the catalog. The category/config/catalog link line stays.
- **Rewrite the two surviving maps** — `docs/README.md` and `docs/rubric/README.md` lose every row describing aliases, retirement stubs, and the compatibility policy; `docs/rubric/README.md`'s "Canonical path, index, and alias map" collapses to the paths that still exist.
- **Narrow the three checks** — `documentation-structure.ts` drops its alias block (§3) and plan-stub block (§4) and keeps the 102-file skeleton check, index coverage, and local-link walk; `schemas.ts` drops the dormant `docs/specs` alias resolver; `bin-wiring.ts` drops `docs/plans/14` and `docs/plans/15` from the D4 invocation table (both commands remain covered by `apps/scanner/README.md` and `apps/surface/README.md`).
- **Repair the four stale citations and gate the error class** — `indicator-applicability:73` and `:125`, `scan-phase-1:112`, and `openspec/changes/release-packaging/proposal.md:43` (which references the already-deleted `docs/notes/`). The citation resolver that catches them becomes a check: a path reference in `openspec/specs/**` must resolve, and a line-numbered citation must not exceed the file's length. Archived changes are exempt — they record the tree as it was.
- **Preserve the arbitration record where history belongs** — the 65 rows move verbatim into this change's `design.md`, annotated with the verification outcome: 11 rows already encoded structurally in each file's §8 (`measured_when: never auto-measured` + an `estimated_when` predicate + `clamp: [1,2]`), 54 rows carried forward as the reconciliation backlog for a follow-up change.
- **De-duplicate the policy prose** — `AGENTS.md` (layout rows 31–33, lines 58, 64–66, 87–90, 107), `CONTRIBUTING.md:19`, and `tooling/README.md:16` stop describing a layer that no longer exists; `AGENTS.md`'s phantom `docs/notes/` row goes too.

Non-goals:

- **Reconciling the 54 divergent rulings.** That is a scoring decision per row (tier moves effort class and v1 flag; status moves the measured/estimated/unknown claim), needing domain review and a `rubric.json` regeneration. It gets its own change; this one preserves the evidence.
- **Generating the derived rubric views.** `00_EXECUTIVE_RUBRIC.md` and `templates/` keep their current form here; the compiler work is `generate-derived-rubric-views`.
- **Rewriting `PRODUCT.md`, `sample-report/`, or the category indexes.** Audited and kept as-is; the indexes are already machine-checked for ID and link coverage.
- **Any change to indicator semantics, weights, thresholds, gates, or scanner behavior.**

## Capabilities

### New Capabilities

- `documentation-structure`: the docs-tree contract the repository gates on — which paths are canonical sources, that no redirect-only tree or path stub exists, that every local Markdown link resolves, that the catalog carries exactly 102 skeleton-conformant indicator files each linked from its category index, and where superseded records are preserved when their paths are removed.

### Modified Capabilities

None. `indicator-applicability` and `scan-phase-1` citations are repaired as conformance to their existing requirements, not changed by this one.

## Impact

- **Docs removed**: `docs/specs/**` (103), `docs/plans/**` (18), `docs/archive/2026-10-15-opensource-brief.md`.
- **Docs edited**: `docs/README.md`, `docs/rubric/README.md`, `docs/rubric/indicators/**/*.md` ×102 (banner only), `AGENTS.md`, `CONTRIBUTING.md`, `tooling/README.md`.
- **Checks**: `tooling/checks/documentation-structure.ts` (§3 + §4 and the `SPECS`/`PLANS` constants, `PLAN_STUBS` table, summary counts), `tooling/checks/schemas.ts` (`aliasTarget`, `SPECS`, legacy-dir block), `tooling/checks/bin-wiring.ts` (`INVOCATION_SITES` two entries).
- **OpenSpec**: `openspec/specs/indicator-applicability/spec.md` (two citations), `openspec/specs/scan-phase-1/spec.md` (one), `openspec/changes/release-packaging/proposal.md` (one).
- **Consumers confirmed absent**: no detector manifest or schema references `docs/specs` (`rg docs/specs packages/detectors` → 0); no site, Action, or workflow path reads either tree; `check:documentation-structure` is the only machine consumer, and it is the thing being narrowed.
- **One-way door**: 122 files and ~168 KB deleted. Recovery is git history only.
- **Coordination**: `release-packaging` is mid-flight (18/19 tasks) and its `proposal.md:43` is one of the repaired citations — land it first or accept the one-line edit here.

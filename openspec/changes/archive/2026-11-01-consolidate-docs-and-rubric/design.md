## Context

See `proposal.md` for the motivation and scope. The preceding `docs-architecture-and-cleanup` change corrected the existing documentation without changing its stable paths or split ownership. The repository still has:

- category encyclopedias under `docs/rubric/` that own human-facing semantics;
- 102 implementation contracts under `docs/specs/` that repeat identity and cross-reference the encyclopedias;
- a compiler that reads the category encyclopedias, while detector/schema checks and contributor guidance read the separate specs; and
- plan paths used by current documentation, checks, and historical links even though the authored plan corpus is no longer a useful current source.

The migration must preserve the current report/scoring contract. In particular, the existing 102 IDs, category order, thresholds, weights, gate vocabulary, applicability/status rules, evidence grammar, remediation fields, generated registry shape, and committed artifact expectations remain invariants.

## Goals / Non-Goals

**Goals:**

- Make one Markdown file the canonical, reviewable unit for each indicator.
- Keep shared scoring configuration and cross-indicator conventions explicit and separate from per-indicator content.
- Give readers category indexes and a top-level navigation path without maintaining duplicate indicator bodies.
- Retire the authored planning corpus while keeping practical path-level compatibility for known consumers and external links.
- Make the compiler and validation checks prove one-to-one indicator coverage, required contract sections, and alias-only legacy paths.
- Make the migration reversible and reviewable in category-sized batches.

**Non-Goals:**

- Change scanner, site, CLI, Action, report, API, issue-surfacing, or scoring behavior.
- Recalibrate thresholds, weights, gates, applicability, indicator criteria, detector predicates, or evidence semantics.
- Move or merge the OpenSpec product specifications; they remain the current authority for post-MVP runtime behavior.
- Preserve historical plan prose as a second maintained documentation source. Git history and OpenSpec archives remain the historical record.
- Require every old deep-link anchor to retain its old prose; compatibility aliases provide a path and a link to the replacement, not an alternate canonical document.

## Decisions

### 1. Put the unified indicator catalog under `docs/rubric/indicators/`

Create one file per indicator under the existing rubric authority, preserving the numbered category grouping:

```text
docs/rubric/
  README.md
  00_EXECUTIVE_RUBRIC.md          # derived presentation
  01_...10_*.md                   # category indexes and navigation
  11_WEIGHTS_THRESHOLDS_CONFIG.md # shared scoring configuration
  indicators/
    01_DEPENDENCY_ECOSYSTEM/
      ECOS-01_runtime-language-eol.md
      ...
    ...
```

The rubric directory remains the public and tooling-facing authority, so existing `docs/rubric/` links do not need a new top-level vocabulary. A separate `docs/catalog/` root was considered, but it would make the already-public rubric path a compatibility layer and would require more unrelated link churn.

The existing `01`–`10` files become category indexes: category purpose, weight/applicability summary, indicator table, and links to the unified files. They no longer contain competing full indicator entries. `11_WEIGHTS_THRESHOLDS_CONFIG.md` remains the canonical home for shared weights, formulas, bands, gates, and calibration configuration. Derived executive/template files remain derived.

### 2. Use an explicit merged Markdown contract

Each unified file has a stable, parseable skeleton with human semantics before implementation detail:

1. **Identity** — ID, name, category, engine tier, default status, v1 flag, gates, standard/deep-dive rollup, and verify effort.
2. **Definition and impact** — definition, why it matters, objective metric, example symptom, blast radius, flags with rationale, and scope/overlap boundary.
3. **Scoring semantics** — the indicator's 0–3 criteria and references to shared threshold/configuration rules; no conflicting duplicate thresholds.
4. **Remediation** — quick win, structural fix, gold standard, and effort.
5. **Applicability and inputs** — archetype/plane predicates, data planes, ecosystems, tools/minimum versions, endpoints, and rate cost.
6. **Detection recipe** — ordered commands/API calls, flags, preconditions, and the no-target-code-execution rule.
7. **Fact schema** — emitted indicator-namespaced JSON, units, provenance, and evidence pointers.
8. **Status and score mapping** — measured/estimated/unknown/N/A/not-implemented predicates, confidence/clamp behavior, and the mapping to the scoring criteria.
9. **Gate, failure, and budget behavior** — gate hooks, timeout/cap/crash/rate-limit degradation, and dissolve semantics.
10. **Evidence and output** — evidence/basis template and the report-facing emission text.

The exact heading text and required fields become part of the documentation check. Existing `docs/specs/README.md` conventions are folded into the unified catalog guide, not copied into 102 files. A field mapping produced during migration accounts for every rubric and implementation-spec field before an old source is removed.

### 3. Make legacy paths compatibility-only

- `docs/specs/README.md` becomes a migration/compatibility guide pointing to the unified catalog and shared conventions.
- Each old `docs/specs/<category>/<id>_*.md` file becomes a short alias containing the ID, canonical target, and a deprecation notice; it contains no independent contract text.
- `docs/rubric/01`–`10` remain useful category indexes rather than aliases, and `docs/rubric/README.md` becomes the catalog landing page.
- `docs/plans/` is reduced to a retirement notice plus path-level stubs for filenames still required by checks or established links. Stubs point to the current OpenSpec/documentation replacement and retain only the minimum command invocation text needed by `check:bin-wiring`; historical plan bodies are not copied forward.
- OpenSpec specifications are not rewritten solely to change historical references. The compatibility stubs keep existing current-spec links resolvable; user-facing contributor and tooling references are updated to the canonical catalog.

This gives old paths a safe landing without allowing them to become a second edit location. A structural check will fail if an alias grows indicator contract sections or if a unified ID appears in more than one canonical file.

### 4. Change the compiler at the source boundary, not the output contract

Update `tooling/scripts/compile-rubric.ts` to enumerate and parse the 102 unified files in deterministic category/numeric order. Keep the derived JSON/TypeScript field shape and category labels stable. The parser will read indicator metadata/remediation from the unified files and continue to read shared configuration from `11_WEIGHTS_THRESHOLDS_CONFIG.md` or its existing validated representation.

Extend `check:rubric-consistency` and the schema/structure checks to verify:

- exactly 102 unique IDs, all present in the category indexes;
- every unified file has the full or approved reduced skeleton;
- rubric semantics and implementation predicates are co-located;
- old `docs/specs` files are aliases, not sources;
- generated JSON/TypeScript remains synchronized; and
- compatibility plan stubs and documented command invocations still resolve.

The migration compares normalized generated payloads and key metadata before and after the source move. Any changed rubric version or committed Action bundle is treated as a review finding, not silently accepted.

### 5. Migrate in two phases and validate before deleting source bodies

For each category, first generate/review the unified files and update indexes/checks while the original rubric/spec bodies are still available for comparison. Then replace the old per-indicator bodies with aliases and remove the retired plan prose. This avoids a period where a failed merge has no authoritative source and keeps rollback at file granularity.

The migration order is: inventory and field map → shared guide and one pilot category → remaining categories → compiler/checks → aliases and plan retirement → links/generated artifacts → full validation. Category-sized commits are preferred so semantic review can compare one source pair at a time.

## Risks / Trade-offs

- [Merging two files can silently drop or reinterpret a rubric or implementation field] → Build a field-by-field mapping, snapshot IDs/semantics before migration, compare every unified file against both inputs, and require the structural check plus rubric consistency to pass.
- [The compiler may produce a different ordering, hash, or generated registry] → Sort by the existing category/numeric order, compare normalized pre/post payloads, regenerate only through the existing command, and inspect any version/artifact delta before accepting it.
- [Legacy aliases may accidentally become maintained source files] → Keep aliases deliberately short, add an alias-shape validation rule, and make all canonical links point into `docs/rubric/indicators/`.
- [Retiring plans can break command checks or current references] → Inventory all `docs/plans` consumers first, retain path stubs for required files, update non-OpenSpec consumers, and run link/path/bin-wiring checks before source removal.
- [External links to historical plan section anchors will lose their old prose] → Preserve the old file paths with explicit retirement notices and replacement links; accept that deep historical anchors are not a maintained API because the user chose to retire the planning corpus.
- [A large documentation-only diff is difficult to review] → Apply category-sized migrations, preserve semantic field order, avoid unrelated prose rewrites, and record the old-to-new map in the migration checklist until validation completes.

## Migration Plan

1. Inventory every rubric heading, every implementation spec, every category/config field, and every `docs/plans` consumer. Produce the old-to-new path and field map.
2. Define the unified catalog guide and skeleton in `docs/rubric/README.md`; create one pilot category and its category index without deleting the original sources.
3. Merge the remaining 102 indicator pairs into `docs/rubric/indicators/<NN_CATEGORY>/`, preserving all semantics and adding explicit cross-field validation.
4. Update the compiler, rubric consistency check, schema/structure checks, category indexes, contributor guidance, detector references, and user-facing links to use the unified source.
5. Run the compiler and compare generated rubric JSON/TypeScript with the pre-migration normalized outputs. Rebuild the committed Action artifact only if the repository's existing parity workflow requires it and the semantic diff is empty.
6. Replace standalone `docs/specs` entries and retained plan paths with compatibility aliases/stubs. Retire the remaining authored `docs/plans` bodies and update all practical links.
7. Validate local links, alias shape, one-to-one IDs, required sections, documented commands, `npm run check:rubric-consistency`, `npm run check:schemas`, `npm run check:bin-wiring`, and the normal build/test gates.

Rollback is a file-level revert of the migration batches. Do not delete the old source bodies until the unified files, compiler, checks, links, and generated artifacts have passed review; if validation fails, restore the prior source pair and leave runtime artifacts untouched.

## Open Questions

None. The canonical location, merged file shape, compatibility policy, and planning-corpus disposition were resolved before artifact creation.

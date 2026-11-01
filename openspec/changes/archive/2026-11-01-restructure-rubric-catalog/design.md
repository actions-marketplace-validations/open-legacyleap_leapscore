## Context

See `proposal.md` for motivation. The constraints that shape the approach:

- `docs/rubric/` is consumed by five readers with different needs: a maintainer editing an indicator, an auditor reading and filling sheets, the compiler that generates the registry, the structure/consistency checks, and the site's `/rubric` browser.
- The category table is hardcoded twice — `CATEGORY_FILES` in `tooling/scripts/compile-rubric.ts` and `CATEGORIES` in `tooling/checks/documentation-structure.ts` — and a third time implicitly in `apps/site/lib/parse-rubric.ts`, which derives the category id from `file.split("_")[0]`.
- The site parses indicator prose with its own regexes (`parse-rubric.ts`), duplicating work the compiler already does. Weights are not in the generated registry (`apps/site/lib/generated/rubric.ts` exports `INDICATOR_REGISTRY`, `CATEGORY_LABELS`, `CATEGORY_ORDER` — no weights), so the site scrapes them out of the category index prose line.
- `documentation-structure` explicitly forbids redirect-only paths, so a path change is a hard move, not a compatibility layer.
- `check:rubric-consistency` enforces byte-equality between generated artifacts and a fresh compile, which makes every intermediate migration state verifiable.
- `check:dist` requires the committed Action dist to be byte-identical to its sources, so the regenerated registry must ship with a rebuilt bundle.

## Goals / Non-Goals

**Goals:**

- Make the layer a path segment, so a document's role is knowable without opening it.
- Collapse the three category tables into one derivation from the tree.
- Remove the site's prose parser in favour of the generated registry.
- Make "generated" a directory property rather than an in-file banner.
- Keep the migration mechanical and reversible one category at a time.

**Non-Goals:**

- Changing any indicator's meaning, criteria, thresholds, fact schema, status predicates, or evidence grammar.
- Changing scanner detection, scoring math, the sealed envelope, CLI, Action behaviour, or issue surfacing.
- Introducing a machine-readable manifest or front-matter for indicator fields. The compile-time prose contract stays as-is; only its home changes.
- Preserving external deep links into `docs/rubric/` file paths. Those paths are contributor-facing, not product URLs, and the documentation tree forbids redirect stubs by design.
- Rewriting indicator bodies. Moves are moves; the only content edits are the half-boundary preamble, the entry-point README, and the removal of restated weights from category charters.

## Decisions

### 1. Three layers, named by role

```text
docs/rubric/
  README.md                 ontology + reading order
  indicators/<NN-slug>/     the measured set (charter + 102 files)
  model/scale.md            the 0-3 axis + core-path rule
  model/config.md           weights, formulas, bands, gates, calibration
  sheets/                   the generated instrument
```

`indicators/` holds what is measured; `model/` holds how grades compose; `sheets/` holds the instrument instantiated from both. A reader who knows their question knows their directory.

Alternatives considered: keeping the numbered files and only renaming them fixes the naming without fixing the layering, and still leaves the scoring model masquerading as "category 11". A single `docs/rubric/README.md` plus a flat `indicators/` was rejected because the category charter has a real, distinct job (membership and thesis) that does not belong in per-indicator files.

### 2. Category order lives only in the directory prefix

`indicators/01-dependency-ecosystem/` carries order. No manifest, no ordering table, no numeric filename prefix. Ten places instead of 119, and no new artifact whose purpose needs explaining.

Rejected: a `catalog.yaml` manifest with explicit order. It is more explicit but adds an authored file whose only content is data the filesystem already holds, and it invites weights to migrate into it, violating single ownership of numbers.

### 3. Indicator path is `<ID>-<slug>.md`; the ID carries identity

Zero-padded IDs sort lexicographically within a category, so `readdirSync` order is already correct without a numeric comparator. Keeping the ID in the filename preserves grep-ability, link targets, and the detector-schema → indicator resolution in `check:schemas`.

Rejected: slug-only filenames (`runtime-language-eol.md`). They read better but lose the stable, machine-greppable identity and force every consumer to open files to learn what they are.

### 4. The category charter replaces the root index, and drops the weight

`indicators/<NN-slug>/README.md` carries purpose, thesis, and the membership table with links. It carries **no weight**: weight is a rubric parameter and its single home is `model/config.md`. The site's rubric browser needs the weight, so the compiler emits a `CATEGORY_WEIGHTS` map into `apps/site/lib/generated/rubric.ts` alongside the existing `CATEGORY_LABELS` and `CATEGORY_ORDER`.

This is the only content change to authored material, and it removes a restatement that `check:rubric-consistency` does not currently catch.

### 5. Derive the category table; delete the hardcoded copies

The compiler and the structure check both read `indicators/` with `readdirSync`:

| Field | Source |
|---|---|
| order | `NN-` directory prefix, ascending |
| directory | the directory itself |
| category code | the leading token of any indicator ID inside it (`ECOS`, `ARCH`, …) |
| label | the charter's H1 |
| ids | indicator filenames, ascending |

The check asserts exactly ten directories, contiguous `01`–`10`, each with a charter and at least one indicator, all IDs inside a directory sharing one category prefix, and every segment kebab-case after the numeric prefix. A typo therefore fails loudly instead of silently creating an eleventh category.

### 6. Generated rubric documents are directory-scoped

Everything generated lives in `sheets/`; nothing generated lives elsewhere in the rubric tree. `check:documentation-structure` asserts the placement and the provenance header; `check:rubric-consistency` already asserts byte-equality, which now also proves a hand-edited file did not land in `sheets/`.

### 7. The site reads the registry, not the prose

`parse-rubric.ts` keeps its role of assembling the browser view but sources structure (category order, labels, weights, membership) from `apps/site/lib/generated/rubric.ts`. It stops regexing the category index and stops depending on file names for category identity. The site's well-known content retrieval (definitions, flags, criteria) still comes from the indicator markdown, because that prose is the product.

### 8. Two halves declared, not split

A full-form indicator file gains one preamble line stating that §1–§4 carry rubric semantics and §5–§10 carry the detector contract. The file stays single. Splitting would restore the drift the previous consolidation removed and would double the file count.

### 9. Site URLs stay `/rubric/<NN>`

The category id remains the two-digit prefix, so `/rubric/01` keeps working even though the directory reads `01-dependency-ecosystem`. No public link churns.

## Risks / Trade-offs

- [Renaming 102 paths breaks inbound links from other docs] → the link check enumerates every broken target in one run; fix them in the same category commit that moves the files, so each commit lands green.
- [Derivation can silently accept a malformed tree] → the contiguous-`01`–`10`, one-category-prefix, and kebab-case assertions in `check:documentation-structure` are the guard; a missing or extra directory fails rather than producing a shorter list.
- [Generated provenance strings embed the old paths] → `rubric.json`, `rubric.ts`, and the committed Action dist embed "COMPILED from docs/rubric/indicators/…" comments. They regenerate; the diff is comment-only plus the new `CATEGORY_WEIGHTS`. `check:dist` proves the bundle was rebuilt.
- [Category charters lose their weight line, so a reader browsing one category no longer sees its weight] → the charter links `model/config.md` and the site shows the weight from the registry; the duplication cost outweighed the convenience.
- [Intermediate commits have old generated output pointing at moved files] → each category commit ends with `npm run compile:rubric` so the generated links resolve at every commit, not only at the end.
- [A future category addition now requires a directory, not a table row] → intended, and it is exactly one place instead of three.

## Migration Plan

Thirteen commits, each independently green:

1. Add `model/` and `sheets/`; move the executive rubric and shared config into them; rewrite `docs/rubric/README.md` as the ontology. Update compiler output paths and generated links.
2. Through 11. One category per commit: move `<NN>_NAME.md` → `indicators/<NN-slug>/README.md`, move and rename its indicator files, drop the weight line from the charter, add the half-boundary preamble, fix intra-category and inbound links, regenerate.
3. Collapse the two hardcoded category tables into the shared derivation; add the tree-shape assertions.
4. Repoint `parse-rubric.ts` at the generated registry; emit `CATEGORY_WEIGHTS`; regenerate `rubric.ts`/`rubric.json`; rebuild the Action dist; amend `openspec/specs/documentation-structure/spec.md`.

Rollback: each commit is a pure move plus regenerated artifacts, so reverting a category commit restores that category without touching the others. The move commits do not change generated content except provenance strings, so a full revert of commits 2–11 returns the tree to its current shape with an identical registry.

## Open Questions

- Whether `indicators/README.md` (set-level conventions: tiers, statuses, full/reduced form) should exist as a fourth document or those conventions should stay in the rubric entry README. This changes no path, no requirement, and no task ordering; decide at implementation time.

# Structural legacy coverage — roadmap

> Status, baseline, decisions, and ordered backlog for the six structural signal
> families across Java, .NET/VB.NET, VB6 and Delphi. Evidence is measured on the
> current tree (2026-11-01), not asserted. This is a planning document: nothing
> here changes engine, rubric, or contract behaviour, and each backlog item is
> promoted to its own OpenSpec change.

## Scope

**Signals in scope** — measurable from tree + git history + vendored offline
snapshots, with no execution sandbox, live telemetry, or network:

1. complexity hotspots
2. end-of-life runtimes and frameworks
3. dependency age
4. known-vulnerable versions from an offline database
5. test presence
6. size and churn from git history, if available

**Stacks in scope** — the audience named by the product brief: Java, .NET
including VB.NET, VB6, Delphi.

Of the 102 rubric indicators, **63 are pure-structural**, 17 are
structural-plus-GH-API hybrids, and 22 are live-only. The six families above
cover 20 indicators: **11 genuinely measure, 3 are permanent stubs, 6 have no
detector.**

## Baseline

`DONE` = measured on a real estate or fixture · `PARTIAL` = detector exists but
the stack's canonical layout degrades it · `STUB` = wired but always `unknown` ·
`BLOCKED`/`BROKEN` = detector defeated by the stack's own layout · `n/a` =
structurally not applicable.

| signal | Java | .NET/VB.NET | VB6 | Delphi |
|---|---|---|---|---|
| complexity hotspots | STUB | STUB | STUB | STUB |
| EOL runtime | DONE | DONE | DONE | DONE |
| EOL framework | DONE | DONE | n/a | n/a |
| dependency age | PARTIAL | PARTIAL | n/a | n/a |
| known-vulnerable versions (offline) | BLOCKED | PARTIAL | n/a | n/a |
| test presence | PARTIAL | BROKEN | n/a | n/a |
| size & churn | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

Measured coverage, four committed fixtures under
`apps/scanner/src/scan/__tests__/fixtures/legacy-stacks/` scanned through the
real CLI, plus the two estates sealed in
`openspec/changes/archive/2026-10-17-legacy-stacks/notes.md`:

| Target | Coverage (m/e/u of applicable) | Headline |
|---|---|---|
| `webforms-vbnet` (.NET/VB.NET) | 16m / 1e / 9u of 26 | 10.95 · Critical |
| `maven-multi-module` (Java) | 13m / 1e / 14u of 28 | 5.71 · Critical |
| `vb6` | 9m / 0e / 16u of 25 | `insufficient-signal` |
| `delphi` | 9m / 0e / 16u of 25 | `insufficient-signal` |
| Orchard 1.10.3 (.NET Framework) | 8m / 0e / 20u of 28 | `insufficient-signal` (29%) |
| Roller 5.2.2 (Java/Maven) | 12m / 2e / 15u of 29 | `insufficient-signal` (48.3%) |

## Done completely

| Indicator | Evidence |
|---|---|
| `ECOS-01` runtime EOL | `java@1.7` cycle 7 from `pom.xml` (Roller); `dotnetfx@4.0` from csproj (Orchard); `vb6@6.0` from `.vbp`; Delphi version-graded with exact cycles |
| `ECOS-02` major drift | Maven fixture: `struts2-core@2.3.30` vs latest major 6, four majors behind |
| `ECOS-08` framework lock-in | `struts2` active; `aspnet` / `entityframework` in the framework table |
| `SEC-02` secrets | tree plus bounded git history, all five stacks |
| `SEC-09` / `SEC-10` | inventory-based, stack-agnostic |
| `DOCS-01` / `03` / `04` / `09` | stack-agnostic file presence |

## Three defects behind the PARTIAL / BLOCKED / BROKEN cells

Each reproduced on the current build.

### D1 — per-root plane detection hides root-level evidence

`classifyArchetypePerRoot` (`apps/scanner/src/scan/archetype.ts:336`) re-walks
each *manifest root* in isolation, so evidence outside every root is invisible.
The `webforms-vbnet` fixture contains `Tests/Unit/BillingTests.vb` and seals
`planeInventory.has_test = false` with evidence `"tree scan: 0 matches"`.
`legacy-stacks.fixtures.test.ts:212` asserts `has_test === true` because it calls
`detectPlaneInventory` directly, not the per-root path both entry points use
(`local.ts:232`, `orchestrator.ts:246`). Consequence: `TEST-03` / `TEST-05` are
`not_applicable` on every multi-root .NET/Java estate.

### D2 — the lockfile guard blocks the structurally lockless stacks

`deps.ts:743` records `pom.xml` and `packages.config` as *"no lockfile mechanism
— structural absence"*, and `deps.ts:748` already carries declared versions on
`direct`. But `sec01.ts:26`, `ecos03.ts:39` and `ecos06.ts:36` return `unknown`
when `scan.lockfiles.length === 0`. On the Maven fixture the tree declares
`org.apache.struts:struts2-core@2.3.30`; the vendored advisory table carries
`CVE-2017-5638` (CRITICAL, introduced 2.3.5, fixed 2.5.10.1) — and `SEC-01`
reports `unknown`. The same applies to `packages.config`-only .NET Framework,
which is Orchard's layout.

### D3 — Maven's canonical test layout classifies at low confidence

`UNIT_PATH` (`testfiles.ts:66`) matches `tests/unit/`, `__tests__/`, `spec/` —
not `src/test/java/`. `LedgerTest.java` reaches the content fallback,
classifies `unit`, but `high = DOTNET_TEST_FILE.test(path)` is false for
`.java`, so `highRatio = 0%` and `TEST-03` reports *"only 0% of 1 test files
could be tier-classified"*.

## Decisions

**D1 — Defect repair precedes capability work.** D1–D3 make rows the engine
already claims wrong or absent, and each is small. A complexity analyzer built
on a broken test plane would still report no tests.

**D2 — Size folds into `ARCH-01`.** No new row. `ARCH-01`'s fact schema already
owns `file_loc_p95`, `god_classes` and `methods_analyzed`; adding
`files_over_1k_loc` and a size distribution there keeps the row count stable.
Size alone is not a legacy signal — it is a denominator for complexity.

**D3 — Direct-version advisory matching is acceptable with disclosure.** For
lockless stacks (`pom.xml`, `packages.config`), `SEC-01` / `ECOS-03` match
declared direct versions and disclose *"direct-only; transitive unscanned"* plus
the resolvable ratio. A row stays `unknown` when that ratio is too low to be
representative. Requiring a lockfile was rejected: it silently blanks a Critical
CVE visible in the tree.

**D4 — `ECOS-11+` is a new N/A-gated deep-dive row.** It carries the
legacy-platform toolchain exit signal (netfx / VB6 / Delphi / JDK level) that is
pin-measurable where package-level rows are not. Follows the canonical → derived
march: rubric file, charter link, `model/config.md` only if category math
changes, `compile:rubric`, consistency gate.

**D5 — The coverage floor excludes mode-structural GH-lane rows offline.** The
six GH-API rows (`VEL-06`/`08`/`09`/`10`, `SEC-07`, `TEST-08`) are structurally
unknowable without a network and leave the floor denominator. **Budget-truncated
rows are never excluded** — they are the scan's own partial surface, not a
property of offline mode. This implements the option recorded-not-implemented in
`2026-10-17-legacy-stacks` 8.3 Q1.

**D6 — VB6 COM / Delphi BPL census is in scope.** These are the only dependency
surfaces those stacks have. The census stays separate from `Manifest` (following
the `StackCensus` precedent) and feeds `ECOS-02` / `ECOS-03` only where versions
are declared.

**D7 — The plane-detection fix carries a fingerprint era bump.**
`has_test` / `has_client` / `has_deploy` changes move scores on multi-root
estates, so `FINGERPRINT_VERSION` increments and pre/post fingerprints are
explicitly not comparable.

**D8 — Read-budget scaling rides the chartered Q2 follow-up.** Scale the
per-detector cap deterministically with tree size (or an explicit override),
keep the split a pure function of the tree, and audit direct `ctx.readFile`
consumers onto the tracked seam.

## Backlog

Priorities are ordered defect-first, then first-named-signal.

### P0 — repair the shipped surface

Target change: `legacy-signal-repairs` (capabilities: `stack-coverage`,
`deterministic-scoring`).

| # | Item | Verify |
|---|---|---|
| 1.1 | Fix per-root plane evidence so root-level `Tests/`, `Dockerfile` and form files are visible on multi-root estates; bump `FINGERPRINT_VERSION` | `webforms-vbnet` through the CLI reports `has_test = true`, `TEST-03`/`TEST-05` are no longer `n/a`, repeat runs seal an identical fingerprint |
| 1.2 | Replace the hard `lockfiles.length === 0` guard in `SEC-01`/`ECOS-03` with declared-direct-version matching, a resolvable-ratio gate and a direct-only disclosure | `maven-multi-module` reports `SEC-01` measured and names `CVE-2017-5638`; a low-ratio fixture stays `unknown` with the ratio in the note |
| 1.3 | Add Maven/Gradle `src/test/java` to the high-confidence unit-path set; correct the "0% tier-classified" copy to name high-confidence | `TEST-03` on `maven-multi-module` is `measured`; a `.java` test file reports `highConfidence: true` |
| 1.4 | Re-seal both estates after 1.1–1.3 and record row moves and coverage delta | Every moved row listed before/after with the fingerprint change explained |

### P1 — complexity and size

Target change: `structural-analyzers` (capabilities: new `structural-analysis`,
`stack-coverage`).

| # | Item | Verify |
|---|---|---|
| 2.1 | Implement `ARCH-01` as an offline complexity analyzer over `.java`, `.cs`, `.vb`, `.pas`, `.bas` (nesting depth, method length, file LOC, god classes), no external binary | `ARCH-01` measured on all four fixtures; a flat fixture grades Green, a deeply nested one Red |
| 2.2 | Implement `ARCH-08` as an offline token-based duplication analyzer with a documented minimum-token window | `ARCH-08` measured on all four fixtures; a copy-paste fixture crosses Yellow, a clean one does not |
| 2.3 | Fold size into `ARCH-01` facts (`files_over_1k_loc`, LOC distribution) instead of a new row | Fact schema carries the size fields; no new indicator ID in `rubric.json` |
| 2.4 | Keep unsupported-language honesty: a tree with no supported source stays `unknown` with a what-it-takes note | A docs-only fixture reports `unknown` for both analyzers, never a constant |
| 2.5 | Re-measure VB6 and Delphi: complexity is the lever toward the coverage floor | Coverage recorded before/after with the remaining gap to 50% stated |

### P2 — make measured rows trustworthy on real estates

Target changes: `read-budget-scaling` (capability: `deterministic-scoring`),
`snapshot-breadth` (capability: `offline-data-snapshots`),
`legacy-toolchain-row` (capabilities: `stack-coverage`, rubric catalog).

| # | Item | Verify |
|---|---|---|
| 3.1 | Scale the per-detector read cap deterministically with tree size (or an explicit override); audit direct `ctx.readFile` consumers onto the tracked seam | Orchard reads 165/165 manifests instead of 17/165; the split stays a pure function of the tree; the fingerprint moves as a deliberate input |
| 3.2 | Expand the vendored package and advisory tables so a real estate can grade package-level rows | Orchard moves `ECOS-02`/`ECOS-03`/`SEC-01` off `unknown`; every uncovered package is still named in `unresolvable_names` |
| 3.3 | Add the N/A-gated `ECOS-11+` legacy-toolchain row through the canonical → derived march | `npm run check:rubric-consistency` passes; the row is N/A without a toolchain signal and folds into ECOS when run |

### P3 — census-stack rescue

Target changes: `zero-test-signal` (capability: `measurement-honesty`),
`deep-history-clone` (capability: `scan-local` / `scan-phase-2`),
`coverage-floor-denominator` (capability: `measurement-honesty`),
`census-dependency-surface` (capability: `stack-coverage`).

| # | Item | Verify |
|---|---|---|
| 4.1 | Grade zero tests as a measured absence rather than `not_applicable`, so a testless estate carries a red signal instead of no signal | A fixture with no test files reports a scored TEST row; a fixture with tests is unaffected |
| 4.2 | Add a deep-history option to the remote lane so churn (`ARCH-05`) is measurable without a local full clone | A `--repo` scan with the option reports `ARCH-05` measured on a ≥200-commit target; the default shallow path is unchanged |
| 4.3 | Implement the floor denominator rule: exclude the six mode-structural GH-lane rows offline, never budget-truncated rows | VB6/Delphi coverage recomputed on the documented option; Roller's displayed/suppressed outcome matches the recorded prediction |
| 4.4 | Add the VB6 COM/ActiveX and Delphi BPL/package census as a signal separate from `Manifest`, feeding `ECOS-02`/`ECOS-03` only where versions are declared | A VB6 fixture with a versioned COM reference produces a dependency fact; an unversioned reference is disclosed, not guessed |

### Promotion checklist (per item)

1. `openspec new change "<target change>"`, copy the evidence above, and declare
   the capabilities named for that item.
2. Re-run the four fixtures and both estates before and after; record row moves
   in the item's change notes.
3. Update this document's baseline if the item re-scopes a cell.

## Why the order matters: the coverage-floor math

VB6 and Delphi sit at **9 measured / 25 applicable = 36%**, under the 50% floor,
so they render `insufficient-signal` and never show a number. The path out:

```
                      measured / applicable      %
  today                    9 / 25              36%  suppressed
  + ARCH-01, ARCH-08      11 / 25              44%  suppressed
  + ARCH-05 (deep git)    12 / 25              48%  suppressed
  + DOCS-02 or ECOS-11    13 / 25              52%  DISPLAYED

  alternative, if the floor excludes the six
  mode-structural GH-lane rows offline (D5):
  today                    9 / 19              47%
  + ARCH-01, ARCH-08      11 / 19              58%  DISPLAYED
```

Complexity is therefore both the first named signal and the largest single lever
that lifts the census-only stacks out of suppression.

## Open questions

- **Per-language complexity thresholds** are not re-opened here. `ARCH-01` §3
  and `docs/rubric/model/config.md` own the bands; a mismatch surfaces at
  implementation time as a rubric edit, not a plan change.
- **DUnit (`.pas`) and VB6 test conventions** are deferrable: both stacks
  currently have no test plane, so a `TEST_PATH_PATTERNS` entry only matters if a
  real estate demonstrates one.
- **The exact size of the vendored package/advisory tables** is deferrable. The
  P2 item is defined by its acceptance criterion — a real estate resolves enough
  production dependencies to grade — not by a row count.

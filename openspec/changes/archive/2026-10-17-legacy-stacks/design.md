## Context

See `proposal.md` — Why. Implementation-shaping facts from the current tree:

- **Detector contract** (`apps/scanner/src/scan/detector.ts`): detectors receive `ScanContext` (`manifests`, `readFile`, `cache`, `scanMs`, `budgetLease`) and return a `RawFact` with `measurement.status` + `unknownMeasurePath`. `Ecosystem = 'js'|'py'|'go'|'rust'|'java'|'ruby'|'php'|'csharp'` — `csharp` exists only as a type member.
- **Sniff model** (`ecosystem.ts`): root + one-level subdirs, `Manifest = {root, ecosystem, lockfile, manifest}`; `deps.ts` maps each manifest through `EcosystemKey` (`js|py|go|rust|java|ruby|php`), a parser, and an optional lockfile parser; `packages.lock.json` is currently mis-mapped to `parseNpmLock`.
- **Canonical walk** (`tree.ts`): sorted, `SKIP_DIRS = {node_modules, dist, build, .next, .git}`, `fileCount` feeds `computeSampleN` gates.
- **Snapshots** (`snapshots.ts`, `snapshots/eol.json`, `snapshots/advisories.json`): `resolveRuntime` / `lookupPackage` / `matchAdvisories`; content-hash versions are fingerprint inputs; curated source is `tooling/scripts/snapshot-data.ts`.
- **Planes** (`archetype.ts` → `applicability.ts`): five flags, each with exhaustive tree-scan evidence; `planeForIndicator` turns an absent plane into `not_applicable`.
- **Measure-or-unknown + coverage floor** (`detector-honesty`, `scoring/scorer/mvp.ts`): `COVERAGE_FLOOR = 0.5`; thin estates suppress the headline rather than fabricate.
- **Determinism**: repeat-run fingerprint equality is the release contract (`deterministic-scoring`); snapshot version changes are deliberate, visible inputs.

## Goals / Non-Goals

**Goals:**

- .NET/VB.NET become a first-class dependency ecosystem: project-file discovery, NuGet manifest/lock parsing, snapshot-backed EOL/drift/license/advisory facts.
- Legacy Java becomes honest rather than blind: pom property/parent/`dependencyManagement`/scope fidelity, JDK 6/7 cycles, `build.gradle` runtime pin.
- VB6 and Delphi are recognised and measured as *stacks* (toolchain EOL, planes) without pretending they have package managers.
- Every new fact obeys the existing honesty invariants: named producer, real file pointers, `unknown` when unmappable, deterministic repeat runs.

**Non-Goals:**

- New rubric rows or detectors (indicator set stays at the local 25 / 31 measured; no weights change).
- Analyzers for `ARCH-01`/`ARCH-08`; era tables for `ARCH-06`; app-server (WebLogic/JBoss/WebSphere) lifecycle rows.
- Gradle build-file *dependency* extraction; vendored-DB refresh automation; packaging/binary decisions.
- Resolving the frozen-denominator headline-display policy (carried into the two-estate validation).

## Decisions

**D1 — Extend existing indicators; no new rubric rows.**
The ECOS rows are stack-agnostic by construction (ECOS-01 "runtime/language EOL"; ECOS-02 "major package drift"). New rows would trigger the full canonical → derived → `compile-rubric --check` march, change the ECOS category mean on legacy estates, and demand weight sign-off against unvalidated rules. Alternative: add an N/A-gated deep-dive row (ECOS-11+: "legacy platform toolchain exit"). Rejected for this change; revisit after the two-estate runs produce evidence of what a dedicated row would add.

**D2 — Stack census is separate from dependency manifests.**
`Manifest` stays the dependency-ecosystem contract. VB6/Delphi emit a `StackCensus` signal (platform id, evidence files, counts) computed by a memoised helper over the canonical walk — modelled on `cachedSourceImports`/`cachedWorkflows`, so no `ScanContext` shape change. Alternative: model them as ecosystems with empty lockfiles. Rejected — they would poison `scanDependencies` counts and ECOS-02/ECOS-07 semantics ("manifest exists" ⇒ "parse dependencies") for repos that have none.

**D3 — Bounded recursive project discovery for .NET only.**
Classic solutions put project files at repo-relative depth ≥2 (`src/Proj/Proj.csproj`), which the root+1 sniff misses. Discovery: bounded recursive walk (max depth 4, canonical sorted, build/vendor dirs skipped) matching only `.sln`/`.csproj`/`.vbproj`/`packages.config`/`packages.lock.json`/`Directory.Packages.props`/`global.json`. Existing seven ecosystems keep the root+1 model so their discovery results do not shift. Alternative A: make the global sniff recursive — rejected, silently changes discovery for existing repos. Alternative B: parse `.sln` for project paths — deferred; the bounded walk covers the corpus without a solution-file parser.

**D4 — Lifecycle semantics are recorded, not assumed.**
- `dotnetfx`: OS-bound lifecycle — 4.8.1 in support; 2.0/3.5 SP1 and 4.5/4.5.1/4.6/4.6.1 lineage are the flags. Encoded per cycle, not as a blanket EOL.
- `vb6`: one cycle (6.0); the claim is *toolchain* end-of-life (2008) with an OS-bound runtime — the dataset and row copy must say exactly that.
- `delphi`: version-graded per release; current releases are supported. Unmappable project files → `unknown`, never implied dead.
These framings are calibration-grade: the change logs them in the calibration log (`docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §5) with date/field/old-new/evidence, because they change what `is_past_eol` means for these products.

**D5 — Snapshot data stays curated and versioned.**
`endoflife.date` cycles where they exist (`dotnet`, Java); vendor lifecycle pages for products it lacks (`dotnetfx`, `vb6`, `delphi`); advisory rows pinned from OSV with a documented selection rule (legacy-load-bearing CVEs on the parsed ecosystems); package metadata (latest major, last release, license) for the curated Java/NuGet sets. Same refresh procedure (`snapshot-data.ts` → `refresh-snapshots.ts` → commit JSON); version ids move and are fingerprinted. Alternative: fetch at scan time — rejected by the offline requirement.

**D6 — Skip set gains unambiguous build/IDE dirs only.**
Add `obj`, `target`, `.gradle`, `.vs`, `__history`, `__recovery`. Stale `bin/` stays walked: unix `bin/` is real source and this repo's own `apps/scanner/bin/` proves it; `packages/` stays (workspace dirs). `.NET` `Debug/Release` outputs live under `bin`/`obj` and are therefore covered transitively. The skip-set change moves `fileCount` → `sampleN` inputs; treated as a deliberate, tested change (dogfood before/after).

**D7 — Honest pin extraction, primary sources first.**
.NET: `<TargetFrameworkVersion>`/`<TargetFramework>` primary; `global.json` sdk pin secondary; conflicts follow the existing lowest-wins + `conflict: true` rule. VB6: `.vbp` presence *is* the pin (`vb6@6.0`). Delphi: curated compiler/project-version → release table; unmappable → unmapped → `unknown`. `build.gradle` contributes a Java pin (`sourceCompatibility`/toolchain) only; dependency extraction from build files stays out.

**D8 — Planes answer to the rubric, not to convenience.**
`has_server`: `System.Web` reference / `Microsoft.NET.Sdk.Web` / `.asmx`/`.svc`/`.aspx` for .NET; servlet/JSP/Struts evidence for Java. `has_data`: EF/Hibernate/`.sqlproj`/`.sql` (with existing rules). `has_test`: case-tolerant `Tests?/` plus project/marker evidence. Desktop UI (WinForms/WPF/VB6 VCL/Delphi VCL) sets `has_client=true` — the rubric's FE annex explicitly includes desktop clients even though FE detectors remain web-centric and unimplemented (no scoring impact today). Alternative: leave desktop as no-client — rejected as a silent lie about the estate.

**D9 — `packages.lock.json` gets a real NuGet parser.**
The current `parseNpmLock` mapping produces wrong shapes silently; NuGet lock JSON (`dependencies.<tfm>.<pkg> → {type, resolved}`) is parsed directly, distinguishing direct from transitive.

**D10 — No fingerprint format change.**
`FINGERPRINT_VERSION` stays 2: the fingerprint format is unchanged, while snapshot versions and the (deliberate) discovery/skip changes are fingerprinted inputs by design. Validated by per-fixture repeat-run equality and a dogfood diff review; a format change would be a separate decision.

**D11 — Specs are the arbitration point.**
Per `docs/specs/README.md` §2/§4: update `docs/specs/01_DEPENDENCY_ECOSYSTEM/ecos-01/02/03/05/06/07` and `docs/specs/03_TESTING_QUALITY/test-03/05`; ECOS-07 gains the "ecosystem without a lockfile mechanism" rule (Maven precedent generalised to classic NuGet and the census-only stacks).

## Risks / Trade-offs

- [Reviewer reads netfx 4.x as EOL wholesale] → D4 framing + calibration log + report copy that distinguishes OS-bound support.
- [Bounded depth misses deep projects] → depth constant + fixtures for `src/Proj/Proj.csproj` layouts; widening later is another deliberate change.
- [Curated data bias (which packages/advisories)] → documented selection rule; uncovered ecosystems stay disclosed as unscanned, never clean.
- [Skip-set change shifts existing repos' file counts] → dogfood before/after review; only unambiguous build dirs added; `bin`/`packages` untouched.
- [VB6/Delphi estates stay thin → `insufficient-signal` headline] → honest outcome; validation packet shows coverage + renormalized reference; not a regression.
- [Scope creep] → D1 non-goal, no new detectors, no report-schema change.

## Migration Plan

No user migration; behavior change ships as a release with a snapshot version bump. Rollback: revert the commit; `refresh-snapshots.ts` regenerates the previous JSON deterministically. The apply-time documentation updates (`docs/plans/00_MASTER_INDEX.md` D8 amendment; calibration-log entry) are part of the change, not follow-ups.

## Open Questions

- Max discovery depth (4 vs 6) — tunable constant, covered by tests either way.
- First-curation package/advisory rows (editorial, inside the documented selection rule).
- Framework-key naming (`aspnet` vs `webforms`) — internal dataset naming.

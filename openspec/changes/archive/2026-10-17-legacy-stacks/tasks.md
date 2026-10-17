## 1. Stack census and sniff (ingestion)

- [x] 1.1 Extend `ecosystem.ts` with .NET-family recognition (`.sln`/`.csproj`/`.vbproj`/`packages.config`/`packages.lock.json`/`Directory.Packages.props`/`global.json`) behind a bounded recursive project discovery (max-depth constant). Verify: a fixture with only `src/Billing/Billing.csproj` yields a manifest entry, while existing sniff tests stay green and no new entries appear for non-.NET fixtures.
- [x] 1.2 Add a memoised stack-census helper (VB6: `.vbp`/`.frm`/`.bas`/`.cls`/`.ctl`; Delphi: `.dpr`/`.pas`/`.dfm`/`.dproj`/`.dof`) over the canonical sorted walk, modelled on `cachedSourceImports`. Verify: VB6 and Delphi fixtures are identified with evidence paths, and dependency-manifest counts stay zero for both (census is a separate signal).

## 2. Dependency parsing

- [x] 2.1 Add `csharp` to the dependency ecosystem set and implement NuGet parsers: `packages.config` (XML, exact versions, prod scope) and `PackageReference` in `.csproj`/`.vbproj` (attribute and child-element version forms). Verify: unit tests assert direct-dep facts with versions and file evidence for both file shapes.
- [x] 2.2 Replace the `packages.lock.json` → `parseNpmLock` mapping with a real NuGet lock parser (direct vs transitive distinguished, `resolved` versions). Verify: a lock-shaped fixture asserts direct/transitive classification and npm-shaped input is no longer accepted for that filename.
- [x] 2.3 Upgrade the Maven pom parser: `${property}` interpolation from the in-repo properties block, in-repo parent resolution, `dependencyManagement` version lookup, and exclusion of `test`/`provided` scopes from the prod set; unresolvable versions stay unresolvable. Verify: fixture tests for each case, including the disclosed-unresolvable case.
- [x] 2.4 Wire aliases and framework lists: `nuget → csharp` in snapshot ecosystem aliases, `deps.ts` dispatch, and `CORE_FRAMEWORKS` additions (`Microsoft.AspNet.*`, `EntityFramework`, and the agreed framework-class names). Verify: ECOS-02/03/08 integration tests resolve a .NET fixture's packages end-to-end.

## 3. Snapshot data

- [x] 3.1 Extend `tooling/scripts/snapshot-data.ts` curated source: `dotnet` and `dotnetfx` runtimes (OS-bound lifecycle per design D4), Java 6/7 cycles, `vb6` (toolchain framing), `delphi` (version-graded releases); `aspnet`/`struts2` frameworks; NuGet package-metadata table and expanded Java set; maven + nuget advisory subset with the documented selection rule in the source field. Verify: `snapshot-data.ts` parses, and every added row matches the dataset schema via the refresh build.
- [x] 3.2 Regenerate the vendored JSON (`npx tsx tooling/scripts/refresh-snapshots.ts`) and confirm the version ids move; confirm a scan's fingerprint reflects the new snapshot version and no JSON file was hand-edited. Verify: refresh output ids differ from the previous ones and `deterministic-scoring` tests pass.
- [x] 3.3 Add snapshot unit tests: `resolveRuntime` for every new product (including VB6 framing and an unmappable Delphi version → `null`), `lookupPackage` for nuget/maven, `matchAdvisories` for the new ecosystems. Verify: tests fail if any lookup silently defaults.
- [x] 3.4 Record the lifecycle framing in the calibration log (`docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §5) with date, ID, field, old/new, evidence (design D4). Verify: the log entry exists and names each of `dotnetfx`/`vb6`/`delphi`.

## 4. Runtime pins and detector recipes

- [x] 4.1 Extend `ecos01.ts` pin extraction: csproj/vbproj `<TargetFrameworkVersion>`/`<TargetFramework>` (primary), `global.json` (secondary), `.vbp` → `vb6@6.0`, Delphi project-version mapping table, and the `build.gradle` Java pin. Verify: tests assert measured-past-support, unmappable → `unknown` with what-it-takes, conflicting pins → lowest wins + conflict flag, and a fetch-spy asserts zero sockets.
- [x] 4.2 Update ECOS-07 semantics for the new ecosystems: `packages.lock.json` as lock evidence, classic NuGet "no lockfile mechanism → disclosed" rule (generalising the Maven precedent), and census-only stacks per their `na_when`. Verify: tests assert each lock/lockless case and the disclosure text.
- [x] 4.3 Verify ECOS-02/03/05/06 ride the new parsers and data on a .NET fixture: measured drift/abandonment/license facts, uncovered packages disclosed, no literal payloads. Verify: integration test asserting statuses + disclosure, and the demotion fixture remains `unknown` for uncovered ecosystems.

## 5. Planes, tests, and source classification

- [x] 5.1 Extend plane evidence in `archetype.ts` (.NET/Java-legacy server and data signatures; desktop UI → `has_client`) and add the design D6 skip dirs (`obj`, `target`, `.gradle`, `.vs`, `__history`, `__recovery`) to the canonical walk; `bin`/`packages` stay. Verify: fixture tests for each plane, the capitalized-`Tests/` scenario, and a dogfood before/after file-count review recorded in change notes.
- [x] 5.2 Extend `testfiles.ts`: `.cs`/`.vb` test conventions, case-tolerant dirs, MSTest/NUnit/xUnit markers and skip forms (JUnit stays). Verify: classifier tests cover each marker family and the `Scope-limited` disclosure when the read bound is hit.
- [x] 5.3 Extend `sourcefiles.ts`: add `.vb` to the source set and `using`/`Imports` extraction for C#/VB. Verify: reachability/coupling tests on a small C#/VB fixture, with scope-limited labeling when bounded.

## 6. Repo specs and governance docs

- [x] 6.1 Update `docs/specs/01_DEPENDENCY_ECOSYSTEM/ecos-01/02/03/05/06/07` and `docs/specs/03_TESTING_QUALITY/test-03/05` per `docs/specs/README.md` §2/§4 (pin sources, ecosystem lists, lockfile rule, test patterns), logging any drift corrections in the README §4 table. Verify: spec headers stay consistent with the encyclopedia tags; no restated thresholds introduced.
- [x] 6.2 Amend D8 in `docs/plans/00_MASTER_INDEX.md` (decision log): brief Req 10 supersedes the "C#/legacy later" gate for this scope. Verify: the decision entry exists with rationale and status.
- [x] 6.3 Run the repo gates: `npm run compile:rubric` (no-op expected), `npm run check:rubric-consistency`, `npm run check:detector-isolation`. Verify: all exit green with no generated-file diffs beyond expected.

## 7. Fixtures and verification

- [x] 7.1 Add committed fixtures: a WebForms+VB.NET solution, a multi-module legacy Maven tree, a VB6 tree, and a Delphi tree — each exercising the spec scenarios. Verify: each fixture asserts row statuses, evidence pointers, and disclosure text.
- [x] 7.2 Add determinism and honesty tests: repeat-run fingerprint equality per fixture, no-literal conformance, unknown-when-unmapped, and thin-estate insufficiency. Verify: tests fail against seeded regressions (e.g., a changed constant).
- [x] 7.3 Run the full scanner test suite plus a dogfood local scan. Verify: suite green; before/after coverage and headline numbers recorded in change notes for review.

## 8. Two-estate validation (release checklist)

- [x] 8.1 Select one real .NET and one real Java legacy codebase (public OSS or partner code) and record selection + provenance. Verify: both run offline with no network and produce sealed reports.
- [x] 8.2 Assemble the review packet: `report.json`/`report.html`/`report.md`, coverage table, unknowns list with what-it-takes notes, and the renormalized reference with the headline-display question called out. Verify: packet renders cleanly and every unknown cites a measure path.
- [x] 8.3 External review session and findings record. Verify: findings written to change notes, with the rubric-row question (design D1) explicitly revisited against the evidence.

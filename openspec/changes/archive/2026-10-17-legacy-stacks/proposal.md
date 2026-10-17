## Why

The open-source brief (`docs/opensource-brief.docx`, Req 10) names the audience: "Prioritise the stacks our customers run: Java, .NET including VB.NET, VB6, Delphi." The release checklist makes it operational: run on at least two real legacy codebases (one .NET, one Java), output reviewed externally. Today the engine cannot see three of the four stacks:

- The sniff covers `js/py/go/rust/java/ruby/php` (`apps/scanner/src/scan/ecosystem.ts`); `csharp` exists only as a type member (`detector.ts:6`); VB6/Delphi/Pascal appear nowhere (0 hits across scanner + `docs/rubric/`).
- `packages.lock.json` is mis-mapped to the npm lock parser (`deps.ts` `LOCKFILES`); classic `packages.config` / `csproj` are invisible.
- Java is partial: the pom regex parser has no `${properties}` / in-repo `<parent>` / `dependencyManagement` resolution and counts `test`-scoped deps as prod; the EOL snapshot has no JDK 6/7 cycles, so legacy-era pins resolve to `unknown` by design.

`detector-honesty` (landed 2026-10-17) supplies the machinery this change extends: vendored snapshots with a documented refresh (`snapshot-data.ts` → `refresh-snapshots.ts`), measure-or-unknown, coverage floor. The gap is stack ingestion + dataset coverage, not the honesty regime. Why now: this is the last unbuilt brief requirement that gates the two-estate validation, and it shares no files with `offline-default` / `release-packaging`, so it can run parallel.

## What Changes

- **.NET/VB.NET ingestion**: recognize `.sln` / `.csproj` / `.vbproj` / `packages.config` / `packages.lock.json` with bounded project-file discovery (classic solution layouts nest deeper than the current root+1 sniff); parse NuGet dependency files into the existing dep scan.
- **Legacy Java fidelity**: pom `${properties}` + in-repo `<parent>` + `dependencyManagement` resolution; `test`/`provided` scope stops counting as prod; Java runtime pin extracted from `build.gradle` (`sourceCompatibility` / toolchain). Gradle build-file *dependency* extraction is explicitly out of scope.
- **VB6/Delphi stack census**: project-file + extension signatures (`.vbp/.frm/.bas/.cls/.ctl`; `.dpr/.pas/.dfm/.dproj/.dof`) recorded as a census signal alongside — never inside — dependency manifests, because these stacks have no package manager.
- **Runtime pins (ECOS-01)**: csproj/vbproj `TargetFrameworkVersion`/`TargetFramework`, `global.json`, `.vbp` → `vb6@6.0`, Delphi `.dproj`/`.dof` version mapping; unmappable pins stay `unknown` with a what-it-takes note.
- **Snapshot dataset expansion**: `dotnet`/`dotnetfx`, Java 6/7 cycles, `vb6`, `delphi` runtimes; `aspnet`/`struts2` frameworks; a NuGet package-metadata table; maven + nuget advisory subsets — same curated procedure, versioned, fingerprinted.
- **Planes / tests / source classification**: .NET and Java-legacy server/data evidence; `Tests/` dirs (case-tolerant) + MSTest/NUnit/xUnit markers; `.vb` source + C#/VB import extraction (SEC-01 reachability, ECOS-08 coupling).
- **Semantics recorded for calibration**: .NET Framework is OS-bound (4.8.1 supported; 2.0/3.5/4.5-era are the flags); VB6 is toolchain-dead (2008) with an OS-bound runtime; Delphi is version-graded. No new rubric rows and no weights change in this change; revisiting that is a post-validation decision.
- **Non-goals**: complexity/duplication analyzers (`ARCH-01/08` stay `unknown`), app-server/EJB/WebForms-era rows (`ARCH-06` stays unimplemented), gradle build-file deps, vendored-DB refresh automation, and the frozen-denominator headline-display policy (carried as an open question into the two-estate validation).

## Capabilities

### New Capabilities
- `stack-coverage`: recognition and offline measurement of .NET/VB.NET, legacy Java, VB6 and Delphi estates — ingestion, census, dependency parsing, runtime pins, plane/test evidence, and honest-unknown behavior for what stays unmeasurable.

### Modified Capabilities
- `offline-data-snapshots`: dataset coverage extends to the new stacks (runtimes, frameworks, package metadata, advisories) and the source policy covers products `endoflife.date` lacks (vendor lifecycle pages, curated).
- `indicator-applicability`: plane-inventory evidence is extended for legacy/desktop stacks (e.g., .NET web/data signatures, desktop UI), so N/A outcomes on these estates are evidence-backed.

## Impact

- **Code**: `apps/scanner/src/scan/{ecosystem,deps,tree,testfiles,sourcefiles,archetype,detector}.ts`, `detectors/{ecos01,ecos02}.ts`, `snapshots*`, `tooling/scripts/{snapshot-data,refresh-snapshots}.ts`; fixtures + tests per stack.
- **Contract**: no report-schema change; snapshot versions move (fingerprint input by design); `FINGERPRINT_VERSION` expected to stay 2 (no format change) — confirmed by determinism tests.
- **Docs**: `docs/specs/01_DEPENDENCY_ECOSYSTEM/ecos-01/02/03/05/06/07`, `docs/specs/03_TESTING_QUALITY/test-03/05`; `docs/plans/00_MASTER_INDEX.md` D8 amendment logged at apply time (D8 gates C# / legacy stacks as "later"; brief Req 10 supersedes).
- **Release**: unblocks the two-estate validation checklist item, with the headline-display question called out in the review packet.

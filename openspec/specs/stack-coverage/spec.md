## Purpose

Makes .NET/VB.NET, legacy Java, VB6 and Delphi estates measurable offline — stack recognition, dependency parsing, runtime pins, and plane evidence — while preserving the engine's honest-unknown and determinism contracts.

## Requirements

### Requirement: .NET/VB.NET stack ingestion

The system SHALL recognize .NET and VB.NET projects from solution and project files (`.sln`, `.csproj`, `.vbproj`) and NuGet package files (`packages.config`, `packages.lock.json`) anywhere within a bounded depth of the repository tree, and SHALL parse declared packages — with exact versions where declared — into the same dependency facts produced for other ecosystems. The recursive project-file scan is additive and scoped to .NET-family files: discovery for the pre-existing ecosystems SHALL NOT change.

#### Scenario: Classic solution layout is discovered

- **WHEN** a repository contains `src/Billing/Billing.csproj` with no .NET files at the root
- **THEN** the project is discovered, its packages become direct-dependency facts with file evidence, and the stack is not reported as absent

#### Scenario: packages.config exact versions flow into dependency facts

- **WHEN** `packages.config` declares `Newtonsoft.Json` version `9.0.1`
- **THEN** the dependency fact records version `9.0.1` with the file as evidence, and downstream drift/abandonment/license facts resolve it against the vendored package table

#### Scenario: NuGet lock file is parsed as NuGet

- **WHEN** `packages.lock.json` is present
- **THEN** its entries are parsed in the NuGet lock shape (direct vs transitive distinguished) and are never interpreted as an npm lock file

#### Scenario: Existing ecosystems are unaffected

- **WHEN** a repository contains no .NET-family files
- **THEN** manifest discovery produces only entries from the pre-existing ecosystem patterns — no new manifest entries, no changed dependency facts

### Requirement: Legacy Java measurement fidelity

The system SHALL resolve Maven dependency versions declared through `${property}` placeholders, in-repo parent POMs, and `dependencyManagement` sections, SHALL exclude `test`- and `provided`-scoped dependencies from the production dependency set, and SHALL disclose any version it cannot resolve as unresolvable rather than guessing it.

#### Scenario: Property placeholder resolves

- **WHEN** a pom declares a dependency version as `${spring.version}` and the properties section defines it
- **THEN** the dependency fact carries the resolved version with the pom as evidence

#### Scenario: In-repo parent supplies the version

- **WHEN** a child module omits `<version>` and the in-repo parent POM or `dependencyManagement` supplies it
- **THEN** the dependency fact carries the inherited version with both files as evidence

#### Scenario: Test-scoped dependency is not production

- **WHEN** a pom declares a dependency with `<scope>test</scope>`
- **THEN** it is excluded from the production dependency set used for drift, abandonment, license and vulnerability facts

#### Scenario: Unresolvable version is disclosed

- **WHEN** a placeholder or inherited version cannot be resolved from the scanned tree
- **THEN** the dependency is counted unresolvable and disclosed — it is never assigned a guessed version

### Requirement: Legacy stack census (VB6 and Delphi)

The system SHALL identify VB6 and Delphi projects as stacks from project and source-file evidence (`.vbp`/`.frm`/`.bas`/`.cls`/`.ctl` for VB6; `.dpr`/`.pas`/`.dfm`/`.dproj`/`.dof` for Delphi), recording the evidence paths. A stack census SHALL NOT be reported as a dependency manifest, and dependency indicators SHALL report not-applicable or unknown per their own applicability rules — never a zero-derived clean state.

#### Scenario: VB6 estate is recognized

- **WHEN** a repository contains `.vbp` and `.frm` files and no dependency manifest
- **THEN** the stack is identified with those files as evidence, and dependency indicators report not-applicable or unknown — not "0 issues"

#### Scenario: Delphi estate is recognized

- **WHEN** a repository contains `.dpr` and `.pas` files
- **THEN** the stack is identified with those files as evidence and is available to runtime-pin and plane evidence derivation

#### Scenario: Census is not a manifest

- **WHEN** a census-only stack is present and no package manager exists
- **THEN** dependency-manifest counts remain zero (the census is a separate signal) and per-indicator applicability fires per each indicator's own `na_when`

### Requirement: Legacy runtime pins resolved offline

The system SHALL extract runtime/toolchain pins for the new stacks — .NET target-framework declarations from project files (with `global.json` as a secondary source), VB6 project-file presence, Delphi project version, and the Java target level declared in `build.gradle` — and SHALL resolve them against the vendored end-of-life snapshot with no socket. Conflicts SHALL follow the existing conservative rule (lowest version wins, conflict flagged). An unmappable pin SHALL be `unknown` with a what-it-takes note and SHALL NOT be scored as supported.

#### Scenario: .NET Framework target past support is measured

- **WHEN** a project targets a .NET Framework version the vendored snapshot records as past support
- **THEN** the runtime-EOL row is measured from the snapshot with the project file as evidence and no socket opened

#### Scenario: VB6 pin is the project file

- **WHEN** a `.vbp` project file is present
- **THEN** the runtime fact records the VB6 toolchain cycle from the snapshot, with the project file as the pin source

#### Scenario: Unmappable Delphi version stays unknown

- **WHEN** a Delphi project file's version cannot be mapped to a release cycle in the vendored table
- **THEN** the pin is listed unmapped and the row is `unknown` with a what-it-takes note — never graded as in-support

#### Scenario: Conflicting pins resolve conservatively

- **WHEN** project files declare different target versions for the same runtime
- **THEN** the lowest version wins and the conflict flag is set, with both files as evidence

### Requirement: Plane, test, and source evidence for legacy stacks

The system SHALL derive plane evidence from .NET web/data signatures (`Microsoft.NET.Sdk.Web`, `System.Web`, `.asmx`/`.svc`/`.aspx`, EF/`.sqlproj`), Java servlet/JSP signatures, desktop UI signatures (WinForms/WPF/VB6 forms/Delphi VCL), and test evidence from case-tolerant `Tests`-style directories and MSTest/NUnit/xUnit/JUnit markers. It SHALL scan `.cs`/`.vb` source files for import evidence where reachability or coupling facts depend on it, and SHALL disclose scope-limited status when that read surface is bounded.

#### Scenario: .NET web and data planes get evidence

- **WHEN** a .NET project references `System.Web` and Entity Framework
- **THEN** `has_server` and `has_data` are true with those references as evidence pointers

#### Scenario: Desktop client sets the client plane

- **WHEN** a repository contains WinForms/WPF or VB6/Delphi-VCL form files
- **THEN** `has_client` is true with those files as evidence (FE rows remain unimplemented; no scoring is fabricated from this flag)

#### Scenario: Case-variant test directory is recognized

- **WHEN** a repository contains `Tests/` (capitalized) with NUnit/MSTest markers
- **THEN** the test plane is present and the test indicators classify those files rather than reporting the plane absent

#### Scenario: Bounded source read is disclosed

- **WHEN** the `.cs`/`.vb` import scan hits its read bound before the tree is exhausted
- **THEN** the dependent facts are labeled scope-limited/estimated rather than measured over a partial surface

#### Scenario: Dotted .NET test-project layout is classifiable

- **WHEN** a repository contains a `src/Orchard.Tests/`-style dotted test-project directory with `*Tests.cs`/`*Tests.vb` files carrying NUnit/MSTest markers
- **THEN** those files classify `unit` at high confidence (no e2e/integration marker takes precedence), so the TEST-03 classifiability bar is reachable on the layout rather than reporting every file unclassified

### Requirement: Honesty and determinism on new stacks

New-stack facts SHALL obey the measurement-honesty contract: every graded magnitude is derived from the target tree, git history, or the vendored snapshots; a dependency absent from snapshot coverage yields `unknown` with disclosure, never a permissive default; an estate too thin to clear the coverage floor renders the insufficient-signal outcome rather than a fabricated headline; and repeat scans of the same target SHALL produce identical score fingerprints.

#### Scenario: Uncovered NuGet package is unknown, not clean

- **WHEN** a declared package has no entry in the vendored package-metadata or advisory tables
- **THEN** the affected facts disclose the package as unscanned and the row degrades to `unknown`/scope-limited — never "no known issues"

#### Scenario: Thin VB6 estate stays honest

- **WHEN** a VB6 estate yields too few measured/estimated rows to clear the coverage floor
- **THEN** the report surfaces the insufficient-signal outcome with the unmeasured rows' what-it-takes notes, and a renormalized reference remains visible

#### Scenario: Repeat runs are identical

- **WHEN** the same new-stack fixture is scanned twice with the same release and datasets
- **THEN** the two runs produce identical scores and score fingerprints

#### Scenario: Read-budget truncation is a disclosed unknown, never a partial verdict

- **WHEN** the per-detector read budget ends before a dependency-manifest, test-file, or runtime-pin source surface is covered (the partitioned byte cap, not a detector-designed sample bound)
- **THEN** every affected row is `unknown` with the read coverage (n of m) and the measure path (a narrower sub-tree or a raised read budget) — the deterministic prefix is never graded, while detector-designed read bounds keep their own `scope-limited` rules

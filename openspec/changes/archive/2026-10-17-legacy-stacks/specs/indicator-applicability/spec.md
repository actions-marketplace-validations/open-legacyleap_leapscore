## MODIFIED Requirements

### Requirement: Plane inventory

The system SHALL compute a per-scan (and per-root) plane inventory by exhaustive tree enumeration, without execution: `has_server` (server framework dep in lockfile/manifest or `server.*` entrypoint; .NET web signatures `Microsoft.NET.Sdk.Web`, `System.Web`, `.asmx`/`.svc`/`.aspx`; Java servlet/JSP signatures), `has_data` (presence of `migrations/`, `schema.sql`, `prisma/schema.prisma`, Alembic, or DB driver in lockfile; Entity Framework/Hibernate declarations; `.sqlproj`), `has_deploy` (`Dockerfile`|`docker-compose`|`k8s/`|`*.tf`|`serverless.yml`|`Chart.yaml`), `has_client` (framework client `react`/`vue`/`svelte` or `src/components` density; desktop UI files: WinForms/WPF/VB6/Delphi-VCL form files), `has_test` (`__tests__`/`tests/` case-tolerant and `*.test.*`/`*.spec.*`, `*Tests` project files, or `jest`/`pytest`/JUnit/MSTest/NUnit/xUnit markers). Each flag SHALL carry evidence pointers and be exhaustively derived — absence means the scan enumerated the tree and found no match.

#### Scenario: No data plane proven exhaustive

- **WHEN** a repo has no `migrations/`, no `schema.sql`, no `prisma/`, and no DB driver in parsed lockfile
- **THEN** `has_data=false` with evidence `tree scan: 0 matches for {migrations/, schema.sql, prisma/, db-drivers}`

#### Scenario: Has data plane from lockfile driver

- **WHEN** `package-lock.json` contains `pg` or `prisma` in direct or transitive deps
- **THEN** `has_data=true` with evidence `lockfile: pg@8.11`

#### Scenario: .NET web and data signatures set planes with evidence

- **WHEN** a .NET project references `System.Web` and Entity Framework
- **THEN** `has_server=true` and `has_data=true` with those declarations as evidence pointers

#### Scenario: Desktop client sets the client plane

- **WHEN** a repository contains WinForms/WPF or VB6/Delphi-VCL form files
- **THEN** `has_client=true` with those files as evidence (FE rows remain unimplemented; no score is fabricated from the flag)

#### Scenario: Case-variant test directory is recognized

- **WHEN** a repository contains a capitalized `Tests/` directory with MSTest/NUnit/xUnit markers
- **THEN** `has_test=true` with those files as evidence rather than a false exhaustively-absent test plane

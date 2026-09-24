## ADDED Requirements

### Requirement: Surface input and surface step
The workflow SHALL accept a `surface` input (default `true`). When `true` and the scan sealed (exit `0` with an envelope file), a surface step SHALL sync the envelope into runner-repo issues per the `issue-surfacing` capability. When `false`, the workflow SHALL behave exactly as before (execution-only). The surface step SHALL run only when the envelope exists and the scan exit is `0`.

#### Scenario: Surface defaults on
- **WHEN** the workflow is dispatched without the `surface` input and the scan seals
- **THEN** issue sync runs and the summary carries surface counts

#### Scenario: Surface off preserves execution-only
- **WHEN** the workflow is dispatched with `surface: false`
- **THEN** no issue writes occur and the run is indistinguishable from the pre-change behavior

#### Scenario: Refused scan never surfaces
- **WHEN** the scan exits `2` (e.g. non-empty `sha`, private-without-token)
- **THEN** the surface step is skipped and no issue writes occur

### Requirement: Warn-only surfacing semantics
Issue/label write failures SHALL never rewrite a sealed scan verdict: the job exit follows the scan exit map, and surfacing shortfalls land in stdout, the step summary, and the trace while the artifact still uploads via `if: always()`. A `surface: false` run or a guardrail skip SHALL note the skip loudly and exit per the scan map.

#### Scenario: Failed writes keep exit zero
- **WHEN** a scan seals (exit `0`) but half the issue writes fail on rate limits
- **THEN** the job exits `0` and the summary records the shortfall counts

## MODIFIED Requirements

### Requirement: Auth passthrough and honest refusal
The system SHALL read `GH_TOKEN` (fallback `GITHUB_TOKEN`) for GH API quota and pass it to the engine; public targets SHALL scan and surface with zero extra secrets, and private targets without a capable token SHALL refuse loudly with `private_requires_app` (or the GH-derived `not_found` alias) rather than a partial score. The workflow SHALL declare minimal `permissions: contents: read` plus `issues: write` (labels + open/comment/reopen/close). No other permissions are granted.

#### Scenario: Public target with default token
- **WHEN** the workflow runs against a public repo with only `secrets.GITHUB_TOKEN`
- **THEN** the scan proceeds and seals a report

#### Scenario: Private target without capable token
- **WHEN** the target is private (or invisible) to the provided token
- **THEN** the CLI exits `2`, writes no report file, and the error names the private-token requirement

#### Scenario: Surface writes ride the default token
- **WHEN** surfacing runs with only `secrets.GITHUB_TOKEN`
- **THEN** all issue and label operations succeed with no extra secret

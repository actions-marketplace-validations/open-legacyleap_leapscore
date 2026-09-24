## Purpose

Run the LeapScore scan from a GitHub Actions workflow (self repo or public target), keep a machine-readable sealed envelope, and sync the sealed report into runner-repo issues (warn-only).

## Requirements

### Requirement: Workflow trigger and target selection
The system SHALL provide a `workflow_dispatch`-only scan with optional `target_repo` (`owner/repo`) and reserved `sha` inputs, where an empty `target_repo` scans the runner repo itself and a non-empty value scans that public target through the same code path. No `push`, `pull_request`, or `schedule` triggers exist in v1.

#### Scenario: Self scan defaults to runner repo
- **WHEN** the workflow is dispatched with empty `target_repo`
- **THEN** the scan subject is `github.repository` at default-branch HEAD

#### Scenario: Target scan uses explicit owner/repo
- **WHEN** the workflow is dispatched with `target_repo: "vercel/next.js"`
- **THEN** the scan subject is `vercel/next.js` at default-branch HEAD through the identical scan path

#### Scenario: Repo slug rejects URL forms
- **WHEN** `target_repo` is `https://github.com/vercel/next.js` or `vercel/next.js.git`
- **THEN** the CLI refuses with an unsupported-input error naming the expected `owner/repo` form

### Requirement: Thin CLI contract
The system SHALL expose `scan --repo <owner/repo> [--sha <sha>] --out <path>` which runs the unified scan and terminal scoring and writes the envelope file. The CLI SHALL construct the scan URL as `https://github.com/<owner/repo>` and SHALL NOT check out or accept a local path.

#### Scenario: Minimal invocation seals a file
- **WHEN** the CLI runs with `--repo vercel/next.js --out leapscore-report.json`
- **THEN** it writes a valid envelope file to that path and prints a single human line with score, tier, gates, and coverage

#### Scenario: Reserved sha fails loudly
- **WHEN** the CLI runs with any non-empty `--sha`
- **THEN** it exits `2` with a message stating sha pinning is not yet supported, and writes no report file

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

### Requirement: Exit-code map
A sealed report (`complete` or `degraded`, any score, gates fired or not) SHALL exit `0`; gate and score verdicts live inside the envelope (`headline.tier`, `gates[]`), never in the step conclusion. No report SHALL exit non-zero: `1` for crash (clone failure, API outage, unexpected exception), `2` for refused/unsupported-input (not-found, private-without-token, rate-limited, non-empty `--sha`).

#### Scenario: Fired gate still exits zero
- **WHEN** a scan seals with a fired gate and tier `High Risk`
- **THEN** the process exits `0` and the artifact contains the gate and tier

#### Scenario: Missing repo exits two
- **WHEN** the target does not exist
- **THEN** the process exits `2` with a `not-found` reason and no file is written

### Requirement: Artifact envelope file
The CLI SHALL write an envelope `{ report, meta, trace }` mirroring the website shape: `report.report_schema` is `"1"`, `meta` carries `runId`/`repo`/`repoSha`/`score`/`tier`/`status`/`budgetMs`/`durationMs`/`engineSha7`, `trace` is the ordered engine trace truncated with a sentinel when over 200 entries, and the artifact SHALL be uploaded with `if: always()` under a per-run name with 30-day retention. Stdout SHALL stay human (one line); the file SHALL stay machine.

#### Scenario: Artifact round-trips the website shape
- **WHEN** a scan seals for `vercel/next.js`
- **THEN** the file parses as `{ report, meta, trace }` with `report_snapshot.repo` normalized, `meta.repoSha` the clone HEAD or `"unknown"`, and `trace` ending in the seal entry

#### Scenario: Upload runs even on refusal
- **WHEN** the scan exits non-zero but a partial envelope was written
- **THEN** the workflow still uploads whatever file exists under the per-run artifact name

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

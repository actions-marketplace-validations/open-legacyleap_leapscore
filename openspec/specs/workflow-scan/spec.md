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
The system SHALL expose `scan <path> | --repo <owner/repo> [--sha <sha>] --out <dir> [--strict] [--fail-under <0-100> | --fail-under-band <critical|high|moderate|low>] [--format json,html,md]` which runs the scan and terminal scoring and writes a report directory. The CLI SHALL construct the scan URL as `https://github.com/<owner/repo>` for `--repo` mode and SHALL read the filesystem directly for `<path>` mode with no checkout or clone step. The numeric and band thresholds SHALL be mutually exclusive in a single invocation, and the band threshold SHALL resolve through the same public band vocabulary the report renders.

#### Scenario: Minimal invocation seals a file
- **WHEN** the CLI runs with `--repo vercel/next.js --out ./out`
- **THEN** it writes `./out/report.json`, `./out/report.html`, and `./out/report.md` and prints a single human line with score, tier, gates, and coverage

#### Scenario: Minimal local invocation seals a directory
- **WHEN** the CLI runs as `leapscore scan ./app --out ./out`
- **THEN** it writes all three report files from local detectors only and prints the same single human line plus the tracked assessment URL

#### Scenario: Band threshold is accepted in workflow mode
- **WHEN** the workflow CLI runs with a band threshold alongside `--repo <owner/repo>`
- **THEN** the run seals and the gate is evaluated against the public band threshold after seal, without a second threshold table

#### Scenario: Conflicting thresholds fail before work
- **WHEN** the CLI runs with both `--fail-under` and `--fail-under-band`
- **THEN** it exits `2` stating the flags conflict and writes no report file

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
A sealed report (`complete` or `degraded`, any score, gates fired or not) SHALL exit `0` unless `--fail-under <n>` trips, in which case it SHALL exit `3`. `--fail-under` SHALL compare against the frozen-denominator headline (the printed, banded number), with reference scores available in JSON for policy authors. Gate and score verdicts live inside the envelope (`headline.tier`, `gates[]`), never in the step conclusion except for the threshold trip. Other exits: `1` for crash (clone failure, API outage, unexpected exception, wall-clock killer-timeout trip with no headline written), `2` for refused/unsupported-input (not-found, private-without-token, rate-limited, non-empty `--sha`, `--strict` with `--repo`, bad `<path>`).

#### Scenario: Fired gate still exits zero
- **WHEN** a scan seals with a fired gate and tier `High`
- **THEN** the process exits `0` and the artifact contains the gate and tier

#### Scenario: Threshold trip exits three
- **WHEN** the CLI runs with `--fail-under 53` and the frozen headline seals at score 41
- **THEN** the process exits `3`, all three report files are still written, and stdout names the threshold and the gated score

#### Scenario: Missing repo exits two
- **WHEN** the target does not exist
- **THEN** the process exits `2` with a `not-found` reason and no file is written

#### Scenario: Killer timeout exits one with no headline
- **WHEN** the wall-clock killer fires before deterministic work completes
- **THEN** the process exits `1` with a `budget-exceeded` run-failure reason, writes no headline, and CI treats the step as failed rather than threshold-tripped

### Requirement: Artifact envelope file
The CLI SHALL write a report directory `--out <dir>` containing `report.json` as the envelope `{ report, meta, trace }` mirroring the website shape plus `report.html` and `report.md` sharing its score, `runId`, and `score_fingerprint`: `report.report_schema` is `"1"`, `meta` carries `runId`/`repo`/`repoSha`/`score`/`tier`/`tier_legacy`/`status`/`budgetMs`/`durationMs`/`engineSha7`/`score_fingerprint`/`fingerprint_version`, `trace` is the ordered engine trace truncated with a sentinel when over 200 entries, and the artifact SHALL be uploaded with `if: always()` under a per-run name with 30-day retention. Stdout SHALL stay human (one line plus the assessment link printed once); the files SHALL stay machine and human respectively.

#### Scenario: Artifact round-trips the website shape
- **WHEN** a scan seals for `vercel/next.js`
- **THEN** `report.json` parses as `{ report, meta, trace }` with `report_snapshot.repo` normalized, `meta.repoSha` the clone HEAD or `"unknown"`, `meta.score_fingerprint` present, and `trace` ending in the seal entry

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

### Requirement: Strict flag conflict
The system SHALL reject `--strict` combined with `--repo` as a usage error before any scan work starts.

#### Scenario: Conflicting flags fail fast
- **WHEN** the CLI receives both `--strict` and `--repo owner/repo`
- **THEN** it exits `2` naming the conflict and performs no GH, clone, or filesystem scan work

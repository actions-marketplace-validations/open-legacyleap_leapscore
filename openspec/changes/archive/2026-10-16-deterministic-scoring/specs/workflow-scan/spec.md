## MODIFIED Requirements

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

## MODIFIED Requirements

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

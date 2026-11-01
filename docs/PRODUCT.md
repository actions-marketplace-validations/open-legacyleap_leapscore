# LeapScore product overview

LeapScore examines a codebase for maintainability and modernization risks. It reports evidence-backed indicator findings, a score when the scan has sufficient signal, and a prioritized path toward the next score band. The public rubric provides the shared vocabulary for the scanner, report readers, and contributors.

This page is explanatory, not a behavior contract. Current behavior is specified in [OpenSpec](../openspec/specs/); rubric meanings and scoring rules are canonical in [`docs/rubric/`](./rubric/), and detection contracts are canonical in [`docs/specs/`](./specs/).

## What it does

- Scans a local directory through the CLI, or a public GitHub repository through the scanner service and CLI.
- Reads repository files and metadata; it does not execute the target repository's code.
- Reports measured, estimated, unknown, not-applicable, and not-implemented rows with evidence or an explanation of what measurement would require.
- Produces JSON, HTML, and Markdown report files from the CLI. The HTTP scanner streams progress and one sealed terminal report (or a refusal); the scanner does not retain reports or provide report permalinks.
- Offers a GitHub Action for workflow-driven scans and optional issue surfacing. Issue writes are handled by the separate surface app, not by the scanner process.

The current scanner implements 31 of the rubric's 102 indicators: six GitHub API detectors and 25 local/clone-capable detectors. Other indicators remain explicitly `not_implemented`; the rubric remains broader than current automated coverage.

## Where to use it

| Surface | Role |
|---|---|
| Scanner service | Accepts public GitHub targets and streams a versioned NDJSON scan, including progress, trace, and the terminal report. |
| CLI | Scans a local directory or public GitHub target and writes a report directory. `--strict` provides an explicit no-network mode for local scans. |
| GitHub Action | Runs the CLI in a workflow and can optionally surface sealed findings as issues. |
| Website | Presents the rubric, methodology, sample report, and live scan experience. `/live` streams from the scanner; `/reports` presents site-owned static history. The site does not run the scanner. |

The scanner is stateless: the terminal report frame is the scan artifact. If a caller does not retain that artifact, it cannot be fetched from the scanner later. The website's current report history is separate, site-owned content; it is not a store of live scanner runs.

## Reading a score

Each indicator's canonical criteria assign a score from 0 to 3 where implemented and applicable. The public bands are **Low** (80–100), **Moderate** (53–79), **High** (27–52), and **Critical** (below 27). A proven kill-switch gate can cap the band at High; the cap is a ceiling, so a score already in Critical remains Critical.

The sealed headline uses the frozen denominator. Unknown applicable rows remain disclosed as unscored in that denominator; `not_applicable` and `not_implemented` rows are excluded. A renormalized score is available as a reference, not as the default headline. If fewer than half of attempted rows are gradeable (measured or estimated), the numeric headline is suppressed as `insufficient-signal`.

Use the [rubric guide](./rubric/README.md) and its canonical configuration for formulas, weights, thresholds, gates, and indicator criteria. This overview does not redefine them.

## Limits and sample material

Automated coverage is partial, and some signals require runtime access, organization data, or tools that the scanner does not run. Those rows are disclosed rather than presented as measured findings. A [sample report](./sample-report/README.md) is illustrative; it is not evidence that every indicator is currently detected or that its values describe a new scan.

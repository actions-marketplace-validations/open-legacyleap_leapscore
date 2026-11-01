# LeapScore

LeapScore scans a codebase locally and reports structural legacy and maintainability risks against a public rubric.

> LeapScore sees the structure. The assessment understands what the code does.

## Privacy by default

A local path scan reads the target on your machine and makes no network requests. It sends no code, paths, or repository names, and sends no telemetry automatically. `--repo owner/repo` is a separate, explicit remote scan: it contacts GitHub's API and shallow-clones the public repository. A report's tracked assessment URL is plain text until clicked; the scan does not contact the assessment host. Only a user click opens that URL and carries its associated click tracking.

## Run a scan

Prerequisites: Node.js 20 or newer and a checkout of this repository. From the repository root, install dependencies (which prepares the CLI bundle), then run:

```bash
npm install
node apps/scanner/dist/leapscore-scan.mjs scan . --out report/ --strict
```

The local scan reads `.` and writes `report.json`, `report.html`, and `report.md` to `report/`. `--strict` makes any attempted network access fail.

## Sample report

Illustrative sample only: this report was produced by scanning the checked-in synthetic fixture, not a customer's repository.

![Illustrative LeapScore report generated from a checked-in synthetic local fixture](docs/sample-report.png)

Maintainers can reproduce the report and refresh this screenshot offline using [`docs/sample-report/README.md`](docs/sample-report/README.md).

## Methodology

Read the [scoring methodology](https://leapscore.dev/method) and browse the [canonical rubric](docs/rubric/README.md), which defines the indicators and thresholds behind the report.

## Next step

LeapScore assesses structural risk; it does not determine functional behavior, extract business rules, or prescribe a modernization plan. For a result-specific interpretation, use the MCM-backed **$0 Assessment** link printed in your report. Its tracked URL follows `https://leapscore.dev/assessment?utm_campaign=cli-scan-v1&band=<report-band>` and remains inert until clicked.

Maintainer architecture, implementation status, development, and repository-boundary guidance lives in [`AGENTS.md`](AGENTS.md).
